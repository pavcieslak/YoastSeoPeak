/**
 * Yoast Peek - Side Panel Controller
 */

(function () {
  'use strict';

  // Application State
  let currentAuditData = null;
  let currentActiveTab = null;
  let freshServerData = null;

  // DOM Elements
  const els = {
    // Top Bar
    pluginBadge: document.getElementById('plugin-badge'),
    pageUrl: document.getElementById('page-url'),
    badgeIndex: document.getElementById('badge-index'),
    badgeCanonical: document.getElementById('badge-canonical'),
    badgeH1: document.getElementById('badge-h1'),
    badgeLang: document.getElementById('badge-lang'),
    badgeWpUser: document.getElementById('badge-wp-user'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnRefresh: document.getElementById('btn-refresh'),

    // Export Chips
    btnCopyTitle: document.getElementById('btn-copy-title'),
    btnCopyDesc: document.getElementById('btn-copy-desc'),
    btnCopyCanonical: document.getElementById('btn-copy-canonical'),
    btnCopyJson: document.getElementById('btn-copy-json'),
    btnCopyCsv: document.getElementById('btn-copy-csv'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Overview Tab
    valPluginName: document.getElementById('val-plugin-name'),
    rowYoastComment: document.getElementById('row-yoast-comment'),
    valYoastComment: document.getElementById('val-yoast-comment'),
    rowMultisitePath: document.getElementById('row-multisite-path'),
    valMultisitePath: document.getElementById('val-multisite-path'),
    rowWpVersion: document.getElementById('row-wp-version'),
    valWpVersion: document.getElementById('val-wp-version'),

    valTitleText: document.getElementById('val-title-text'),
    titleCharCount: document.getElementById('title-char-count'),
    titlePxCount: document.getElementById('title-px-count'),
    meterTitlePx: document.getElementById('meter-title-px'),
    titleAlerts: document.getElementById('title-alerts'),

    valDescText: document.getElementById('val-desc-text'),
    descCharCount: document.getElementById('desc-char-count'),
    meterDescChar: document.getElementById('meter-desc-char'),
    descAlerts: document.getElementById('desc-alerts'),

    valCanonicalUrl: document.getElementById('val-canonical-url'),
    canonicalAlerts: document.getElementById('canonical-alerts'),

    valRobotsContent: document.getElementById('val-robots-content'),
    rowGooglebot: document.getElementById('row-googlebot'),
    valGooglebotContent: document.getElementById('val-googlebot-content'),
    robotsAlerts: document.getElementById('robots-alerts'),

    valHtmlLang: document.getElementById('val-html-lang'),
    hreflangCount: document.getElementById('hreflang-count'),
    hreflangList: document.getElementById('hreflang-list'),

    // SERP Preview Tab
    btnSerpDesktop: document.getElementById('btn-serp-desktop'),
    btnSerpMobile: document.getElementById('btn-serp-mobile'),
    serpPreviewBox: document.getElementById('serp-preview-box'),
    serpFav: document.getElementById('serp-fav'),
    serpSiteName: document.getElementById('serp-site-name'),
    serpUrlBreadcrumb: document.getElementById('serp-url-breadcrumb'),
    serpTitleDisplay: document.getElementById('serp-title-display'),
    serpDescDisplay: document.getElementById('serp-desc-display'),

    // Headings Tab
    h1Badge: document.getElementById('h1-badge'),
    h1List: document.getElementById('h1-list'),
    statH1: document.getElementById('stat-h1'),
    statH2: document.getElementById('stat-h2'),
    statH3: document.getElementById('stat-h3'),
    statH4: document.getElementById('stat-h4'),
    statH5: document.getElementById('stat-h5'),
    statH6: document.getElementById('stat-h6'),
    statTotalHeadings: document.getElementById('stat-total-headings'),
    headingsTree: document.getElementById('headings-tree'),
    headingHierarchyAlerts: document.getElementById('heading-hierarchy-alerts'),

    // Social Tab
    ogPreviewImg: document.getElementById('og-preview-img'),
    ogPreviewImgWrap: document.getElementById('og-preview-img-wrap'),
    ogNoImg: document.getElementById('og-no-img'),
    ogPreviewDomain: document.getElementById('og-preview-domain'),
    ogPreviewTitle: document.getElementById('og-preview-title'),
    ogPreviewDesc: document.getElementById('og-preview-desc'),
    tableOgTags: document.getElementById('table-og-tags'),
    tableTwitterTags: document.getElementById('table-twitter-tags'),

    // Schema Tab
    badgeSchemaStatus: document.getElementById('badge-schema-status'),
    schemaTypesList: document.getElementById('schema-types-list'),
    rawSchemaCode: document.getElementById('raw-schema-code'),
    btnCopySchema: document.getElementById('btn-copy-schema'),

    entityWebpage: document.getElementById('entity-webpage'),
    entityWebpageContent: document.getElementById('entity-webpage-content'),
    entityWebsite: document.getElementById('entity-website'),
    entityWebsiteContent: document.getElementById('entity-website-content'),
    entityOrg: document.getElementById('entity-org'),
    entityOrgContent: document.getElementById('entity-org-content'),
    entityBreadcrumbs: document.getElementById('entity-breadcrumbs'),
    entityBreadcrumbsContent: document.getElementById('entity-breadcrumbs-content'),
    entityAuthor: document.getElementById('entity-author'),
    entityAuthorContent: document.getElementById('entity-author-content'),
    entityArticle: document.getElementById('entity-article'),
    entityArticleContent: document.getElementById('entity-article-content'),

    // DOM vs Server Diff Tab
    btnFetchFresh: document.getElementById('btn-fetch-fresh'),
    serverStatusBar: document.getElementById('server-status-bar'),
    serverHttpStatus: document.getElementById('server-http-status'),
    serverXRobots: document.getElementById('server-x-robots'),
    diffTbody: document.getElementById('diff-tbody'),
    diffSummaryAlert: document.getElementById('diff-summary-alert'),

    // WP / V2 Tab
    v2SessionStatus: document.getElementById('v2-session-status'),
    v2PostRow: document.getElementById('v2-post-row'),
    v2PostId: document.getElementById('v2-post-id'),
    v2EditLinkRow: document.getElementById('v2-edit-link-row'),
    v2EditLink: document.getElementById('v2-edit-link'),
    btnProbeYoastRest: document.getElementById('btn-probe-yoast-rest'),
    yoastRestResult: document.getElementById('yoast-rest-result'),

    // Toast
    toast: document.getElementById('toast')
  };

  /**
   * Toast Notification Helper
   */
  function showToast(text) {
    if (!els.toast) return;
    els.toast.textContent = text;
    els.toast.classList.add('show');
    setTimeout(() => {
      els.toast.classList.remove('show');
    }, 2000);
  }

  /**
   * Theme Switcher
   */
  function initTheme() {
    chrome.storage.local.get(['yoast_peek_theme'], (result) => {
      if (result.yoast_peek_theme === 'light') {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
      } else {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
      }
    });

    els.btnThemeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.contains('theme-light');
      if (isLight) {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        chrome.storage.local.set({ yoast_peek_theme: 'dark' });
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        chrome.storage.local.set({ yoast_peek_theme: 'light' });
      }
    });
  }

  /**
   * Navigation Tabs Initialization
   */
  function initTabs() {
    els.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');

        els.tabButtons.forEach(b => b.classList.remove('active'));
        els.tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetTabId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  /**
   * SERP Toggle (Desktop vs Mobile)
   */
  function initSerpToggles() {
    els.btnSerpDesktop.addEventListener('click', () => {
      els.btnSerpDesktop.classList.add('active');
      els.btnSerpMobile.classList.remove('active');
      els.serpPreviewBox.classList.remove('serp-mobile');
      els.serpPreviewBox.classList.add('serp-desktop');
    });

    els.btnSerpMobile.addEventListener('click', () => {
      els.btnSerpMobile.classList.add('active');
      els.btnSerpDesktop.classList.remove('active');
      els.serpPreviewBox.classList.remove('serp-desktop');
      els.serpPreviewBox.classList.add('serp-mobile');
    });
  }

  /**
   * Fetch live DOM audit data from the active browser tab
   */
  async function auditActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        renderEmptyState('No active tab found');
        return;
      }

      currentActiveTab = tab;
      els.pageUrl.textContent = tab.url || 'Unknown URL';
      els.pageUrl.title = tab.url || '';

      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
        renderEmptyState('Cannot inspect internal browser pages');
        return;
      }

      // Try communicating with content script
      chrome.tabs.sendMessage(tab.id, { type: 'GET_YOAST_PEEK_DATA' }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Content script not loaded yet - inject dynamically
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });

            // Retry message
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { type: 'GET_YOAST_PEEK_DATA' }, (retryRes) => {
                if (retryRes && retryRes.success) {
                  renderAuditData(retryRes.data);
                } else {
                  renderEmptyState('Unable to read page DOM (page may be restricted)');
                }
              });
            }, 80);
          } catch (injectErr) {
            renderEmptyState('Permission denied for this URL');
          }
        } else {
          renderAuditData(response.data);
        }
      });
    } catch (e) {
      console.error('Audit failed:', e);
      renderEmptyState('Audit failed: ' + e.message);
    }
  }

  /**
   * Render Empty / Fallback State
   */
  function renderEmptyState(message) {
    els.pluginBadge.textContent = 'Inactive';
    els.pluginBadge.className = 'badge badge-neutral';
    els.valPluginName.textContent = message;
    els.valTitleText.textContent = '(No data)';
    els.valDescText.textContent = '(No data)';
    els.valCanonicalUrl.textContent = '(No data)';
    els.valRobotsContent.textContent = '(No data)';
  }

  /**
   * Render complete audit data into the UI
   */
  function renderAuditData(data) {
    currentAuditData = data;

    // 1. Top Badges & Plugin Identification
    renderPluginBadges(data);

    // 2. Overview Tab
    renderOverview(data);

    // 3. Google SERP Simulator
    renderSerpPreview(data);

    // 4. Headings Outline
    renderHeadings(data);

    // 5. Social Tags & Previews
    renderSocial(data);

    // 6. Schema JSON-LD Graph
    renderSchema(data);

    // 7. WordPress / V2 Tab
    renderV2Info(data);
  }

  /**
   * Top bar & plugin badges
   */
  function renderPluginBadges(data) {
    els.pageUrl.textContent = data.url;

    // Plugin Badge
    els.pluginBadge.textContent = data.detectedPlugin;
    if (data.isYoast) {
      els.pluginBadge.className = 'badge badge-yoast';
    } else if (data.detectedPlugin.includes('Rank Math')) {
      els.pluginBadge.className = 'badge badge-rankmath';
    } else if (data.isWp) {
      els.pluginBadge.className = 'badge badge-wp';
    } else {
      els.pluginBadge.className = 'badge badge-neutral';
    }

    // Index / Noindex pill
    if (data.isNoIndex) {
      els.badgeIndex.textContent = 'NOINDEX';
      els.badgeIndex.className = 'pill pill-danger';
    } else {
      els.badgeIndex.textContent = 'INDEX';
      els.badgeIndex.className = 'pill pill-success';
    }

    // Canonical pill
    if (!data.canonical) {
      els.badgeCanonical.textContent = 'NO CANONICAL';
      els.badgeCanonical.className = 'pill pill-warning';
    } else if (data.isCanonicalSelf) {
      els.badgeCanonical.textContent = 'CANONICAL: SELF';
      els.badgeCanonical.className = 'pill pill-success';
    } else {
      els.badgeCanonical.textContent = 'CANONICAL: EXTERNAL';
      els.badgeCanonical.className = 'pill pill-warning';
    }

    // H1 pill
    const h1Count = data.headings.counts.h1;
    els.badgeH1.textContent = `H1: ${h1Count}`;
    if (h1Count === 1) {
      els.badgeH1.className = 'pill pill-success';
    } else if (h1Count === 0) {
      els.badgeH1.className = 'pill pill-danger';
    } else {
      els.badgeH1.className = 'pill pill-warning';
    }

    // Lang pill
    const lang = data.language.htmlLang || '-';
    els.badgeLang.textContent = `LANG: ${lang.toUpperCase()}`;
    els.badgeLang.className = 'pill pill-neutral';

    // Logged-in pill
    if (data.isLoggedIn) {
      els.badgeWpUser.style.display = 'inline-block';
    } else {
      els.badgeWpUser.style.display = 'none';
    }
  }

  /**
   * Overview Tab Renderer
   */
  function renderOverview(data) {
    // Engine & WordPress
    els.valPluginName.textContent = data.detectedPlugin;

    if (data.comments.yoastMatch) {
      els.rowYoastComment.style.display = 'flex';
      els.valYoastComment.textContent = data.comments.yoastMatch;
    } else {
      els.rowYoastComment.style.display = 'none';
    }

    if (data.langSubpathMatch) {
      els.rowMultisitePath.style.display = 'flex';
      els.valMultisitePath.textContent = `${data.langSubpathMatch} (Multisite subpath detected)`;
    } else {
      els.rowMultisitePath.style.display = 'none';
    }

    if (data.wpVersion) {
      els.rowWpVersion.style.display = 'flex';
      els.valWpVersion.textContent = `v${data.wpVersion}`;
    } else {
      els.rowWpVersion.style.display = 'none';
    }

    // Title Tag
    els.valTitleText.textContent = data.title || '(No title found)';
    els.titleCharCount.textContent = `${data.titleLength} chars`;
    els.titlePxCount.textContent = `~${data.titlePixels} px`;

    // Title meter (max 600px for calculation)
    const pxPct = Math.min(100, Math.round((data.titlePixels / 600) * 100));
    els.meterTitlePx.style.width = `${pxPct}%`;
    if (data.titlePixels > 580) {
      els.meterTitlePx.className = 'meter-bar danger';
    } else if (data.titleLength > 60) {
      els.meterTitlePx.className = 'meter-bar warning';
    } else {
      els.meterTitlePx.className = 'meter-bar';
    }

    els.titleAlerts.innerHTML = data.titleFlags.map(f => `
      <div class="alert-item ${f.type}">
        <span>${f.type === 'error' ? '❌' : f.type === 'warning' ? '⚠️' : f.type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>${escapeHtml(f.text)}</span>
      </div>
    `).join('');

    // Meta Description
    els.valDescText.textContent = data.description || '(No meta description found)';
    els.descCharCount.textContent = `${data.descLength} chars`;

    // Desc meter (max 200 chars)
    const descPct = Math.min(100, Math.round((data.descLength / 200) * 100));
    els.meterDescChar.style.width = `${descPct}%`;
    if (data.descLength > 160) {
      els.meterDescChar.className = 'meter-bar warning';
    } else if (data.descLength === 0) {
      els.meterDescChar.className = 'meter-bar danger';
    } else {
      els.meterDescChar.className = 'meter-bar';
    }

    els.descAlerts.innerHTML = data.descFlags.map(f => `
      <div class="alert-item ${f.type}">
        <span>${f.type === 'error' ? '❌' : f.type === 'warning' ? '⚠️' : f.type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>${escapeHtml(f.text)}</span>
      </div>
    `).join('');

    // Canonical URL
    els.valCanonicalUrl.textContent = data.canonical || '(none specified)';
    els.canonicalAlerts.innerHTML = data.canonicalFlags.map(f => `
      <div class="alert-item ${f.type}">
        <span>${f.type === 'error' ? '❌' : f.type === 'warning' ? '⚠️' : '✅'}</span>
        <span>${escapeHtml(f.text)}</span>
      </div>
    `).join('');

    // Robots
    els.valRobotsContent.textContent = data.robots || '(none specified)';
    if (data.googlebot) {
      els.rowGooglebot.style.display = 'flex';
      els.valGooglebotContent.textContent = data.googlebot;
    } else {
      els.rowGooglebot.style.display = 'none';
    }

    els.robotsAlerts.innerHTML = data.robotsFlags.map(f => `
      <div class="alert-item ${f.type}">
        <span>${f.type === 'error' ? '🚫' : f.type === 'warning' ? '⚠️' : '✅'}</span>
        <span>${escapeHtml(f.text)}</span>
      </div>
    `).join('');

    // Hreflang & Language
    els.valHtmlLang.textContent = data.language.htmlLang || '(none set)';
    const hreflangs = data.language.hreflangList || [];
    els.hreflangCount.textContent = `${hreflangs.length} tags`;

    if (hreflangs.length === 0) {
      els.hreflangList.innerHTML = '<span class="text-xs text-muted">No alternate hreflang links detected</span>';
    } else {
      els.hreflangList.innerHTML = hreflangs.map(h => `
        <div class="prop-row text-xs">
          <span class="prop-label font-mono font-semibold" style="min-width: 65px;">${escapeHtml(h.lang)}</span>
          <span class="prop-val font-mono ${h.isSelf ? 'text-accent font-semibold' : ''}">${escapeHtml(h.href)} ${h.isSelf ? '(self)' : ''}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Google SERP Preview Simulator
   */
  function renderSerpPreview(data) {
    try {
      const urlObj = new URL(data.url);
      els.serpSiteName.textContent = data.og.siteName || urlObj.hostname;
      els.serpFav.textContent = (data.og.siteName || urlObj.hostname).charAt(0).toUpperCase();

      const pathClean = urlObj.pathname.split('/').filter(Boolean).join(' › ');
      els.serpUrlBreadcrumb.textContent = `${urlObj.origin}${pathClean ? ' › ' + pathClean : ''}`;
    } catch (e) {
      els.serpSiteName.textContent = 'example.com';
    }

    // Title truncation simulation for Google Desktop SERP (~580px)
    let displayTitle = data.title || 'Untitled Page';
    if (data.titlePixels > 580) {
      displayTitle = displayTitle.substring(0, 58) + '...';
    }
    els.serpTitleDisplay.textContent = displayTitle;

    // Snippet description
    let displayDesc = data.description || 'No meta description provided. Google will generate a snippet from on-page content.';
    if (displayDesc.length > 160) {
      displayDesc = displayDesc.substring(0, 157) + '...';
    }
    els.serpDescDisplay.textContent = displayDesc;
  }

  /**
   * Headings Tab Renderer
   */
  function renderHeadings(data) {
    const counts = data.headings.counts;
    els.statH1.textContent = counts.h1;
    els.statH2.textContent = counts.h2;
    els.statH3.textContent = counts.h3;
    els.statH4.textContent = counts.h4;
    els.statH5.textContent = counts.h5;
    els.statH6.textContent = counts.h6;
    els.statTotalHeadings.textContent = `${counts.total} headings`;

    // H1 Verification
    if (counts.h1 === 1) {
      els.h1Badge.textContent = '1 H1 (Optimal)';
      els.h1Badge.className = 'pill pill-success';
    } else if (counts.h1 === 0) {
      els.h1Badge.textContent = 'Missing H1';
      els.h1Badge.className = 'pill pill-danger';
    } else {
      els.h1Badge.textContent = `${counts.h1} H1s (Multiple)`;
      els.h1Badge.className = 'pill pill-warning';
    }

    if (data.headings.h1Texts.length === 0) {
      els.h1List.innerHTML = '<div class="alert-item error"><span>❌</span><span>No &lt;h1&gt; tag found on this page</span></div>';
    } else {
      els.h1List.innerHTML = data.headings.h1Texts.map((text, idx) => `
        <div class="tag-content-box mb-2">
          <strong>H1 ${data.headings.h1Texts.length > 1 ? '#' + (idx + 1) : ''}:</strong> ${escapeHtml(text)}
        </div>
      `).join('');
    }

    // Hierarchy Jump Warnings
    if (data.headings.hierarchyWarnings && data.headings.hierarchyWarnings.length > 0) {
      els.headingHierarchyAlerts.innerHTML = data.headings.hierarchyWarnings.map(w => `
        <div class="alert-item warning">
          <span>⚠️</span>
          <span>Hierarchy skip: Jumped from ${w.from} to ${w.to} ("${escapeHtml(w.text)}...")</span>
        </div>
      `).join('');
    } else {
      els.headingHierarchyAlerts.innerHTML = '<div class="alert-item success"><span>✅</span><span>Heading hierarchy sequence is clean</span></div>';
    }

    // Full Heading Tree
    if (data.headings.outline.length === 0) {
      els.headingsTree.innerHTML = '<div class="text-xs text-muted">No heading tags (H1-H6) found</div>';
    } else {
      els.headingsTree.innerHTML = data.headings.outline.map(h => `
        <div class="heading-tree-item indent-${h.level}">
          <span class="heading-tag-pill tag-${h.tag.toLowerCase()}">${h.tag}</span>
          <span class="prop-val">${escapeHtml(h.text)}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Social (OG & Twitter) Renderer
   */
  function renderSocial(data) {
    const og = data.og;
    const tw = data.twitter;

    // OG Visual Card
    if (og.image) {
      els.ogPreviewImg.src = og.image;
      els.ogPreviewImg.style.display = 'block';
      els.ogNoImg.style.display = 'none';
    } else {
      els.ogPreviewImg.style.display = 'none';
      els.ogNoImg.style.display = 'block';
    }

    els.ogPreviewDomain.textContent = og.siteName || (data.origin ? new URL(data.url).hostname.toUpperCase() : 'DOMAIN');
    els.ogPreviewTitle.textContent = og.title || data.title || 'Social Title';
    els.ogPreviewDesc.textContent = og.description || data.description || 'Social description snippet';

    // OG Table
    const ogProps = [
      ['og:title', og.title],
      ['og:description', og.description],
      ['og:image', og.image],
      ['og:type', og.type],
      ['og:locale', og.locale],
      ['og:site_name', og.siteName],
      ['og:url', og.url]
    ].filter(([k, v]) => Boolean(v));

    if (ogProps.length === 0) {
      els.tableOgTags.innerHTML = '<div class="text-xs text-muted">No Open Graph meta tags detected</div>';
    } else {
      els.tableOgTags.innerHTML = ogProps.map(([k, v]) => `
        <div class="prop-table-row">
          <span class="prop-table-key">${k}</span>
          <span class="prop-table-val">${escapeHtml(v)}</span>
        </div>
      `).join('');
    }

    // Twitter Table
    const twProps = [
      ['twitter:card', tw.card],
      ['twitter:title', tw.title],
      ['twitter:description', tw.description],
      ['twitter:image', tw.image],
      ['twitter:site', tw.site],
      ['twitter:creator', tw.creator]
    ].filter(([k, v]) => Boolean(v));

    if (twProps.length === 0) {
      els.tableTwitterTags.innerHTML = '<div class="text-xs text-muted">No Twitter Card meta tags detected</div>';
    } else {
      els.tableTwitterTags.innerHTML = twProps.map(([k, v]) => `
        <div class="prop-table-row">
          <span class="prop-table-key">${k}</span>
          <span class="prop-table-val">${escapeHtml(v)}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Schema JSON-LD Renderer
   */
  function renderSchema(data) {
    const s = data.schema;
    if (!s || !s.hasSchema) {
      els.badgeSchemaStatus.textContent = 'None detected';
      els.badgeSchemaStatus.className = 'pill pill-warning';
      els.schemaTypesList.innerHTML = '<span class="text-xs text-muted">No JSON-LD schema detected</span>';
      els.rawSchemaCode.textContent = '(No Schema JSON-LD detected)';
      hideEntityCards();
      return;
    }

    els.badgeSchemaStatus.textContent = s.isYoastGraph ? 'Yoast Graph' : 'Generic JSON-LD';
    els.badgeSchemaStatus.className = s.isYoastGraph ? 'pill pill-success' : 'pill pill-info';

    // Types Pills
    if (s.types && s.types.length > 0) {
      els.schemaTypesList.innerHTML = s.types.map(t => `
        <span class="type-pill">${escapeHtml(t)}</span>
      `).join('');
    } else {
      els.schemaTypesList.innerHTML = '<span class="type-pill">Unspecified Type</span>';
    }

    // Raw Code
    try {
      const parsed = JSON.parse(s.rawJson);
      els.rawSchemaCode.textContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      els.rawSchemaCode.textContent = s.rawJson || '(Empty)';
    }

    // Entity Cards
    renderEntityCards(s.entities);
  }

  function hideEntityCards() {
    els.entityWebpage.style.display = 'none';
    els.entityWebsite.style.display = 'none';
    els.entityOrg.style.display = 'none';
    els.entityBreadcrumbs.style.display = 'none';
    els.entityAuthor.style.display = 'none';
    els.entityArticle.style.display = 'none';
  }

  function renderEntityCards(e) {
    if (!e) {
      hideEntityCards();
      return;
    }

    // WebPage
    if (e.webPage) {
      els.entityWebpage.style.display = 'block';
      els.entityWebpageContent.innerHTML = `
        <div class="prop-row"><span class="prop-label">Name:</span><span class="prop-val">${escapeHtml(e.webPage.name || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">Published:</span><span class="prop-val">${escapeHtml(e.webPage.datePublished || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">Modified:</span><span class="prop-val">${escapeHtml(e.webPage.dateModified || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">Language:</span><span class="prop-val">${escapeHtml(e.webPage.inLanguage || '-')}</span></div>
      `;
    } else {
      els.entityWebpage.style.display = 'none';
    }

    // WebSite
    if (e.webSite) {
      els.entityWebsite.style.display = 'block';
      els.entityWebsiteContent.innerHTML = `
        <div class="prop-row"><span class="prop-label">Name:</span><span class="prop-val font-semibold">${escapeHtml(e.webSite.name || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">URL:</span><span class="prop-val font-mono text-xs">${escapeHtml(e.webSite.url || '-')}</span></div>
        ${e.webSite.description ? `<div class="prop-row"><span class="prop-label">Description:</span><span class="prop-val text-xs">${escapeHtml(e.webSite.description)}</span></div>` : ''}
      `;
    } else {
      els.entityWebsite.style.display = 'none';
    }

    // Organization
    if (e.organization) {
      els.entityOrg.style.display = 'block';
      els.entityOrgContent.innerHTML = `
        <div class="prop-row"><span class="prop-label">Name:</span><span class="prop-val font-semibold">${escapeHtml(e.organization.name || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">URL:</span><span class="prop-val font-mono text-xs">${escapeHtml(e.organization.url || '-')}</span></div>
        ${e.organization.logo ? `<div class="prop-row"><span class="prop-label">Logo:</span><span class="prop-val text-xs break-all">${escapeHtml(e.organization.logo)}</span></div>` : ''}
        ${e.organization.sameAs && e.organization.sameAs.length > 0 ? `<div class="prop-row"><span class="prop-label">Social:</span><span class="prop-val text-xs">${e.organization.sameAs.map(s => escapeHtml(s)).join(', ')}</span></div>` : ''}
      `;
    } else {
      els.entityOrg.style.display = 'none';
    }

    // Breadcrumbs
    if (e.breadcrumbs && e.breadcrumbs.length > 0) {
      els.entityBreadcrumbs.style.display = 'block';
      els.entityBreadcrumbsContent.innerHTML = `
        <div class="tag-content-box font-semibold text-xs">
          ${e.breadcrumbs.map(b => escapeHtml(b.name)).join(' › ')}
        </div>
      `;
    } else {
      els.entityBreadcrumbs.style.display = 'none';
    }

    // Author
    if (e.person) {
      els.entityAuthor.style.display = 'block';
      els.entityAuthorContent.innerHTML = `
        <div class="prop-row"><span class="prop-label">Author Name:</span><span class="prop-val font-semibold">${escapeHtml(e.person.name || '-')}</span></div>
        ${e.person.description ? `<div class="prop-row"><span class="prop-label">Bio:</span><span class="prop-val text-xs">${escapeHtml(e.person.description)}</span></div>` : ''}
      `;
    } else {
      els.entityAuthor.style.display = 'none';
    }

    // Article
    if (e.article) {
      els.entityArticle.style.display = 'block';
      els.entityArticleContent.innerHTML = `
        <div class="prop-row"><span class="prop-label">Headline:</span><span class="prop-val font-semibold">${escapeHtml(e.article.headline || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">Published:</span><span class="prop-val">${escapeHtml(e.article.datePublished || '-')}</span></div>
        <div class="prop-row"><span class="prop-label">Author:</span><span class="prop-val">${escapeHtml(e.article.author || '-')}</span></div>
      `;
    } else {
      els.entityArticle.style.display = 'none';
    }
  }

  /**
   * DOM vs Server Diff Engine
   */
  async function performServerDiff() {
    if (!currentActiveTab || !currentActiveTab.url) {
      showToast('No active URL to fetch');
      return;
    }

    els.btnFetchFresh.textContent = 'Fetching...';
    els.btnFetchFresh.disabled = true;

    chrome.runtime.sendMessage({
      type: 'FETCH_SERVER_HTML',
      url: currentActiveTab.url
    }, (response) => {
      els.btnFetchFresh.textContent = 'Fetch Fresh Server';
      els.btnFetchFresh.disabled = false;

      if (!response || !response.success) {
        showToast('Fetch failed: ' + (response ? response.error : 'Network error'));
        return;
      }

      freshServerData = response;
      renderDiffComparison(response);
    });
  }

  function renderDiffComparison(serverResponse) {
    els.serverStatusBar.style.display = 'flex';
    els.serverHttpStatus.textContent = `${serverResponse.status} ${serverResponse.statusText || 'OK'}`;
    els.serverXRobots.textContent = serverResponse.xRobotsTag || '(None)';
    if (serverResponse.xRobotsTag) {
      els.serverXRobots.className = /noindex/i.test(serverResponse.xRobotsTag) ? 'pill pill-danger' : 'pill pill-info';
    }

    // Parse server HTML with DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(serverResponse.html, 'text/html');

    const sTitle = doc.title || '';
    const sDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const sCanonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const sRobots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    const sH1s = Array.from(doc.querySelectorAll('h1')).map(h => (h.textContent || '').trim()).join(' | ');

    const domH1s = (currentAuditData?.headings?.h1Texts || []).join(' | ');
    const domTitle = currentAuditData?.title || '';
    const domDesc = currentAuditData?.description || '';
    const domCanonical = currentAuditData?.canonical || '';
    const domRobots = currentAuditData?.robots || '';

    const comparisons = [
      { element: '<title>', dom: domTitle, server: sTitle },
      { element: 'meta description', dom: domDesc, server: sDesc },
      { element: 'canonical link', dom: domCanonical, server: sCanonical },
      { element: 'meta robots', dom: domRobots, server: sRobots },
      { element: 'H1 text', dom: domH1s, server: sH1s }
    ];

    let allMatch = true;

    els.diffTbody.innerHTML = comparisons.map(item => {
      const isMatch = item.dom.trim() === item.server.trim();
      if (!isMatch) allMatch = false;

      return `
        <tr>
          <td><strong>${item.element}</strong></td>
          <td class="text-xs">${escapeHtml(item.dom || '(empty)')}</td>
          <td class="text-xs">${escapeHtml(item.server || '(empty)')}</td>
          <td class="${isMatch ? 'diff-match-ok' : 'diff-match-mismatch'}">
            ${isMatch ? '✅ Match' : '❌ Diff'}
          </td>
        </tr>
      `;
    }).join('');

    if (allMatch) {
      els.diffSummaryAlert.innerHTML = '<div class="alert-item success"><span>✅</span><strong>100% Match:</strong> Live DOM perfectly matches fresh server HTML. No client-side SEO overrides detected.</div>';
    } else {
      els.diffSummaryAlert.innerHTML = '<div class="alert-item warning"><span>⚠️</span><strong>Differences Detected:</strong> Live DOM differs from server HTML. Client-side JavaScript (or theme script) is altering SEO tags.</div>';
    }
  }

  /**
   * WP / V2 Tab Renderer & REST Probe
   */
  function renderV2Info(data) {
    if (data.isLoggedIn) {
      els.v2SessionStatus.innerHTML = '<span class="pill pill-success">LOGGED IN</span> <span class="text-xs text-muted">(WordPress Admin Bar / session detected)</span>';
      if (data.postId) {
        els.v2PostRow.style.display = 'flex';
        els.v2PostId.textContent = `#${data.postId}`;
      } else {
        els.v2PostRow.style.display = 'none';
      }

      if (data.editPostUrl) {
        els.v2EditLinkRow.style.display = 'flex';
        els.v2EditLink.href = data.editPostUrl;
      } else {
        els.v2EditLinkRow.style.display = 'none';
      }
    } else {
      els.v2SessionStatus.innerHTML = '<span class="pill pill-neutral">LOGGED OUT / PUBLIC</span>';
      els.v2PostRow.style.display = 'none';
      els.v2EditLinkRow.style.display = 'none';
    }
  }

  /**
   * Probe /wp-json/yoast/v1/get_head?url=...
   */
  function probeYoastRest() {
    if (!currentActiveTab || !currentActiveTab.url) return;

    els.btnProbeYoastRest.textContent = 'Probing...';
    els.btnProbeYoastRest.disabled = true;

    chrome.runtime.sendMessage({
      type: 'PROBE_YOAST_REST_API',
      url: currentActiveTab.url
    }, (res) => {
      els.btnProbeYoastRest.textContent = 'Test Endpoint';
      els.btnProbeYoastRest.disabled = false;
      els.yoastRestResult.style.display = 'block';

      if (!res || !res.success) {
        els.yoastRestResult.textContent = `Endpoint Probe Result:\nStatus: ${res ? res.status : 'Error'}\nNote: REST API may be restricted or Yoast Headless endpoint is disabled on this site.`;
        return;
      }

      els.yoastRestResult.textContent = JSON.stringify(res.data, null, 2);
      showToast('Yoast REST API responded 200 OK!');
    });
  }

  /**
   * Export Utilities (Clipboard & CSV)
   */
  function initExportButtons() {
    // Copy Title
    els.btnCopyTitle.addEventListener('click', () => {
      if (currentAuditData && currentAuditData.title) {
        navigator.clipboard.writeText(currentAuditData.title);
        showToast('Title copied to clipboard');
      } else {
        showToast('No title to copy');
      }
    });

    // Copy Description
    els.btnCopyDesc.addEventListener('click', () => {
      if (currentAuditData && currentAuditData.description) {
        navigator.clipboard.writeText(currentAuditData.description);
        showToast('Description copied to clipboard');
      } else {
        showToast('No description to copy');
      }
    });

    // Copy Canonical
    els.btnCopyCanonical.addEventListener('click', () => {
      if (currentAuditData && currentAuditData.canonical) {
        navigator.clipboard.writeText(currentAuditData.canonical);
        showToast('Canonical URL copied to clipboard');
      } else {
        showToast('No canonical URL to copy');
      }
    });

    // Copy Schema
    els.btnCopySchema.addEventListener('click', () => {
      if (currentAuditData && currentAuditData.schema && currentAuditData.schema.rawJson) {
        navigator.clipboard.writeText(currentAuditData.schema.rawJson);
        showToast('Schema JSON-LD copied to clipboard');
      } else {
        showToast('No schema to copy');
      }
    });

    // Copy Full Audit JSON
    els.btnCopyJson.addEventListener('click', () => {
      if (currentAuditData) {
        const cleanJson = JSON.stringify(currentAuditData, null, 2);
        navigator.clipboard.writeText(cleanJson);
        showToast('Full SEO audit copied as JSON');
      }
    });

    // Copy as CSV Row
    els.btnCopyCsv.addEventListener('click', () => {
      if (!currentAuditData) return;
      const d = currentAuditData;
      const headers = ['URL', 'Title', 'Title Chars', 'Title Pixels', 'Meta Description', 'Desc Chars', 'Canonical', 'Canonical Match', 'Robots', 'H1 Text', 'H1 Count', 'Detected Plugin'];
      const row = [
        d.url,
        d.title,
        d.titleLength,
        d.titlePixels,
        d.description,
        d.descLength,
        d.canonical || '',
        d.isCanonicalSelf ? 'Self' : 'External/None',
        d.robots || '',
        (d.headings?.h1Texts || []).join(' | '),
        d.headings?.counts?.h1 || 0,
        d.detectedPlugin
      ];

      const csvEscape = (field) => `"${String(field || '').replace(/"/g, '""')}"`;
      const csvString = `${headers.map(csvEscape).join(',')}\n${row.map(csvEscape).join(',')}`;

      navigator.clipboard.writeText(csvString);
      showToast('Copied CSV record (header + row)');
    });
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Event Listeners & Bootstrapping
   */
  function initListeners() {
    // Refresh button
    els.btnRefresh.addEventListener('click', () => {
      showToast('Refreshing audit...');
      auditActiveTab();
    });

    // Fresh Server Diff
    els.btnFetchFresh.addEventListener('click', performServerDiff);

    // V2 REST Probe
    els.btnProbeYoastRest.addEventListener('click', probeYoastRest);

    // Listen for tab switches or reloads notified by background worker
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'YOAST_PEEK_TAB_ACTIVATED' || msg.type === 'YOAST_PEEK_TAB_UPDATED') {
        auditActiveTab();
      }
    });
  }

  // Initialize
  initTheme();
  initTabs();
  initSerpToggles();
  initExportButtons();
  initListeners();

  // Initial audit execution
  auditActiveTab();
})();
