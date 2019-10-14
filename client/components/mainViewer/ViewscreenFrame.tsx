import * as React from 'react'
import AppStyles from '../../AppStyles';
import Map from './Map'
import PlanetMenu from './PlanetMenu'
import Viewscreen from './Viewscreen'
import { TopBar, Button } from '../Shared'
import { getCargoWeight } from '../util/Util';

interface Props {
    showMap: boolean
    showPlanetMenu: boolean
    loginName: string
    loginPassword: string
    activeShip:ShipData
    targetShip: ShipData
    player:Player
    activePlanet: StellarObjectConfig
}

interface State {
    showMatchOptions: boolean
}

export default class Match extends React.Component<Props, State> {

    state = {
        showMatchOptions: false,
        showMap: false
    }

    render(){
        return (
            <div style={AppStyles.window}>
                {TopBar('MacSpace')}
                <div style={{padding:'0.5em', position:'relative'}}>
                    {this.props.activeShip && <div style={{position:'absolute', top:'1em', right:'1em', color:'green'}}>
                        <div>fuel: {this.props.activeShip.fuel} / {this.props.activeShip.maxFuel}</div>
                        <div>cargo: {getCargoWeight(this.props.activeShip)} / {this.props.activeShip.maxCargoSpace}</div>
                        <div>energy: {this.props.activeShip.energy} / {this.props.activeShip.maxEnergy}</div>
                        <div>sheild: {this.props.activeShip.shields} / {this.props.activeShip.maxShields}</div>
                        <div>hull: {this.props.activeShip.hull} / {this.props.activeShip.maxHull}</div>
                        <div>selected: {this.props.activeShip.weapons[this.props.activeShip.selectedWeaponIndex].name}</div>
                    </div>}
                    {this.props.targetShip && <div style={{position:'absolute', top:'10em', right:'1em', color:'green'}}>
                        <div>{this.props.targetShip.name + ' - '+this.props.targetShip.faction}</div>
                        <div>fuel: {this.props.targetShip.fuel} / {this.props.targetShip.maxFuel}</div>
                        <div>cargo: {getCargoWeight(this.props.targetShip)} / {this.props.targetShip.maxCargoSpace}</div>
                        <div>energy: {this.props.targetShip.energy} / {this.props.targetShip.maxEnergy}</div>
                        <div>sheild: {this.props.targetShip.shields} / {this.props.targetShip.maxShields}</div>
                        <div>hull: {this.props.targetShip.hull} / {this.props.targetShip.maxHull}</div>
                        <div>selected: {this.props.targetShip.weapons[this.props.targetShip.selectedWeaponIndex].name}</div>
                    </div>}
                    {this.state.showMatchOptions && 
                        <div style={{...styles.modal, display: 'flex'}}>
                            <div style={{display:'flex'}}>
                                options menu (esc)
                            </div>
                        </div>
                    }
                    {!this.props.activeShip && 
                        <div style={{...styles.modal, display: 'flex'}}>
                            <div style={{...AppStyles.notification, margin:'auto'}}>
                                <h3>You Died.</h3>
                            </div>
                        </div>
                    }
                    {this.props.showMap && <Map activeShip={this.props.activeShip}/>}
                    {this.props.showPlanetMenu && this.props.activeShip.landedAtName && 
                        <PlanetMenu activeShip={this.props.activeShip} 
                                    planet={this.props.activePlanet}
                                    player={this.props.player}/>}
                    <Viewscreen loginName={this.props.loginName} loginPassword={this.props.loginPassword}/>
                </div>
         </div>
        )
    }
}

const styles = {
    frame: {
        padding:'1em',
        position:'relative' as 'relative'
    },
    modal: {
        backgroundImage: 'url('+require('../../assets/tiny2.png')+')',
        backgroundRepeat: 'repeat',
        position:'absolute' as 'absolute',
        top:0, left:0, right:0, bottom:0,
        maxWidth: '20em',
        maxHeight: '20em',
        border: '1px solid',
        borderRadius: '5px',
        margin: 'auto',
        flexDirection: 'column' as 'column',
        justifyContent: 'flex-start'
    },
    circleButton: {
        cursor:'pointer',
        height:'2em',
        width:'2em',
        display:'flex',
        alignItems:'center',
        justifyContent: 'center'
    },
    choiceBtn: {
        margin: 0,
        cursor: 'pointer',
        border: '1px solid',
        padding: '0.5em',
        borderRadius: '5px',
    },
    disabled: {
        position:'absolute' as 'absolute',
        top:0,
        left:0,
        background:'black',
        opacity: 0.1,
        width:'100vw',
        height:'100vh'
    },
    toggleButton: {
        cursor:'pointer',
        border:'1px solid',
        borderRadius: '3px',
        padding:'0.5em'
    },
    scrollContainer: {
        overflow: 'auto',
        height: '66%',
        marginBottom:'0.5em',
        marginTop: '0.5em',
        background: 'white',
        border: '1px solid',
        padding: '0.5em'
    },
    unitRow: {
        display: 'flex',
        alignItems: 'center',
        width: '33%',
        justifyContent: 'space-between'
    }
}