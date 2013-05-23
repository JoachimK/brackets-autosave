/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, CodeMirror, brackets, less, $, WebSocket, window */

define(function (require, exports, module) {
    "use strict";
    var AppInit             = brackets.getModule("utils/AppInit");
    var DocumentManager     = brackets.getModule("document/DocumentManager");
    
    // the interval for which nothing should be changed to cause a save action
    // so if you type something every AUTOSAVE_INTERVAL seconds, the document will not be saved
    var AUTOSAVE_INTERVAL = 3 * 1000; // 3s
    
    
    var wsURI = "ws://localhost:1235";
    
    var websocket;
    
    var webSocketOpen = false,
        openingWebSocket = false;
    
    function _openSocket(callOnOpen, callOnMsg) {
        websocket = new WebSocket(wsURI);
        
        websocket.onclose = function (evt) {
            console.log("Closing websocket.");
            webSocketOpen = false;
            openingWebSocket = false;
        };
        websocket.onerror = function (evt) {
            console.log("Error: " + evt.data);
            webSocketOpen = false;
            openingWebSocket = false;
        };
        
        websocket.onopen = callOnOpen;
        websocket.onmessage = function (evt) { callOnMsg(evt.data); };
    }
    
    // initalization
    console.log("loading autosave extension...");
    
    var lastSavedCode, pendingCodeToSave;
    function saveCode(codeToSave, filename) {
        
        if (!webSocketOpen) {
            if (openingWebSocket) {
                pendingCodeToSave = codeToSave;
            } else {
                openingWebSocket = true;
                pendingCodeToSave = codeToSave;
                var _callOnOpen = function () {
                    webSocketOpen = true;
                    console.log("Openend websocket to Autosave server.");
                    console.log("Saving code...");
                    var msg = {
                        timestamp: Date.now(),
                        code: pendingCodeToSave,
                        filename: filename
                    };
                    websocket.send(JSON.stringify(msg));
                    lastSavedCode = codeToSave;
                };
                
                _openSocket(_callOnOpen, function () { console.log("Received an answer. Didn't expect it.");});
            }
        } else {
            // websocket is open, easy case, just send the code to evaluate
            console.log("Saving code...");
            var msg = {
                timestamp: Date.now(),
                code: codeToSave,
                filename: filename
            };
            websocket.send(JSON.stringify(msg));
            lastSavedCode = codeToSave;
        }
    }
    
    var lastCode;
    function checkForChanges() {
        var theCurrentDocument = DocumentManager.getCurrentDocument(),
            newCode;
        if (theCurrentDocument !== null) {
            newCode = theCurrentDocument.getText();
            if (newCode && (newCode === lastCode)) {
                // if there is code and it wasn't changed since the last check
                if (newCode !== lastSavedCode) {
                    // but it is not the same code we have already saved
                    // then save it now
                    saveCode(newCode, theCurrentDocument.file.name);
                }
            }
            lastCode = newCode;
        }
    }
    
    AppInit.appReady(function () {
        window.setInterval(checkForChanges, AUTOSAVE_INTERVAL); // autosave every 3 seconds
    });
});