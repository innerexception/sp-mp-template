import * as React from 'react';
import ViewscreenFrame from '../mainViewer/ViewscreenFrame'
import Login from '../Login'
import AppStyles from '../../AppStyles'

interface Props {
    isConnected: boolean
    showMap: boolean
    showPlanetMenu: boolean
    loginName: string
    loginPassword: string
    loginError: boolean
    activeShip:ShipData
    targetShip:ShipData
    activePlanet: StellarObjectConfig
    player:Player
}

export default class UIManager extends React.Component<Props> {

    getComponent = () => {
        if(!this.props.loginPassword){
            return <Login {...this.props}/>
        }
        else if(this.props.loginName && this.props.loginPassword){
            return <ViewscreenFrame {...this.props}/>
        }
    }

    render(){
        return (
            <div style={styles.frame}>
                {this.getComponent()}
                <div style={styles.statusDot}>
                    <h6 style={{margin:0, marginRight:'0.5em'}}>Servers are</h6>
                    <h6 style={{margin:0, color: this.props.isConnected ? AppStyles.colors.black: AppStyles.colors.white}}>{this.props.isConnected ? 'Up' : 'Down'}</h6>    
                </div>
            </div>
        )
    }
}

const styles = {
    frame: {
        height: '100vh',
        display:'flex', justifyContent:'center', alignItems:'center',
        backgroundImage: 'url('+require('../../assets/tiny.png')+')',
        backgroundRepeat: 'repeat'
    },
    dot: {
        height:'0.5em',
        width:'0.5em',
        borderRadius: '0.5em'
    },
    statusDot: {
        position:'absolute' as 'absolute', bottom:'0.5em', right:'0.5em',
        display:'flex',
        color:AppStyles.colors.black,
        alignItems:'center'
    }
}