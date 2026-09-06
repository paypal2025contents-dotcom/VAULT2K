function requireUser(req, res, next) {
  if (req.session && req.session.role === "user") {
    return next();
  }
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.role === "admin") {
    return next();
  }
  return res.redirect("/login");
}

module.exports = { requireUser, requireAdmin };
