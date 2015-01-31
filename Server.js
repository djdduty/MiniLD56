var util = require("util"),
    io = require("socket.io"),
    Player = require("./SPlayer").Player;

var socket,
    players,
    maxPlayers = 16;

function init() {
    players = [];
    socket = io.listen(3889, {transports : ["websocket"]});

    setEventHandlers();
}

function setEventHandlers() {
    socket.on("connection", onSocketConnection);
}

function onSocketConnection(client) {
    if(players.length < maxPlayers) {
        util.log("New client connected: "+client.id);
        client.on("disconnect", onClientDisconnect);
        client.on("new player", onNewPlayer);
        client.on("move player", onMovePlayer);
    }
}

function onClientDisconnect() {
    util.log("Client disconnected: "+this.id);
    var removePlayer = playerById(this.id);

    if (!removePlayer) {
        util.log("Player not found: "+this.id);
        return;
    };

    players.splice(players.indexOf(removePlayer), 1);
    this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data) {
    var newPlayer = new Player(data.x, data.y);
    newPlayer.id = this.id;
    this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});
    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i];
        this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
    };
    players.push(newPlayer);
}

function onMovePlayer(data) {
    var movePlayer = playerById(this.id);
    if(!movePlayer) {
        util.log("Player not found: "+this.id);
        return;
    }
    //util.log(data.x + ", " + data.y + " id: " + this.id);
    movePlayer.setX(data.x);
    movePlayer.setY(data.y);
    //util.log(movePlayer.getX() + ", " + movePlayer.getY());
    this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
}

function playerById(id) {
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id)
            return players[i];
    };

    return false;
};

init();
