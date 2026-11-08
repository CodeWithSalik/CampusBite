'use strict';

const authService = require('../services/authService');

const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, confirmPassword } = req.body;
      const user = await authService.registerStudent({ name, email, password, confirmPassword });

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        user
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await authService.verifyCredentials(email, password);

      // Regenerate session ID to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return next(err);
        }

        // Attach sanitized user to session
        req.session.user = user;

        res.json({
          success: true,
          message: 'Login successful.',
          user
        });
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      if (!req.session) {
        return res.json({ success: true, message: 'Logged out.' });
      }

      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: 'Logged out successfully.'
        });
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   */
  async getCurrentUser(req, res) {
    if (req.session && req.session.user) {
      return res.json({
        success: true,
        user: req.session.user
      });
    }
    return res.json({
      success: false,
      user: null
    });
  }
};

module.exports = authController;
