const ShotStatus = require('./ShotStatus.js');
Ship = function (startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.heals = Math.max(endX - startX, endY - startY) + 1;
    this.hits = [];
};

Ship.prototype.isFired = function (x, y) {
    if (x >= this.startX && this.endX >= x && this.startY === y && this.endY === y ||
        y >= this.startY && this.endY >= y && this.startX === x && this.endX === x &&
        this.hits.findIndex(function (hit) {
            return hit.x === x && hit.y === y;
        }) === -1) {
        this.hits.push({x, y});
        this.heals--;

        return this.heals ? ShotStatus.HIT : ShotStatus.DESTROYED;
    }

    return ShotStatus.MISS;
};

module.exports = {
    create: function (startX, startY, endX, endY) {
        return new Ship(startX, startY, endX, endY);
    }
};