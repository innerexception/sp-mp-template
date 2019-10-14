import { Scene, Cameras, GameObjects, Physics, Time, } from "phaser";
import { StarSystems } from "../../../../server/src/data/StarSystems";
import Projectile from "./Projectile";
import ShipSprite from "./PlayerSprite";
import * as Ships from '../../../../server/src/data/Ships'
import WebsocketClient from "../../../WebsocketClient";
import { store } from "../../../App";
import { onToggleMapMenu, onConnectionError, onConnected, onTogglePlanetMenu } from "../../uiManager/Thunks";
import { PlayerEvents, ReducerActions, ServerMessages, MissionType } from "../../../../enum";
import Planet from "./Planet";
import Beam from "./Beam";

export default class StarSystem extends Scene {

    minimap: Cameras.Scene2D.BaseCamera
    player: Player
    activeShip: ShipSprite
    ships: Map<string,ShipSprite>
    planets: Array<Planet>
    asteroids: Map<string, Physics.Arcade.Sprite>
    explosions: GameObjects.Group
    warps: GameObjects.Group
    resources: Map<string, Physics.Arcade.Sprite>
    projectiles: Physics.Arcade.Group
    beams: Physics.Arcade.Group
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    selectedSystem: SystemState
    selectedPlanetIndex: number
    name: string
    jumpedIn: boolean
    state:SystemState
    server: WebsocketClient
    unsubscribeRedux: Function
    loginName: string
    loginPassword: string
    firingEvent: Time.TimerEvent
    targetRect: GameObjects.Image
    priorityTargets: Array<string>

    constructor(config, jumpedIn?:boolean){
        super(config)
        this.jumpedIn = jumpedIn
        this.state = config.initialState
        this.name = config.key
        this.server = config.server
        this.ships = new Map()
        this.asteroids = new Map()
        this.planets = []
        this.resources = new Map()
        this.selectedPlanetIndex = 0
        this.unsubscribeRedux = store.subscribe(this.onReduxUpdate)
        this.loginName = config.loginName
        this.loginPassword = config.loginPassword
        this.player = config.player
        this.priorityTargets = []
        let dMissions = this.player.missions.filter(mission=>mission.type === MissionType.DESTROY)
        dMissions.forEach(mission=>mission.targetIds.forEach(target=>this.priorityTargets.push(target)))
    }

    onReduxUpdate = () => {
        if(this.activeShip) {
            this.activeShip.shipData = this.player.ships.find(ship=>ship.id === this.player.activeShipId)
            let playerEvent = store.getState().playerEvent
            if(playerEvent)
                switch(playerEvent){
                    case PlayerEvents.SELECT_SYSTEM:
                        let name = store.getState().systemName
                        this.selectedSystem = StarSystems.find(system=>system.name===name)
                        break
                    case PlayerEvents.SHIP_PURCHASE:
                        //TODO
                        break
                    case PlayerEvents.OUTFIT_ORDER:
                        //TODO
                        break
                    case PlayerEvents.COMMODITY_ORDER:
                        this.activeShip.shipData.transientData.commodityOrder = store.getState().commodityOrder
                        this.activeShip.addShipUpdate(this.activeShip, playerEvent)
                        break
                    case PlayerEvents.ACCEPT_MISSION:
                    case PlayerEvents.COMPLETE_MISSION:
                    case PlayerEvents.ABANDON_MISSION:
                        this.activeShip.shipData.transientData.mission = store.getState().mission
                        this.activeShip.addShipUpdate(this.activeShip, playerEvent)
                        break
                    default:
                        this.activeShip.addShipUpdate(this.activeShip, playerEvent)
                }
        }
    }

    onConnected = () => {
        onConnected()
        console.log('star system '+this.name+' connected!')
    }

    onConnectionError = () => {
        onConnectionError()
        console.log('star system '+this.name+' FAILED to connect.')
    }

    onServerUpdate = (payload:ServerMessage) => {
        if(payload.system === this.name){
            const state = payload.event as ServerSystemUpdate
            let initRoids = this.asteroids.size === 0
            state.asteroids.forEach(update=> {
                let asteroid = this.asteroids.get(update.id)
                if(asteroid){
                    if(update.dead){
                        this.destroyAsteroid(asteroid)
                    }
                    else {
                        this.tweens.add({
                            targets: asteroid,
                            x: update.x,
                            y: update.y,
                            duration: 100
                        })
                        asteroid.getData('state').hp = update.hp
                    }
                }
                else {
                    this.spawnAsteroid(update)
                }
            })
            if(initRoids){
                let roids = []
                this.asteroids.forEach(aster=>roids.push(aster))
                this.physics.add.overlap(this.projectiles, roids, this.playerShotAsteroid)
                this.physics.add.overlap(this.beams, roids, this.playerShotAsteroid)
                console.log('asteroid physics init completed.')
            }
            
            //Super duper inefficient but there's never more than 3 planets
            state.planets.forEach(planetConfig=>{
                let found = false
                this.planets.forEach(planet=>{
                    if(planet.config.planetName === planetConfig.planetName){
                        planet.config = planetConfig
                        found=true
                        if(this.activeShip && this.activeShip.shipData.landedAtName === planetConfig.planetName)
                            this.onReplacePlanet(planetConfig)
                    }
                })
                if(!found){
                    this.spawnPlanet(planetConfig)
                }
            })

            state.ships.forEach(update=> {
                let ship = this.ships.get(update.shipData.id)
                if(ship){
                    if(update.shipData.systemName !== this.name){
                        //We jumped somewhere else, change the scene over
                        const system = StarSystems.find(system=>system.name === update.shipData.systemName)
                        if(ship.isPlayerControlled){
                            this.scene.add(system.name, new StarSystem({key:system.name, server:this.server, initialState: system, player:this.player}, true), false)
                            this.scene.start(system.name)
                            this.unsubscribeRedux()
                            this.scene.remove()
                        }
                        else {
                            this.warps.get(ship.x, ship.y, 'warp').setAlpha(0.8).play('warp')
                            this.destroyShip(ship, false)
                        }
                    }
                    if(update.shipData.hull <= 0){
                        this.destroyShip(ship, true)
                    }
                    else {
                        ship.body && ship.applyUpdate(update)
                    }
                }
                else {
                    console.log('spawning new ship: '+update.shipData.id)
                    this.spawnShip(update.shipData)
                }
            })

            state.resources.forEach(update => {
                let resource = this.resources.get(update.id)
                if(resource){
                    if(update.dead){
                        this.destroyResource(resource)
                    }
                    this.tweens.add({
                        targets: resource,
                        x: update.x,
                        y: update.y,
                        duration: 100
                    })
                }
                else {
                    console.log('spawned resource at '+update.x+','+update.y)
                    this.spawnResource(update)
                }
            })
        }
    }
    
    preload = () =>
    {
        this.state.assetList.forEach(asset=>{
            (this.load[asset.type] as any)(asset.key, asset.resource, asset.data)
        })
        console.log('star system '+this.name+' was booted.')
    }
    
    create = () =>
    {
        this.cameras.main.setBounds(0, 0, 3200, 3200).setName('main');
        this.physics.world.setBounds(0,0,3200,3200)
        this.physics.world.setBoundsCollision();
        this.minimap = this.cameras.add(0, 0, 100, 100).setZoom(0.1).setName('mini');
        this.minimap.setBackgroundColor(0x002244);
        this.minimap.scrollX = 1600;
        this.minimap.scrollY = 400;

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23, first: 23 }),
            frameRate: 20
        });

        this.explosions = this.add.group()

        this.anims.create({
            key: 'warp',
            frames: this.anims.generateFrameNumbers('warp', { start: 0, end: 11, first: 0 }),
            frameRate: 10
        });

        this.warps = this.add.group()


        this.projectiles = this.physics.add.group({ classType: Projectile  })
        this.projectiles.runChildUpdate = true
        this.beams = this.physics.add.group({ classType: Beam  })
        this.beams.runChildUpdate = true

        this.targetRect = this.add.sprite(-1, -1, 'target')
        this.targetRect.depth = 5

        this.createStarfield()

        this.input.keyboard.on('keydown-L', (event) => {
            this.selectedPlanetIndex = (this.selectedPlanetIndex + 1) % this.planets.length
            this.activeShip.startLandingSequence(this.planets[this.selectedPlanetIndex])
        });
        this.input.keyboard.on('keydown-J', (event) => {
            if(this.selectedSystem && this.activeShip.shipData.fuel > 0 && !this.activeShip.isJumping){
                this.activeShip.startJumpSequence(this.selectedSystem)
                this.cameras.main.shake(3000, 0.001)
                this.tweens.add({
                    targets: this.activeShip,
                    scaleY: 0.38,
                    duration: 2000,
                    onComplete: ()=>{
                        this.warps.get(this.activeShip.x, this.activeShip.y, 'warp').setDepth(6).setAlpha(0.8).play('warp')
                        this.activeShip.setVisible(false)
                    }
                })
            } 
            else console.log('no system selected...')
        })
        this.input.keyboard.on('keydown-SPACE', (event) => {
            let weapon = this.activeShip.shipData.weapons[this.activeShip.shipData.selectedWeaponIndex]
            if(weapon.isBeam){
                // this.activeShip.firePrimary() TODO beamz
            }
            else this.activeShip.startFiring()
        })
        this.input.keyboard.on('keyup-SPACE', (event) => {
            this.activeShip.stopFiring()
        })
        this.input.keyboard.on('keydown-M', (event) => {
            onToggleMapMenu(true, this.activeShip.shipData)
        })
        this.input.keyboard.on('keydown-W', (event) => {
            this.activeShip.selectPrimary()
        })
        this.input.keyboard.on('keydown-T', (event) => {
            this.activeShip.selectNextTarget()
        })
        this.input.keyboard.on('keydown-R', (event) => {
            this.activeShip.selectNextHostileTarget()
        })
        this.cursors = this.input.keyboard.createCursorKeys();

        //we need to wait until the server gives us a ship to focus on
        this.time.addEvent({ delay: 100, callback: this.checkForActiveShip, loop: true });
        
        this.server.setListeners(this.onWSMessage, this.onConnected, this.onConnectionError)
    }
    
    onWSMessage = (data:any) => {
        const payload = JSON.parse(data.data) as ServerMessage
        switch(payload.type){
            case ServerMessages.SERVER_UPDATE: 
                this.onServerUpdate(payload)
                break
            case ServerMessages.PLAYER_DATA_UPDATED:
                this.onReplacePlayer(payload)
                break
        }
    }

    onReplacePlayer = (payload:ServerMessage) => {
        this.player = (payload.event as Player)
        this.priorityTargets = []
        let dMissions = this.player.missions.filter(mission=>mission.type === MissionType.DESTROY)
        dMissions.forEach(mission=>mission.targetIds.forEach(target=>this.priorityTargets.push(target)))

        let activeShipData = this.player.ships.find(shipData=>shipData.id===this.player.activeShipId)
        this.activeShip.shipData = activeShipData
        store.dispatch({ type: ReducerActions.PLAYER_REPLACE, player: this.player, activeShip: this.activeShip.shipData})
    }

    onReplacePlanet = (planet:StellarObjectConfig) => {
        store.dispatch({ type: ReducerActions.PLANET_REPLACE, planet })
    }

    checkForActiveShip = () => {
        let activeShipData = this.player.ships.find(shipData=>shipData.id===this.player.activeShipId)
        this.activeShip = this.ships.get(activeShipData.id)
        if(this.activeShip){
            //means the server already spawned it for us
            this.activeShip.shipData.systemName = this.name
            this.activeShip.isPlayerControlled = true
            if(this.jumpedIn){
                console.log('jumped in...')
                this.cameras.main.flash(500)
            }
            else{
                this.activeShip.takeOff()
                // //run take-off tween
            }
        }
        else {
            //We should spawn it
            //This is our starting sector so we spawn ourselves
            let activeShipData = this.player.ships.find(shipData=>shipData.id===this.player.activeShipId)
            this.activeShip = new ShipSprite(this.scene.scene, this.planets[0].x, this.planets[0].y, activeShipData.asset, this.projectiles, this.beams, true, activeShipData, this.server, this.onTogglePlanetMenu);
            this.ships.set(this.activeShip.shipData.id, this.activeShip)
            activeShipData.systemName = this.name
            //Add player ship notification
            this.activeShip.sendSpawnUpdate()
            this.activeShip.takeOff()
            //run take-off tween
        }
        this.time.removeAllEvents()
        this.cameras.main.startFollow(this.activeShip)
    }

    onTogglePlanetMenu = (state:boolean, ship:ShipData) => {
        onTogglePlanetMenu(state, ship, this.player, ship.landedAtName ? this.planets.find(planet=>ship.landedAtName === planet.config.planetName).config : null)
    }

    update = () =>
    {
        if(this.activeShip){
            if (this.cursors.left.isDown)
            {
                this.activeShip.rotateLeft()
            }
            else if (this.cursors.right.isDown)
            {
                this.activeShip.rotateRight()
            }
            if (this.cursors.up.isDown)
            {
                this.activeShip.thrust()
            }
            else if((this.activeShip.body as any).acceleration.x !== 0 || (this.activeShip.body as any).acceleration.y !== 0) {
                this.activeShip.thrustOff()
            }
            //  Position the center of the camera on the player
            //  we want the center of the camera on the player, not the left-hand side of it
            this.minimap.scrollX = this.activeShip.x;
            this.minimap.scrollY = this.activeShip.y;

            //Paint target with a rectangle
            let target = this.ships.get(this.activeShip.shipData.currentTargetId)
            if(target){
                this.targetRect.x = target.x
                this.targetRect.y = target.y
                if(this.priorityTargets.find(pTarget=>pTarget===target.shipData.id)) this.targetRect.setTintFill(0xff0000)
                else this.targetRect.setTintFill(0x00ff00)
                this.targetRect.setVisible(true)
            }
            else {
                this.targetRect.setVisible(false)
            }
        }
    }
    
    spawnShip = (config:ShipData) => {
        let shipData = {...Ships[config.name], ...config}
        shipData.systemName = this.name
        let ship = new ShipSprite(this.scene.scene, config.x, config.y, shipData.asset, this.projectiles, this.beams, false, shipData, this.server, this.onTogglePlanetMenu)
        ship.rotation = config.rotation
        this.ships.set(shipData.id, ship)
        this.physics.add.overlap(this.projectiles, ship, this.projectileHitShip);
        this.warps.get(ship.x, ship.y, 'warp').setAlpha(0.8).play('warp')
    }

    spawnResource = (update:ResourceData) => {
        let rez = this.physics.add.sprite(update.x,update.y, update.type)
                .setData('state', {
                    id: update.id,
                    weight: 1,
                    type: update.type
                } as ResourceData)
                .setScale(0.1)
                .setRotation(Phaser.Math.FloatBetween(3,0.1))
        this.resources.set(update.id, rez)
        let ships = []
        this.ships.forEach(ship=>ships.push(ship))
        this.physics.add.overlap(ships, rez, this.playerGotResource)
    }

    spawnPlanet = (planet:StellarObjectConfig) => {
        this.planets.push(new Planet(this.scene.scene, planet.x, planet.y, planet.asset, planet))
    }

    createStarfield ()
    {
        //  Starfield background
        //  Note the scrollFactor values which give them their 'parallax' effect
        var group = this.add.group();
    
        group.createMultiple([
            { key: 'bigStar', frameQuantity: 64, setScale: {x: 0.02, y:0.02} }, 
            { key: 'star', frameQuantity: 256, setScale: {x: 0.02, y:0.02} }
        ]);
    
        var rect = new Phaser.Geom.Rectangle(0, 0, 3200, 3200);
    
        Phaser.Actions.RandomRectangle(group.getChildren(), rect);
    
        group.children.iterate((child, index) => {
            var sf = Math.max(0.3, Math.random());
            (child as GameObjects.Sprite).setScrollFactor(sf)
            this.minimap.ignore(child);
        }, this);
    }

    spawnAsteroid = (update:AsteroidData) => {
        let state = {
            type: update.type,
            hp: 3,
            id: update.id
        } as AsteroidData

        let rez = this.physics.add.sprite(update.x,update.y, update.type)
                .setData('state', state)
                .setScale(Phaser.Math.FloatBetween(0.8,0.1))
                .setRotation(Phaser.Math.FloatBetween(3,0.1))
        this.asteroids.set(update.id, rez)
    }

    playerGotResource = (player:ShipSprite, resource:Physics.Arcade.Sprite) =>
    {
        console.log('destroyed resource')
        //you'll get ur cargo if the server agrees
    }

    playerShotAsteroid = (asteroid:Physics.Arcade.Sprite, projectile:Projectile) =>
    {
        this.explosions.get(asteroid.x, asteroid.y, 'boom').setScale(0.1).play('explode')
        projectile.trackingEvent && projectile.trackingEvent.remove()
        projectile.destroy()
    }

    destroyAsteroid = (asteroid:Physics.Arcade.Sprite) => {
        this.explosions.get(asteroid.x, asteroid.y, 'boom').play('explode')
        // this.asteroids.delete(asteroid.getData('state').id)
        this.asteroids.delete(asteroid.getData('state').id)
        asteroid.destroy()
    }

    projectileHitShip = (target:ShipSprite, projectile:Projectile) => {
        //TODO: this doesn't match the server very often, need to have projectile updates probably
        if(target.shipData.shields > 0){
            const shield = this.add.image(target.x, target.y, 'shield').setAlpha(0).setScale(0.2)
            this.tweens.add({
                targets: shield,
                rotation: 2,
                alpha: target.shipData.shields/target.shipData.maxShields,
                duration: 250,
                onComplete: ()=> {
                    shield.destroy()
                },
                onUpdate: () => {
                    shield.x = target.x
                    shield.y = target.y
                }
            })
        }
        else{
            this.explosions.get(projectile.x, projectile.y, 'boom').setScale(0.2).play('explode')
        }
        projectile.trackingEvent && projectile.trackingEvent.remove()
        projectile.destroy()
    }

    destroyShip = (ship:ShipSprite, explode:boolean) => {
        if(explode){
            this.explosions.get(ship.x, ship.y, 'boom').play('explode')
            console.log('destryed ship with id: '+ship.shipData.id)
        } 
        else{
            console.log('ship left the system:'+ship.shipData.id)
        }
        this.ships.delete(ship.shipData.id)
        
        if(this.activeShip.shipData.id === ship.shipData.id){
            delete this.activeShip
            store.dispatch({ type: ReducerActions.PLAYER_SHIP_LOST })
        }
        if(ship.shipData.id === this.activeShip.shipData.currentTargetId){
            delete this.activeShip.shipData.currentTargetId
            store.dispatch({ type: ReducerActions.PLAYER_REPLACE_TARGET, targetShip: null})
        }
        ship.destroy()
    }

    destroyResource = (resource:Physics.Arcade.Sprite) => {
        this.resources.delete(resource.getData('state').id)
        resource.destroy()
    }
}