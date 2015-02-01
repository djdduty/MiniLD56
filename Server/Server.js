var util = require("util"),
    io = require("socket.io"),
    Player = require("./SPlayer").Player,
    Rocket = require("./Rocket").Rocket;

var DESIRED_TICKRATE = 60.0;

var socket,
    players,
    rockets,
    maxPlayers = 1600;

function init() {
    players = [];
    rockets = [];
    socket = io.listen(3889, {transports : ["websocket"]});

    setEventHandlers();
    setImmediate(update);
}

var curTime = 0, prevTime = 0, deltaTime = 0;
function update() {
    prevTime = curTime;
    curTime = (new Date()).getTime();
    deltaTime = curTime - prevTime;

    for(var i = 0; i < rockets.length; i++) {

    }

    var diff = (1000 / DESIRED_TICKRATE) - deltaTime;
    if(diff > 0)
        setTimeout(update, diff);
    else
        setImmediate(update);
}

function setEventHandlers() {
    socket.on("connection", onSocketConnection);
}

function onSocketConnection(client) {
    if(players.length < maxPlayers) {
        util.log("New client connected: "+client.id);
        client.emit("id", {id: client.id});
        client.on("disconnect", onClientDisconnect);
        client.on("new player", onNewPlayer);
        client.on("move player", onMovePlayer);
        client.on("new rocket", onNewRocket);
        client.on("move rocket", onMoveRocket);
        client.on("collide rocket", onCollideRocket);
        client.on("respawn", onRespawn);
    }
}

function onRespawn(data) {
    var player = playerById(this.id);
    if(player == false) {
        util.log("Could not find player: "+this.id);
        return;
    }
    this.broadcast.emit("player respawn", {id:this.id});
    player.health = 100;
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
    var newPlayer = new Player(data.name, data.x, data.y);
    newPlayer.id = this.id;
    this.broadcast.emit("new player", {id: newPlayer.id, name: newPlayer.name, x: newPlayer.getX(), y: newPlayer.getY()});
    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i];
        this.emit("new player", {id: existingPlayer.id, name: existingPlayer.name, x: existingPlayer.getX(), y: existingPlayer.getY()});
    };
    var r, rocket;
    for (r = 0; r < rockets.length; r++) {
        rocket = rockets[r];
        this.emit("new rocket", {id: rocket.id, x: rocket.getX(), y: rocket.getY()});
    };
    players.push(newPlayer);
}

function onMovePlayer(data) {
    var movePlayer = playerById(this.id);
    if(!movePlayer) {
        util.log("Player not found: "+this.id);
        return;
    }
    if(movePlayer.health > 0) {
        //util.log(data.x + ", " + data.y + " id: " + this.id);
        movePlayer.setX(data.x);
        movePlayer.setY(data.y);
        //util.log(movePlayer.getX() + ", " + movePlayer.getY());
        this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
    }
}

function onNewRocket(data) {
    if(playerById(this.id).health > 0) {
        var rocket = new Rocket(data.x, data.y);
        if(rocketById(this.id+data.id) == false) {
            rocket.id = this.id+data.id;
            this.broadcast.emit("new rocket", {id: this.id+data.id, x: data.x, y: data.y});
            rockets.push(rocket);
        }
    }
}

function onMoveRocket(data) {
    var rocket = rocketById(this.id+data.id);
    if(rocket == false) {
        util.log("Rocket not found: "+this.id+data.id);
        return;
    }
    rocket.setX(data.x);
    rocket.setY(data.y);
    this.broadcast.emit("move rocket", {id: this.id+data.id, x: data.x, y: data.y});
}

function onCollideRocket(data) {
    var rocket = rocketById(this.id+data.id);
    if(rocket == false) {
        util.log("Rocket not found: "+this.id+data.id);
        return;
    }
    rocket.setX(data.x);
    rocket.setY(data.y);
    //this.emit("rocket exploded", {id: this.id+data.id, x: data.x, y: data.y});
    this.broadcast.emit("rocket exploded", {id: this.id+data.id, x: data.x, y: data.y});

    for(var i = 0 ; i < players.length; i++) {
        if(this.id != players[i].id) {
            var player = players[i];
            if(player.health > 0) {
                var dist = distance(player.getX()-16, player.getY()-16, data.x, data.y);
                if(dist < 200) {
                    var amount = (50 - dist/4);
                    player.health -= amount;
                    this.emit("hurt player", {id: player.id, amount: amount});
                    this.broadcast.emit("hurt player", {id: player.id, amount: amount});
                }
                if(player.health <= 0) {
                    this.emit("scored", {});
                    this.emit("killed player", {id: player.id});
                    this.broadcast.emit("killed player", {id: player.id});
                }
            }
        }
    }

    rockets.splice(rockets.indexOf(rocket), 1);
}

function distance(x, y, ox, oy) {
    var a = x - ox,
        b = y - oy;
    var c = (a*a) + (b*b);
    return Math.sqrt(c);
}

function playerById(id) {
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id)
            return players[i];
    };

    return false;
};

function rocketById(id) {
    var i;
    for (i = 0; i < rockets.length; i++) {
        if (rockets[i].id == id)
            return rockets[i];
    };

    return false;
};

init();
