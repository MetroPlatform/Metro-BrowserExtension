import browser from "webextension-polyfill";

import Settings from "../../utils/settings";

const settings = new Settings()

const setIndicator = async () => {
    const devMode = await settings.devMode()
    const paused = await settings.paused()
    if(paused) {
        setPausedIndicator()
    } else if(devMode) {
        setDevModeIndicator()
    } else {
        setEmptyIndicator()
    }
}

const setEmptyIndicator = async () => {
    await browser.browserAction.setBadgeText({ text: "" });
}

const setDevModeIndicator = async () => {
    console.debug("Setting dev mode indicator")
    const currentText = await browser.browserAction.getBadgeText({})
    const currentColor = await browser.browserAction.getBadgeBackgroundColor({})

    await browser.browserAction.setBadgeText({ text: "{  }" });
    await browser.browserAction.setBadgeBackgroundColor({color: "#bc880b"});
}

const setPausedIndicator = async () => {
    console.debug("Setting paused indicator")
    const currentText = await browser.browserAction.getBadgeText({})
    const currentColor = await browser.browserAction.getBadgeBackgroundColor({})

    await browser.browserAction.setBadgeText({ text: "!" });
    await browser.browserAction.setBadgeBackgroundColor({color: "red"});
}

const removeDevModeIndicator = async () => {
    const paused = await settings.paused()
    if(paused) {
        setPausedIndicator()
    } else {
        setEmptyIndicator()
    }
}

const removePausedIndicator = async () => {
    const devMode = await settings.devMode()
    if(devMode) {
        setDevModeIndicator()
    } else {
        setEmptyIndicator()
    }
}

export { setIndicator, setDevModeIndicator, setPausedIndicator, removeDevModeIndicator, removePausedIndicator, setEmptyIndicator };