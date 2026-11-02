/**
 * Yoast Peek - Background Service Worker (Manifest V3)
 */

// Enable opening side panel on toolbar action click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error('Failed to set side panel behavior:', err));
  }
});

// Notify open side panel whenever user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && !tab.url.startsWith('chrome://')) {
      chrome.runtime.sendMessage({
        type: 'YOAST_PEEK_TAB_ACTIVATED',
        tabId: activeInfo.tabId,
        url: tab.url
      }).catch(() => {
        // Suppress errors when side panel is closed
      });
    }
  } catch (e) {
    // Tab might be closing
  }
});

// Notify open side panel whenever active tab finishes loading/navigating
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.runtime.sendMessage({
      type: 'YOAST_PEEK_TAB_UPDATED',
      tabId: tabId,
      url: tab.url
    }).catch(() => {
      // Suppress errors when side panel is closed
    });
  }
});

// Handle requests from side panel or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_SERVER_HTML') {
    // Perform fresh server fetch from background service worker
    // Host permissions allow unrestricted fetch + full header extraction
    const targetUrl = message.url;
    const cacheBuster = `_yoast_peek_bust=${Date.now()}`;
    const fetchUrl = targetUrl.includes('?') 
      ? `${targetUrl}&${cacheBuster}` 
      : `${targetUrl}?${cacheBuster}`;

    fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      credentials: 'include'
    })
      .then(async (res) => {
        const text = await res.text();
        const headersObj = {};
        for (const [key, val] of res.headers.entries()) {
          headersObj[key.toLowerCase()] = val;
        }

        sendResponse({
          success: true,
          status: res.status,
          statusText: res.statusText,
          headers: headersObj,
          xRobotsTag: headersObj['x-robots-tag'] || null,
          server: headersObj['server'] || null,
          contentType: headersObj['content-type'] || null,
          html: text
        });
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err.message || String(err)
        });
      });

    return true; // Keep message channel open for async response
  }

  if (message.type === 'PROBE_YOAST_REST_API') {
    // Probe /wp-json/yoast/v1/get_head?url=<url>
    const urlObj = new URL(message.url);
    const restEndpoint = `${urlObj.origin}/wp-json/yoast/v1/get_head?url=${encodeURIComponent(message.url)}`;

    fetch(restEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
      .then(async (res) => {
        if (!res.ok) {
          return sendResponse({
            success: false,
            status: res.status,
            statusText: res.statusText
          });
        }
        const data = await res.json();
        sendResponse({
          success: true,
          status: res.status,
          data: data
        });
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err.message || String(err)
        });
      });

    return true; // Keep channel open
  }
});
