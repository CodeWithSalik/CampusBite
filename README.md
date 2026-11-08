# CampusBite — Smart Canteen Ordering System

A web-based canteen ordering system built for the CSE326 academic project.

## Technology Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+)  |
| Backend  | Node.js, Express.js                     |
| Database | MongoDB Atlas (official Node.js driver) |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd CampusBite

# 2. Install dependencies
npm install
```

## Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable        | Description                              | Default       |
| --------------- | ---------------------------------------- | ------------- |
| `PORT`          | Port the server listens on               | `5000`        |
| `MONGODB_URI`   | MongoDB Atlas connection string          | *(required)*  |
| `DB_NAME`       | Database name                            | `campusbite`  |
| `SESSION_SECRET` | Secret for signing session cookies      | *(required)*  |
| `NODE_ENV`      | `development` or `production`            | `development` |

> **Note:** Never commit `.env` to version control. It is listed in `.gitignore`.

## Running Locally

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server starts at **http://localhost:5000** by default.

### Health Check

```
GET /api/health
```

Returns:

```json
{
  "success": true,
  "message": "CampusBite API is running",
  "timestamp": "...",
  "uptime": 12.34
}
```

## Folder Structure

```
CampusBite/
├── public/                 # Static frontend files
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── assets/             # Images, fonts, etc.
├── server/                 # Backend source code
│   ├── config/             # Database & app configuration
│   │   └── database.js     # MongoDB connection manager
│   ├── controllers/        # Route handler logic
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js # Centralised error handler
│   │   └── notFound.js     # 404 handler for API routes
│   ├── routes/             # Express route definitions
│   │   └── health.js       # Health-check route
│   ├── services/           # Business logic layer
│   └── utils/              # Helper / utility functions
├── scripts/                # Dev & maintenance scripts
├── server.js               # Application entry point
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── AGENTS.md               # AI agent instructions
├── README.md               # This file
└── package.json            # npm project metadata
```

## License

Academic project — CSE326.
