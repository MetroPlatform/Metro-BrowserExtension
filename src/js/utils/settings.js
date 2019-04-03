import browser from "webextension-polyfill";

class Settings {
    constructor() {
        this.prefix = "Settings-";
    }

    /*
    *       GETTERS
    */

    async paused() {
        const settingName = "paused"
        let enabled = await this.getSync(settingName)
        return enabled
    }

    async unpauseTime() {
        const settingName = "pauseTimeLeft"
        let enabled = await this.getSync(settingName)
        return enabled
    }

    async hideCounter() {
        const settingName = "hideCounter"
        let hidden = await this.getSync(settingName)
        return hidden
    }

    async devMode() {
        const settingName = "devMode"
        return await this.getSync(settingName)
    }

    async devModeUrl() {
        const settingName = "devModeUrl"
        return await this.getSync(settingName)
    }

    async getUser() {
        const settingName = "user";
        return await this.getSync(settingName)
    }

    async getCredentials() {
        const settingName = "credentials";
        return await this.getSync(settingName)
    }

    async getActiveTab() {
        const settingName = "activeTab";
        return await this.getSync(settingName);
    }

    async getSync(name) {
        return await browser.storage.sync.get(this.prefix + name)
                                        .then(res => res[this.prefix + name])
                                        .catch(reason => {
                                            console.log(reason);
                                            throw reason;
                                        })
    }

    /*
    *       SETTERS
    */

    setUser(value) {
        this.setSync('user', value)
    }

    setDevMode(value) {
        this.setSync('devMode', value);
    }

    setDevModeUrl(value) {
        this.setSync('devModeUrl', value);
    }

    setHideCounter(value) {
        this.setSync('hideCounter', value);
    }

    setCredentials(value) {
        this.setSync('credentials', value)
    }

    setPaused(value) {
        this.setSync('paused', value)
    }

    setUnpauseTime(value) {
        this.setSync('pauseTimeLeft', value)
    }

    setActiveTab(value) {
        this.setSync('activeTab', value)
    }

    setSync(name, value) {
        let setting = {}
        setting[this.prefix + name] = value
        browser.storage.sync.set(setting)
                            .catch(reason => { 
                                console.error(reason);
                                throw reason;
                            })
    }
}

export default Settings