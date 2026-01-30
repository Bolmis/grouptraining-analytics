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

## Iframe Widget Integration

### Embedding for a Specific Gym (e.g., Fysiken)

To embed the analytics dashboard for a specific gym so they can only see their own data:

```html
<iframe
  src="https://YOUR-REPLIT-URL.repl.co/?clubId=FYSIKEN_CLUB_ID"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `clubId` | Lock the dashboard to a specific gym (hides gym selector) | `?clubId=123` |
| `hideHeader` | Hide the StrongSales header and footer | `?hideHeader=true` |
| `embed` | Enable iframe mode styling | `?embed=true` |

### Examples

**Fysiken Dashboard (locked to their gym, clean embed):**
```
https://YOUR-URL.repl.co/?clubId=123&hideHeader=true
```

**Full dashboard with header:**
```
https://YOUR-URL.repl.co/?clubId=123
```

**Admin view (all gyms visible):**
```
https://YOUR-URL.repl.co/
```

### How to Find a Gym's Club ID

The `clubId` is the `Club_Zoezi_ID` from your Supabase `Clubs` table. You can find it by:

1. Opening your Supabase dashboard
2. Going to the `Clubs` table
3. Finding the gym (e.g., "Fysiken")
4. Copying the `Club_Zoezi_ID` value

### Zoezi Integration

When adding to a Zoezi page builder:

1. Add a "Custom HTML" or "Iframe" component
2. Set the source URL to: `https://YOUR-URL.repl.co/?clubId=THEIR_CLUB_ID&hideHeader=true`
3. Set appropriate height (recommended: 800-1200px)
4. The dashboard will auto-load with the gym's data

**Note:** Each gym gets their own URL with their specific `clubId`. They cannot access other gyms' data because the gym selector is hidden and the club ID is locked in the URL.

## Quick Start

### Running on Replit

1. Import this repository to Replit
2. Add your Supabase API key to Replit Secrets:
   - `SUPABASE_API_KEY` - Your Supabase anon/service key
3. Click "Run"
4. Select a gym and date range, then click "Load Analytics"

### Running Locally

```bash
npm install
SUPABASE_API_KEY=your_key npm start
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

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check with Supabase status |
| `GET /api/gyms` | List all available gyms |
| `GET /api/schedule/:clubId?fromDate=&toDate=` | Raw workout schedule data |
| `GET /api/analytics/:clubId?fromDate=&toDate=` | Processed analytics data |

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
