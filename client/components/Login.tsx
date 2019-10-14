import * as React from 'react';
import { onLogin } from './uiManager/Thunks'
import AppStyles from '../AppStyles';
import { Button, LightButton, TopBar } from './Shared'

interface Props {
    loginError: boolean
}

export default class Login extends React.Component<Props> {
    state = { loginName: '', loginPassword:''}

    render(){
        return (
            <div style={AppStyles.window}>
                {TopBar('MacSpace')}
                <div style={{padding:'0.5em'}}>
                    {this.props.loginError && <h4>Invalid Password...</h4>}
                    <div>
                        <h4>Account:</h4>
                        <input value={this.state.loginName} onChange={(e)=>this.setState({loginName: e.currentTarget.value})}/>
                    </div>
                    <div>
                        <h4>Password:</h4>
                        <input type="password" value={this.state.loginPassword} onChange={(e)=>this.setState({loginPassword: e.currentTarget.value})}/>
                    </div>
                    <div style={{margin:'1em'}}>
                        {Button(!!(this.state.loginName && this.state.loginPassword), ()=>onLogin(this.state.loginName, this.state.loginPassword), 'Ok')}
                    </div>
                </div>
            </div>
        )
    }
}