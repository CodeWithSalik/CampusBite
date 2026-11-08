# AGENTS.md — CampusBite

## Project Overview

CampusBite is a Smart Canteen Ordering System built as a CSE326 academic project.

## Technology Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript ES6+ |
| Backend  | Node.js, Express.js                 |
| Database | MongoDB Atlas (official Node.js driver) |

## Prohibited Technologies

Do **not** introduce any of the following:

- React, Next.js, Vue, Angular
- TypeScript, JSX
- Tailwind, Bootstrap, jQuery
- Mongoose

## Architecture

```
CampusBite/
├── public/             # Static frontend (HTML, CSS, JS, assets)
│   ├── css/
│   ├── js/
│   └── assets/
├── server/             # Backend source code
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Route handler logic
│   ├── middleware/      # Express middleware (auth, errors, etc.)
│   ├── routes/         # Express route definitions
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── scripts/            # Development and maintenance scripts
├── server.js           # Application entry point
├── .env.example        # Environment variable template
└── package.json        # Node.js project metadata
```

## Coding Conventions

- Use `'use strict';` at the top of every JS file.
- Use CommonJS (`require` / `module.exports`) — no ES module `import` syntax.
- Never hardcode secrets; always read from environment variables.
- Use the official MongoDB Node.js driver directly (no ODM/ORM).
- All API responses follow `{ success: boolean, ... }` shape.
- Keep controllers thin; business logic belongs in `server/services/`.
