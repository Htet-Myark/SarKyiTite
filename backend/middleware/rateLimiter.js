const rateLimit = require('express-rate-limit');

const isLocalhost = (req) =>
  req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';

// 10 registration attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: isLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this IP. Try again in an hour.' },
});

// 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: isLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
});

// 5 password-reset emails per hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: isLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Try again in an hour.' },
});

module.exports = { registerLimiter, loginLimiter, forgotPasswordLimiter };
