const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../middleware/errorHandler');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // Checked here rather than left to Mongoose so the caller gets one clear
    // message instead of a schema error, and never a 500 for a missing field.
    if (!name || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Name, email and password are required.');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'An account with that email already exists.');
    }

    // 10 salt rounds: the cost is deliberate, it makes brute-forcing a stolen
    // hash slow. The plain password is never stored or logged.
    const password_hash = await bcrypt.hash(password, 10);

    await User.create({ name, email, password_hash, phone });

    return res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (err) {
    // Two people registering the same email at the same moment both pass the
    // findOne check above, then the unique index rejects the second insert.
    // The check is the friendly path; this is the guarantee.
    if (err.code === 11000) {
      return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'An account with that email already exists.');
    }
    return next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    // password_hash is select:false on the schema, so it has to be asked for
    // explicitly here. Without the +, bcrypt.compare would get undefined.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');

    // A wrong email and a wrong password return exactly the same response.
    // Saying "no such user" would let anyone test which emails have accounts.
    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    // Only the id and role go in the token. It is signed, not encrypted, so
    // anyone can read its contents — nothing private belongs in here.
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
