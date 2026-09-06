const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DB_DIR, "users.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readAll() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { users: [] };
  }
}

function writeAll(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function listUsers() {
  return readAll().users;
}

function getUser(username) {
  const lower = String(username || "").toLowerCase();
  return readAll().users.find((u) => u.username.toLowerCase() === lower) || null;
}

function createUser(username, passwordHash) {
  const data = readAll();
  const newUser = {
    username,
    passwordHash,
    tier: "free",
    createdAt: new Date().toISOString(),
  };
  data.users.push(newUser);
  writeAll(data);
  return newUser;
}

function setTier(username, tier) {
  const data = readAll();
  const user = data.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) return null;
  user.tier = tier;
  writeAll(data);
  return user;
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  setTier,
};
