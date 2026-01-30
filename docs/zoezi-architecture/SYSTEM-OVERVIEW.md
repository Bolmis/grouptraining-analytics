# Zoezi System Overview

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue.js | 2.x | Frontend framework |
| Vuetify | 2.x | Material Design UI components |
| Vuex | 3.x | State management |
| Vue Router | 3.x | Client-side routing |
| Stripe Elements | - | Payment processing |
| Adyen | - | Alternative payment processor |
| Portal Vue | - | Component portals |
| Vue Meta | - | Document metadata |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zoezi Frontend                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Vue App   │  │   Vuetify   │  │      Vue Router         │  │
│  │  (main.js)  │  │  (UI/Theme) │  │  (router.js + config)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         Services Layer                          │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────┐   │
│  │ ZoeziApi  │ │ Translate │ │ Booking  │ │EcommerceTracking│   │
│  └───────────┘ └───────────┘ └──────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Vuex Store (State)                         │
│  ┌───────┐ ┌──────────┐ ┌───────┐ ┌────────┐ ┌──────────────┐   │
│  │ user  │ │ settings │ │ carts │ │bookings│ │selectedSiteId│   │
│  └───────┘ └──────────┘ └───────┘ └────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Zoezi Components (88+)                       │
│  ┌─────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │  Shop   │ │GroupTraining│ │ResourceBook │ │   Checkout    │  │
│  └─────────┘ └────────────┘ └──────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Zoezi Backend API                          │
│         /api/public/*  |  /api/memberapi/*  |  /api/*          │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration-Driven System

Zoezi uses a **siteconfig** object that defines:

```javascript
siteconfig = {
  name: 'Gym Name',
  title: 'Page Title',

  // Routes/Pages
  routes: [
    {
      component: 'zoezi-page',
      props: {
        path: '/shop',
        name: 'Shop',
        config: { component: 'zoezi-shop', props: {...} }
      }
    }
  ],

  // Navigation
  buttons: [...],           // Menu items
  appbar: {...},            // Top navigation bar
  bottombar: {...},         // Mobile bottom bar
  footer: {...},            // Footer component

  // Theming
  topbar: {
    color: '#000',
    backgroundColor: '#fff',
    activeColor: '#f00'
  },
  colors: {...},            // Theme colors
  fonts: {...},             // Typography
  css: '...',               // Custom CSS

  // Settings
  pages: {
    mypages: '/my-page',
    shop: '/shop',
    ...
  },

  // Custom components
  ownComponents: {...}
}
```

## Multi-Site Architecture

Zoezi supports multiple physical locations (sites):

```javascript
// Settings contain site list
$store.state.settings.sites = [
  { id: 1, name: 'Main Gym', legal_entity: {...} },
  { id: 2, name: 'Downtown Location', legal_entity: {...} }
];

// Currently selected site
$store.state.selectedSiteId = 1;

// Filter products by site
products.filter(p => !p.sites || p.sites.includes(selectedSiteId));
```

## Module/Addon System

Features are controlled by modules:

```javascript
// Check if module is enabled
$store.state.settings.modules.Courses      // Course booking
$store.state.settings.modules.WebShop      // E-commerce
$store.state.settings.modules.ResourceBooking
$store.state.settings.modules.MultipleLegalEntities

// Component can require addon
export default {
  zoezi: {
    addon: 'WebShop'  // Component only available if WebShop is licensed
  }
}
```

## Page Types

Zoezi supports two page types:

### MB (Member Builder) - Default
Standard website pages with full customization:
- Configurable routes, menus, footers
- Cookie bar, login pages, terms pages
- Full theming support

### SF (Storefront)
Simplified e-commerce focused pages:
- Streamlined for sales
- Uses Acorn/AST for composition API components

## Application Initialization Flow

```
1. $loadActivePage() called
   ↓
2. Fetch homepage config from API or window.HOMEPAGE_CONFIG
   ↓
3. initVue(homepages, homepage, edit)
   ↓
4. Apply template settings
   ↓
5. Register Vue plugins (Translate, ZoeziApi, Booking, etc.)
   ↓
6. Process and migrate config
   ↓
7. Register components
   ↓
8. Initialize router and store
   ↓
9. Create Vue instance
   ↓
10. Mount to #app
```

## Date Extensions

Zoezi extends the Date prototype with utilities (see `dateextensions.js`):

```javascript
// Formatting
date.yyyymmdd()           // "2025-01-22"
date.hhmm()               // "14:30"
date.hhmmss()             // "14:30:45"

// Comparisons
date.isToday()
date.isTomorrow()
date.isFutureDate()
date.isPastDate()
date.withinRange(start, end)

// Manipulation
date.addDays(n)
date.addMonths(n)
date.clearTime()
date.clone()

// Static methods
Date.today()
Date.newFull(dateString)
Date.formatFullShort(date)
Date.formatFullShorter(date)
Date.dateEquals(date1, date2)
```

## CSS Architecture

### Global Styles
- `zoezi.css` - Main stylesheet
- `zoezi-unmerged-adjustments.css` - Overrides

### Component Styles
Components can define scoped styles or use the `css` property:

```javascript
export default {
  css: `.my-component { color: red; }`  // Injected globally
}
```

### CSS Variables
Theme colors are available as CSS variables:

```css
var(--z-primary)
var(--z-secondary)
var(--z-accent)
var(--z-error)
var(--z-warning)
var(--z-info)
var(--z-success)
```

### Vuetify Classes
Common Vuetify utility classes:

```html
<!-- Spacing: pa-4, ma-2, px-3, my-1, etc. -->
<div class="pa-4 ma-2">

<!-- Flexbox -->
<div class="d-flex flex-column align-center justify-space-between">

<!-- Colors -->
<div class="primary--text error white--text">

<!-- Typography -->
<div class="text-h4 font-weight-bold text--secondary">
```

## Error Handling

```javascript
// Show error dialog
this.$store.commit('showErrorDialog', {
  title: 'Error Title',
  text: 'Error description',
  actionText: 'Retry',      // Optional
  action: () => {...}       // Optional
});

// API errors are typically caught:
this.$api.get('/api/...').catch(error => {
  this.$store.commit('showErrorDialog', {
    title: this.$translate('Error'),
    text: this.$translate('Something went wrong')
  });
});
```

## Localization

All user-facing text should use translation:

```javascript
// In templates
{{ $translate('Welcome') }}

// In scripts
this.$translate('Hello {0}').format(name)

// With window (outside components)
window.$translate('text')
```
