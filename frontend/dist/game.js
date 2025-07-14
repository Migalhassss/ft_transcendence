export default function initGame(canvas, socket) {
    console.log("check");
    const ctx = canvas.getContext("2d");
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 2000;
    function resizeCanvas() {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    let currentDirection = 'stop';
    const handleKeyDown = (e) => {
        if (e.key === "ArrowUp")
            currentDirection = "up";
        else if (e.key === "ArrowDown")
            currentDirection = "down";
        else
            return;
        socket.send(JSON.stringify({ type: "move", direction: currentDirection }));
    };
    const handleKeyUp = () => {
        currentDirection = "stop";
        socket.send(JSON.stringify({ type: "move", direction: currentDirection }));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    let gameState = null;
    socket.onopen = () => console.log("Connected to Pong server");
    socket.onerror = (error) => console.error("WebSocket error:", error);
    socket.onclose = () => console.log("Disconnected from Pong server");
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
        // Draw ball (red)
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(gameState.ball.x * scaleX, gameState.ball.y * scaleY, 10 * ((scaleX + scaleY) / 2), 0, Math.PI * 2);
        ctx.fill();
        // Draw paddles (green)
        ctx.fillStyle = 'green';
        ctx.fillRect(10 * scaleX, gameState.paddles.left * scaleY, 10 * scaleX, 150 * scaleY);
        ctx.fillRect((GAME_WIDTH - 20) * scaleX, gameState.paddles.right * scaleY, 10 * scaleX, 150 * scaleY);
        // Draw score (white)
        ctx.fillStyle = "white";
        ctx.font = `${20 * ((scaleX + scaleY) / 2)}px Arial`;
        ctx.fillText(`${gameState.scores.left}`, canvas.width / 3, 40);
        ctx.fillText(`${gameState.scores.right}`, (2 * canvas.width) / 3, 40);
    }
    // Optional cleanup you can return
    return () => {
        socket.close();
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
    };
}
//# sourceMappingURL=game.js.map