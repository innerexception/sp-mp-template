import * as React from 'react'
import AppStyles from '../../AppStyles';
import { Button, LightButton } from '../Shared'
import { onSelectSystem } from '../uiManager/Thunks';
import { StarSystems } from '../../../server/src/data/StarSystems';

interface Props {
    activeShip: ShipData
}

interface State {
    selectedSystemName: string
}

export default class Map extends React.Component<Props, State> {

    state = {
        selectedSystemName: this.props.activeShip.systemName
    }

    onChooseDestination = () => {
        onSelectSystem(this.state.selectedSystemName)
    }

    isSystemAdjacent = (system:SystemState) => 
        system.neighbors.filter(nsystem=>nsystem === this.props.activeShip.systemName).length > 0
    
    getMap = () => {
            return (
                <div style={{...styles.disabled, display: 'flex'}}>
                    <div style={AppStyles.notification}>
                        <h3>Milky Way</h3>
                        <div style={{width:'60vw', height:'60vh', background:'black', overflow:'auto'}}>
                            <svg style={{minHeight:'100%', minWidth:'100%'}}>
                                {StarSystems.map(system=>
                                    [system.neighbors.map(neighborName=>{
                                        let nSystem = StarSystems.find(asystem=>asystem.name === neighborName)
                                        return <line x1={system.x/50} y1={system.y/50} x2={nSystem.x/50} y2={nSystem.y/50} stroke='white'/>
                                    })]
                                )}
                                {StarSystems.map(system=>[
                                    <circle cx={system.x/50} cy={system.y/50} 
                                            r={10}
                                            fill={this.state.selectedSystemName === system.name ? 'green' : 'white'}
                                            onClick={this.isSystemAdjacent(system) ? ()=>this.setState({selectedSystemName: system.name}) : null}/>,
                                    <text x={system.x/50} y={(system.y/50)+30} stroke='green'>{system.name}</text>]
                                )}
                            </svg>
                        </div>
                        {Button(true, this.onChooseDestination, 'Ok')}
                    </div>
                </div>
            )
    }

    render(){
        return (this.getMap())
    }
}

const styles = {
    disabled: {
        alignItems:'center', justifyContent:'center', 
        position:'absolute' as 'absolute', top:0, left:0, width:'100%', height:'100%'
    },
    mapFrame: {
        position:'relative' as 'relative',
        backgroundImage: 'url('+require('../../assets/whiteTile.png')+')',
        backgroundRepeat: 'repeat',
        overflow:'auto',
        maxHeight:'60vh',
        maxWidth:'100%'
    },
    tileInfo: {
        height: '5em',
        backgroundImage: 'url('+require('../../assets/whiteTile.png')+')',
        backgroundRepeat: 'repeat',
        marginBottom: '0.5em',
        padding: '0.5em',
        border: '1px dotted',
        display:'flex',
        justifyContent:'space-between'
    },
    tile: {
        width: '2em',
        height:'1.7em',
        border: '1px',
        position:'relative' as 'relative'
    },
    tileItem: {
        fontFamily:'Item', color: AppStyles.colors.grey2, fontSize:'0.6em', position:'absolute' as 'absolute', top:0, left:0
    },
    levelBarOuter: {
        height:'0.25em',
        background: AppStyles.colors.white
    },
    unitFrame: {position: 'absolute' as 'absolute', top: '0px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center', zIndex:3}
}