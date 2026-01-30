# Integration Patterns

This document shows common patterns for integrating with Zoezi features.

## Table of Contents

1. [Checkout Integration](#checkout-integration)
2. [Shopping Cart Integration](#shopping-cart-integration)
3. [Authentication Flow](#authentication-flow)
4. [Product/Training Card Display](#product-display)
5. [Multi-Site Handling](#multi-site-handling)
6. [Booking Integration](#booking-integration)
7. [Custom Membership Wizard](#custom-membership-wizard)

---

## Checkout Integration

The `zoezi-checkout` component handles all payment processing.

### Basic Checkout

```vue
<template>
  <div>
    <!-- Your product selection UI -->
    <div v-for="product in products" :key="product.id">
      <button @click="selectProduct(product)">
        {{ product.name }} - {{ product.price | price }}
      </button>
    </div>

    <!-- Checkout component -->
    <zoezi-checkout
      v-if="showCheckout"
      ref="checkout"
      :items="checkoutItems"
      :countReadOnly="true"
      :userReadOnly="false"
      :showSummary="true"
      @almostdone="handleCheckoutComplete"
      @loading="handleLoading"
      @cost="handleCostUpdate"
    />
  </div>
</template>

<script>
export default {
  data: () => ({
    selectedProduct: null,
    showCheckout: false,
    isLoading: false
  }),

  computed: {
    checkoutItems() {
      if (!this.selectedProduct) return [];

      return [{
        product_id: this.selectedProduct.id,
        count: 1,
        price: this.selectedProduct.price  // Optional: override price
      }];
    }
  },

  methods: {
    selectProduct(product) {
      this.selectedProduct = product;
      this.showCheckout = true;
    },

    handleCheckoutComplete(context) {
      // Purchase complete!
      console.log('Purchase complete', context);
      this.showCheckout = false;
      this.selectedProduct = null;

      // Navigate to confirmation or my page
      this.$router.push({ path: '/my-page' });
    },

    handleLoading(isLoading) {
      this.isLoading = isLoading;
    },

    handleCostUpdate(cost) {
      console.log('Total cost:', cost);
    }
  }
}
</script>
```

### Checkout Item Formats

```javascript
// Product/Training Card
{
  product_id: 123,
  count: 1,
  price: 299,              // Optional: override price
  variant: 'S'             // Optional: variant name
}

// Resource Booking
{
  count: 1,
  rbservice_id: 456,
  service: serviceObject,
  reservation: reservationId,
  slots: [
    {
      start: '2025-01-22T10:00:00',
      end: '2025-01-22T11:00:00',
      rbservice_id: 456,
      staff_id: 789
    }
  ],
  extra_person: null,      // Optional
  optional_resource: null, // Optional
  context: {},             // Optional: pass-through data
  extended_info: {},       // Optional: answers to questions
  tmp_id: 'unique-id'      // Link additional products
}
```

### Checkout Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `almostdone` | `context` | Purchase complete, showing done page |
| `loading` | `boolean` | Loading state changed |
| `cost` | `number` | Total cost from server |
| `readyToPay` | `boolean` | Ready to submit payment |
| `readyToPayExceptPaymentMethod` | `boolean` | Everything ready except payment method |
| `changeNumberOfItems` | `item, count` | Item count changed |
| `changeItemUsers` | `item, users` | Users for item changed |
| `mustSelectUsers` | `boolean` | Users must be selected |
| `receipt` | `bundle_id` | Receipt available |

### Checkout Props

```vue
<zoezi-checkout
  :items="items"
  :countReadOnly="true"        <!-- Can't change quantities -->
  :userReadOnly="false"        <!-- Can change users -->
  :showSummary="true"          <!-- Show order summary -->
  :showBackLink="false"        <!-- Show back link -->
  :dialog="false"              <!-- Is in a dialog -->
  :contentTarget="null"        <!-- Portal target for content -->
  :summaryTarget="null"        <!-- Portal target for summary -->
  :identificationTitle="'Log in'"
  :identificationSubTitle="''"
/>
```

---

## Shopping Cart Integration

### Using Named Carts

```javascript
export default {
  props: {
    cartName: {
      title: 'Cart name',
      type: String,
      default: ''  // Empty string = default cart
    }
  },

  computed: {
    cart() {
      return this.$store.state.carts?.[this.cartName];
    },

    cartItems() {
      if (!this.cart) return [];

      return this.cart.items.map(item => ({
        ...item,
        product: this.products.find(p => p.id === item.product_id)
      }));
    },

    cartTotal() {
      return this.cartItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.count;
      }, 0);
    }
  },

  methods: {
    addToCart(product, count = 1, variant = null) {
      this.$store.dispatch('addToCart', {
        cartName: this.cartName,
        product_id: product.id,
        count,
        variant,
        price: null,  // Use product price
        site_id: this.$store.state.selectedSiteId
      });

      // Show cart UI
      this.$store.dispatch('setCartVisibility', {
        cartName: this.cartName,
        showBottomBar: true,
        showCheckout: false
      });
    },

    updateQuantity(item, newCount) {
      this.$store.dispatch('changeItemCountInCart', {
        cartName: this.cartName,
        product_id: item.product_id,
        variant: item.variant,
        count: newCount  // 0 to remove
      });
    },

    clearCart() {
      this.$store.dispatch('removeCart', {
        cartName: this.cartName
      });
    },

    openCheckout() {
      this.$store.dispatch('setCartVisibility', {
        cartName: this.cartName,
        showBottomBar: false,
        showCheckout: true
      });
    }
  }
}
```

### Cart Visibility Management

```javascript
// Show bottom bar (mini cart)
this.$store.dispatch('setCartVisibility', {
  cartName: this.cartName,
  showBottomBar: true,
  showCheckout: false
});

// Show full checkout
this.$store.dispatch('setCartVisibility', {
  cartName: this.cartName,
  showBottomBar: false,
  showCheckout: true
});

// Hide all cart UI
this.$store.dispatch('setCartVisibility', {
  cartName: this.cartName,
  showBottomBar: false,
  showCheckout: false
});
```

---

## Authentication Flow

### Check Authentication Status

```vue
<template>
  <div>
    <!-- Loading state -->
    <div v-if="$store.state.isCheckingIfLoggedIn">
      <v-progress-circular indeterminate />
    </div>

    <!-- Logged in -->
    <div v-else-if="$store.state.user">
      <p>Welcome, {{ $store.state.user.firstname }}</p>
      <slot />
    </div>

    <!-- Not logged in - show login -->
    <zoezi-identification
      v-else
      :title="$translate('Please log in')"
      :sub-title="$translate('Log in to continue')"
    />
  </div>
</template>
```

### React to Login/Logout

```javascript
export default {
  watch: {
    '$store.state.user': {
      immediate: true,
      handler(user, oldUser) {
        if (user && !oldUser) {
          // User just logged in
          this.onLogin();
        } else if (!user && oldUser) {
          // User just logged out
          this.onLogout();
        }
      }
    },

    '$store.state.isLoggedIn': {
      immediate: true,
      handler(isLoggedIn) {
        if (isLoggedIn) {
          this.loadUserData();
        }
      }
    }
  },

  methods: {
    onLogin() {
      // Reload data, redirect, etc.
      this.loadUserData();
    },

    onLogout() {
      // Clear data, redirect to login
      this.clearUserData();
      this.$router.push({ path: '/login' });
    },

    logout() {
      // Trigger logout (handled by identification component usually)
      // Or call API directly
    }
  }
}
```

### Redirect After Login

```javascript
export default {
  props: {
    linkAfterLogin: {
      title: 'Redirect after login',
      type: String,
      fulltype: 'page',
      default: '/'
    }
  },

  watch: {
    '$store.state.isLoggedIn': {
      immediate: true,
      handler(isLoggedIn) {
        if (isLoggedIn && this.$route.path !== this.linkAfterLogin) {
          this.$router.push({ path: this.linkAfterLogin });
        }
      }
    }
  }
}
```

---

## Product Display

### Load and Display Products

```vue
<template>
  <div>
    <div v-if="!productsLoaded" class="text-center">
      {{ $translate('Loading...') }}
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-row v-else>
      <v-col
        v-for="product in filteredProducts"
        :key="product.id"
        cols="6" sm="4" md="3"
      >
        <v-card @click="selectProduct(product)">
          <v-img
            :src="$api.getImageUrl(product.imagekey, 300)"
            height="200"
          />
          <v-card-title>{{ product.name }}</v-card-title>
          <v-card-text>
            <div class="text-h6">{{ product.price | price }}</div>
            <div v-html="product.description" />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click.stop="addToCart(product)">
              {{ $translate('Add to cart') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  props: {
    filterCategories: {
      type: Array,
      default: () => []
    }
  },

  data: () => ({
    products: [],
    productsLoaded: false
  }),

  computed: {
    filteredProducts() {
      let products = this.products.filter(p => p.customerCanBuy);

      // Filter by site
      const siteId = this.$store.state.selectedSiteId;
      products = products.filter(p => {
        const sites = p.type === 'trainingcard' ? p.sites : p.visible_sites;
        return !sites || sites.length === 0 || sites.includes(siteId);
      });

      // Filter by category
      if (this.filterCategories.length > 0) {
        products = products.filter(p =>
          this.filterCategories.includes(p.product_webshop_category_id)
        );
      }

      return products;
    }
  },

  mounted() {
    this.loadProducts();
  },

  methods: {
    async loadProducts() {
      this.products = await this.$api.get('/api/public/trainingcard/type/get', {
        trial: true  // Include trial products
      });
      this.productsLoaded = true;
    },

    selectProduct(product) {
      // Show product dialog or navigate
    },

    addToCart(product) {
      this.$store.dispatch('addToCart', {
        cartName: '',
        product_id: product.id,
        count: 1,
        site_id: this.$store.state.selectedSiteId
      });
    }
  }
}
</script>
```

### Product Object Structure

```javascript
product = {
  id: 123,
  name: 'Monthly Membership',
  price: 499,
  vat: 25,                          // VAT percentage
  description: '<p>HTML description</p>',
  imagekey: 'abc123',               // For $api.getImageUrl()

  type: 'trainingcard',             // or 'membership', 'product'
  customerCanBuy: true,             // Visible in shop

  // Site restrictions
  sites: [1, 2],                    // For training cards
  visible_sites: [1],               // For products

  // Category
  product_webshop_category_id: 5,

  // Variants
  variants: [
    { name: 'S', price: 499, stock: 10 },
    { name: 'M', price: 499, stock: 5 },
    { name: 'L', price: 499, stock: 0 }
  ],

  // Stock
  stock: 15,                        // Total stock (null = unlimited)

  // Special pricing
  payWhatYouWant: false,            // Customer sets price

  // Tags
  tags: [
    { id: 1, name: 'Popular' }
  ]
}
```

---

## Multi-Site Handling

### Site Selection

```vue
<template>
  <div>
    <!-- Site selector -->
    <v-select
      v-if="hasMultipleSites"
      v-model="selectedSiteId"
      :items="availableSites"
      item-text="name"
      item-value="id"
      :label="$translate('Select location')"
      @change="onSiteChange"
    />

    <!-- Content filtered by site -->
    <div v-for="item in filteredItems" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    globalSiteSetting: {
      title: 'Use global site selection',
      type: Boolean,
      default: true
    },

    allowedSites: {
      title: 'Limit to sites',
      type: Array,
      default: () => []
    }
  },

  data: () => ({
    localSelectedSiteId: null
  }),

  computed: {
    hasMultipleSites() {
      return this.$store.state.settings?.sites?.length > 1;
    },

    availableSites() {
      const sites = this.$store.state.settings?.sites || [];

      if (this.allowedSites.length > 0) {
        return sites.filter(s => this.allowedSites.includes(s.id));
      }

      return sites;
    },

    selectedSiteId: {
      get() {
        if (this.globalSiteSetting) {
          return this.$store.state.selectedSiteId;
        }
        return this.localSelectedSiteId || this.availableSites[0]?.id;
      },
      set(value) {
        if (this.globalSiteSetting) {
          // Update global selection
          this.$store.state.selectedSiteId = value;
        } else {
          this.localSelectedSiteId = value;
        }
      }
    },

    filteredItems() {
      return this.items.filter(item => {
        // No site restriction
        if (!item.sites || item.sites.length === 0) {
          return true;
        }
        // Check if available at selected site
        return item.sites.includes(this.selectedSiteId);
      });
    }
  },

  methods: {
    onSiteChange(siteId) {
      // Handle site change (e.g., clear cart if items not available)
    }
  }
}
</script>
```

### Site-Aware Cart

```javascript
methods: {
  setSite(site) {
    // Check if cart items are available at new site
    const missing = this.getProductsMissingFromSite(site);

    if (missing.length > 0) {
      // Show confirmation dialog
      this.showSiteChangeDialog(site, missing);
    } else {
      this.selectedSiteId = site.id;
    }
  },

  getProductsMissingFromSite(site) {
    const availableProducts = this.getProductsForSite(site.id);

    return this.cartItems.filter(item => {
      // Check if product exists at site
      if (!availableProducts.find(p => p.id === item.product_id)) {
        return true;  // Missing
      }

      // Check stock at site
      const stock = this.getStockForProduct(item.product, item.variant, site.id);
      if (stock !== null && stock < item.count) {
        return true;  // Insufficient stock
      }

      return false;
    });
  }
}
```

---

## Booking Integration

### Display User Bookings

```vue
<template>
  <div>
    <div v-for="section in bookingSections" :key="section.id">
      <h3>{{ section.title }}</h3>
      <div v-for="booking in section.bookings" :key="booking.key">
        <div class="booking-card" @click="showBookingDetails(booking)">
          <img :src="$api.getImageUrl(booking.imagekey, 100)" />
          <div>
            <strong>{{ booking.text }}</strong>
            <div>{{ booking.start.hhmm() }} - {{ booking.duration }} min</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    bookings() {
      return this.$store.getters.comingBookings;
    },

    bookingSections() {
      const today = this.$store.state.now30s.clone().clearTime();
      const tomorrow = today.clone().addDays(1);

      const activities = this.transformBookings();

      return [
        {
          id: 'today',
          title: this.$translate('Today'),
          bookings: activities.filter(a => Date.dateEquals(a.start, today))
        },
        {
          id: 'tomorrow',
          title: this.$translate('Tomorrow'),
          bookings: activities.filter(a => Date.dateEquals(a.start, tomorrow))
        },
        {
          id: 'later',
          title: this.$translate('Later'),
          bookings: activities.filter(a => a.start.clone().clearTime() > tomorrow)
        }
      ].filter(s => s.bookings.length > 0);
    }
  },

  methods: {
    transformBookings() {
      const result = [];

      // Transform workout bookings
      this.bookings?.workouts?.forEach(wb => {
        result.push({
          key: 'wb' + wb.id,
          type: 'workout',
          id: wb.id,
          start: Date.newFull(wb.startTime),
          text: wb.workoutType.name,
          imagekey: wb.workoutType.imagekey,
          duration: this.calculateDuration(wb.startTime, wb.endTime),
          workout: wb
        });
      });

      // Transform resource bookings
      this.bookings?.resourcebookings?.forEach(rb => {
        result.push({
          key: 'rb' + rb.id,
          type: 'resourcebooking',
          id: rb.id,
          start: Date.newFull(rb.time),
          text: rb.servicename,
          imagekey: rb.service_imagekey,
          duration: rb.duration,
          rb
        });
      });

      return result.sort((a, b) => a.start - b.start);
    },

    calculateDuration(start, end) {
      return (Date.newFull(end) - Date.newFull(start)) / (60 * 1000);
    },

    showBookingDetails(booking) {
      if (booking.type === 'workout') {
        // Show workout dialog
      } else if (booking.type === 'resourcebooking') {
        // Show resource booking dialog
      }
    }
  }
}
</script>
```

---

## Custom Membership Wizard

Example of a guided membership selection flow (like Fysiken):

```vue
<template>
  <div class="membership-wizard">
    <!-- Step 1: What do you want to train? -->
    <div class="question-block">
      <label>{{ $translate('What do you want to train?') }}</label>
      <div class="options">
        <label
          v-for="option in trainingOptions"
          :key="option.id"
          :class="{ selected: answers.training === option.id }"
        >
          <input
            type="radio"
            :value="option.id"
            v-model="answers.training"
            @change="onAnswerChange('training')"
          />
          {{ option.name }}
        </label>
      </div>
    </div>

    <!-- Step 2: Membership type (conditional) -->
    <div v-if="answers.training && answers.training !== 'trial'" class="question-block">
      <label>{{ $translate('Select membership type') }}</label>
      <div class="options">
        <label
          v-for="option in membershipTypes"
          :key="option.id"
          :class="{ selected: answers.membershipType === option.id }"
        >
          <input
            type="radio"
            :value="option.id"
            v-model="answers.membershipType"
            @change="onAnswerChange('membershipType')"
          />
          {{ option.name }}
        </label>
      </div>
    </div>

    <!-- Step 3: Payment method -->
    <div v-if="showPaymentStep" class="question-block">
      <label>{{ $translate('How would you like to pay?') }}</label>
      <div class="options">
        <label
          v-for="option in paymentOptions"
          :key="option.id"
          :class="{ selected: answers.payment === option.id }"
        >
          <input
            type="radio"
            :value="option.id"
            v-model="answers.payment"
            @change="onAnswerChange('payment')"
          />
          {{ option.name }}
        </label>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="selectedProduct" class="summary">
      <h3>{{ selectedProduct.name }}</h3>
      <div class="price">{{ selectedProduct.price | price }}</div>

      <div v-if="!$store.state.user" class="login-prompt">
        <p>{{ $translate('Please log in to continue') }}</p>
        <v-btn color="primary" @click="showLogin = true">
          {{ $translate('Log in') }}
        </v-btn>
      </div>

      <v-btn
        v-else
        color="primary"
        @click="proceedToCheckout"
      >
        {{ $translate('Continue to checkout') }}
      </v-btn>
    </div>

    <!-- Checkout -->
    <zoezi-checkout
      v-if="showCheckout"
      :items="checkoutItems"
      @almostdone="handleComplete"
    />

    <!-- Login dialog -->
    <v-dialog v-model="showLogin" max-width="500">
      <v-card>
        <zoezi-identification :title="$translate('Log in')" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data: () => ({
    answers: {
      training: null,
      membershipType: null,
      payment: null
    },
    products: [],
    showLogin: false,
    showCheckout: false
  }),

  computed: {
    trainingOptions() {
      return [
        { id: 'trial', name: 'Trial week' },
        { id: 'gym', name: 'Gym & Group training' },
        { id: 'climbing', name: 'Climbing' }
      ];
    },

    membershipTypes() {
      return [
        { id: 'standard', name: 'Standard' },
        { id: 'student', name: 'Student' },
        { id: 'senior', name: 'Senior (65+)' }
      ];
    },

    paymentOptions() {
      return [
        { id: 'direct', name: 'Direct purchase' },
        { id: 'autogiro', name: 'Monthly (Direct Debit)' }
      ];
    },

    showPaymentStep() {
      return this.answers.training && this.answers.membershipType;
    },

    selectedProduct() {
      if (!this.answers.payment) return null;

      // Map answers to product ID
      const productId = this.getProductIdFromAnswers();
      return this.products.find(p => p.id === productId);
    },

    checkoutItems() {
      if (!this.selectedProduct) return [];
      return [{
        product_id: this.selectedProduct.id,
        count: 1
      }];
    }
  },

  mounted() {
    this.loadProducts();
  },

  methods: {
    async loadProducts() {
      this.products = await this.$api.get('/api/public/trainingcard/type/get');
    },

    onAnswerChange(field) {
      // Reset dependent answers
      if (field === 'training') {
        this.answers.membershipType = null;
        this.answers.payment = null;
      } else if (field === 'membershipType') {
        this.answers.payment = null;
      }
    },

    getProductIdFromAnswers() {
      // Map answer combination to product ID
      // This would be customized based on your product catalog
      const mapping = {
        'gym-standard-direct': 101,
        'gym-standard-autogiro': 102,
        'gym-student-direct': 103,
        // ... etc
      };

      const key = `${this.answers.training}-${this.answers.membershipType}-${this.answers.payment}`;
      return mapping[key];
    },

    proceedToCheckout() {
      this.showCheckout = true;
    },

    handleComplete() {
      this.showCheckout = false;
      this.$router.push({ path: '/my-page' });
    }
  }
}
</script>
```

This pattern allows creating custom, guided experiences while still using Zoezi's checkout infrastructure.
