# Northfield Luxe — Product Requirements

This document describes the intended functionality of Northfield Luxe, an online retail storefront with a supporting admin back-office. It is written for QA engineers who need to understand expected behavior in order to design test plans, test cases, and exploratory testing charters.

## Requirement summary

| ID | Area | Requirement | Roles |
| --- | --- | --- | --- |
| REQ-1 | Accounts | Users can register, log in, log out, and manage their profile and password | Customer, Admin |
| REQ-2 | Catalog | Customers can browse, search, and filter products by category | Customer |
| REQ-3 | Product detail | Customers can view product details, choose a variant, and read reviews | Customer |
| REQ-4 | Cart | Customers can add, update quantity, and remove items from their cart | Customer |
| REQ-5 | Checkout | Customers can enter delivery details, choose shipping, apply a coupon, and place an order | Customer |
| REQ-6 | Coupons (checkout) | Coupon codes are validated live and apply a discount before order placement | Customer |
| REQ-7 | Order history | Customers can view their past and current orders and order details | Customer |
| REQ-8 | Refunds (customer) | Customers can request a refund on an eligible order | Customer |
| REQ-9 | Refunds (admin) | Admins can review, approve (issue), or deny refund requests | Admin |
| REQ-10 | Admin: products | Admins can create, edit, and delete products, including variants | Admin |
| REQ-11 | Admin: users | Admins can view, search/filter, edit, and delete user accounts | Admin |
| REQ-12 | Admin: orders | Admins can view, search/filter, and manage all customer orders | Admin |
| REQ-13 | Admin: coupons | Admins can create, edit, delete, and activate/deactivate coupons | Admin |
| REQ-14 | Access control | Admin accounts cannot shop; customers cannot access admin tools | Customer, Admin |
| REQ-15 | Search, filter, sort & pagination | All admin and customer list views support search, filtering, sorting, and configurable page size | Customer, Admin |
| REQ-16 | Theming | The site supports light and dark mode | Customer, Admin |
| REQ-17 | Environment reset | The environment can be reset to a clean, freshly-seeded state | Customer, Admin |

---

## 1. Accounts & Authentication (REQ-1)

- Visitors can **register** a new account with a name, email, and password.
- Registered users can **log in** with their email and password, and **log out** at any time.
- Logged-in users can view and update their **profile** (name, email) from an Account Settings page.
- Logged-in users can **change their password**, providing their current password plus a new password (with confirmation).
- Every account has exactly one **role**: Customer or an Admin-tier role (Support Agent, Inventory Manager, Store Admin, or Super Admin). Admin-tier roles all access the same admin portal.
- A set of accounts is pre-seeded on first launch so the app is immediately usable, including one Customer account and one Admin account.

## 2. Product Catalog (REQ-2, REQ-3)

- Customers can browse a paginated catalog of products from the storefront home page.
- Products belong to a **category** and can be **searched by name** and **filtered by category**.
- Each product has a name, description, one or more images, a base price, a customer rating, and a review count.
- A product may offer multiple **variants** (e.g. different sizes/colors), each with its own SKU, label, price, and stock level. Customers choose a variant before adding to cart.
- Product detail pages display customer **reviews** (rating + comment).

## 3. Cart (REQ-4)

- Customers can **add a product variant to their cart** in a chosen quantity.
- The cart page lists every item with its image, name, variant, quantity, and price.
- Customers can **change the quantity** or **remove** an item from the cart.
- The cart shows a running subtotal and updates immediately as items change.
- The cart persists between visits for a logged-in customer.

## 4. Checkout (REQ-5, REQ-6)

- Checkout collects the customer's **full name, email, and delivery details**.
- Customers choose a **shipping option** (standard, express, or overnight), each with a different cost and estimated delivery window. Orders above a minimum subtotal qualify for **free standard shipping**.
- An **estimated tax** is calculated and shown as a separate line item.
- Customers may optionally enter a **coupon code**. As they type, the code is **validated live** (after a short pause in typing) and, if valid, the discount is shown immediately and reflected in the order total before the order is placed.
- The order summary shows each line item with its image, a link back to the product, category/variant details, and a full price breakdown (subtotal, shipping, tax, discount, total).
- Submitting checkout **places the order** and redirects the customer to their new order's detail page.
- The checkout page also surfaces a small set of **recommended products** not already in the cart, to encourage additional purchases.

## 5. Order History & Detail (REQ-7)

- Customers can view a list of their **past and current orders**, each showing its status, date, and total.
- Customers can open an individual **order detail page** showing all line items, shipping/tax/total breakdown, and current status.
- Order status progresses through: **Placed → Processing → Shipped → Delivered**, or can end in **Cancelled**.

## 6. Refunds (REQ-8, REQ-9)

- From an eligible order (Placed, Processing, Shipped, or Delivered), a customer can **request a refund**, optionally for a partial amount.
- Requesting a refund moves the order into a distinct **"Refund requested"** status and does **not** immediately refund the customer — it queues the request for admin review.
- Admins can see all orders with a pending refund request (filterable in the admin orders list) and, from the order detail page, either:
  - **Issue the refund** (full or the requested partial amount), which finalizes the refund and updates the order status accordingly, or
  - **Deny the request**, which restores the order to its status prior to the refund request.

## 7. Admin: Product Management (REQ-10)

- Admins can view all products in a searchable, filterable, paginated table.
- Admins can **create** a new product (name, description, category, base price, images) and define its **variants** (SKU, label, price, stock).
- Admins can **edit** an existing product's details and **add, edit, or remove variants**.
- Admins can **delete** a product.

## 8. Admin: User Management (REQ-11)

- Admins can view all user accounts in a searchable, filterable (by role), paginated table.
- Admins can **edit** a user's name, email, and role.
- Admins can **delete** a user account.

## 9. Admin: Order Management (REQ-12)

- Admins can view all customer orders in a searchable, filterable (by status), paginated table.
- Admins can open any order's detail page to review its items, customer, and status, and take refund-related actions (see Section 6).

## 10. Admin: Coupon Management (REQ-13)

- Admins can view all coupons in a searchable, filterable (by active/inactive/expired), paginated table.
- Admins can **create** a coupon with a code, a discount type (percentage off, fixed amount off, or buy-one-get-one), an optional expiration date, and an active/inactive toggle.
- Admins can **edit** or **delete** an existing coupon.
- A coupon that is inactive, or whose code doesn't match, is rejected during checkout validation with a clear reason shown to the customer.

## 11. Access Control (REQ-14)

- **Admin accounts cannot use the storefront** — they cannot add items to a cart or check out, and are redirected to the admin portal instead.
- **Customer accounts cannot access admin pages** (product, user, order, or coupon management).
- Unauthenticated visitors are prompted to log in before checking out.

## 12. Search, Filter, Sort & Pagination (REQ-15)

- Every list view in the app (storefront products, customer orders, and all admin tables) supports:
  - A **search box** for free-text filtering relevant to that list (name, email, code, etc.).
  - One or more **filter dropdowns** relevant to that list (category, role, status, etc.).
  - **Column sorting** where applicable.
  - **Pagination**, with the user able to **change the number of items shown per page**.

## 13. Theming (REQ-16)

- The entire application supports both **light and dark mode**, toggled from the navigation bar, and the choice persists across visits.

## 14. Environment Reset (REQ-17)

- Because Northfield Luxe runs entirely in the browser, the app **seeds a full sample dataset automatically the first time it is launched**.
- Users can trigger a **full environment reset** from the "About this site" dialog (accessible via the info icon in the navigation bar), which clears all data and reseeds a fresh baseline — useful for starting a test pass from a known, clean state.
