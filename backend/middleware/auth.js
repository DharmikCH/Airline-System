const jwt = require('jsonwebtoken');
const { sendError } = require('./errorHandler');

// Reads the JWT from the Authorization header and puts the caller's identity
// on req.user for the controllers to use.
//
// The token itself carries { id, role }, so this does not query the database.
// That keeps every authenticated request one query cheaper, at the cost of a
// token staying valid for its full 24 hours even if the account changes.
function protect(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 401, 'NO_TOKEN', 'You must be logged in to do that.');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    // Covers a tampered signature and an expired token alike. Either way the
    // client has to log in again, so one code is enough.
    return sendError(res, 401, 'INVALID_TOKEN', 'Your session is invalid or has expired.');
  }
}

// Must be used after protect, which is what sets req.user.
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 403, 'ADMIN_ONLY', 'This action is for administrators only.');
  }
  return next();
}

module.exports = { protect, adminOnly };
