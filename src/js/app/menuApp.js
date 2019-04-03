import React  from 'react';
import ReactDOM from 'react-dom';

import initializeReactGA from "../utils/analytics";
import MetroOptions from "./scenes/MetroOptions";

/*
    Scene Implementation
*/

class App extends React.Component {

    render () {
        initializeReactGA()
        return (
            <MetroOptions />
        )
    }
}
ReactDOM.render(<App />, document.getElementById('mtr-app'));