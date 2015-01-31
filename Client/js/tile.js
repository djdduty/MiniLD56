CollisionBox = gamvas.Actor.extend({
    width: 0,
    height: 0,
    create: function(name, x, y, width, height) {
        this._super(name, 0, 0);
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        var polygon = new Box2D.Collision.Shapes.b2PolygonShape;
        polygon.SetAsBox((width/PIXELSPERMETER)/2, (height/PIXELSPERMETER)/2);
        this.createBody(gamvas.physics.STATIC, polygon);
        this.fixture.SetRestitution(0);
        this.setPosition(x,y);
    },
    draw: function(t) {
        if(gamvas.state.getCurrentState().removeCollisions === true)
            this.body.SetActive(tileVisible(this));
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = this.color;
        st.c.fillRect(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
    }
});

EventTrigger = gamvas.Actor.extend({
    width:0,
    height:0,
    targetID:0,
    create: function(name, x, y, width, height, tid, callback) {
        this._super(name, 0, 0);
        this.x = x;
        this.y = y;
        this.targetID = tid;

        this.width = width;
        this.height = height;
        this.callback = callback;

        var polygon = new Box2D.Collision.Shapes.b2PolygonShape;
        polygon.SetAsBox((width/PIXELSPERMETER)/2, (height/PIXELSPERMETER)/2);
        this.createBody(gamvas.physics.STATIC, polygon);
        this.fixture.SetRestitution(0);
        this.setPosition(x,y);
    },
    draw: function(t) {
        if(gamvas.state.getCurrentState().removeCollisions === true)
            this.body.SetActive(tileVisible(this));
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = this.color;
        st.c.fillRect(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
    },
    onCollisionEnter: function(a, c) {
        if(a.name == this.targetID) {
            this.callback(this);
        }
    }
});
