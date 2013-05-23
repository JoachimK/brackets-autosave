/*jslint node: true, plusplus: true */
"use strict";

process.title = "Autosave-node server";

var ws = require("ws"),
    fs = require("fs");

var PORT = 1235;


// Server Session
function ServerSession(socket) {
    this.socket = socket;
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("close", this.onClose.bind(this));

    // Map of all runtimes for this session
    this.runtimes = {};
}

ServerSession.prototype.onMessage = function (messageString) {
    var message = JSON.parse(messageString);
    if (message.code && message.timestamp && message.filename) {
        if (message.filename.indexOf("/") >= 0) {
            console.error("Filename must not contain any slashes.");
            return;
        } // else
        var filename = String(message.timestamp) + "-" + message.filename;
        fs.writeFile(filename, message.code, function (error) {
            if (error) {
                console.error("Could not save file due to error: ", error);
            }
        });
    }
    
};

ServerSession.prototype.onClose = function () {
    console.log("Closing session");
};



// Server (WebSocket)
function Server(options) {
    this.wss = new ws.Server(options);
    this.wss.on("connection", this.onConnect.bind(this));
    this.wss.on("error", function (error) {
        console.log("Websocket Server Error: ", error);
    });
    this.sessions = [];
}

Server.prototype.onConnect = function (socket) {
    console.log("Autosave-Client connected");

    var session = new ServerSession(socket);
    this.configureSession(session);
    socket.on("close", this.onClose.bind(this));
    socket.on("error", function (error) {
        console.log("error on socket: ", error);
    });
    this.sessions.push(session);
};

Server.prototype.onClose = function (session) {
    console.log("Autosave-Client disconnected");
};

Server.prototype.configureSession = function (session) {};

console.log("Starting Autosave server on port " + PORT);
var server = new Server({ port : PORT });
