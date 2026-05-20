const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("goalquest_token");
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

// AUTH
export const loginAPI = (email, password) =>
  fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).then(r => r.json());

export const registerAPI = (data) =>
  fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json());

// GOALS
export const fetchMyGoals   = () => fetch(`${BASE}/goals`,      { headers: headers() }).then(r => r.json());
export const fetchTeamGoals = () => fetch(`${BASE}/goals/team`, { headers: headers() }).then(r => r.json());
export const fetchAllGoals  = () => fetch(`${BASE}/goals/all`,  { headers: headers() }).then(r => r.json());

export const createGoal = (data) =>
  fetch(`${BASE}/goals`, {
    method: "POST", headers: headers(), body: JSON.stringify(data)
  }).then(r => r.json());

export const approveGoal = (id, remarks) =>
  fetch(`${BASE}/goals/${id}/approve`, {
    method: "PUT", headers: headers(), body: JSON.stringify({ remarks })
  }).then(r => r.json());

export const rejectGoal = (id, remarks) =>
  fetch(`${BASE}/goals/${id}/reject`, {
    method: "PUT", headers: headers(), body: JSON.stringify({ remarks })
  }).then(r => r.json());

export const logAchievement = (id, quarter, value) =>
  fetch(`${BASE}/goals/${id}/achievement`, {
    method: "PUT", headers: headers(), body: JSON.stringify({ quarter, value })
  }).then(r => r.json());

export const saveCheckin = (id, quarter, comment) =>
  fetch(`${BASE}/goals/${id}/checkin`, {
    method: "PUT", headers: headers(), body: JSON.stringify({ quarter, comment })
  }).then(r => r.json());

export const deleteGoal = (id) =>
  fetch(`${BASE}/goals/${id}`, {
    method: "DELETE", headers: headers()
  }).then(r => r.json());

// USERS
export const fetchAllUsers  = () => fetch(`${BASE}/users`,      { headers: headers() }).then(r => r.json());
export const fetchTeamUsers = () => fetch(`${BASE}/users/team`, { headers: headers() }).then(r => r.json());

// AI
export const suggestGoals = (role, dept, thrustArea) =>
  fetch(`${BASE}/ai/suggest-goals`, {
    method: "POST", headers: headers(), body: JSON.stringify({ role, dept, thrustArea })
  }).then(r => r.json());

export const getAIFeedback = (goalData) =>
  fetch(`${BASE}/ai/achievement-feedback`, {
    method: "POST", headers: headers(), body: JSON.stringify(goalData)
  }).then(r => r.json());

export const chatWithAI = (message, history) =>
  fetch(`${BASE}/ai/chat`, {
    method: "POST", headers: headers(), body: JSON.stringify({ message, history })
  }).then(r => r.json());