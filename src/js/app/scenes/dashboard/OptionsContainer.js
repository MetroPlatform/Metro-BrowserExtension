import React, { useEffect, useState } from "react";

import Settings from "../../../utils/settings";
import Options from "./Options";
import Loading from "../../common/components/Loading";
import SuccessTick from "../../common/components/SuccessAnimation";
import { setIndicator } from "../../services/indicator";

const settings = new Settings()

const OptionsContainer = ({ metroClient, onLogout, setTextAlert }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState(null);

    // Checkbox values
    const [devMode, setDevMode] = useState(false);
    const [hideCounter, setHideCounter] = useState(true);

    // Input Values
    const [devModeUrl, setDevModeUrl] = useState('')

    const initialize = async () => {
        try {
            const currentUser = await metroClient.profile.profile()
            const devModeSettings = await settings.devMode() || false;
            const hideCounterSettings = await settings.hideCounter() || false;
            const devModeUrlSettings = await settings.devModeUrl() || ''

            setDevMode(devModeSettings)
            setDevModeUrl(devModeUrlSettings)
            setHideCounter(hideCounterSettings)
            setUser(currentUser)
            setIsLoading(false)
            setIndicator()
        } catch(err) {
            console.error(err)
            setError(true)
        }
    }

    useEffect(() => {
        initialize()
    }, [])

    /////////////////////////
    /// ONCLICK FUNCTIONS ///
    /////////////////////////

    const saveSettings = async () => {
        if(devMode == true) {
            setTextAlert("Developer Mode")
        } else {
            setTextAlert("")
        }
        await settings.setHideCounter(hideCounter)
        await settings.setDevMode(devMode)
        await settings.setDevModeUrl(devModeUrl)
        setSuccess(true)
        setIndicator()
    }

    const logout = () => {
        metroClient.logout()
        onLogout()
    }

    /////////////////
    /// RENDERING ///
    /////////////////

    if(error == true) {
        return "Error!"
    } else if(isLoading == true) {
        return <Loading />
    }


    return (
        <Options 
            user={user}

            hideCounter={ hideCounter }
            setHideCounter={ setHideCounter }
            devMode={ devMode }
            setDevMode={ setDevMode }

            devModeUrl={ devModeUrl }
            setDevModeUrl={ setDevModeUrl }

            success={success}
            setSuccess={setSuccess}
            SuccessAnimation={ SuccessTick }

            logout={logout}
            saveSettings={saveSettings} />
    )
}
  
export default OptionsContainer;