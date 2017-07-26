var http = require('http');
var nodeStatic = require('node-static');
var socketIo = require('socket.io')();
var fs = require('fs');
var config = require('./config.js');
var Game = require('./classes/Game.js');

var file = fs.readFileSync(__dirname + '/assets/js/main.js', 'utf8');
file = file.replace(/markForReplace/g, config.IP + ':' + config.SOCKET_SERVER_PORT);
fs.writeFileSync(__dirname + '/public/js/main.js', file, 'utf8');

socketIo.listen(config.SOCKET_SERVER_PORT);
console.log('Socket server started at ' + config.SOCKET_SERVER_PORT);

var fileServer = new nodeStatic.Server('./public');
http.createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function (err) {
            if (err) {
                console.error('Error serving ' + request.url + ' - ' + err.message);
                response.writeHead(err.status, err.headers);
                response.end();
            }
        });
    }).resume();
}).listen(config.STATIC_SERVER_PORT, function () {
    console.log('Static server started at port ' + config.STATIC_SERVER_PORT);
});

const queue = [];
const games = [];

socketIo.on('connection', function (socket) {
    queue.push(socket);
    socket.on('disconnect', function () {
        queue.splice(queue.findIndex(function (soc) {
            return soc.id === socket.id
        }))
    });
});

var queueLoop = function () {
    while (queue.length >= 2) {
        games.push(Game.create(queue.pop(), queue.pop()));
    }
    setTimeout(queueLoop, 500);
};

queueLoop();
