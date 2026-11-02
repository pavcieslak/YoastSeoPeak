# Yoast Peek — Architecture & Technical Plan

## 1. Goal & Operating Model
**Yoast Peek** is a Chrome extension (Manifest V3) running inside Chrome's native Side Panel (`chrome.sidePanel`). It provides an instantaneous SEO and schema audit of any WordPress page running Yoast SEO (and detects other SEO plugins like Rank Math, AIOSEO, or non-WP sites) without opening the WordPress editor or navigating away from the live page.

---

## 2. Checked Facts: Logged-Out vs. Logged-In Capabilities

| Feature / Data Point | Logged-Out (v1) | Logged-In (v2) | Verification / Ground Truth |
| :--- | :---: | :---: | :--- |
| **Yoast Plugin Detection & Version** | **Yes** | **Yes** | Present in HTML comments (`<!-- This site is optimized with the Yoast SEO plugin vX.X.X ... -->`) and `<script class="yoast-schema-graph">`. |
| **Live DOM SEO Tags** (`<title>`, length, px width, `meta description`, `canonical`, `robots`) | **Yes** | **Yes** | Read directly from the active tab DOM via content script. |
| **Open Graph & Twitter Cards** | **Yes** | **Yes** | Parsed directly from `<meta property="og:...">` and `<meta name="twitter:...">`. |
| **Hreflang & Multisite Language Links** | **Yes** | **Yes** | Read from `<link rel="alternate" hreflang="...">` and `<html lang="...">`. Sub-paths and localized directories handled naturally. |
| **Headings Outline & H1 Count** | **Yes** | **Yes** | Traversed from live DOM (`h1` through `h6`) with hierarchy skip detection. |
| **Yoast JSON-LD Schema Graph** | **Yes** | **Yes** | Parsed from `<script type="application/ld+json" class="yoast-schema-graph">` (`@graph` array). |
| **Google SERP Snippet Preview** | **Yes** | **Yes** | Rendered with desktop (~580px limit) and mobile card styling with pixel-accurate title width. |
| **Server vs. DOM Diff & `X-Robots-Tag`** | **Yes** | **Yes** | Fresh HTTP `fetch(url, { cache: 'no-store' })` compared against live DOM; headers parsed. |
| **Yoast Headless REST API** (`/wp-json/yoast/v1/get_head?url=...`) | **Public on many sites** (if REST API open) | **Yes** | Yoast v14+ standalone endpoint. Returns `{ status, json, html }`. Public unless site administrator disables REST API. |
| **Core WP REST API** (`yoast_head` / `yoast_head_json`) | **Public on many sites** | **Yes** | Injected into `/wp-json/wp/v2/pages` and `/posts`. Can be disabled or restricted by security plugins. |
| **Focus Keyphrase** (`_yoast_wpseo_focuskw`) | **No** | **Conditional / Fragile** | Stored in `wp_postmeta`. In WordPress, meta keys starting with `_` are **protected** and hidden from the public REST API by default. Only exposed if site registers `show_in_rest: true` or through an authenticated editor session. |
| **SEO & Readability Scores** (`_yoast_wpseo_linkdex`, `_yoast_wpseo_content_score`) | **No** | **Conditional / Fragile** | Internal post meta scores. Never sent in public frontend HTML or `yoast_head_json`. Accessible only when logged in as author/editor with nonce. |

---

## 3. High-Level Architecture (v1)

- **Manifest V3 (`manifest.json`)**:
  - `sidePanel` permission and `default_path: "sidepanel/sidepanel.html"`.
  - `activeTab` and `scripting` for lightweight DOM extraction.
  - `<all_urls>` host permissions to allow fetching server HTML and headers (`X-Robots-Tag`).
  - Zero telemetry, zero external network dependencies, 100% local processing.

- **Background Service Worker (`background.js`)**:
  - Configures side panel behavior (`openPanelOnActionClick: true`).
  - Monitors active tab switches (`tabs.onActivated`) and page reloads (`tabs.onUpdated`) to send refresh notifications to the side panel.

- **Content Script (`content.js`)**:
  - Comment scanner via `TreeWalker` / `NodeFilter.SHOW_COMMENT` to detect Yoast, Rank Math, AIOSEO, SEOPress, and The SEO Framework.
  - Title pixel width measurement using `<canvas>` with Google SERP font metrics (`20px Roboto, Arial`).
  - Yoast Schema JSON-LD extractor (`class="yoast-schema-graph"` and general JSON-LD fallback).
  - Heading tree extractor (`h1-h6`) with hierarchy jump validation.
  - Detection of multisite language sub-paths and logged-in cues (`#wpadminbar`, post edit links).

- **Side Panel UI (`sidepanel/`)**:
  - Clean, modern, responsive layout designed for side panel width (320px–500px).
  - Light and Dark mode (auto system preference or manual toggle).
  - Tabs:
    - **Overview**: Status pill (Yoast / Rank Math / Non-WP), Title & pixel width, Meta Description, Canonical, Robots, Hreflang.
    - **Headings**: H1 checks + nested heading outline with jump alerts.
    - **Social**: Open Graph & Twitter card previews.
    - **Schema**: Readable entity breakdown (WebSite, WebPage, Organization, Person, Breadcrumb) + raw JSON tree.
    - **SERP Preview**: Desktop and Mobile Google snippet simulator.
    - **DOM vs Server**: Live DOM vs fresh server HTML diff + `X-Robots-Tag`.
    - **WP / Yoast v2**: Inspection of Yoast REST API endpoint (`get_head`) and logged-in metadata status.
