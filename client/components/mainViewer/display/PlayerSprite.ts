import { GameObjects, Physics, Scene, Time, } from "phaser";
import WebsocketClient from "../../../WebsocketClient";
import { PlayerEvents, ServerMessages, ReducerActions } from "../../../../enum";
import StarSystem from "./LevelScene";
import Planet from "./Planet";
import { store } from "../../../App";
import { getCargoWeight } from "../../util/Util";
import Projectile from "./Projectile";

export default class ShipSprite extends Physics.Arcade.Sprite {

    thruster: GameObjects.Particles.ParticleEmitter
    projectiles: GameObjects.Group
    beams: GameObjects.Group
    jumpSequence: boolean
    isPlayerControlled: boolean
    shipData: ShipData
    lastAckSequence: number
    bufferedInputs: Array<ShipUpdate>
    server:WebsocketClient
    onTogglePlanetMenu: Function
    targetUpdater: Time.TimerEvent
    firingEvent: Time.TimerEvent
    isJumping: boolean

    constructor(scene:Scene, x:number, y:number, texture:string, projectiles:GameObjects.Group, beams:GameObjects.Group, isPlayerControlled:boolean, ship:ShipData, server:WebsocketClient, onTogglePlanetMenu:Function){
        super(scene, x, y, texture)
        this.server=server
        this.bufferedInputs = []
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this);
        this.shipData = ship
        this.scaleX = 0.3
        this.scaleY = 0.3
        this.setMaxVelocity(ship.maxSpeed).setFriction(400, 400);
        this.thruster = this.scene.add.particles('proton').createEmitter({
            x: this.x,
            y: this.y,
            angle: this.angle,
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 150,
            on: false
        });
        
        this.thruster.setSpeed(100)
        this.depth = 3
        this.projectiles = projectiles
        this.beams = beams
        this.isPlayerControlled = isPlayerControlled
        this.onTogglePlanetMenu = onTogglePlanetMenu
    }

    takeOff = () => {
        this.setScale(0)
        this.scene.tweens.add({
            targets: this,
            duration: 1500,
            scale: 0.3
        })
        if(this.isPlayerControlled)
            this.onTogglePlanetMenu(false, this.shipData)
    }

    landing = () => {
        this.scene.tweens.add({
            targets: this,
            duration: 1500,
            scale: 0,
            onComplete: ()=>{
                if(this.isPlayerControlled)
                    this.onTogglePlanetMenu(true, this.shipData)
            }
        })
    }

    sendSpawnUpdate = () => {
        this.addShipUpdate(this, PlayerEvents.PLAYER_SPAWNED)
    }

    startLandingSequence = (target:Planet) => {
        //landing sequence
        this.shipData.transientData.landingTargetName = target.config.planetName
        this.addShipUpdate(this, PlayerEvents.START_LANDING)
    }

    stopLandingSequence = () => {
        //done on server...
    }

    startJumpSequence = (targetSystem:SystemState) => {
        //jump sequence, pass to next system.
        this.isJumping = true
        this.shipData.systemName = targetSystem.name
        this.addShipUpdate(this, PlayerEvents.START_JUMP)
    }

    startFiring = () => {
        let weapon = this.shipData.weapons[this.shipData.selectedWeaponIndex]
        this.firingEvent = this.scene.time.addEvent({ 
            delay: 1000/weapon.shotsPerSecond, 
            callback: ()=>{
                this.firePrimary()
            },
            loop:true
        })
    }
    stopFiring = () => {
        this.firingEvent && this.firingEvent.remove()
    }

    firePrimary = () => {
        let weapon = this.shipData.weapons[this.shipData.selectedWeaponIndex]
        let target = (this.scene as StarSystem).ships.get(this.shipData.currentTargetId)
        if(!weapon.isBeam){
            const projectile = this.projectiles.get().setActive(true).setVisible(true) as Projectile
            if(projectile){
                projectile.fire(this.shipData.weapons[this.shipData.selectedWeaponIndex], this, target)
                this.shipData.transientData.firePrimary = true
                if(this.isPlayerControlled){
                    this.addShipUpdate(this, PlayerEvents.FIRE_PRIMARY)
                }
            }
        }
    }

    selectPrimary = () => {
        this.shipData.selectedWeaponIndex = (this.shipData.selectedWeaponIndex + 1) % this.shipData.weapons.length
        store.dispatch({ type: ReducerActions.PLAYER_REPLACE_SHIP, activeShip: {...this.shipData}})
        this.addShipUpdate(this, PlayerEvents.SELECT_PRIMARY)
    }

    selectNextTarget = () => {
        let ships = [];
        let i=0;
        let index = 0;
        const scene = (this.scene as StarSystem)
        scene.ships.forEach((ship)=>{
            if(ship.shipData.id === this.shipData.currentTargetId) index = i
            if(ship.shipData.id !== this.shipData.id){
                ships.push(ship)
                i++
            } 
        })
        if(i>0){
            let targetData = ships[(index+1)%ships.length].shipData
            this.shipData.currentTargetId = targetData.id
            store.dispatch({ type: ReducerActions.PLAYER_REPLACE_TARGET, targetShip: {...targetData}});
            scene.targetRect.scale = 0
            scene.targetRect.rotation = 1
            scene.tweens.add({
                targets: scene.targetRect,
                scale: 2,
                rotation: 0,
                duration: 500
            })
            this.targetUpdater && this.targetUpdater.remove()
            this.targetUpdater = this.scene.time.addEvent({
                delay: 500, 
                callback: ()=>{
                    let ship = (this.scene as StarSystem).ships.get(this.shipData.currentTargetId)
                    if(ship) store.dispatch({ type: ReducerActions.PLAYER_REPLACE_TARGET, targetShip: {...ship.shipData}})
                    else this.targetUpdater.remove()
                },
                loop: true
            })
            this.addShipUpdate(this, PlayerEvents.SELECT_TARGET)
        }
    }

    selectNextHostileTarget = () => {
        //Next ship with you as target and weapons armed

    }

    fireSecondary = () => {

    }

    rotateLeft = () => {
        if(this.shipData.transientData.landingTargetName) this.addShipUpdate(this, PlayerEvents.STOP_LANDING)
        this.rotation -= this.shipData.turn
        this.addShipUpdate(this, PlayerEvents.ROTATE_L)
    }
    rotateRight = () => {
        if(this.shipData.transientData.landingTargetName) this.addShipUpdate(this, PlayerEvents.STOP_LANDING)
        this.rotation += this.shipData.turn
        this.addShipUpdate(this, PlayerEvents.ROTATE_R)
    }

    thrust = () => {
        if(this.shipData.transientData.landingTargetName) this.addShipUpdate(this, PlayerEvents.STOP_LANDING)
        let vector = { x: Math.sin(this.rotation), y: Math.cos(this.rotation)}
        this.setAcceleration(vector.x*this.shipData.maxSpeed, vector.y*-this.shipData.maxSpeed); //negative b/c y is inverted in crazyland
        this.thruster.emitParticle(16);
        this.addShipUpdate(this, PlayerEvents.THRUST)
    }

    thrustOff = () => {
        this.thruster.stop()
        this.setAcceleration(0,0)
        this.addShipUpdate(this, PlayerEvents.THRUST_OFF)
    }

    //Custom sprite needs this magical named method instead of update()
    preUpdate = (time, delta) =>
    {
        //Align thruster nozzle
        let vector = { x: Math.sin(this.rotation), y: Math.cos(this.rotation)}
        this.thruster.setPosition(this.x + vector.x, this.y +vector.y);
        this.thruster.setAngle(this.angle+45)
    }

    applyUpdate = (update:ShipUpdate) => {
        this.lastAckSequence = update.sequence
        //Here we need to re-apply any inputs the server hasn't yet applied in the update, 
        //Else our ship will jump backwards on most connections
        for(let i=0; i<this.bufferedInputs.length; i++){
            let bupdate = this.bufferedInputs[i]
            if(bupdate.sequence <= this.lastAckSequence)
                this.bufferedInputs.splice(i, 1)
            else {
                this.applyState(bupdate.shipData)
            }
        }
        this.applyState(update.shipData, true)
    }

    applyState = (update:ShipData, doTween?:boolean) => {
        if(doTween){
            
            let rotation = Phaser.Math.Angle.RotateTo(this.rotation, update.rotation)

            this.scene.add.tween({
                targets: this,
                x: update.x,
                y: update.y,
                rotation, //javascript
                duration: this.isPlayerControlled ? 5 : 30
            })
        }
        else{
            this.setPosition(update.x, update.y)
            this.rotation = update.rotation
        }
        this.setVelocity(update.velocity.x, update.velocity.y)
        if(update.transientData.firePrimary && !this.isPlayerControlled) this.firePrimary()
        if(update.landedAtName && !this.shipData.landedAtName){
            this.shipData.landedAtName = update.landedAtName
            this.landing()
        }
        if(!update.landedAtName && this.shipData.landedAtName){
            delete this.shipData.landedAtName
            this.takeOff()
        }
        if(getCargoWeight(this.shipData) !== getCargoWeight(update)){
            this.shipData.cargo = update.cargo
            if(this.isPlayerControlled) store.dispatch({ type: ReducerActions.PLAYER_REPLACE_SHIP, activeShip: {...this.shipData}})
        }
        if(this.shipData.shields !== update.shields){
            this.shipData.shields=update.shields
            if(this.isPlayerControlled) store.dispatch({ type: ReducerActions.PLAYER_REPLACE_SHIP, activeShip: {...this.shipData}})
        }
        if(this.shipData.hull !== update.hull){
            this.shipData.hull=update.hull
            if(this.isPlayerControlled) store.dispatch({ type: ReducerActions.PLAYER_REPLACE_SHIP, activeShip: {...this.shipData}})
        }
        if(this.shipData.fuel !== update.fuel){
            this.shipData.fuel = update.fuel
            if(this.isPlayerControlled) store.dispatch({ type: ReducerActions.PLAYER_REPLACE_SHIP, activeShip: {...this.shipData}})
        }
    }
    

    addShipUpdate = (ship:ShipSprite, event:PlayerEvents) => {
        let update = {
            id: ship.shipData.id,
            sequence: Date.now(),
            type: event,
            shipData: {
                ...ship.shipData, 
                fighters: [] ,
                x: ship.x,
                y: ship.y,
                rotation: ship.rotation,
                velocity: ship.body.velocity,
                transientData: {...ship.shipData.transientData}
            }
        }
        this.server.publishMessage({
            type: ServerMessages.PLAYER_EVENT, 
            event: update,
            system: (this.scene as StarSystem).name
        })
        this.bufferedInputs.push(update)
    }
}