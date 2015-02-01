Rocket = gamvas.Actor.extend({
    width:0,
    height:0,
    id:'',
    callback:null,
    create: function(name, x, y, velx, vely, callback) {
        this.id = name;
        this._super(name, x, y);
        this.callback = callback;

        this.width = 32;
        this.height = 32;

        var polygon = new Box2D.Collision.Shapes.b2PolygonShape;
        polygon.SetAsBox((this.width/PIXELSPERMETER)/2, (this.height/PIXELSPERMETER)/2);
        this.createBody(gamvas.physics.DYNAMIC, polygon);
        this.fixture.SetRestitution(0);
        this.setPosition(x,y);
        this.body.m_linearVelocity.x = velx;
        this.body.m_linearVelocity.y = vely;

        this.getCurrentState().onCollisionEnter = function(other) {
            this.actor.callback(this.actor);
        };
    },
    draw: function(t) {
        if(gamvas.state.getCurrentState().removeCollisions === true)
            this.body.SetActive(true);
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = "#FFF";
        st.c.fillRect(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
    }
});

RemoteRocket = gamvas.Actor.extend({
    width:0,
    height:0,
    id:'',
    callback:null,
    create: function(name, x, y) {
        this.id = name;
        this._super(name, x, y);

        this.width = 32;
        this.height = 32;
    },
    draw: function(t) {
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = "#FFF";
        st.c.fillRect(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
    }
});
