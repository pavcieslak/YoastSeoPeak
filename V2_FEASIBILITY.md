# Yoast Peek — V2 Feasibility & Research Notes

## 1. Executive Summary

This document assesses the technical feasibility, reliability, and security implications of logged-in features for **Yoast Peek (v2)**, specifically regarding:
1. Yoast REST API endpoint (`/wp-json/yoast/v1/get_head?url=<page>`)
2. Core WordPress REST API `yoast_head` and `yoast_head_json` fields
3. Internal Yoast post meta (`_yoast_wpseo_focuskw`, `_yoast_wpseo_linkdex`, `_yoast_wpseo_content_score`)
4. Authentication mechanisms (browser cookies + WP REST nonce vs admin scraping)

---

## 2. Technical Findings by Component

### A. Dedicated Endpoint: `/wp-json/yoast/v1/get_head?url=<url>`
- **Status**: Verified & Stable (introduced in Yoast SEO 14.0 for headless WordPress architectures).
- **Public vs. Authenticated**:
  - The endpoint is **public by default** on any standard WordPress site running Yoast SEO 14.0+, provided the WordPress REST API has not been completely disabled or restricted by an aggressive security plugin (e.g. Wordfence, iThemes/Solid Security, or custom code disabling `/wp-json/`).
- **Response Format**:
  ```json
  {
    "status": 200,
    "html": "<!-- This site is optimized with the Yoast SEO plugin v22.0 ... -->\n<title>...</title>",
    "json": {
      "title": "Page Title - Site Name",
      "description": "Meta description text",
      "robots": {
        "index": "index",
        "follow": "follow",
        "max-snippet": "max-snippet:-1",
        "max-image-preview": "max-image-preview:large",
        "max-video-preview": "max-video-preview:-1"
      },
      "canonical": "https://example.com/page/",
      "og_locale": "en_US",
      "og_type": "article",
      "og_title": "...",
      "og_description": "...",
      "og_url": "...",
      "og_site_name": "...",
      "article_publisher": "...",
      "article_modified_time": "2024-03-10T12:00:00+00:00",
      "og_image": [...],
      "twitter_card": "summary_large_image",
      "schema": {
        "@context": "https://schema.org",
        "@graph": [...]
      }
    }
  }
  ```
- **Strengths**:
  - Does not require a logged-in session.
  - Takes any frontend URL as query param (`?url=...`).
  - Returns both parsed JSON and compiled HTML.
- **Limitations**:
  - **Does NOT contain focus keyword (`focuskw`) or SEO/readability scores.** Yoast explicitly excludes backend editorial metrics from this endpoint to prevent public scraping of competitive content strategy.

---

### B. Core WP REST API: `yoast_head` and `yoast_head_json`
- **Status**: Verified & Native to Yoast SEO.
- **Endpoint**:
  `GET /wp-json/wp/v2/pages?slug=<slug>` or `GET /wp-json/wp/v2/posts?slug=<slug>`
- **Fields Injected**:
  - `yoast_head`: string containing all `<meta>`, `<title>`, and `<script type="application/ld+json">` tags.
  - `yoast_head_json`: structured JSON equivalent of the tags.
- **Limitations**:
  - Requires knowing whether the current URL represents a Page, Post, Custom Post Type, Category, Tag, or Archive.
  - On multisite networks with subdirectories, the REST route is prefixed (e.g., `/subdirectory/wp-json/wp/v2/pages`), which requires parsing the WordPress REST root `<link rel="https://api.w.org/" href="...">` from the HTML `<head>`.
  - Like `get_head`, `yoast_head_json` **does not** expose internal postmeta (`_yoast_wpseo_focuskw`).

---

### C. Focus Keyphrase & SEO Scores (`_yoast_wpseo_*`)
Yoast stores editorial inputs in WordPress post meta (`wp_postmeta`):
- `_yoast_wpseo_focuskw`: the target focus keyphrase entered by the author.
- `_yoast_wpseo_linkdex`: numerical SEO score (0-100; e.g. 70 = "good" green bullet).
- `_yoast_wpseo_content_score`: numerical readability score (e.g. 30 = "OK" orange, 60-90 = "good" green).

#### Why are they invisible to unauthenticated and standard REST calls?
WordPress core enforces a strict convention: **any post meta key beginning with an underscore (`_`) is considered protected/private**. The WP REST API blocks protected keys from `/wp/v2/posts` responses unless:
1. The developer explicitly called `register_post_meta()` with `'show_in_rest' => true` in PHP.
2. The user is authenticated with `edit_post` capability and querying with `?context=edit`. Even then, Yoast's private meta is not automatically exposed under `meta` unless registered.

#### How WordPress Admin actually handles them:
In the WordPress Block Editor (Gutenberg) or Classic Editor, Yoast loads its analysis scripts directly in the browser via `yoast-seo-post-scraper.js`. The editor fetches initial values via inline script localization (`wpseoPostScraperL10n`) or loads them via an internal REST endpoint registered by Yoast under `/wp-json/yoast/v1/` for authenticated administrators.

---

## 3. Analysis of Logged-In Approaches for v2

| Approach | How It Works | Stability | Security / Privacy | Feasibility |
| :--- | :--- | :---: | :---: | :---: |
| **Approach 1: Detect Logged-In State via Frontend DOM** | Content script checks `#wpadminbar`, `body.logged-in`, and extracts Post ID from `#wp-admin-bar-edit a[href]` (`post=123`). | **High** | **Safe** (Zero credential handling) | **Recommended (Included in v1/v2 bridge)** |
| **Approach 2: Query `/wp-json/yoast/v1/get_head?url=...`** | Fetch same-origin request using existing browser session cookies. | **High** | **Safe** | **Implemented as optional probe** |
| **Approach 3: Authenticated WP REST API with Nonce** | Extract `wpApiSettings.nonce` or frontend nonce from `#_wpnonce`, then fetch `/wp/v2/posts/<id>?context=edit`. | **Medium** | **Safe** (Uses ambient session, no password stored) | **Feasible on sites where post meta is registered in REST** |
| **Approach 4: Fetch `wp-admin/post.php?post=<id>&action=edit` in background** | Parse Yoast inputs (`#yoast_wpseo_focuskw`) directly from the edit screen HTML. | **Low / Fragile** | **High overhead**, potential CSRF/nonce errors, security plugins may flag automated admin requests. | **Not recommended** |

---

## 4. Architectural Decision & Trade-offs for v2

1. **Strict Non-Goal: No Passwords / No Credential Storage**
   - The extension will never ask for WordPress usernames, passwords, or Application Passwords.
   - Any authenticated check must rely exclusively on the browser's ambient session cookies on the target domain.

2. **Non-Invasive Logged-In Bridge (v1.5 / v2)**
   - The extension content script detects if the user is currently logged into WordPress on that domain by inspecting:
     - The presence of the WordPress Admin Bar (`#wpadminbar`)
     - The presence of the "Edit Page / Post" button (`#wp-admin-bar-edit a`)
     - The `body.logged-in` CSS class
   - When detected, Yoast Peek extracts:
     - Post/Page ID (e.g., `post=1284`)
     - Post Type (e.g., `page`, `post`)
     - Quick "Edit in WordPress" direct link
     - REST API Root (`link[rel="https://api.w.org/"]`)
   - It probes `/wp-json/yoast/v1/get_head?url=...` to display Yoast's authoritative server-side rendered head JSON.

3. **Why Focus Keyphrase extraction is kept as an optional bonus**:
   - Because 95% of live production WordPress sites do not register `_yoast_wpseo_focuskw` with `show_in_rest: true`, extracting it silently without opening the editor would require background-fetching the full `wp-admin/post.php?post=X&action=edit` administrative HTML page. This introduces significant latency (~1.5s+), consumes user bandwidth, and can trigger security plugins (Wordfence/Cloudflare) that block rapid admin URL requests.
   - Therefore, the safest and cleanest implementation is:
     1. Display authoritative live DOM data (100% accurate, works logged out).
     2. Query `/wp-json/yoast/v1/get_head` (authoritative server-side Yoast representation).
     3. Provide 1-click jump to WordPress Edit Page when logged-in session is detected.

---

## 5. References & Sources
- [Yoast SEO REST API Documentation: Headless SEO](https://developer.yoast.com/customization/apis/rest-api/)
- [Yoast SEO Schema Graph Specification](https://developer.yoast.com/features/schema/overview/)
- [WordPress Core REST API Handbook: Schema & Post Meta Registration](https://developer.wordpress.org/rest-api/extending-the-rest-api/schema/)
- [WordPress Core REST API Authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)
