# Law Helper – Legal Assistance Platform (Frontend)

Static, multi-page, responsive frontend built with HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons and vanilla ES6+ JavaScript.
No framework and no backend. Open `index.html` in a browser, or serve the folder (`python3 -m http.server`).

## Demo entry points
- Public site: `index.html` · `find-lawyer.html` · `lawyer-details.html` · `legal-posts.html` · `post-details.html` · `about.html` · `contact.html` · `login.html` · `register.html` (choose "Lawyer" for the lawyer form)
- User panel: `user/dashboard.html`
- Lawyer panel: `lawyer/dashboard.html`
- Admin panel: `admin/dashboard.html`
(The login page has demo links to all three panels.)

## Structure
- `assets/css/style.css` – design system (CSS variables for colours, type, spacing; components; dark mode; responsive rules)
- `assets/js/main.js` – all interactions, wired through `data-*` attributes (no inline JS)
- `assets/css/bootstrap*.css`, `assets/js/bootstrap.bundle.min.js`, `assets/js/chart.umd.min.js` – local vendor copies
- Fonts: Plus Jakarta Sans (UI), Playfair Display (legal headings) and Hind Siliguri (Bangla) load from Google Fonts; system fonts are the fallback.

## Backend-ready conventions
- Tables use `<tr data-row data-status="…">`; list pages use `data-list`, `data-filter-for`, `data-pager-for`. Replace with server-rendered rows or API data.
- Forms carry `name` attributes and `class="needs-validation"`; `data-handler` / `data-toast` mark the demo behaviour to replace with `fetch()` calls.
- Countdown reads `data-countdown="2026-10-15T10:30:00+06:00"`.

## Demo notes
- Demo "today" is 08 Oct 2026; countdowns and "days remaining" use the visitor's real clock.
- Dark/light mode toggle is in the navbar (saved in localStorage).
- All data is mock Bangladeshi sample data (BDT ৳, DD MMM YYYY).

## Language switcher (Google Translate)
- Dropdown with flag icons in the top bar of every page: বাংলা, English, 日本語, 中文, العربية (flags are local SVGs in `assets/images/flags/`).
- Uses the free Google Translate website widget, loaded only when a non-English language is chosen. It needs an internet connection; the choice is remembered in localStorage. Arabic switches the page to right-to-left.
- Elements marked `translate="no"` / `notranslate` (the switcher itself) are not translated.

## Interactive highlights
- Home: count-up numbers, reminder-date calculator, feature showcase tabs, auto-advancing "how it works" stepper, featured-lawyer slider, review slider with client/lawyer filter, FAQ search.
- Find a Lawyer: live filters with removable chips, fee slider, grid/list view, save (heart), quick-view modal, sorting, pagination.
- Lawyer profile: booking widget (type → live fee, date strip, time slots), rating filter, helpful votes, write-a-review, follow, similar lawyers.
- Panels: collapsible sidebar, global search (`/` or Ctrl+K), sortable table columns, live notification, dark mode, tooltips.

## Responsive behaviour
- Verified on every page at 320, 375, 414, 600, 768, 1024, 1366 and 1920 px: no horizontal overflow, no JS errors.
- Home lawyer slider: 3 cards on desktop, 2 on tablet, 1 (with a peek of the next) on phones. Lawyer profile "Similar lawyers": 2 cards (1 on phones).
- Tables become stacked cards on phones; panels use a slide-in sidebar and bottom navigation under 992 px; large dialogs go full-screen on phones.
