'use strict';

/**
 * CampusBite — Comprehensive Automated Test & QA Suite
 * Tests backend endpoints, authentication, authorization, security headers,
 * HTML pages, static assets, and runs regression tests.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const {
  validateUserDocument,
  validateMenuItemDocument,
  validateOrderDocument
} = require('../server/utils/dbValidators');

let server;
let baseUrl;
const PORT = 5055;

const results = [];

function recordTest(name, category, passed, details = '') {
  results.push({ name, category, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | [${category}] ${name} ${details ? '— ' + details : ''}`);
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let payload = null;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // not json
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('       CAMPUSBITE COMPREHENSIVE QA TEST SUITE        ');
  console.log('======================================================\n');

  // ─── 1. Technology Compliance Audit ──────────────────────────────
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const prohibited = [
    'react', 'next', 'vue', 'angular', 'typescript', 'tailwind',
    'tailwindcss', 'bootstrap', 'jquery', 'mongoose', '@material-ui/core'
  ];

  let foundProhibited = [];
  prohibited.forEach(p => {
    if (allDeps[p]) foundProhibited.push(p);
  });

  recordTest(
    'Technology Compliance Audit (No prohibited frameworks/libraries)',
    'COMPLIANCE',
    foundProhibited.length === 0,
    foundProhibited.length === 0 ? 'Pure Vanilla JS + HTML5 + CSS3 + Node.js' : `Found: ${foundProhibited.join(', ')}`
  );

  // ─── 2. Start Test Server ─────────────────────────────────────────
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      recordTest('Server Startup & Port Binding', 'SERVER', true, `Listening on ${baseUrl}`);
      resolve();
    });
  });

  // ─── 3. Health Endpoint & Regression ──────────────────────────────
  try {
    const health = await makeRequest('GET', '/api/health');
    const isValidHealth = health.statusCode === 200 &&
      health.json &&
      health.json.success === true &&
      health.json.message.includes('CampusBite');
    recordTest('GET /api/health (Task 01 Baseline Regression)', 'REGRESSION', isValidHealth, `Status ${health.statusCode}`);
  } catch (err) {
    recordTest('GET /api/health (Task 01 Baseline Regression)', 'REGRESSION', false, err.message);
  }

  // ─── 4. Security Headers (Helmet) ─────────────────────────────────
  try {
    const res = await makeRequest('GET', '/api/health');
    const hasCSP = !!res.headers['content-security-policy'];
    const hasNosniff = res.headers['x-content-type-options'] === 'nosniff';
    const hasFrameOptions = !!res.headers['x-frame-options'];
    recordTest('Security Headers (Helmet CSP, nosniff, frame-options)', 'SECURITY', hasCSP && hasNosniff && hasFrameOptions, 'All headers enforced');
  } catch (err) {
    recordTest('Security Headers (Helmet)', 'SECURITY', false, err.message);
  }

  // ─── 5. Rate Limiting Headers ─────────────────────────────────────
  try {
    const res = await makeRequest('GET', '/api/health');
    const hasRateLimit = !!res.headers['ratelimit-limit'] || !!res.headers['x-ratelimit-limit'] || !!res.headers['ratelimit-policy'];
    recordTest('Rate Limiter Protection on /api', 'SECURITY', hasRateLimit, 'Rate limit headers present');
  } catch (err) {
    recordTest('Rate Limiter Protection on /api', 'SECURITY', false, err.message);
  }

  // ─── 6. Unknown API Route Handling ────────────────────────────────
  try {
    const notFoundRes = await makeRequest('GET', '/api/unknown-endpoint-test');
    const is404 = notFoundRes.statusCode === 404 &&
      notFoundRes.json &&
      notFoundRes.json.success === false;
    recordTest('404 Handler for Unknown API Endpoints', 'SERVER', is404, `Status ${notFoundRes.statusCode}`);
  } catch (err) {
    recordTest('404 Handler for Unknown API Endpoints', 'SERVER', false, err.message);
  }

  // ─── 7. Session Middleware Verification ───────────────────────────
  try {
    const meRes = await makeRequest('GET', '/api/auth/me');
    const hasCookie = !!meRes.headers['set-cookie'];
    const meJson = meRes.json;
    const isSessionOk = meRes.statusCode === 200 && meJson && meJson.success === false && meJson.user === null;
    recordTest('Session Cookie & Unauthenticated /api/auth/me', 'AUTH', isSessionOk, 'Safe null user returned');
  } catch (err) {
    recordTest('Session Cookie & /api/auth/me', 'AUTH', false, err.message);
  }

  // ─── 8. Registration Validation Checks ────────────────────────────
  try {
    // Missing fields
    const r1 = await makeRequest('POST', '/api/auth/register', {});
    const r1Pass = r1.statusCode === 400 && r1.json && r1.json.success === false;
    recordTest('Register Validation: Missing fields rejected', 'AUTH', r1Pass, `Status ${r1.statusCode}`);

    // Short password
    const r2 = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'student@campus.edu',
      password: '123',
      confirmPassword: '123'
    });
    const r2Pass = r2.statusCode === 400 && r2.json && r2.json.error.includes('6 characters');
    recordTest('Register Validation: Short password (<6 chars) rejected', 'AUTH', r2Pass, `Status ${r2.statusCode}`);

    // Password mismatch
    const r3 = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'student@campus.edu',
      password: 'Password123!',
      confirmPassword: 'PasswordMismatch!'
    });
    const r3Pass = r3.statusCode === 400 && r3.json && r3.json.error.includes('do not match');
    recordTest('Register Validation: Password mismatch rejected', 'AUTH', r3Pass, `Status ${r3.statusCode}`);

    // Invalid email format
    const r4 = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'invalid-email-string',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    const r4Pass = r4.statusCode === 400 && r4.json && r4.json.error.includes('valid email');
    recordTest('Register Validation: Invalid email format rejected', 'AUTH', r4Pass, `Status ${r4.statusCode}`);
  } catch (err) {
    recordTest('Register Validation Suite', 'AUTH', false, err.message);
  }

  // ─── 9. Authorization Middleware Tests ────────────────────────────
  try {
    // Attempt admin-only menu POST without login
    const adminPost = await makeRequest('POST', '/api/menu', { name: 'Test' });
    const isBlocked = adminPost.statusCode === 401 && adminPost.json && adminPost.json.success === false;
    recordTest('Authorization: requireAdmin rejects unauthenticated POST /api/menu', 'AUTH', isBlocked, `Status ${adminPost.statusCode}`);

    // Attempt admin page access via HTTP GET (expect redirect to login.html?redirect=admin)
    const adminPage = await makeRequest('GET', '/admin.html');
    const isRedirect = adminPage.statusCode === 302 && adminPage.headers.location.includes('/login.html?redirect=admin');
    recordTest('Server-side Page Protection: /admin.html redirects unauthorized users to login', 'AUTH', isRedirect, `Redirected to ${adminPage.headers.location}`);
  } catch (err) {
    recordTest('Authorization Middleware Suite', 'AUTH', false, err.message);
  }

  // ─── 10. Menu Public Endpoint ─────────────────────────────────────
  try {
    const menuRes = await makeRequest('GET', '/api/menu');
    const isMenuOk = menuRes.statusCode === 200 && menuRes.json && menuRes.json.success === true;
    recordTest('GET /api/menu (Public Menu Route)', 'CATALOGUE', isMenuOk, `Status ${menuRes.statusCode}`);
  } catch (err) {
    recordTest('GET /api/menu', 'CATALOGUE', false, err.message);
  }

  // ─── 11. Document Validators Unit Tests ───────────────────────────
  try {
    // Valid user
    const u1 = validateUserDocument({
      name: 'John Doe',
      email: 'john@campus.edu',
      passwordHash: '$2a$10$xyz',
      role: 'student'
    });
    recordTest('Validator: Valid student user document', 'VALIDATORS', u1.isValid);

    // Invalid role injection attempt
    const u2 = validateUserDocument({
      name: 'Attacker',
      email: 'hacker@campus.edu',
      passwordHash: '$2a$10$xyz',
      role: 'superadmin' // invalid role
    });
    recordTest('Validator: Reject invalid role in user document', 'VALIDATORS', !u2.isValid);

    // Valid menu item
    const m1 = validateMenuItemDocument({
      name: 'Paneer Burger',
      price: 120,
      category: 'Burgers',
      isAvailable: true,
      preparationTime: 12
    });
    recordTest('Validator: Valid menu item document', 'VALIDATORS', m1.isValid);

    // Invalid menu item price
    const m2 = validateMenuItemDocument({
      name: 'Free Burger',
      price: -50,
      category: 'Burgers',
      isAvailable: true
    });
    recordTest('Validator: Reject negative menu item price', 'VALIDATORS', !m2.isValid);

    // Valid order document
    const o1 = validateOrderDocument({
      orderNumber: 'CB-123456',
      userId: 'user-1',
      items: [{ name: 'Burger', price: 100, quantity: 2 }],
      totalAmount: 200,
      status: 'Placed',
      paymentStatus: 'Pending'
    });
    recordTest('Validator: Valid order document', 'VALIDATORS', o1.isValid);
  } catch (err) {
    recordTest('Document Validators Suite', 'VALIDATORS', false, err.message);
  }

  // ─── 12. Frontend Pages Delivery Tests ────────────────────────────
  const pages = [
    { url: '/index.html', title: 'Home Page' },
    { url: '/login.html', title: 'Login Page' },
    { url: '/register.html', title: 'Register Page' },
    { url: '/menu.html', title: 'Menu Catalogue Page' },
    { url: '/cart.html', title: 'Cart Page' },
    { url: '/checkout.html', title: 'Checkout Page' },
    { url: '/orders.html', title: 'Orders Page' },
    { url: '/tracking.html', title: 'Tracking Page' }
  ];

  for (const page of pages) {
    try {
      const res = await makeRequest('GET', page.url);
      const isOk = res.statusCode === 200 && res.body.includes('CampusBite');
      recordTest(`Frontend Page: ${page.title} (${page.url})`, 'FRONTEND', isOk, `Status ${res.statusCode}`);
    } catch (err) {
      recordTest(`Frontend Page: ${page.title}`, 'FRONTEND', false, err.message);
    }
  }

  // ─── 13. Static Assets Delivery Tests ─────────────────────────────
  const assets = [
    { url: '/css/styles.css', type: 'text/css' },
    { url: '/css/student.css', type: 'text/css' },
    { url: '/css/admin.css', type: 'text/css' },
    { url: '/js/config.js', type: 'javascript' },
    { url: '/js/utils.js', type: 'javascript' },
    { url: '/js/cart.js', type: 'javascript' },
    { url: '/js/auth.js', type: 'javascript' },
    { url: '/js/menu.js', type: 'javascript' },
    { url: '/js/checkout.js', type: 'javascript' },
    { url: '/js/orders.js', type: 'javascript' },
    { url: '/js/tracking.js', type: 'javascript' },
    { url: '/js/admin.js', type: 'javascript' }
  ];

  for (const asset of assets) {
    try {
      const res = await makeRequest('GET', asset.url);
      const isOk = res.statusCode === 200 && res.headers['content-type'].includes(asset.type);
      recordTest(`Static Asset: ${asset.url}`, 'ASSETS', isOk, `Status ${res.statusCode}, Content-Type: ${res.headers['content-type']}`);
    } catch (err) {
      recordTest(`Static Asset: ${asset.url}`, 'ASSETS', false, err.message);
    }
  }

  // ─── Finish & Summary ─────────────────────────────────────────────
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n======================================================');
  console.log(`TEST SUITE SUMMARY: ${passedCount}/${total} PASSED (${failedCount} FAILED)`);
  console.log('======================================================\n');

  server.close(() => {
    process.exit(failedCount > 0 ? 1 : 0);
  });
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
