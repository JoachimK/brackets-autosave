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
    
    var documentToPreview;
    
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
    
    function documentChanged(newDocumentToPreview) {
        
        if ((documentToPreview !== undefined) && (documentToPreview !== null)) {
            $(documentToPreview).off("change.autosave");                                          
            documentToPreview.releaseRef();
        }
        
        if (newDocumentToPreview === null) {
            documentToPreview = null;
        } else {
            if (newDocumentToPreview.getLanguage()._name !== "JavaScript") {
                documentToPreview = null;
            } else {
                documentToPreview = newDocumentToPreview;
            }
        }
        
        if (documentToPreview === null) {
            // do nothing
        } else {
            documentToPreview.addRef();
            $(documentToPreview).on("change.autosave", function () {
                saveCode(documentToPreview.getText(), documentToPreview.file.name);
            });
            
            saveCode(documentToPreview.getText(), documentToPreview.file.name);
        }
    }
    
    // called when the current document changes
    function _setupLiveCodingEditorForChangedDocument(theEvent) {
        var theCurrentDocument = DocumentManager.getCurrentDocument();
        documentChanged(theCurrentDocument);
    }
    
    AppInit.appReady(function () {
        $(DocumentManager).on("currentDocumentChange", _setupLiveCodingEditorForChangedDocument);
        // call the function that will be called when the current document changes. If there is already one it will be set up correctly.
        _setupLiveCodingEditorForChangedDocument(null);
    });
});