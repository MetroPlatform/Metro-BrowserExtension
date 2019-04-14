import "../img/metroLogo.png"
import { fetchText, fetchJson } from "./utils/network";
import { clearContextMenu, createContextMenuButton } from "./utils/contextMenu";
import Settings from "./utils/settings"
import browser from "webextension-polyfill"

import Metro from "./app/services/metro";

// DEV
// const CLIENT_ID = "tJE8Ai7etgL6hzFmcejDfRqCUYSEDY7yvxbtDh8r"
// const CLIENT_SECRET = "ZMWkk4VUr8v1aVUI9YrSlb5FRV7b2Ve2sJoWLJRQlvTq8R1ArhxZry5B0aWmNQzrKmbpEqkaVaMLwr2n5mWxNLb1ANiR6cyA9Qz4NF8syNemQoGDNz3zgTo1Kg65uC6u"

// PROD
const CLIENT_ID = "sgAX9NZXAxBAQsbXxWEEDcAuglvgMVVUwYuUGyZV"
const CLIENT_SECRET = "dwfUDSwB264Si82qfvCvZn7xOKmwWyIKEaoxY7wH6ULc3vMvCEQHWItainME0FOK64Wcl8NVVYgaeLlD53QGrAXid3L5F17IVAlNnpZws54Zdw7q32fkeSelSEEVa0Ey"

const settings = new Settings()
const metroClient = new Metro(CLIENT_ID, CLIENT_SECRET)

const METRO_BASE = 'https://getmetro.co'

const id = chrome.runtime.id;

start()

/*
*         ENTRY POINT
*    ( from Script Loader )
*
*/
async function start() {
  await metroClient.setup()
  setUpListeners()
}

/*
*         Listeners
*/
function setUpListeners() {
  browser.runtime.onMessage.addListener(async (msg, sender) => {
    try {
      switch (msg.method) {
        case "loadDatasources":
          // Load and run datasources
          let datasources = await loadDatasources(msg.matchingUrl, msg.devMode)
          datasources.forEach(async (ds) => {
            const user = await metroClient.profile.profile()
            console.log(user)
            load(ds, sender.tab, user.username)
          })
          return datasources;
        case "pushDatapoint":
          // Push a datapoint
          pushToLambda(msg);
          break;
        case "pause":
          pauseMetro(msg.seconds);
          break;
        case "unPause":
          unPauseMetro();
          break;
        case "userIsLoggedIn":
          return await metroClient.loggedIn()
        case "loggedIn":
          metroClient.setup();
          break;
        case "contextMenu-create":
          // Handle the creation of a new right-click menu button
          callback(createContextMenuButton(msg));
          break;
        case "contextMenu-removeAll":
          // Clear all contextMenu items
          clearContextMenu();
          break;
        case "loadHTML":
          // Loads a HTML file from the extension and returns it.
          fetch(chrome.extension.getURL("src/static/" + msg['file']))
            .then(data => data.json())
            .then(data => callback(data))

          break;
      }
    } catch (err) {
      console.error(err)
      console.log(`%c[ Metro ] Error running command from scriptLoader`, 'color: red')
      throw err
    }
  })
}

            ///////////////////////////
            /// LOADING DATASOURCES ///
            ///////////////////////////

/*
    Loads the DataSources for a given url
*/
async function loadDatasources(url, devMode) {
  console.log(`[ Metro ] Loading DataSources for url ${url} ${devMode ? "\nDEV MODE: ON" : ""}`)

  let datasources;
  if (devMode) {
    const fetchUrl = `${await settings.getSync("devModeUrl")}/manifest.json?t=${Date.now()}`
    let manifest = await fetchJson(fetchUrl)
    // Set up dummy data
    datasources = [{
      projects: [],
      name: manifest.name,
      sites: manifest.sites,
      slug: manifest.name,
      baseURL: await settings.getSync("devModeUrl")
    }]
  } else {
    datasources = await metroClient.profile.datasources()
    datasources.map(ds => {
      ds.baseURL = buildDatasourceUrl(ds)
      return ds;
    })
  }

  console.log("[ Metro ] Filtering DataSources...")
  datasources = datasources.filter(ds => shouldRun(ds, url))
  let filteredCount = datasources.length;
  console.log(`%c[ Metro ] Done! Got ${filteredCount} DataSources`, 'color: green')

  return datasources
}

/*
    Given the details of a DataSource, gets it from GitHub and runs it.
*/
const load = async (datasource, tab, username) => {
  console.log(`[ Metro ] Loading DataSource ${datasource.name}...`)
  let feedPromises = datasource.feeds.map(async (feedUrl) => {
    const feedInfo = await metroClient._get(feedUrl)
    return feedInfo.slug
  })
  const projects = await Promise.all(feedPromises)
  let baseURL = datasource.baseURL

  let scriptURL = baseURL + "/plugin.js?t=" + Date.now();
  let schemaURL = baseURL + "/schema.json?t=" + Date.now();

  runDataSource(tab.id, datasource, scriptURL, schemaURL, projects, username);
}

/*
    Given a DataSource's name, builds the url for the DataSource
*/
function buildDatasourceUrl(datasource) {
  return "https://raw.githubusercontent.com/MetroPlatform/Metro-DataSources/master/datasources/" + datasource.slug
}

/*
*   Checks if the DataSource should run on this URL
*/
const shouldRun = function (datasource, url) {
  let siteRegexes = datasource.sites

  for (var i = 0; i < siteRegexes.length; i++) {
    let regex = new RegExp(siteRegexes[i]);

    // If the current site matches one of the manifest regexes...
    if (regex.test(url)) {
      return true;
    } else {
      continue;
    }
  }

  return false;
}

/*
 * Actually runs the datasource given the scriptURL and the schemaURL.
 */
async function runDataSource(tabID, datasource, scriptURL, schemaURL, projects, username) {
  let script = await fetchText(scriptURL)
  let schema = await fetchJson(schemaURL)
  if (!datasource.hasOwnProperty('title')) {
    console.error(`Datasource ${datasource.name} has no 'title' field`)
    datasource['title'] = datasource.name
  }
  if (!datasource.hasOwnProperty('url')) {
    console.error(`Datasource ${datasource.name} has no 'title' field`)
    datasource['url'] = "https://getmetro.co/TODO"
  }
  let msg = {
    "method": "initDatasource",
    "data": {
      "datasourceDetails": datasource,
      "slug": datasource.slug,
      "datasource": datasource.slug,
      "username": username,
      "projects": projects,
      "schema": schema
    }
  }

  browser.tabs.sendMessage(tabID, msg).then(res => {
    if (res == true) {
      browser.tabs.executeScript(tabID, { "code": script }).then(() => {
        console.log("%c[ Metro ] Successfully started DataSource " + datasource.title, 'color: green')
      })
    }
  })
}

            //////////////////////
            ///  PUSHING DATA  ///
            //////////////////////

/**
 * Actually pushes the datapoint to the lambda function.
 */
const pushToLambda = async (datapointDetails) => {
  let datasource = datapointDetails['ds'];
  let username = datapointDetails['username'];
  let projects = datapointDetails['projects'];
  let datapoint = datapointDetails['datapoint'];

  const metroPaused = await settings.paused()
  const devMode = await settings.devMode()

  // Only run if the extension is enabled
  if (metroPaused) {
    console.log("%c[ Metro ] Extension paused, not pushing", 'color: red')
    return;
  } else if(devMode) {
    console.log("%c[ Metro ] Not publishing the datapoint as running in dev mode.", 'color: red');
    return;
  }
  
  const apiKey = await metroClient.profile.getApiKey()

  const data = {
    "datasource": datasource,
    "projects": projects,
    "timestamp": Date.now(),
    "data": datapoint,
    "user": username
  };

  console.log("[ Metro ] Pushing datapoint");

  metroClient.sendDatapoint(data, apiKey.key)
}

            ///////////////////////
            /// PAUSE / UNPAUSE ///
            ///////////////////////

/*
*   Pauses Metro and starts a timer to un-pause it
*/
const pauseMetro = async (seconds) => {
  console.debug("Pausing Metro.")
  await settings.setPaused(true)
  await settings.setUnpauseTime(Date.now() + seconds * 1000)

  setTimeout(() => {
    unPauseMetro()
  }, seconds * 1000)
}

/*
*   Unpauses Metro and clears the timer
*/
const unPauseMetro = async () => {
  console.log("Unpausing Metro.")
  await settings.setPaused(false)
  await settings.setUnpauseTime(null)
}

            //////////////////////
            /// ADMINISTRATION ///
            //////////////////////

/*
* Adds a listener which does initial setup
*/
chrome.runtime.onInstalled.addListener(function () {
  clearContextMenu();
  // Set defaults
  settings.setHideCounter(false)
  settings.setDevMode(false);
});

chrome.runtime.setUninstallURL(METRO_BASE + '/extension/uninstall/')

/*
* Adds a listener which allows the website to communicate with the extension
*/
chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
  // Allows the Metro website to check if the extension is installed
  console.log("[ Metro ] Received external message from:");
  console.log(sender)
  if ((msg.action == "id") && (msg.value == id)) {
    sendResponse({ id: id });
  }

  return true;
});