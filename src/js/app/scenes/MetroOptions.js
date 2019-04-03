import React, { useEffect, useState } from "react";

import Welcome from "./welcome/Welcome";
import DashboardContainer from "./dashboard/DashboardContainer";

import Metro from "../services/metro";
import Loading from "../common/components/Loading";

// const CLIENT_ID = "tJE8Ai7etgL6hzFmcejDfRqCUYSEDY7yvxbtDh8r"
// const CLIENT_SECRET = "ZMWkk4VUr8v1aVUI9YrSlb5FRV7b2Ve2sJoWLJRQlvTq8R1ArhxZry5B0aWmNQzrKmbpEqkaVaMLwr2n5mWxNLb1ANiR6cyA9Qz4NF8syNemQoGDNz3zgTo1Kg65uC6u"

const CLIENT_ID = "sgAX9NZXAxBAQsbXxWEEDcAuglvgMVVUwYuUGyZV"
const CLIENT_SECRET = "dwfUDSwB264Si82qfvCvZn7xOKmwWyIKEaoxY7wH6ULc3vMvCEQHWItainME0FOK64Wcl8NVVYgaeLlD53QGrAXid3L5F17IVAlNnpZws54Zdw7q32fkeSelSEEVa0Ey"

const metroClient = new Metro(CLIENT_ID, CLIENT_SECRET)

/*
*   The Metro Options app
*/
const MetroOptions = () => {
    /*
            Hooks
    */
    const [notUsed, forceUpdate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const [loggedIn, setLoggedIn] = useState(false);

    /*
        Runs when the DOM updates
    */
    useEffect(() => {
        try {
            initialize()
        } catch(err) {
            console.error(err)
            setError(true)
        }
        return;
    }, [])

        ////////////////////////////////
        ///     HELPER FUNCTIONS     ///
        ////////////////////////////////

    const initialize = async () => {
        console.debug("Setting up...")
        await metroClient.setup()
        console.debug("Done!")
        const userLoggedIn = await metroClient.loggedIn()
        setLoggedIn(userLoggedIn)
        console.log(userLoggedIn ? "Automatically logged in!" : "Failed to log in automatically.")
        setIsLoading(false)
    }

    const update = async () => {
        const userLoggedIn = await metroClient.loggedIn()
        setLoggedIn(userLoggedIn)
        forceUpdate(!notUsed)
    }

        ////////////////////////
        ///     RENDERING    ///
        ////////////////////////

    if(error) {
        return "Error"
    } else if(isLoading) {
        return <Loading />
    }

    if(loggedIn) {
        return <DashboardContainer onLogout={ update } metroClient={ metroClient } />
    } else {
        return <Welcome onLogin={ update } metroClient={ metroClient } />
    }
}

export default MetroOptions;