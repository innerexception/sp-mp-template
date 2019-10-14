import { Scene, GameObjects, Physics, } from "phaser";
import Projectile from './display/Projectile'
import ServerShipSprite from './display/ServerPlayerSprite'
import * as Ships from './data/Ships'
import { v4 } from 'uuid'
import { PlayerEvents, Metals, CargoType } from "../../enum";
import { StarSystems } from "./data/StarSystems";
import Planet from "./display/Planet";
import { getCargoWeight, getNPCShipData } from "../../client/components/util/Util";
import { Weapons } from './data/Weapons'

export default class ServerStarSystem extends Scene {

    ships: Map<string,ServerShipSprite>
    jumpingShips: Array<ServerShipSprite>
    deadShips: Array<ServerShipSprite>
    planets: Array<Planet>
    asteroids: Map<string, Physics.Arcade.Sprite>
    deadAsteroids: Array<DeadEntityUpdate>
    resources: Map<string, Physics.Arcade.Sprite>
    deadResources: Array<DeadEntityUpdate>
    projectiles: Physics.Arcade.Group
    name: string
    state:SystemState

    constructor(config, state:SystemState){
        super(config)
        this.state = state
        this.name = config.key
        this.planets = []
        this.asteroids = new Map()
        this.deadAsteroids = []
        this.ships = new Map()
        this.jumpingShips = []
        this.resources = new Map()
        this.deadResources = []
        this.deadShips = []
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

        this.projectiles = this.physics.add.group({ classType: Projectile  })
        this.projectiles.runChildUpdate = true
        
        this.addAsteroids()
        this.addPlanets()
        
        this.initNPCTraffic()
    }
    
    update = (time, delta) =>
    {
        
    }

    onApplyPlayerUpdate = (update:ShipUpdate) => {
        //perform change on entity
        let ship = this.ships.get(update.shipData.id)
        if(ship && ship.shipData.hull > 5){
            switch(update.type){
                case PlayerEvents.FIRE_PRIMARY: 
                    ship.firePrimary()
                    break
                case PlayerEvents.ROTATE_L: 
                    ship.rotateLeft()
                    break
                case PlayerEvents.ROTATE_R: 
                    ship.rotateRight()
                    break
                case PlayerEvents.THRUST: 
                    ship.thrust()
                    break
                case PlayerEvents.THRUST_OFF: 
                    ship.thrustOff()
                    break
                case PlayerEvents.START_LANDING:
                    const target = this.planets.find(planet=>planet.config.planetName === update.shipData.transientData.landingTargetName)
                    ship.startLandingSequence(target)
                    break
                case PlayerEvents.STOP_LANDING:
                    ship.stopLandingSequence()
                    break
                case PlayerEvents.START_JUMP:
                    const system = StarSystems.find(system=>system.name===update.shipData.systemName)
                    ship.startJumpSequence(system)
                    break
                case PlayerEvents.TAKE_OFF:
                    ship.takeOff()
                    break
                case PlayerEvents.SELECT_PRIMARY:
                    ship.selectPrimary()
                    break
                case PlayerEvents.SELECT_TARGET:
                    ship.selectNextTarget()
                    break
                case PlayerEvents.COMMODITY_ORDER:
                    ship.processOrder(update.shipData.transientData.commodityOrder)
                    break
                case PlayerEvents.ACCEPT_MISSION: 
                    ship.acceptMission(update.shipData.transientData.mission)
                    break
                case PlayerEvents.COMPLETE_MISSION: 
                    ship.completeMission(update.shipData.transientData.mission)
                    break
                case PlayerEvents.ABANDON_MISSION: 
                    ship.abandonMission(update.shipData.transientData.mission)
                    break
            }
        }
        else if(update.type === PlayerEvents.PLAYER_SPAWNED){
            console.log('ship spawned at '+update.shipData.x+','+update.shipData.y+ ' with id: '+update.shipData.id)
            this.spawnShip(update.shipData, {x: update.shipData.x, y: update.shipData.y, rotation: update.shipData.rotation })
        }
    }

    addPlanets = () => {
        let planets = []
        this.state.stellarObjects.forEach(obj=>{
            planets.push(new Planet((this.scene.scene as ServerStarSystem), obj.x, obj.y, obj.asset, obj))
        })
        this.planets = planets
    }

    addAsteroids()
    {
        let asteroids = new Map()
        let roidRay = []
        this.state.asteroidConfig.forEach(aConfig=> {
            for(var i=0; i< aConfig.density*20; i++){
                let id = v4()
                asteroids.set(id, this.spawnAsteroid(id, aConfig.type))
            }
            
            let arr = []
            asteroids.forEach(roid=>arr.push(roid))

            if(aConfig.isBelt){
                Phaser.Actions.RandomEllipse(arr, new Phaser.Geom.Ellipse(1600, 1600, 1000, 1000));
                asteroids.forEach((sprite:Physics.Arcade.Sprite)=>{
                    let d=Phaser.Math.Between(700,1000)
                    let r=Phaser.Math.FloatBetween(-0.01,0.1)
                    this.time.addEvent({
                        delay: 25, 
                        callback: ()=>{
                            sprite.rotation+=r
                            Phaser.Actions.RotateAroundDistance([sprite], { x: 1600, y: 1600 }, 0.001, d)
                        },
                        loop: true 
                    });
                    roidRay.push(sprite)
                })
            }
            else{
                Phaser.Actions.RandomRectangle(arr, new Phaser.Geom.Rectangle(0, 0, 3200, 3200));
                asteroids.forEach((sprite:Physics.Arcade.Sprite)=>{
                    let r=Phaser.Math.FloatBetween(-0.01,0.1)
                    this.time.addEvent({
                        delay: 25, 
                        callback: ()=>{
                            sprite.rotation+=r
                        },
                        loop: true 
                    });
                    roidRay.push(sprite)
                })
            }
                    
                          
        })
        
        let temp = []
        asteroids.forEach(roid=>temp.push(roid))
        this.physics.add.overlap(this.projectiles, temp, this.playerShotAsteroid);
        this.asteroids = asteroids
    }

    spawnAsteroid = (id:string, type:string) => {
        //Position will be set shortly
        let state = {
            type,
            hp: 3,
            id
        } as AsteroidData
        return this.physics.add.sprite(0,0,type)
            .setData('state', state)
            .setScale(Phaser.Math.FloatBetween(0.8,0.1))
            .setRotation(Phaser.Math.FloatBetween(3,0.1))
    }

    spawnShip = (config:ShipData, spawnPoint:PlayerSpawnPoint) => {
        let shipData = {...Ships[config.name], ...config} as ShipData
        let sprite = new ServerShipSprite(this.scene.scene, spawnPoint.x, spawnPoint.y, shipData.asset, this.projectiles, shipData)
        sprite.rotation = spawnPoint.rotation
        if(spawnPoint.xVelocity){
            //TODO: set starting edge coords based on previous system coords, right now defaults to top left corner
            sprite.setVelocity(spawnPoint.xVelocity, -spawnPoint.yVelocity)
        }
        this.ships.set(shipData.id, sprite)
        sprite.setCollideWorldBounds(true)
        let rez = []
        this.resources.forEach(res=>rez.push(res))
        this.physics.add.overlap(rez, sprite, this.playerGotResource);
        this.physics.add.overlap(this.projectiles, sprite, this.shipHitShip);
        return sprite
    }

    shipHitShip = (target:ServerShipSprite, projectile:Projectile) => {
        projectile.trackingEvent && projectile.trackingEvent.remove()
        projectile.destroy()
        let launcher = projectile.weapon
        if(target.shipData.shields > 0)
            target.shipData.shields -= launcher.shieldDamage
        else if(target.shipData.armor > 0)
            target.shipData.armor -= launcher.armorDamage
        else 
            target.shipData.hull -= launcher.armorDamage

        if(target.shipData.aiProfile){
            target.shipData.aiProfile.attackerId = projectile.weapon.shipId
        }
        if(target.shipData.hull <= 0) {
            let shooter = this.ships.get(projectile.weapon.shipId)
            if(shooter) shooter.shipData.killedIds.push(target.shipData.id)
            this.destroyShip(target)
        }
    }

    destroyShip = (ship:ServerShipSprite) => {
        this.deadShips.push(ship)
        this.ships.delete(ship.shipData.id)
        ship.aiEvent && ship.aiEvent.remove()
        console.log('destryed ship with id: '+ship.shipData.id)
        ship.destroy()
    }

    playerGotResource = (resource:Physics.Arcade.Sprite, ship:ServerShipSprite) =>
    {
        let resourceData = resource.getData('state') as ResourceData
        if(ship.shipData.maxCargoSpace - getCargoWeight(ship.shipData) >= resourceData.weight){
            let existing = ship.shipData.cargo.find(item=>item.name === resourceData.type)
            if(existing){
                existing.weight += resourceData.weight
            }
            else {
                ship.shipData.cargo.push({
                    weight: resourceData.weight,
                    name: resourceData.type,
                    asset: resourceData.type,
                    type: CargoType.COMMODITY
                })
            }
            this.destroyResource(resource)
        }
    }

    destroyResource = (resource:Physics.Arcade.Sprite) => {
        this.deadResources.push({ id: resource.getData('state').id })
        this.resources.delete(resource.getData('state').id)
        resource.destroy()
    }

    playerShotAsteroid = (asteroid:Physics.Arcade.Sprite, projectile:any) =>
    {
        if(asteroid.getData('state').hp > 0){
            projectile.trackingEvent && projectile.trackingEvent.remove()
            projectile.destroy();
            asteroid.getData('state').hp-=1
            if(asteroid.getData('state').hp <= 0){
                this.spawnResource(asteroid)
                this.destroyAsteroid(asteroid)
            }
        }
    }

    destroyAsteroid = (asteroid:Physics.Arcade.Sprite) =>{ 
        this.deadAsteroids.push({ id: asteroid.getData('state').id })
        this.asteroids.delete(asteroid.getData('state').id)
        asteroid.destroy()
    }

    spawnResource = (resource) => {
        let id = v4()
        let rez = this.physics.add.sprite(resource.x,resource.y, 'planet')
            .setData('state', {
                id,
                weight: 1,
                type: Metals.IRON
            } as ResourceData)
            .setScale(0.1)
            .setRotation(Phaser.Math.FloatBetween(3,0.1))
        this.resources.set(id, rez)
        let ships = []
        this.ships.forEach(ship=>ships.push(ship))
        this.physics.add.overlap(rez, ships, this.playerGotResource)
    }

    initNPCTraffic = () => {
        new Array(Phaser.Math.Between(0,8)).fill(null).forEach(ship=>{
            this.spawnNPCShip()
        })
    }

    spawnNPCShip = (aiProfile?:AiProfileType) => {
        let shipData = getNPCShipData(aiProfile)
        shipData.systemName = this.name
        const rotation = Phaser.Math.FloatBetween(0,Math.PI*2)
        let systemVector = { x: Math.sin(rotation), y: Math.cos(rotation), rotation}
        if(shipData.aiProfile.jumpedIn){
            let x = Phaser.Math.Between(100,3000)
            this.spawnShip(shipData, {
                x, y:100, rotation, 
                xVelocity: systemVector.x*shipData.maxSpeed, 
                yVelocity: systemVector.y*shipData.maxSpeed
            })
        }
        else{
            let origin = this.planets[0]
            this.spawnShip(shipData, {
                x:origin.x, y:origin.y, rotation
            })
        }
        console.log('created ai ship: '+shipData.aiProfile.type)
        return shipData
    }
}