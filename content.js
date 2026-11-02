/**
 * Yoast Peek - Content Script
 * Extracts live DOM SEO data, Yoast & other SEO plugin signatures, headings, Schema JSON-LD.
 */

(function () {
  'use strict';

  // Prevent duplicate execution if injected multiple times
  if (window.__YOAST_PEEK_EXTRACTOR_LOADED__) {
    return;
  }
  window.__YOAST_PEEK_EXTRACTOR_LOADED__ = true;

  /**
   * Accurate Google Desktop Title Pixel Width Estimator using Canvas
   * Google desktop SERP font: 20px Roboto, Arial, sans-serif
   */
  function estimateTitlePixelWidth(titleText) {
    if (!titleText) return 0;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '20px Roboto, Arial, sans-serif';
        return Math.round(ctx.measureText(titleText).width);
      }
    } catch (e) {
      // Fallback
    }
    return Math.round(titleText.length * 9.5);
  }

  /**
   * Scans DOM comments for Yoast, Rank Math, and other SEO plugins
   */
  function scanComments() {
    let yoastMatch = null;
    let rankMathMatch = null;
    let aioseoMatch = null;
    let seopressMatch = null;
    let theSeoFrameworkMatch = null;
    let squirrlyMatch = null;

    try {
      const iterator = document.createNodeIterator(
        document.documentElement,
        NodeFilter.SHOW_COMMENT,
        null
      );

      let commentNode;
      while ((commentNode = iterator.nextNode())) {
        const text = (commentNode.nodeValue || '').trim();

        // Yoast SEO detection
        if (/optimized with the Yoast SEO/i.test(text) || /Yoast SEO plugin/i.test(text)) {
          yoastMatch = text;
        }
        // Rank Math detection
        if (/Rank Math/i.test(text)) {
          rankMathMatch = text;
        }
        // All in One SEO
        if (/All in One SEO/i.test(text) || /AIOSEO/i.test(text)) {
          aioseoMatch = text;
        }
        // SEOPress
        if (/SEOPress/i.test(text)) {
          seopressMatch = text;
        }
        // The SEO Framework
        if (/The SEO Framework/i.test(text)) {
          theSeoFrameworkMatch = text;
        }
        // Squirrly
        if (/Squirrly/i.test(text)) {
          squirrlyMatch = text;
        }
      }
    } catch (e) {
      console.warn('Yoast Peek: comment scan error', e);
    }

    return {
      yoastMatch,
      rankMathMatch,
      aioseoMatch,
      seopressMatch,
      theSeoFrameworkMatch,
      squirrlyMatch
    };
  }

  /**
   * Extracts and parses Schema JSON-LD graphs
   */
  function extractSchema() {
    const yoastScript = document.querySelector('script.yoast-schema-graph[type="application/ld+json"]');
    const allJsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    let isYoastGraph = false;
    let rawJson = null;
    let parsedData = null;
    let graphArray = [];
    let detectedTypes = new Set();
    let entities = {
      webSite: null,
      webPage: null,
      organization: null,
      person: null,
      breadcrumbs: [],
      article: null
    };

    const targetScript = yoastScript || allJsonLdScripts[0] || null;

    if (yoastScript) {
      isYoastGraph = true;
    }

    if (targetScript) {
      try {
        rawJson = targetScript.textContent.trim();
        parsedData = JSON.parse(rawJson);

        if (parsedData['@graph'] && Array.isArray(parsedData['@graph'])) {
          graphArray = parsedData['@graph'];
          if (!isYoastGraph && targetScript.textContent.includes('yoast')) {
            isYoastGraph = true;
          }
        } else if (Array.isArray(parsedData)) {
          graphArray = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          graphArray = [parsedData];
        }

        // Analyze entities in graph
        for (const item of graphArray) {
          let itemType = item['@type'];
          if (Array.isArray(itemType)) {
            itemType.forEach(t => detectedTypes.add(t));
          } else if (itemType) {
            detectedTypes.add(itemType);
          }

          const typeStr = Array.isArray(itemType) ? itemType.join(', ') : (itemType || '');

          if (/WebSite/i.test(typeStr) && !entities.webSite) {
            entities.webSite = {
              name: item.name || '',
              url: item.url || '',
              description: item.description || '',
              publisher: item.publisher?.name || (typeof item.publisher === 'string' ? item.publisher : '')
            };
          }

          if (/WebPage/i.test(typeStr) && !entities.webPage) {
            entities.webPage = {
              id: item['@id'] || '',
              name: item.name || '',
              url: item.url || '',
              datePublished: item.datePublished || '',
              dateModified: item.dateModified || '',
              description: item.description || '',
              inLanguage: item.inLanguage || ''
            };
          }

          if (/Organization/i.test(typeStr) && !entities.organization) {
            entities.organization = {
              name: item.name || '',
              url: item.url || '',
              logo: item.logo?.url || (typeof item.logo === 'string' ? item.logo : ''),
              sameAs: Array.isArray(item.sameAs) ? item.sameAs : (item.sameAs ? [item.sameAs] : [])
            };
          }

          if (/Person/i.test(typeStr) && !entities.person) {
            entities.person = {
              name: item.name || '',
              image: item.image?.url || (typeof item.image === 'string' ? item.image : ''),
              description: item.description || '',
              sameAs: Array.isArray(item.sameAs) ? item.sameAs : (item.sameAs ? [item.sameAs] : [])
            };
          }

          if (/BreadcrumbList/i.test(typeStr) && (!entities.breadcrumbs || entities.breadcrumbs.length === 0)) {
            if (Array.isArray(item.itemListElement)) {
              entities.breadcrumbs = item.itemListElement.map(crumb => ({
                position: crumb.position,
                name: crumb.name || crumb.item?.name || '',
                url: crumb.item?.['@id'] || (typeof crumb.item === 'string' ? crumb.item : '')
              }));
            }
          }

          if (/(Article|BlogPosting|NewsArticle)/i.test(typeStr) && !entities.article) {
            entities.article = {
              type: typeStr,
              headline: item.headline || item.name || '',
              datePublished: item.datePublished || '',
              dateModified: item.dateModified || '',
              author: item.author?.name || (typeof item.author === 'string' ? item.author : '')
            };
          }
        }
      } catch (err) {
        console.warn('Yoast Peek: schema JSON parse error', err);
      }
    }

    return {
      hasSchema: Boolean(targetScript),
      isYoastGraph,
      totalJsonLdTags: allJsonLdScripts.length,
      types: Array.from(detectedTypes),
      entities,
      rawJson: rawJson ? rawJson.substring(0, 100000) : null // Cap for safety
    };
  }

  /**
   * Extracts heading outline and detects hierarchy skips
   */
  function extractHeadings() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, total: headings.length };
    const outline = [];
    const h1Texts = [];
    const hierarchyWarnings = [];

    let prevLevel = 0;

    headings.forEach((el, index) => {
      const tag = el.tagName.toUpperCase();
      const level = parseInt(tag.charAt(1), 10);
      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');

      counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] || 0) + 1;

      if (tag === 'H1') {
        h1Texts.push(text);
      }

      // Check hierarchy skip (e.g., H1 followed by H3, skipping H2)
      if (prevLevel > 0 && level > prevLevel + 1) {
        hierarchyWarnings.push({
          index,
          from: `H${prevLevel}`,
          to: `H${level}`,
          text: text.substring(0, 40)
        });
      }
      prevLevel = level;

      outline.push({
        index,
        tag,
        level,
        text: text.substring(0, 150),
        id: el.id || null
      });
    });

    return {
      counts,
      h1Texts,
      outline,
      hierarchyWarnings
    };
  }

  /**
   * Extracts all SEO metadata and WordPress diagnostics from the live DOM
   */
  function extractAllData() {
    const url = window.location.href;
    const urlObj = new URL(url);

    // 1. Comments & Plugin Detection
    const comments = scanComments();
    const schema = extractSchema();

    // Check WordPress markers
    const wpGeneratorMeta = document.querySelector('meta[name="generator"][content*="WordPress" i]');
    const wpRestLink = document.querySelector('link[rel="https://api.w.org/"]');
    const rsdLink = document.querySelector('link[rel="EditURI"]');
    const wpScriptsOrStyles = Array.from(document.querySelectorAll('script[src], link[rel="stylesheet"][href]')).some(
      el => {
        const src = el.src || el.href || '';
        return src.includes('/wp-content/') || src.includes('/wp-includes/');
      }
    );
    const adminBar = document.getElementById('wpadminbar');
    const isWp = Boolean(wpGeneratorMeta || wpRestLink || rsdLink || wpScriptsOrStyles || adminBar);

    // Extract WP Version if in generator
    let wpVersion = null;
    if (wpGeneratorMeta) {
      const m = wpGeneratorMeta.getAttribute('content').match(/WordPress\s+([0-9.]+)/i);
      if (m) wpVersion = m[1];
    }

    // Determine SEO Plugin
    let detectedPlugin = 'None detected';
    let yoastVersion = null;
    let isYoast = false;

    if (comments.yoastMatch || schema.isYoastGraph) {
      isYoast = true;
      const isPremium = comments.yoastMatch && /Premium/i.test(comments.yoastMatch);
      const vMatch = comments.yoastMatch ? comments.yoastMatch.match(/v([0-9.]+)/i) : null;
      yoastVersion = vMatch ? vMatch[1] : null;
      detectedPlugin = `Yoast SEO${isPremium ? ' Premium' : ''}${yoastVersion ? ' v' + yoastVersion : ''}`;
    } else if (comments.rankMathMatch || document.querySelector('script.rank-math-schema')) {
      detectedPlugin = 'Rank Math SEO';
    } else if (comments.aioseoMatch || document.querySelector('script.aioseo-schema')) {
      detectedPlugin = 'All in One SEO (AIOSEO)';
    } else if (comments.seopressMatch) {
      detectedPlugin = 'SEOPress';
    } else if (comments.theSeoFrameworkMatch) {
      detectedPlugin = 'The SEO Framework';
    } else if (comments.squirrlyMatch) {
      detectedPlugin = 'Squirrly SEO';
    } else if (isWp) {
      detectedPlugin = 'WordPress (No Yoast / other detected)';
    } else {
      detectedPlugin = 'Not a WordPress site';
    }

    // Multisite language sub-path detection (e.g. /pl/, /ua/, /en/, /de/)
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const langSubpathMatch = pathSegments.length > 0 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(pathSegments[0]) 
      ? `/${pathSegments[0]}/` 
      : null;

    // Logged-in state detection
    const isLoggedIn = Boolean(adminBar || document.body.classList.contains('logged-in') || document.body.classList.contains('admin-bar'));
    let editPostUrl = null;
    let postId = null;
    let postType = null;
    if (adminBar) {
      const editBtn = adminBar.querySelector('#wp-admin-bar-edit a');
      if (editBtn && editBtn.href) {
        editPostUrl = editBtn.href;
        const pMatch = editBtn.href.match(/post=([0-9]+)/);
        if (pMatch) postId = pMatch[1];
        const actionMatch = editBtn.href.match(/action=edit/);
      }
    }

    // 2. Title Analysis
    const title = document.title || '';
    const titleLength = title.length;
    const titlePixels = estimateTitlePixelWidth(title);
    const titleFlags = [];
    if (!title) {
      titleFlags.push({ type: 'error', text: 'Missing or empty <title> tag' });
    } else {
      if (titleLength > 60) {
        titleFlags.push({ type: 'warning', text: `Length: ${titleLength} chars (over recommended 60)` });
      } else if (titleLength < 30) {
        titleFlags.push({ type: 'info', text: `Length: ${titleLength} chars (short title, under 30)` });
      } else {
        titleFlags.push({ type: 'success', text: `Length: ${titleLength} chars (optimal 30-60)` });
      }

      if (titlePixels > 580) {
        titleFlags.push({ type: 'warning', text: `Pixel width: ~${titlePixels}px (exceeds Google ~580px desktop limit, likely truncated)` });
      } else {
        titleFlags.push({ type: 'success', text: `Pixel width: ~${titlePixels}px / 580px (fits Google desktop snippet)` });
      }
    }

    // 3. Meta Description
    const metaDescEl = document.querySelector('meta[name="description"]');
    const description = metaDescEl ? (metaDescEl.getAttribute('content') || '').trim() : '';
    const descLength = description.length;
    const descFlags = [];
    if (!description) {
      descFlags.push({ type: 'error', text: 'Missing meta description' });
    } else {
      if (descLength > 160) {
        descFlags.push({ type: 'warning', text: `Length: ${descLength} chars (over recommended 155-160, likely truncated)` });
      } else if (descLength < 70) {
        descFlags.push({ type: 'info', text: `Length: ${descLength} chars (under 70, considered short)` });
      } else {
        descFlags.push({ type: 'success', text: `Length: ${descLength} chars (optimal 70-160)` });
      }
    }

    // 4. Canonical & Robots
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl ? canonicalEl.getAttribute('href') : null;
    let isCanonicalSelf = false;
    let canonicalFlags = [];
    if (!canonical) {
      canonicalFlags.push({ type: 'warning', text: 'Missing canonical link' });
    } else {
      try {
        const canUrl = new URL(canonical, url);
        // Compare origin + pathname
        isCanonicalSelf = (canUrl.origin + canUrl.pathname.replace(/\/$/, '')) === (urlObj.origin + urlObj.pathname.replace(/\/$/, ''));
        if (isCanonicalSelf) {
          canonicalFlags.push({ type: 'success', text: 'Self-referencing canonical' });
        } else {
          canonicalFlags.push({ type: 'warning', text: `Points to external URL: ${canonical}` });
        }
      } catch (e) {
        canonicalFlags.push({ type: 'error', text: 'Invalid canonical URL format' });
      }
    }

    const robotsEl = document.querySelector('meta[name="robots"]');
    const robots = robotsEl ? robotsEl.getAttribute('content') : '';
    const googlebotEl = document.querySelector('meta[name="googlebot"]');
    const googlebot = googlebotEl ? googlebotEl.getAttribute('content') : '';

    const robotsFlags = [];
    const isNoIndex = /noindex/i.test(robots) || /noindex/i.test(googlebot);
    const isNoFollow = /nofollow/i.test(robots) || /nofollow/i.test(googlebot);

    if (isNoIndex) {
      robotsFlags.push({ type: 'error', text: 'NOINDEX active: Search engines will not index this page' });
    } else {
      robotsFlags.push({ type: 'success', text: 'INDEX allowed' });
    }

    if (isNoFollow) {
      robotsFlags.push({ type: 'warning', text: 'NOFOLLOW active: Search engines will not follow links' });
    } else {
      robotsFlags.push({ type: 'success', text: 'FOLLOW allowed' });
    }

    // 5. Open Graph & Twitter Cards
    const ogTags = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const prop = el.getAttribute('property');
      const val = el.getAttribute('content');
      if (prop && val) ogTags[prop] = val;
    });

    const twitterTags = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
      const name = el.getAttribute('name');
      const val = el.getAttribute('content');
      if (name && val) twitterTags[name] = val;
    });

    // 6. Language & Hreflang
    const htmlLang = document.documentElement.lang || '';
    const htmlDir = document.documentElement.dir || 'ltr';

    const hreflangElements = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
    const hreflangList = hreflangElements.map(el => {
      const lang = el.getAttribute('hreflang');
      const href = el.getAttribute('href');
      let isSelf = false;
      try {
        const hUrl = new URL(href, url);
        isSelf = (hUrl.origin + hUrl.pathname.replace(/\/$/, '')) === (urlObj.origin + urlObj.pathname.replace(/\/$/, ''));
      } catch (e) {}
      return { lang, href, isSelf };
    });
    const hasXDefault = hreflangList.some(item => item.lang.toLowerCase() === 'x-default');

    // 7. Headings Outline
    const headingsData = extractHeadings();

    return {
      timestamp: Date.now(),
      url,
      origin: urlObj.origin,
      pathname: urlObj.pathname,
      langSubpathMatch,
      isWp,
      wpVersion,
      wpRestEndpoint: wpRestLink ? wpRestLink.getAttribute('href') : null,
      isLoggedIn,
      postId,
      editPostUrl,
      isYoast,
      detectedPlugin,
      yoastVersion,
      comments,
      title,
      titleLength,
      titlePixels,
      titleFlags,
      description,
      descLength,
      descFlags,
      canonical,
      isCanonicalSelf,
      canonicalFlags,
      robots,
      googlebot,
      robotsFlags,
      isNoIndex,
      isNoFollow,
      og: {
        title: ogTags['og:title'] || '',
        description: ogTags['og:description'] || '',
        image: ogTags['og:image'] || ogTags['og:image:secure_url'] || '',
        type: ogTags['og:type'] || '',
        locale: ogTags['og:locale'] || '',
        siteName: ogTags['og:site_name'] || '',
        url: ogTags['og:url'] || ''
      },
      twitter: {
        card: twitterTags['twitter:card'] || '',
        title: twitterTags['twitter:title'] || '',
        description: twitterTags['twitter:description'] || '',
        image: twitterTags['twitter:image'] || '',
        site: twitterTags['twitter:site'] || '',
        creator: twitterTags['twitter:creator'] || ''
      },
      language: {
        htmlLang,
        htmlDir,
        hreflangList,
        hasXDefault
      },
      headings: headingsData,
      schema
    };
  }

  // Listen for message requests from sidepanel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_YOAST_PEEK_DATA') {
      try {
        const data = extractAllData();
        sendResponse({ success: true, data });
      } catch (err) {
        console.error('Yoast Peek extraction error:', err);
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });

  // Make extractAllData available for direct execution via scripting API if needed
  window.__YOAST_PEEK_EXTRACT__ = extractAllData;
})();
