import { Scene } from "phaser";
import WebsocketClient from "../../WebsocketClient";
import { store } from "../../App";
import { onConnectionError, onConnected } from "../uiManager/Thunks";
import { ReducerActions, ServerMessages } from "../../../enum";
import StarSystem from "../mainViewer/display/LevelScene";
import { StarSystems } from "../../../server/src/data/StarSystems";

export default class BootScene extends Scene {

    player: Player
    server: WebsocketClient
    loginName: string
    loginPassword: string

    constructor(config){
        super(config)
        this.server = config.server
        this.loginName = config.loginName
        this.loginPassword = config.loginPassword
        this.server.setListeners(this.onWSMessage, this.onConnected, this.onConnectionError)
    }
    
    onWSMessage = (data:any) => {
        const payload = JSON.parse(data.data) as ServerMessage
        switch(payload.type){
            case ServerMessages.PLAYER_DATA_UPDATED:
                this.onReplacePlayer(payload)
                break
        }
    }

    onReplacePlayer = (payload:ServerMessage) => {
        const player = (payload.event as Player)
        if(player) {
            //let's load the correct scene now. we will put you where your active ship is.
            let systemName = player.ships.find(ship=>ship.id===player.activeShipId).systemName
            let system = StarSystems.find(system=>system.name===systemName)
            this.scene.add(system.name, new StarSystem({key:system.name, server:this.server, initialState: system, player}, false), false)
            this.scene.start(system.name)
            this.scene.remove()
        }
        else store.dispatch({ type: ReducerActions.LOGIN_FAILED })
    }

    onConnected = () => {
        onConnected()
        console.log('attempt player login...')
        this.server.publishMessage({
            type: ServerMessages.PLAYER_LOGIN,
            system: '',
            event: {
                loginName: this.loginName,
                loginPassword: this.loginPassword
            }
        })
    }

    onConnectionError = () => {
        onConnectionError()
        console.log('login client FAILED to connect.')
    }
}