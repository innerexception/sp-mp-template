declare enum Direction {
    DOWN, UP, FORWARD, REVERSE, RIGHT, LEFT
}

interface Player {
    loginName:string
    id:string
    activeShipId: string
    ships: Array<ShipData>
    reputation: Array<Faction>
    missions: Array<Mission>
    notoriety: number
    credits: number
}

interface PlayerSprite extends Phaser.Physics.Arcade.Sprite {
    rotateRight()
    rotateLeft()
    sendSpawnUpdate()
}

interface Session {
    sessionId: string
    players: Array<Player>
    systems: Array<SystemState>
    npcs: Array<Player>
}

interface Asset {
    key: string
    type: string
    resource: any
    data?: any
}

interface RState {
    isConnected: boolean
    player: Player | null
    showMap: boolean
    playerEvent: PlayerEvents
    loginName:string
    loginPassword:string
    loginError:boolean
    systemName:string
}