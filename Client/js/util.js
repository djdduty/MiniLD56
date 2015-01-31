var b2Vec2 = Box2D.Common.Math.b2Vec2;
var DEBUG = false;
var DEBUG_DRAWS = false && DEBUG;
var PIXELSPERMETER = 32;
var LEFT_KEYS = [gamvas.key.LEFT, gamvas.key.A];
var RIGHT_KEYS = [gamvas.key.RIGHT, gamvas.key.D];
var JUMP_KEYS = [gamvas.key.UP, gamvas.key.W, gamvas.key.SPACE];

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
