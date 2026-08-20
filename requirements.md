# Northfield Luxe — Product Requirements

This document describes the intended functionality of Northfield Luxe, an online retail storefront with a supporting admin back-office. It is written for QA engineers who need to understand expected behavior in order to design test plans, test cases, and exploratory testing charters.

## Requirement summary

| ID | Area | Requirement | Roles |
| --- | --- | --- | --- |
| [REQ-1](#req-1-registration-login--logout) | Accounts | Visitors can register, log in, and log out | Customer, Admin |
| [REQ-2](#req-2-profile--password-management) | Accounts | Logged-in users can manage their profile and password | Customer, Admin |
| [REQ-3](#req-3-product-browsing-search--filtering) | Catalog | Customers can browse, search, and filter products by category | Customer |
| [REQ-4](#req-4-product-detail--variants) | Catalog | Customers can view product details and choose a variant | Customer |
| [REQ-5](#req-5-product-reviews) | Catalog | Customers can read product reviews and ratings | Customer |
| [REQ-6](#req-6-cart-management) | Cart | Customers can add, update quantity, and remove items from their cart | Customer |
| [REQ-7](#req-7-checkout-details--shipping) | Checkout | Customers can enter delivery details and choose a shipping option | Customer |
| [REQ-8](#req-8-order-summary--pricing) | Checkout | The order summary shows a full, itemized price breakdown | Customer |
| [REQ-9](#req-9-live-coupon-validation-at-checkout) | Checkout | Coupon codes are validated live and apply a discount before order placement | Customer |
| [REQ-10](#req-10-placing-an-order) | Checkout | Customers can place an order and are taken to its confirmation/detail page | Customer |
| [REQ-11](#req-11-checkout-upsell-recommendations) | Checkout | Checkout surfaces recommended products to encourage additional purchases | Customer |
| [REQ-12](#req-12-order-history) | Orders | Customers can view a list of their past and current orders | Customer |
| [REQ-13](#req-13-order-detail--status-tracking) | Orders | Customers can view full order detail and track its status | Customer |
| [REQ-14](#req-14-customer-refund-requests) | Refunds | Customers can request a full or partial refund on an eligible order | Customer |
| [REQ-15](#req-15-admin-refund-review) | Refunds | Admins can review, issue, or deny pending refund requests | Admin |
| [REQ-16](#req-16-admin-product-catalog-management) | Admin | Admins can create, edit, and delete products | Admin |
| [REQ-17](#req-17-admin-product-variant-management) | Admin | Admins can create, edit, and delete product variants | Admin |
| [REQ-18](#req-18-admin-user-management) | Admin | Admins can view, edit, and delete user accounts | Admin |
| [REQ-19](#req-19-admin-order-management) | Admin | Admins can view and manage all customer orders | Admin |
| [REQ-20](#req-20-admin-coupon-management) | Admin | Admins can create, edit, delete, and activate/deactivate coupons | Admin |
| [REQ-21](#req-21-role-based-access-control) | Access | Admin accounts cannot shop; customers cannot access admin tools | Customer, Admin |
| [REQ-22](#req-22-search-filter-sort--pagination) | Platform | All list views support search, filtering, sorting, and configurable page size | Customer, Admin |
| [REQ-23](#req-23-light--dark-theming) | Platform | The site supports light and dark mode | Customer, Admin |
| [REQ-24](#req-24-first-launch-seeding) | Platform | A full sample dataset is seeded automatically on first launch | Customer, Admin |
| [REQ-25](#req-25-environment-reset) | Platform | The environment can be reset to a clean, freshly-seeded state on demand | Customer, Admin |

---

## Accounts & Authentication

### REQ-1: Registration, login & logout

- Visitors can **register** a new account by providing a name, email address, and password.
- Registration validates that the email is well-formed and not already in use, and that the password meets the site's minimum requirements.
- Registered users can **log in** with their email and password from the login page.
- Logged-in users can **log out** at any time from the navigation bar, ending their session.
- Unauthenticated visitors who attempt to check out are redirected to the login page first, then returned to complete their purchase.
- The login page lists the pre-seeded sample accounts (email, password, and role) so a QA can log in immediately without registering a new account; clicking a listed account fills in its credentials.

### REQ-2: Profile & password management

- Logged-in users have an **Account Settings** page with two independent sections: Profile and Password.
- In the **Profile** section, users can update their **name** and **email address** and save the change independently of the password section.
- In the **Password** section, users can change their password by providing their **current password**, a **new password**, and a **confirmation** of the new password.
- Each section shows its own success or error feedback (e.g. a toast notification) without affecting the other section's fields or state.
- Every account has exactly one **role**: Customer, or one of the Admin-tier roles (Support Agent, Inventory Manager, Store Admin, Super Admin). All Admin-tier roles use the same admin portal.

## Product Catalog

### REQ-3: Product browsing, search & filtering

- Customers can browse a **paginated catalog** of products from the storefront home page.
- Products are organized into **categories**, and customers can **filter the catalog by category**.
- Customers can **search products by name** using a search box; results update to match the query.
- Search and category filters can be combined, and both interact correctly with pagination (e.g. changing a filter returns to page 1).
- Each product card shows its image, name, category, price, and average rating at a glance.

### REQ-4: Product detail & variants

- Each product has a detail page showing its name, description, one or more images, base price, average rating, and review count.
- A product may offer multiple **variants** (for example, different sizes or colors), each with its own SKU, label, price, and stock level.
- Customers must select a variant before the product can be added to the cart; the displayed price and stock availability update to match the selected variant.
- If a variant is out of stock, this is indicated to the customer and it cannot be added to the cart.

### REQ-5: Product reviews

- Product detail pages display customer **reviews**, each including a star rating and a written comment.
- The product's aggregate **average rating** and **review count** shown on the catalog and detail pages reflect its reviews.

## Shopping Cart

### REQ-6: Cart management

- Customers can **add a product variant to their cart** in a quantity of their choosing from the product detail page.
- The cart page lists every item with its product image, name, selected variant, unit price, quantity, and line total.
- Customers can **increase or decrease the quantity** of any cart line, or **remove** the item entirely.
- The cart shows a running **subtotal** that updates immediately whenever an item, quantity, or removal changes.
- The cart is tied to the logged-in customer's account and **persists between visits and sessions**.
- An empty cart is clearly indicated, with a path back to the catalog to continue shopping.

## Checkout

### REQ-7: Checkout details & shipping

- Checkout collects the customer's **full name, email address, and delivery address details**.
- Customers choose one of three **shipping options** — Standard, Express, or Overnight — each with its own cost and estimated delivery window, shown side by side for comparison.
- Orders whose subtotal meets a minimum threshold automatically qualify for **free standard shipping**, and this is communicated to the customer during checkout.

### REQ-8: Order summary & pricing

- The checkout order summary lists every cart line with its product image, a link back to the product page, and its category/variant details.
- The summary shows a complete price breakdown: **subtotal**, **shipping cost**, **estimated tax**, **discount** (if a coupon is applied), and **grand total**.
- The estimated tax is calculated from the order subtotal and displayed as its own line item, not bundled into another figure.
- All monetary values in the summary update immediately as the cart, shipping option, or coupon changes — the customer never has to refresh to see current totals.

### REQ-9: Live coupon validation at checkout

- Checkout includes an optional **coupon code** field.
- As the customer types a code, it is **validated automatically after a brief pause** (the customer does not need to click a separate "apply" button first to see validation feedback).
- While validation is in progress, the field shows a clear "checking…" indicator.
- A **valid** code shows a success indicator and immediately reflects its discount in the order summary and grand total.
- An **invalid, inactive, or expired** code shows a clear inline error explaining why it was rejected, and no discount is applied.
- Supported discount types are: a **percentage off** the subtotal, a **fixed amount off**, and **buy-one-get-one (BOGO)** promotions.
- The applied discount remains in effect through order placement, and the final order records the discount that was applied.

### REQ-10: Placing an order

- Submitting the checkout form with valid details **places the order**, converting the cart into an order and clearing the cart.
- After placing an order, the customer is taken directly to that **order's detail page** so they can confirm what was ordered and its status.
- Required fields are validated before submission, with clear inline messages for anything missing or invalid.

### REQ-11: Checkout upsell recommendations

- The checkout page shows a small set of **recommended products** that are not already in the customer's cart, to encourage additional purchases before completing the order.
- Recommended products link through to their own product detail pages and can be added to the cart without leaving checkout.

## Order Management (Customer)

### REQ-12: Order history

- Customers can view a **list of their own past and current orders**, most recent first.
- Each entry in the list shows the order's date, current status, and total amount.
- The order list supports the standard search/filter/pagination behavior described in [REQ-22](#req-22-search-filter-sort--pagination).

### REQ-13: Order detail & status tracking

- Customers can open any of their orders to see a full **order detail page**: every line item (product, variant, quantity, price), plus the shipping, tax, discount, and total breakdown.
- The order detail page shows the order's **current status**, which progresses through: **Placed → Processing → Shipped → Delivered**, or may end in **Cancelled**.
- From an eligible order's detail page, the customer can initiate a refund request (see [REQ-14](#req-14-customer-refund-requests)).

## Refunds

### REQ-14: Customer refund requests

- From an order in an eligible status (Placed, Processing, Shipped, or Delivered), a customer can **request a refund**.
- The customer can request a **full refund** or specify a **partial amount** to refund.
- Submitting a refund request moves the order into a distinct **"Refund requested"** status; it does **not** refund the customer immediately — it queues the request for admin review.
- The customer can see that their order is awaiting refund review from their order history and order detail page.

### REQ-15: Admin refund review

- Admins can filter the admin orders list to show only orders with a **pending refund request**.
- From a pending order's detail page, an admin can:
  - **Issue the refund** — for the full order amount or the specific partial amount that was requested — which finalizes the refund and updates the order's status to reflect that it was refunded (fully or partially).
  - **Deny the request** — which returns the order to the status it held before the refund was requested, with no refund issued.
- The admin's decision (issued or denied) is reflected immediately in both the admin order view and the customer's own order detail page.

## Admin: Catalog Management

### REQ-16: Admin product catalog management

- Admins can view all products in a **searchable, filterable, sortable, paginated** table.
- Admins can **create a new product**, specifying its name, description, category, base price, and one or more images.
- Admins can **edit** any existing product's name, description, category, price, and images.
- Admins can **delete** a product from the catalog.

### REQ-17: Admin product variant management

- From a product's admin edit view, admins can **add one or more variants**, each with its own SKU, label (e.g. size/color), price, and stock quantity.
- Admins can **edit** an existing variant's label, price, or stock level.
- Admins can **remove** a variant from a product.
- Stock levels set here directly determine whether a variant is purchasable by customers (see [REQ-4](#req-4-product-detail--variants)).

## Admin: User Management

### REQ-18: Admin user management

- Admins can view all registered accounts in a **searchable (by name/email), filterable (by role), paginated** table.
- Admins can **edit** any user's name, email address, and role.
- Admins can **delete** a user account.

## Admin: Order Management

### REQ-19: Admin order management

- Admins can view **every customer order** in a **searchable, filterable (by status), paginated** table.
- Admins can open any order to view its full detail: customer, line items, pricing breakdown, and status history.
- From this view, admins can carry out refund review actions as described in [REQ-15](#req-15-admin-refund-review).

## Admin: Promotions

### REQ-20: Admin coupon management

- Admins can view all coupons in a **searchable, filterable (Active / Inactive / Expired), paginated** table.
- Admins can **create a coupon** with: a unique code, a discount type (percentage off, fixed amount off, or BOGO), the discount value, an optional expiration date, and an active/inactive toggle.
- Admins can **edit** an existing coupon's code, type, value, expiration, or active status.
- Admins can **delete** a coupon.
- A coupon that is inactive, expired, or does not match any code entered at checkout is rejected by the live validation described in [REQ-9](#req-9-live-coupon-validation-at-checkout), with the reason shown to the customer.

## Access Control

### REQ-21: Role-based access control

- **Admin-tier accounts cannot use the storefront** — they cannot browse to add items to a cart or complete checkout, and are redirected to the admin portal instead.
- **Customer accounts cannot access any admin page** (product, user, order, or coupon management); attempting to do so redirects them away from the admin area.
- Checking out requires an authenticated customer session; unauthenticated visitors are prompted to log in first.

## Platform Behavior

### REQ-22: Search, filter, sort & pagination

- Every list view in the application — the storefront catalog, the customer's order history, and every admin management table — provides:
  - A **search box** for free-text filtering appropriate to that list (e.g. product name, user name/email, coupon code).
  - One or more **filter controls** appropriate to that list (e.g. category, role, order status, coupon status).
  - **Column sorting** where the table supports it.
  - **Pagination controls**, including the ability to **change how many items are shown per page**.
- Search, filters, sorting, and pagination all interact correctly together (e.g. applying a new filter or search term returns the list to the first page).

### REQ-23: Light & dark theming

- The entire application — storefront and admin portal alike — supports both **light mode** and **dark mode**.
- The theme can be toggled from the navigation bar and the chosen theme **persists** across page loads and future visits.
- All pages, components, and states (including dialogs, tables, and forms) render correctly and legibly in both themes.

### REQ-24: First-launch seeding

- Because Northfield Luxe runs entirely client-side, the very **first time the app is launched** in a browser it automatically **seeds a complete sample dataset**: products, categories, variants, reviews, users (including sample Customer and Admin accounts), orders, and coupons.
- Seeding happens once automatically; subsequent launches use the existing data without re-seeding or duplicating it.

### REQ-25: Environment reset

- Users can trigger a **full environment reset** from the "About this site" dialog, opened via the info icon in the navigation bar.
- Reset requires an explicit confirmation step before proceeding, since it is destructive.
- Confirming the reset **clears all data** (products, orders, users, coupons, and the current session) and then **reseeds a fresh baseline dataset**, equivalent to the state produced by [REQ-24](#req-24-first-launch-seeding).
- After a reset, the user is returned to the login page to begin a new session against the freshly-seeded data.
