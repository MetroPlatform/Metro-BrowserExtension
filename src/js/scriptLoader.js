import $ from "jquery"
import browser from "webextension-polyfill";

import { clearContextMenuMsg } from "./utils/contextMenu";
import { setUpCounter } from "./utils/dom";
import MetroClient from "./metroClient";
import Settings from "./utils/settings";
import BackgroundMessenger from "./utils/messenger";

window.registerDataSource = registerDataSource // So that the DataSource can call it.

var ACTIVE_DATASOURCES = {};

const settings = new Settings()
const messenger = new BackgroundMessenger()

start()

/*
*           ENTRY POINT
*/
async function start() {
    console.log("%c[ Metro ] Starting", 'color: green')
    const metroPaused = await settings.paused()
    const loggedIn = await browser.runtime.sendMessage({
        method: "userIsLoggedIn"
    })

    // Only run if the extension is enabled
    if (metroPaused) {
        console.log("%c[ Metro ] Metro is paused.", 'color: red')
        return;
    } else if(!loggedIn) {
        console.log("%c[ Metro ] Not logged in.", "color: red")
        return;
    }

    setUpListeners();
    clearContextMenuMsg();
    const devMode = await settings.devMode()
    let datasources = await messenger.loadDatasources(window.location.toString(), devMode)

    // Set up the counter
    let count = datasources.length;
    let hideCounter = await settings.hideCounter()
    if(!(hideCounter == true) && datasources.length > 0) {
        console.log(`%c[ Metro ] Setting up counter for ${count} DataSources`, 'color: green')
        setUpCounter(count)
    } else if(hideCounter == true) {
        console.log("%c[ Metro ] DataSource counter disabled", 'color: red')
    } else if (datasources.length == 0) {
        console.log("%c[ Metro ] No DataSources loaded", 'color: red')
        setUpCounter(0)
    } else {
        console.log("%c[ Metro ] Not loading counter", 'color: red')
    }
}

/*
*   Sets up the listeners required to handle communication
*   from the background script
*/
function setUpListeners() {
    /*
    *   Gets the favicon for the current page and returns its href
    */
   browser.runtime.onMessage.addListener(msg => {
        if(msg.sender === "popup" && msg.method === "getFavicon") {
            try {
                const faviconUrl = document.querySelector('link[rel="shortcut icon"]').href;
                return Promise.resolve(faviconUrl)
            } catch(err) {
                const faviconUrl = document.querySelector('link[rel="icon"]').href;
                return Promise.resolve(faviconUrl)
            }
        }
    })

    /*
    *   Returns the list of currently active DataSources
    */
    browser.runtime.onMessage.addListener(msg => {
        if(msg.method == "getActiveDataSources") {
            return Promise.resolve(ACTIVE_DATASOURCES)
        }
    })

    /*
    *   Initializes the given DataSource
    */
    browser.runtime.onMessage.addListener(msg => {
        if (msg.method == "initDatasource") {
            try {
                initDataSource(msg.data)
                return Promise.resolve(true);
            } catch (e) {
                console.error(e)
                return Promise.resolve(false);
            }
        } else {
            return Promise.resolve(false);
        }
    })
}

/*
  Initialized a DataSource by creating its MetroClient and adding it to the currently active datasources
*/
const initDataSource = function (data) {
    console.log(`%c[ Metro ] Initializing DataSource ${data.slug}...`, 'color: green')
    let slug = data.slug
    let datasource = data['datasource']
    let username = data['username']
    let projects = data['projects']
    let schema = data['schema']

    if(slug in ACTIVE_DATASOURCES) {
        throw new Error(`[ Metro ] DataSource ${slug} already active.`)
    }

    // Create the client:
    var metroClient = new MetroClient(datasource, data.datasourceDetails.title, slug, username, projects, schema);

    ACTIVE_DATASOURCES[slug] = {
        'metroClient': metroClient,
        'details': data['datasourceDetails']
    }
    console.log("[ Metro ] Done!")
}

/*
  The DataSource calls this to start itself
*/
function registerDataSource(datasource) {
    console.log("%c[ Metro ] Registering Datasource:", 'color: green')
    if (datasource['name'] in ACTIVE_DATASOURCES) {
        var ds = ACTIVE_DATASOURCES[datasource['name']];
        ds['datasource'] = datasource;

        ds['datasource'].initDataSource(ds['metroClient']);

        console.log("%c[ Metro ] DataSource " + datasource['name'] + " enabled.", 'color: green');
    } else {
        console.log("%c[ Metro ] DataSource " + datasource['name'] + " not initialized. Won't start it.", 'color: red')
    }
}