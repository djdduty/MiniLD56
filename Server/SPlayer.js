var Player = function(sName, startX, startY) {
    var x = startX,
        y = startY,
        id,
        name = sName,
        health = 100;

    var getX = function() {
        return x;
    };

    var getY = function() {
        return y;
    };

    var setX = function(newX) {
        x = newX;
    };

    var setY = function(newY) {
        y = newY;
    };

    return {
        getX: getX,
        getY: getY,
        setX: setX,
        setY: setY,
        id: id,
        name: name,
        health: health
    }
};

exports.Player = Player;
