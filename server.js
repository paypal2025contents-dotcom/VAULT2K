require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const db = require("./lib/db");
const { requireUser, requireAdmin } = require("./lib/auth");

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12";
const SESSION_SECRET = process.env.SESSION_SECRET || "vault2k26-dev-secret";

function loadContent() {
  const raw = fs.readFileSync(
    path.join(__dirname, "config", "content.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.get("/", (req, res) => {
  if (req.session.role === "admin") return res.redirect("/admin");
  if (req.session.role === "user") return res.redirect("/dashboard");
  return res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", {
    error: req.query.error === "1",
    registered: req.query.registered === "1",
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.role = "admin";
    req.session.username = username;
    return res.redirect("/admin");
  }

  const user = db.getUser(username);
  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    req.session.role = "user";
    req.session.username = user.username;
    return res.redirect("/dashboard");
  }

  return res.redirect("/login?error=1");
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const { username, password, confirm } = req.body;

  if (!username || !password || !confirm) {
    return res.render("register", { error: "All fields are required." });
  }
  if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
    return res.render("register", { error: "That username is not available." });
  }
  if (db.getUser(username)) {
    return res.render("register", { error: "That username is already taken." });
  }
  if (password !== confirm) {
    return res.render("register", { error: "Passwords do not match." });
  }
  if (password.length < 4) {
    return res.render("register", { error: "Password must be at least 4 characters." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.createUser(username, passwordHash);

  return res.redirect("/login?registered=1");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/dashboard", requireUser, (req, res) => {
  const user = db.getUser(req.session.username);
  res.render("dashboard", {
    username: req.session.username,
    tier: user ? user.tier : "free",
    content: loadContent(),
  });
});

app.get("/dashboard/page2", requireUser, (req, res) => {
  const user = db.getUser(req.session.username);
  res.render("page2", {
    tier: user ? user.tier : "free",
    content: loadContent(),
  });
});

app.get("/dashboard/page5", requireUser, (req, res) => {
  const user = db.getUser(req.session.username);
  res.render("page5", {
    tier: user ? user.tier : "free",
    content: loadContent(),
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  res.render("admin", {});
});

app.get("/admin/users", requireAdmin, (req, res) => {
  const users = db.listUsers().slice().reverse();
  res.render("admin-users", { users });
});

app.post("/admin/upgrade", requireAdmin, (req, res) => {
  const { username, tier } = req.body;
  if (username && (tier === "vip" || tier === "free")) {
    db.setTier(username, tier);
  }
  res.redirect("/admin/users");
});

app.listen(PORT, () => {
  console.log(`Vault2K26 running on port ${PORT}`);
});
