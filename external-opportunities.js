(() => {
  console.log('[ExtOpp] Script loaded.');
  
  /*───────────────────────────────────
   * CONFIG (MODIFIED FOR APPS SCRIPT API)
   *───────────────────────────────────*/
  const MENU_SELECTOR   = 'ul.MuiList-root.MuiList-padding.css-1wduhak';
  const ITEM_ID         = 'external-opportunities';
  const NAV_DIV_ID      = 'external-opportunities-nav';
  const CUSTOM_DIV_ID   = 'external-opps-root';
  const TARGET_URL      = '/students/external-opportunities';
  
  // NOTE: API configuration is now moved to the background script to handle CORS
  
  const MAX_ATTEMPTS    = 20;

  let attempts = 0;
  let cachedOpps = null;   // cache results so we fetch only once

  /*───────────────────────────────────
   * DATA FETCHING (MODIFIED TO USE MESSAGING)
   *───────────────────────────────────*/
  
  /**
   * Fetches opportunities by sending a message to the background script.
   * This bypasses the browser's CORS restriction.
   * @returns {Promise<Array<Object>>} Array of opportunity objects.
   */
  const fetchOpportunities = async () => {
    if (cachedOpps) return cachedOpps;
    
    try {
      // Send a message to the background script asking it to fetch data
      const response = await chrome.runtime.sendMessage({ action: "fetchOpportunities" });
      
      console.log('[ExtOpp] Received response:', response);
      
      // Check for errors returned from the background script
      if (response && response.error) {
        console.error('[ExtOpp] Background fetch error:', response.message);
        throw new Error(response.message);
      }

      // The API returns an array directly
      const opps = Array.isArray(response) ? response : [];
      
      if (opps.length === 0) {
        console.warn('[ExtOpp] No opportunities found in response');
      }

      cachedOpps = opps; 
      return cachedOpps;

    } catch (err) {
      console.error('[ExtOpp] Fetch request failed (via messaging):', err);
      // Update the container to show the failure message
      const container = document.getElementById(CUSTOM_DIV_ID);
      if (container) {
          container.innerHTML = '<p style="color:red;">Error fetching data. Check background script logs for API issues.</p>';
      }
      return [];
    }
  };

  /*───────────────────────────────────
   * STYLING (UNCHANGED)
   *───────────────────────────────────*/
  const injectStyles = () => {
    if (document.getElementById('extopp-styles')) return;
    const style = document.createElement('style');
    style.id = 'extopp-styles';
    style.textContent = `
      #${CUSTOM_DIV_ID}       { 
        padding: 2rem; 
        font-family: system-ui, -apple-system, sans-serif; 
        width: 100%; 
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .extopp-card { 
        border: 1px solid #e0e0e0; 
        border-radius: 12px; 
        padding: 1.5rem;
        margin-bottom: 1.5rem; 
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }
      
      .extopp-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
      }
      
      .extopp-card h2 { 
        font-size: 1.35rem; 
        margin: 0 0 0.5rem; 
        color: #1a1a1a;
        font-weight: 600;
      }
      
      .extopp-card p { 
        margin: 0.4rem 0; 
        font-size: 0.95rem; 
        color: #555; 
        line-height: 1.5; 
      }
      
      .extopp-card a { 
        display: inline-block; 
        margin-top: 0.75rem; 
        padding: 0.5rem 1.25rem;
        background: #0066cc;
        color: white;
        text-decoration: none;
        font-weight: 500;
        border-radius: 6px;
        transition: background 0.2s ease;
      }
      
      .extopp-card a:hover { 
        background: #0052a3;
        text-decoration: none;
      }
     
      .extopp-header {
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f0f0f0;
      }

      .extopp-meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }

      .extopp-avatar img {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e0e0e0;
      }

      .poster-name {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
      }
    `;
    document.head.appendChild(style);
  };

  /*───────────────────────────────────
   * CARD RENDERING (UNCHANGED)
   *───────────────────────────────────*/
  const renderCard = (opp) => {
    const card = document.createElement('div');
    card.className = 'extopp-card';

    // Map the field names from the API response
    const title     = opp['opportunityTitle'] || 'Untitled Opportunity'; 
    const orgName   = opp['orgName'] || 'Unknown Organization';
    const poster    = opp['responderEmail'] || 'Unknown'; 
    const skills    = opp['elibigilityRestrictions'] || '—'; 
    const pay       = opp['compensationType'] || '—';
    const wType     = opp['workArrangement'] || '—';
    const duration  = opp['duration'] || '—'; 
    const deadline  = opp['deadline'] || '?';
    const link      = opp['toApply'] || ''; // Application Link
    
    // Attempt to format startDate (it comes as a JS Date object converted to a string in the API)
    const startDateRaw = opp['startDate'];
    let startDisplay = '?';
    if (startDateRaw) {
      try {
        startDisplay = new Date(startDateRaw).toLocaleDateString();
      } catch (e) {
        startDisplay = startDateRaw;
      }
    }
    
    // Use the description fields, merged by the Apps Script
    const longDesc = opp['jdText'] || opp['additionalDetails'] || 'No description provided.'; 

    // Generate a name from the email for the avatar/poster display
    const posterName = poster.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(posterName)}&background=random&size=128&bold=true`;

    card.innerHTML = `
      <div class="extopp-header">
        <h2>${title}</h2>
        <p style="margin:0.25rem 0 0.5rem; color:#666; font-size:0.95rem;"><strong>Organization:</strong> ${orgName}</p>
        <div class="extopp-meta">
          <div class="extopp-avatar">
            <img src="${avatarUrl}" alt="Avatar of ${posterName}" />
          </div>
          <p class="poster-name"><strong>Posted By:</strong> ${posterName}</p>
        </div>
      </div>

      <p><strong>Eligibility/Skills:</strong> ${skills}</p>
      <p><strong>Compensation:</strong> ${pay}</p>
      <p><strong>Work Arrangement:</strong> ${wType}</p>
      <p><strong>Duration:</strong> ${duration}</p>
      <p><strong>Start Date:</strong> ${startDisplay}</p>
      <p><strong>Deadline:</strong> ${deadline}</p>

      ${longDesc ? `<p style="margin-top:0.75rem;"><strong>Description:</strong><br>${longDesc}</p>` : ''}
      ${link ? `<a href="${link}" target="_blank" rel="noopener">Apply Now →</a>` : ''}
    `;

    return card;
  };


  const populateOpportunities = async () => {
    const container = document.getElementById(CUSTOM_DIV_ID);
    if (!container) return;

    container.innerHTML = '<p>Loading opportunities…</p>';
    const opps = await fetchOpportunities();

    if (!opps.length) {
      container.innerHTML = '<p style="color:red;">No opportunities found or failed to load data (check background console).</p>';
      return;
    }

    container.innerHTML = '';
    opps.forEach(o => container.appendChild(renderCard(o)));
  };

  /*───────────────────────────────────
   * SHOW / HIDE CUSTOM DIV (UNCHANGED)
   *───────────────────────────────────*/
  const showCustomDiv = () => {
    const main = document.querySelector('main');
    const mainChild = main?.firstElementChild;
    if (mainChild) mainChild.style.display = 'none';

    let customDiv = document.getElementById(CUSTOM_DIV_ID);
    if (!customDiv) {
      customDiv = document.createElement('div');
      customDiv.id = CUSTOM_DIV_ID;
      main.appendChild(customDiv);
      injectStyles();
    }
    customDiv.style.display = 'block';
    populateOpportunities();
  };

  const hideCustomDiv = () => {
    const main = document.querySelector('main');
    const mainChild = main?.firstElementChild;
    if (mainChild) mainChild.style.display = 'block';

    const customDiv = document.getElementById(CUSTOM_DIV_ID);
    if (customDiv) customDiv.style.display = 'none';
  };

  /*───────────────────────────────────
   * NAV STATE HELPERS (UNCHANGED)
   *───────────────────────────────────*/
  const updateActiveFromUrl = () => {
    document
      .querySelectorAll(`${MENU_SELECTOR} .MuiListItemIcon-root`)
      .forEach(div => div.classList.remove('active'));

    const navDiv = document.getElementById(NAV_DIV_ID);
    if (navDiv && window.location.pathname === TARGET_URL) {
      navDiv.classList.add('active');
      showCustomDiv();
    } else {
      hideCustomDiv();
    }
  };

  const updateActiveOnClick = (clickedLi) => {
    document
      .querySelectorAll(`${MENU_SELECTOR} li .MuiListItemIcon-root`)
      .forEach(div => div.classList.remove('active'));

    clickedLi.querySelector('.MuiListItemIcon-root')?.classList.add('active');
    hideCustomDiv();                       
  };

  const attachClickListeners = () => {
    document.querySelectorAll(`${MENU_SELECTOR} li`).forEach(li => {
      if (!li.hasAttribute('data-active-watcher')) {
        li.addEventListener('click', () => updateActiveOnClick(li));
        li.setAttribute('data-active-watcher', 'true');
      }
    });
  };

  /*───────────────────────────────────
   * SIDEBAR INJECTION (UNCHANGED)
   *───────────────────────────────────*/
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
      window.location.href = TARGET_URL;   
    });

    menu.children.length >= 2
      ? menu.insertBefore(li, menu.children[2]) 
      : menu.appendChild(li);

    attachClickListeners();
    updateActiveFromUrl();
  };

  /*───────────────────────────────────
   * BOOTSTRAP (UNCHANGED)
   *───────────────────────────────────*/
  const waitForSidebar = () => {
    const menu = document.querySelector(MENU_SELECTOR);
    if (menu) {
      injectSidebarItem(menu);
    } else if (++attempts < MAX_ATTEMPTS) {
      setTimeout(waitForSidebar, 500);
    } else {
      console.warn('[ExtOpp] Sidebar not found.');
    }
  };

  window.addEventListener('DOMContentLoaded', updateActiveFromUrl);
  waitForSidebar();
})();