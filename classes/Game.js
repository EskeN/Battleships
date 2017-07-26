const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const ShotStatus = require('./ShotStatus.js');
const Ship = require('./Ship.js');
const CELL_STATUS = {
    free: 0,
    ship: 1,
    damagedShip: 2,
    checked: 3
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

const Game = function (firstClient, secondClient, gameNumber, onGameEnds) {
    this.clients = {
        0: firstClient,
        1: secondClient
    };
    this.gameNumber = gameNumber;
    this.onGameEnds = onGameEnds;
    this.players = {};
    this.players[0] = initPlayer();
    this.players[1] = initPlayer();
    this.turn = getRandomInt(0, 1);

    this.initConnection(firstClient, 0);
    this.initConnection(secondClient, 1);
    this.emitToClients('yourTurn', this.turn);
};

function initPlayer() {
    return {
        playingField: initPlayingField(),
        opponentField: initSquare(),
    }
}

function getAnotherPlayer(playerNumber) {
    return (playerNumber + 1) % 2;
}

Game.prototype.nextPlayerTurn = function () {
    this.turn = getAnotherPlayer(this.turn);
};

Game.prototype.emitToClients = function (eventName, params) {
    this.clients[0].emit(eventName, params);
    this.clients[1].emit(eventName, params);
};

Game.prototype.updateCell = function (x, y, playerNumber, cellStatus) {
    const anotherPlayer = getAnotherPlayer(playerNumber);
    this.players[playerNumber].playingField.square[x][y] = cellStatus;
    this.players[anotherPlayer].opponentField[x][y] = cellStatus;
    this.emitToClients('cellStatusChanged', {x, y, playerNumber, cellStatus});
};

Game.prototype.endGame = function (winner) {
    var self = this;
    self.emitToClients('gameEnded', winner);
    this.clients[0].removeAllListeners('fire');
    this.clients[1].removeAllListeners('fire');
    this.onGameEnds(self.gameNumber);
};

Game.prototype.initConnection = function (client, playerNumber) {
    const self = this;
    const anotherPlayer = getAnotherPlayer(playerNumber);
    client.on('fire', function (coords) {
        if (self.turn === playerNumber) {
            var cellStatus;
            const [shotStatus, gameEnded] = isHit(coords.x, coords.y, self.players[anotherPlayer].playingField.ships);
            if (shotStatus === ShotStatus.MISS) {
                self.nextPlayerTurn();
                cellStatus = CELL_STATUS.checked;
            } else {
                cellStatus = CELL_STATUS.damagedShip;
            }

            self.emitToClients('shotStatus', shotStatus);
            self.updateCell(coords.x, coords.y, anotherPlayer, cellStatus);

            if (gameEnded) {
                self.endGame(playerNumber);
            } else {
                self.emitToClients('turnChanged', self.turn);
            }
        }
    });

    client.emit('gameStarted', {
        opponentField: this.players[playerNumber].opponentField,
        number: playerNumber,
        playerField: this.players[playerNumber].playingField.square
    });
};

function isHit(x, y, ships) {
    let hasShips = false;
    let result = 0;
    ships.forEach(function (ship) {
        if (ship.health) {
            result = result || ship.isTouched(x, y);
        }
        hasShips = hasShips || !!ship.health;
    });

    return [result, !hasShips];
}

function hasPlace (startX, startY, isVertical, size, square) {
    while(size) {
        if (square[startX + 1] &&
            (square[startX + 1][startY] || square[startX + 1][startY - 1] || square[startX + 1][startY + 1]) ||
            square[startX] &&
            (square[startX][startY] || square[startX][startY - 1] || square[startX][startY + 1]) ||
            square[startX - 1] &&
            (square[startX - 1][startY] || square[startX - 1][startY - 1] || square[startX - 1][startY + 1]))
        {
            return false;
        }

        if (isVertical) {
            startY = startY + 1;
        } else {
            startX = startX + 1;
        }

        size = size - 1;
    }

    return true;
}

function insertShip (x, y, isVertical, size, square) {
    while(size) {
        square[x][y] = CELL_STATUS.ship;

        if (isVertical) {
            y = y + 1;
        } else {
            x = x + 1;
        }

        size = size - 1;
    }
}

function initSquare () {
    const square = [];
    for (let i = 0; i < 10; i++) {
        square[i] = [];
        for (let j = 0; j < 10; j++) {
            square[i][j] = CELL_STATUS.free;
        }
    }

    return square;
}

function initPlayingField() {
    const square = initSquare();
    const ships = [];

    SHIP_SIZES.forEach(function (shipSize) {
        while (true) {
            let isVertical = !!getRandomInt(0, 1);
            let startX = isVertical ? getRandomInt(0, 9) : getRandomInt(0, 9 - (shipSize - 1));
            let startY = isVertical ? getRandomInt(0, 9 - (shipSize - 1)) : getRandomInt(0, 9);

            if (hasPlace(startX, startY, isVertical, shipSize, square)) {
                insertShip(startX, startY, isVertical, shipSize, square);
                let endX = startX;
                let endY = startY;
                if (isVertical) {
                    endY = endY + shipSize - 1;
                } else {
                    endX = endX + shipSize - 1;
                }
                ships.push(Ship.create(startX, startY, endX, endY));
                break;
            }
        }
    });

    return {square, ships};
}

module.exports = {
    create: function (firstClient, secondClient, gameNumber, onGameEnds) {
        return new Game(firstClient, secondClient, gameNumber, onGameEnds);
    }
};
