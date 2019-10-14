import * as React from 'react'
import { onCommodityOrder, onShipTakeOff, onAcceptMission, onCompleteMission, onAbandonMission } from '../uiManager/Thunks'
import AppStyles from '../../AppStyles';
import { Button, LightButton } from '../Shared'
import { getCargoWeight, getPlayerFactionMissions } from '../util/Util';

interface Props {
    player: Player
    activeShip: ShipData
    planet: StellarObjectConfig
}

interface State {
    activeView: string
}

export default class PlanetMenu extends React.Component<Props, State> {

    state = {
        activeView: 'main'
    }

    componentDidMount = () => {
        // window.addEventListener('keydown', (e)=>this.handleKeyDown(e.keyCode))
    }

    onTakeOff = () => {
        onShipTakeOff({...this.props.activeShip})
    }

    onCommodityOrder = (commodity:Commodity, amount: number, buy: boolean) => {
        onCommodityOrder(commodity, amount, buy)
    }

    onAcceptMission = (mission:Mission) => {
        onAcceptMission(mission)
    }

    onComplete = (mission:Mission) => {
        onCompleteMission(mission)
    }

    onAbandon = (mission:Mission) => {
        onAbandonMission(mission)
    }

    getPlanetMainMenu = () => {
        return (
            <div style={{...styles.disabled, display: 'flex'}}>
                <div style={AppStyles.notification}>
                    <h3>{this.props.planet.planetName}</h3>
                    <div>
                        {this.getView(this.state.activeView)}
                    </div>
                </div>
            </div>
        )
    }

    getView = (viewName:string) => {
        switch(viewName){
            case 'main': return this.mainView(this.props.planet)
            case 'commodities': return this.commodityView(this.props.planet, this.props.activeShip)
            case 'missions': return this.missionView(this.props.planet, this.props.activeShip)
            case 'bar': return this.barView(this.props.player, this.props.activeShip)
        }
    }

    mainView = (planet:StellarObjectConfig) => 
        <div>
            <h4>{planet.description}</h4>
            {planet.commodities && LightButton(true, ()=>this.setState({activeView: 'commodities'}), 'Trade')}
            {planet.shipyard && LightButton(true, ()=>this.setState({activeView:'shipyard'}), 'Shipyard')} 
            {planet.outfitter && LightButton(true, ()=>this.setState({activeView:'outfitter'}), 'Outfitter')}   
            {planet.bar && LightButton(true, ()=>this.setState({activeView:'bar'}), 'Bar')}        
            {planet.missions && LightButton(true, ()=>this.setState({activeView:'missions'}), 'Contracts')}        
            {Button(true, this.onTakeOff, 'Leave')}
        </div>
    

    missionView = (planet:StellarObjectConfig, ship:ShipData) => 
        <div style={{height:'80vh', overflow:'auto'}}>
            <h4>Active Contracts</h4>
            {this.props.player.missions.map(mission=>
                <div>
                    <h5>{mission.type}</h5>
                    <div>{mission.description}</div>
                    <div>{mission.payment}</div>
                    {LightButton(true, mission.destinationPlanetName === planet.planetName ?
                        ()=>this.onComplete(mission) : ()=>this.onAbandon(mission), 
                        mission.destinationPlanetName === planet.planetName ? 'Complete' : 'Abandon')}
                </div>
            )}
            <h4>Available Contracts</h4>
            {planet.missions && planet.missions.map(mission => 
                <div style={{display:"flex"}}>
                    <h5>{mission.type}</h5>
                    <div>{mission.description}</div>
                    <div>{mission.payment ? mission.payment : this.props.player.notoriety*1000}</div>
                    {LightButton(mission.cargo ? mission.cargo.weight <= ship.maxCargoSpace - getCargoWeight(ship) : mission.notorietyMinimum <= this.props.player.notoriety, ()=>this.onAcceptMission(mission), 'Accept')}
                </div>
            )}
            {Button(true, ()=>this.setState({activeView:'main'}), 'Done')}
        </div>

    barView = (player:Player, ship:ShipData) => 
        <div>
            <h4>Spaceport Bar</h4>
            {getPlayerFactionMissions(player).map(mission => 
                <div style={{display:"flex"}}>
                    <h5>{mission.type}</h5>
                    <div>{mission.description}</div>
                    <div>{mission.payment ? mission.payment : player.notoriety*100}</div>
                    {LightButton(mission.cargo.weight <= getCargoWeight(ship), ()=>this.onAcceptMission(mission), 'Accept')}
                </div>
            )}
            {Button(true, ()=>this.setState({activeView:'main'}), 'Done')}
        </div>

    commodityView = (planet:StellarObjectConfig, ship:ShipData) => 
        <div>
            <h4>Credits: {this.props.player.credits}</h4>
            <h4>Used Space: {getCargoWeight(ship)+'/'+ship.maxCargoSpace}</h4>
            {planet.commodities && planet.commodities.map(commodity => 
                <div style={{display:"flex"}}>
                    <h5>{commodity.name}</h5>
                    <div>{commodity.price}</div>
                    {LightButton(getCargoWeight(ship) <= ship.maxCargoSpace, ()=>this.onCommodityOrder(commodity, 1, true), 'Buy 1')}
                    {LightButton(getCargoWeight(ship) <= ship.maxCargoSpace, ()=>this.onCommodityOrder(commodity, ship.maxCargoSpace-getCargoWeight(ship), true), 'Buy All')}
                    {LightButton(ship.cargo.find(item=>item.name === commodity.name) ? true : false, ()=>this.onCommodityOrder(commodity, 1, false), 'Sell 1')}
                    {LightButton(ship.cargo.find(item=>item.name === commodity.name) ? true : false, ()=>this.onCommodityOrder(commodity, ship.cargo.find(item=>item.name === commodity.name).weight, false), 'Sell All')}
                </div>
            )}
            {Button(true, ()=>this.setState({activeView:'main'}), 'Done')}
        </div>

    handleKeyDown = (keyCode:number) =>{
        
    }

    render(){
        return (this.getPlanetMainMenu())
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