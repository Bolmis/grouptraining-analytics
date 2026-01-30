# Services and State Management

This document covers the services and Vuex store available in Zoezi components.

## Available Services

Services are injected via Vue plugins and accessible on `this` in components:

| Service | Access | Purpose |
|---------|--------|---------|
| `$api` | `this.$api` | API calls to backend |
| `$store` | `this.$store` | Vuex state management |
| `$translate` | `this.$translate()` | Localization |
| `$booking` | `this.$booking` | Booking utilities |
| `$ecommercetracking` | `this.$ecommercetracking` | Analytics |
| `$root` | `this.$root` | Root Vue instance |
| `$router` | `this.$router` | Vue Router |
| `$route` | `this.$route` | Current route |
| `$vuetify` | `this.$vuetify` | Vuetify instance |

---

## ZoeziApi Service (`this.$api`)

### GET Requests

```javascript
// Simple GET
const data = await this.$api.get('/api/endpoint');

// GET with parameters
const products = await this.$api.get('/api/public/trainingcard/type/get', {
  trial: true
});

// GET with multiple params
const bookings = await this.$api.get('/api/memberapi/bookings/get', {
  startTime: '2025-01-01',
  endTime: '2025-12-31',
  returnCount: false
});
```

### POST Requests

```javascript
// POST returns Response object
const response = await this.$api.post('/api/endpoint', {
  key: 'value',
  nested: { data: true }
});

if (response.ok) {
  const data = await response.json();
  // Handle success
} else {
  // Handle error
}
```

### Image URLs

```javascript
// Get image URL with size
const url = this.$api.getImageUrl(imageKey, 100);  // 100px width
const url = this.$api.getImageUrl(imageKey, 300);  // 300px width

// Get asset URL
const assetUrl = this.$api.getAssetUrl('path/to/asset.png');
```

### Subscriptions (Real-time updates)

```javascript
export default {
  data: () => ({
    unsubscribe: null
  }),

  mounted() {
    // Subscribe to training card type updates
    this.unsubscribe = this.$api.subscribe({
      type: 'trainingcardtype',
      callback: () => this.loadProducts()
    });
  },

  destroyed() {
    // Always clean up subscriptions
    this.unsubscribe?.();
  }
}
```

### Common API Endpoints

```javascript
// Public endpoints (no auth required)
'/api/public/settings/get'           // Site settings
'/api/public/trainingcard/type/get'  // Products/training cards
'/api/public/workout/type/get'       // Workout types
'/api/systemtag/get'                 // System tags

// Member endpoints (requires authentication)
'/api/memberapi/bookings/get'        // User bookings
'/api/memberapi/workout/get'         // Workout details
'/api/memberapi/cards/get'           // User's training cards

// Resource endpoints
'/api/resource/get'                  // Resources (doors, equipment)
```

---

## Vuex Store (`this.$store`)

### State Properties

```javascript
// User state
$store.state.user                    // Current user object or null
$store.state.isLoggedIn              // Boolean
$store.state.isCheckingIfLoggedIn    // Boolean (during auth check)

// Settings
$store.state.settings                // Site settings object
$store.state.settings.sites          // Array of sites
$store.state.settings.modules        // Enabled modules
$store.state.settings.webshopcategories

// Site selection
$store.state.selectedSiteId          // Currently selected site ID

// Shopping
$store.state.carts                   // Shopping carts by name
$store.state.carts['']               // Default cart
$store.state.carts['my-cart']        // Named cart

// Time
$store.state.now30s                  // Current time, updates every 30s

// UI
$store.state.saving                  // Save in progress
$store.state.language                // Current language code
```

### User Object Structure

```javascript
$store.state.user = {
  id: 123,
  firstname: 'John',
  lastname: 'Doe',
  name: 'John Doe',           // Full name
  mail: 'john@example.com',
  phone: '+46701234567',
  address: 'Street 1',
  zipCode: '12345',
  city: 'Stockholm',
  personalCodeNumber: '199001011234',

  // Permissions
  isAdmin: false,
  canBookFor: [],             // Users this user can book for
  canManage: [],              // Users this user can manage

  // Groups and cards
  groups: [],                 // User groups
  trainingCards: [],          // Active training cards

  // Blocks
  blocks: [],                 // Any blocks on the user

  // Requests
  requests: [],               // Pending requests

  // Features
  showRefereeSchedule: false  // Show referee features
}
```

### Settings Object Structure

```javascript
$store.state.settings = {
  // Sites
  sites: [
    { id: 1, name: 'Main Gym', legal_entity: {...} }
  ],

  // Modules
  modules: {
    Courses: true,
    WebShop: true,
    ResourceBooking: true,
    MultipleLegalEntities: false
  },

  // Features
  membership: true,           // Membership feature enabled
  teamsports: true,           // Team sports enabled
  playerpool: true,           // Player pool enabled

  // Categories
  webshopcategories: [
    { id: 1, name: 'Memberships', parent_id: null },
    { id: 2, name: 'Equipment', parent_id: null }
  ],

  // Payment
  invoiceFee: 29,             // Invoice fee amount

  // Display settings
  wbshowbookingcount: true    // Show booking count on workouts
}
```

### Getters

```javascript
// Get coming bookings for current user
const bookings = this.$store.getters.comingBookings;
// Returns: { workouts: [], coursebookings: [], resourcebookings: [], coursewatches: [] }
```

### Mutations

```javascript
// Show error dialog
this.$store.commit('showErrorDialog', {
  title: 'Error',
  text: 'Something went wrong',
  actionText: 'Retry',        // Optional
  action: () => {...}         // Optional
});

// Set saving state
this.$store.commit('setSaving', true);
this.$store.commit('setNeedToSave', true);

// Set edit mode initializing
this.$store.commit('setEditModeInitializing', true);
```

### Actions

```javascript
// Check if user is logged in
await this.$store.dispatch('checkIfLoggedIn');

// Set Vue root (called during init)
this.$store.dispatch('setVueRoot', this);

// Sign in with Apple
this.$store.dispatch('signinWithApple');

// Cart operations
this.$store.dispatch('addToCart', {
  cartName: '',              // Empty string for default cart
  product_id: 123,
  count: 1,
  variant: null,             // Optional variant
  price: null,               // Optional override price
  site_id: 1
});

this.$store.dispatch('changeItemCountInCart', {
  cartName: '',
  product_id: 123,
  variant: null,
  count: 2                   // New count (0 to remove)
});

this.$store.dispatch('setCartVisibility', {
  cartName: '',
  showBottomBar: true,
  showCheckout: false
});

this.$store.dispatch('removeCart', { cartName: '' });
```

---

## Translate Service (`this.$translate`)

```javascript
// Simple translation
const text = this.$translate('Welcome');

// Translation with parameters
const text = this.$translate('Hello {0}').format(userName);
const text = this.$translate('{0} items in cart').format(count);

// Multiple parameters
const text = this.$translate('From {0} to {1}').format(startDate, endDate);

// In templates
{{ $translate('Welcome') }}
{{ $translate('Hello {0}').format($store.state.user.firstname) }}

// Outside components (global)
window.$translate('text')
```

---

## Booking Service (`this.$booking`)

### Transform Workout

```javascript
// Transform raw workout data for display
this.$booking.transformWorkout(workout);
// Adds computed properties like isBooked(), isInQueue(), etc.
```

### Check Card Validity

```javascript
// Check if a training card is valid
const isValid = this.$booking.isCardValid(
  card,                       // Card object
  date,                       // Date to check (usually now)
  requiredTrainings,          // Number of trainings needed (usually 1)
  checkFrozen                 // Whether to check frozen status
);
```

---

## Ecommerce Tracking (`this.$ecommercetracking`)

```javascript
// Track page view
this.$ecommercetracking.pageView(title, path);

// Track item view
this.$ecommercetracking.viewItem({
  id: 'p123',
  name: 'Product Name',
  price: 299,
  vat: 25
});

// Track purchase (handled by checkout component)
```

---

## Root Instance (`this.$root`)

Access to root Vue instance and site configuration:

```javascript
// Site configuration
this.$root.siteconfig              // Full site config
this.$root.siteconfig.pages        // Page mappings
this.$root.siteconfig.appbar       // App bar config
this.$root.siteconfig.colors       // Theme colors

// Edit mode
this.$root.edit                    // Is in edit mode

// Homepage info
this.$root.homepage_id
this.$root.basepath

// Methods
this.$root.colorToHex(color)       // Convert color name to hex
this.$root.followLink(link, id)    // Navigate to link
this.$root.getDefaultPage('shop')  // Get page path
```

---

## Router (`this.$router`, `this.$route`)

```javascript
// Navigate programmatically
this.$router.push({ path: '/shop' });
this.$router.push({ path: '/product', query: { id: 123 } });

// Current route info
this.$route.path                   // '/current-path'
this.$route.query                  // { param: 'value' }
this.$route.params                 // Route params
this.$route.name                   // Route name
```

---

## Vuetify (`this.$vuetify`)

```javascript
// Breakpoints
this.$vuetify.breakpoint.mobile    // Is mobile
this.$vuetify.breakpoint.smAndDown // Small and below
this.$vuetify.breakpoint.mdAndUp   // Medium and above

// Theme
this.$vuetify.theme.themes.light   // Light theme colors
this.$vuetify.theme.currentTheme   // Current theme object

// Display
this.$vuetify.breakpoint.width     // Viewport width
this.$vuetify.breakpoint.height    // Viewport height
```

---

## Global Access (Outside Components)

For utility functions or places outside Vue components:

```javascript
// API
window.$zoeziapi.get('/api/endpoint')
window.$zoeziapi.post('/api/endpoint', data)

// Store
window.$store.state.user
window.$store.dispatch('action')

// Translate
window.$translate('text')

// Vue instance
window.$vue                        // Root Vue instance
window.$vuetify                    // Vuetify instance
window.$components                 // Component registry
```
