import React, { useState } from "react";
import ReactGA from "react-ga";
import browser from "webextension-polyfill";

import Login from "./Login";

const LoginContainer = ({ metroClient, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState(null)

    const onClick = async () => {
        try {
            await metroClient.login(username, password)
            browser.runtime.sendMessage({method: "loggedIn"})
            onLogin()
        } catch(err) {
            setFormError(err.message)
        }
    }

    return (
        <Login 
            username={ username }
            password={ password }
            formError={ formError }

            setUsername={ setUsername }
            setPassword={ setPassword }
            onClick={ () => {
                ReactGA.event({
                    category: 'Extension Login Page',
                    action: "Completed Login Form"
                });
                onClick()
            }} 
        />
    )
}
  
  export default LoginContainer;