// Household Resilience Dashboard JavaScript

let refreshInterval = null;
let currentData = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    refreshStatus();
    // Auto-refresh every 60 seconds
    refreshInterval = setInterval(refreshStatus, 60000);
});

// Refresh status from API
async function refreshStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        currentData = data;
        updateDashboard(data);
    } catch (error) {
        console.error('Failed to fetch status:', error);
        showError('Failed to connect to monitoring system');
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    // Update last update time
    const lastUpdate = new Date(data.timestamp);
    document.getElementById('last-update').textContent = 
        `Last Update: ${lastUpdate.toLocaleString()}`;
    
    // Update system status indicator
    const statusIndicator = document.getElementById('system-status');
    statusIndicator.className = 'status-indicator green';
    
    // Update alert banner
    const alertBanner = document.getElementById('alert-banner');
    const redCount = document.getElementById('red-count');
    const overallStatus = document.getElementById('overall-status');
    const activeAlerts = document.getElementById('active-alerts');
    
    if (data.tighten_up) {
        alertBanner.classList.remove('hidden');
        redCount.textContent = data.red_count;
        overallStatus.textContent = 'TIGHTEN-UP ACTIVE';
        overallStatus.className = 'value red';
    } else {
        alertBanner.classList.add('hidden');
        overallStatus.textContent = 'Normal Monitoring';
        overallStatus.className = 'value green';
    }
    
    activeAlerts.textContent = data.red_count;
    
    // Update indicators grid
    updateIndicators(data.indicators);
}

// Update individual indicators
function updateIndicators(indicators) {
    const grid = document.getElementById('indicators-grid');
    grid.innerHTML = '';
    
    indicators.forEach(indicator => {
        const card = createIndicatorCard(indicator);
        grid.appendChild(card);
    });
}

// Get data source badge
function getDataSourceBadge(indicator) {
    // Check metadata for source
    const metadata = currentData?.indicators?.find(i => i.name === indicator.name)?.metadata || {};
    const source = metadata.source || 'unknown';
    
    let badgeClass = 'mock';
    let badgeText = 'MOCK';
    
    if (source.includes('API') || source === 'news_analysis') {
        badgeClass = 'live';
        badgeText = 'LIVE';
    } else if (source === 'manual_input') {
        badgeClass = 'manual';
        badgeText = 'MANUAL';
    }
    
    return `<span class="data-source ${badgeClass}">${badgeText}</span>`;
}

// Create indicator card element
function createIndicatorCard(indicator) {
    const card = document.createElement('div');
    card.className = `indicator-card status-${indicator.level}`;
    
    // Get friendly names
    const friendlyNames = {
        'Treasury': 'Treasury Market',
        'ICEDetention': 'ICE Detention',
        'TaiwanZone': 'Taiwan Strait',
        'HormuzRisk': 'Hormuz Shipping',
        'DoDAutonomy': 'DoD Systems',
        'MBridge': 'mBridge Currency',
        'JoblessClaims': 'Unemployment Surge',
        'LuxuryCollapse': 'Rich People Fleeing',
        'PharmacyShortage': 'Medicine Shortages',
        'SchoolClosures': 'Schools Closing',
        'AGIMilestones': 'AI Progress to AGI',
        'LaborDisplacement': 'Jobs Lost to AI'
    };
    
    const descriptions = {
        'Treasury': 'When the government borrows money, this shows if investors are worried',
        'ICEDetention': 'How full immigration detention centers are',
        'TaiwanZone': 'Military activity near Taiwan that could affect global trade',
        'HormuzRisk': 'Cost to insure ships through this critical oil route',
        'DoDAutonomy': 'How many AI-controlled military systems are deployed',
        'MBridge': 'Countries using alternatives to the US Dollar for trade',
        'JoblessClaims': 'Weekly unemployment filings - surge means layoffs spreading',
        'LuxuryCollapse': 'Rich selling luxury goods - they know something bad is coming',
        'PharmacyShortage': 'Critical medications unavailable at pharmacies',
        'SchoolClosures': 'Major school districts closed (not for weather)',
        'AGIMilestones': 'How close AI is to human-level capabilities across all domains',
        'LaborDisplacement': 'Percentage of jobs being automated away by AI systems'
    };
    
    const whyItMatters = {
        'Treasury': 'High numbers = financial stress → bank problems → your money at risk',
        'ICEDetention': 'Full facilities = social tension → possible unrest → supply disruptions',
        'TaiwanZone': 'More activity = chip shortage risk → electronics/cars unavailable',
        'HormuzRisk': 'Higher cost = oil supply threatened → gas prices spike → inflation',
        'DoDAutonomy': 'More AI weapons = unpredictable conflicts → global instability',
        'MBridge': 'Dollar alternatives growing = US economic power declining → inflation',
        'JoblessClaims': 'Mass layoffs → recession → mortgage crisis → bank failures',
        'LuxuryCollapse': 'Smart money fleeing → major crisis incoming → get ready',
        'PharmacyShortage': 'No meds → mental health crisis → social breakdown',
        'SchoolClosures': 'Parents cant work → economic disruption → cascade effects',
        'AGIMilestones': 'Near AGI = job obsolescence → social upheaval → need new systems',
        'LaborDisplacement': 'Mass unemployment → no income → cant pay bills → social collapse'
    };
    
    card.innerHTML = `
        <div class="indicator-header">
            <span class="indicator-name">${friendlyNames[indicator.name] || indicator.name}</span>
            <span class="indicator-status ${indicator.level}">●</span>
        </div>
        <div class="indicator-value">
            ${indicator.value}
            ${getDataSourceBadge(indicator)}
        </div>
        <div class="indicator-details">
            <div class="what-is-it">${descriptions[indicator.name] || ''}</div>
            <div class="why-it-matters">
                <strong>Why it matters:</strong> ${whyItMatters[indicator.name] || ''}
            </div>
        </div>
        <div class="indicator-threshold">
            Status: <strong class="${indicator.level}">${indicator.level.toUpperCase()}</strong>
        </div>
    `;
    
    return card;
}

// Test alert function
function testAlert() {
    if (confirm('Send a test alert email to verify the system is working?')) {
        alert('Test alert feature coming soon!');
        // TODO: Implement test alert API endpoint
    }
}

// Show error message
function showError(message) {
    const lastUpdate = document.getElementById('last-update');
    lastUpdate.textContent = `Error: ${message}`;
    lastUpdate.style.color = 'var(--danger-color)';
    
    const statusIndicator = document.getElementById('system-status');
    statusIndicator.className = 'status-indicator red';
}