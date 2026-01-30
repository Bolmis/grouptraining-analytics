# Group Training Analytics

A powerful analytics dashboard for Zoezi group training classes. Analyze attendance rates, class performance, instructor metrics, and trends across your gym network.

**Powered by StrongSales**

## Features

- **Multi-Gym Support** - Select from all configured gyms in your Supabase database
- **Iframe Widget Mode** - Embed analytics directly into Zoezi admin dashboards
- **Flexible Date Ranges** - Quick presets (7, 30, 90 days) or custom date selection
- **Rich Analytics Dashboard**:
  - Overall attendance rate and summary statistics
  - Attendance trends over time (dual-axis chart)
  - Performance by class type with ranking
  - Day of week analysis
  - Peak hours visualization
  - Instructor performance metrics
  - Class distribution breakdown
- **Data Export** - Export analytics to CSV for further analysis
- **Interactive Charts** - Powered by Chart.js with hover tooltips
- **Modern UI** - Tailwind CSS with StrongSales purple branding (#AFACFB)

## Secure Iframe Widget Integration

The dashboard uses **cryptographically signed tokens** to securely embed analytics for specific gyms. Each gym gets a unique, unforgeable URL token that only grants access to their own data.

### Security Model

- Tokens are HMAC-SHA256 signed using a server-side secret
- Tokens cannot be modified or forged - changing the club ID invalidates the signature
- Tokens expire after 1 year (configurable)
- Gyms cannot access other gyms' data even if they know their club ID

### Step 1: Generate Embed Tokens (Admin)

Use the admin API to generate secure tokens for each gym:

```bash
# Generate token for a single gym
curl -X POST https://YOUR-URL.repl.co/api/admin/embed-token \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"clubId": "123"}'

# Response:
{
  "token": "MTIz.MTcwNjY0NzA...",
  "clubId": "123",
  "clubName": "Fysiken",
  "embedUrl": "https://YOUR-URL.repl.co/?token=MTIz.MTcwNjY0NzA...&hideHeader=true"
}

# Generate tokens for ALL gyms at once
curl https://YOUR-URL.repl.co/api/admin/embed-tokens \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

### Step 2: Embed in Zoezi

Use the generated `embedUrl` in an iframe:

```html
<iframe
  src="https://YOUR-URL.repl.co/?token=MTIz.MTcwNjY0NzA...&hideHeader=true"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `token` | **Secure embed token** (required for embeds) | `?token=MTIz...` |
| `hideHeader` | Hide the StrongSales header and footer | `?hideHeader=true` |

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/embed-token` | POST | Generate token for one gym (body: `{clubId}`) |
| `/api/admin/embed-tokens` | GET | Generate tokens for all gyms |
| `/api/verify-token` | GET | Verify a token (public, used by frontend) |

All admin endpoints require the `X-Admin-Key` header.

### Example: Setting Up Fysiken

1. Generate their token:
   ```bash
   curl -X POST https://your-app.repl.co/api/admin/embed-token \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: your-secret-admin-key" \
     -d '{"clubId": "FYSIKEN_CLUB_ID"}'
   ```

2. Copy the `embedUrl` from the response

3. Add to Zoezi page builder as an iframe with that URL

4. Fysiken can only see their own data - even if they modify the URL, the signature check will fail

## Quick Start

### Running on Replit

1. Import this repository to Replit
2. Add the following to Replit Secrets:
   - `SUPABASE_API_KEY` - Your Supabase anon/service key
   - `EMBED_SECRET` - Random 64-char hex string for token signing
   - `ADMIN_KEY` - Random 48-char hex string for admin API access
   - `ADMIN_PASSWORD` - Your chosen admin password
   - `SESSION_SECRET` - Random 64-char hex string for sessions
3. Click "Run"
4. Go to the URL and login with your admin password
5. Select a gym and date range, then click "Load Analytics"

### Running Locally

```bash
npm install
SUPABASE_API_KEY=your_key \
EMBED_SECRET=$(openssl rand -hex 32) \
ADMIN_KEY=$(openssl rand -hex 24) \
ADMIN_PASSWORD=your_secure_password \
SESSION_SECRET=$(openssl rand -hex 32) \
npm start
```

The server will start on port 3000 (or the PORT environment variable).

## How It Works

1. **Gym Selection**: The app fetches available gyms from your Supabase `Clubs` table
2. **Data Fetching**: When you load analytics, it:
   - Retrieves the gym's Zoezi API credentials from Supabase
   - Calls the Zoezi API to fetch workout schedule data
   - Processes the data into analytics
3. **Visualization**: The frontend renders charts and tables using the processed data

## API Endpoints

### Public Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check with Supabase status |
| `GET /api/gyms` | List all available gyms |
| `GET /api/schedule/:clubId?fromDate=&toDate=` | Raw workout schedule data |
| `GET /api/analytics/:clubId?fromDate=&toDate=` | Processed analytics data (admin use) |
| `GET /api/verify-token?token=` | Verify an embed token |
| `GET /api/embed/analytics?token=&fromDate=&toDate=` | **Secure** analytics via token |

### Admin Endpoints (require `X-Admin-Key` header)

| Endpoint | Description |
|----------|-------------|
| `POST /api/admin/embed-token` | Generate token for one gym |
| `GET /api/admin/embed-tokens` | Generate tokens for all gyms |

## Supabase Configuration

This app expects a `Clubs` table in Supabase with the following columns:

| Column | Description |
|--------|-------------|
| `Club_Zoezi_ID` | The Zoezi club ID |
| `Club_name` | Display name for the gym |
| `Zoezi_Domain` | The Zoezi domain (e.g., `fysiken.zoezi.se`) |
| `Zoezi_Api_Key` | API key for authentication |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `SUPABASE_API_KEY` | Supabase anon or service key | Yes |
| `EMBED_SECRET` | Secret key for signing embed tokens (min 32 chars) | Yes |
| `ADMIN_KEY` | API key for admin endpoints (generating embed tokens) | Yes |
| `ADMIN_PASSWORD` | Password for admin dashboard login | Yes |
| `SESSION_SECRET` | Secret for session encryption (min 32 chars) | Yes |

### Generating Secure Keys

```bash
# Generate EMBED_SECRET (keep this secret!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ADMIN_KEY (for API access)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# ADMIN_PASSWORD - choose a strong password you'll remember
```

Add these to Replit Secrets or your environment.

## Authentication

The admin dashboard is protected by password authentication.

### Security Features

- **Session-based authentication** - Secure HTTP-only cookies
- **24-hour sessions** - Automatic logout after 24 hours
- **Timing-safe password comparison** - Protection against timing attacks
- **HTTPS required** - Cookies are secure in production

### Access Levels

| URL | Access |
|-----|--------|
| `/login` | Public - login page |
| `/` | **Protected** - requires login |
| `/?token=xxx` | Public - valid embed token grants access |
| `/api/gyms` | **Protected** - requires login |
| `/api/analytics/:clubId` | **Protected** - requires login |
| `/api/embed/analytics` | Public - requires valid embed token |
| `/api/admin/*` | **Protected** - requires `X-Admin-Key` header |

## Analytics Explained

### Attendance Rate
`(Total Bookings / Total Capacity) * 100`

A class with 8 bookings out of 12 spots = 66.7% attendance rate.

### Class Performance Ranking
Classes are ranked by their attendance rate, with color-coded performance indicators:
- Green (80%+): Excellent
- Light green (60-79%): Good
- Yellow (40-59%): Average
- Red (<40%): Low

### Instructor Performance
Shows each instructor's:
- Number of classes taught
- Total bookings across all their classes
- Overall attendance rate

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Tailwind CSS + Chart.js
- **Database**: Supabase (PostgreSQL)
- **External API**: Zoezi gym management platform

## Repository Structure

```
grouptraining-analytics/
├── index.js                    # Express server with API routes
├── public/
│   └── index.html              # Full frontend application
├── package.json                # Dependencies
├── .replit                     # Replit configuration
├── Zoezi API docs.json         # API reference
├── dateextensions.js           # Date utilities
├── docs/                       # Zoezi documentation
└── README.md                   # This file
```

## License

MIT
