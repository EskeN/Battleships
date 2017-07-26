const ShotStatus = require('./ShotStatus.js');
const Ship = function (startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.health = Math.max(endX - startX, endY - startY) + 1;
    this.hits = [];
};

Ship.prototype.isTouched = function (x, y) {
    if (x >= this.startX && this.endX >= x && this.startY === y && this.endY === y ||
        y >= this.startY && this.endY >= y && this.startX === x && this.endX === x &&
        this.hits.findIndex(function (hit) {
            return hit.x === x && hit.y === y;
        }) === -1) {
        this.hits.push({x, y});
        this.health--;

        return this.health ? ShotStatus.HIT : ShotStatus.DESTROYED;
    }

    return ShotStatus.MISS;
};

module.exports = {
    create: function (startX, startY, endX, endY) {
        return new Ship(startX, startY, endX, endY);
    }
};
