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

var currentRoom;
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
        currentRoom = msg.id;
        io.to(socket.id).emit("gameStart", msg.id);
    });

    socket.on('createRandomRoom', (msg) => {
        const room = io.sockets.adapter.rooms.get(msg.id);
        const userCount = room ? room.size : 0;
        if (userCount > 1) {
            io.emit("roomIsBusy");
            return;
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
        currentRoom = msg.id;
        io.to(socket.id).emit("gameStart", msg.id);
    });

    socket.on("joinRoom", (id) => {
        socket.join(id);
    })

    socket.on('restartGame', (id) => {
        io.to(id).emit("restartGame");
    });

    socket.on('changeSymbol', (msg) => {
        io.to(msg.roomid).emit("showSymbol", { id: msg.id, symbol: msg.symbol });
        socket.broadcast.emit("ALERT");
    });

    socket.on('gamePosition', (msg) => {
        io.to(msg.id).emit("gameWin", msg.symbol);
    });

    socket.on('gameTie', (id) => {
        socket.to(id).emit("draw");
    });

    socket.on('continueGame', (id) => {
        io.to(id).emit("nextMatch");
    });

    socket.on('leaveGame', () => {
        io.to(currentRoom).emit("restartGame");
        socket.leave(currentRoom);
    })

});

server.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});
