"use strict";
const canvas = document.createElement("canvas");
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Set initial size
// Replace with actual game dimensions (for scaling)
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
// Get JWT token
const token = localStorage.getItem("authToken");
if (!token) {
    alert("No auth token found. Please log in.");
    throw new Error("Missing auth token");
}
// Connect to WebSocket backend
const socket = new WebSocket(`ws://localhost:3000/game/pong?token=${token}`);
// Movement input
let currentDirection = 'stop';
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp")
        currentDirection = "up";
    else if (e.key === "ArrowDown")
        currentDirection = "down";
    else
        return;
    socket.send(JSON.stringify({ type: "move", direction: currentDirection }));
});
document.addEventListener("keyup", () => {
    currentDirection = "stop";
    socket.send(JSON.stringify({ type: "move", direction: currentDirection }));
});
// WebSocket events
socket.onopen = () => {
    console.log("Connected to Pong server");
};
socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};
socket.onclose = () => {
    console.log("Disconnected from Pong server");
};
// Game state + rendering
let gameState = null;
socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case "start":
                console.log(`Game started as ${data.role}`);
                break;
            case "joined":
                console.log(data.message);
                break;
            case "state":
                gameState = data;
                draw();
                break;
            default:
                console.log("Unknown message:", data);
        }
    }
    catch (err) {
        console.error("Invalid JSON from server:", event.data);
    }
};
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / GAME_WIDTH;
    const scaleY = canvas.height / GAME_HEIGHT;
    ctx.fillStyle = "white";
    // Ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x * scaleX, gameState.ball.y * scaleY, 10 * ((scaleX + scaleY) / 2), 0, Math.PI * 2);
    ctx.fill();
    // Paddles
    ctx.fillRect(10 * scaleX, gameState.paddles.left * scaleY, 10 * scaleX, 80 * scaleY);
    ctx.fillRect((GAME_WIDTH - 20) * scaleX, gameState.paddles.right * scaleY, 10 * scaleX, 80 * scaleY);
    // Score
    ctx.font = `${20 * ((scaleX + scaleY) / 2)}px Arial`;
    ctx.fillText(`${gameState.scores.left}`, canvas.width / 3, 40);
    ctx.fillText(`${gameState.scores.right}`, (2 * canvas.width) / 3, 40);
}
//# sourceMappingURL=game.js.map