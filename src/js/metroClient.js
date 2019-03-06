import browser from "webextension-polyfill";
import { addModalInput, hasShadowParent } from "./utils/dom";
import { createContextMenuButtonMsg } from "./utils/contextMenu"

const BUTTON_STATE = "Metro-Core-ContextMenuButtons";

/*
        The client for accessing the Metro API
*/
class MetroClient {
    constructor(datasource, slug, username, projects, schema) {
        this.datasource = datasource;
        this.slug = slug;
        this.username = username;
        this.projects = projects;
        this.schema = schema;
    }

    /**
     * Script to check that the schema of the datasource matches the datapoint.
     * It only validates that the keys match.
     */
    validateDatapoint(schema, datapoint) {
        return this.sameJSONStructure(schema, datapoint);
    }

    /**
     * Returns true if the two objects have the same keys.
     */
    sameJSONStructure(o1, o2) {
        var equal = true;
        for (var i in o1) {
            if (!o2.hasOwnProperty(i)) {
                equal = false;
            }
        }

        return equal;
    }

    // Sends a datapoint to Metro
    sendDatapoint(datapoint) {
        if (this.validateDatapoint(this.schema, datapoint)) {

            let datapointDetails = {
                'method': "pushDatapoint",
                'ds': this.slug,
                'username': this.username,
                'projects': this.projects,
                'datapoint': datapoint
            }
            console.log('%c[ Metro ] Pushing datapoint for ' + this.datasource, 'color: green');
            browser.runtime.sendMessage(datapointDetails)
                .catch(reason => {
                    console.log("%c[ Metro ] " + reason, 'color: red')
                })
        } else {
            console.log("%c[ Metro ] Invalid schema, not pushing datapoint.", 'color: red')
        }
    }

    storeData(key, value) {
        // TODO: Can add validation here.
        let storageItem = {};
        storageItem[datasource + "-" + key] = value;

        chrome.storage.sync.set(storageItem);
    }

    readData(key, callback) {
        // TODO: Can add validation here.
        chrome.storage.sync.get(datasource + "-" + key, function (items) {
            let retVal = "-1";

            try {
                retVal = items[datasource + "-" + key];
            } catch (e) {
                console.log("Error reading data:");
                console.log(e);
            }

            callback(retVal);
        });
    }

    createContextMenuButton(buttonDetails, buttonFunction) {
        buttonDetails['datasource'] = this.datasource;
        var obj = {};
        obj[BUTTON_STATE] = [];
        chrome.storage.local.get(obj, function (contextMenuState) {
            if (contextMenuState[BUTTON_STATE].includes(buttonDetails.datasource)) {
                return false;
            } else {
                createContextMenuButtonMsg(buttonDetails, buttonFunction);
                // Add the datasource to the current state and push it to storage
                contextMenuState[BUTTON_STATE].push(buttonDetails.datasource);

                chrome.storage.local.set(contextMenuState, function () {
                    return;
                });
            }
        });
    }

    /*
     * Creates a modal dialog box with a text field, description and callback
     * function for when the text field is filled.
     *
     * dialogDetails is a dict with fields:
     *  - description: String description to put beside the input box.
     *  - submitCallback: Function to call when the input is submitted.
     * 
     *          ** NOT OFFICIALLY SUPPORTED YET **
     */
    createModalForm(dialogDetails) {
        var inputs = dialogDetails['inputs']
        var submitCallback = dialogDetails['submitCallback'];

        var $parentDiv = $('<div>');
        $parentDiv.appendTo($(document.body));
        var shadow = setUpShadowDOM($parentDiv);

        $frame = setUpModal(shadow);

        // Set up some useful refs
        var $frameDocument = $frame.contents();
        var $frameWindow = $($frame[0].contentWindow);
        var $modal = $frameDocument.find('.mtr-modal-content');
        var $modalForm = $modal.find(".mtr-modal-form");

        for (var i = 0; i < inputs.length; i++) {
            addModalInput($modalForm, inputs[i], i);
        }

        $('<input class="btn btn-success" type="submit" value="submit">').appendTo($modalForm);

        // Callback and then remove the modal, upon submit
        $modalForm.on('submit', function (e) {
            var res = { 'inputs': [] };

            $modalForm.find('.mtr-form-input-row').each(function (idx) {
                res['inputs'].push($(this).find('.mtr-form-input').val())
            })

            submitCallback(res);

            $parentDiv.remove(); // Remove modal when we're done
            // Stops the normal form processing.
            e.preventDefault();
        });

        // Remove modal when ESC is pressed
        $frameDocument.on('keyup.27', function (e) {
            if (e.which == 27) { // escape key maps to keycode `27`
                $parentDiv.remove();
            }
        });

        $(document).on('click', function (event) {
            if (!hasShadowParent(event.target)) {
                $parentDiv.remove();
            }
        });
    }
}

export default MetroClient;