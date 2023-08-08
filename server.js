const sqlData = require("sqlite3").verbose();
const DBfile = "database.db";
const insertData = `INSERT INTO data(playerName, realName, room) VALUES(?, ?, ?)`;

const db = new sqlData.Database(DBfile, function (err) {
    if (err) {
        console.error("Error opening database", err)
    }
});

const createTable = `
    CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerName TEXT NOT NULL,
        realName TEXT NOT NULL,
        room INTEGER NOT NULL
    )
`;

db.run(createTable, function (err) {
    if (err) {
        console.error("Error create table:", err);
    }
})

let playerNameList = {};
let winIdList = [];
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://admin.socket.io"],
        username: "admin",
        password: "727333!12",
        credentials: true,
    }
});

instrument(io, {
    auth: false,
    mode: "development",
});

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

io.on('connection', (socket) => {
    socket.on('createRoom', (msg) => {
        const room = io.sockets.adapter.rooms.get(msg.id);
        const userCount = room ? room.size : 0;
        if (userCount > 1) {
            io.emit("roomIsBusy");
            return;
        } else if (userCount == 1) {
            io.to(msg.id).emit("turnOffBlocker");
        }

        db.run(insertData, [msg.playerName, msg.name, msg.id], (err) => {
            if (err) {
                console.error("Error insert data:", err.message);
            }
        })

        db.all("SELECT * FROM data", [], (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err.message);
            } else {
                console.log('Selected data:');
                rows.forEach((row) => {
                    console.log(row);
                });
            }
        });

        io.to(socket.id).emit("gameStart", msg.id);
    });

    socket.on("joinRoom", (id) => {
        socket.join(id);
    });

    socket.on('restartGame', (id) => {
        io.to(id).emit("restartGame");
    });

    socket.on('changeSymbol', (msg) => {
        io.to(msg.roomid).emit("showSymbol", { id: msg.id, symbol: msg.symbol });
        socket.to(msg.roomid).emit("turnOffBlocker");
    });

    socket.on('gamePosition', (msg) => {
        winIdList.push(socket.id)
        if (winIdList.length == 2) {
            io.to(msg.id).emit("gameWin", { symbol: msg.symbol, id: winIdList[0] })
            winIdList = [];
        }
    });

    socket.on('gameTie', (id) => {
        socket.to(id).emit("draw");
    });

    socket.on('continueGame', (msg) => {
        io.to(msg.room).emit("nextMatch");
        io.to(msg.userId).emit("ALERT");
    });

    socket.on('leaveGame', (id) => {
        io.to(id).emit("restartGame");
        socket.leave(id);
    })

    socket.on("playerName", (msg) => {
        const room = io.sockets.adapter.rooms.get(msg.id);
        const userCount = room ? room.size : 0;
        userCount == 0 ? playerNameList["pl1"] = msg.name : false;
        userCount == 1 ? playerNameList["pl2"] = msg.name : false;
        socket.to(msg.id).emit("names", playerNameList);
    })

    socket.on("repeatName", (msg) => {
        socket.to(msg.id).emit("repeatNameSend", msg.name);
        playerNameList = {};
    })

});

server.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
