# ShopSphere

A front-end demo storefront built with **HTML5, CSS3 and vanilla JavaScript**. No frameworks, no build step, no backend.

ShopSphere shows how a modern online shop can look and behave: browsing, searching, filtering, a cart, a wishlist, a quick view and a simulated checkout. Everything runs in the browser.

> **This is a demo.** All products, prices, ratings and reviews are fictional sample data. There are no accounts and no real payments. Orders placed in the checkout are simulated only, and the name and email typed into the demo checkout are never saved or sent anywhere.

## Features

**Browsing**
- 20 sample products across 5 categories (Electronics, Fashion, Home & Living, Accessories, Lifestyle)
- Live search across name, description, category and tags
- Filters: category, price range, minimum rating, in stock, on sale, saved items
- Sorting: featured, newest, price, rating, name
- Active filter chips, result count and pagination
- Sale badges, low-stock and sold-out states

**Shopping**
- Quick view dialog with specifications, variant selection (size, color and more) and quantity
- Cart drawer with quantity controls, stock limits and subtotal
- Free-shipping progress bar (a demonstration rule only)
- Wishlist with a saved-items view
- Recently viewed products
- Demo checkout with form validation and a simulated order confirmation

**Persistence**
- Cart, wishlist and recently viewed items are kept in `localStorage`
- Stored data is checked and repaired when the page loads
- Changes made in one browser tab appear in other open tabs

**Quality**
- Keyboard-friendly: skip link, focus trapping in dialogs, focus returned to the opener, Escape to close
- Screen reader support: labelled controls, live regions, `aria-pressed` states, accessible names for icon buttons
- Responsive from small phones to wide desktops
- Respects `prefers-reduced-motion`
- Safe rendering: text is always set with `textContent`, never as HTML
- Image fallbacks: a category placeholder is shown if a photo is missing or fails to load

## Project structure

```
shopsphere/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── images/        product illustrations (see below)
```

## Run it

1. Download or clone the project.
2. Open `index.html` in a browser. That is all.

No installation or server is needed. For live reload while editing, any simple local server works, for example the Live Server extension in VS Code.

## Product images

Some products use Unsplash photos through a link. The rest use small illustrations (SVG files) stored in `assets/images/`, so they load instantly and need no download. If a local file is missing, the card shows a category placeholder instead.

To use your own photo instead, put it in `assets/images/` and edit the product in the `PRODUCTS` list in `script.js`:

```js
image: 'assets/images/yoga-mat.jpg',
imageAlt: 'Rolled yoga mat on a studio floor',
```

Tips:
- Use a 4:5 image (for example 960 x 1200 px).
- Keep each file small, ideally under 150 KB (JPG or WebP).
- Write an `imageAlt` that describes the actual photo.

## Customising

The top of `script.js` has a `CONFIG` object for things like the currency, page size, free-shipping amount and toast timing. Set `freeShippingThreshold` to `0` to turn the shipping progress bar off. Colors, fonts and spacing are CSS variables at the top of `style.css`.

## Build phases

The project was built step by step in ten phases:

1. Page shell, navigation and search panel
2. Product data and card rendering
3. Search, filters, sorting and pagination
4. Cart, cart drawer and storage
5. Wishlist
6. Quick view, specifications and variants
7. Toasts, free-shipping progress and recently viewed
8. Demo checkout and order confirmation
9. Accessibility, responsive and edge-case fixes
10. Final polish and documentation

## Credits

- Designed and developed by **Liaqat Alikhan**, WordPress Web Designer & Developer: [wpkhan.com](https://wpkhan.com)
- Product photos from [Unsplash](https://unsplash.com), used under the Unsplash License.

## License

This project is a portfolio demo. Add a license of your choice (for example MIT) before sharing the code for reuse.
