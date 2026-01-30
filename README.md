# Zoezi App Starter

A starter template for building apps that integrate with the Zoezi gym membership platform API.

## What This Is

This repository provides everything you need to start building custom applications that interact with the Zoezi API:

- **API Documentation** - Complete Zoezi API reference (`Zoezi API docs.json`)
- **Architecture Guides** - Understanding how Zoezi works (`docs/`)
- **Date Utilities** - Helpful date functions (`dateextensions.js`)
- **Server Template** - Ready-to-run Express server for Replit (`index.js`)

## Quick Start

### Running on Replit

1. Import this repository to Replit
2. The `index.js` file will automatically be detected as the entry point
3. Add your Zoezi API credentials to Replit Secrets:
   - `ZOEZI_API_URL` - Your Zoezi API base URL
   - `ZOEZI_API_KEY` - Your API key (if required)
4. Click "Run"

### Running Locally

```bash
npm install
npm start
```

The server will start on port 3000 (or the PORT environment variable).

## Repository Structure

```
zoezi-app-starter/
├── index.js                    # Express server entry point (Replit-ready)
├── public/                     # Static frontend files
│   └── index.html              # Frontend entry point
├── Zoezi API docs.json         # Complete Zoezi API documentation
├── dateextensions.js           # Date utility functions
├── docs/                       # Zoezi documentation
│   ├── README.md               # Documentation overview
│   ├── zoezi-architecture/     # System architecture docs
│   ├── zoezi-patterns/         # Integration patterns
│   └── zoezi-components/       # Component reference
├── CLAUDE.md                   # AI assistant instructions
└── README.md                   # This file
```

## Building Your App

### 1. Understand the Zoezi API

Start by reading the API documentation in `Zoezi API docs.json`. Key endpoints include:

- **Authentication** - User login and session management
- **Members** - Member data and subscriptions
- **Products** - Shop items and memberships
- **Bookings** - Group training and resource bookings
- **Sites** - Multi-location support

### 2. Backend (index.js)

The Express server provides:

- API proxy endpoints to Zoezi
- Static file serving for the frontend
- Environment variable configuration

Example API call:

```javascript
// In index.js
app.get('/api/products', async (req, res) => {
  const response = await fetch(`${ZOEZI_API_URL}/api/products`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await response.json();
  res.json(data);
});
```

### 3. Frontend (public/)

Build your frontend in the `public/` folder. The included `index.html` provides a basic starting point.

Example fetching data:

```javascript
// In your frontend JavaScript
const products = await fetch('/api/products').then(r => r.json());
```

## Documentation Index

| Document | Description |
|----------|-------------|
| [docs/README.md](./docs/README.md) | Documentation overview |
| [docs/zoezi-architecture/SYSTEM-OVERVIEW.md](./docs/zoezi-architecture/SYSTEM-OVERVIEW.md) | Tech stack & architecture |
| [docs/zoezi-architecture/SERVICES-AND-STATE.md](./docs/zoezi-architecture/SERVICES-AND-STATE.md) | API services reference |
| [docs/zoezi-patterns/INTEGRATION-PATTERNS.md](./docs/zoezi-patterns/INTEGRATION-PATTERNS.md) | Common integration patterns |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `ZOEZI_API_URL` | Zoezi API base URL | Yes |
| `ZOEZI_API_KEY` | API authentication key | Depends |

## Example App Ideas

- **Member Dashboard** - Display member info, bookings, and subscriptions
- **Class Schedule** - Show upcoming group training sessions
- **Product Catalog** - Browse and display shop products
- **Booking Widget** - Embeddable booking interface
- **Attendance Tracker** - Monitor gym visits and check-ins
- **Revenue Reports** - Visualize sales and membership data

## For AI Assistants

See [CLAUDE.md](./CLAUDE.md) for AI-specific development instructions.
