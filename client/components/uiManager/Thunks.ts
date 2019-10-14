import { dispatch } from '../../../client/App'
import { ReducerActions, PlayerEvents } from '../../../enum'

export const setUser = (currentUser:object) => {
    dispatch({
        type: ReducerActions.SET_USER,
        currentUser
    })
}

export const onSelectSystem = (systemName:string) => {
    dispatch({
        type: ReducerActions.SYSTEM_SELECTED,
        systemName
    })
}

export const onTogglePlanetMenu = (state:boolean, activeShip:ShipData, player:Player, activePlanet: StellarObjectConfig) => {
    dispatch({
        type: ReducerActions.OPEN_PLANET,
        state,
        player,
        activeShip,
        activePlanet
    })
}

export const onToggleMapMenu = (state:boolean, activeShip:ShipData) => {
    dispatch({
        type: ReducerActions.OPEN_MAP,
        state,
        activeShip
    })
}

export const onCommodityOrder = (commodity:Commodity, amount:number, buy:boolean) => {
    dispatch({
        type: ReducerActions.COMMODITY_ORDER,
        commodity,
        amount,
        buy
    })
}

export const onAcceptMission = (mission:Mission) => {
    dispatch({
        type: ReducerActions.ACCEPT_MISSION,
        mission
    })
}

export const onCompleteMission = (mission:Mission) => {
    dispatch({
        type: ReducerActions.COMPLETE_MISSION,
        mission
    })
}

export const onAbandonMission = (mission:Mission) => {
    dispatch({
        type: ReducerActions.ABANDON_MISSION,
        mission
    })
}

export const onShipTakeOff = (activeShip:ShipData) => {
    dispatch({
        type: ReducerActions.TAKE_OFF,
        playerEvent: PlayerEvents.TAKE_OFF,
        activeShip
    })
}

export const onConnected= () => {
    dispatch({
        type: ReducerActions.CONNECTED
    })
}

export const onConnectionError= () => {
    dispatch({
        type: ReducerActions.CONNECTION_ERROR
    })
}

export const onLogin = (name:string, password:string) => {
    dispatch({ type: ReducerActions.SET_LOGIN, name, password })
}