import { Scene, Physics } from "phaser";
import { StarSystems } from './data/StarSystems'
import ServerStarSystem from "./ServerLevelScene";
import WebsocketClient from "../../client/WebsocketClient";
import ServerShipSprite from "./display/ServerPlayerSprite";
import { ServerMessages, PlayerEvents } from "../../enum";

export default class GalaxyScene extends Scene {

    server: WebsocketClient
    scenes: Array<string>
    players: Map<string, Player>
    playerUpdates: Array<ShipUpdate>

    constructor(config){
      super(config)
      this.scenes = StarSystems.map(system=>system.name)
      this.server = new WebsocketClient()
      this.server.setListeners(this.onWSMessage, this.onConnected, this.onConnectionError)
      this.playerUpdates = []
      this.players = new Map()
    }

    create() {
        //TODO: In future, we want 1 server per system probs
        StarSystems.forEach((system)=>{
          this.scene.add(system.name, new ServerStarSystem({key:system.name}, system), true)
        })
        this.time.addEvent({ delay: 50, callback: this.step, loop: true });
    }
      
    step= () => {
      for(var i=0; i<this.scenes.length; i++){
        let scene = this.scene.get(this.scenes[i]) as ServerStarSystem
        for(var j=0; j<this.playerUpdates.length; j++){
          const update = this.playerUpdates[j]
          if(scene.name === update.shipData.systemName || update.type === PlayerEvents.START_JUMP)
              scene.onApplyPlayerUpdate(update)
        }
        this.server.publishMessage({
          type: ServerMessages.SERVER_UPDATE,
          system: scene.name,
          event: {
              ships: getShipUpdates(scene.ships, scene.jumpingShips, this.players, this.server, scene.deadShips),
              asteroids: getAsteroidUpdates(scene.asteroids, scene.deadAsteroids),
              resources: getResourceUpdates(scene.resources, scene.deadResources),
              planets: scene.planets.map(planet=>planet.config)
          }
        })
        scene.deadAsteroids = []
        scene.deadResources = []
        scene.jumpingShips = []
        scene.deadShips = []
      }
      this.playerUpdates = []
    }

    onRecievePlayerUpdate = (update:ShipUpdate) => {
        this.playerUpdates.push(update)
    }

    onWSMessage = (data) => {
        const payload = JSON.parse(data.data) as ServerMessage
        let type = payload.type
        //Store players at the galactic level...
        if(type === ServerMessages.PLAYER_LOGIN || type === ServerMessages.PLAYER_DATA_UPDATED){
          //store player in memory
          let player = payload.event as Player
          this.players.set(player.id, player)
          console.log('stored player in server memory: '+player.loginName)
        }
        else
          this.onRecievePlayerUpdate(payload.event as ShipUpdate)
          
    }

    onConnected = () => {
      this.server.publishMessage({type: ServerMessages.HEADLESS_CONNECT, event: null, system: '-Server-'})
    }

    onConnectionError = () => {
        console.log('wtf----')
    }
}

const getShipUpdates = (ships:Map<string,ServerShipSprite>, jumpingShips: Array<ServerShipSprite>, players:Map<string,Player>, server:WebsocketClient, deadShips:Array<ServerShipSprite>) => {
  let updates = new Array<ShipUpdate>()
  ships.forEach(ship=>{
    updates.push({
      type: PlayerEvents.SERVER_STATE,
      sequence: Date.now(),
      shipData: {
        ...ship.shipData,
        x: ship.x,
        y: ship.y,
        rotation: ship.rotation,
        velocity : ship.body.velocity,
        fighters: [],
        transientData: {...ship.shipData.transientData}
      }
    })
    //Transient data is for 1 time updates that need to be 3rd party observable, 
    //they are cleared after being sent once usually
    ship.shipData.transientData.firePrimary = false
    ship.shipData.transientData.commodityOrder = null
    ship.shipData.transientData.mission = null
  })
  jumpingShips.forEach(ship=>{
    //These have been removed from the scene and no new updates will be sent
    updates.push({
      type: PlayerEvents.SERVER_STATE,
      sequence: Date.now(),
      shipData: {...ship.shipData}
    })

    //Save new ship data to server store if not ai ship
    let player = players.get(ship.shipData.ownerId)
    if(player){
      player.ships = player.ships.map(pship=>{
          if(pship.id === ship.shipData.id) return ship.shipData
          return pship
      })
      console.log('saved player to data store: '+player)
      server.publishMessage({ type: ServerMessages.PLAYER_DATA_UPDATE, event: player, system:'' });    
    }
  })
  deadShips.forEach(ship=>{
    updates.push({
      type: PlayerEvents.SERVER_STATE,
      sequence: Date.now(),
      shipData: {...ship.shipData}
    })
    console.log('sent final update for dead ship: '+ship.shipData.id)
  })
  return updates
}

const getAsteroidUpdates = (asteroids:Map<string, Physics.Arcade.Sprite>, deadAsteroids:Array<DeadEntityUpdate>) => {
  let updates = new Array<AsteroidData>()
  asteroids.forEach(asteroid=>{
    if(asteroid.data){
      updates.push({
        x: asteroid.x,
        y: asteroid.y,
        hp: asteroid.getData('state').hp,
        id: asteroid.getData('state').id,
        type: asteroid.getData('state').type,
        dead: asteroid.getData('state').dead
      })
    }
  })
  deadAsteroids.forEach(roid=>{
    updates.push({
      x: -1,
      y: -1,
      hp: -1,
      id: roid.id,
      dead: true
    })
  })
  return updates
}

const getResourceUpdates = (resources:Map<string, Physics.Arcade.Sprite>, deadResources: Array<DeadEntityUpdate>) => {
  let updates = new Array<ResourceData>()
  resources.forEach(resource=>{
      if(resource.data){
        updates.push({
          x: resource.x,
          y: resource.y,
          weight: resource.getData('state').weight,
          id: resource.getData('state').id,
          type: resource.getData('state').type,
          dead: false
        })
      }
  })
  //These have been removed from the normal update loop to be sent out one last time so clients can GC them
  deadResources.forEach(resource=>{
    updates.push({
        x: -1,
        y: -1,
        weight: -1,
        id: resource.id,
        dead: true
    })
  })
  return updates
}