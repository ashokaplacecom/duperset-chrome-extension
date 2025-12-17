(() => {
  console.log('[ExtOpp] Script loaded.');

  /*───────────────────────────────────
   * CONFIG
   *───────────────────────────────────*/
  const MENU_SELECTOR = 'ul.MuiList-root.MuiList-padding.css-1wduhak';
  const ITEM_ID = 'external-opportunities';
  const NAV_DIV_ID = 'external-opportunities-nav';
  const CUSTOM_DIV_ID = 'external-opps-root';
  const TARGET_URL = '/students/external-opportunities';

  const MAX_ATTEMPTS = 20;
  const BATCH_SIZE = 10;

  let attempts = 0;
  let cachedOpps = null;

  /*───────────────────────────────────
   * DATA HANDLING & TYPE SAFETY
   *───────────────────────────────────*/

  const safeGet = (obj, key, fallback = 'Not Specified') => {
    if (!obj) return fallback;
    const val = obj[key];
    return (val !== null && val !== undefined && val !== '') ? val : fallback;
  };

  const normalizeOpportunity = (raw) => {
    const formatDeadline = (d) => {
      if (!d) return 'Not Specified';
      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString(undefined, {
          weekday: 'long', year: 'numeric', month: 'long',
          day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { return d; }
    };

    return {
      id: raw.id || Math.random().toString(36).substr(2, 9),
      title: safeGet(raw, 'opportunityTitle', 'Untitled Role'),
      orgName: safeGet(raw, 'orgName', 'Unknown Organization'),
      location: safeGet(raw, 'location', 'Remote/Unspecified'),
      deadline: formatDeadline(raw['deadline']),
      deadlineRaw: raw['deadline'],
      postedDate: formatDeadline(raw['startDate']),

      skills: safeGet(raw, 'elibigilityRestrictions', 'Not Specified'),
      compensation: safeGet(raw, 'compensationType', 'Not Specified'),
      workArrangement: safeGet(raw, 'workArrangement', 'Not Specified'),
      duration: safeGet(raw, 'duration', 'Not Specified'),

      description: safeGet(raw, 'jdText') !== 'Not Specified' ? raw['jdText'] : (raw['additionalDetails'] || 'No additional details provided.'),

      applyLink: raw['toApply'] || null,
      jdLink: raw['jdLink'] || null,

      posterName: safeGet(raw, 'responderEmail', 'Anonymous').split('@')[0],
      posterEmail: safeGet(raw, 'responderEmail', '')
    };
  };

  /*───────────────────────────────────
   * DATA FETCHING & CACHING
   *───────────────────────────────────*/

  const CACHE_KEY = 'duperset_ext_opps_cache';

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      console.log(`[ExtOpp] Loaded ${data.length} items from cache`);
      return data.map(normalizeOpportunity);
    } catch (e) {
      console.warn('[ExtOpp] Failed to load cache', e);
      return null;
    }
  };

  const saveToCache = (rawOpps) => {
    try {
      const payload = { data: rawOpps, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[ExtOpp] Failed to save cache', e);
    }
  };

  const fetchFromNetwork = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: "fetchOpportunities" });
      if (response && response.error) throw new Error(response.message);

      const rawList = Array.isArray(response) ? response : [];
      saveToCache(rawList);
      return rawList.map(normalizeOpportunity);

    } catch (err) {
      console.error('[ExtOpp] Network fetch error:', err);
      return null;
    }
  };

  /*───────────────────────────────────
   * RENDERING & UI
   *───────────────────────────────────*/

  const injectStyles = () => {
    if (document.getElementById('extopp-styles')) return;
    const style = document.createElement('style');
    style.id = 'extopp-styles';
    style.textContent = `
      #${CUSTOM_DIV_ID} { 
        height: calc(100vh - 100px); 
        width: 100%; 
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
        box-sizing: border-box;
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f4f6f8;
        display: flex;
        gap: 1rem;
        overflow: hidden;
      }

      /* Sidebar */
      .extopp-sidebar {
        flex: 0 0 350px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #dfe1e5;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .extopp-sidebar-header {
        padding: 1rem;
        border-bottom: 2px solid #3B32B3;
        background: #fff;
      }
      .extopp-sidebar-header h3 {
        margin: 0;
        color: #3B32B3;
        font-size: 1.1rem;
      }

      .extopp-list-wrapper {
        flex: 1;
        overflow-y: auto;
        position: relative;
      }

      .extopp-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .extopp-list-item {
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .extopp-list-item:hover {
        background: #f9f9fa;
      }
      .extopp-list-item.selected {
        background: #eef2ff;
        border-left: 3px solid #3B32B3;
      }

      .extopp-item-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.25rem;
        font-size: 1rem;
      }
      .extopp-item-org {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }
      .extopp-item-deadline {
        font-size: 0.8rem;
        color: #d9534f;
        background: #fff0f0;
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
      }

      /* Load More Footer */
      .extopp-sidebar-footer {
        padding: 1rem;
        border-top: 1px solid #eee;
        background: #fafafa;
        text-align: center;
      }
      .load-more-btn {
        background: #fff;
        color: #3B32B3;
        border: 1px solid #3B32B3;
        padding: 0.6rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        width: 100%;
        transition: background 0.2s;
      }
      .load-more-btn:hover {
          background: #3B32B3;
          color: #fff;
      }

      /* Main Content */
      .extopp-detail-view {
        flex: 1;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #dfe1e5;
        overflow-y: auto;
        padding: 2rem;
        position: relative;
      }

      .extopp-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #eee;
        padding-bottom: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      .extopp-detail-header-info h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
        color: #2c3e50;
      }
      .extopp-detail-header-info h2 {
        margin: 0;
        font-size: 1.2rem;
        color: #7f8c8d;
        font-weight: 400;
      }

      .extopp-deadline-banner {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f0f4ff;
        border: 1px solid #dbeafe;
        border-radius: 6px;
        color: #1e40af;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .extopp-actions {
        display: flex;
        gap: 1rem;
      }

      .btn {
        padding: 0.6rem 1.2rem;
        border-radius: 20px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn-primary {
        background: #3B32B3;
        color: #fff;
      }
      .btn-primary:hover {
        background: #2a2391;
        box-shadow: 0 2px 8px rgba(59, 50, 179, 0.3);
      }
      .btn-secondary {
        background: #fff;
        color: #3B32B3;
        border: 1px solid #3B32B3;
      }
      .btn-secondary:hover {
        background: #eff6ff;
      }

      .extopp-section {
        margin-bottom: 2rem;
      }
      .extopp-section h3 {
        font-size: 1.1rem;
        color: #2c3e50;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #3B32B3;
        display: inline-block;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
        background: #fafafa;
        padding: 1.5rem;
        border-radius: 8px;
      }
      .overview-item label {
        display: block;
        color: #7f8c8d;
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
        font-weight: 600;
      }
      .overview-item span {
        color: #2c3e50;
        font-size: 1rem;
      }

      .description-content {
        line-height: 1.6;
        color: #444;
        white-space: pre-wrap; 
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
      }
    `;
    document.head.appendChild(style);
  };

  const renderLayout = (container) => {
    container.innerHTML = `
      <div class="extopp-sidebar">
        <div class="extopp-sidebar-header">
           <h3>All Opportunities</h3>
        </div>
        <div class="extopp-list-wrapper">
            <ul class="extopp-list" id="extopp-list"></ul>
        </div>
        <div class="extopp-sidebar-footer" id="extopp-load-more-container" style="display:none;">
            <button class="load-more-btn" id="extopp-load-more-btn">Load More Jobs</button>
        </div>
      </div>
      <div class="extopp-detail-view" id="extopp-detail">
        <div class="empty-state">Select an opportunity to view details</div>
      </div>
    `;
  };

  const renderSidebarItem = (opp, isSelected = false) => {
    const li = document.createElement('li');
    li.className = `extopp-list-item ${isSelected ? 'selected' : ''}`;
    li.dataset.id = opp.id;

    li.innerHTML = `
      <div class="extopp-item-title">${opp.title}</div>
      <div class="extopp-item-org">${opp.orgName}</div>
      ${opp.deadlineRaw ? `<div class="extopp-item-deadline">Deadline: ${opp.deadline.split(',')[0]}</div>` : ''}
    `;

    return li;
  };

  const renderDetailView = (opp) => {
    const detailContainer = document.getElementById('extopp-detail');
    if (!opp) {
      detailContainer.innerHTML = `<div class="empty-state">Select an opportunity to view details</div>`;
      return;
    }

    let actionButtons = '';

    if (opp.applyLink) {
      actionButtons += `<a href="${opp.applyLink}" target="_blank" class="btn btn-primary">Apply Now</a>`;
    } else {
      actionButtons += `<button class="btn btn-primary" disabled style="opacity:0.6; cursor:not-allowed;">Apply (Link Not Specified)</button>`;
    }

    if (opp.jdLink && opp.jdLink !== opp.applyLink) {
      actionButtons += `<a href="${opp.jdLink}" target="_blank" class="btn btn-secondary">View JD</a>`;
    }

    detailContainer.innerHTML = `
      <div class="extopp-detail-header">
        <div class="extopp-detail-header-info">
            <h1>${opp.title}</h1>
            <h2>${opp.orgName} • ${opp.location || 'Location Not Specified'}</h2>
            
             <div class="extopp-deadline-banner">
                <i class="fi fi-rr-clock"></i>
                <span>Applications close on <strong>${opp.deadline}</strong></span>
            </div>
        </div>
        <div class="extopp-actions">
            ${actionButtons}
        </div>
      </div>

      <div class="extopp-section">
        <h3>Overview</h3>
        <div class="overview-grid">
            <div class="overview-item">
                <label>Category</label>
                <span>${opp.workArrangement}</span>
            </div>
            <div class="overview-item">
                <label>Compensation</label>
                <span>${opp.compensation}</span>
            </div>
            <div class="overview-item">
                <label>Duration</label>
                <span>${opp.duration}</span>
            </div>
            <div class="overview-item">
                <label>Eligibility/Skills</label>
                <span>${opp.skills}</span>
            </div>
        </div>
      </div>

      <div class="extopp-section">
        <h3>Job Description</h3>
        <div class="description-content">
            ${opp.description}
        </div>
      </div>
      
      <div style="margin-top: 3rem; font-size: 0.8rem; color: #999; text-align: center;">
        Posted by ${opp.posterName}
      </div>
    `;
  };

  const populateOpportunities = async () => {
    const container = document.getElementById(CUSTOM_DIV_ID);
    if (!container) return;

    // STATE
    const cached = loadFromCache();
    let allOpps = cached || [];
    let selectedId = null;
    let visibleLimit = BATCH_SIZE;

    // Helper to render current state
    const renderCoreList = () => {
      const listContainer = document.getElementById('extopp-list');
      const loadMoreContainer = document.getElementById('extopp-load-more-container');
      const loadMoreBtn = document.getElementById('extopp-load-more-btn');

      if (!allOpps.length) {
        if (!container.innerHTML || container.innerHTML.includes('Loading')) {
          container.innerHTML = '<div style="padding:2rem; color:red;">No external opportunities found at this time.</div>';
        }
        return;
      }

      if (!document.getElementById('extopp-list')) {
        renderLayout(container);

        document.getElementById('extopp-load-more-btn').addEventListener('click', () => {
          visibleLimit += BATCH_SIZE;
          renderCoreList();
        });
      }

      const currentListContainer = document.getElementById('extopp-list');
      const currentLoadMoreContainer = document.getElementById('extopp-load-more-container');

      // Selection Logic
      if (!selectedId && allOpps.length > 0) selectedId = allOpps[0].id;
      const exists = allOpps.find(o => o.id === selectedId);
      if (!exists && allOpps.length > 0) selectedId = allOpps[0].id;

      // Render List Items
      currentListContainer.innerHTML = '';
      const itemsToShow = allOpps.slice(0, visibleLimit);

      itemsToShow.forEach(opp => {
        const li = renderSidebarItem(opp, opp.id === selectedId);
        li.addEventListener('click', () => {
          selectedId = opp.id;
          Array.from(currentListContainer.children).forEach(child => child.classList.remove('selected'));
          li.classList.add('selected');
          renderDetailView(opp);
        });
        currentListContainer.appendChild(li);
      });

      // Toggle Load More
      if (visibleLimit < allOpps.length) {
        currentLoadMoreContainer.style.display = 'block';
      } else {
        currentLoadMoreContainer.style.display = 'none';
      }

      // Detail View Logic
      const detailContainer = document.getElementById('extopp-detail');
      if (selectedId && (detailContainer.innerHTML.includes('Select an opportunity') || !detailContainer.querySelector('h1'))) {
        const selectedOpp = allOpps.find(o => o.id === selectedId);
        if (selectedOpp) renderDetailView(selectedOpp);
      }
    };

    // 1. Initial Render with Cache
    if (allOpps.length > 0) {
      renderCoreList();
    } else {
      container.innerHTML = '<div style="padding:2rem;">Loading opportunities...</div>';
    }

    // 2. Fetch fresh data
    const freshOpps = await fetchFromNetwork();

    if (freshOpps) {
      allOpps = freshOpps;
      renderCoreList();
      console.log('[ExtOpp] UI updated with fresh data.');
    } else if (!allOpps.length) {
      container.innerHTML = '<div style="padding:2rem; color:red;">Failed to load opportunities. Please try again later.</div>';
    }
  };

  /*───────────────────────────────────
   * NAVIGATION & APP LOGIC
   *───────────────────────────────────*/
  const showCustomDiv = () => {
    const main = document.querySelector('main');
    if (main && main.firstElementChild) {
      Array.from(main.children).forEach(child => {
        if (child.id !== CUSTOM_DIV_ID) child.style.display = 'none';
      });
    }

    let customDiv = document.getElementById(CUSTOM_DIV_ID);
    if (!customDiv) {
      customDiv = document.createElement('div');
      customDiv.id = CUSTOM_DIV_ID;
      main.appendChild(customDiv);
      injectStyles();
    }
    customDiv.style.display = 'flex';
    populateOpportunities();
  };

  const hideCustomDiv = () => {
    const main = document.querySelector('main');
    if (!main) return;

    Array.from(main.children).forEach(child => {
      if (child.id !== CUSTOM_DIV_ID) {
        child.style.display = '';
      }
    });

    const customDiv = document.getElementById(CUSTOM_DIV_ID);
    if (customDiv) customDiv.style.display = 'none';
  };

  const clearActiveStyles = () => {
    const liItem = document.getElementById(ITEM_ID);
    const navDiv = document.getElementById(NAV_DIV_ID);

    if (liItem) {
      liItem.style.borderLeft = '';
      liItem.style.backgroundColor = '';
    }
    if (navDiv) navDiv.classList.remove('active');
  };

  const updateActiveFromUrl = () => {
    // 1. Aggressive Cleanup of Siblings (Visual only)
    const allLists = document.querySelectorAll(MENU_SELECTOR);
    allLists.forEach(list => {
      const items = list.querySelectorAll('li');
      items.forEach(li => {
        if (li.id !== ITEM_ID) { // Don't touch our item here
          li.classList.remove('Mui-selected');
          li.classList.remove('active');
          li.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
          li.querySelectorAll('.Mui-selected').forEach(el => el.classList.remove('Mui-selected'));
        }
      });
    });

    const liItem = document.getElementById(ITEM_ID);
    const navDiv = document.getElementById(NAV_DIV_ID);

    // 2. Set Active State for External Opps
    if (window.location.pathname === TARGET_URL) {
      if (navDiv) navDiv.classList.add('active');

      // Manually apply ONLY the bar (Left Border), NO background as requested
      if (liItem) {
        liItem.style.borderLeft = '4px solid #3B32B3';
        liItem.style.backgroundColor = ''; // Ensure no bg
      }
      showCustomDiv();
    } else {
      // Deactivate
      clearActiveStyles();
      hideCustomDiv();
    }
  };

  const attachClickListeners = () => {
    const items = document.querySelectorAll(`${MENU_SELECTOR} li`);
    items.forEach(li => {
      if (li.id !== ITEM_ID && !li.hasAttribute('data-extopp-watcher')) {
        li.addEventListener('click', () => {
          hideCustomDiv();
          clearActiveStyles();
        });
        li.setAttribute('data-extopp-watcher', 'true');
      }
    });
  };

  const injectSidebarItem = (menu) => {
    if (document.getElementById(ITEM_ID)) return;

    const li = document.createElement('li');
    li.id = ITEM_ID;
    li.className = 'MuiListItem-root MuiListItem-gutters MuiListItem-padding css-1oy62c2';
    li.innerHTML = `
      <div id="${NAV_DIV_ID}" class="MuiListItemIcon-root css-g1kwld" style="cursor:pointer">
        <i class="fi fi-rr-globe text-base"></i>
        <p class="!text-center !text-xs !max-w-[75px] !break-words !pt-0.5 text-dark">
          External Opportunities
        </p>
      </div>
    `;

    li.addEventListener('click', e => {
      e.preventDefault();
      window.history.pushState({}, '', TARGET_URL);
      updateActiveFromUrl();
    });

    menu.children.length >= 2
      ? menu.insertBefore(li, menu.children[2])
      : menu.appendChild(li);

    attachClickListeners();
  };

  const waitForSidebar = () => {
    const menu = document.querySelector(MENU_SELECTOR);
    if (menu) {
      injectSidebarItem(menu);
      attachClickListeners();
    } else if (++attempts < MAX_ATTEMPTS) {
      setTimeout(waitForSidebar, 500);
    } else {
      console.warn('[ExtOpp] Sidebar not found.');
      updateActiveFromUrl();
    }
  };

  window.addEventListener('popstate', updateActiveFromUrl);

  const observer = new MutationObserver(() => {
    if (document.querySelector(MENU_SELECTOR)) {
      if (!document.getElementById(ITEM_ID)) {
        waitForSidebar();
      } else {
        attachClickListeners();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', updateActiveFromUrl);
  waitForSidebar();
})();