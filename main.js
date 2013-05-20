/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    var AppInit             = brackets.getModule("utils/AppInit");
    var Commands            = brackets.getModule("command/Commands");
    var CommandManager      = brackets.getModule("command/CommandManager");
    
    var AUTOSAVE_INTERVAL = 30 * 1000; // 30s
    
    
    // initalization
    console.log("loading autosave extension...");
    
    function autosaveCurrentDocument() {
        CommandManager.execute(Commands.FILE_SAVE);
    }
    
    AppInit.appReady(function () {
        window.setInterval(autosaveCurrentDocument, AUTOSAVE_INTERVAL); // autosave every 3 seconds
    });
});