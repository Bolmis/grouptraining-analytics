# Zoezi Component Reference

This document provides reference information for key Zoezi components that can be reused or extended.

## Component Categories

| Category | Path | Components |
|----------|------|------------|
| **Authentication** | `components/auth/` | `Identification.vue`, `Login.vue`, `Logout.vue`, `ResetPassword.vue` |
| **Checkout** | `components/checkout/` | `Checkout.vue`, `CheckoutButton.vue`, `MembershipCheckout.vue` |
| **E-commerce** | `components/shop/` | `Shop.vue`, `ShoppingCart.vue`, `ProductCard.vue` |
| **Group Training** | `components/booking/group-training/` | `GroupTraining.vue`, `WorkoutTypes.vue` |
| **Courses** | `components/booking/courses/` | `CourseBooking.vue`, `CourseList.vue`, `CourseCard.vue` |
| **Resources** | `components/booking/resources/` | `ResourceBooking.vue`, `ResourceBookingCategory.vue` |
| **User Dashboard** | `components/user/` | `MyPage.vue`, `MyPaymentMethods.vue`, `Family.vue` |
| **Layout** | `components/layout/` | `ResponsiveAppBar.vue`, `TabBar.vue`, `Stepper.vue` |
| **Dialogs** | `components/dialogs/` | `AddUserDialog.vue`, `WatchDialog.vue` |
| **Admin** | `components/admin/` | `Report.vue`, `Visitors.vue`, `QrScanner.vue` |

---

## Authentication Components

### zoezi-login

Simple login wrapper that redirects after authentication.

**File:** `components/auth/Login.vue`

```vue
<zoezi-login :link-after-login="/my-page" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `linkAfterLogin` | String (page) | `/` | Page to navigate to after login |

---

### zoezi-identification

Full authentication component with multiple login methods.

**File:** `components/auth/Identification.vue`

```vue
<zoezi-identification
  :title="$translate('Log in')"
  :sub-title="$translate('to continue')"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | String | `'Select login method'` | Main title |
| `subTitle` | String | `''` | Subtitle text |

**Features:**
- Email/password login
- BankID login (Swedish)
- Social login (Google, Apple, Facebook)
- Registration
- Password reset

---

## E-commerce Components

### zoezi-shop

Main shop component for displaying and purchasing products.

**File:** `components/shop/Shop.vue`

```vue
<zoezi-shop
  :only-show-categories="[1, 2, 3]"
  :show-search="true"
  :show-sort-order="true"
  :crop-images="true"
  :cart-name="'my-shop'"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onlyShowCategories` | Array | `[]` | Filter by category IDs |
| `tagsFilter` | Array | `[]` | Filter by tag IDs |
| `initialSortOrder` | String | `'name-asc'` | Initial sort order |
| `showTagsFilter` | Boolean | `false` | Show tag filter UI |
| `showSortOrder` | Boolean | `true` | Show sort dropdown |
| `showSearch` | Boolean | `true` | Show search input |
| `showSearchIfNumItems` | Number | `6` | Show search if more than N items |
| `showNumberOfItems` | Boolean | `true` | Show item count |
| `globalSiteSetting` | Boolean | `true` | Use global site selection |
| `onlyShowSites` | Array | `[]` | Limit to specific sites |
| `showSiteFilter` | Boolean | `false` | Show site selector |
| `forceInfoDialog` | Boolean | `false` | Always show product dialog |
| `cartName` | String | `''` | Named cart to use |
| `cropImages` | Boolean | `true` | Crop images to 3:2 ratio |
| `showProductId` | Number | - | Show specific product (URL sync) |
| `showProductTitle` | String | - | Show product by title (URL sync) |

---

### zoezi-checkout

Payment and checkout component. **This is the main component for processing purchases.**

**File:** `components/checkout/Checkout.vue`

```vue
<zoezi-checkout
  :items="checkoutItems"
  :count-read-only="true"
  :user-read-only="false"
  :show-summary="true"
  :show-back-link="false"
  @almostdone="handleComplete"
  @loading="handleLoading"
  @cost="handleCost"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | Array | `[]` | Items to purchase (see format below) |
| `countReadOnly` | Boolean | `false` | Disable quantity changes |
| `userReadOnly` | Boolean | `false` | Disable user selection changes |
| `showSummary` | Boolean | `true` | Show order summary |
| `showBackLink` | Boolean | `false` | Show back link |
| `dialog` | Boolean | `false` | Is rendered in a dialog |
| `contentTarget` | String | - | Portal target for content |
| `summaryTarget` | String | - | Portal target for summary |
| `identificationTitle` | String | - | Custom login title |
| `identificationSubTitle` | String | - | Custom login subtitle |

**Item Format:**
```javascript
// Product
{ product_id: 123, count: 1, price: 299, variant: 'M' }

// Resource Booking
{
  count: 1,
  rbservice_id: 456,
  service: {...},
  reservation: 'res-id',
  slots: [{ start, end, rbservice_id, staff_id }]
}
```

**Events:**

| Event | Parameters | Description |
|-------|------------|-------------|
| `almostdone` | context | Purchase complete |
| `loading` | boolean | Loading state |
| `cost` | number | Total cost |
| `readyToPay` | boolean | Can submit payment |
| `changeNumberOfItems` | item, count | Quantity changed |
| `receipt` | bundle_id | Receipt available |

---

### zoezi-shopping-cart

Shopping cart display component.

**File:** `components/shop/ShoppingCart.vue`

```vue
<zoezi-shopping-cart :cart-name="''" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cartName` | String | `''` | Name of cart to display |

---

## Booking Components

### zoezi-grouptraining

Group training schedule and booking component.

**File:** `components/booking/group-training/GroupTraining.vue`

```vue
<zoezi-grouptraining
  :show-filters="true"
  :show-date-navigation="true"
  :show-num-booked="true"
  :days-to-show="7"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showFilters` | Boolean | `true` | Show filter options |
| `showDateNavigation` | Boolean | `true` | Show date picker |
| `showNumBooked` | Boolean | - | Show booking count |
| `daysToShow` | Number | `7` | Number of days to display |
| `filterByWorkoutType` | Array | `[]` | Filter by workout types |
| `filterBySite` | Array | `[]` | Filter by sites |
| `filterByRoom` | Array | `[]` | Filter by rooms |
| `showLastnameForInstructors` | Boolean | `false` | Show instructor full names |

---

### zoezi-coursebooking

Course (multi-session) booking component.

**File:** `components/booking/courses/CourseBooking.vue`

```vue
<zoezi-coursebooking
  :show-categories="true"
  :show-search="true"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showCategories` | Boolean | `true` | Show category filter |
| `showSearch` | Boolean | `true` | Show search |
| `filterByCategory` | Array | `[]` | Filter by categories |

---

### zoezi-resourcebooking

Resource booking component (rooms, equipment, personal training).

**File:** `components/booking/resources/ResourceBooking.vue`

```vue
<zoezi-resourcebooking
  :service-id="123"
  :show-categories="true"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `serviceId` | Number | - | Pre-select service |
| `showCategories` | Boolean | `true` | Show category list |
| `filterByCategory` | Array | `[]` | Filter categories |

---

## User Dashboard Components

### zoezi-mypage

Main user dashboard with tabs for bookings, payments, cards, etc.

**File:** `components/user/MyPage.vue`

```vue
<zoezi-mypage
  :display-entries="true"
  :display-group-training="true"
  :display-payments-tab="true"
  :display-training-card-tab="true"
  :display-family-tab="true"
  :active-tab="'start'"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHistoricActivities` | Boolean | `true` | Show past activities |
| `historyMonths` | Number | `12` | Months of history |
| `displayEntries` | Boolean | `true` | Show entry stats |
| `displayGroupTraining` | Boolean | `true` | Show group training stats |
| `displayPaymentsTab` | Boolean | `true` | Show payments tab |
| `displayTrainingCardTab` | Boolean | `true` | Show cards tab |
| `displayFamilyTab` | Boolean | `true` | Show family tab |
| `filterByDoor` | Array | `[]` | Filter entry stats by doors |
| `timeBetweenCheckins` | Number | `6` | Hours between counting entries |
| `activeTab` | String | `'start'` | Initial active tab |
| `showLastnameForInstructors` | Boolean | `false` | Show full instructor names |

**Tabs:**
- `start` - Overview (bookings, stats)
- `payments` - Payment history, methods
- `courses` - Course bookings
- `cards` - Training cards & memberships
- `teamsport` - Team sports (if enabled)
- `family` - Family accounts
- `account` - Account settings

---

### zoezi-myaccount

User account settings and profile management.

**File:** `components/user/MyAccount.vue`

```vue
<zoezi-myaccount />
```

Features:
- Profile editing
- Password change
- Email/phone updates
- Preferences

---

## Layout Components

### zoezi-rowlayout

Flexible row/column layout component.

**File:** `components/layout/RowLayout.vue`

```vue
<zoezi-rowlayout :rows="rowConfig" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | Array | `[]` | Row configuration |

**Row Configuration:**
```javascript
rows = [
  {
    component: 'zoezi-row',
    props: {
      columns: [
        {
          component: 'zoezi-column',
          props: {
            cols: 6,  // 1-12 grid
            component: {
              component: 'zoezi-shop',
              props: { /* ... */ }
            }
          }
        }
      ]
    }
  }
]
```

---

### zoezi-appbar / ResponsiveAppBar

Top navigation bar component.

**File:** `components/layout/ResponsiveAppBar.vue`

```vue
<zoezi-appbar
  :color="'#000'"
  :background-color="'#fff'"
  :active-color="'#f00'"
  :logo="logoConfig"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | String | `'#000'` | Text color |
| `backgroundColor` | String | `'#fff'` | Background color |
| `activeColor` | String | `'#f00'` | Active item color |
| `logo` | Object | - | Logo configuration |
| `uppercase` | Boolean | `false` | Uppercase menu items |
| `fullWidth` | Boolean | `false` | Full width layout |

---

## Utility Components

### zoezi-stepper

Multi-step wizard component.

**File:** `components/layout/Stepper.vue`

```vue
<zoezi-stepper
  :steps="steps"
  :current-step="currentStep"
  @step-change="handleStepChange"
/>
```

---

### zoezi-site-selector

Site/location selector for multi-site installations.

**File:** `components/layout/SiteSelector.vue`

```vue
<zoezi-site-selector />
```

---

### zoezi-cookie-bar

GDPR cookie consent bar.

**File:** `components/misc/CookieBar.vue`

```vue
<zoezi-cookie-bar />
```

---

## Dialog Components

### Common Dialog Pattern

Most dialogs follow this pattern:

```vue
<v-dialog v-model="showDialog" max-width="600" scrollable>
  <v-card>
    <!-- Header -->
    <v-card-title class="headline pa-2 primary primarytext--text d-flex fill-width">
      {{ $translate('Dialog Title') }}
      <v-spacer />
      <v-btn icon @click="showDialog = false">
        <v-icon class="primary primarytext--text">mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <!-- Content -->
    <v-card-text>
      <!-- Dialog content -->
    </v-card-text>

    <!-- Actions -->
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="showDialog = false">
        {{ $translate('Cancel') }}
      </v-btn>
      <v-btn color="primary" @click="confirm">
        {{ $translate('Confirm') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Available Dialog Components

| Component | File | Purpose |
|-----------|------|---------|
| `WorkoutDialog` | `components/WorkoutDialog.vue` | Workout details |
| `CourseBookingDialog` | `components/CourseBookingDialog.vue` | Course booking |
| `ResourceBookingDialog` | `components/ResourceBookingDialog.vue` | Resource booking |
| `TrainingCardProductDialog` | `components/TrainingCardProductDialog.vue` | Product details |
| `CancelRulesDialog` | `CancelRulesDialog.vue` | Cancellation rules |
| `GroupInviteDialog` | `GroupInviteDialog.vue` | Group invitations |
| `AddUserDialog` | `AddUserDialog.vue` | Add new user |
| `ChangeUserDialog` | `ChangeUserDialog.vue` | Change/switch user |

---

## Form Components

### form-field

Generic form field component.

```vue
<form-field
  :field="fieldConfig"
  v-model="fieldValue"
  star
/>
```

**Field Configuration:**
```javascript
fieldConfig = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  rules: [
    v => !!v || 'Required',
    v => /.+@.+/.test(v) || 'Invalid email'
  ]
}
```

---

## Button Components

### workout-book-button

Book/unbook button for workouts.

```vue
<workout-book-button
  :workout="workout"
  :show-num-booked="true"
  :info-on-unbookable="true"
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `workout` | Object | Workout object |
| `showNumBooked` | Boolean | Show booking count |
| `infoOnUnbookable` | Boolean | Show info when can't book |

---

## Card Components

### TrainingCardAndMembershipCard

Displays training card or membership information.

```vue
<TrainingCardAndMembershipCard :card="card" />
```

### CourseBookingCard

Displays course booking information.

```vue
<CourseBookingCard :booking="booking" />
```

---

## Filters

### Price Filter

Format numbers as currency:

```vue
{{ product.price | price }}
<!-- Output: 299 kr (or locale-appropriate format) -->
```

Usage in JavaScript:
```javascript
import { formatPrice } from './util.js';
const formatted = formatPrice(299);
```
