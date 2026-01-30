# Group Training Analytics

A powerful analytics dashboard for Zoezi group training classes. Analyze attendance rates, class performance, instructor metrics, and trends across your gym network.

## Features

- **Multi-Gym Support** - Select from all configured gyms in your Supabase database
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

## Screenshots

The dashboard displays:
- Summary cards showing overall attendance rate, total classes, avg per class, fully booked %, and empty classes
- Line chart showing attendance trend over the selected period
- Horizontal bar chart ranking class types by performance
- Bar charts for day-of-week and hourly analysis
- Doughnut chart showing class distribution
- Performance table with detailed metrics per class type
- Instructor cards showing individual performance

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
| `Club_Name` | Display name for the gym |
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
- **Frontend**: Vanilla JS + Chart.js
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
