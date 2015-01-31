Player = gamvas.Actor.extend({
    id: '',
    lastX: 0,
    lastY: 0,
    create: function(name, x, y, color) {
        this.id = name;
        this._super(name, 0, 0);
        this.color = typeof color !== 'undefined' ? color : '#FFF';
        var polygon = new Box2D.Collision.Shapes.b2PolygonShape;
        polygon.SetAsBox((100/PIXELSPERMETER)/2, (100/PIXELSPERMETER)/2);
        this.createBody(gamvas.physics.DYNAMIC, polygon);
        this.fixture.SetRestitution(0);
        //this.fixture.SetFriction(0);
        //this.body.SetLinearDamping(3.5);
        this.setPosition(x,y);

        this.contacts = [];
        this.getCurrentState().onCollisionEnter = function(other) {
            this.actor.contacts.push(other);
        };

        this.getCurrentState().onCollisionLeave = function(other) {
            deleteFromArray(this.actor.contacts, other);
        };
        this.body.SetFixedRotation(true);
    },

    draw: function() {
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = this.color;
        st.c.fillRect(this.position.x-50, this.position.y-50, 100, 100);
    },

    process: function(keys) {
        var prevX = this.position.x,
            prevY = this.position.y;
        if(keys[0] == LEFT_KEYS[0] && this.leftCollision() == false)
            this.body.SetLinearVelocity(new b2Vec2(-10,this.body.GetLinearVelocity().y), this.body.GetWorldCenter());
        if(keys[0] == RIGHT_KEYS[0] && this.rightCollision() == false)
            this.body.SetLinearVelocity(new b2Vec2(10,this.body.GetLinearVelocity().y), this.body.GetWorldCenter());
        if(keys[0] == JUMP_KEYS[0]) {
            this.jump();
        }
        return true;
    },

    jump: function() {
        if(this.isOnGround()) {
            this.body.ApplyImpulse(new b2Vec2(0,-110), this.body.GetWorldCenter());
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
                var tw = 100;
                if(this.contacts[i].position.y > (this.position.y + 50 + (this.contacts[i].height/2)) && ox - (ow/2) < tp+(tw/2) && ox + (ow/2) > tp - (tw/2))
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
                var tw = 100;
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
                var tw = 100;
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
    create: function(name, x, y, color) {
        this.id = name;
        this._super(name, 0, 0);
        this.color = typeof color !== 'undefined' ? color : '#FFF';
        this.setPosition(x,y);
    },

    draw: function() {
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = this.color;
        st.c.fillRect(this.position.x-50, this.position.y-50, 100, 100);
    }
});
