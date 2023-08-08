let buttons = document.querySelectorAll(".XO");
let playerIcon = document.querySelectorAll(".player-icon")
let gameBlocker = document.getElementById("GAME-BLOCKER");
let scoreXFeedback = document.getElementById("playerX");
let scoreOFeedback = document.getElementById("playerO");
let scoreTieFeedback = document.getElementById("tie");
let continueButton = document.getElementById("CONTINUE-BUTTON");
let restartButton = document.getElementById("RESTART-BUTTON");
let alertText = document.getElementById("ALERT-TEXT");
let goBack = document.getElementById("go-back");
let winCom = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let scoreX = 0;
let scoreO = 0;
let scoreTie = 0;
var num = 0;
let tieTest = 0;
var playerRoomID;
var userID;
let checkGameWinState = false;

let inputPlayerName;
let inputRealname;
let room;
let startGame = document.getElementById("game-start");
let blockPlayerRect = document.getElementById("playerAlert");
let alertTextForStart = document.getElementById("textAlert");
let rooms = ["3243", "1244", "4833"];
let randomRoom = ["1212", "1234", "1432"];
var roomID;

let gameStarter = document.getElementById("game-starter");
let gameView = document.getElementById("game");

let socket = io();

socket.on("roomIsBusy", () => {
    blockPlayerRect.style.display = "flex";
    alertTextForStart.innerHTML = "ოთახი დაკავებულია";
    setTimeout(function () {
        blockPlayerRect.style.display = "none";
    }, 2000);
    return;
})

goBack.addEventListener('click', () => {
    socket.emit("leaveGame", roomID);
});

startGame.addEventListener("click", function () {
    inputPlayerName = document.getElementById("playername").value;
    inputRealname = document.getElementById("realname").value;
    room = document.getElementById("room").value;
    gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";

    if (!inputPlayerName) {
        blockPlayerRect.style.display = "flex";
        alertTextForStart.innerHTML = "ყველა მოთამაშეს სჭირდება სახელი";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    } else if (!inputRealname) {
        blockPlayerRect.style.display = "flex";
        alertTextForStart.innerHTML = "შენი სახელი დაგავიწყდა";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    } else if (!room) {
        randomIndex = Math.floor(Math.random() * randomRoom.length);
        room = randomRoom[randomIndex];
    } else if (rooms.indexOf(room) === -1) {
        blockPlayerRect.style.display = "flex";
        alertTextForStart.innerHTML = "room - ის კოდი არასწორია";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    }

    socket.emit("createRoom", { id: room, playerName: inputPlayerName, name: inputRealname });
    document.getElementById('player1Name').innerHTML = `You: <br>${inputPlayerName}`;
    socket.emit("playerName", { name: inputPlayerName, id: room });
});

socket.on("gameStart", (id) => {
    gameStarter.style.display = "none";
    gameView.style.display = "flex";
    roomID = id;
    socket.emit("joinRoom", roomID);
});

socket.on("names", (msg) => {
    document.getElementById('player2Name').innerHTML = `Opponent: <br>${msg["pl2"]}`;
    socket.emit("repeatName", { id: roomID, name: msg["pl1"] });
});

socket.on("repeatNameSend", (msg) => {
    document.getElementById('player2Name').innerHTML = `Opponent: <br>${msg}`;
});

const displayGameScore = () => {
    scoreXFeedback.innerHTML = `${scoreO} Wins`;
    scoreOFeedback.innerHTML = `${scoreO} Wins`;
    scoreTieFeedback.innerHTML = `${scoreO} Draws`;
}

displayGameScore();

continueButton.style = "box-shadow: 0 10px 2px #6e0d0d";

const checkWinner = () => {
    let results = "Nothing";
    for (let i = 0; i < 8; i++) {
        if (buttons[winCom[i][0]].getAttribute("data-symbol") === 'X'
            && buttons[winCom[i][1]].getAttribute("data-symbol") === 'X'
            && buttons[winCom[i][2]].getAttribute("data-symbol") === 'X') {
            results = 'X';
            gameStateWin = true;
            break;
        } else if (buttons[winCom[i][0]].getAttribute("data-symbol") === 'O'
            && buttons[winCom[i][1]].getAttribute("data-symbol") === 'O'
            && buttons[winCom[i][2]].getAttribute("data-symbol") === 'O') {
            results = 'O';
            gameStateWin = true;
            break;
        }
    }
    return results;
}

const checkTie = () => {
    let tieScore = 0;
    for (let i = 0; i < 9; i++) {
        if (buttons[i].getAttribute("data-symbol") != 'null') {
            tieScore++;
        }
    }
    return tieScore === 9 ? true : false;
}

const winnerReact = () => {
    let checkWinnerState = checkWinner();

    if (checkWinnerState === 'X') {
        socket.emit("gamePosition", { symbol: 'X', id: roomID });
        scoreX++;
        scoreXFeedback.innerHTML = `${scoreX} Wins`;
        continueButton.disabled = false;
        continueButton.style = "box-shadow: 0 10px 2px #222296";
        num = 1;
        return "Win";
    } else if (checkWinnerState === 'O') {
        socket.emit("gamePosition", { symbol: 'O', id: roomID });
        scoreO++;
        scoreOFeedback.innerHTML = `${scoreO} Wins`;
        continueButton.disabled = false;
        continueButton.style = "box-shadow: 0 10px 2px #222296";
        num = 0;
        return "Win";
    }
    return "Not yet";
}

socket.on("gameWin", function (msg) {
    gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";
    alertText.style = msg.symbol === 'X' ? "color: #01C9E4;" : "color: #1F1D88;";
    alertText.innerHTML = `Winner is ${msg.symbol}`;
    userID = msg.id;
    setTimeout(function () {
        alertText.innerHTML = "";
    }, 2000);
});

restartButton.addEventListener('click', function () {
    socket.emit("restartGame", roomID);
});

socket.on("restartGame", function () {
    location.reload();
});

continueButton.addEventListener('click', function () {
    socket.emit("continueGame", { room: roomID, userId: userID });
});

socket.on("nextMatch", function () {
    for (let i = 0; i < 9; i++) {
        playerIcon[i].style = "display: none;";
        playerIcon[i].src = "";
        gameBlocker.style = "display: none;"
        buttons[i].dataset.symbol = "null";
        tieTest = 0;
    }
    continueButton.disabled = true;
    continueButton.style = "box-shadow: 0 10px 2px #6e0d0d";
});

buttons.forEach(function (button) {
    button.addEventListener('click', function (e) {
        for (let i = 0; i < 9; i++) {
            if (button.getAttribute("data-symbol") === 'X' || button.getAttribute("data-symbol") === 'O') {
                gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;"
                alertText.style = "color: red;";
                alertText.innerHTML = "Don't do it";
                setTimeout(function () {
                    alertText.innerHTML = "";
                    gameBlocker.style = "display: none";
                }, 2000);
                break;
            } else if (num == 0) {
                socket.emit("changeSymbol", { id: button.getAttribute("data-num"), symbol: 'X', roomid: roomID });
                gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";
                tieTest++;
                break;
            } else if (num == 1) {
                socket.emit("changeSymbol", { id: button.getAttribute("data-num"), symbol: 'O', roomid: roomID });
                gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";
                tieTest++;
                break;
            }
        }
    });
});

let controlWinPosition = "Not yet";

socket.on("showSymbol", function (msg) {
    playerIcon[msg.id].src = `image/player${msg.symbol}.png`;
    playerIcon[msg.id].style = "display: inline";
    buttons[msg.id].dataset.symbol = `${msg.symbol}`;
    controlWinPosition = winnerReact();
    num = !num;
    if (controlWinPosition === "Not yet") {
        if (checkTie()) {
            socket.emit("gameTie", roomID);
        }
    }
})

socket.on("ALERT", () => {
    gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";
})

socket.on("turnOffBlocker", () => {
    gameBlocker.style = "display: none; justify-content: center; align-items: center;";
})

socket.on("draw", function () {
    gameBlocker.style = "display: inline-flex; justify-content: center; align-items: center;";
    alertText.style = "color: #444444;";
    alertText.innerHTML = "Game is Tie";
    setTimeout(function () {
        alertText.innerHTML = "";
    }, 2000);
    scoreTie++;
    scoreTieFeedback.innerHTML = `${scoreTie} Draws`;
    continueButton.disabled = false;
    continueButton.style = "box-shadow: 0 10px 2px #222296";
})
