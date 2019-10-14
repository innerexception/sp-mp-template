import * as React from 'react'
import * as Phaser from 'phaser'
import WebsocketClient from '../../WebsocketClient'
import BootScene from '../util/BootScene';
const server = new WebsocketClient()

interface Props {
    loginName: string
    loginPassword: string
}

interface State {
    phaserInstance: Phaser.Game | null
}

export default class Viewscreen extends React.Component<Props, State> {

    state = {
        phaserInstance: null,
        containerRef: React.createRef<HTMLDivElement>()
    }

    componentDidMount() {
        this.state.phaserInstance = new Phaser.Game({
            type: Phaser.WEBGL,
            width: this.state.containerRef.current.clientWidth,
            height: this.state.containerRef.current.clientHeight,
            parent: 'canvasEl',
            physics: {
                default: 'arcade'
            },
            scene: [new BootScene({
                key:'boot',
                server:server,
                loginName: this.props.loginName,
                loginPassword: this.props.loginPassword
            })]
        });
        window.addEventListener("resize", ()=>{
            let game = (this.state.phaserInstance as Phaser.Game)
            game.canvas.width = this.state.containerRef.current.clientWidth
            game.canvas.height = this.state.containerRef.current.clientHeight
        });
    }

    render() {
        return <div ref={this.state.containerRef} id='canvasEl' style={{width:'75vw', height:'75vh'}}/>
    }
}