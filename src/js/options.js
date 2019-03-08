import "bootstrap"
import $ from "jquery"
import 'bootstrap/dist/css/bootstrap.min.css';

import Settings from "./utils/settings";
import "../css/options.css"

let settings = new Settings()

/**
 * Displays all the extensions stored data.
 */
function dumpStoredData() {
  chrome.storage.sync.get(null, function(items) {
    for(var key in items) {
      // Add the settings node to the Settings list.
      if(key.indexOf("Settings-") == 0) {
        let li = $('<li/>');
        li.addClass("list-group-item");
        var setting_name = $('<span />').addClass('text-main').html(key + ": ").appendTo(li);
        li.append(items[key]);
        $("#settingsList").append(li);
      } else {
        // Just dump out the rest.
        document.getElementById('storedData').innerHTML += key + ": " + items[key] + "<br/>";
      }
    }
  });
}

/**
 * Registers a handler that when the clearStorage button is pressed, clears the
 * storage. To be used in dev mode.
 */
function setClearStorageHandler() {
  let button = document.getElementById("clearStorageButton");

  button.addEventListener('click', function() {
    console.log("Storage cleared.");
    chrome.storage.sync.clear();
    dumpStoredData();
  });
}

/**
 * By default, links in the popup don't open...
 * This sets any link to open in new tabs when clicked.
 */
function allowLinks() {
  var links = document.getElementsByTagName("a");
  for(var i = 0; i < links.length; i++) {
    (function () {
      var ln = links[i];
      var location = ln.href;
      ln.onclick = function () {
        chrome.tabs.create({active: true, url: location});
      };
    })();
  }
}

/**
 * Sets the correct initial value for a checkbox and stores a click handler for
 * its change. It also runs the clickCallback after setting the initial value
 * of the checkboxes.
 */
async function initCheckbox(id, val) {
  settings.setSync(id, val)
  let button = document.getElementById(id);
  button.checked = val
}

async function setUpListener(id, callback) {
  let button = document.getElementById(id);
  button.addEventListener('click', async () => {
    await settings.setSync(id, button.checked)
    callback();
    setUpAlert();
  });
}

/**
 * Sets the URL input box for dev mode.
 */
function setDevModeGithub() {
  let inputBox = document.getElementById("devModeGithubInput");

  // Set its value to the stored URL:
  chrome.storage.sync.get("Settings-devModeGithubURL", function(items) {
    if(chrome.runtime.error) {
      console.log("Dev Mode Github URL has never been set. Setting it to \" \".");
      // Assume worst - set it manually to "".
      let storageItem = {};
      storageItem["Settings-devModeGithubURL"] = " ";
      chrome.storage.sync.set(storageItem);
    } else {
      let val = items["Settings-devModeGithubURL"];
      if(val != undefined) {
        inputBox.value = val;
      }
      
    }
  });

  // Now set it to store when enter is pressed in it:
  inputBox.addEventListener('keyup', function(event) {
    event.preventDefault();

    if(event.keyCode == 13) {
      let storageItem = {};
      storageItem["Settings-devModeGithubURL"] = inputBox.value;
      chrome.storage.sync.set(storageItem);
    }
  });
}

/**
 * Makes developer mode hidden unless the devModeCheckbox is set and displays
 * any data it initially should.
 */
function initDevMode() {
  console.log("hello")
  if(!document.getElementById("devModeCheckbox").checked) {
    // If not in dev mode, hide the devModeContainer.
    document.getElementById("devModeContainer").className += " invisible";
  } else {
    console.log("Checked");
    // In dev mode:
    // Remove invisible class
    let container = document.getElementById("devModeContainer");
    container.className = container.className.replace("invisible", '');

    dumpStoredData();
    setClearStorageHandler();
    setDevModeGithub();
  }
}

const getDataFromURL = function loadURL(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      callback(xhr.responseText);
    }
  }

  xhr.send();
}

const fetchFromUrl = (url) => {
  /*
    Fetches data and throws errors if not successful
  */
  return fetch(url, {
    credentials: 'include',
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      console.error(`[ Metro ] Error fetching from URL ${url}`)
      console.log("Response:")
      console.log(response)
      console.log("Headers:")
      response.headers.forEach(console.log)
      switch(response.status) {
        case 404:
          throw new Error(`Encountered Error 404 while fetching from URL ${url}`);
        case 500:
          throw new Error(`Encountered Error 500 while fetching from URL ${url}`);
        default:
          throw new Error(`Error occurred while fetching URL ${url}`)
      }  
    }
  })
}

/**
*** Populates the user information in the browser extension with the data from the Metro API
**/
const populateUserInfo = function(response) {
  console.log(response)
  if(response['status'] == 1) {
    let username = response['content']['username'];
    $('#username').append(username);
  } else {
    $('#username').addClass('text-danger').text('ERROR');
  }

}

/*
*
*/
const populateVersionInfo = function(response) {
  let ver = chrome.runtime.getManifest().version;
  $('#version').append(ver);

  response = JSON.parse(response);
  let currentVer = response['content']['chromeVersion'];

  currentVer = parseInt(currentVer.replace(/\D/g,''));
  ver = parseInt(ver.replace(/\D/g,''));

  if(currentVer > ver) {
    $('#newVersion').removeClass('d-none');
  }
}

async function setUpAlert() {
  console.log("Setting up alert")
  let enabledVal = await settings.enabled() 
  let devModeVal = await settings.getSync('devModeCheckbox')

  let badgeColor = 'red';
  let badgeText = '';
  let alertText = '';

  if(devModeVal) {
    badgeText = '{  }'
    badgeColor = '#bc880b'
    alertText += 'Dev mode enabled'
  } 
  
  if(!enabledVal) {
    badgeText = '!'
    badgeColor = 'red'
    alertText += alertText.length > 0 ? '<br>' : ''
    alertText += 'Metro is disabled.'
  }

  $('#alert').html(alertText)
  chrome.browserAction.setBadgeText({ text: badgeText });
  chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
  console.log(`Alert text: ${alertText}`)
  console.log(`Badge text: ${badgeText}`)
  console.log(`Badge color: ${badgeColor}`)
}


// Entry point:
document.addEventListener('DOMContentLoaded', async () => {
  fetchFromUrl("https://getmetro.co/api/profile/").then(populateUserInfo)
  getDataFromURL("https://getmetro.co/api/extension/status", populateVersionInfo);
  let enabledVal = await settings.enabled() 
  let counterVal = await settings.getSync('showCounterCheckbox') 
  let devModeVal = await settings.devMode()
  console.log(devModeVal)

  setUpAlert()

  initCheckbox("shouldMonitorCheckbox", enabledVal);
  setUpListener("shouldMonitorCheckbox", () => {})
  initCheckbox("showCounterCheckbox", counterVal);
  setUpListener("showCounterCheckbox", () => {})
  initCheckbox("devModeCheckbox", devModeVal);
  setUpListener("devModeCheckbox", initDevMode)
  initDevMode()

  allowLinks();
});
