/**
 * Zoezi App Starter - Express Server
 *
 * This is the main entry point for your Zoezi-integrated app.
 * It's configured to work with Replit out of the box.
 *
 * Environment Variables (add as Replit Secrets):
 * - ZOEZI_API_URL: Your Zoezi API base URL
 * - ZOEZI_API_KEY: Your API key (if required)
 * - PORT: Server port (default: 3000)
 */

const express = require('express');
const path = require('path');

// Load date extensions
require('./dateextensions.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Zoezi API configuration
const ZOEZI_API_URL = process.env.ZOEZI_API_URL || '';
const ZOEZI_API_KEY = process.env.ZOEZI_API_KEY || '';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// =============================================================================
// API ROUTES - Add your Zoezi API proxy endpoints here
// =============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    zoezi_configured: !!ZOEZI_API_URL
  });
});

/**
 * Example: Fetch products from Zoezi
 * Uncomment and modify as needed
 */
// app.get('/api/products', async (req, res) => {
//   try {
//     const response = await fetch(`${ZOEZI_API_URL}/api/products`, {
//       headers: {
//         'Authorization': `Bearer ${ZOEZI_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     });
//
//     if (!response.ok) {
//       throw new Error(`Zoezi API error: ${response.status}`);
//     }
//
//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

/**
 * Example: Fetch group training schedule
 * Uncomment and modify as needed
 */
// app.get('/api/schedule', async (req, res) => {
//   try {
//     const { from, to, siteId } = req.query;
//     const url = new URL(`${ZOEZI_API_URL}/api/grouptraining`);
//
//     if (from) url.searchParams.append('from', from);
//     if (to) url.searchParams.append('to', to);
//     if (siteId) url.searchParams.append('siteId', siteId);
//
//     const response = await fetch(url, {
//       headers: {
//         'Authorization': `Bearer ${ZOEZI_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     });
//
//     if (!response.ok) {
//       throw new Error(`Zoezi API error: ${response.status}`);
//     }
//
//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching schedule:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

/**
 * Generic Zoezi API proxy
 * Forwards requests to the Zoezi API with authentication
 * Use with caution - consider creating specific endpoints for security
 */
// app.all('/api/zoezi/*', async (req, res) => {
//   try {
//     const endpoint = req.params[0];
//     const url = `${ZOEZI_API_URL}/api/${endpoint}`;
//
//     const response = await fetch(url, {
//       method: req.method,
//       headers: {
//         'Authorization': `Bearer ${ZOEZI_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
//     });
//
//     const data = await response.json();
//     res.status(response.status).json(data);
//   } catch (error) {
//     console.error('Zoezi proxy error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// =============================================================================
// FRONTEND ROUTES
// =============================================================================

/**
 * Serve the frontend for all non-API routes
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Zoezi API URL: ${ZOEZI_API_URL || 'Not configured'}`);
  console.log('');
  console.log('Add your Zoezi credentials as environment variables:');
  console.log('  - ZOEZI_API_URL');
  console.log('  - ZOEZI_API_KEY');
});
