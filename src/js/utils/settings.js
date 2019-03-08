import browser from "webextension-polyfill";

class Settings {
    constructor() {
        this.prefix = "Settings-";
    }

    async enabled() {
        const settingName = "shouldMonitorCheckbox"
        let enabled = await this.getSync(settingName)
        return enabled
    }

    async showCounter() {
        const settingName = "showCounterCheckbox"
        let enabled = await this.getSync(settingName)
        return enabled
    }

    async devMode() {
        const settingName = "devModeCheckbox"
        return await this.getSync(settingName)
    }

    async getSync(name) {
        return await browser.storage.sync.get(this.prefix + name)
                                        .then(res => res[this.prefix + name])
                                        .catch(reason => console.log(reason))
    }

    setSync(name, value) {
        let setting = {}
        setting[this.prefix + name] = value
        browser.storage.sync.set(setting)
                            .then(() => console.log(`Set ${name} to ${value}`))
                            .catch(reason => console.log(reason))
    }
}

export default Settings