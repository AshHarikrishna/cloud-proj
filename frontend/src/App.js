import React, { useState, useEffect } from "react";
import { login, register, logout, getGameStatus, joinGame, submitAnswer, updateCurrency } from "./api.js";

function App() {
  // --- Authentication States ---
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [currency, setCurrency] = useState(0);
  const [loginError, setLoginError] = useState("");

  // --- Game States ---
  const [countdown, setCountdown] = useState(30);
  const [joined, setJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionCountdown, setQuestionCountdown] = useState(10);
  const [roundFinished, setRoundFinished] = useState(false);

  const joinable = countdown > 0;
  const showQuestion = joined && gameStatus === "in-progress" && currentQuestion;

  // --- Poll Game Status ---
  useEffect(() => {
    if (!loggedInUser) return; // Don't poll if not logged in

    const poll = setInterval(async () => {
      try {
        const data = await getGameStatus();
        setCountdown(data.countdown || 0);
        setGameStatus(data.status);
        setPlayers(data.players || []);
        setQuestionCountdown(data.question_countdown || 0);
        setRoundFinished(data.round_finished || false);

        if (joined && data.players) {
          const me = data.players.find((p) => p.name === playerName);
          if (me) setMyScore(me.score);
        }

        if (!currentQuestion || data.current_question?.question !== currentQuestion?.question) {
          setCurrentQuestion(data.current_question);
          setCurrentQuestionNumber(data.current_question_number || 0);
          setTotalQuestions(data.total_questions || 0);
          setSelectedAnswer(null);
          setAnswerResult(null);
          setHasAnswered(false);
        }

        if (data.status === "joinable" && joined && countdown === 0) {
          setJoined(false);
          setSelectedAnswer(null);
          setAnswerResult(null);
          setHasAnswered(false);
          setMyScore(0);
          setRoundFinished(false);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [currentQuestion, joined, playerName, countdown, loggedInUser]);

  // Check if user won and award currency
  useEffect(() => {
    if (roundFinished && joined && loggedInUser) {
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      if (sortedPlayers[0] && sortedPlayers[0].name === playerName) {
        // Winner gets 100 coins
        updateCurrency(loggedInUser, 100)
          .then((data) => setCurrency(data.currency))
          .catch((err) => console.error("Error updating currency:", err));
      }
    }
  }, [roundFinished, players, playerName, joined, loggedInUser]);

  // --- Login/Register ---
  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    try {
      const data = isRegisterMode
        ? await register(username, password)
        : await login(username, password);

      setLoggedInUser(data.username);
      setCurrency(data.currency ?? 0);
      setLoginError("");
      setPlayerName(data.username); // Default player name to username
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedInUser(null);
      setCurrency(0);
      setJoined(false);
      setPlayerName("");
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // --- Join Game ---
  const handleJoin = async () => {
    if (!playerName.trim()) {
      alert("Please enter a player name!");
      return;
    }

    try {
      await joinGame(playerName);
      setJoined(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // --- Answer Handling ---
  const handleAnswerSelect = (index) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
  };

  const handleAnswerSubmit = async () => {
    if (hasAnswered || selectedAnswer === null) return;
    try {
      const result = await submitAnswer(selectedAnswer, playerName);
      setAnswerResult(result);
      setHasAnswered(true);
      
      // Award 5 coins for correct answer
      if (result.correct && loggedInUser) {
        updateCurrency(loggedInUser, 5)
          .then((data) => setCurrency(data.currency))
          .catch((err) => console.error("Error updating currency:", err));
      }
      
      if (result.score !== undefined) setMyScore(result.score);
    } catch (err) {
      console.error("Answer submit error:", err);
      setAnswerResult({
        correct: false,
        message: "Error submitting answer. Try again.",
        correct_answer: currentQuestion?.options[currentQuestion.correct],
        already_answered: false,
      });
      setHasAnswered(true);
    }
  };

  // --- RENDER ---
  return (
    <div style={{ textAlign: "center", marginTop: "50px", padding: "0 20px" }}>
      <h1>Cloud Kahoot 🎮</h1>

      {/* LOGIN / REGISTER */}
      {!loggedInUser ? (
        <div style={{ backgroundColor: "#f9f9f9", padding: "30px", maxWidth: "400px", margin: "30px auto", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2>{isRegisterMode ? "Register" : "Login"}</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ margin: "10px", padding: "10px", width: "80%", borderRadius: "5px", border: "1px solid #ccc" }}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAuth()}
            style={{ margin: "10px", padding: "10px", width: "80%", borderRadius: "5px", border: "1px solid #ccc" }}
          />
          <br />
          <button
            onClick={handleAuth}
            style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", margin: "10px" }}
          >
            {isRegisterMode ? "Register" : "Login"}
          </button>
          <p style={{ marginTop: "15px", cursor: "pointer", color: "#007bff" }} onClick={() => { setIsRegisterMode(!isRegisterMode); setLoginError(""); }}>
            {isRegisterMode ? "Already have an account? Login" : "No account? Register"}
          </p>
          {loginError && <p style={{ color: "red", marginTop: "10px" }}>{loginError}</p>}
        </div>
      ) : (
        <>
          {/* User Info Header */}
          <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "15px", backgroundColor: "#f0f0f0", padding: "10px 15px", borderRadius: "25px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>Welcome, {loggedInUser}!</div>
              <div style={{ fontSize: "14px", color: "#666" }}>💰 {currency} coins</div>
            </div>
            <button onClick={handleLogout} style={{ padding: "5px 10px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}>
              Logout
            </button>
          </div>

          {/* JOIN GAME */}
          {!joined ? (
            <div>
              <h2>Join the Game!</h2>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>Countdown: {countdown}s</p>

              {players.length > 0 && (
                <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f0f0f0", borderRadius: "8px", maxWidth: "400px", margin: "20px auto" }}>
                  <h3>Players Joined ({players.length}):</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                    {players.map((player) => (
                      <span key={player.name} style={{ padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", borderRadius: "15px", fontSize: "14px" }}>
                        {player.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ margin: "20px 0" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Player Name:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your game name"
                  style={{ padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc", width: "250px", textAlign: "center" }}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!joinable || !playerName.trim()}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  backgroundColor: joinable && playerName.trim() ? "green" : "grey",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: joinable && playerName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Join Game
              </button>
            </div>
          ) : roundFinished ? (
            <div>
              <h2>🎉 Round Finished! 🎉</h2>
              {players.length > 0 && players.sort((a, b) => b.score - a.score)[0]?.name === playerName && (
                <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: "15px", borderRadius: "8px", margin: "20px auto", maxWidth: "400px", border: "2px solid #c3e6cb" }}>
                  <h3>🏆 Congratulations! You Won! 🏆</h3>
                  <p>You earned 100 coins for winning! 💰</p>
                </div>
              )}
              <h3>Final Leaderboard</h3>
              <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                {players.sort((a, b) => b.score - a.score).map((player, index) => (
                  <div key={player.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", margin: "8px 0", backgroundColor: player.name === playerName ? "#4CAF50" : "#e9ecef", color: player.name === playerName ? "white" : "black", borderRadius: "8px", fontWeight: player.name === playerName ? "bold" : "normal", fontSize: "18px" }}>
                    <span>#{index + 1} {player.name}</span>
                    <span>{player.score} points</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: "20px", fontSize: "16px", color: "#666" }}>Next round starting soon...</p>
            </div>
          ) : showQuestion ? (
            <div>
              <h2>Question {currentQuestionNumber}/{totalQuestions}</h2>
              <p style={{ fontSize: "20px", margin: "20px 0" }}>{currentQuestion.question}</p>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: questionCountdown <= 3 ? "#ff4444" : "#333", margin: "20px 0" }}>
                Time: {questionCountdown}s
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", margin: "0 auto" }}>
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={hasAnswered}
                    style={{
                      backgroundColor: selectedAnswer === idx ? "#4CAF50" : "#f0f0f0",
                      color: selectedAnswer === idx ? "white" : "black",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "2px solid #ddd",
                      cursor: hasAnswered ? "not-allowed" : "pointer",
                      fontSize: "16px",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {!hasAnswered && (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={selectedAnswer === null}
                  style={{
                    padding: "10px 20px",
                    marginTop: "20px",
                    backgroundColor: selectedAnswer !== null ? "#2196F3" : "grey",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: selectedAnswer !== null ? "pointer" : "not-allowed",
                  }}
                >
                  Submit Answer
                </button>
              )}
              {answerResult && (
                <div style={{ marginTop: "20px", padding: "15px", backgroundColor: answerResult.correct ? "#d4edda" : "#f8d7da", borderRadius: "8px", maxWidth: "400px", margin: "20px auto" }}>
                  <p style={{ fontWeight: "bold" }}>{answerResult.message}</p>
                  <p>Correct answer: {answerResult.correct_answer}</p>
                  <p>Your score: {myScore}</p>
                </div>
              )}
              {players.length > 0 && (
                <div style={{ marginTop: "30px" }}>
                  <h3>Leaderboard</h3>
                  <div style={{ maxWidth: "400px", margin: "0 auto" }}>
                    {players.sort((a, b) => b.score - a.score).map((p, i) => (
                      <div key={p.name} style={{ fontWeight: p.name === playerName ? "bold" : "normal", padding: "5px 0" }}>
                        #{i + 1} {p.name}: {p.score} points
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p>Waiting for the next round...</p>
              <p>Status: {gameStatus}</p>
              <p>Countdown: {countdown}s</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;