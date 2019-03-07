import { fetchText } from "./network";

            /*                          //
                    Creating Stuff
            */                          //

/*
  Given a div, set up a Shadow DOM inside it
*/
function setUpShadowDOM($parentDiv) {
    var shadow = $parentDiv[0].attachShadow({'mode': 'closed'});

    return shadow;
}

/*
* Initialize the DS Counter in the bottom left of the page
*/

const setUpCounter = async function (count) {
    var $parentDiv = $('<div>');
    $parentDiv.appendTo($(document.body));
    var shadow = setUpShadowDOM($parentDiv); // Shadow DOM to encapsulate our CSS

    let $frame = await setUpCounterFrame(shadow);

    // Set up some useful refs
    var $frameDocument = $frame.contents();
    var $counter = $frameDocument.find('#mtr-counter-content');
    $counter.find('span.count').text(count);

    $frame.hover(function () { // Handle the change when we hover
        let dsWord = "DataSource" + (count == 1 ? '' : 's')
        let $span = $('<span class="text">')
        $span.text(" " + dsWord + " active")
        $counter.append($span)
    }, function () {
        $counter.find("span:last").remove();
    });
}

/*
  Given a reference to a Shadow DOM, set up an iFrame for the counter
*/
async function setUpCounterFrame(shadow) {
    // Add the iFrame CSS
    var overlayStyleUrl = chrome.extension.getURL('css/overlay.css');
    $('<link>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: overlayStyleUrl
    }).appendTo($(shadow));

    // Add the iFrame
    var overlayFullURL = chrome.extension.getURL('components/datasourceCounter.html');
    var $frame = $('<iframe>', {
        src: overlayFullURL,
        class: 'mtr-overlay'
    })
    $frame.appendTo($(shadow));

    // Hacky re-write of the iFrame so we can access its DOM; due to security restrictions
    $frame[0].contentDocument.open();
    let frameHtml = await fetchText(overlayFullURL)
    $frame[0].contentDocument.write(frameHtml);
    $frame[0].contentDocument.close();

    return $frame;
}

/*
  Given a reference to a Shadow DOM, set up an iFrame for the modalDialog inside it
*/
async function setUpModal(shadow) {
    // Add the iFrame CSS
    var iframeStyleUrl = chrome.extension.getURL('src/static/css/iframe.css');
    $('<link>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: iframeStyleUrl
    }).appendTo($(shadow));

    // Add the iFrame
    var modalFullURL = chrome.extension.getURL('src/static/components/modalDialog.html');
    var $frame = $('<iframe>', {
        src: modalFullURL,
        class: 'mtr-iframe'
    })
    $frame.appendTo($(shadow));

    // Hacky re-write of the iFrame so we can access its DOM; due to security restrictions
    $frame[0].contentDocument.open();
    let modalHtml = await fetchText(modalFullURL)
    $frame[0].contentDocument.write(modalHtml);
    $frame[0].contentDocument.close();

    var bootstrapURL = chrome.extension.getURL('src/vendor/bootstrap/bootstrap.css');
    $('<link>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: bootstrapURL
    }).appendTo($($frame[0].contentDocument).find('body'));

    return $frame;
}

/*
        Creates a row with two cols to hold the description and input for the input
*/
const addModalInput = function($modal, inputDetails, idx) {
    var $row = $('<div class="row mtr-form-input-row">').appendTo($modal);
  
    $('<p class="col-4">').text(inputDetails['description']).appendTo($row);
  
    var $elem = $('<' + inputDetails['type'] + '>').addClass('mtr-form-input col').attr('id', 'mtr-input-' + idx);
    if(inputDetails['type'] == 'select') {
      // Add the options for the select
      $(inputDetails['options']).each(function() {
       $elem.append($("<option>").attr('value',this.val).text(this.text));
      });
  
    }
  
    if(idx == 0) {
      // Set autofocus
      $elem.prop('autofocus', true);
    }
    $elem.appendTo($row);
  }

            /*                          //
                    Getting Info
            */                          //

/*
        Checks if the element is in a ShadowDOM
*/
function hasShadowParent(element) {
    while(element.parentNode && (element = element.parentNode)){
        if(element instanceof ShadowRoot){
            return true;
        }
    }
    return false;
}

export { addModalInput, setUpModal, setUpShadowDOM, setUpCounter, hasShadowParent }