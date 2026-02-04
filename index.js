/**
 * Group Training Analytics - Express Server
 *
 * Analytics dashboard for Zoezi group training classes.
 * Shows attendance rates, trends, and performance metrics.
 *
 * Environment Variables (add as Replit Secrets):
 * - SUPABASE_API_KEY: Your Supabase API key
 * - EMBED_SECRET: Secret key for signing embed tokens (min 32 chars)
 * - ADMIN_KEY: Admin API key for generating embed tokens
 * - ADMIN_PASSWORD: Password for admin dashboard login
 * - SESSION_SECRET: Secret for session encryption (min 32 chars)
 * - PORT: Server port (default: 3000)
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load date extensions
require('./dateextensions.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
const SUPABASE_URL = 'https://kzdrezwyvgwttnwvbild.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || '';

// Security configuration
const EMBED_SECRET = process.env.EMBED_SECRET || '';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'strongsales_session',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Trust proxy for secure cookies behind Replit's proxy
app.set('trust proxy', 1);

// Static files (but not index.html - that's protected)
app.use('/Strongsales%20logo%20WHITE.png', express.static('public/Strongsales logo WHITE.png'));
app.use('/Strongsales%20logo%20black%20%26%20purple%20Transparent.png', express.static('public/Strongsales logo black & purple Transparent.png'));

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
 * Generate a secure embed token for a club
 * Token format: clubId.timestamp.signature (all base64url encoded)
 */
function generateEmbedToken(clubId) {
  if (!EMBED_SECRET) {
    throw new Error('EMBED_SECRET not configured');
  }

  const timestamp = Date.now().toString();
  const payload = `${clubId}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', EMBED_SECRET)
    .update(payload)
    .digest('base64url');

  return `${Buffer.from(clubId).toString('base64url')}.${Buffer.from(timestamp).toString('base64url')}.${signature}`;
}

/**
 * Verify and decode an embed token
 * Returns { valid: true, clubId } or { valid: false, error }
 */
function verifyEmbedToken(token) {
  if (!EMBED_SECRET) {
    return { valid: false, error: 'EMBED_SECRET not configured' };
  }

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token format' };
  }

  try {
    const clubId = Buffer.from(parts[0], 'base64url').toString();
    const timestamp = Buffer.from(parts[1], 'base64url').toString();
    const providedSignature = parts[2];

    // Verify signature
    const payload = `${clubId}.${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', EMBED_SECRET)
      .update(payload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Optional: Check token age (e.g., reject tokens older than 1 year)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
    if (tokenAge > maxAge) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, clubId };
  } catch (err) {
    return { valid: false, error: 'Token decode failed' };
  }
}

/**
 * Middleware to verify admin API key
 */
function requireAdminKey(req, res, next) {
  const apiKey = req.headers['x-admin-key'] || req.query.adminKey;

  if (!ADMIN_KEY) {
    return res.status(500).json({ error: 'ADMIN_KEY not configured on server' });
  }

  if (!apiKey || apiKey !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing admin key' });
  }

  next();
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

  // Track unique users globally and per type
  const allUniqueUsers = new Set();
  const uniqueUsersByType = {};

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
      uniqueUsersByType[typeName] = new Set();
    }
    byType[typeName].classes++;
    byType[typeName].totalBooked += booked;
    byType[typeName].totalCapacity += space;
    byType[typeName].bookings.push(space > 0 ? (booked / space * 100) : 0);

    // Extract unique user IDs from bookings
    if (w.bookings && Array.isArray(w.bookings)) {
      w.bookings.forEach(booking => {
        const userId = booking.user_id || booking.userId || booking.user?.id;
        if (userId) {
          allUniqueUsers.add(userId);
          uniqueUsersByType[typeName].add(userId);
        }
      });
    }

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
      : 0,
    uniqueParticipants: uniqueUsersByType[t.name]?.size || 0
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
      emptyRate: totalClasses > 0 ? (emptyClasses / totalClasses * 100).toFixed(1) : 0,
      uniqueParticipants: allUniqueUsers.size
    },
    byType: typeStats,
    byDay: dayStats,
    byHour: hourStats,
    byInstructor: instructorStats,
    dailyTrend
  };
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Check if user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  // For API requests, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // For page requests, redirect to login
  return res.redirect('/login');
}

/**
 * Check if request has valid embed token (for public embed access)
 */
function hasValidEmbedToken(req) {
  const token = req.query.token;
  if (!token) return false;
  const result = verifyEmbedToken(token);
  return result.valid;
}

/**
 * Login page
 */
app.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session && req.session.isAdmin) {
    return res.redirect('/');
  }

  const error = req.query.error;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login | StrongSales Analytics</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        .gradient-bg {
          background: linear-gradient(135deg, #AFACFB 0%, #8b5cf6 50%, #6d28d9 100%);
        }
      </style>
    </head>
    <body class="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <img src="/Strongsales%20logo%20black%20%26%20purple%20Transparent.png" alt="StrongSales" class="h-12 mx-auto mb-4">
          <h1 class="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p class="text-gray-500 text-sm mt-1">Group Training Analytics Dashboard</p>
        </div>

        ${error ? `
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            Invalid password. Please try again.
          </div>
        ` : ''}

        <form method="POST" action="/login" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autofocus
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
              placeholder="Enter admin password"
            >
          </div>
          <button
            type="submit"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
          >
            Sign In
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-gray-400">
          Secure access for StrongSales administrators only
        </p>
      </div>
    </body>
    </html>
  `);
});

/**
 * Login handler
 */
app.post('/login', (req, res) => {
  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD not configured');
    return res.redirect('/login?error=1');
  }

  // Secure password comparison (timing-safe)
  const passwordBuffer = Buffer.from(password || '');
  const adminBuffer = Buffer.from(ADMIN_PASSWORD);

  // Check length first, then compare
  if (passwordBuffer.length === adminBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, adminBuffer)) {
    req.session.isAdmin = true;
    req.session.loginTime = Date.now();
    return res.redirect('/');
  }

  // Invalid password
  res.redirect('/login?error=1');
});

/**
 * Logout handler
 */
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * Health check (public)
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase_configured: !!SUPABASE_KEY,
    auth_configured: !!ADMIN_PASSWORD
  });
});

/**
 * Get list of available gyms from Supabase (protected)
 */
app.get('/api/gyms', isAuthenticated, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Clubs')
      .select('Club_Zoezi_ID, Club_name, Zoezi_Domain')
      .order('Club_name');

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
app.get('/api/schedule/:clubId', isAuthenticated, async (req, res) => {
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
app.get('/api/analytics/:clubId', isAuthenticated, async (req, res) => {
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

    // Fetch workout schedule, sites, training card types, and all training cards from Zoezi in parallel
    const workoutUrl = `https://${club.Zoezi_Domain}/api/schedule/workout/get/all?fromDate=${fromDate}&toDate=${toDate}&bookings=true`;
    const sitesUrl = `https://${club.Zoezi_Domain}/api/site/get/all`;
    const trainingCardTypesUrl = `https://${club.Zoezi_Domain}/api/public/trainingcard/type/get`;
    const trainingCardsUrl = `https://${club.Zoezi_Domain}/api/trainingcard/get/all`;

    const [workouts, sites, trainingCardTypes, trainingCards] = await Promise.all([
      fetchZoeziApi(workoutUrl, club.Zoezi_Api_Key),
      fetchZoeziApi(sitesUrl, club.Zoezi_Api_Key).catch(() => []),
      fetchZoeziApi(trainingCardTypesUrl, club.Zoezi_Api_Key).catch(() => []),
      fetchZoeziApi(trainingCardsUrl, club.Zoezi_Api_Key).catch(() => [])
    ]);

    // Create site lookup map
    const siteMap = {};
    (sites || []).forEach(s => {
      if (s && s.id) siteMap[s.id] = s.name;
    });

    // Create training card type lookup map
    const trainingCardTypeMap = {};
    (trainingCardTypes || []).forEach(t => {
      if (t && t.id) trainingCardTypeMap[t.id] = t.name;
    });

    // Create training card instance to type ID mapping
    const trainingCardToTypeMap = {};
    (trainingCards || []).forEach(card => {
      if (card && card.id && card.type_id) {
        trainingCardToTypeMap[card.id] = card.type_id;
      }
    });

    // Process analytics
    const analytics = processAnalytics(workouts);
    analytics.club = {
      id: club.Club_Zoezi_ID,
      name: club.Club_name,
      domain: club.Zoezi_Domain
    };
    analytics.dateRange = { fromDate, toDate };

    // Include sites list (only if more than 1)
    const sitesList = (sites || []).filter(s => s && !s.removed).map(s => ({ id: s.id, name: s.name }));
    analytics.sites = sitesList.length > 1 ? sitesList : [];

    // Include training card types list
    analytics.trainingCardTypes = (trainingCardTypes || []).filter(t => t && t.id).map(t => ({
      id: t.id,
      name: t.name
    }));

    // Include simplified raw workouts for client-side filtering
    analytics.rawWorkouts = workouts.map(w => {
      // Extract booking details for filtering
      const bookingDetails = [];
      if (w.bookings && Array.isArray(w.bookings)) {
        w.bookings.forEach(booking => {
          const userId = booking.user_id || booking.userId || booking.user?.id;
          let trainingCardTypeId = null;
          if (booking.trainingcard) {
            trainingCardTypeId = trainingCardToTypeMap[booking.trainingcard] || null;
          }
          if (userId) {
            bookingDetails.push({ userId, trainingCardTypeId });
          }
        });
      }
      return {
        id: w.id,
        typeName: w.workoutType?.name || 'Unknown',
        typeColor: w.workoutType?.color || '#667eea',
        startTime: w.startTime,
        space: w.space || 0,
        numBooked: w.numBooked || 0,
        siteId: w.site_id || w.siteId || null,
        siteName: siteMap[w.site_id] || siteMap[w.siteId] || null,
        staffs: (w.staffs || []).map(s => ({
          name: `${s.firstname || ''} ${s.lastname || ''}`.trim() || 'Unknown',
          imagekey: s.imagekey
        })),
        bookingDetails: bookingDetails
      };
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// SECURE EMBED ROUTES
// =============================================================================

/**
 * Generate embed token for a club (admin only)
 * POST /api/admin/embed-token
 * Body: { clubId: "123" }
 * Headers: X-Admin-Key: your-admin-key
 */
app.post('/api/admin/embed-token', requireAdminKey, async (req, res) => {
  try {
    const { clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ error: 'clubId is required' });
    }

    // Verify club exists
    const supabase = getSupabase();
    const { data: club, error } = await supabase
      .from('Clubs')
      .select('Club_Zoezi_ID, Club_name')
      .eq('Club_Zoezi_ID', clubId)
      .single();

    if (error || !club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const token = generateEmbedToken(clubId);

    // Use https in production (Replit runs behind proxy so req.protocol is http)
    const protocol = req.get('x-forwarded-proto') || req.protocol;

    res.json({
      token,
      clubId: club.Club_Zoezi_ID,
      clubName: club.Club_name,
      embedUrl: `${protocol}://${req.get('host')}/?token=${token}&hideHeader=true`
    });
  } catch (error) {
    console.error('Error generating embed token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all clubs with their embed tokens (admin only)
 * GET /api/admin/embed-tokens
 * Headers: X-Admin-Key: your-admin-key
 */
app.get('/api/admin/embed-tokens', requireAdminKey, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: clubs, error } = await supabase
      .from('Clubs')
      .select('Club_Zoezi_ID, Club_name')
      .order('Club_name');

    if (error) throw error;

    // Use https in production (Replit runs behind proxy)
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}`;
    const tokens = clubs.map(club => {
      const token = generateEmbedToken(club.Club_Zoezi_ID);
      return {
        clubId: club.Club_Zoezi_ID,
        clubName: club.Club_name,
        token,
        embedUrl: `${baseUrl}/?token=${token}&hideHeader=true`
      };
    });

    res.json(tokens);
  } catch (error) {
    console.error('Error generating embed tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify a token (public - used by frontend)
 * GET /api/verify-token?token=xxx
 */
app.get('/api/verify-token', async (req, res) => {
  const { token } = req.query;
  const result = verifyEmbedToken(token);

  if (!result.valid) {
    return res.status(401).json({ valid: false, error: result.error });
  }

  // Get club name for display
  try {
    const supabase = getSupabase();
    const { data: club } = await supabase
      .from('Clubs')
      .select('Club_name')
      .eq('Club_Zoezi_ID', result.clubId)
      .single();

    res.json({
      valid: true,
      clubId: result.clubId,
      clubName: club?.Club_name || 'Unknown'
    });
  } catch {
    res.json({ valid: true, clubId: result.clubId });
  }
});

/**
 * Get analytics using secure embed token
 * GET /api/embed/analytics?token=xxx&fromDate=xxx&toDate=xxx
 */
app.get('/api/embed/analytics', async (req, res) => {
  try {
    const { token, fromDate, toDate } = req.query;

    // Verify token
    const tokenResult = verifyEmbedToken(token);
    if (!tokenResult.valid) {
      return res.status(401).json({ error: tokenResult.error });
    }

    const clubId = tokenResult.clubId;

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

    // Fetch workout schedule, sites, training card types, and all training cards from Zoezi in parallel
    const workoutUrl = `https://${club.Zoezi_Domain}/api/schedule/workout/get/all?fromDate=${fromDate}&toDate=${toDate}&bookings=true`;
    const sitesUrl = `https://${club.Zoezi_Domain}/api/site/get/all`;
    const trainingCardTypesUrl = `https://${club.Zoezi_Domain}/api/public/trainingcard/type/get`;
    const trainingCardsUrl = `https://${club.Zoezi_Domain}/api/trainingcard/get/all`;

    const [workouts, sites, trainingCardTypes, trainingCards] = await Promise.all([
      fetchZoeziApi(workoutUrl, club.Zoezi_Api_Key),
      fetchZoeziApi(sitesUrl, club.Zoezi_Api_Key).catch(() => []),
      fetchZoeziApi(trainingCardTypesUrl, club.Zoezi_Api_Key).catch(() => []),
      fetchZoeziApi(trainingCardsUrl, club.Zoezi_Api_Key).catch(() => [])
    ]);

    // Create site lookup map
    const siteMap = {};
    (sites || []).forEach(s => {
      if (s && s.id) siteMap[s.id] = s.name;
    });

    // Create training card type lookup map
    const trainingCardTypeMap = {};
    (trainingCardTypes || []).forEach(t => {
      if (t && t.id) trainingCardTypeMap[t.id] = t.name;
    });

    // Create training card instance to type ID mapping
    const trainingCardToTypeMap = {};
    (trainingCards || []).forEach(card => {
      if (card && card.id && card.type_id) {
        trainingCardToTypeMap[card.id] = card.type_id;
      }
    });

    // Process analytics
    const analytics = processAnalytics(workouts);
    analytics.club = {
      id: club.Club_Zoezi_ID,
      name: club.Club_name,
      domain: club.Zoezi_Domain
    };
    analytics.dateRange = { fromDate, toDate };

    // Include sites list (only if more than 1)
    const sitesList = (sites || []).filter(s => s && !s.removed).map(s => ({ id: s.id, name: s.name }));
    analytics.sites = sitesList.length > 1 ? sitesList : [];

    // Include training card types list
    analytics.trainingCardTypes = (trainingCardTypes || []).filter(t => t && t.id).map(t => ({
      id: t.id,
      name: t.name
    }));

    // Include simplified raw workouts for client-side filtering
    analytics.rawWorkouts = workouts.map(w => {
      // Extract booking details for filtering
      const bookingDetails = [];
      if (w.bookings && Array.isArray(w.bookings)) {
        w.bookings.forEach(booking => {
          const userId = booking.user_id || booking.userId || booking.user?.id;
          let trainingCardTypeId = null;
          if (booking.trainingcard) {
            trainingCardTypeId = trainingCardToTypeMap[booking.trainingcard] || null;
          }
          if (userId) {
            bookingDetails.push({ userId, trainingCardTypeId });
          }
        });
      }
      return {
        id: w.id,
        typeName: w.workoutType?.name || 'Unknown',
        typeColor: w.workoutType?.color || '#667eea',
        startTime: w.startTime,
        space: w.space || 0,
        numBooked: w.numBooked || 0,
        siteId: w.site_id || w.siteId || null,
        siteName: siteMap[w.site_id] || siteMap[w.siteId] || null,
        staffs: (w.staffs || []).map(s => ({
          name: `${s.firstname || ''} ${s.lastname || ''}`.trim() || 'Unknown',
          imagekey: s.imagekey
        })),
        bookingDetails: bookingDetails
      };
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching embed analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// FRONTEND ROUTES
// =============================================================================

/**
 * Main dashboard - requires authentication OR valid embed token
 */
app.get('/', (req, res, next) => {
  // Allow access with valid embed token
  if (hasValidEmbedToken(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  // Otherwise require authentication
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  // Redirect to login
  return res.redirect('/login');
});

/**
 * Catch-all for other routes - check authentication
 */
app.get('*', (req, res) => {
  // Allow static files
  if (req.path.match(/\.(png|jpg|jpeg|gif|svg|css|js|ico)$/i)) {
    return res.sendFile(path.join(__dirname, 'public', req.path));
  }

  // Check for embed token
  if (hasValidEmbedToken(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  // Require authentication
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  return res.redirect('/login');
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
║  Supabase: ${SUPABASE_KEY ? 'Configured ✓' : 'Not configured - add SUPABASE_API_KEY'}            ║
║  Embed Security: ${EMBED_SECRET ? 'Configured ✓' : 'Not configured - add EMBED_SECRET'}          ║
║  Admin API: ${ADMIN_KEY ? 'Configured ✓' : 'Not configured - add ADMIN_KEY'}                ║
║  Admin Login: ${ADMIN_PASSWORD ? 'Configured ✓' : 'Not configured - add ADMIN_PASSWORD'}          ║
╚════════════════════════════════════════════════════════════╝
  `);
});
