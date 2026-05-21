(() => {
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
    /*
     * The new REST API uses a dedicated boolean `isRolling` field.
     * Fall back to checking the deadline string for legacy safety.
     */
    const processDeadline = (d, isRolling) => {
      if (isRolling) return { text: 'Rolling', type: 'rolling' };
      if (!d || d === 'Not Specified') return { text: 'Unknown', type: 'unknown' };
      const dLower = d.toLowerCase();
      if (dLower.includes('rolling')) return { text: 'Rolling', type: 'rolling' };

      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return { text: d, type: 'unknown' };

        // Requirements: Date based deadlines should show the date rather than the day.
        // removing 'weekday' from the format
        return {
          text: date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          type: 'date'
        };
      } catch (e) {
        return { text: d, type: 'unknown' };
      }
    };

    const dl = processDeadline(raw['deadline'], raw['isRolling']);

    // Skills may be a JSON array or a comma-separated string from the API
    const rawSkills = raw['skills'];
    let skillsText = 'Not Specified';
    if (Array.isArray(rawSkills) && rawSkills.length > 0) {
      skillsText = rawSkills.join(', ');
    } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
      skillsText = rawSkills;
    }

    // Best proxy for location is work_arrangement (Onsite / Hybrid / Remote)
    const locationProxy = safeGet(raw, 'work_arrangement', 'Not Specified');

    return {
      id: raw.id || Math.random().toString(36).substr(2, 9),
      // ── Core identity ──────────────────────────────────────────────────────
      title: safeGet(raw, 'title', 'Untitled Role'),
      orgName: safeGet(raw, 'recruiting_body', 'Unknown Organization'),
      location: locationProxy,
      opportunityType: safeGet(raw, 'category', 'Not Specified'),
      // ── Deadline ───────────────────────────────────────────────────────────
      deadline: dl.text,
      deadlineType: dl.type,
      deadlineRaw: raw['isRolling'] ? 'rolling' : (raw['deadline'] || null),
      postedDate: raw['start_date'] || null,
      // ── Overview grid fields ────────────────────────────────────────────────
      skills: skillsText,
      compensation: safeGet(raw, 'compensation_type', safeGet(raw, 'compensation', 'Not Specified')),
      workArrangement: locationProxy,
      duration: (raw['duration_weeks'] && raw['duration_weeks'] !== 'Not Specified')
        ? (isNaN(raw['duration_weeks']) ? raw['duration_weeks'] : `${raw['duration_weeks']} weeks`)
        : safeGet(raw, 'duration', 'Not Specified'),
      // ── Description ────────────────────────────────────────────────────────
      description: safeGet(raw, 'job_description') !== 'Not Specified'
        ? raw['job_description']
        : (safeGet(raw, 'eligibility_restrictions') !== 'Not Specified'
          ? raw['eligibility_restrictions']
          : 'No additional details provided.'),
      // ── Links ──────────────────────────────────────────────────────────────
      applyLink: raw['apply_url'] || raw['apply_method'] || null,
      jdLink: raw['jd_link'] || null,
      // ── Submitter ──────────────────────────────────────────────────────────
      posterName: safeGet(raw, 'submitter_email', 'Anonymous'),
      posterEmail: safeGet(raw, 'submitter_email', '')
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

  // Matches client.js configuration
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://connect-placecom.vercel.app/api";

  const fetchFromNetwork = async () => {
    try {
      /*
       * Fetch directly from the content script. Since the endpoint is now public
       * we don't need any API key, and by doing it client-side we seamlessly 
       * satisfy the origin constraints.
       */
      const res = await fetch(`${BASE_URL}/duperset/external-opportunities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log("[ExtOpp] Temp Request Data Log:", data);

      if (!data.success || !Array.isArray(data.opportunities)) {
        throw new Error('Unexpected response shape from external-opportunities API');
      }

      const rawList = data.opportunities;
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
        flex-direction: column;
        gap: 1rem;
        overflow: hidden;
      }

      .extopp-disclaimer {
        background: #143a5e;
        border: 1px solid #2a2391;
        color: #ffffff;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(59, 50, 179, 0.2);
        flex-shrink: 0;
        opacity: 80%;
      }
      .extopp-disclaimer i {
        color: #ffffff;
      }

      .extopp-main-wrapper {
        display: flex;
        gap: 1rem;
        flex: 1;
        overflow: hidden;
      }

      .extopp-refresh-btn {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #3B32B3;
        border-radius: 4px;
        transition: background-color 0.2s, transform 0.2s;
      }
      .extopp-refresh-btn:hover {
        background-color: #f0f4ff;
      }
      .extopp-refresh-btn:active {
        transform: scale(0.9);
      }
      .extopp-refresh-btn.spinning i {
        display: inline-block;
        animation: spin 0.8s linear infinite;
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
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .extopp-sidebar-header h3 {
        margin: 0;
        color: #3B32B3;
        font-size: 1.1rem;
      }

      /* Loader Indicator */
      .extopp-refresh-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #666;
        padding: 0.25rem 0.5rem;
        background: #f0f4ff;
        border-radius: 4px;
        border: 1px solid #dbeafe;
      }
      .extopp-refresh-indicator.hidden {
        display: none;
      }
      .extopp-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid #e0e0e0;
        border-top-color: #3B32B3;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
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
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      .extopp-item-deadline.rolling { color: #d9534f; background: #fff0f0; border: 1px solid #ffdada; }
      .extopp-item-deadline.unknown { color: #666; background: #e3eaf0ff; border: 1px solid rgba(123, 161, 196, 1); }
      .extopp-item-deadline.date { color: #856404; background: #fff3cd; border: 1px solid #ffeeba; }

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
        border-radius: 6px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .extopp-deadline-banner.rolling { background: #fff0f0; border: 1px solid #ffdada; color: #d9534f; }
      .extopp-deadline-banner.unknown { background: #e3eaf0ff; border: 1px solid rgba(123, 161, 196, 1); color: #666; }
      .extopp-deadline-banner.date { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; }

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
      <div class="extopp-disclaimer">
        <i class="fi fi-rr-exclamation-octagon"></i>
        <span><b>Disclaimer:</b> The opportunities listed below are shared via Ashoka email IDs and are not verified by the Placement Committee or the CDO. Students are advised to exercise discretion before applying.</span>
      </div>
      <div class="extopp-main-wrapper">
        <div class="extopp-sidebar">
          <div class="extopp-sidebar-header">
             <div style="display: flex; align-items: center; gap: 8px;">
               <h3>All Opportunities</h3>
               <button id="extopp-refresh-btn" class="extopp-refresh-btn" title="Refresh opportunities">
                 <i class="fi fi-rr-refresh"></i>
               </button>
             </div>
             <div class="extopp-refresh-indicator hidden" id="extopp-refresh-indicator">
               <div class="extopp-spinner"></div>
               <span>Fetching Latest Opportunities...</span>
             </div>
          </div>
          <div class="extopp-list-wrapper">
              <ul class="extopp-list" id="extopp-list"></ul>
          </div>
          <div class="extopp-sidebar-footer" id="extopp-load-more-container" style="display:none;">
              <button class="load-more-btn" id="extopp-load-more-btn">Load More Opportunities</button>
          </div>
        </div>
        <div class="extopp-detail-view" id="extopp-detail">
          <div class="empty-state">Select an opportunity to view details</div>
        </div>
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
      ${opp.deadlineRaw ? `<div class="extopp-item-deadline ${opp.deadlineType}">Deadline: ${opp.deadline.split(',')[0]}</div>` : ''}
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



    const deadlineBannerText = opp.deadlineType === 'rolling'
      ? 'Applications accepted on a <strong>rolling basis</strong>'
      : `Applications close on <strong>${opp.deadline}</strong>`;

    let jdSectionContent = '';
    if (opp.jdLink) {
      jdSectionContent = `
        <div style="border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #fafafa; box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 100%;">
          <div style="padding: 1rem 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #3B32B3; font-weight: 600;">
              <i class="fi fi-rr-document"></i>
              <span>Official Job Description Preview</span>
            </div>
            <a href="${opp.jdLink}" target="_blank" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px;">Open Full Document <i class="fi fi-rr-arrow-up-right" style="margin-left: 4px; font-size: 0.7rem;"></i></a>
          </div>
          <div style="height: 650px; position: relative; background: #fff;">
            <iframe src="${opp.jdLink}" style="width: 100%; height: 100%; border: none;" title="Job Description View"></iframe>
          </div>
        </div>
      `;
    } else {
      jdSectionContent = `<div class="description-content">${opp.description}</div>`;
    }

    detailContainer.innerHTML = `
      <div class="extopp-detail-header">
        <div class="extopp-detail-header-info">
            <h1>${opp.title}</h1>
            <h2>${opp.orgName} • ${opp.opportunityType} • ${opp.location || 'Location Not Specified'}</h2>
            
             <div class="extopp-deadline-banner ${opp.deadlineType}">
                <i class="fi fi-rr-clock"></i>
                <span>${deadlineBannerText}</span>
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
                <label>Opportunity Type</label>
                <span>${opp.opportunityType}</span>
            </div>
            <div class="overview-item">
                <label>Category (Arrangement)</label>
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

      <div class="extopp-section" style="width: 100%;">
        <h3>${opp.jdLink ? 'Official Job Description' : 'Job Description'}</h3>
        ${jdSectionContent}
      </div>
      
      <div style="margin-top: 3rem; font-size: 0.8rem; color: #999; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 1.5rem;">
        Posted by <strong>${opp.posterName}</strong>
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

    // Helper to fetch from network and update
    const performRefresh = async () => {
      const refreshBtn = document.getElementById('extopp-refresh-btn');
      const refreshIndicator = document.getElementById('extopp-refresh-indicator');

      if (refreshBtn) refreshBtn.classList.add('spinning');
      if (refreshIndicator) refreshIndicator.classList.remove('hidden');

      const freshOpps = await fetchFromNetwork();

      if (refreshBtn) refreshBtn.classList.remove('spinning');
      if (refreshIndicator) refreshIndicator.classList.add('hidden');

      if (freshOpps) {
        allOpps = freshOpps;
        renderCoreList();
        console.log('[ExtOpp] UI refreshed manually.');
      }
    };

    // Render Layout First
    if (!document.getElementById('extopp-list')) {
      renderLayout(container);

      document.getElementById('extopp-load-more-btn').addEventListener('click', () => {
        visibleLimit += BATCH_SIZE;
        renderCoreList();
      });

      const refreshBtn = document.getElementById('extopp-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', performRefresh);
      }
    }

    // Helper to render current state
    const renderCoreList = () => {
      const currentListContainer = document.getElementById('extopp-list');
      const currentLoadMoreContainer = document.getElementById('extopp-load-more-container');
      const detailContainer = document.getElementById('extopp-detail');

      if (!currentListContainer) return;

      if (!allOpps.length) {
        currentListContainer.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: #7f8c8d; font-size: 0.95rem;">
            No available opportunities.
          </div>
        `;
        currentLoadMoreContainer.style.display = 'none';
        detailContainer.innerHTML = `<div class="empty-state">No opportunity selected</div>`;
        return;
      }

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
      if (selectedId && (detailContainer.innerHTML.includes('Select an opportunity') || !detailContainer.querySelector('h1'))) {
        const selectedOpp = allOpps.find(o => o.id === selectedId);
        if (selectedOpp) renderDetailView(selectedOpp);
      }
    };

    // 1. Initial Render with Cache or loading placeholder
    if (allOpps.length > 0) {
      renderCoreList();
    } else {
      const currentListContainer = document.getElementById('extopp-list');
      if (currentListContainer) {
        currentListContainer.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: #7f8c8d; font-size: 0.95rem;">
            Loading opportunities...
          </div>
        `;
      }
    }

    // 2. Fetch fresh data in the background
    const refreshIndicator = document.getElementById('extopp-refresh-indicator');
    if (allOpps.length > 0 && refreshIndicator) {
      refreshIndicator.classList.remove('hidden');
    }

    const freshOpps = await fetchFromNetwork();

    // Hide loader
    if (refreshIndicator) {
      refreshIndicator.classList.add('hidden');
    }

    if (freshOpps) {
      allOpps = freshOpps;
      renderCoreList();
      console.log('[ExtOpp] UI updated with fresh data.');
    } else if (!allOpps.length) {
      const currentListContainer = document.getElementById('extopp-list');
      if (currentListContainer) {
        currentListContainer.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: #d9534f; font-size: 0.95rem;">
            Failed to load opportunities. Please try again later.
          </div>
        `;
      }
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