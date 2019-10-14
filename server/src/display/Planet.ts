import { GameObjects, Scene } from "phaser";
import { getRandomPublicMission } from "../../../client/components/util/Util";

export default class Planet extends GameObjects.Sprite {

    config: StellarObjectConfig    
    
    constructor(scene:Scene, x:number, y:number, texture:string, config:StellarObjectConfig){
        super(scene, x, y, texture)
        this.config = config
        config.missions = new Array(10).fill(null).map(slot=>getRandomPublicMission((scene as any).state))
    }
}