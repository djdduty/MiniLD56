gMuted = true;
name = '';
rocketIndex=0;

gamvas.event.addOnLoad(function() {
    gamvas.state.addState(new MenuState('MenuState'));
    gamvas.state.addState(new GameState('GameState'));
    gamvas.state.addState(new NameState('NameState'));
    gamvas.start('Canvas', true);
    gamvas.state.setState('MenuState');
});

//Menu State
MenuState = gamvas.State.extend({
    init: function() {
        this.addActor(new TextString("title", "Mld56: Slimepocalypse", 0, -200, 50, "#FFF", "center"));
        this.addActor(new TextString("play", "Play", 0, -100, 40, "#999", "center"));
        this.addActor(new TextString("mute", "Mute", 0, -60, 40, "#999", "center"));
        this.addActor(new TextString("about", "About", 0, -20, 40, "#999", "center"));

        this.selectedEntry = 0;
    },

    enter: function() {

    },

    draw: function() {
        this.actors.play.color = "#999";
        this.actors.mute.color = "#FF0000";
        if(!gMuted)
            this.actors.mute.color = "#999";
        this.actors.about.color = "#999";

        if(this.selectedEntry == 0)
            this.actors.play.color = "#FFF";
        if(this.selectedEntry == 1)
            this.actors.mute.color = "#FFF";
        if(this.selectedEntry == 2)
            this.actors.about.color = "#FFF";
    },

    onKeyDown: function(keycode, character,event) {
        if(keycode == gamvas.key.UP)
            if(this.selectedEntry > 0)
                this.selectedEntry--;

        if(keycode == gamvas.key.DOWN)
            if(this.selectedEntry < 2)
                this.selectedEntry++;

        if(keycode == gamvas.key.RETURN) {
            if(this.selectedEntry == 0) {
                if(name == '')
                    gamvas.state.setState('NameState');
                else
                    gamvas.state.setState('GameState');
            }

            if(this.selectedEntry == 1) {
            }
        }
    }
});

//Name entering state
NameState = gamvas.State.extend({
    init: function() {
        this.addActor(new TextString("NameTitle", "Enter a name:", 0, -50, 50, "#FFF", "center"));
        this.addActor(new TextString("name", "", 0, 0, 50, "#FFF", "center"));
        this.addActor(new TextString("title", "Press enter to continue...", 0, 50, 30, "#FFF", "center"));
    },

    enter: function() {
        name = '';
    },

    draw: function() {

    },

    onKeyDown: function(keycode, character,event) {
        if(keycode == gamvas.key.RETURN) {
            if(name != '')
                gamvas.state.setState('GameState');
        } else {
            if(keycode == gamvas.key.BACKSPACE) {
                name = name.substr(0, name.length-1).trim().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
                //console.log("Backspace pressed");
                //console.log(name.length + " " + name);
            }
            else if(character != 'undefined') {
                name += character;
            }
            this.actors.name.text = name;
        }
    }
});


//Game State
GameState = gamvas.State.extend({
    RemotePlayers: [],
    LocalPlayer:null,
    LastPosUpdate: 0,
    LocalRockets: [],
    RemoteRockets: [],
    id: '',

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
            this.socket.on("id", function(data) {gamvas.state.getCurrentState().id = data.id;});
            this.socket.on("new player", function(data) {gamvas.state.getCurrentState().onNewPlayer(data)});
            this.socket.on("move player", function(data) {gamvas.state.getCurrentState().onMovePlayer(data)});
            this.socket.on("remove player", function(data) {gamvas.state.getCurrentState().onRemovePlayer(data)});

            this.socket.on("hurt player", function(data) {gamvas.state.getCurrentState().onHurt(data);});
            this.socket.on("killed player", function(data) {gamvas.state.getCurrentState().onKilled(data);});
            this.socket.on("player respawn", function(data) {gamvas.state.getCurrentState().onPlayerRespawn(data);});

            this.socket.on("new rocket", function(data) {gamvas.state.getCurrentState().onNewRocket(data)});
            this.socket.on("move rocket", function(data) {gamvas.state.getCurrentState().onMoveRocket(data)});
            this.socket.on("rocket exploded", function(data) {gamvas.state.getCurrentState().onRocketExploded(data)});

            this.LocalPlayer = new Player("LocalPlayer", name, 0, -300);
            this.addActor(this.LocalPlayer);

            //map bounds
            this.addActor(new CollisionBox("Ground", 0    ,-100 ,2000,200));
            this.addActor(new CollisionBox("RBound", 1000 ,-1000,200 ,2000));
            this.addActor(new CollisionBox("LBound", -1000,-1000,200 ,2000));
        }
    },

    enter: function() {
        if(connected && !this.connected) {
            this.LocalPlayer.nName = name;
            this.socket.connect();
            this.LocalPlayer.health = 100;
            this.LocalPlayer.setPosition(0,-200);
            this.LocalPlayer.body.SetLinearVelocity(new b2Vec2(0,0), this.LocalPlayer.body.GetWorldCenter());
        }
    },

    leave: function() {
        if(connected)
            this.socket.disconnect();
    },

    draw: function(t) {
        //gamvas.physics.drawDebug();
        if(connected) {
            this.camera.setPosition(this.LocalPlayer.position.x, this.LocalPlayer.position.y);

            var UpdateDelta = gamvas.timer.getMilliseconds() - this.LastPosUpdate;
            if(UpdateDelta > 25) {
                if(this.LocalPlayer.hasUpdated() == true && this.LocalPlayer.health > 0)
                    this.socket.emit("move player", {x: this.LocalPlayer.position.x, y: this.LocalPlayer.position.y});

                for(var i =0; i < this.LocalRockets.length; i++) {
                    var rocket = this.LocalRockets[i];
                    this.socket.emit("move rocket", {id: rocket.id, x: rocket.position.x, y: rocket.position.y})
                }

                this.LastPosUpdate = gamvas.timer.getMilliseconds();
            }
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
        this.socket.emit("new player", {name: this.LocalPlayer.nName, x: this.LocalPlayer.position.x, y: this.LocalPlayer.position.y});
    },

    onSocketDisconnect: function() {
        this.connected = false;
        console.log("Disconnected from server.");
    },

    onNewPlayer: function(data) {
        var newPlayer = new RemotePlayer(data.id, data.x, data.y, data.name);
        this.RemotePlayers.push(newPlayer);
        this.addActor(newPlayer);
    },

    onMovePlayer: function(data) {
        var movePlayer = this.playerById(data.id);
        if(!movePlayer) {
            console.log("Player not found: "+data.id);
            return;
        }

        var oldx = movePlayer.position.x;
        movePlayer.setPosition(data.x, data.y);
        if(oldx < movePlayer.position.x) movePlayer.walkDirectionRight = true;
        else if(oldx > movePlayer.position.x) movePlayer.walkDirectionRight = false;
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

    onRocketCollide: function(rocket) {
        var st = gamvas.state.getCurrentState();
        //console.log("rocket collided @"+rocket.position.x+", "+rocket.position.y);
        st.socket.emit("collide rocket", {id: rocket.id, x: rocket.position.x, y: rocket.position.y});
        st.LocalRockets.splice(st.LocalRockets.indexOf(rocket), 1);
        st.removeActor(rocket);
    },

    addRocket: function(rocket) {
        this.socket.emit("new rocket", {id: rocket.id, x: rocket.position.x, y: rocket.position.y});
        this.LocalRockets.push(rocket);
        this.addActor(rocket);
    },

    onNewRocket: function(data) {
        var rocket = new RemoteRocket(data.id, data.x, data.y);
        this.RemoteRockets.push(rocket);
        this.addActor(rocket);
    },

    onMoveRocket: function(data) {
        var rocket = this.remoteRocketById(data.id);
        if(!rocket) {
            console.log("Rocket not found: "+data.id);
            return;
        }
        rocket.setPosition(data.x, data.y);
    },

    onRocketExploded: function(data) {
        var rocket = this.remoteRocketById(data.id);
        if(!rocket) {
            console.log("Rocket not found: "+data.id);
            return;
        }

        this.RemoteRockets.splice(this.RemoteRockets.indexOf(rocket), 1);
        this.removeActor(rocket);
    },

    onHurt: function(data) {
        if(data.id == this.id) {
            this.LocalPlayer.health -= data.amount;
        }
        var player = this.playerById(data.id);
        if(player != false) {
            player.health -= data.amount;
        }
    },

    onKilled: function(data) {
        if(data.id == this.id) {

        }
    },

    onPlayerRespawn: function(data) {
        var player = this.playerById(data.id);
        if(player == false) {
            console.log("Player not found: "+data.id);
            return;
        }
        player.health = 100;
        console.log("Player respawned");
    },

    playerById: function(id) {
        var i;
        for (i = 0; i < this.RemotePlayers.length; i++) {
            if (this.RemotePlayers[i].id == id)
                return this.RemotePlayers[i];
        };

        return false;
    },

    remoteRocketById: function(id) {
        var i;
        for (i = 0; i < this.RemoteRockets.length; i++) {
            if (this.RemoteRockets[i].id == id)
                return this.RemoteRockets[i];
        };

        return false;
    }
});
