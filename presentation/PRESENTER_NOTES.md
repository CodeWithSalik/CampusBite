# CampusBite — Classroom Presentation Script & Presenter Guide

**Course Code**: CSE326 Web Development  
**Academic Project**: CampusBite — Smart Canteen Ordering System  
**Presenter**: Pirzada Salik  
**Target Duration**: 7 – 10 Minutes (Includes Live Demonstration)  
**Deliverables Covered**: `presentation/CampusBite_Project_Presentation.pptx` & `CampusBite_Project_Presentation.pdf`

---

## 1. Presentation Overview & Timing Strategy

| Slide # | Slide Title | Primary Focus | Suggested Timing | Running Total |
|:---:|---|---|:---:|:---:|
| **1** | Title: CampusBite | Project identity, presenter intro, problem hook | 0:45 | 0:45 |
| **2** | The Problem | Traditional queue friction, peak-hour bottlenecks | 0:45 | 1:30 |
| **3** | Our Solution | Core value proposition, digitization pillars | 0:45 | 2:15 |
| **4** | Key Features | Student vs. Admin experiences (no vendor panel) | 0:50 | 3:05 |
| **5** | Student Experience | Visual journey: catalogue, cart, checkout | 0:50 | 3:55 |
| **6** | Order Tracking & Admin | State machine (`Placed ➔ Preparing ➔ Ready ➔ Completed`) | 0:50 | 4:45 |
| **7** | System Architecture | 3-tier architecture, pure native web stack | 0:50 | 5:35 |
| **8** | Database Design | 4 MongoDB collections (`users`, `menuItems`, `orders`, `sessions`) | 0:50 | 6:25 |
| **9** | Important Engineering Logic | Zero-trust pricing, 5% GST, ₹10 fee, idempotency, prep formula | 1:00 | 7:25 |
| **10** | Security & Testing | bcrypt, session cookies, 41/41 unit QA, 8/8 E2E, Atlas audit | 0:50 | 8:15 |
| **11** | Demonstration & Future Scope | 6-step demo sequence, roadmap (payments, WebSockets) | 0:50 | 9:05 |
| **12** | Conclusion & Q&A | Summary, compliance recap, invitation to questions | 0:35 | 9:40 |

---

## 2. Slide-by-Slide Speaking Script

---

### Slide 1: Title Slide — CampusBite: Smart Canteen Ordering System
*Visual: Food-tech styling, primary orange branding, live landing page preview card, project credentials.*

#### Verbal Script:
> "Respected faculty members and fellow classmates, good morning.
> 
> My name is **Pirzada Salik**, and today I am proud to present **CampusBite** — a Smart Canteen Ordering System engineered for our **CSE326 Web Development** course project.
> 
> Canteen dining is an everyday ritual on campus, yet during standard 15-minute lecture breaks, university canteens face severe physical congestion. CampusBite solves this by digitizing the entire dining journey: from contactless menu discovery and transparent cart management to real-time order tracking and kitchen fulfillment.
> 
> Over the next 8 minutes, I will guide you through the problem we tackled, our framework-free three-tier architecture, our live MongoDB Atlas database design, backend security and math integrity, and our verified automated testing suite. Let's begin."

---

### Slide 2: The Problem with Traditional Canteen Ordering
*Visual: 4 structured problem cards (Congestion, Friction, Visibility, Blind Spots) and Core Insight callout.*

#### Verbal Script:
> "To understand why CampusBite was needed, consider the daily reality of traditional university canteens.
> 
> Whenever classes dismiss, hundreds of students arrive at the canteen counter within a tight 10 to 15-minute window. This causes four distinct operational bottlenecks:
> 
> 1. **Peak-Hour Counter Congestion**: Physical counters are overwhelmed as students attempt to view printed menus, place verbal orders, and make payments simultaneously.
> 2. **Manual Order Friction**: Handwritten paper slips and verbal orders frequently cause communication errors, misplaced tokens, and wrong dishes prepared. In addition, physical cash change shortages constantly delay checkout registers.
> 3. **Zero Real-Time Visibility**: After paying, students wait in crowded waiting areas with zero indication of whether their food is queued, currently cooking, or ready. This creates unnecessary anxiety and causes students to crowd the counter or miss upcoming lectures.
> 4. **Administrative Blind Spots**: Canteen operators have no real-time insight into queue depth or dish demand, and cannot easily mark sold-out items without turning away customers manually.
> 
> **The core insight is clear**: the bottleneck in campus dining is not cooking speed — it is the synchronous friction of physical order placement and lack of status visibility."

---

### Slide 3: Introducing CampusBite — Smart Digital Ordering
*Visual: High-level solution pillars on the left; actual high-resolution Home / Landing page screenshot on the right.*

#### Verbal Script:
> "CampusBite introduces a modern digital transformation for university dining by decoupling order placement from counter presence.
> 
> Instead of rushing to a physical counter, students open CampusBite from any mobile phone or laptop browser. They can browse a clean, categorized menu showing live dish availability and base preparation times. They add items to their persistent cart, review an exact, transparent bill with 5% GST and campus convenience fees, and confirm their order in seconds.
> 
> Upon checkout, the system issues a unique, 6-digit order token — such as `#CB-521323`. The student can sit comfortably in the library or campus quad while tracking their order through four clear stages: Placed, Preparing, Ready, and Completed.
> 
> Meanwhile, canteen staff manage incoming orders on a centralized dashboard. They can adjust item availability with a single click, advance order statuses as meals are cooked, and monitor daily revenue streams.
> 
> As shown in the screenshot on the right, the entire experience is clean, modern, and built from scratch using native web standards."

---

### Slide 4: One Platform, Two Dedicated Experiences
*Visual: Two balanced comparison cards: Student Portal vs. Canteen Admin Portal.*

#### Verbal Script:
> "CampusBite is structured around two dedicated experiences: the Student experience and the Administrator experience.
> 
> For **students**, the platform provides a complete self-service portal:
> - They register and log in with persistent session cookies.
> - They filter across 6 distinct categories — from Burgers and Pizza to Indian Food and Beverages.
> - They manage their cart with strict quantity clamps of 1 to 20 items per dish.
> - They select between 'Cash at Counter' and 'UPI at Counter'.
> - And crucially, students can cancel an order directly from their dashboard, provided the kitchen has not yet started preparing it.
> 
> For **canteen administrators**, CampusBite functions as an operations command center:
> - An executive dashboard displays real-time KPIs: total orders, gross revenue, and active in-kitchen volume.
> - Staff manage a live kitchen queue with direct status dropdown controls.
> - They can mark counter payments as collected, which also auto-settles when an order is completed.
> - Staff can add new dishes, adjust prices, or toggle sold-out status in real time.
> 
> *A key architectural note*: CampusBite is deliberately scoped as a focused single-canteen administration system, avoiding unnecessary multi-vendor complexity."

---

### Slide 5: Student Experience: From Browsing to Ordering
*Visual: 3-step horizontal sequence with actual application screenshots (Menu Catalogue, Cart, Checkout).*

#### Verbal Script:
> "Let's walk through the actual student journey using these three screenshots captured directly from our running application:
> 
> **In Step 1: Discover**: The student browses the Menu Catalogue. They can use the instant search bar or filter by category. Each card displays food imagery, pricing, and base preparation times — such as 5 minutes for Masala Chai or 10 minutes for a Veggie Delight Burger — helping students plan their schedule.
> 
> **In Step 2: Review**: Items added to the cart are displayed with quantity controls. Look at the bill breakdown card on the right: an item subtotal of ₹434.00, exactly calculated 5% GST of ₹21.70, and our flat ₹10.00 campus convenience fee, totaling ₹465.70 with zero ambiguity.
> 
> **In Step 3: Checkout**: The student proceeds to payment. Because this is a campus canteen, payments are settled at the counter. The student selects Cash or UPI (Google Pay, PhonePe, Paytm), enters optional kitchen instructions such as 'extra spicy', and submits the order.
> 
> Notice how clean and responsive the interface looks. Every single element is styled using native CSS3 with Flexbox and CSS Grid — zero CSS frameworks or external libraries."

---

### Slide 6: Complete Order Visibility & Kitchen Workflow
*Visual: Student Tracking interface on the left, Admin Kitchen Queue on the right, State Machine flow banner on the bottom.*

#### Verbal Script:
> "Here we see how CampusBite coordinates the student and the kitchen staff simultaneously.
> 
> On the left is the student's personal **My Orders** screen. Every order receives a unique, human-readable token like `#CB-521323`. Students click 'Live Kitchen Tracking' to view a real-time progress bar. To keep the student informed, the client polls our REST API every 4.5 seconds, delivering responsive status updates without the connection overhead of WebSockets.
> 
> On the right is the **Administrator Live Kitchen Queue**. Canteen coordinators see incoming orders immediately, including student names, itemized lists, and total amounts.
> 
> At the bottom, you see our server-enforced **Finite State Machine**:
> - Orders start in **Placed**. While in Placed, students retain the right to cancel.
> - When the kitchen starts cooking, staff update the status to **Preparing**. At this exact moment, the backend permanently locks the order against cancellation.
> - When cooking finishes, the status is moved to **Ready**, alerting the student to approach the counter.
> - Finally, upon handover, the order is marked **Completed**, which automatically marks the counter payment as Paid. A Completed order is in a terminal state and cannot be reopened."

---

### Slide 7: System Architecture: Three-Tier Foundation
*Visual: Three vertical cards for Presentation, Application, and Data tiers; bottom request pipeline banner.*

#### Verbal Script:
> "Let's dive into the technical architecture. CampusBite is built on a clean three-tier web architecture that strictly adheres to the CSE326 faculty constraints:
> 
> **At Tier 1: The Presentation Layer**: We run a framework-free frontend in the client browser. We use standard HTML5 semantic elements, modern CSS3 with custom properties and responsive Grid layouts, and vanilla ECMAScript 6+ with the Fetch API. We have zero dependencies on React, Angular, Vue, Tailwind, or jQuery.
> 
> **At Tier 2: The Application Layer**: Our backend runs on Node.js with Express.js 5. We enforce defensive security using Helmet security headers, rate-limiting on sensitive authentication endpoints, and session cookies. Route handlers pass incoming requests through authentication middleware into thin controllers, which delegate business logic to isolated domain services such as `orderService` and `menuService`.
> 
> **At Tier 3: The Data Layer**: We connect directly to a cloud-hosted MongoDB Atlas cluster using the official MongoDB Node.js driver — strictly without Mongoose ODM. Session state is stored persistently in MongoDB via `connect-mongo`, ensuring authenticated sessions survive server restarts.
> 
> The banner at the bottom outlines the complete HTTP request pipeline: every endpoint returns a consistent JSON envelope with `{ success: boolean, ... }`, ensuring predictable client-side handling."

---

### Slide 8: Database Design: Collections & Document Schemas
*Visual: 2x2 grid displaying the 4 MongoDB Atlas collections (`users`, `menuItems`, `orders`, `sessions`).*

#### Verbal Script:
> "Turning to the database design: all application state is stored across four collections in MongoDB Atlas:
> 
> 1. **`users` Collection**: Stores student and admin credentials. User roles are strictly validated as either 'student' or 'admin'. To guarantee uniqueness, an indexed unique constraint is placed on the email field. Passwords are never stored in plain text; they are salted and hashed using bcrypt.
> 2. **`menuItems` Collection**: Represents our food catalogue. Documents store dish names, descriptions, prices, categories, and estimated prep times. Secondary indexes on `category` and `isAvailable` enable sub-millisecond menu queries.
> 3. **`orders` Collection**: Represents transactions. Crucially, when an order is created, we embed an immutable snapshot of the ordered items containing the dish name and price at the time of purchase. This guarantees historical financial integrity even if menu prices change later. The collection has a unique index on `orderNumber` and a sparse index on `idempotencyKey`.
> 4. **`sessions` Collection**: Maintained by `connect-mongo`. Sessions are mapped to HTTP-only cookies and feature an automatic MongoDB TTL index that cleans up expired sessions in the background."

---

### Slide 9: Engineering Beyond the Interface: Backend Integrity
*Visual: 4 engineering pillars on the left; step-by-step mathematical calculation proof on the right.*

#### Verbal Script:
> "A core tenet of senior software engineering is 'never trust the client.' In CampusBite, we implemented rigorous defensive programming:
> 
> **First, Server-Side Price Recalculation**: When a student checks out, the client submits only `menuItemId` and `quantity`. The backend fetches authoritative prices directly from MongoDB Atlas and recalculates subtotals from scratch. Any prices tampered with in browser developer tools are completely discarded.
> 
> **Second, Exact Financial Math**: On the right, you can see the mathematical proof matching our live cart screenshot:
> - Subtotal of four items = ₹434.00
> - 5% GST = ₹434.00 × 0.05 = ₹21.70
> - Fixed Campus Convenience Fee = ₹10.00
> - Exact Total Payable = ₹465.70. This math is verified by automated test assertions.
> 
> **Third, Idempotency-Based Duplicate Prevention**: Anxious students often double-click checkout buttons. Our frontend generates an idempotency key per checkout attempt. If a second submission arrives with the same key, the server returns the existing order rather than charging twice.
> 
> **Fourth, Smart Preparation Time Algorithm**:
> Estimated time equals the maximum cooking time among cart items, plus 2 minutes for each additional dish, plus 3 minutes for every active order currently cooking in the kitchen queue. We clamp this between 5 and 45 minutes to provide realistic, dynamic wait times."

---

### Slide 10: Security Architecture & Comprehensive QA Testing
*Visual: Left card listing defense-in-depth security layers; right card showing 100% passing QA test suites.*

#### Verbal Script:
> "Security and reliability were engineered into CampusBite from day one.
> 
> On the security side:
> - Passwords are protected using bcrypt with 10 salt rounds.
> - Sessions are secured with HTTP-only, SameSite cookies stored in MongoDB Atlas, preventing Cross-Site Scripting session theft.
> - Role-based authorization middleware guards all admin routes.
> - Furthermore, cross-student privacy is enforced: if Student A tries to look up or cancel Student B's order, the server blocks the request with an HTTP 403 Forbidden.
> - Sensitive login endpoints are rate-limited to 10 requests per 15 minutes.
> 
> To prove the platform is production-ready, we built three automated test suites:
> 1. **41 out of 41 Integration Tests passed** via `npm test`, verifying compliance, security headers, pricing logic, and state transitions.
> 2. **8 out of 8 End-to-End Workflows passed** via `npm run test:e2e`, verifying the complete student lifecycle from order creation to counter payment.
> 3. **8 out of 8 Live Atlas Cloud Metrics passed** via `npm run audit:atlas`, executing 13 deep verification steps including database ping, indexing, menu persistence across reconnects, and aggregation analytics."

---

### Slide 11: Live Demonstration & Architectural Roadmap
*Visual: Top card with 6-step classroom demo sequence; bottom card with planned future roadmap items.*

#### Verbal Script:
> "Now, we transition to our live system demonstration. The demonstration follows the natural lifecycle of a campus meal:
> 1. We log in as student `salik@gmail.com`.
> 2. We filter the menu catalogue and add items to our cart.
> 3. We checkout with 'Cash at Counter' and receive our unique order token.
> 4. In a second browser window, we open the Admin Kitchen Queue and advance the order from Placed to Preparing and Ready.
> 5. We watch the student's screen update in real time via polling.
> 6. Finally, staff mark the order Completed, which automatically settles the payment and updates our analytics dashboard.
> 
> Looking ahead, CampusBite has been architected for modular expansion. Our planned roadmap includes:
> - Multi-vendor stall support so individual food counters can manage their own menus.
> - Online payment gateway integration with Razorpay or UPI deep-linking.
> - WebSockets or Server-Sent Events to replace polling with instant push notifications.
> - Automated SMS alerts when food is ready for pickup.
> 
> All of these are clearly categorized as future roadmap items."

---

### Slide 12: Conclusion & Q&A
*Visual: Core achievements summary, large 'Thank You' callout, course metadata, and Q&A invitation.*

#### Verbal Script:
> "To conclude: CampusBite demonstrates how thoughtful software engineering can solve real-world campus problems.
> 
> By digitizing the dining journey, we eliminate peak-hour queue congestion, provide complete operational transparency for students and staff, and automate kitchen queue management.
> 
> Most importantly, we accomplished this while strictly adhering to our CSE326 course guidelines — demonstrating that high-performance, secure, and beautiful web applications can be built using pure web standards and modern Node.js without relying on heavy frontend frameworks.
> 
> The codebase is clean, fully documented, verified against MongoDB Atlas, and ready for deployment.
> 
> Thank you for your time and attention. I am now delighted to answer any questions from the faculty."

---

## 3. Anticipated Faculty Questions & Rock-Solid Answers (Viva Prep)

### Question 1: "Why did you choose pure Vanilla JavaScript instead of React, Vue, or Next.js?"
**Answer**:
> "First and foremost, we adhered strictly to the faculty's CSE326 course requirements, which prohibited external frontend frameworks. But from an engineering standpoint, vanilla JavaScript is ideal for this application:
> 1. **Zero Build Overhead**: There is no compilation, bundling, or Babel transpilation step. The browser executes standard ES6+ natively.
> 2. **Instant Loading**: The application payload is tiny — only pure HTML, CSS, and lightweight JS scripts — allowing it to load in milliseconds even on constrained campus Wi-Fi networks.
> 3. **Architectural Clarity**: It proves complete mastery of fundamental web standards: the native DOM API, the Fetch API, semantic HTML5, and responsive CSS Grid and Flexbox."

---

### Question 2: "Why use the official MongoDB Node.js driver directly instead of Mongoose ODM?"
**Answer**:
> "We intentionally selected the official MongoDB Node.js driver for three primary reasons:
> 1. **Performance**: Mongoose introduces overhead by wrapping every document in a heavy Mongoose Model instance. The native driver operates directly with lightweight BSON objects.
> 2. **Direct Control**: Using the native driver gave us direct control over connection pooling, atomic operators like `$set` and `$inc`, and aggregation pipelines.
> 3. **Defensive Validation**: Instead of relying on Mongoose schema middleware, we wrote dedicated validation utilities in `server/utils/dbValidators.js` and verified them through unit tests, giving us greater transparency."

---

### Question 3: "Why did you implement periodic polling instead of WebSockets for live order tracking?"
**Answer**:
> "We evaluated WebSockets during our architecture phase and chose a 4.5-second polling interval for pragmatic engineering reasons:
> 1. **Simplicity and Reliability**: Order state changes happen only a few times per order (Placed ➔ Preparing ➔ Ready ➔ Completed). A lightweight HTTP GET request every 4.5 seconds provides near-instant user feedback without the complexity of managing persistent TCP socket lifecycles, reconnection logic, or heartbeat ping-pongs.
> 2. **State & Scalability**: HTTP polling is completely stateless and works seamlessly behind reverse proxies, standard HTTP/2, and campus firewalls that often drop or block persistent WebSocket connections.
> 3. **Roadmap**: WebSockets or Server-Sent Events (SSE) remain documented as our first architectural enhancement once order volume exceeds thousands of concurrent users."

---

### Question 4: "How does the system prevent a malicious user from changing prices in the browser?"
**Answer**:
> "The system adheres strictly to the 'zero-trust client' model. When a student places an order, the frontend sends only an array containing the `menuItemId` and `quantity`. The client never sends the item price or the total bill.
> 
> In `server/services/orderService.js`, the backend intercepts the request, queries MongoDB Atlas using the item's ObjectId, retrieves the current authoritative price from the database, and recalculates the subtotal, 5% GST, and ₹10 campus fee entirely on the server. If an attacker tampers with JavaScript variables or sends a forged price payload via Postman, the server ignores the submitted price completely."

---

### Question 5: "How does the idempotency key prevent duplicate orders?"
**Answer**:
> "When the checkout page loads, the frontend generates a unique UUID-based `idempotencyKey` and attaches it to the order payload. In MongoDB, the `orders` collection has a sparse index on `idempotencyKey`.
> 
> When the checkout endpoint receives a request, it first checks if an order with that specific `idempotencyKey` already exists. If an anxious student double-clicks the 'Place Order Now' button, the second request matches the existing key and immediately returns the original order document with HTTP 200, rather than inserting a duplicate order into the database."

---

### Question 6: "How do you protect student privacy between different users?"
**Answer**:
> "We enforce ownership validation at the service level. Every order document stores the `userId` of the student who placed it.
> 
> When a request arrives at `GET /api/orders/number/:orderNumber` or `POST /api/orders/:id/cancel`, our `orderService` checks the authenticated session:
> - If `session.user.role === 'admin'`, the request is authorized.
> - If the user is a student, the service checks whether `order.userId.toString() === session.user._id.toString()`.
> - If the IDs do not match, the request is immediately rejected with an `HTTP 403 Forbidden: You do not have permission to view or modify this order.` This is verified by our automated QA test suite."

---

## 4. Live Demonstration Checklist

Before stepping up to present, ensure:
1. **Server Running**: Node.js server started on port 5000 (`npm start` or `node server.js`).
2. **MongoDB Atlas Connected**: Check console logs for `[DB] Connected to MongoDB — database: campusbite`.
3. **Student Browser Tab**: Open `http://localhost:5000/login.html` (Logged in as `salik@gmail.com`).
4. **Admin Browser Tab** (Incognito or separate window): Open `http://localhost:5000/login.html` (Logged in as `admin@campusbite.edu`).
5. **Presentation Files Open**:
   - `presentation/CampusBite_Project_Presentation.pptx` in PowerPoint Slideshow mode (`F5`).
   - `presentation/CampusBite_Project_Presentation.pdf` open in browser/Acrobat as backup.
