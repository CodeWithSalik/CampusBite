'use strict';

/**
 * Authentication & Role-Based Authorization Middleware
 */

/**
 * Require an authenticated session
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please log in to continue.'
    });
  }
  next();
}

/**
 * Require a student role
 */
function requireStudent(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please log in to continue.'
    });
  }
  if (req.session.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Student access required.'
    });
  }
  next();
}

/**
 * Require an administrator role
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Admin credentials required.'
    });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Admin access required.'
    });
  }
  next();
}

/**
 * Server-side page route protection for Admin HTML pages.
 * Redirects unauthorized requests to login page.
 */
function protectAdminPages(req, res, next) {
  // If requesting an admin page
  if (req.path.startsWith('/admin') && (req.path.endsWith('.html') || req.path === '/admin')) {
    if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/login.html?redirect=admin');
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireStudent,
  requireAdmin,
  protectAdminPages
};
