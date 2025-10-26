const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Store session token in memory
let sessionToken = null;

export const setSessionToken = (token) => {
  sessionToken = token;
};

export const getSessionToken = () => {
  return sessionToken;
};

export const clearSessionToken = () => {
  sessionToken = null;
};

// Authentication APIs
export const register = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }
  
  // Store session token
  if (data.session_token) {
    setSessionToken(data.session_token);
  }
  
  return data;
};

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }
  
  // Store session token
  if (data.session_token) {
    setSessionToken(data.session_token);
  }
  
  return data;
};

export const logout = async () => {
  if (!sessionToken) return;
  
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: sessionToken }),
    });
  } finally {
    clearSessionToken();
  }
};

export const getCurrency = async (username) => {
  const response = await fetch(`${API_BASE_URL}/currency/${username}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to get currency");
  }
  
  return data;
};

export const updateCurrency = async (username, amount) => {
  const response = await fetch(`${API_BASE_URL}/update_currency?username=${username}&amount=${amount}`, {
    method: "POST",
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update currency");
  }
  
  return data;
};

// Game APIs
export const getGameStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/status`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error("Failed to get game status");
  }
  
  return data;
};

export const joinGame = async (playerName) => {
  const response = await fetch(`${API_BASE_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to join game");
  }
  
  return data;
};

export const submitAnswer = async (answer, playerName) => {
  const response = await fetch(`${API_BASE_URL}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer, player_name: playerName }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to submit answer");
  }
  
  return data;
};