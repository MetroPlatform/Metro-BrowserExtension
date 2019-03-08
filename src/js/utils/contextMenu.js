import browser from "webextension-polyfill"

/*
* Create a contextMenu item
*/
const createContextMenuButtonMsg = function (buttonDetails, buttonFunction) {
    buttonDetails['method'] = 'contextMenu-create';
    // Send message telling background script to create the `contextMenu` button
    browser.runtime.sendMessage(buttonDetails)
                    .then(response => {
                        // Create listener which checks `functionName` and calls the appropriate function
                        chrome.runtime.onMessage.addListener(function (message, sender, callback) {
                            if (message['type'] == buttonDetails['type'] && message['functionName'] == buttonDetails['functionName']) {
                                callback(buttonFunction(message['contextInfo'])); // Pass the contextInfo from the contextMenu callback
                            }
                        });
                    })
                    .catch(reason => {
                        console.log(`%c[ Metro ] Failed to create contextMenu button`)
                        console.log(`%c ${buttonDetails}`)
                    })
}

/*
*   Creates a contextMenu button and sets up the callback to run on-click
*
*   When the button is clicked, the callback will send a message from the
*   background script to the currently focused tab, telling it the name
*   of the function which must be executed. The content script in the tab then
*   runs the function.
*/
const createContextMenuButton = function(message) {
    chrome.contextMenus.create({
      title: message['buttonTitle'],
      contexts: message['contexts'],
      onclick: function(info, tab) {
        // When the button is clicked, we send a msg to the content script
        // signaling to execute the function `functionName`
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: message['type'],
            functionName: message['functionName'],
            contextInfo: info // Add the info from the contextMenu context too
          }, function(response) {
            // Here we deal with the response from the buttonFunction
            if(response['status'] == 0) {
              // A status of 0 means that the data which the user provided to the DataSource was considered
              // invalid. If the DataSource wants to inform the user that they have not used the DataSource correctly,
              // then it can return a value `msg` in the object which we will display as an alert to the user.
              //
              // e.g. { status: 0, msg: 'Please highlight a single word, not a sentence'}
  
              console.log("[ Metro ] Error running contextMenu function");
              console.log(response['msg']);
              // FF can't open alerts from the background script, so gotta do it the hacky way
              var alertCode = "alert('" + response['msg'] + "');";
              chrome.tabs.executeScript({'code': alertCode});
            }
          });
        });
      }
    });
    return true;
  }

/*
    Clears the right-click contextMenu
*/
const clearContextMenuMsg = () => {
    browser.runtime.sendMessage({ method: 'contextMenu-removeAll' })
        .then(res => console.log("[ Metro ] Cleared contextMenu"))
        .catch(reason => {
            console.log(`%c[ Metro ] Failed to clear contextMenu`, 'color: red')
        })
}

const clearContextMenu = function() {
    chrome.contextMenus.removeAll(function() {
      clearContextMenuStorage();
      console.log("[ Metro ] ContextMenu cleared");
    });
  }
  
  const clearContextMenuStorage = function() {
    chrome.storage.local.remove("Metro-Core-ContextMenuButtons", function() {
      console.log("[ Metro ] ContextMenuState cleared");
    })
  }

export { createContextMenuButton, createContextMenuButtonMsg, clearContextMenu, clearContextMenuMsg };