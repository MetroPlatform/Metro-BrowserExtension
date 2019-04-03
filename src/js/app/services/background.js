import browser from "webextension-polyfill";

import Settings from "../../utils/settings";

const settings = new Settings()

class Background {

    /*
    *   Gets a list of the currently active DataSources
    */
    datasources = {
        all: () => {
            console.log("howdy")
        }
    }
}

export default Background;