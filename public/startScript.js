let inputPlayerName;
let inputRealname;
let room;
let startGame = document.getElementById("game-start");
let blockPlayerRect = document.getElementById("playerAlert");
let gameError = document.getElementById("textAlert");
let rooms = ["3243", "1244", "4833"];
let socket = io();


startGame.addEventListener("click", function () {
    inputPlayerName = document.getElementById("playername").value;
    inputRealname = document.getElementById("realname").value;
    room = document.getElementById("room").value;

    if (!inputPlayerName) {
        blockPlayerRect.style.display = "flex";
        gameError.innerHTML = "ყველა მოთამაშეს სჭირდება სახელი";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    } else if (!inputRealname) {
        blockPlayerRect.style.display = "flex";
        gameError.innerHTML = "შენი სახელი დაგავიწყდა";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    } else if (!room) {
        blockPlayerRect.style.display = "flex";
        gameError.innerHTML = "ოთახის ნომერი დაგაიწყდა";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);
        return;
    } else if (rooms.indexOf(room) === -1) {
        blockPlayerRect.style.display = "flex";
        gameError.innerHTML = "room - ის კოდი არასწორია";
        setTimeout(function () {
            blockPlayerRect.style.display = "none";
        }, 2000);                                                     
        return;
    }

    socket.emit("createRoom", { id: room, playerName: inputPlayerName, name: inputRealname });

    socket.on("gameStart", () => {
        setTimeout(() => {
            window.location.href = "game.html";
            socket.emit("joinRoom", room);
        }, 100);
    });
    
});

