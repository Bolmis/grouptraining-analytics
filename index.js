/**
 * Group Training Analytics - Express Server
 *
 * Analytics dashboard for Zoezi group training classes.
 * Shows attendance rates, trends, and performance metrics.
 *
 * Environment Variables (add as Replit Secrets):
 * - SUPABASE_API_KEY: Your Supabase API key
 * - PORT: Server port (default: 3000)
 */

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load date extensions
require('./dateextensions.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
const SUPABASE_URL = 'https://kzdrezwyvgwttnwvbild.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || '';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get Supabase client
 */
function getSupabase() {
  if (!SUPABASE_KEY) {
    throw new Error('SUPABASE_API_KEY not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Fetch data from Zoezi API with retry
 */
async function fetchZoeziApi(url, apiKey, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`Zoezi API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}

/**
 * Process workout data into analytics
 */
function processAnalytics(workouts) {
  // Group by workout type
  const byType = {};
  const byDayOfWeek = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const byHour = {};
  const byInstructor = {};
  const byDate = {};

  let totalClasses = 0;
  let totalBooked = 0;
  let totalCapacity = 0;
  let fullyBookedClasses = 0;
  let emptyClasses = 0;

  workouts.forEach(w => {
    const typeName = w.workoutType?.name || 'Unknown';
    const space = w.space || 0;
    const booked = w.numBooked || 0;
    const startTime = new Date(w.startTime);
    const dayOfWeek = startTime.getDay();
    const hour = startTime.getHours();
    const dateStr = w.startTime.split(' ')[0];

    totalClasses++;
    totalBooked += booked;
    totalCapacity += space;

    if (space > 0 && booked >= space) fullyBookedClasses++;
    if (booked === 0) emptyClasses++;

    // By workout type
    if (!byType[typeName]) {
      byType[typeName] = {
        name: typeName,
        color: w.workoutType?.color || '#667eea',
        classes: 0,
        totalBooked: 0,
        totalCapacity: 0,
        bookings: []
      };
    }
    byType[typeName].classes++;
    byType[typeName].totalBooked += booked;
    byType[typeName].totalCapacity += space;
    byType[typeName].bookings.push(space > 0 ? (booked / space * 100) : 0);

    // By day of week
    byDayOfWeek[dayOfWeek].push({
      booked,
      capacity: space,
      rate: space > 0 ? (booked / space * 100) : 0
    });

    // By hour
    if (!byHour[hour]) {
      byHour[hour] = { classes: 0, totalBooked: 0, totalCapacity: 0 };
    }
    byHour[hour].classes++;
    byHour[hour].totalBooked += booked;
    byHour[hour].totalCapacity += space;

    // By instructor
    if (w.staffs && w.staffs.length > 0) {
      w.staffs.forEach(staff => {
        const name = `${staff.firstname || ''} ${staff.lastname || ''}`.trim() || 'Unknown';
        if (!byInstructor[name]) {
          byInstructor[name] = {
            name,
            classes: 0,
            totalBooked: 0,
            totalCapacity: 0,
            imagekey: staff.imagekey
          };
        }
        byInstructor[name].classes++;
        byInstructor[name].totalBooked += booked;
        byInstructor[name].totalCapacity += space;
      });
    }

    // By date (for trend)
    if (!byDate[dateStr]) {
      byDate[dateStr] = { classes: 0, totalBooked: 0, totalCapacity: 0 };
    }
    byDate[dateStr].classes++;
    byDate[dateStr].totalBooked += booked;
    byDate[dateStr].totalCapacity += space;
  });

  // Calculate averages and rates
  const typeStats = Object.values(byType).map(t => ({
    ...t,
    avgAttendance: t.classes > 0 ? (t.totalBooked / t.classes).toFixed(1) : 0,
    attendanceRate: t.totalCapacity > 0 ? (t.totalBooked / t.totalCapacity * 100).toFixed(1) : 0,
    avgBookingRate: t.bookings.length > 0
      ? (t.bookings.reduce((a, b) => a + b, 0) / t.bookings.length).toFixed(1)
      : 0
  })).sort((a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate));

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = dayNames.map((name, i) => {
    const data = byDayOfWeek[i];
    const totalBooked = data.reduce((sum, d) => sum + d.booked, 0);
    const totalCapacity = data.reduce((sum, d) => sum + d.capacity, 0);
    return {
      day: name,
      dayIndex: i,
      classes: data.length,
      avgAttendance: data.length > 0 ? (totalBooked / data.length).toFixed(1) : 0,
      attendanceRate: totalCapacity > 0 ? (totalBooked / totalCapacity * 100).toFixed(1) : 0
    };
  });

  const hourStats = [];
  for (let h = 5; h <= 22; h++) {
    const data = byHour[h] || { classes: 0, totalBooked: 0, totalCapacity: 0 };
    hourStats.push({
      hour: h,
      label: `${h}:00`,
      classes: data.classes,
      avgAttendance: data.classes > 0 ? (data.totalBooked / data.classes).toFixed(1) : 0,
      attendanceRate: data.totalCapacity > 0 ? (data.totalBooked / data.totalCapacity * 100).toFixed(1) : 0
    });
  }

  const instructorStats = Object.values(byInstructor).map(i => ({
    ...i,
    avgAttendance: i.classes > 0 ? (i.totalBooked / i.classes).toFixed(1) : 0,
    attendanceRate: i.totalCapacity > 0 ? (i.totalBooked / i.totalCapacity * 100).toFixed(1) : 0
  })).sort((a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate));

  // Daily trend
  const dates = Object.keys(byDate).sort();
  const dailyTrend = dates.map(date => {
    const data = byDate[date];
    return {
      date,
      classes: data.classes,
      totalBooked: data.totalBooked,
      totalCapacity: data.totalCapacity,
      attendanceRate: data.totalCapacity > 0 ? (data.totalBooked / data.totalCapacity * 100).toFixed(1) : 0
    };
  });

  return {
    summary: {
      totalClasses,
      totalBooked,
      totalCapacity,
      overallAttendanceRate: totalCapacity > 0 ? (totalBooked / totalCapacity * 100).toFixed(1) : 0,
      avgPerClass: totalClasses > 0 ? (totalBooked / totalClasses).toFixed(1) : 0,
      fullyBookedClasses,
      fullyBookedRate: totalClasses > 0 ? (fullyBookedClasses / totalClasses * 100).toFixed(1) : 0,
      emptyClasses,
      emptyRate: totalClasses > 0 ? (emptyClasses / totalClasses * 100).toFixed(1) : 0
    },
    byType: typeStats,
    byDay: dayStats,
    byHour: hourStats,
    byInstructor: instructorStats,
    dailyTrend
  };
}

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase_configured: !!SUPABASE_KEY
  });
});

/**
 * Get list of available gyms from Supabase
 */
app.get('/api/gyms', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Clubs')
      .select('Club_Zoezi_ID, Club_Name, Zoezi_Domain')
      .order('Club_Name');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching gyms:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch workout schedule for a gym
 */
app.get('/api/schedule/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    // Get club config from Supabase
    const supabase = getSupabase();
    const { data: club, error } = await supabase
      .from('Clubs')
      .select('*')
      .eq('Club_Zoezi_ID', clubId)
      .single();

    if (error) throw error;
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Fetch workout schedule from Zoezi
    const url = `https://${club.Zoezi_Domain}/api/schedule/workout/get/all?fromDate=${fromDate}&toDate=${toDate}&bookings=true`;
    const workouts = await fetchZoeziApi(url, club.Zoezi_Api_Key);

    res.json(workouts);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get analytics for a gym's workout schedule
 */
app.get('/api/analytics/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    // Get club config from Supabase
    const supabase = getSupabase();
    const { data: club, error } = await supabase
      .from('Clubs')
      .select('*')
      .eq('Club_Zoezi_ID', clubId)
      .single();

    if (error) throw error;
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Fetch workout schedule from Zoezi
    const url = `https://${club.Zoezi_Domain}/api/schedule/workout/get/all?fromDate=${fromDate}&toDate=${toDate}&bookings=true`;
    const workouts = await fetchZoeziApi(url, club.Zoezi_Api_Key);

    // Process analytics
    const analytics = processAnalytics(workouts);
    analytics.club = {
      id: club.Club_Zoezi_ID,
      name: club.Club_Name,
      domain: club.Zoezi_Domain
    };
    analytics.dateRange = { fromDate, toDate };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// FRONTEND ROUTES
// =============================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         GROUP TRAINING ANALYTICS DASHBOARD                 ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                              ║
║  Supabase: ${SUPABASE_KEY ? 'Configured' : 'Not configured - add SUPABASE_API_KEY'}              ║
╚════════════════════════════════════════════════════════════╝
  `);
});
