Player = gamvas.Actor.extend({
    id: '',
    lastX: 0,
    lastY: 0,
    timeToBlink: 2000,
    blinkTimer: 0,
    blink: false,
    walkDirectionRight: true,
    nName: '',
    shootTimer: 0,
    health: 100,
    deadlabel: null,
    create: function(name, nname, x, y) {
        this.nName = nname;
        this.id = name;
        this._super(name, 0, 0);
        var polygon = new Box2D.Collision.Shapes.b2PolygonShape;
        polygon.SetAsBox((32/PIXELSPERMETER)/2, (32/PIXELSPERMETER)/2);
        this.createBody(gamvas.physics.DYNAMIC, polygon);
        this.fixture.SetRestitution(0);
        this.fixture.SetFriction(0);
        this.setPosition(x,y);

        this.contacts = [];
        this.getCurrentState().onCollisionEnter = function(other) {
            this.actor.contacts.push(other);
        };

        this.getCurrentState().onCollisionLeave = function(other) {
            deleteFromArray(this.actor.contacts, other);
        };
        this.body.SetFixedRotation(true);

        var st = gamvas.state.getCurrentState();

        var blink = new gamvas.Animation("pBlink", st.resource.getImage('res/img/playerBlink.png'), 32,32,4,7);
        blink.setFrameList([0, 1, 2, 3, 2, 1, 0]);
        var blinkleft = new gamvas.Animation("pBlinkLeft", st.resource.getImage('res/img/playerBlink-left.png'), 32,32,4,7);
        blinkleft.setFrameList([0, 1, 2, 3, 2, 1, 0]);
        this.addAnimation(new gamvas.Animation("pIdle", st.resource.getImage('res/img/playerIdle.png'), 32,32,4,7));
        this.addAnimation(new gamvas.Animation("pIdleLeft", st.resource.getImage('res/img/playerIdle-left.png'), 32,32,4,7));
        this.addAnimation(blink);
        this.addAnimation(blinkleft);
        this.setAnimation("pIdle");

        this.getCurrentState().update = function(t) {
            this.actor.shootTimer -= t*1000;
            if (isKeyDown(LEFT_KEYS) && this.actor.leftCollision() == false && this.actor.health > 0) {
                this.actor.body.m_linearVelocity.x = -10;
                this.actor.walkDirectionRight = false;
                this.actor.start = false;
            } else if (isKeyDown(RIGHT_KEYS) && this.actor.rightCollision() == false && this.actor.health > 0) {
                this.actor.body.m_linearVelocity.x = 10;
                this.actor.walkDirectionRight = true;
                this.actor.start = false;
            } else {
                this.actor.body.m_linearVelocity.x = 0;
            }

            if(this.actor.blink == true) {
                this.actor.blinkTimer += t*1000;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pBlinkLeft");
                else
                    this.actor.setAnimation("pBlink");
            }

            if(this.actor.blinkTimer >= 1000) {
                this.actor.blink = false;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pIdleLeft");
                else
                    this.actor.setAnimation("pIdle");
                this.actor.getCurrentAnimation().currentFrame = 0;
                this.actor.blinkTimer = 0;
            }

            if(this.actor.blink == false) {
                this.actor.timeToBlink -= t*1000;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pIdleLeft");
                else
                    this.actor.setAnimation("pIdle");
            }
            if(this.actor.timeToBlink <= 0) {
                this.actor.blink = true;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pBlinkLeft");
                else
                    this.actor.setAnimation("pBlink");
                this.actor.timeToBlink = 2000;
            }

            if (isKeyDown(JUMP_KEYS) && this.actor.health > 0) {
                this.actor.jump();
            }

            if(gamvas.mouse.isPressed(gamvas.mouse.LEFT) && this.actor.shootTimer <= 0 && this.actor.health > 0) {
                var pos = mousePosition();
                var delta = pos.subtract(this.actor.position);
                var rot = Math.atan2(delta.normalized().y, delta.normalized().x);
                this.actor.shoot(rot);
            }

            if(isKeyDown(JUMP_KEYS) && this.actor.health <= 0) {
                this.actor.health = 100;
                st.socket.emit("respawn");
            }
        };

        this.label = new TextString(name+"label", nname, x,y-32,24,"#FFF", "center");
        this.deadlabel = new TextString(name+"death", "You died! SPACE to respawn.", x, y-100, 50, "#FF0000", "center");
    },

    draw: function(t) {
        this.getCurrentState().update(t);
        this.getCurrentAnimation().setPosition(this.position.x-16, this.position.y-16);
        if(this.health > 0)
            this.getCurrentAnimation().draw(t);
        this.label.position.x = this.position.x;
        this.label.position.y = this.position.y-32;
        this.label.draw(t);
        var st = gamvas.state.getCurrentState();
        if(this.health <= 0) {
            this.health = 0;
            this.deadlabel.position.x = this.position.x;
            this.deadlabel.position.y = this.position.y-100;
            this.deadlabel.draw(t);
        }
        st.c.fillStyle = "#999999";
        st.c.fillRect((this.position.x)-40, this.position.y-28, 80, 5);
        st.c.fillStyle = "#FF0000";
        st.c.fillRect((this.position.x)-40, this.position.y-28, this.health*0.8, 5);
    },

    shoot: function(aim) {
        if(this.shootTimer <= 0) {
            var velocity = new gamvas.Vector2D(50, 0);
            velocity = velocity.rotate(aim);
            var st = gamvas.state.getCurrentState();
            var rocket = new Rocket('Rocket'+(++rocketIndex), this.position.x+velocity.x, this.position.y+velocity.y, velocity.x, velocity.y, st.onRocketCollide);
            st.addRocket(rocket);
            this.shootTimer = 1000;
        }
    },

    jump: function() {
        if(this.isOnGround()) {
            this.body.ApplyImpulse(new b2Vec2(0,-10), this.body.GetWorldCenter());
        }
    },

    isOnGround: function() {
        if(this.contacts.length > 0)
        {
            //console.log(this.contacts);
            for(var i = 0; i < this.contacts.length; ++i)
            {
                var ox = this.contacts[i].position.x;
                var ow = this.contacts[i].width;
                var tp = this.position.x;
                var tw = 32;
                if(this.contacts[i].position.y > (this.position.y + (tw/2) + (this.contacts[i].height/2)) && ox - (ow/2) < tp+(tw/2) && ox + (ow/2) > tp - (tw/2))
                {
                    return true;
                }
            }
        }
        return false;
    },

    rightCollision: function() {
        if(this.contacts.length > 0) {
            for(var i = 0; i < this.contacts.length; ++i)
            {
                var ox = this.contacts[i].position.x;
                var ow = this.contacts[i].width;
                var tp = this.position.x;
                var tw = 32;
                if(ox - (ow/2) > tp+(tw/2))
                {
                    return true;
                }
            }
        }
        return false;
    },

    leftCollision: function() {
        if(this.contacts.length > 0) {
            for(var i = 0; i < this.contacts.length; ++i)
            {
                var ox = this.contacts[i].position.x;
                var ow = this.contacts[i].width;
                var tp = this.position.x;
                var tw = 32;
                if(ox + (ow/2) < tp-(tw/2))
                {
                    return true;
                }
            }
        }
        return false;
    },

    hasUpdated: function() {
        if(this.position.x == this.lastX && this.position.y == this.lastY) return false;
        this.lastX = this.position.x;
        this.lastY = this.position.y;
        return true;
    }
});

RemotePlayer = gamvas.Actor.extend({
    id: '',
    lastX: 0,
    lastY: 0,
    timeToBlink: 2000,
    blinkTimer: 0,
    blink: false,
    walkDirectionRight: true,
    label: null,
    health: 100,
    create: function(name, x, y, nname) {
        this.label = new TextString(name+"label", nname, x,y-32,24,"#FFF", "center");
        this.id = name;
        this._super(name, 0, 0);
        this.setPosition(x,y);

        var st = gamvas.state.getCurrentState();

        var blink = new gamvas.Animation("pBlink", st.resource.getImage('res/img/playerBlink.png'), 32,32,4,7);
        blink.setFrameList([0, 1, 2, 3, 2, 1, 0]);
        var blinkleft = new gamvas.Animation("pBlinkLeft", st.resource.getImage('res/img/playerBlink-left.png'), 32,32,4,7);
        blinkleft.setFrameList([0, 1, 2, 3, 2, 1, 0]);
        this.addAnimation(new gamvas.Animation("pIdle", st.resource.getImage('res/img/playerIdle.png'), 32,32,4,7));
        this.addAnimation(new gamvas.Animation("pIdleLeft", st.resource.getImage('res/img/playerIdle-left.png'), 32,32,4,7));
        this.addAnimation(blink);
        this.addAnimation(blinkleft);
        this.setAnimation("pIdle");

        this.getCurrentState().update = function(t) {

            if(this.actor.blink == true) {
                this.actor.blinkTimer += t*1000;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pBlinkLeft");
                else
                    this.actor.setAnimation("pBlink");
            }
            if(this.actor.blinkTimer >= 1000) {
                this.actor.blink = false;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pIdleLeft");
                else
                    this.actor.setAnimation("pIdle");
                this.actor.getCurrentAnimation().currentFrame = 0;
                this.actor.blinkTimer = 0;
            }

            if(this.actor.blink == false) {
                this.actor.timeToBlink -= t*1000;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pIdleLeft");
                else
                    this.actor.setAnimation("pIdle");
            }
            if(this.actor.timeToBlink <= 0) {
                this.actor.blink = true;
                if(this.actor.walkDirectionRight == false)
                    this.actor.setAnimation("pBlinkLeft");
                else
                    this.actor.setAnimation("pBlink");
                this.actor.timeToBlink = 2000;
            }
        };
    },

    draw: function(t) {
        this.getCurrentState().update(t);
        this.getCurrentAnimation().setPosition(this.position.x-16, this.position.y-16);
        if(this.health > 0) {
            this.getCurrentAnimation().draw(t);
            this.label.position.x = this.position.x;
            this.label.position.y = this.position.y-32;
            this.label.draw(t);
            var st = gamvas.state.getCurrentState();
            if(this.health < 0) this.health = 0;
            st.c.fillStyle = "#999999";
            st.c.fillRect((this.position.x)-40, this.position.y-28, 80, 5);
            st.c.fillStyle = "#FF0000";
            st.c.fillRect((this.position.x)-40, this.position.y-28, this.health*0.8, 5);
        }
    },
});
