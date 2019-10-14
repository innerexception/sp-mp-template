import * as React from 'react'
import AppStyles from '../AppStyles'

export const TopBar = (text:string) => 
    <div style={AppStyles.topBar}>
        <div style={{width:'33%'}}><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/></div>
            {text}
        <div style={{width:'33%'}}><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/><hr style={AppStyles.hr}/></div>
    </div>


export const Button = (enabled:boolean, handler:any, text:string) => 
    <div style={{...AppStyles.buttonOuter, pointerEvents: enabled ? 'all' : 'none'}} 
        onClick={handler}>
        <div style={{...AppStyles.buttonInner, opacity: enabled ? 1 : 0.5}}>{text}</div>
    </div>

export const LightButton = (enabled:boolean, handler:any, text:string) => 
    <div onClick={handler} style={{...AppStyles.buttonInner, opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'all' : 'none', textAlign:'center'}}>{text}</div>