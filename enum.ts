export const ApiUrl= 'ws://localhost:8082'
export const UIReducerActions= {
    PLAYER_AVAILABLE: 'ma',
    CONNECTION_ERROR: 'ce',
    CONNECTED: 'c',
    SET_USER: 'su',
    PLAYER_EVENT: 'pev',
    COMMODITY_ORDER:'cord',
    SET_LOGIN:'srl',
    LOGIN_FAILED: 'lff',
}

export enum PlayerEvents { 
    ROTATE_L= 'rl',
    ROTATE_R= 'rr',
    THRUST_OFF= 'to',
    THRUST= 't',
    FIRE_PRIMARY= 'fp',
    SERVER_STATE= 'ss',
    PLAYER_SPAWNED= 'ps',
    SELECT_TARGET='selct'
}

export enum ServerMessages {
    HEADLESS_CONNECT= 'hct',
    PLAYER_DATA_UPDATED= 'pea',
    PLAYER_EVENT= 'pe',
    SERVER_UPDATE= 'su',
    PLAYER_LOGIN='plo',
    PLAYER_DATA_UPDATE='pda'
}
