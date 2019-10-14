import { connect } from 'react-redux'
import UIManager from './UIManager'

const mapStateToProps = (state:RState) => {
    return state
};

const UIStateContainer = connect(
    mapStateToProps
)(UIManager);

export default UIStateContainer;