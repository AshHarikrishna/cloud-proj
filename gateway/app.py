from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Cloud Kahoot Gateway")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend origin "http://localhost:3000"
    allow_methods=["*"],
    allow_headers=["*"],
)

GAME_SERVICE_URL = "http://game-service:8001"
PLAYER_SERVICE_URL = "http://player-service:8002"
USER_SERVICE_URL = "http://user-service:8003"

@app.get("/")
def home():
    return {"message": "Welcome to Cloud Kahoot Gateway"}

@app.get("/status")
async def get_status():
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{GAME_SERVICE_URL}/status")
        return res.json()

@app.post("/join")
async def join_game(player: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{GAME_SERVICE_URL}/join", json=player)
        return res.json()

@app.post("/answer")
async def submit_answer(answer_data: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{GAME_SERVICE_URL}/answer", json=answer_data)
        return res.json()

# User service routes
@app.post("/register")
async def register(user_data: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{USER_SERVICE_URL}/register", json=user_data)
        return res.json()

@app.post("/login")
async def login(user_data: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{USER_SERVICE_URL}/login", json=user_data)
        return res.json()

@app.get("/currency/{username}")
async def get_currency(username: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{USER_SERVICE_URL}/currency/{username}")
        return res.json()

@app.post("/update_currency")
async def update_currency(username: str, amount: int):
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{USER_SERVICE_URL}/update_currency?username={username}&amount={amount}")
        return res.json()
