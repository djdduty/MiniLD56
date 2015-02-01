var b2Vec2 = Box2D.Common.Math.b2Vec2;
var DEBUG = false;
var DEBUG_DRAWS = false && DEBUG;
var PIXELSPERMETER = 32;
var LEFT_KEYS = [gamvas.key.LEFT, gamvas.key.A];
var RIGHT_KEYS = [gamvas.key.RIGHT, gamvas.key.D];
var JUMP_KEYS = [gamvas.key.UP, gamvas.key.W, gamvas.key.SPACE];
var SHOOT_KEYS = [gamvas.key.SHIFT];

function isKeyDown(keys) {
    for(var i = 0; i < keys.length; ++i) {
        if(gamvas.key.isPressed(keys[i])) return true;
    }
    return false;
}

function isKey(k, keys) {
    for(var i = 0; i < keys.length; ++i) {
        if(k == keys[i]) return true;
    }
    return false;
}

lastID = 0;
function nextId(prefix) {
    lastID++;
    return prefix + lastID;
}

function tryParseInt(value) {
    try {
        return parseInt(value);
    } catch(e) {
        return 0;
    }
}

function deleteFromArray(a, o)
{
    for(var i = 0; i < a.length; ++i)
    {
        if(a[i] == o)
        {
            a.splice(i, 1);
            return;
        }
    }
}

function mousePosition() {
    var m = gamvas.mouse.getPosition();
    var s = gamvas.state.getCurrentState();
    m.x -= $("#Canvas").offset().left;
    m.y -= $("#Canvas").offset().top;
    m.x -= s.dimension.w/2;
    m.y -= s.dimension.h/2;
    m.x += s.camera.position.x;
    m.y += s.camera.position.y;
    return m;
}
