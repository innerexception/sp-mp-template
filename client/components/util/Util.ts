import { Position, Toaster } from "@blueprintjs/core"
import { Ships } from '../../../server/src/data/Ships'
import { AiProfileType, FactionName, MissionType, MissionTypes, CargoTypes, CargoType } from "../../../enum";
import { v4 } from 'uuid'
import { StarSystems } from "../../../server/src/data/StarSystems"
import { CommodityNames } from '../../../server/src/data/CommodityNames'
import { FactionMissions } from '../../../server/src/data/FactionMissions'

export const toast = Toaster.create({
    className: `recipe-toaster`,
    position: Position.TOP,
})

export const getCargoWeight = (ship:ShipData) => {
    let weights = 0
    ship.cargo.forEach(item => weights += item.weight)
    return weights
}

export const getNPCShipData = (aiProfile?:AiProfileType) => {
    let shipData = Ships[Phaser.Math.Between(0,Ships.length-1)]
    shipData.aiProfile = {
        type: aiProfile,
        jumpedIn: true,
        attackerId: '',
        attackTime: 0,
        targetShipId: ''
    }
    shipData.id = v4()
    if(!aiProfile){
        switch(Phaser.Math.Between(0,2)){
            case 0:
                shipData.faction = FactionName.NEUTRAL
                shipData.aiProfile.type = AiProfileType.MERCHANT
                break
            case 1: 
                shipData.faction = FactionName.PIRATE
                shipData.aiProfile.type = AiProfileType.PIRATE
                break
            case 2:     
                shipData.faction = FactionName.POLICE
                shipData.aiProfile.type = AiProfileType.POLICE
                break
        }
    }
    return shipData
}

export const getRandomPublicMission = (startingSystem:SystemState) => {
    let type = MissionTypes[Phaser.Math.Between(0,MissionTypes.length-1)]
    switch(type){
        case MissionType.DELIVERY:
            return getRandomDeliveryMission(startingSystem)
        case MissionType.DESTROY:
            return getRandomBountyMission()
        case MissionType.ESCORT:
            return getRandomEscortMission()
    }
}

const getRandomDeliveryMission = (startingSystem:SystemState) => {
    let othersystems = StarSystems.filter(system=>system.name!==startingSystem.name)
    let destinationSystem = othersystems[Phaser.Math.Between(0,othersystems.length-1)]
    let destinationPlanet = destinationSystem.stellarObjects[Phaser.Math.Between(0, destinationSystem.stellarObjects.length-1)]
    let distance = Phaser.Math.Distance.Between(startingSystem.x, startingSystem.y, destinationSystem.x, destinationSystem.y)
    let cargo = getDeliveryCargo()
    let mission:Mission = {
        id:v4(),
        payment: Math.round(distance),
        destinationPlanetName: destinationPlanet.planetName,
        destinationSystemName: destinationSystem.name,
        cargo,
        description: getDeliveryDescription(cargo, destinationPlanet.planetName, destinationSystem.name),
        type: MissionType.DELIVERY
    }
    return mission
}

const getDeliveryCargo = () => {
    let cargo = {
        type: CargoTypes[Phaser.Math.Between(0,CargoTypes.length-1)],
        weight: -1,
        name: '',
        asset: ''
    }
    if(cargo.type === CargoType.PASSENGER){
        cargo.weight = Phaser.Math.Between(1,10)
        cargo.name = cargo.weight+' Passengers'
        cargo.asset = 'passengers'
    }
    else{
        cargo.weight = Phaser.Math.Between(5, 10)
        cargo.name = cargo.weight+' tons of '+CommodityNames[Phaser.Math.Between(0,CommodityNames.length-1)]
        cargo.asset = 'junk'
    } 
    return cargo
}

const getDeliveryDescription = (cargo:InventoryData, destinationPlanetName:string, destinationSystemName:string) => 
    'Transport '+cargo.name+' to '+destinationPlanetName+' in the '+destinationSystemName+' system'

const getRandomBountyMission = () => {
    let destinationSystem = StarSystems[Phaser.Math.Between(0,StarSystems.length-1)]
    let destinationPlanet = destinationSystem.stellarObjects[Phaser.Math.Between(0, destinationSystem.stellarObjects.length-1)]
    let targets = Phaser.Math.Between(1,5)
    let mission:Mission = {
        id:v4(),
        payment: 0, //Set when viewed by a player
        destinationPlanetName: destinationPlanet.planetName,
        destinationSystemName: destinationSystem.name,
        targetCount: targets,
        targetIds: [],
        description: getBountyDescription(targets, destinationSystem.name),
        type: MissionType.DESTROY,
        notorietyMinimum: 0
    }
    return mission
}

const getBountyDescription = (targets:number, destinationSystem) => 
    'Destroy or disable '+targets+' marked pirates in '+destinationSystem

const getRandomEscortMission = () => {
    let destinationSystem = StarSystems[Phaser.Math.Between(0,StarSystems.length-1)]
    let destinationPlanet = destinationSystem.stellarObjects[Phaser.Math.Between(0, destinationSystem.stellarObjects.length-1)]
    let targets = Phaser.Math.Between(1,5)
    let mission:Mission = {
        id:v4(),
        payment: 0, //set when viewed by a player
        destinationPlanetName: destinationPlanet.planetName,
        destinationSystemName: destinationSystem.name,
        targetCount: targets,
        targetIds: [],
        description: getEscortDescription(targets, destinationPlanet.planetName, destinationSystem.name),
        type: MissionType.ESCORT,
        notorietyMinimum: 0
    }
    return mission
}

const getEscortDescription = (targets, destinationPlanet, destinationSystem) => 
    'Escort '+targets+' ships to '+destinationPlanet+'in the '+destinationSystem+' system'

export const getPlayerFactionMissions = (player:Player) => {
    let missions = []
    player.reputation.forEach(faction=>{
        missions.push(FactionMissions.filter(mission=>
            mission.reputationMinimum <= faction.reputation 
            && mission.faction === faction.name
        ))
    })
    return missions
}

export const getNextFactionMission = (factionName:string, missionIndex:number) => {
    return FactionMissions[factionName][missionIndex+1]
}

export const checkTargets = (ships:Array<string>, ship:ShipData) => {
    let killed =  ship.killedIds.filter(killId=>{
        return ships.filter(mShip=>mShip === killId).length > 0
    })
    return killed.length === ships.length
}