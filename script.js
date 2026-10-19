'use strict';

/* ==========================================================================
   ShopSphere: script.js
   Phase 1: page shell (navigation, search panel)
   Phase 2: product data and card rendering
   Phase 3: search, filters, sorting, active filter chips, pagination
   Phase 4: shopping cart, cart drawer, LocalStorage persistence
   Phase 5: wishlist, saved-items view, LocalStorage persistence
   Phase 6: quick view modal, specifications, variant selection, quantity
   Phase 7: toasts, free-shipping progress, recently viewed, repaired-data notices
   Phase 8: demo checkout, order summary, simulated confirmation
   Phase 9: accessibility, responsive and edge-case fixes
   ========================================================================== */

/* ---------- 1. Configuration and product data ---------- */
const CONFIG = {
  locale: 'en-US',
  currency: 'USD',
  lowStockThreshold: 5,
  pageSize: 9,
  searchDebounceMs: 150,
  addedFeedbackMs: 1200,
  maxBadgeCount: 99,
  // Demonstration rule only: no real shipping is charged. Set to 0 to turn the progress bar off.
  freeShippingThreshold: 75,
  recentlyViewedLimit: 4,
  toastDurationMs: 4000,
  toastErrorDurationMs: 6000,
  toastLeaveMs: 200,
  maxVisibleToasts: 3,
  // How long the demo checkout pretends to "process" the order.
  orderSimulationMs: 700,
  photoWidth: 480,
  photoHeight: 600,
  scrolledHeaderOffset: 8,
  desktopNavBreakpoint: 860,
};

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4.0 and up' },
  { value: 4.5, label: '4.5 and up' },
];

const STORAGE_KEYS = {
  cart: 'shopsphere.cart.v1',
  wishlist: 'shopsphere.wishlist.v1',
  recentlyViewed: 'shopsphere.recent.v1',
};

const DRAWER_TITLES = {
  cart: 'Your cart',
  checkout: 'Checkout',
  confirmation: 'Order confirmed',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const PHOTO_URL_BASE = 'https://images.unsplash.com/';

// Category name -> icon id from the sprite in index.html
const CATEGORY_ICONS = {
  Electronics: 'icon-electronics',
  Fashion: 'icon-fashion',
  'Home & Living': 'icon-home',
  Accessories: 'icon-accessories',
  Lifestyle: 'icon-lifestyle',
};

// Builds a cropped 4:5 image URL from an Unsplash photo id (free to use under the Unsplash License).
function unsplashPhoto(photoId) {
  return `${PHOTO_URL_BASE}${photoId}?auto=format&fit=crop&w=${CONFIG.photoWidth}&h=${CONFIG.photoHeight}&q=70`;
}

// Sample data only. `image` can be an Unsplash helper call, a local path
// (for example 'assets/images/wallet.jpg'), any image URL, or '' for the placeholder.
// `imageAlt` describes the photo for screen readers. "In stock" is derived from stockQuantity.
const PRODUCTS = [
  {
    id: 1,
    name: 'Aurora Wireless Headphones',
    category: 'Electronics',
    description: 'Over-ear Bluetooth headphones with active noise cancelling and soft, breathable ear cushions for long listening sessions.',
    price: 129,
    originalPrice: 159,
    image: unsplashPhoto('photo-1590658268037-6bf12165a8df'),
    imageAlt: 'Black and white over-ear headphones resting on a white table',
    rating: 4.6,
    reviewCount: 428,
    stockQuantity: 24,
    featured: true,
    createdAt: '2026-08-14',
    tags: ['audio', 'wireless', 'noise-cancelling', 'headphones'],
    specifications: { 'Battery life': 'Up to 30 hours', Connectivity: 'Bluetooth 5.3', Weight: '260 g', Charging: 'USB-C' },
    variants: [{ name: 'Color', options: ['Black', 'Sand', 'Navy'] }],
  },
  {
    id: 2,
    name: 'Pulse Smart Watch',
    category: 'Electronics',
    description: 'Fitness-focused smartwatch with a bright AMOLED display, sleep tracking and a week-long battery.',
    price: 189,
    image: unsplashPhoto('photo-1624096104992-9b4fa3a279dd'),
    imageAlt: 'Black smart watch with a dark display on a white background',
    rating: 4.4,
    reviewCount: 312,
    stockQuantity: 12,
    featured: true,
    createdAt: '2026-09-22',
    tags: ['wearable', 'fitness', 'smartwatch', 'sleep tracking'],
    specifications: { Display: '1.4-inch AMOLED', 'Battery life': 'Up to 7 days', 'Water resistance': '5 ATM' },
    variants: [{ name: 'Case size', options: ['40 mm', '44 mm'] }],
  },
  {
    id: 3,
    name: 'Nimbus Portable Speaker',
    category: 'Electronics',
    description: 'Compact waterproof Bluetooth speaker with rich, room-filling sound and a built-in carry strap.',
    price: 79,
    originalPrice: 99,
    image: unsplashPhoto('photo-1547052178-7f2c5a20c332'),
    imageAlt: 'Oval grey portable speaker on a white surface',
    rating: 4.5,
    reviewCount: 256,
    stockQuantity: 40,
    featured: false,
    createdAt: '2026-06-30',
    tags: ['audio', 'speaker', 'bluetooth', 'outdoor'],
    specifications: { 'Battery life': 'Up to 14 hours', Connectivity: 'Bluetooth 5.2', 'Water resistance': 'IP67' },
    variants: [{ name: 'Color', options: ['Charcoal', 'Coral'] }],
  },
  {
    id: 4,
    name: 'Volt 20,000 mAh Power Bank',
    category: 'Electronics',
    description: 'High-capacity power bank with two USB-C ports and a slim, travel-friendly body.',
    price: 49,
    image: unsplashPhoto('photo-1566554738544-d962991c3fee'),
    imageAlt: 'Green power bank next to a black smartphone',
    rating: 4.3,
    reviewCount: 189,
    stockQuantity: 0,
    featured: false,
    createdAt: '2026-05-18',
    tags: ['charging', 'travel', 'power bank', 'usb-c'],
    specifications: { Capacity: '20,000 mAh', Ports: '2 x USB-C, 1 x USB-A', Weight: '390 g' },
  },
  {
    id: 5,
    name: 'Linen Relaxed Shirt',
    category: 'Fashion',
    description: 'A breathable, relaxed-fit shirt in washed linen that softens with every wear.',
    price: 54,
    image: unsplashPhoto('photo-1542058186993-286fdce0b580'),
    imageAlt: 'White shirts hanging in a row on a clothes rail',
    rating: 4.5,
    reviewCount: 143,
    stockQuantity: 30,
    featured: true,
    createdAt: '2026-09-05',
    tags: ['shirt', 'linen', 'summer', 'casual'],
    specifications: { Material: '100% linen', Fit: 'Relaxed', Care: 'Machine wash cold' },
    variants: [
      { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
      { name: 'Color', options: ['White', 'Sage'] },
    ],
  },
  {
    id: 6,
    name: 'Everyday Merino Sweater',
    category: 'Fashion',
    description: 'A fine-knit merino sweater that stays warm without bulk, ideal for layering.',
    price: 89,
    originalPrice: 119,
    image: unsplashPhoto('photo-1646270968802-6bad28659329'),
    imageAlt: 'A stack of folded knit sweaters',
    rating: 4.7,
    reviewCount: 210,
    stockQuantity: 18,
    featured: false,
    createdAt: '2026-07-12',
    tags: ['sweater', 'merino', 'knitwear', 'winter'],
    specifications: { Material: '100% merino wool', Fit: 'Regular', Care: 'Hand wash or wool cycle' },
    variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }],
  },
  {
    id: 7,
    name: 'Canvas Court Sneakers',
    category: 'Fashion',
    description: 'Clean low-top sneakers with a cushioned insole and a durable vulcanized sole.',
    price: 74,
    image: unsplashPhoto('photo-1551747777-458b63c6ae38'),
    imageAlt: 'Person wearing white low-top canvas sneakers',
    rating: 4.2,
    reviewCount: 98,
    stockQuantity: 3,
    featured: false,
    createdAt: '2026-08-28',
    tags: ['shoes', 'sneakers', 'canvas', 'casual'],
    specifications: { Upper: 'Organic cotton canvas', Sole: 'Vulcanized rubber', Fit: 'True to size' },
    variants: [{ name: 'Size (EU)', options: ['39', '40', '41', '42', '43', '44'] }],
  },
  {
    id: 8,
    name: 'Waxed Cotton Jacket',
    category: 'Fashion',
    description: 'A weather-ready waxed cotton jacket with a corduroy collar and four practical pockets.',
    price: 139,
    image: 'assets/images/waxed-cotton-jacket.svg',
    imageAlt: 'Illustration of an olive waxed cotton jacket with a corduroy collar',
    rating: 4.8,
    reviewCount: 76,
    stockQuantity: 8,
    featured: true,
    createdAt: '2026-10-01',
    tags: ['jacket', 'outerwear', 'waterproof', 'autumn'],
    specifications: { Material: 'Waxed cotton', 'Water resistance': 'Water-repellent finish', Fit: 'Regular' },
    variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }],
  },
  {
    id: 9,
    name: 'Ceramic Pour-Over Coffee Set',
    category: 'Home & Living',
    description: 'A hand-glazed stoneware dripper and carafe set with two matching cups.',
    price: 62,
    image: 'assets/images/pour-over-coffee-set.svg',
    imageAlt: 'Illustration of a ceramic pour-over dripper, carafe and two cups',
    rating: 4.7,
    reviewCount: 164,
    stockQuantity: 22,
    featured: false,
    createdAt: '2026-07-25',
    tags: ['coffee', 'ceramic', 'kitchen', 'gift'],
    specifications: { Capacity: '600 ml carafe', Material: 'Glazed stoneware', Includes: 'Dripper, carafe, 2 cups' },
  },
  {
    id: 10,
    name: 'Woven Cotton Throw Blanket',
    category: 'Home & Living',
    description: 'A generously sized woven throw with a soft hand feel and a fringed edge.',
    price: 68,
    originalPrice: 85,
    image: 'assets/images/cotton-throw-blanket.svg',
    imageAlt: 'Illustration of a stack of folded cotton throw blankets',
    rating: 4.6,
    reviewCount: 121,
    stockQuantity: 15,
    featured: false,
    createdAt: '2026-06-10',
    tags: ['blanket', 'cotton', 'bedroom', 'cosy'],
    specifications: { Size: '130 x 170 cm', Material: '100% cotton', Care: 'Machine wash gentle' },
    variants: [{ name: 'Color', options: ['Oat', 'Slate', 'Terracotta'] }],
  },
  {
    id: 11,
    name: 'Arc Desk Lamp',
    category: 'Home & Living',
    description: 'An adjustable LED desk lamp with dimmable warm-to-cool light and a weighted base.',
    price: 59,
    image: 'assets/images/arc-desk-lamp.svg',
    imageAlt: 'Illustration of an adjustable desk lamp casting warm light',
    rating: 4.4,
    reviewCount: 87,
    stockQuantity: 27,
    featured: true,
    createdAt: '2026-09-14',
    tags: ['lighting', 'desk', 'led', 'office'],
    specifications: { 'Light source': 'LED', 'Color temperature': '2700-5000 K', Power: '10 W adapter included' },
    variants: [{ name: 'Color', options: ['White', 'Black'] }],
  },
  {
    id: 12,
    name: 'Stoneware Plant Pot Trio',
    category: 'Home & Living',
    description: 'Three matching stoneware planters in graduated sizes, each with a drainage hole and saucer.',
    price: 38,
    image: 'assets/images/plant-pot-trio.svg',
    imageAlt: 'Illustration of three stoneware plant pots with green plants',
    rating: 4.3,
    reviewCount: 64,
    stockQuantity: 0,
    featured: false,
    createdAt: '2026-04-20',
    tags: ['plants', 'planter', 'stoneware', 'decor'],
    specifications: { Sizes: '12, 15 and 18 cm', Material: 'Glazed stoneware', Drainage: 'Hole and saucer included' },
  },
  {
    id: 13,
    name: 'Minimalist Leather Wallet',
    category: 'Accessories',
    description: 'A slim cardholder wallet in full-grain leather that develops a rich patina over time.',
    price: 45,
    image: unsplashPhoto('photo-1512415073221-64c70eee25bc'),
    imageAlt: 'Brown leather bifold wallet',
    rating: 4.6,
    reviewCount: 305,
    stockQuantity: 60,
    featured: false,
    createdAt: '2026-05-30',
    tags: ['wallet', 'leather', 'cardholder', 'gift'],
    specifications: { Material: 'Full-grain leather', 'Card slots': '6', Dimensions: '10 x 7.5 cm' },
    variants: [{ name: 'Color', options: ['Tan', 'Black'] }],
  },
  {
    id: 14,
    name: 'Metro Everyday Backpack',
    category: 'Accessories',
    description: 'A clean-lined commuter backpack with a padded laptop sleeve and water-resistant fabric.',
    price: 96,
    originalPrice: 120,
    image: 'assets/images/everyday-backpack.svg',
    imageAlt: 'Illustration of a graphite commuter backpack',
    rating: 4.5,
    reviewCount: 178,
    stockQuantity: 14,
    featured: true,
    createdAt: '2026-08-02',
    tags: ['backpack', 'laptop', 'commute', 'water-resistant'],
    specifications: { Capacity: '22 L', 'Laptop sleeve': 'Up to 15 inches', Material: 'Recycled polyester' },
    variants: [{ name: 'Color', options: ['Graphite', 'Olive'] }],
  },
  {
    id: 15,
    name: 'Polarized Classic Sunglasses',
    category: 'Accessories',
    description: 'Lightweight acetate sunglasses with polarized lenses and full UV protection.',
    price: 58,
    image: unsplashPhoto('photo-1628202926206-c63a34b1618f'),
    imageAlt: 'Black sunglasses on a white surface',
    rating: 4.1,
    reviewCount: 93,
    stockQuantity: 35,
    featured: false,
    createdAt: '2026-06-18',
    tags: ['sunglasses', 'polarized', 'eyewear', 'summer'],
    specifications: { 'UV protection': 'UV400', Lens: 'Polarized', Frame: 'Acetate' },
    variants: [{ name: 'Frame', options: ['Tortoise', 'Black'] }],
  },
  {
    id: 16,
    name: 'Wool Blend Scarf',
    category: 'Accessories',
    description: 'A soft, generously sized scarf in a wool blend for cold-weather layering.',
    price: 36,
    image: 'assets/images/wool-scarf.svg',
    imageAlt: 'Illustration of a camel wool scarf with fringed ends',
    rating: 4.5,
    reviewCount: 58,
    stockQuantity: 20,
    featured: false,
    createdAt: '2026-10-05',
    tags: ['scarf', 'wool', 'winter', 'gift'],
    specifications: { Material: 'Wool blend', Size: '180 x 30 cm' },
    variants: [{ name: 'Color', options: ['Charcoal', 'Camel'] }],
  },
  {
    id: 17,
    name: 'Insulated Steel Water Bottle',
    category: 'Lifestyle',
    description: 'A double-wall stainless steel bottle with a leak-resistant lid and a powder-coated finish.',
    price: 29,
    image: 'assets/images/steel-water-bottle.svg',
    imageAlt: 'Illustration of a green insulated steel water bottle',
    rating: 4.7,
    reviewCount: 512,
    stockQuantity: 80,
    featured: true,
    createdAt: '2026-04-11',
    tags: ['bottle', 'insulated', 'hydration', 'outdoor'],
    specifications: { Capacity: '750 ml', Material: 'Stainless steel', Insulation: 'Double-wall vacuum' },
    variants: [{ name: 'Color', options: ['Forest', 'Stone', 'Sky'] }],
  },
  {
    id: 18,
    name: 'Natural Soy Candle Set',
    category: 'Lifestyle',
    description: 'A set of three hand-poured soy wax candles in calming, natural fragrances.',
    price: 34,
    originalPrice: 42,
    image: 'assets/images/soy-candle-set.svg',
    imageAlt: 'Illustration of three soy candles in glass jars',
    rating: 4.4,
    reviewCount: 132,
    stockQuantity: 25,
    featured: false,
    createdAt: '2026-09-01',
    tags: ['candle', 'soy', 'fragrance', 'gift'],
    specifications: { Contents: '3 candles', Wax: 'Soy wax', 'Burn time': 'Approx. 40 hours each' },
  },
  {
    id: 19,
    name: 'Yoga Mat Pro 6 mm',
    category: 'Lifestyle',
    description: 'A grippy, cushioned yoga mat with a non-slip surface that stays put through every flow.',
    price: 52,
    image: 'assets/images/yoga-mat.svg',
    imageAlt: 'Illustration of a rolled purple yoga mat with two straps',
    rating: 4.6,
    reviewCount: 207,
    stockQuantity: 33,
    featured: false,
    createdAt: '2026-07-03',
    tags: ['yoga', 'fitness', 'mat', 'wellness'],
    specifications: { Thickness: '6 mm', Size: '183 x 61 cm', Material: 'Eco-friendly TPE' },
    variants: [{ name: 'Color', options: ['Plum', 'Slate'] }],
  },
  {
    id: 20,
    name: 'Travel Journal & Pen Set',
    category: 'Lifestyle',
    description: 'A lay-flat travel journal with dotted pages and a matching refillable pen.',
    price: 24,
    image: 'assets/images/travel-journal.svg',
    imageAlt: 'Illustration of a brown travel journal with a pen',
    rating: 4.3,
    reviewCount: 71,
    stockQuantity: 5,
    featured: false,
    createdAt: '2026-08-20',
    tags: ['journal', 'stationery', 'travel', 'notebook'],
    specifications: { Pages: '192 dotted pages', Cover: 'Vegan leather', Includes: 'Refillable pen' },
  },
];

/* ---------- 2. Application state ---------- */
function createDefaultFilters() {
  return {
    category: 'all',
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    inStockOnly: false,
    onSaleOnly: false,
    wishlistOnly: false,
  };
}

function createQuickViewState(productId = null, opener = null) {
  return { productId, quantity: 1, selectedOptions: {}, opener };
}

const state = {
  products: [],
  productsById: new Map(),
  searchIndex: new Map(),
  searchQuery: '',
  filters: createDefaultFilters(),
  sortKey: 'featured',
  currentPage: 1,
  // Cart lines: { lineKey, productId, quantity, selectedOptions }. Prices always come from the product data.
  cart: [],
  // Ids of saved products.
  wishlistIds: new Set(),
  // Ids of recently opened products, newest first.
  recentlyViewedIds: [],
  quickView: createQuickViewState(),
  drawerOpener: null,
  // Which part of the cart drawer is showing: 'cart', 'checkout' or 'confirmation'.
  drawerStep: 'cart',
  // The simulated order shown on the confirmation step. Name and email are never saved anywhere.
  lastOrder: null,
  // Set while the demo order is "processing".
  orderTimerId: null,
  hasShownStorageWarning: false,
};

/* ---------- 3. DOM references ---------- */
const elements = {
  header: document.getElementById('site-header'),
  main: document.getElementById('main'),
  footer: document.querySelector('.site-footer'),
  navToggle: document.getElementById('nav-toggle'),
  primaryNav: document.getElementById('primary-nav'),
  searchToggle: document.getElementById('search-toggle'),
  searchPanel: document.getElementById('search-panel'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  searchClose: document.getElementById('search-close'),
  searchStatus: document.getElementById('search-status'),
  heroShippingPoint: document.getElementById('hero-shipping-point'),
  wishlistButton: document.getElementById('wishlist-button'),
  wishlistCount: document.getElementById('wishlist-count'),
  cartButton: document.getElementById('cart-button'),
  cartCount: document.getElementById('cart-count'),
  categoryGrid: document.getElementById('category-grid'),
  categoryCards: document.querySelectorAll('.category-card'),
  shopSection: document.getElementById('shop'),
  shopToolbar: document.getElementById('shop-toolbar'),
  resultCount: document.getElementById('result-count'),
  filtersToggle: document.getElementById('filters-toggle'),
  filtersCount: document.getElementById('filters-count'),
  filtersPanel: document.getElementById('filters-panel'),
  filtersForm: document.getElementById('filters-form'),
  categoryOptions: document.getElementById('category-options'),
  minPriceInput: document.getElementById('min-price'),
  maxPriceInput: document.getElementById('max-price'),
  priceError: document.getElementById('price-error'),
  ratingSelect: document.getElementById('rating-select'),
  sortSelect: document.getElementById('sort-select'),
  activeFilters: document.getElementById('active-filters'),
  chipList: document.getElementById('chip-list'),
  productGrid: document.getElementById('product-grid'),
  pagination: document.getElementById('pagination'),
  paginationList: document.getElementById('pagination-list'),
  recentSection: document.getElementById('recent-section'),
  recentList: document.getElementById('recent-list'),
  cartBackdrop: document.getElementById('cart-backdrop'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartClose: document.getElementById('cart-close'),
  cartTitle: document.getElementById('cart-title'),
  drawerTitleText: document.getElementById('drawer-title-text'),
  cartHeadingCount: document.getElementById('cart-heading-count'),
  cartStep: document.getElementById('cart-step'),
  shippingProgress: document.getElementById('shipping-progress'),
  shippingMessage: document.getElementById('shipping-message'),
  progressTrack: document.getElementById('progress-track'),
  cartItems: document.getElementById('cart-items'),
  cartEmpty: document.getElementById('cart-empty'),
  cartFooter: document.getElementById('cart-footer'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  clearCartButton: document.getElementById('clear-cart-button'),
  clearConfirm: document.getElementById('clear-confirm'),
  clearCancelButton: document.getElementById('clear-cancel-button'),
  checkoutStep: document.getElementById('checkout-step'),
  checkoutItems: document.getElementById('checkout-items'),
  checkoutTotals: document.getElementById('checkout-totals'),
  checkoutNameInput: document.getElementById('checkout-name'),
  checkoutNameError: document.getElementById('checkout-name-error'),
  checkoutEmailInput: document.getElementById('checkout-email'),
  checkoutEmailError: document.getElementById('checkout-email-error'),
  checkoutSubmit: document.getElementById('checkout-submit'),
  confirmationStep: document.getElementById('confirmation-step'),
  confirmationName: document.getElementById('confirmation-name'),
  confirmationNumber: document.getElementById('confirmation-number'),
  confirmationEmail: document.getElementById('confirmation-email'),
  confirmationItems: document.getElementById('confirmation-items'),
  confirmationTotals: document.getElementById('confirmation-totals'),
  quickView: document.getElementById('quick-view'),
  quickViewBackdrop: document.getElementById('quick-view-backdrop'),
  quickViewClose: document.getElementById('quick-view-close'),
  quickViewContent: document.getElementById('quick-view-content'),
  toastRegion: document.getElementById('toast-region'),
  statusMessage: document.getElementById('status-message'),
  currentYear: document.getElementById('current-year'),
};

// Controls inside the quick view; refilled every time the quick view is drawn.
const quickViewParts = {};

// The two checkout form fields, with their error messages.
const checkoutFields = [
  { key: 'name', input: elements.checkoutNameInput, error: elements.checkoutNameError },
  { key: 'email', input: elements.checkoutEmailInput, error: elements.checkoutEmailError },
];

/* ---------- 4. Formatting and validation utilities ---------- */
const priceFormatter = new Intl.NumberFormat(CONFIG.locale, {
  style: 'currency',
  currency: CONFIG.currency,
});

const wholePriceFormatter = new Intl.NumberFormat(CONFIG.locale, {
  style: 'currency',
  currency: CONFIG.currency,
  maximumFractionDigits: 0,
});

const countFormatter = new Intl.NumberFormat(CONFIG.locale);

function formatPrice(amount) {
  return priceFormatter.format(amount);
}

// "$75" for whole amounts, "$74.50" otherwise.
function formatPriceCompact(amount) {
  return Number.isInteger(amount) ? wholePriceFormatter.format(amount) : priceFormatter.format(amount);
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function pluralize(count, singular) {
  return count === 1 ? singular : `${singular}s`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function debounce(callback, delayMs) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), delayMs);
  };
}

function isInStock(product) {
  return product.stockQuantity > 0;
}

function isLowStock(product) {
  return isInStock(product) && product.stockQuantity <= CONFIG.lowStockThreshold;
}

function isOnSale(product) {
  return Number.isFinite(product.originalPrice) && product.originalPrice > product.price;
}

function getDiscountPercent(product) {
  return Math.round((1 - product.price / product.originalPrice) * 100);
}

function getProductTags(product) {
  return Array.isArray(product.tags) ? product.tags : [];
}

function getProductVariants(product) {
  if (!Array.isArray(product.variants)) return [];

  return product.variants.filter(
    (variant) =>
      variant !== null &&
      typeof variant.name === 'string' &&
      Array.isArray(variant.options) &&
      variant.options.length > 0,
  );
}

function getStockStatus(product) {
  if (!isInStock(product)) return { modifier: 'out', label: 'Sold out' };
  if (isLowStock(product)) return { modifier: 'low', label: `Only ${product.stockQuantity} left` };
  return { modifier: 'in', label: 'In stock' };
}

// A written description of the photo when the product has one, otherwise a generic label.
function getImageAlt(product) {
  const hasDescription = typeof product.imageAlt === 'string' && product.imageAlt.trim() !== '';
  return hasDescription ? product.imageAlt : `${product.name} product photo`;
}

function isValidProduct(product) {
  return (
    product !== null &&
    typeof product === 'object' &&
    Number.isInteger(product.id) &&
    typeof product.name === 'string' &&
    product.name.trim() !== '' &&
    Object.hasOwn(CATEGORY_ICONS, product.category) &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    Number.isInteger(product.stockQuantity) &&
    product.stockQuantity >= 0
  );
}

// Keeps the page usable if a hand-edited product has a typo or a duplicate id.
function getValidProducts(products) {
  const seenIds = new Set();

  return products.filter((product) => {
    const isUsable = isValidProduct(product) && !seenIds.has(product.id);
    if (isUsable) {
      seenIds.add(product.id);
    } else {
      console.warn('ShopSphere: skipped an invalid or duplicate product.', product);
    }
    return isUsable;
  });
}

function parsePriceInput(rawValue) {
  const trimmed = rawValue.trim();
  if (trimmed === '') return { value: null, isValid: true };

  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0
    ? { value: amount, isValid: true }
    : { value: null, isValid: false };
}

// A number field returns '' for half-typed text such as "1e", so the browser's own flag is checked too.
function readPriceField(input) {
  return input.validity.badInput ? { value: null, isValid: false } : parsePriceInput(input.value);
}

function getPriceRangeError(minimum, maximum) {
  if (!minimum.isValid || !maximum.isValid) {
    return 'Enter a price of 0 or more.';
  }
  if (minimum.value !== null && maximum.value !== null && minimum.value > maximum.value) {
    return 'Minimum price cannot be higher than maximum price.';
  }
  return '';
}

/* ---------- DOM helpers (safe: text is always set with textContent) ---------- */
function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

function createVisuallyHidden(text) {
  return createElement('span', 'visually-hidden', text);
}

function createIcon(iconId, extraClass) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('class', extraClass ? `icon ${extraClass}` : 'icon');
  svg.setAttribute('aria-hidden', 'true');

  const use = document.createElementNS(SVG_NAMESPACE, 'use');
  use.setAttribute('href', `#${iconId}`);
  svg.appendChild(use);

  return svg;
}

function createActionButton(className, action, productId, label) {
  const button = createElement('button', className);
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.productId = String(productId);
  button.setAttribute('aria-label', label);
  return button;
}

function createOption(value, label) {
  const option = createElement('option', '', label);
  option.value = String(value);
  return option;
}

function createQuantityButton(action, label, iconId, { lineKey, isDisabled = false } = {}) {
  const button = createElement('button', 'quantity-button');
  button.type = 'button';
  button.dataset.action = action;
  if (lineKey !== undefined) button.dataset.lineKey = lineKey;
  button.disabled = isDisabled;
  button.setAttribute('aria-label', label);
  button.appendChild(createIcon(iconId));
  return button;
}

// Quiet announcement for screen readers, used for changes that already show on screen (like a quantity).
function announceStatus(message) {
  elements.statusMessage.textContent = message;
}

/* ---------- 5. LocalStorage ---------- */
function readStorage(key) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue === null ? null : JSON.parse(rawValue);
  } catch (error) {
    console.warn(`ShopSphere: could not read "${key}" from storage.`, error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`ShopSphere: could not save "${key}" to storage.`, error);
    warnStorageUnavailable();
    return false;
  }
}

// Saved data that is no longer valid (unknown products, impossible quantities) is repaired when the page loads.
function restoreSavedState() {
  const storedCart = readStorage(STORAGE_KEYS.cart);
  const storedWishlist = readStorage(STORAGE_KEYS.wishlist);

  state.cart = sanitizeStoredCart(storedCart);
  state.wishlistIds = sanitizeStoredWishlist(storedWishlist);
  state.recentlyViewedIds = sanitizeStoredRecentlyViewed(readStorage(STORAGE_KEYS.recentlyViewed));

  const isCartRepaired =
    storedCart !== null && JSON.stringify(serializeCart(state.cart)) !== JSON.stringify(storedCart);
  const isWishlistRepaired =
    storedWishlist !== null && JSON.stringify([...state.wishlistIds]) !== JSON.stringify(storedWishlist);

  if (isCartRepaired) saveCart();
  if (isWishlistRepaired) saveWishlist();
  if (isCartRepaired || isWishlistRepaired) {
    showToast('Some saved items were no longer available and were updated.', 'info');
  }
}

/* ---------- 6. Product rendering ---------- */
function createImagePlaceholder(category) {
  const placeholder = createElement('div', 'image-placeholder');
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.appendChild(createIcon(CATEGORY_ICONS[category]));
  return placeholder;
}

function createProductPhoto(product) {
  const photo = document.createElement('img');
  photo.className = 'product-photo';
  photo.alt = getImageAlt(product);
  photo.width = CONFIG.photoWidth;
  photo.height = CONFIG.photoHeight;
  photo.loading = 'lazy';
  photo.decoding = 'async';

  photo.addEventListener('load', () => photo.classList.add('is-loaded'));
  // A failed photo is removed so the placeholder underneath stays visible.
  photo.addEventListener('error', () => photo.remove());

  photo.src = product.image;
  return photo;
}

function createProductImage(product) {
  const image = createElement('div', 'product-image');
  image.dataset.category = slugify(product.category);
  image.appendChild(createImagePlaceholder(product.category));

  if (typeof product.image === 'string' && product.image.trim() !== '') {
    image.appendChild(createProductPhoto(product));
  }

  return image;
}

function createProductBadge(product) {
  if (!isInStock(product)) {
    return createElement('span', 'badge badge-sold-out', 'Sold out');
  }
  if (isOnSale(product)) {
    return createElement('span', 'badge badge-sale', `Save ${getDiscountPercent(product)}%`);
  }
  return null;
}

// The saved/unsaved look is applied by syncWishlistButtons() after the grid is drawn.
// The label stays the same and aria-pressed carries the state, so screen readers do not announce it twice.
function createWishlistButton(product) {
  const button = createActionButton(
    'overlay-button wishlist-toggle',
    'toggle-wishlist',
    product.id,
    `Save ${product.name} to wishlist`,
  );
  button.setAttribute('aria-pressed', 'false');
  button.appendChild(createIcon('icon-heart'));
  return button;
}

function createQuickViewButton(product) {
  const button = createActionButton(
    'overlay-button quick-view-button',
    'quick-view',
    product.id,
    `Quick view: ${product.name}`,
  );
  button.appendChild(createIcon('icon-eye'));
  return button;
}

function createProductMedia(product) {
  const media = createElement('div', 'product-media');
  const badge = createProductBadge(product);

  media.appendChild(createProductImage(product));
  if (badge) media.appendChild(badge);
  media.append(createWishlistButton(product), createQuickViewButton(product));

  return media;
}

function createRating(product) {
  if (!Number.isFinite(product.rating)) return null;

  const rating = createElement('p', 'product-rating');
  const summary = Number.isFinite(product.reviewCount)
    ? `${product.rating.toFixed(1)} (${countFormatter.format(product.reviewCount)})`
    : product.rating.toFixed(1);
  const spokenSummary = Number.isFinite(product.reviewCount)
    ? `Rated ${product.rating.toFixed(1)} out of 5 from ${countFormatter.format(product.reviewCount)} reviews`
    : `Rated ${product.rating.toFixed(1)} out of 5`;

  const summaryText = createElement('span', '', summary);
  summaryText.setAttribute('aria-hidden', 'true');

  rating.append(createIcon('icon-star', 'icon-filled'), summaryText, createVisuallyHidden(spokenSummary));
  return rating;
}

function createPriceRow(product) {
  const row = createElement('p', 'product-price');
  const current = createElement('span', 'price-current', formatPrice(product.price));

  if (!isOnSale(product)) {
    row.appendChild(current);
    return row;
  }

  const original = createElement('s', 'price-original');
  original.append(createVisuallyHidden('Original price: '), formatPrice(product.originalPrice));

  row.classList.add('is-sale');
  row.append(createVisuallyHidden('Sale price: '), current, original);
  return row;
}

function createStockStatus(product) {
  const { modifier, label } = getStockStatus(product);
  return createElement('p', `stock-status is-${modifier}`, label);
}

// Products with variants cannot be added from the card: the shopper must pick options in the quick view.
function getCardButtonState(product) {
  if (!isInStock(product)) {
    return { label: 'Sold out', ariaLabel: `${product.name} is sold out`, isDisabled: true };
  }
  if (getAvailableStock(product) <= 0) {
    return {
      label: 'Max in cart',
      ariaLabel: `${product.name}: the most available is in your cart`,
      isDisabled: true,
    };
  }
  if (getProductVariants(product).length > 0) {
    return { label: 'Choose options', ariaLabel: `Choose options for ${product.name}`, isDisabled: false };
  }
  return { label: 'Add to cart', ariaLabel: `Add ${product.name} to cart`, isDisabled: false };
}

function createAddToCartButton(product) {
  const { label, ariaLabel, isDisabled } = getCardButtonState(product);
  const action = getProductVariants(product).length > 0 ? 'quick-view' : 'add-to-cart';
  const button = createActionButton('button button-primary add-to-cart', action, product.id, ariaLabel);

  button.textContent = label;
  button.disabled = isDisabled;
  return button;
}

function createProductBody(product) {
  const body = createElement('div', 'product-body');

  body.append(
    ...[
      createElement('p', 'product-category', product.category),
      createElement('h3', 'product-name', product.name),
      createRating(product),
      createPriceRow(product),
      createStockStatus(product),
      createAddToCartButton(product),
    ].filter(Boolean),
  );

  return body;
}

function createProductCard(product) {
  const card = createElement('li', 'product-card');
  card.dataset.productId = String(product.id);
  card.classList.toggle('is-sold-out', !isInStock(product));
  card.append(createProductMedia(product), createProductBody(product));
  return card;
}

function getEmptyStateCopy(chips) {
  if (chips.length === 0) {
    return { title: 'No products available', message: 'Please check back soon for new arrivals.' };
  }

  if (state.filters.wishlistOnly && state.wishlistIds.size === 0) {
    return {
      title: 'Your wishlist is empty',
      message: 'Tap the heart on any product to save it for later.',
      actionLabel: 'Browse all products',
    };
  }

  const isCategoryOnly = chips.length === 1 && chips[0].key === 'category';
  if (isCategoryOnly) {
    return {
      title: `No products in ${state.filters.category}`,
      message: 'This category has no products right now.',
      actionLabel: 'Show all products',
    };
  }

  return {
    title: 'No matching products',
    message: 'Try a different keyword or loosen your filters.',
    actionLabel: 'Reset search and filters',
  };
}

function createEmptyState({ title, message, actionLabel }) {
  const item = createElement('li', 'empty-state');
  item.append(createElement('h3', 'empty-state-title', title), createElement('p', '', message));

  if (actionLabel) {
    const button = createElement('button', 'button button-primary', actionLabel);
    button.type = 'button';
    button.dataset.action = 'reset-all';
    item.appendChild(button);
  }

  return item;
}

function renderProductGrid(products, chips) {
  const fragment = document.createDocumentFragment();

  if (products.length === 0) {
    fragment.appendChild(createEmptyState(getEmptyStateCopy(chips)));
  } else {
    products.forEach((product) => fragment.appendChild(createProductCard(product)));
  }

  elements.productGrid.replaceChildren(fragment);
  elements.productGrid.setAttribute('aria-busy', 'false');
  syncAddToCartButtons();
  syncWishlistButtons();
}

function renderCategoryCounts(products) {
  elements.categoryCards.forEach((card) => {
    const category = card.dataset.category;
    const count =
      category === 'all'
        ? products.length
        : products.filter((product) => product.category === category).length;

    card.querySelector('.category-count')?.remove();
    card.appendChild(createElement('span', 'category-count', `${count} ${pluralize(count, 'product')}`));
  });
}

/* ---------- 7. Search, filters, sorting and pagination ---------- */
function compareByFeatured(first, second) {
  const featuredDifference = Number(second.featured === true) - Number(first.featured === true);
  return featuredDifference || (second.reviewCount || 0) - (first.reviewCount || 0);
}

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured', compare: compareByFeatured },
  {
    key: 'newest',
    label: 'Newest',
    compare: (first, second) => (Date.parse(second.createdAt) || 0) - (Date.parse(first.createdAt) || 0),
  },
  { key: 'price-asc', label: 'Price: low to high', compare: (first, second) => first.price - second.price },
  { key: 'price-desc', label: 'Price: high to low', compare: (first, second) => second.price - first.price },
  {
    key: 'rating',
    label: 'Highest rated',
    compare: (first, second) =>
      (second.rating || 0) - (first.rating || 0) || (second.reviewCount || 0) - (first.reviewCount || 0),
  },
  {
    key: 'name',
    label: 'Name: A\u2013Z',
    compare: (first, second) => first.name.localeCompare(second.name, CONFIG.locale),
  },
];

function buildSearchIndex(products) {
  return new Map(
    products.map((product) => [
      product.id,
      [product.name, product.description, product.category, ...getProductTags(product)]
        .join(' ')
        .toLowerCase(),
    ]),
  );
}

function getSearchTerms(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// Every typed word must appear somewhere in the product's name, description, category or tags.
function matchesSearchTerms(product, terms) {
  const searchText = state.searchIndex.get(product.id) ?? '';
  return terms.every((term) => searchText.includes(term));
}

function matchesFilters(product, filters, wishlistIds) {
  if (filters.category !== 'all' && product.category !== filters.category) return false;
  if (filters.minPrice !== null && product.price < filters.minPrice) return false;
  if (filters.maxPrice !== null && product.price > filters.maxPrice) return false;
  if (filters.minRating > 0 && !(product.rating >= filters.minRating)) return false;
  if (filters.inStockOnly && !isInStock(product)) return false;
  if (filters.onSaleOnly && !isOnSale(product)) return false;
  if (filters.wishlistOnly && !wishlistIds.has(product.id)) return false;
  return true;
}

function getVisibleProducts() {
  const terms = getSearchTerms(state.searchQuery);
  const sortOption = SORT_OPTIONS.find((option) => option.key === state.sortKey) ?? SORT_OPTIONS[0];

  // filter() returns a new array, so sorting never changes state.products.
  return state.products
    .filter(
      (product) =>
        matchesSearchTerms(product, terms) && matchesFilters(product, state.filters, state.wishlistIds),
    )
    .sort(sortOption.compare);
}

function getTotalPages(productCount) {
  return Math.max(1, Math.ceil(productCount / CONFIG.pageSize));
}

function describePriceRange(minimum, maximum) {
  if (minimum !== null && maximum !== null) {
    return `Price: ${formatPrice(minimum)} \u2013 ${formatPrice(maximum)}`;
  }
  return minimum !== null
    ? `Price: ${formatPrice(minimum)} and up`
    : `Price: up to ${formatPrice(maximum)}`;
}

function getActiveFilterChips() {
  const { category, minPrice, maxPrice, minRating, inStockOnly, onSaleOnly, wishlistOnly } = state.filters;
  const chips = [];

  if (state.searchQuery) chips.push({ key: 'search', label: `Search: "${state.searchQuery}"` });
  if (category !== 'all') chips.push({ key: 'category', label: `Category: ${category}` });
  if (minPrice !== null || maxPrice !== null) {
    chips.push({ key: 'price', label: describePriceRange(minPrice, maxPrice) });
  }
  if (minRating > 0) chips.push({ key: 'rating', label: `Rating: ${minRating.toFixed(1)}+` });
  if (inStockOnly) chips.push({ key: 'inStock', label: 'In stock only' });
  if (onSaleOnly) chips.push({ key: 'onSale', label: 'On sale' });
  if (wishlistOnly) chips.push({ key: 'wishlist', label: 'Saved items' });

  return chips;
}

function removeFilter(key) {
  switch (key) {
    case 'search':
      state.searchQuery = '';
      break;
    case 'category':
      state.filters.category = 'all';
      break;
    case 'price':
      state.filters.minPrice = null;
      state.filters.maxPrice = null;
      break;
    case 'rating':
      state.filters.minRating = 0;
      break;
    case 'inStock':
      state.filters.inStockOnly = false;
      break;
    case 'onSale':
      state.filters.onSaleOnly = false;
      break;
    case 'wishlist':
      state.filters.wishlistOnly = false;
      break;
    default:
      return;
  }

  state.currentPage = 1;
  syncControlsFromState();
  updateShop();
}

function resetSearchAndFilters() {
  state.searchQuery = '';
  state.filters = createDefaultFilters();
  state.currentPage = 1;
  syncControlsFromState();
  updateShop();
}

function setPriceError(message) {
  const hasError = message !== '';
  elements.priceError.textContent = message;
  elements.priceError.hidden = !hasError;
  elements.minPriceInput.setAttribute('aria-invalid', String(hasError));
  elements.maxPriceInput.setAttribute('aria-invalid', String(hasError));
}

// Pushes the current state into the form controls (used after resets, chip removal and category cards).
function syncControlsFromState() {
  const controls = elements.filtersForm.elements;

  elements.searchInput.value = state.searchQuery;
  controls.category.value = state.filters.category;
  controls.minPrice.value = state.filters.minPrice ?? '';
  controls.maxPrice.value = state.filters.maxPrice ?? '';
  controls.minRating.value = String(state.filters.minRating);
  controls.inStockOnly.checked = state.filters.inStockOnly;
  controls.onSaleOnly.checked = state.filters.onSaleOnly;
  controls.wishlistOnly.checked = state.filters.wishlistOnly;
  elements.sortSelect.value = state.sortKey;
  setPriceError('');
}

function renderCategoryOptions() {
  const fragment = document.createDocumentFragment();

  ['all', ...Object.keys(CATEGORY_ICONS)].forEach((category) => {
    const label = createElement('label', 'radio-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'category';
    input.value = category;

    label.append(input, createElement('span', '', category === 'all' ? 'All categories' : category));
    fragment.appendChild(label);
  });

  elements.categoryOptions.replaceChildren(fragment);
}

function renderRatingOptions() {
  elements.ratingSelect.replaceChildren(
    ...RATING_OPTIONS.map((option) => createOption(option.value, option.label)),
  );
}

function renderSortOptions() {
  elements.sortSelect.replaceChildren(
    ...SORT_OPTIONS.map((option) => createOption(option.key, option.label)),
  );
}

function createFilterChip({ key, label }) {
  const item = createElement('li');
  const button = createElement('button', 'chip');
  button.type = 'button';
  button.dataset.filterKey = key;
  button.setAttribute('aria-label', `Remove filter: ${label}`);
  button.append(createElement('span', '', label), createIcon('icon-close'));

  item.appendChild(button);
  return item;
}

function renderActiveFilters(chips) {
  const fragment = document.createDocumentFragment();
  chips.forEach((chip) => fragment.appendChild(createFilterChip(chip)));

  elements.chipList.replaceChildren(fragment);
  elements.activeFilters.hidden = chips.length === 0;
}

function updateFiltersCount(chips) {
  const count = chips.filter((chip) => chip.key !== 'search').length;
  elements.filtersCount.textContent = String(count);
  elements.filtersCount.hidden = count === 0;
}

function updateResultCount(total, totalPages) {
  if (total === 0) {
    elements.resultCount.textContent = 'No products found';
  } else if (totalPages === 1) {
    elements.resultCount.textContent = `Showing ${total} ${pluralize(total, 'product')}`;
  } else {
    const first = (state.currentPage - 1) * CONFIG.pageSize + 1;
    const last = Math.min(total, state.currentPage * CONFIG.pageSize);
    elements.resultCount.textContent = `Showing ${first}\u2013${last} of ${total} products`;
  }
}

function updateSearchStatus(total) {
  if (!state.searchQuery) {
    elements.searchStatus.textContent = '';
    return;
  }
  elements.searchStatus.textContent =
    total === 0 ? 'No products found' : `${total} ${pluralize(total, 'product')} found`;
}

function getPageItems(totalPages, currentPage) {
  const pages = [1, totalPages, currentPage - 1, currentPage, currentPage + 1]
    .filter((page) => page >= 1 && page <= totalPages);
  const uniquePages = [...new Set(pages)].sort((first, second) => first - second);

  const items = [];
  uniquePages.forEach((page, index) => {
    if (index > 0 && page - uniquePages[index - 1] > 1) items.push('ellipsis');
    items.push(page);
  });
  return items;
}

function createPageButton(label, page, { isCurrent = false, isDisabled = false, ariaLabel } = {}) {
  const button = createElement('button', 'page-button', label);
  button.type = 'button';
  button.dataset.page = String(page);
  button.disabled = isDisabled;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  if (isCurrent) button.setAttribute('aria-current', 'page');
  return button;
}

function createPaginationItem(content) {
  const item = createElement('li');
  item.appendChild(content);
  return item;
}

function renderPagination(totalPages) {
  elements.pagination.hidden = totalPages <= 1;
  if (totalPages <= 1) {
    elements.paginationList.replaceChildren();
    return;
  }

  const { currentPage } = state;
  const fragment = document.createDocumentFragment();

  fragment.appendChild(
    createPaginationItem(createPageButton('Previous', currentPage - 1, { isDisabled: currentPage === 1 })),
  );

  getPageItems(totalPages, currentPage).forEach((item) => {
    if (item === 'ellipsis') {
      const ellipsis = createElement('span', 'page-ellipsis', '\u2026');
      ellipsis.setAttribute('aria-hidden', 'true');
      fragment.appendChild(createPaginationItem(ellipsis));
      return;
    }

    fragment.appendChild(
      createPaginationItem(
        createPageButton(String(item), item, {
          isCurrent: item === currentPage,
          ariaLabel: `Page ${item}`,
        }),
      ),
    );
  });

  fragment.appendChild(
    createPaginationItem(createPageButton('Next', currentPage + 1, { isDisabled: currentPage === totalPages })),
  );

  elements.paginationList.replaceChildren(fragment);
}

// Single place that recomputes the visible products and refreshes every dependent part of the UI.
function updateShop() {
  const matchingProducts = getVisibleProducts();
  const totalPages = getTotalPages(matchingProducts.length);
  state.currentPage = clamp(state.currentPage, 1, totalPages);

  const firstIndex = (state.currentPage - 1) * CONFIG.pageSize;
  const pageProducts = matchingProducts.slice(firstIndex, firstIndex + CONFIG.pageSize);
  const chips = getActiveFilterChips();

  renderProductGrid(pageProducts, chips);
  renderPagination(totalPages);
  updateResultCount(matchingProducts.length, totalPages);
  renderActiveFilters(chips);
  updateFiltersCount(chips);
  updateSearchStatus(matchingProducts.length);
  updateWishlistIndicators();
}

/* ---------- 8. Cart ---------- */
// Keeps only valid choices; anything missing or unknown falls back to the first option.
function sanitizeSelectedOptions(product, rawOptions) {
  const options = rawOptions !== null && typeof rawOptions === 'object' ? rawOptions : {};

  return Object.fromEntries(
    getProductVariants(product).map((variant) => [
      variant.name,
      variant.options.includes(options[variant.name]) ? options[variant.name] : variant.options[0],
    ]),
  );
}

// Names of the variant groups that still have no valid choice (used to validate before adding to the cart).
function getMissingOptionNames(product, selectedOptions) {
  return getProductVariants(product)
    .filter((variant) => !variant.options.includes(selectedOptions[variant.name]))
    .map((variant) => variant.name);
}

// The same product with different options is a separate cart line.
function getLineKey(productId, selectedOptions) {
  const optionParts = Object.entries(selectedOptions)
    .sort(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .map(([name, value]) => `${name}=${value}`);

  return [productId, ...optionParts].join('|');
}

function formatSelectedOptions(selectedOptions) {
  return Object.entries(selectedOptions)
    .map(([name, value]) => `${name}: ${value}`)
    .join(' \u00B7 ');
}

function findCartLine(lineKey) {
  return state.cart.find((line) => line.lineKey === lineKey);
}

function getCartQuantityForProduct(productId) {
  return state.cart
    .filter((line) => line.productId === productId)
    .reduce((total, line) => total + line.quantity, 0);
}

function getAvailableStock(product) {
  return product.stockQuantity - getCartQuantityForProduct(product.id);
}

function getCartItemCount() {
  return state.cart.reduce((total, line) => total + line.quantity, 0);
}

function getCartLineDetails() {
  return state.cart.flatMap((line) => {
    const product = state.productsById.get(line.productId);
    return product ? [{ line, product }] : [];
  });
}

function getLineTotalCents(line, product) {
  return toCents(product.price) * line.quantity;
}

// Caps quantities so the lines of one product never exceed its stock.
function limitLinesToStock(lines) {
  const remainingStock = new Map();

  return lines.flatMap((line) => {
    const product = state.productsById.get(line.productId);
    const remaining = remainingStock.get(product.id) ?? product.stockQuantity;
    const quantity = Math.min(line.quantity, remaining);
    remainingStock.set(product.id, remaining - quantity);
    return quantity > 0 ? [{ ...line, quantity }] : [];
  });
}

// Turns whatever was stored into a safe cart: unknown products, bad quantities and bad options are fixed or dropped.
function sanitizeStoredCart(rawLines) {
  if (!Array.isArray(rawLines)) return [];

  const mergedLines = new Map();

  rawLines.forEach((rawLine) => {
    const product = state.productsById.get(rawLine?.productId);
    const quantity = Number(rawLine?.quantity);
    if (!product || !isInStock(product) || !Number.isInteger(quantity) || quantity < 1) return;

    const selectedOptions = sanitizeSelectedOptions(product, rawLine.selectedOptions);
    const lineKey = getLineKey(product.id, selectedOptions);
    const existingLine = mergedLines.get(lineKey);

    if (existingLine) {
      existingLine.quantity += quantity;
    } else {
      mergedLines.set(lineKey, { lineKey, productId: product.id, quantity, selectedOptions });
    }
  });

  return limitLinesToStock([...mergedLines.values()]);
}

function serializeCart(lines) {
  return lines.map(({ productId, quantity, selectedOptions }) => ({ productId, quantity, selectedOptions }));
}

function loadStoredCart() {
  return sanitizeStoredCart(readStorage(STORAGE_KEYS.cart));
}

function saveCart() {
  writeStorage(STORAGE_KEYS.cart, serializeCart(state.cart));
}

// Runs after every successful cart change: save and redraw. Callers decide what to announce.
function commitCartChange() {
  saveCart();
  renderCart();
  syncAddToCartButtons();
}

// Products with variants need a complete set of selected options, otherwise nothing is added.
function addToCart(productId, quantity = 1, selectedOptions = {}) {
  const product = state.productsById.get(productId);
  if (!product || !isInStock(product)) return false;
  if (getMissingOptionNames(product, selectedOptions).length > 0) return false;

  if (getAvailableStock(product) < quantity) {
    showToast(`Only ${product.stockQuantity} of ${product.name} available.`, 'error');
    return false;
  }

  const options = sanitizeSelectedOptions(product, selectedOptions);
  const lineKey = getLineKey(product.id, options);
  const existingLine = findCartLine(lineKey);

  if (existingLine) {
    existingLine.quantity += quantity;
  } else {
    state.cart.push({ lineKey, productId: product.id, quantity, selectedOptions: options });
  }

  commitCartChange();
  showToast(`${product.name} added to cart.`);
  return true;
}

function changeLineQuantity(lineKey, delta) {
  const line = findCartLine(lineKey);
  const product = line && state.productsById.get(line.productId);
  if (!product) return;

  const newQuantity = line.quantity + delta;
  if (newQuantity < 1 || (delta > 0 && getAvailableStock(product) < delta)) return;

  line.quantity = newQuantity;
  commitCartChange();
  announceStatus(`Quantity of ${product.name} is now ${newQuantity}.`);
}

function removeCartLine(lineKey) {
  const line = findCartLine(lineKey);
  const product = line && state.productsById.get(line.productId);
  if (!product) return;

  state.cart = state.cart.filter((cartLine) => cartLine.lineKey !== lineKey);
  commitCartChange();
  showToast(`${product.name} removed from cart.`);
}

function clearCart() {
  state.cart = [];
  setClearConfirmVisible(false);
  commitCartChange();
  showToast('Cart cleared.');
}

// Keeps every card button in step with the cart and the remaining stock.
function syncAddToCartButtons() {
  elements.productGrid.querySelectorAll('.add-to-cart').forEach((button) => {
    const product = state.productsById.get(Number(button.dataset.productId));
    if (!product) return;

    const { label, ariaLabel, isDisabled } = getCardButtonState(product);
    button.textContent = label;
    button.disabled = isDisabled;
    button.setAttribute('aria-label', ariaLabel);
  });
}

function showAddedFeedback(button) {
  button.textContent = 'Added';
  setTimeout(syncAddToCartButtons, CONFIG.addedFeedbackMs);
}

function createCartThumbnail(product) {
  const thumbnail = createElement('div', 'cart-thumb');
  thumbnail.appendChild(createProductImage(product));
  return thumbnail;
}

function createQuantityControl(line, product) {
  const control = createElement('div', 'quantity-control');
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', `Quantity for ${product.name}`);

  const isAtLimit = getAvailableStock(product) <= 0;

  control.append(
    createQuantityButton('decrease-quantity', `Decrease quantity of ${product.name}`, 'icon-minus', {
      lineKey: line.lineKey,
      isDisabled: line.quantity <= 1,
    }),
    createElement('span', 'quantity-value', String(line.quantity)),
    createQuantityButton('increase-quantity', `Increase quantity of ${product.name}`, 'icon-plus', {
      lineKey: line.lineKey,
      isDisabled: isAtLimit,
    }),
  );

  return control;
}

function createRemoveButton(line, product) {
  const button = createElement('button', 'link-button remove-line', 'Remove');
  button.type = 'button';
  button.dataset.action = 'remove-line';
  button.dataset.lineKey = line.lineKey;
  button.setAttribute('aria-label', `Remove ${product.name} from cart`);
  return button;
}

function createCartItemDetails(line, product) {
  const details = createElement('div', 'cart-item-main');
  const optionsText = formatSelectedOptions(line.selectedOptions);
  const controls = createElement('div', 'cart-item-controls');

  controls.append(
    createQuantityControl(line, product),
    createElement('p', 'cart-item-total', formatPrice(getLineTotalCents(line, product) / 100)),
  );

  details.appendChild(createElement('h3', 'cart-item-name', product.name));
  if (optionsText) details.appendChild(createElement('p', 'cart-item-options', optionsText));
  details.append(createElement('p', 'cart-item-price', `${formatPrice(product.price)} each`), controls);

  if (getAvailableStock(product) <= 0) {
    details.appendChild(createElement('p', 'cart-item-note', 'Maximum available quantity reached.'));
  }

  details.appendChild(createRemoveButton(line, product));
  return details;
}

function createCartItem({ line, product }) {
  const item = createElement('li', 'cart-item');
  item.append(createCartThumbnail(product), createCartItemDetails(line, product));
  return item;
}

function updateCartIndicators(itemCount) {
  elements.cartCount.textContent =
    itemCount > CONFIG.maxBadgeCount ? `${CONFIG.maxBadgeCount}+` : String(itemCount);
  elements.cartCount.hidden = itemCount === 0;
  elements.cartButton.setAttribute(
    'aria-label',
    `Shopping cart, ${itemCount} ${pluralize(itemCount, 'item')}`,
  );
  elements.cartHeadingCount.textContent = itemCount === 0 ? '' : `(${itemCount})`;
}

// Demonstration rule: nothing is really shipped, this only shows how a free-shipping goal would look.
function updateShippingProgress(subtotalCents, isCartEmpty) {
  const thresholdCents = toCents(CONFIG.freeShippingThreshold);
  const isRuleEnabled = thresholdCents > 0;

  elements.shippingProgress.hidden = isCartEmpty || !isRuleEnabled;
  if (isCartEmpty || !isRuleEnabled) return;

  const remainingCents = Math.max(0, thresholdCents - subtotalCents);
  const percent = Math.min(100, Math.floor((subtotalCents / thresholdCents) * 100));
  const isComplete = remainingCents === 0;
  const message = isComplete
    ? 'You have free shipping (demo rule).'
    : `Add ${formatPrice(remainingCents / 100)} more for free shipping (demo rule).`;

  elements.shippingMessage.textContent = message;
  elements.progressTrack.style.setProperty('--progress', `${percent}%`);
  elements.progressTrack.setAttribute('aria-valuenow', String(percent));
  elements.progressTrack.setAttribute('aria-valuetext', message);
  elements.shippingProgress.classList.toggle('is-complete', isComplete);
}

function getShippingOfferText() {
  return CONFIG.freeShippingThreshold > 0
    ? `Free shipping over ${formatPriceCompact(CONFIG.freeShippingThreshold)} (demo rule)`
    : 'Free shipping on every order (demo rule)';
}

function renderCart() {
  const lineDetails = getCartLineDetails();
  const isEmpty = lineDetails.length === 0;
  const subtotalCents = lineDetails.reduce(
    (total, { line, product }) => total + getLineTotalCents(line, product),
    0,
  );

  elements.cartItems.replaceChildren(...lineDetails.map(createCartItem));
  elements.cartItems.hidden = isEmpty;
  elements.cartEmpty.hidden = !isEmpty;
  elements.cartFooter.hidden = isEmpty;
  elements.cartSubtotal.textContent = formatPrice(subtotalCents / 100);
  updateShippingProgress(subtotalCents, isEmpty);
  updateCartIndicators(getCartItemCount());
}

function setClearConfirmVisible(isVisible, shouldMoveFocus = false) {
  elements.clearConfirm.hidden = !isVisible;
  elements.clearCartButton.hidden = isVisible;

  if (shouldMoveFocus) {
    (isVisible ? elements.clearCancelButton : elements.clearCartButton).focus();
  }
}

// After a re-render the clicked button is gone, so put focus on the matching new one.
function focusCartControl(lineKey, preferredAction) {
  const lineButtons = [...elements.cartItems.querySelectorAll('button[data-line-key]')].filter(
    (button) => button.dataset.lineKey === lineKey && !button.disabled,
  );
  const emptyStateButton = elements.cartEmpty.querySelector('button');
  const fallback = elements.cartEmpty.hidden ? elements.cartClose : emptyStateButton;

  const target = lineButtons.find((button) => button.dataset.action === preferredAction) ?? lineButtons[0] ?? fallback;
  target.focus();
}

/* ---------- Demo checkout (a simulation: no payment, no email, no saved personal data) ---------- */
// A plain snapshot of the cart, so the confirmation can still show the order after the cart is emptied.
function getOrderItems() {
  return getCartLineDetails().map(({ line, product }) => ({
    name: product.name,
    optionsText: formatSelectedOptions(line.selectedOptions),
    quantity: line.quantity,
    unitCents: toCents(product.price),
    lineCents: getLineTotalCents(line, product),
  }));
}

function getOrderSubtotalCents(items) {
  return items.reduce((total, item) => total + item.lineCents, 0);
}

// Shipping is never really calculated: it is either covered by the demo free-shipping rule or left out.
function getShippingLabel(subtotalCents) {
  const thresholdCents = toCents(CONFIG.freeShippingThreshold);
  const isFree = thresholdCents <= 0 || subtotalCents >= thresholdCents;
  return isFree ? 'Free (demo rule)' : 'Not calculated (demo)';
}

function createSummaryItem(item) {
  const row = createElement('li', 'summary-item');
  const info = createElement('div', 'summary-item-info');
  const meta = [item.optionsText, `${item.quantity} \u00D7 ${formatPrice(item.unitCents / 100)}`]
    .filter(Boolean)
    .join(' \u00B7 ');

  info.append(
    createElement('p', 'summary-item-name', item.name),
    createElement('p', 'summary-item-meta', meta),
  );
  row.append(info, createElement('p', 'summary-item-total', formatPrice(item.lineCents / 100)));
  return row;
}

function createTotalsRows(subtotalCents) {
  const fragment = document.createDocumentFragment();
  const rows = [
    ['Subtotal', formatPrice(subtotalCents / 100)],
    ['Shipping', getShippingLabel(subtotalCents)],
    ['Taxes', 'Not calculated (demo)'],
  ];

  rows.forEach(([label, value]) => {
    fragment.append(createElement('dt', '', label), createElement('dd', '', value));
  });
  fragment.append(
    createElement('dt', 'summary-total-label', 'Demo total'),
    createElement('dd', 'summary-total-value', formatPrice(subtotalCents / 100)),
  );
  return fragment;
}

function renderOrderSummary(listElement, totalsElement, items) {
  listElement.replaceChildren(...items.map(createSummaryItem));
  totalsElement.replaceChildren(createTotalsRows(getOrderSubtotalCents(items)));
}

function createOrderNumber() {
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);
  const randomPart = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `DEMO-${timePart}${randomPart}`;
}

function validateCheckoutField({ key, input }) {
  const value = input.value.trim();

  if (key === 'name') {
    return value.length >= 2 ? '' : 'Enter your full name.';
  }
  if (value === '') return 'Enter your email address.';
  return EMAIL_PATTERN.test(value) ? '' : 'Enter a valid email address, like name@example.com.';
}

function showCheckoutFieldError({ input, error }, message) {
  error.textContent = message;
  error.hidden = message === '';
  input.setAttribute('aria-invalid', String(message !== ''));
}

// Shows every error at once and moves focus to the first field that needs fixing.
function validateCheckoutForm() {
  const invalidFields = checkoutFields.filter((field) => {
    const message = validateCheckoutField(field);
    showCheckoutFieldError(field, message);
    return message !== '';
  });

  invalidFields[0]?.input.focus();
  return invalidFields.length === 0;
}

function clearCheckoutForm() {
  elements.checkoutStep.reset();
  checkoutFields.forEach((field) => showCheckoutFieldError(field, ''));
}

function setPlacingOrder(isPlacing) {
  elements.checkoutSubmit.disabled = isPlacing;
  elements.checkoutSubmit.textContent = isPlacing ? 'Placing demo order\u2026' : 'Place demo order';
}

function cancelPendingOrder() {
  if (state.orderTimerId === null) return;

  clearTimeout(state.orderTimerId);
  state.orderTimerId = null;
  setPlacingOrder(false);
}

// Shows one part of the drawer and puts focus on its title so the change is announced.
function setDrawerStep(step, { moveFocus = true } = {}) {
  state.drawerStep = step;
  elements.cartStep.hidden = step !== 'cart';
  elements.checkoutStep.hidden = step !== 'checkout';
  elements.confirmationStep.hidden = step !== 'confirmation';
  elements.drawerTitleText.textContent = DRAWER_TITLES[step];
  elements.cartHeadingCount.hidden = step !== 'cart';

  if (moveFocus) elements.cartTitle.focus();
}

function startCheckout() {
  if (state.cart.length === 0) return;

  renderOrderSummary(elements.checkoutItems, elements.checkoutTotals, getOrderItems());
  setDrawerStep('checkout');
}

function renderConfirmation(order) {
  elements.confirmationName.textContent = order.customer.name;
  elements.confirmationNumber.textContent = order.number;
  elements.confirmationEmail.textContent = order.customer.email;
  renderOrderSummary(elements.confirmationItems, elements.confirmationTotals, order.items);
}

function completeDemoOrder(customer) {
  state.orderTimerId = null;
  setPlacingOrder(false);

  const items = getOrderItems();
  if (items.length === 0) {
    showToast('Your cart is empty, so no demo order was placed.', 'error');
    setDrawerStep('cart');
    return;
  }

  state.lastOrder = { number: createOrderNumber(), customer, items };
  state.cart = [];
  commitCartChange();
  clearCheckoutForm();
  renderConfirmation(state.lastOrder);
  setDrawerStep('confirmation');
  showToast('Demo order placed. No payment was taken.');
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (state.orderTimerId !== null) return;

  if (state.cart.length === 0) {
    showToast('Your cart is empty.', 'error');
    setDrawerStep('cart');
    return;
  }
  if (!validateCheckoutForm()) return;

  const customer = {
    name: elements.checkoutNameInput.value.trim(),
    email: elements.checkoutEmailInput.value.trim(),
  };

  setPlacingOrder(true);
  state.orderTimerId = setTimeout(() => completeDemoOrder(customer), CONFIG.orderSimulationMs);
}

// Checks a field when the shopper leaves it (but stays quiet on fields they have not touched).
function handleCheckoutFocusOut(event) {
  const field = checkoutFields.find((candidate) => candidate.input === event.target);
  if (!field) return;
  if (field.input.value.trim() === '' && field.error.hidden) return;

  showCheckoutFieldError(field, validateCheckoutField(field));
}

// An error disappears as soon as the field becomes valid.
function handleCheckoutInput(event) {
  const field = checkoutFields.find((candidate) => candidate.input === event.target);
  if (field && !field.error.hidden) showCheckoutFieldError(field, validateCheckoutField(field));
}

/* ---------- Overlays shared by the cart drawer and the quick view ---------- */
function isCartDrawerOpen() {
  return elements.cartDrawer.classList.contains('is-open');
}

function isQuickViewOpen() {
  return elements.quickView.classList.contains('is-open');
}

// Makes the page behind an overlay unreachable by keyboard and assistive technology.
function setPageInert(isInert) {
  [elements.header, elements.main, elements.footer].forEach((region) => {
    region.inert = isInert;
  });
}

function getFocusableElements(container) {
  return [...container.querySelectorAll('button, a[href], input, select')].filter(
    (element) => !element.disabled && element.offsetParent !== null,
  );
}

// Keeps Tab and Shift+Tab inside the open overlay.
function trapFocus(event, container) {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getOpenOverlay() {
  if (isQuickViewOpen()) return elements.quickView;
  if (isCartDrawerOpen()) return elements.cartDrawer;
  return null;
}

/* ---------- Cart drawer (modal dialog) ---------- */
function openCartDrawer() {
  if (isCartDrawerOpen()) return;

  state.drawerOpener = document.activeElement;
  setSearchPanelOpen(false);
  setMobileNavOpen(false);

  elements.cartBackdrop.classList.add('is-open');
  elements.cartDrawer.classList.add('is-open');
  document.body.classList.add('has-overlay-open');
  setPageInert(true);
  elements.cartClose.focus();
}

function closeCartDrawer({ restoreFocus = true } = {}) {
  if (!isCartDrawerOpen()) return;

  elements.cartBackdrop.classList.remove('is-open');
  elements.cartDrawer.classList.remove('is-open');
  document.body.classList.remove('has-overlay-open');
  setPageInert(false);
  setClearConfirmVisible(false);

  // Closing the drawer leaves checkout: a pending demo order is cancelled and the drawer returns to the cart.
  cancelPendingOrder();
  if (state.drawerStep !== 'cart') setDrawerStep('cart', { moveFocus: false });
  state.lastOrder = null;

  if (restoreFocus) {
    const opener = state.drawerOpener;
    (opener instanceof HTMLElement && document.contains(opener) ? opener : elements.cartButton).focus();
  }
  state.drawerOpener = null;
}

function handleCartDrawerClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, lineKey } = button.dataset;

  switch (action) {
    case 'increase-quantity':
    case 'decrease-quantity':
      changeLineQuantity(lineKey, action === 'increase-quantity' ? 1 : -1);
      focusCartControl(lineKey, action);
      break;
    case 'remove-line':
      removeCartLine(lineKey);
      focusCartControl(lineKey, action);
      break;
    case 'show-clear-confirm':
      setClearConfirmVisible(true, true);
      break;
    case 'cancel-clear':
      setClearConfirmVisible(false, true);
      break;
    case 'confirm-clear':
      clearCart();
      focusCartControl('', action);
      break;
    case 'start-checkout':
      startCheckout();
      break;
    case 'back-to-cart':
      cancelPendingOrder();
      setDrawerStep('cart');
      break;
    case 'finish-order':
    case 'continue-shopping':
      closeCartDrawer({ restoreFocus: false });
      elements.shopSection.scrollIntoView();
      break;
    default:
      break;
  }
}

/* ---------- 9. Wishlist ---------- */
// Ids of products that no longer exist (or are not numbers) are dropped instead of breaking the page.
function sanitizeStoredWishlist(rawIds) {
  if (!Array.isArray(rawIds)) return new Set();
  return new Set(rawIds.filter((id) => state.productsById.has(id)));
}

function loadStoredWishlist() {
  return sanitizeStoredWishlist(readStorage(STORAGE_KEYS.wishlist));
}

function saveWishlist() {
  writeStorage(STORAGE_KEYS.wishlist, [...state.wishlistIds]);
}

function updateWishlistIndicators() {
  const count = state.wishlistIds.size;

  elements.wishlistCount.textContent =
    count > CONFIG.maxBadgeCount ? `${CONFIG.maxBadgeCount}+` : String(count);
  elements.wishlistCount.hidden = count === 0;
  elements.wishlistButton.setAttribute('aria-label', `Wishlist, ${count} ${pluralize(count, 'item')}`);
  elements.wishlistButton.setAttribute('aria-pressed', String(state.filters.wishlistOnly));
}

// Keeps every heart on the visible cards in step with the saved items.
// Only aria-pressed changes; the label is fixed when the button is created.
function syncWishlistButtons() {
  elements.productGrid.querySelectorAll('.wishlist-toggle').forEach((button) => {
    const product = state.productsById.get(Number(button.dataset.productId));
    if (!product) return;

    button.setAttribute('aria-pressed', String(state.wishlistIds.has(product.id)));
  });
}

// In the saved-items view the grid itself changes; otherwise only the hearts and counts need updating.
function refreshWishlistUI() {
  if (state.filters.wishlistOnly) {
    updateShop();
    return;
  }
  updateWishlistIndicators();
  syncWishlistButtons();
}

function toggleWishlist(productId) {
  const product = state.productsById.get(productId);
  if (!product) return;

  const wasSaved = state.wishlistIds.has(productId);
  if (wasSaved) {
    state.wishlistIds.delete(productId);
  } else {
    state.wishlistIds.add(productId);
  }

  saveWishlist();
  refreshWishlistUI();
  showToast(wasSaved ? `${product.name} removed from wishlist.` : `${product.name} added to wishlist.`);
}

// Removing a card inside the saved-items view redraws the grid, so keep keyboard focus nearby.
function handleWishlistToggleClick(button) {
  const cardIndex = [...elements.productGrid.children].indexOf(button.closest('.product-card'));
  toggleWishlist(Number(button.dataset.productId));

  if (!state.filters.wishlistOnly) return;

  const hearts = elements.productGrid.querySelectorAll('.wishlist-toggle');
  const target =
    hearts[Math.min(cardIndex, hearts.length - 1)] ??
    elements.productGrid.querySelector('button') ??
    elements.wishlistButton;
  target.focus();
}

// The header heart switches the catalog to the saved-items view and back.
function handleWishlistButtonClick() {
  const willShowSaved = !state.filters.wishlistOnly;

  state.filters.wishlistOnly = willShowSaved;
  state.currentPage = 1;
  syncControlsFromState();
  updateShop();

  if (willShowSaved) elements.shopToolbar.scrollIntoView();
}

/* ---------- 10. Product details (quick view) and recently viewed ---------- */
// "Sold out" and "Max in cart" are disabled states; otherwise the button adds the chosen quantity.
function getQuickViewButtonState(product) {
  if (!isInStock(product)) return { label: 'Sold out', isDisabled: true };
  if (getAvailableStock(product) <= 0) return { label: 'Max in cart', isDisabled: true };
  return { label: 'Add to cart', isDisabled: false };
}

function getSpecificationEntries(product) {
  const specifications = product.specifications;
  if (specifications === null || typeof specifications !== 'object' || Array.isArray(specifications)) {
    return [];
  }

  return Object.entries(specifications).filter(
    ([, value]) => typeof value === 'string' || typeof value === 'number',
  );
}

function createQuickViewMedia(product) {
  const media = createElement('div', 'quick-view-media');
  const badge = createProductBadge(product);

  media.appendChild(createProductImage(product));
  if (badge) media.appendChild(badge);
  return media;
}

// One group of radio buttons per variant (for example Size or Color). Nothing is preselected.
function createOptionGroup(variant, groupIndex) {
  const group = createElement('fieldset', 'option-group');
  const list = createElement('div', 'option-list');
  group.dataset.optionName = variant.name;
  group.appendChild(createElement('legend', '', variant.name));

  variant.options.forEach((option) => {
    const label = createElement('label', 'option-pill');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `option-${groupIndex}`;
    input.value = option;
    input.dataset.optionName = variant.name;

    label.append(input, createElement('span', '', option));
    list.appendChild(label);
  });

  group.appendChild(list);
  return group;
}

function createSpecifications(product) {
  const entries = getSpecificationEntries(product);
  if (entries.length === 0) return null;

  const section = createElement('section', 'quick-view-section');
  const list = createElement('dl', 'spec-list');

  entries.forEach(([name, value]) => {
    list.append(createElement('dt', '', name), createElement('dd', '', String(value)));
  });

  section.append(createElement('h3', 'quick-view-subheading', 'Specifications'), list);
  return section;
}

function createQuickViewActions() {
  const actions = createElement('div', 'quick-view-actions');
  const quantityControl = createElement('div', 'quantity-control');
  quantityControl.setAttribute('role', 'group');
  quantityControl.setAttribute('aria-label', 'Quantity');

  const quantityValue = createElement('span', 'quantity-value', '1');
  quantityValue.setAttribute('aria-live', 'polite');

  const decreaseButton = createQuantityButton('decrease-quick-quantity', 'Decrease quantity', 'icon-minus', {
    isDisabled: true,
  });
  const increaseButton = createQuantityButton('increase-quick-quantity', 'Increase quantity', 'icon-plus');

  const addButton = createElement('button', 'button button-primary', 'Add to cart');
  addButton.type = 'button';
  addButton.dataset.action = 'add-from-quick-view';

  quantityControl.append(decreaseButton, quantityValue, increaseButton);
  actions.append(quantityControl, addButton);

  Object.assign(quickViewParts, { quantityValue, decreaseButton, increaseButton, addButton });
  return actions;
}

function createQuickViewDetails(product) {
  const details = createElement('div', 'quick-view-details');
  const title = createElement('h2', 'quick-view-title', product.name);
  title.id = 'quick-view-title';

  const hasDescription = typeof product.description === 'string' && product.description.trim() !== '';

  const error = createElement('p', 'field-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const cartNote = createElement('p', 'quick-view-cart-note');
  const feedback = createElement('div', 'quick-view-feedback');
  feedback.hidden = true;
  Object.assign(quickViewParts, { error, cartNote, feedback });

  details.append(
    ...[
      createElement('p', 'product-category', product.category),
      title,
      createRating(product),
      createPriceRow(product),
      createStockStatus(product),
      hasDescription ? createElement('p', 'quick-view-description', product.description) : null,
      ...getProductVariants(product).map(createOptionGroup),
      error,
      createQuickViewActions(),
      cartNote,
      feedback,
      createSpecifications(product),
    ].filter(Boolean),
  );

  return details;
}

function renderQuickViewContent(product) {
  const layout = createElement('div', 'quick-view-layout');
  layout.append(createQuickViewMedia(product), createQuickViewDetails(product));
  elements.quickViewContent.replaceChildren(layout);
}

function setQuickViewError(message) {
  quickViewParts.error.textContent = message;
  quickViewParts.error.hidden = message === '';
}

function clearQuickViewFeedback() {
  quickViewParts.feedback.replaceChildren();
  quickViewParts.feedback.hidden = true;
}

function showQuickViewFeedback(quantity) {
  const viewCartButton = createElement('button', 'link-button', 'View cart');
  viewCartButton.type = 'button';
  viewCartButton.dataset.action = 'view-cart';

  quickViewParts.feedback.replaceChildren(
    createElement('span', '', `${quantity} ${pluralize(quantity, 'item')} added to your cart.`),
    viewCartButton,
  );
  quickViewParts.feedback.hidden = false;
}

// Keeps the quantity stepper, the add button and the cart note correct for the remaining stock.
function updateQuickViewControls() {
  const product = state.productsById.get(state.quickView.productId);
  if (!product) return;

  const available = getAvailableStock(product);
  const quantity = clamp(state.quickView.quantity, 1, Math.max(1, available));
  const inCart = getCartQuantityForProduct(product.id);
  const { label, isDisabled } = getQuickViewButtonState(product);

  state.quickView.quantity = quantity;
  quickViewParts.quantityValue.textContent = String(quantity);
  quickViewParts.decreaseButton.disabled = quantity <= 1;
  quickViewParts.increaseButton.disabled = quantity >= available;
  quickViewParts.cartNote.textContent = inCart > 0 ? `${inCart} already in your cart.` : '';
  quickViewParts.addButton.textContent = label;
  quickViewParts.addButton.disabled = isDisabled;
}

function openQuickView(productId, opener) {
  const product = state.productsById.get(productId);
  if (!product || isQuickViewOpen()) return;

  state.quickView = createQuickViewState(productId, opener);
  renderQuickViewContent(product);
  updateQuickViewControls();
  // The list below the grid is redrawn when the quick view closes, so the opener is not replaced while in use.
  recordRecentlyViewed(productId);

  elements.quickViewBackdrop.classList.add('is-open');
  elements.quickView.classList.add('is-open');
  document.body.classList.add('has-overlay-open');
  setPageInert(true);
  elements.quickViewContent.scrollTop = 0;
  elements.quickViewClose.focus();
}

function closeQuickView({ restoreFocus = true } = {}) {
  if (!isQuickViewOpen()) return;

  const { opener } = state.quickView;

  elements.quickViewBackdrop.classList.remove('is-open');
  elements.quickView.classList.remove('is-open');
  document.body.classList.remove('has-overlay-open');
  setPageInert(false);
  state.quickView = createQuickViewState();

  if (restoreFocus) {
    (opener instanceof HTMLElement && document.contains(opener) ? opener : elements.cartButton).focus();
  }
  renderRecentlyViewed();
}

function changeQuickViewQuantity(delta) {
  state.quickView.quantity += delta;
  clearQuickViewFeedback();
  updateQuickViewControls();

  // The button that was just used may now be disabled, so move focus to the other one.
  const { decreaseButton, increaseButton } = quickViewParts;
  const [usedButton, otherButton] = delta > 0 ? [increaseButton, decreaseButton] : [decreaseButton, increaseButton];
  if (usedButton.disabled) otherButton.focus();
}

function addFromQuickView() {
  const product = state.productsById.get(state.quickView.productId);
  if (!product) return;

  const { quantity, selectedOptions } = state.quickView;
  const missingOptions = getMissingOptionNames(product, selectedOptions);

  if (missingOptions.length > 0) {
    setQuickViewError(`Please select: ${missingOptions.join(', ')}.`);
    const firstMissingGroup = [...elements.quickViewContent.querySelectorAll('.option-group')].find(
      (group) => group.dataset.optionName === missingOptions[0],
    );
    firstMissingGroup?.querySelector('input')?.focus();
    return;
  }

  setQuickViewError('');
  if (addToCart(product.id, quantity, { ...selectedOptions })) {
    state.quickView.quantity = 1;
    showQuickViewFeedback(quantity);
  }
  updateQuickViewControls();
}

function viewCartFromQuickView() {
  closeQuickView({ restoreFocus: false });
  elements.cartButton.focus();
  openCartDrawer();
}

function handleQuickViewClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  switch (button.dataset.action) {
    case 'decrease-quick-quantity':
      changeQuickViewQuantity(-1);
      break;
    case 'increase-quick-quantity':
      changeQuickViewQuantity(1);
      break;
    case 'add-from-quick-view':
      addFromQuickView();
      break;
    case 'view-cart':
      viewCartFromQuickView();
      break;
    default:
      break;
  }
}

function handleQuickViewChange(event) {
  const input = event.target;
  if (!input.matches('input[type="radio"]')) return;

  state.quickView.selectedOptions[input.dataset.optionName] = input.value;
  setQuickViewError('');
  clearQuickViewFeedback();
}

/* ---------- Recently viewed ---------- */
function sanitizeStoredRecentlyViewed(rawIds) {
  if (!Array.isArray(rawIds)) return [];

  const knownIds = rawIds.filter((id) => state.productsById.has(id));
  return [...new Set(knownIds)].slice(0, CONFIG.recentlyViewedLimit);
}

function saveRecentlyViewed() {
  writeStorage(STORAGE_KEYS.recentlyViewed, state.recentlyViewedIds);
}

// Newest first, no duplicates, and never more than the configured limit.
function recordRecentlyViewed(productId) {
  state.recentlyViewedIds = [
    productId,
    ...state.recentlyViewedIds.filter((id) => id !== productId),
  ].slice(0, CONFIG.recentlyViewedLimit);

  saveRecentlyViewed();
}

function createRecentItem(product) {
  const item = createElement('li', 'recent-item');
  const thumbnail = createElement('div', 'recent-thumb');
  const text = createElement('div', 'recent-text');
  const openButton = createActionButton('recent-open', 'quick-view', product.id, `Quick view: ${product.name}`);

  thumbnail.appendChild(createProductImage(product));
  openButton.textContent = product.name;
  text.append(openButton, createElement('span', 'recent-price', formatPrice(product.price)));

  item.append(thumbnail, text);
  return item;
}

function renderRecentlyViewed() {
  const focusedProductId = elements.recentList.contains(document.activeElement)
    ? document.activeElement.dataset.productId
    : null;
  const products = state.recentlyViewedIds
    .map((id) => state.productsById.get(id))
    .filter(Boolean);

  elements.recentList.replaceChildren(...products.map(createRecentItem));
  elements.recentSection.hidden = products.length === 0;

  // The list was rebuilt, so give focus back to the same product's button.
  if (focusedProductId !== null) {
    [...elements.recentList.querySelectorAll('.recent-open')]
      .find((button) => button.dataset.productId === focusedProductId)
      ?.focus();
  }
}

function clearRecentlyViewed() {
  state.recentlyViewedIds = [];
  saveRecentlyViewed();
  renderRecentlyViewed();
  elements.productGrid.querySelector('button')?.focus();
}

function handleRecentClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  if (button.dataset.action === 'quick-view') {
    openQuickView(Number(button.dataset.productId), button);
  } else if (button.dataset.action === 'clear-recent') {
    clearRecentlyViewed();
  }
}

/* ---------- 11. Notifications ---------- */
function dismissToast(toast) {
  if (!toast.isConnected || toast.classList.contains('is-leaving')) return;

  toast.classList.add('is-leaving');
  setTimeout(() => toast.remove(), CONFIG.toastLeaveMs);
}

// Short message at the bottom of the screen. Errors use role="alert" so they are announced right away.
function showToast(message, type = 'success') {
  const region = elements.toastRegion;
  const toast = createElement('div', `toast toast-${type}`);
  const text = createElement('p', 'toast-message');
  const closeButton = createElement('button', 'toast-close');

  toast.dataset.message = message;
  if (type === 'error') {
    toast.setAttribute('role', 'alert');
    text.appendChild(createVisuallyHidden('Error: '));
  }
  text.append(message);

  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Dismiss notification');
  closeButton.appendChild(createIcon('icon-close'));
  toast.append(text, closeButton);

  // A repeated message replaces the old one instead of stacking, and only a few toasts stay on screen.
  [...region.children].find((existing) => existing.dataset.message === message)?.remove();
  while (region.children.length >= CONFIG.maxVisibleToasts) {
    region.firstElementChild.remove();
  }
  region.appendChild(toast);

  const duration = type === 'error' ? CONFIG.toastErrorDurationMs : CONFIG.toastDurationMs;
  const timerId = setTimeout(() => dismissToast(toast), duration);
  closeButton.addEventListener('click', () => {
    clearTimeout(timerId);
    dismissToast(toast);
  });
}

// Shown once per visit if the browser refuses to save (for example when site data is blocked).
function warnStorageUnavailable() {
  if (state.hasShownStorageWarning) return;

  state.hasShownStorageWarning = true;
  showToast(
    'Your browser blocked saving, so your cart and wishlist will reset when you leave this page.',
    'error',
  );
}

/* ---------- Header ---------- */
function updateHeaderShadow() {
  const isScrolled = window.scrollY > CONFIG.scrolledHeaderOffset;
  elements.header.classList.toggle('is-scrolled', isScrolled);
}

/* ---------- Mobile navigation ---------- */
function setMobileNavOpen(isOpen) {
  elements.primaryNav.classList.toggle('is-open', isOpen);
  elements.navToggle.setAttribute('aria-expanded', String(isOpen));
  elements.navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

function isMobileNavOpen() {
  return elements.primaryNav.classList.contains('is-open');
}

/* ---------- Search panel ---------- */
function setSearchPanelOpen(isOpen) {
  elements.searchPanel.hidden = !isOpen;
  elements.searchToggle.setAttribute('aria-expanded', String(isOpen));

  if (isOpen) {
    setMobileNavOpen(false);
    elements.searchInput.focus();
  }
}

function isSearchPanelOpen() {
  return !elements.searchPanel.hidden;
}

function applySearchQuery() {
  state.searchQuery = elements.searchInput.value.trim();
  state.currentPage = 1;
  updateShop();
}

const handleSearchInput = debounce(applySearchQuery, CONFIG.searchDebounceMs);

function handleSearchSubmit(event) {
  event.preventDefault();
  applySearchQuery();
  elements.searchInput.blur();
  elements.shopSection.scrollIntoView();
}

/* ---------- Filter panel (small screens) ---------- */
function isFiltersPanelOpen() {
  return elements.filtersPanel.classList.contains('is-open');
}

function setFiltersPanelOpen(isOpen) {
  elements.filtersPanel.classList.toggle('is-open', isOpen);
  elements.filtersToggle.setAttribute('aria-expanded', String(isOpen));
}

/* ---------- 12. Event listeners ---------- */
function handleDocumentKeydown(event) {
  const openOverlay = getOpenOverlay();

  if (event.key === 'Tab' && openOverlay) {
    trapFocus(event, openOverlay);
    return;
  }

  if (event.key !== 'Escape') return;

  if (isQuickViewOpen()) {
    closeQuickView();
  } else if (isCartDrawerOpen()) {
    closeCartDrawer();
  } else if (isSearchPanelOpen()) {
    setSearchPanelOpen(false);
    elements.searchToggle.focus();
  } else if (isMobileNavOpen()) {
    setMobileNavOpen(false);
    elements.navToggle.focus();
  }
}

function handleResize() {
  if (window.innerWidth >= CONFIG.desktopNavBreakpoint) {
    setMobileNavOpen(false);
  }
}

// Handles every "Clear all" and "Reset" button, including the one inside the empty state.
function handleDocumentClick(event) {
  const resetButton = event.target.closest('[data-action="reset-all"]');
  if (!resetButton) return;

  resetSearchAndFilters();

  // The button that was pressed may have been removed or hidden by the reset, so keyboard focus moves to the sort menu.
  if (!resetButton.isConnected || resetButton.offsetParent === null) {
    elements.sortSelect.focus();
  }
}

function handleFilterControlChange(event) {
  const { name, value, checked } = event.target;

  switch (name) {
    case 'category':
      state.filters.category = value;
      break;
    case 'minRating':
      state.filters.minRating = Number(value);
      break;
    case 'inStockOnly':
      state.filters.inStockOnly = checked;
      break;
    case 'onSaleOnly':
      state.filters.onSaleOnly = checked;
      break;
    case 'wishlistOnly':
      state.filters.wishlistOnly = checked;
      break;
    default:
      return;
  }

  state.currentPage = 1;
  updateShop();
}

// An invalid price range is never applied; the error message explains what to fix.
function handlePriceInput(event) {
  if (event.target !== elements.minPriceInput && event.target !== elements.maxPriceInput) return;

  const minimum = readPriceField(elements.minPriceInput);
  const maximum = readPriceField(elements.maxPriceInput);
  const errorMessage = getPriceRangeError(minimum, maximum);

  setPriceError(errorMessage);
  if (errorMessage) return;

  state.filters.minPrice = minimum.value;
  state.filters.maxPrice = maximum.value;
  state.currentPage = 1;
  updateShop();
}

function handleSortChange() {
  state.sortKey = elements.sortSelect.value;
  state.currentPage = 1;
  updateShop();
}

// Removing a chip redraws the list, so focus moves to the chip that took its place (or to the sort menu).
function handleChipClick(event) {
  const chip = event.target.closest('[data-filter-key]');
  if (!chip) return;

  const chipIndex = [...elements.chipList.children].indexOf(chip.parentElement);
  removeFilter(chip.dataset.filterKey);

  const remainingChips = elements.chipList.querySelectorAll('.chip');
  const target = remainingChips[Math.min(chipIndex, remainingChips.length - 1)] ?? elements.sortSelect;
  target.focus();
}

function handleCategoryCardClick(event) {
  const card = event.target.closest('.category-card');
  if (!card) return;

  // The link itself still scrolls to the catalog.
  state.filters.category = card.dataset.category;
  state.currentPage = 1;
  syncControlsFromState();
  updateShop();
}

function handlePaginationClick(event) {
  const button = event.target.closest('.page-button');
  if (!button || button.disabled) return;

  state.currentPage = Number(button.dataset.page);
  updateShop();
  elements.shopToolbar.scrollIntoView();
  elements.paginationList.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
}

function handleProductGridClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;

  const productId = Number(button.dataset.productId);

  switch (button.dataset.action) {
    case 'add-to-cart':
      if (addToCart(productId)) showAddedFeedback(button);
      break;
    case 'toggle-wishlist':
      handleWishlistToggleClick(button);
      break;
    case 'quick-view':
      openQuickView(productId, button);
      break;
    default:
      break;
  }
}

// Another tab changed saved data: reload it so every tab shows the same thing.
function handleStorageEvent(event) {
  const isAnyChange = event.key === null;

  if (isAnyChange || event.key === STORAGE_KEYS.cart) {
    state.cart = loadStoredCart();
    renderCart();
    syncAddToCartButtons();
    if (isQuickViewOpen()) updateQuickViewControls();

    if (state.drawerStep === 'checkout') {
      if (state.cart.length === 0) {
        cancelPendingOrder();
        setDrawerStep('cart');
      } else {
        renderOrderSummary(elements.checkoutItems, elements.checkoutTotals, getOrderItems());
      }
    }
  }

  if (isAnyChange || event.key === STORAGE_KEYS.wishlist) {
    state.wishlistIds = loadStoredWishlist();
    refreshWishlistUI();
  }

  if (isAnyChange || event.key === STORAGE_KEYS.recentlyViewed) {
    state.recentlyViewedIds = sanitizeStoredRecentlyViewed(readStorage(STORAGE_KEYS.recentlyViewed));
    renderRecentlyViewed();
  }
}

function registerEventListeners() {
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('storage', handleStorageEvent);
  document.addEventListener('keydown', handleDocumentKeydown);
  document.addEventListener('click', handleDocumentClick);

  elements.navToggle.addEventListener('click', () => {
    const willOpen = !isMobileNavOpen();
    if (willOpen) setSearchPanelOpen(false);
    setMobileNavOpen(willOpen);
  });

  // Close the mobile menu after choosing a destination
  elements.primaryNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMobileNavOpen(false);
  });

  elements.searchToggle.addEventListener('click', () => {
    setSearchPanelOpen(!isSearchPanelOpen());
  });

  elements.searchClose.addEventListener('click', () => {
    setSearchPanelOpen(false);
    elements.searchToggle.focus();
  });

  elements.searchInput.addEventListener('input', handleSearchInput);
  elements.searchForm.addEventListener('submit', handleSearchSubmit);

  elements.filtersToggle.addEventListener('click', () => setFiltersPanelOpen(!isFiltersPanelOpen()));
  elements.filtersForm.addEventListener('change', handleFilterControlChange);
  elements.filtersForm.addEventListener('input', handlePriceInput);
  elements.filtersForm.addEventListener('submit', (event) => event.preventDefault());

  elements.sortSelect.addEventListener('change', handleSortChange);
  elements.chipList.addEventListener('click', handleChipClick);
  elements.categoryGrid.addEventListener('click', handleCategoryCardClick);
  elements.pagination.addEventListener('click', handlePaginationClick);

  elements.productGrid.addEventListener('click', handleProductGridClick);
  elements.recentSection.addEventListener('click', handleRecentClick);
  elements.wishlistButton.addEventListener('click', handleWishlistButtonClick);
  elements.cartButton.addEventListener('click', openCartDrawer);
  elements.cartClose.addEventListener('click', () => closeCartDrawer());
  elements.cartBackdrop.addEventListener('click', () => closeCartDrawer());
  elements.cartDrawer.addEventListener('click', handleCartDrawerClick);

  elements.checkoutStep.addEventListener('submit', handleCheckoutSubmit);
  elements.checkoutStep.addEventListener('focusout', handleCheckoutFocusOut);
  elements.checkoutStep.addEventListener('input', handleCheckoutInput);

  elements.quickViewClose.addEventListener('click', () => closeQuickView());
  elements.quickViewBackdrop.addEventListener('click', () => closeQuickView());
  elements.quickView.addEventListener('click', handleQuickViewClick);
  elements.quickView.addEventListener('change', handleQuickViewChange);
}

/* ---------- 13. Initialization ---------- */
function init() {
  state.products = getValidProducts(PRODUCTS);
  state.productsById = new Map(state.products.map((product) => [product.id, product]));
  state.searchIndex = buildSearchIndex(state.products);

  elements.currentYear.textContent = new Date().getFullYear();
  elements.heroShippingPoint.textContent = getShippingOfferText();
  renderCategoryOptions();
  renderRatingOptions();
  renderSortOptions();
  syncControlsFromState();
  renderCategoryCounts(state.products);
  restoreSavedState();
  renderCart();
  renderRecentlyViewed();
  updateShop();
  updateHeaderShadow();
  registerEventListeners();
}

init();
