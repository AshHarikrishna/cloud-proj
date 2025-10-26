from fastapi import FastAPI, HTTPException
import threading
import time

app = FastAPI(title="Game Service")

JOINABLE_WINDOW = 60  # seconds to join
QUESTION_INTERVAL = 10  # seconds between questions
QUESTIONS_PER_ROUND = 1  # number of questions per round

# Simple questions database
QUESTIONS = [
    {"question": "What is 1 + 1?", "options": ["1", "2", "3", "4"], "correct": 1},
    {"question": "What is 5 - 3?", "options": ["1", "2", "3", "4"], "correct": 1},
    {"question": "What is 2 × 3?", "options": ["4", "5", "6", "7"], "correct": 2},
    {"question": "What is 8 ÷ 2?", "options": ["2", "3", "4", "5"], "correct": 2},
    {"question": "What is 10 - 7?", "options": ["2", "3", "4", "5"], "correct": 1}
]

current_round = {
    "id": 0,
    "countdown": 0,
    "players": [],  # List of player objects with scores
    "status": "waiting",  # waiting | joinable | in-progress | finished
    "current_question": None,
    "question_started": False,
    "player_answers": {},  # Track who has answered current question
    "current_question_number": 0,
    "total_questions": 0,
    "question_countdown": 0,
    "round_finished": False
}

def round_loop():
    global current_round
    while True:
        # Start a new round
        current_round["id"] += 1
        current_round["status"] = "joinable"
        current_round["countdown"] = JOINABLE_WINDOW
        current_round["players"] = []  # Clear all players - they must rejoin
        current_round["player_answers"] = {}
        current_round["current_question_number"] = 0
        current_round["total_questions"] = QUESTIONS_PER_ROUND
        current_round["question_countdown"] = 0
        current_round["round_finished"] = False
        print(f"Round {current_round['id']} joinable! Players must rejoin.")

        # Countdown loop
        while current_round["countdown"] > 0:
            time.sleep(1)
            current_round["countdown"] -= 1

        # Countdown done, start questions
        current_round["status"] = "in-progress"
        current_round["countdown"] = 0
        current_round["question_started"] = True
        print(f"Round {current_round['id']} in progress! Starting {QUESTIONS_PER_ROUND} questions...")

        # Run through all questions
        import random
        used_questions = []
        
        for question_num in range(1, QUESTIONS_PER_ROUND + 1):
            current_round["current_question_number"] = question_num
            current_round["player_answers"] = {}  # Reset answers for new question
            current_round["question_countdown"] = QUESTION_INTERVAL
            
            # Select a random unused question
            available_questions = [q for q in QUESTIONS if q not in used_questions]
            if not available_questions:
                available_questions = QUESTIONS  # Reset if all used
                used_questions = []
            
            selected_question = random.choice(available_questions)
            used_questions.append(selected_question)
            current_round["current_question"] = selected_question
            
            print(f"Round {current_round['id']} - Question {question_num}/{QUESTIONS_PER_ROUND}: {selected_question['question']}")
            
            # Countdown for this question
            for _ in range(QUESTION_INTERVAL):
                time.sleep(1)
                current_round["question_countdown"] -= 1
        
        # Round finished - show leaderboard
        current_round["status"] = "finished"
        current_round["current_question"] = None
        current_round["question_started"] = False
        current_round["player_answers"] = {}
        current_round["current_question_number"] = 0
        current_round["question_countdown"] = 0
        current_round["round_finished"] = True
        print(f"Round {current_round['id']} finished! Final leaderboard:")
        
        # Print final leaderboard
        sorted_players = sorted(current_round["players"], key=lambda x: x["score"], reverse=True)
        for i, player in enumerate(sorted_players, 1):
            print(f"#{i} {player['name']}: {player['score']} points")
        
        # Show leaderboard for 10 seconds
        time.sleep(10)
        
        # Reset for next round
        current_round["status"] = "waiting"
        current_round["round_finished"] = False
        print(f"Round {current_round['id']} waiting for next round...")
        
        # Short break before next round
        time.sleep(5)

# Start background thread
threading.Thread(target=round_loop, daemon=True).start()

@app.get("/status")
def get_status():
    return {
        "countdown": current_round["countdown"],
        "status": current_round["status"],
        "players_joined": len(current_round["players"]),
        "current_question": current_round["current_question"],
        "question_started": current_round["question_started"],
        "players": current_round["players"],
        "current_question_number": current_round["current_question_number"],
        "total_questions": current_round["total_questions"],
        "question_countdown": current_round["question_countdown"],
        "round_finished": current_round["round_finished"]
    }

@app.post("/join")
def join_game(player: dict):
    if current_round["status"] != "joinable":
        raise HTTPException(status_code=400, detail="Cannot join, round not open")

    # Check if player already exists
    player_name = player.get("name", "Unknown")
    existing_player = next((p for p in current_round["players"] if p["name"] == player_name), None)
    
    if existing_player:
        return {"message": "Already joined", "players_joined": len(current_round["players"])}
    
    # Create player object with score tracking
    new_player = {
        "name": player_name,
        "score": 0,
        "total_questions": 0,
        "correct_answers": 0
    }
    
    current_round["players"].append(new_player)
    return {"message": "Joined successfully", "players_joined": len(current_round["players"])}

@app.post("/answer")
def submit_answer(answer_data: dict):
    if current_round["status"] != "in-progress" or not current_round["question_started"]:
        raise HTTPException(status_code=400, detail="No active question")
    
    question = current_round["current_question"]
    selected_option = answer_data.get("answer")
    player_name = answer_data.get("player_name", "Unknown")
    
    if selected_option is None:
        raise HTTPException(status_code=400, detail="No answer provided")
    
    # Check if player has already answered this question
    if player_name in current_round["player_answers"]:
        return {
            "correct": False,
            "correct_answer": question["options"][question["correct"]],
            "message": f"{player_name} already answered this question!",
            "already_answered": True
        }
    
    # Find the player and update their stats
    player = next((p for p in current_round["players"] if p["name"] == player_name), None)
    if not player:
        raise HTTPException(status_code=400, detail="Player not found")
    
    is_correct = selected_option == question["correct"]
    
    # Update player stats
    player["total_questions"] += 1
    if is_correct:
        player["correct_answers"] += 1
        player["score"] += 10  # 10 points per correct answer
    
    # Mark player as answered
    current_round["player_answers"][player_name] = {
        "answer": selected_option,
        "correct": is_correct,
        "timestamp": time.time()
    }
    
    return {
        "correct": is_correct,
        "correct_answer": question["options"][question["correct"]],
        "message": f"{player_name} answered {'correctly' if is_correct else 'incorrectly'}!",
        "score": player["score"],
        "already_answered": False
    }
