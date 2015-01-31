gMuted = true;

gamvas.event.addOnLoad(function() {
    gamvas.state.addState(new MenuState('MenuState'));
    gamvas.state.addState(new GameState('GameState'));
    gamvas.start('Canvas', true);
    gamvas.state.setState('MenuState');
});

//Menu State
MenuState = gamvas.State.extend({
    init: function() {
        this.addActor(new TextString("title", "Test JS Game", -350, -200, 100, "#FFF"));
        this.addActor(new TextString("play", "Play", -350, -100, 40, "#999"));
        this.addActor(new TextString("mute", "Mute", -350, -60, 40, "#999"));
        this.addActor(new TextString("wat", "All of my WAT", -350, -20, 40, "#999"));
        this.addActor(new TextString("quit", "Quit", -350, 20, 40, "#999"));

        this.selectedEntry = 0;
    },

    enter: function() {

    },

    draw: function() {
        this.actors.play.color = "#999";
        this.actors.mute.color = "#FF0000";
        if(!gMuted)
            this.actors.mute.color = "#999";
        this.actors.wat.color = "#999";
        this.actors.quit.color = "#999";

        if(this.selectedEntry == 0)
            this.actors.play.color = "#FFF";
        if(this.selectedEntry == 1)
            this.actors.mute.color = "#FFF";
        if(this.selectedEntry == 2)
            this.actors.wat.color = "#FFF";
        if(this.selectedEntry == 3)
            this.actors.quit.color = "#FFF";
    },

    onKeyDown: function(keycode, character,event) {
        if(keycode == gamvas.key.UP)
            if(this.selectedEntry > 0)
                this.selectedEntry--;

        if(keycode == gamvas.key.DOWN)
            if(this.selectedEntry < 3)
                this.selectedEntry++;

        if(keycode == gamvas.key.RETURN) {
            if(this.selectedEntry == 0) {
                gamvas.state.setState('GameState');
            }

            if(this.selectedEntry == 1) {
            }
        }
    }
});


//Game State
GameState = gamvas.State.extend({
    RemotePlayers: [],
    LocalPlayer:null,
    LastPosUpdate: 0,

    init: function() {
        this.connected = false;
        if(!connected) {
            this.addActor(new TextString("ConnErr1", "Could not connect to game server!", 0, 0, 50, "#FF0000", "center"));
            this.addActor(new TextString("ConnErr2", "Please try again soon (ESC to go back)", 0, 40, 40, "#FF0000", "center"));
        } else {
            gamvas.physics.pixelsPerMeter = PIXELSPERMETER;
            gamvas.physics.resetWorld(0, 80, false);
            this.socket = io.connect("http://10.0.0.5:3889", {transports: ["websocket"]});
            this.socket.on("connect", function(data) {gamvas.state.getCurrentState().onSocketConnected(data)});
            this.socket.on("disconnect", function(data) {gamvas.state.getCurrentState().onSocketDisconnect(data)});
            this.socket.on("new player", function(data) {gamvas.state.getCurrentState().onNewPlayer(data)});
            this.socket.on("move player", function(data) {gamvas.state.getCurrentState().onMovePlayer(data)});
            this.socket.on("remove player", function(data) {gamvas.state.getCurrentState().onRemovePlayer(data)});
            this.LocalPlayer = new Player("LocalPlayer", 0, 0);
            this.addActor(this.LocalPlayer);
            this.addActor(new CollisionBox("test", 0,360,1000,200));
            this.addActor(new CollisionBox("test2", 120,200,100,20));
        }
    },

    enter: function() {
        if(connected && !this.connected)
            this.socket.connect();
        this.LocalPlayer.setPosition(0,0);
        this.LocalPlayer.body.SetLinearVelocity(new b2Vec2(0,0), this.LocalPlayer.body.GetWorldCenter());
    },

    leave: function() {
        if(connected)
            this.socket.disconnect();
    },

    draw: function() {
        gamvas.physics.drawDebug();

        if(isKeyDown(LEFT_KEYS))
            this.LocalPlayer.process(LEFT_KEYS);
        if(isKeyDown(RIGHT_KEYS))
            this.LocalPlayer.process(RIGHT_KEYS);
        if(isKeyDown(JUMP_KEYS))
            this.LocalPlayer.process(JUMP_KEYS);

        if(!isKeyDown(RIGHT_KEYS) && !isKeyDown(LEFT_KEYS)) {
            this.LocalPlayer.body.SetLinearVelocity(new b2Vec2(0,this.LocalPlayer.body.GetLinearVelocity().y), this.LocalPlayer.body.GetWorldCenter());
        }

        var UpdateDelta = gamvas.timer.getMilliseconds() - this.LastPosUpdate;
        //console.log(UpdateDelta);
        if(UpdateDelta > 50 && this.LocalPlayer.hasUpdated() == true) {
            this.socket.emit("move player", {x: this.LocalPlayer.position.x, y: this.LocalPlayer.position.y});
            this.LastPosUpdate = gamvas.timer.getMilliseconds();
        }
    },

    onKeyDown: function(keycode, character, event) {
        if(keycode == gamvas.key.ESCAPE) {
            gamvas.state.setState('MenuState');
        }
    },

    onSocketConnected: function() {
        this.connected = true;
        console.log("Connected to server.");
        this.socket.emit("new player", {x: this.LocalPlayer.position.x, y: this.LocalPlayer.position.y});
    },

    onSocketDisconnect: function() {
        this.connected = false;
        console.log("Disconnected from server.");
    },

    onNewPlayer: function(data) {
        var newPlayer = new RemotePlayer(data.id, data.x, data.y);
        this.RemotePlayers.push(newPlayer);
        this.addActor(newPlayer);
    },

    onMovePlayer: function(data) {
        var movePlayer = this.playerById(data.id);
        if(!movePlayer) {
            console.log("Player not found: "+data.id);
            return;
        }

        movePlayer.setPosition(data.x, data.y);
        //console.log(data.x + ", " + data.y + " - intended.");
        //console.log(movePlayer.position.x + ", " + movePlayer.position.y);
    },

    onRemovePlayer: function(data) {
        var removePlayer = this.playerById(data.id);
        if(!removePlayer) {
            console.log("Player not found: "+data.id);
            return;
        }

        this.RemotePlayers.splice(this.RemotePlayers.indexOf(removePlayer), 1);
        this.removeActor(removePlayer);
    },

    playerById: function(id) {
        var i;
        for (i = 0; i < this.RemotePlayers.length; i++) {
            if (this.RemotePlayers[i].id == id)
                return this.RemotePlayers[i];
        };

        return false;
    }
});
