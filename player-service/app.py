from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Player Service")

# Allow frontend to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or "http://localhost:3000"
    allow_methods=["*"],
    allow_headers=["*"],
)

players = []

# URL of game service to check status
GAME_SERVICE_URL = "http://game-service:8001"

@app.post("/join")
async def join_game(player: dict):
    # Check game status
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{GAME_SERVICE_URL}/status")
        status = res.json().get("status")

    if status != "joinable":
        raise HTTPException(status_code=400, detail="Cannot join, round not open")

    if len(players) >= 10:
        return {"message": "Lobby full, wait for next round"}

    players.append(player)
    return {"message": f"{player.get('name')} joined the lobby", "current_players": len(players)}

@app.get("/players")
def list_players():
    return players
