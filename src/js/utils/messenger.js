import browser from "webextension-polyfill";

class BackgroundMessenger {
    async webRequest(url) {
        console.log("Sending web request to " + url)
        let response = await browser.runtime.sendMessage({
            method: 'webRequest', 
            url: url
        })

        if(response.status == 1) {
            return response.content
        } else {
            throw new Error(reaponse.message)
        }
    }

    async loadDatasources(url, devMode) {
        let datasources = await browser.runtime.sendMessage({
            method: 'loadDatasources', 
            matchingUrl: url,
            devMode: devMode
        })
        return datasources
    }
}

export default BackgroundMessenger;