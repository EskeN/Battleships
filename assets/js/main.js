var socket = io.connect('markForReplace');
var playerNumber = -1;
function getAnotherPlayer(playerNumber) {
    return (playerNumber + 1) % 2;
}

var COLORS = {
    0: 'white',
    1: 'green',
    2: 'red',
    3: 'grey'
};

var addCell = function (containerId, id, status, onClick) {
    var element = $( '<div/>', {
        'class': 'cell',
        'id': id
    });
    element.css('background-color', COLORS[status]);

    if (onClick) {
        element.click(onClick);
    }

    $(containerId).append(element);
};

var clearField = function (id) {
    $(id).empty();
};

var initGame = function (response) {
    clearField('#playerField');
    clearField('#opponentField');
    playerNumber = response.number;
    for(var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            addCell('#playerField', playerNumber.toString() + i + j, response.playerField[i][j]);
            addCell('#opponentField', getAnotherPlayer(playerNumber).toString() + i + j, response.opponentField[i][j],
                function (event) {
                    var id = event.toElement.id;
                    socket.emit('fire', {
                        x: parseInt(id[1], 10),
                        y: parseInt(id[2], 10)
                    });
                });
        }
    }
};
socket.on('gameStarted', initGame);

socket.on('gameEnded', function (winnerId) {
    alert(winnerId === playerNumber ? 'Victory' : 'Defeat');
});

socket.on('turnChanged', function (id) {
    $('#turnInfo').text(id === playerNumber ? 'your turn' : 'opponent turn');
});

socket.on('shotStatus', function (status) {
    var statusMessage = '';
    switch (status) {
        case 0:
            statusMessage = 'miss';
            break;
        case 1:
            statusMessage = 'hit';
            break;
        case 2:
            statusMessage = 'ship destroyed';
            break;
    }
    $('#messages').text('shot status: ' + statusMessage);
});

socket.on('cellStatusChanged', function (cellInfo) {
    $('#' + cellInfo.playerNumber + cellInfo.x + cellInfo.y).css('background-color', COLORS[cellInfo.cellStatus]);
});
