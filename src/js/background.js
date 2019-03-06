import "../img/metroLogo.png"
import { fetchText, fetchJson, fetchMetroAPI, postMetroAPI } from "./utils/network";
import { clearContextMenu, createContextMenuButton } from "./utils/contextMenu";
import Settings from "./utils/settings"
import browser from "webextension-polyfill"

let settings = new Settings()
let USER = {}
// const METRO_BASE = 'http://127.0.0.1:8000'
const METRO_BASE = 'https://getmetro.co'

const id = chrome.runtime.id;
/*
*         ENTRY POINT
*    ( from Script Loader )
*
*/
start()

async function start() {
  USER = await fetchMetroAPI(METRO_BASE + '/api/profile/')
  console.log(USER)
  setUpListeners()
}

function setUpListeners() {
  browser.runtime.onMessage.addListener(async (msg, sender) => {
    try {
      switch(msg.method) {
        case "loadDatasources":
          // Load and run datasources
          let datasources = await loadDatasources(msg.matchingUrl, msg.devMode)
          datasources.forEach(ds => { 
            load(ds, sender.tab, USER.username)
          })
          return datasources;
        case "pushDatapoint":
          // Push a datapoint
          pushToLambda(msg);
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
    } catch(err) {
      console.error(err)
      console.log(`%c[ Metro ] Error running command ${msg} from scriptLoader`, 'color: red')
      throw err
    }
  })
}

/*
    Loads the DataSources for a given url
*/
async function loadDatasources(url, devMode) {
  console.log(`[ Metro ] Loading DataSources for url ${url} ${devMode ? "\nDEV MODE: ON" : ""}`)
  let fetchUrl = devMode ? `${await settings.getSync("devModeGithubURL")}/manifest.json?t=${Date.now()}`
                           : 
                           METRO_BASE + "/api/profile/datasources"

  
  let datasources;
  if(devMode) {
    let manifest = await fetchJson(fetchUrl)
    // Set up dummy data
    datasources = [{
      projects: [],
      name: manifest.name,
      sites: manifest.sites,
      slug: manifest.name,
      baseURL: await settings.getSync("devModeGithubURL")
    }]
  } else {
    let data = await fetchMetroAPI(fetchUrl)
    // Get real data 
    datasources = data.datasources
    datasources.map(ds => {
      ds.baseURL =  buildDatasourceUrl(ds)
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
function load(datasource, tab, username) {
  console.log(`[ Metro ] Loading DataSource ${datasource.name}...`)
  let projects = datasource.projects.map(pj => pj.slug)
  let slug = datasource.slug
  let baseURL = datasource.baseURL

  let scriptURL = baseURL + "/plugin.js?t=" + Date.now();
  let schemaURL = baseURL + "/schema.json?t=" + Date.now();

  runDataSource(tab.id, datasource.name, scriptURL, schemaURL, projects, slug, username);
}

/*
    Given a DataSource's name, builds the url for the DataSource
*/
function buildDatasourceUrl(datasource) {
  return "https://raw.githubusercontent.com/MetroPlatform/Metro-DataSources/master/datasources/" + datasource.name
}

/*
    Checks if the DataSource should run on this URL
*/
const shouldRun = function(datasource, url) {
  let siteRegexes = datasource['sites']

  for(var i=0; i<siteRegexes.length; i++) {
    let regex = new RegExp(siteRegexes[i]);

    // If the current site matches one of the manifest regexes...
    if(regex.test(url)) {
      return true;
    } else {
      return false;
    }
  }
}

/**
 * Actually runs the datasource given the scriptURL and the schemaURL.
 */
async function runDataSource(tabID, datasource, scriptURL, schemaURL, projects, slug, username) {
  let script = await fetchText(scriptURL)
  let schema = await fetchJson(schemaURL)
  let msg = {
    "method": "initDatasource",
    "data": {
      "slug": slug,
      "datasource": datasource,
      "username": username,
      "projects": projects,
      "schema": schema
    }
  }

  browser.tabs.sendMessage(tabID, msg).then(res => {
    if(res == true) {
      browser.tabs.executeScript(tabID, {"code": script}).then(() => {
        console.log("%c[ Metro ] Successfully started DataSource " + datasource, 'color: green')
      })
    }
  })
}

/**
 * Actually pushes the datapoint to the lambda function.
 */
const pushToLambda = function(datapointDetails) {
    let datasource = datapointDetails['ds'];
    let username = datapointDetails['username'];
    let projects = datapointDetails['projects'];
    let datapoint = datapointDetails['datapoint'];

    var xhr = new XMLHttpRequest();
    var url = "https://push.getmetro.co";

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");

    let data = {
      "datasource": datasource,
      "projects": projects,
      "timestamp": Date.now(),
      "data": datapoint,
      "user": username
    };

    console.log("[ Metro ] Pushing: ");
    console.log(data);

    // Only send datapoint to lambda if not in dev mode:
    chrome.storage.sync.get("Settings-devModeCheckbox", function(items) {
      if(chrome.runtime.error) {
        throw new Error(`%c[ Metro ] Runtime error ${chrome.runtime.error}`, 'color: red')
      } else {
        if(items["Settings-devModeCheckbox"]) {
          console.log("[ Metro ] Not publishing the datapoint as running in dev mode.");
        } else {
          // Push with the API key:
          getKeyAndPush(xhr, JSON.stringify(data));
        }
      }
    });
}

/*
 * Gets the API Gateway key and pushes the data with it.
 */
const getKeyAndPush = function(xhr, data) {
  let keyRequester = new XMLHttpRequest();
  keyRequester.open("GET", METRO_BASE + "/api/profile/api_key/", true);

  keyRequester.onreadystatechange = function() {
    if(keyRequester.readyState == 4) {
      let keyResponse = JSON.parse(keyRequester.responseText);
      let apiKey = keyResponse['content']['key'];

      xhr.setRequestHeader("X-API-Key", apiKey);

      console.log("[ Metro ] Pushing data with API key.");
      xhr.send(data);
    }
  }

  keyRequester.send();
}

/*
* Adds a listener which does initial setup
*/
chrome.runtime.onInstalled.addListener(function() {
  clearContextMenu();
  // Set defaults
  settings.setSync("shouldMonitorCheckbox", true);
  settings.setSync("showCounterCheckbox", true);
  settings.setSync("devModeCheckbox", false);

  registerWithMetro()
});

function registerWithMetro() {
  console.log("%c[ Metro ] Registering extension installed.", 'color: green')
  let ver = chrome.runtime.getManifest().version;
  postMetroAPI(METRO_BASE + '/api/profile/', {
      extension_installed: true,
      extension_version: ver
    })
    .then(res => {
      console.log("[ Metro ] Success! Response:")
      console.log(res)
    })
}

chrome.runtime.setUninstallURL(METRO_BASE + '/api/uninstall/')

/*
* Adds a listener which allows the website to communicate with the extension
*/
chrome.runtime.onMessageExternal.addListener( function(msg, sender, sendResponse) {
  // Allows the Metro website to check if the extension is installed
  console.log("[ Metro ] Received external message from:");
  console.log(sender)
  if ((msg.action == "id") && (msg.value == id)) {
      sendResponse({id : id});
  }
  
  return true;
});