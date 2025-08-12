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
    const lastUpdateEl = document.getElementById('last-update');
    lastUpdateEl.textContent = lastUpdate.toLocaleTimeString();
    
    // Update system status indicator
    const statusIndicator = document.getElementById('system-status');
    statusIndicator.textContent = '● Online';
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
        overallStatus.className = 'value';
    }
    
    activeAlerts.textContent = data.red_count;
    activeAlerts.className = data.red_count > 0 ? 'value red' : 'value';
    
    // Update phase information if available
    if (data.current_phase !== undefined && data.phase_info) {
        updatePhaseDisplay(data.current_phase, data.phase_info);
    }
    
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
    
    if (source.includes('API') || source === 'news_analysis' || 
        source === 'CISA_KEV' || source === 'DOE_OE417' || 
        source === 'BLS_API' || source === 'FRED_API' ||
        source === 'alpha_vantage_api' || source === 'cornell_ilr' ||
        source === 'legiscan_api' || source === 'ACLED_API' ||
        source === 'yahoo_finance' || source === 'WHO_RSS' ||
        source === 'CREA_tracker' || source === 'OFAC_SDN' ||
        source === 'layoffs_tracker' || source === 'BIS_mBridge' ||
        source === 'JODI_API' || source === 'CISA_ICS' || 
        source === 'composite') {
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
    
    // Add click handler for modal
    card.addEventListener('click', () => showIndicatorDetails(indicator));
    
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
        'LaborDisplacement': 'Jobs Lost to AI',
        'GroceryCPI': 'Food Inflation',
        'CISACyber': 'Cyber Threats',
        'GridOutages': 'Power Grid Failures',
        'GDPGrowth': 'Economic Growth'
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
        'LaborDisplacement': 'Percentage of jobs being automated away by AI systems',
        'GroceryCPI': 'How fast grocery prices are rising (3-month annualized)',
        'CISACyber': 'Critical cyber vulnerabilities discovered in last 90 days',
        'GridOutages': 'Major power outages affecting >50k customers this quarter',
        'GDPGrowth': 'Economic growth rate - higher is better (positive indicator)'
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
        'LaborDisplacement': 'Mass unemployment → no income → cant pay bills → social collapse',
        'GroceryCPI': 'Food too expensive → families struggle → social unrest → supply chain breaks',
        'CISACyber': 'Critical systems vulnerable → infrastructure attacks → services offline',
        'GridOutages': 'No power → no heat/cooling → no refrigeration → cant work from home',
        'GDPGrowth': 'Strong economy = more jobs → stability → less risk (GREEN is good!)'
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
    lastUpdate.textContent = 'Error';
    
    const statusIndicator = document.getElementById('system-status');
    statusIndicator.textContent = '● Offline';
    statusIndicator.className = 'status-indicator red';
    
    console.error('Dashboard error:', message);
}

// Modal Functions
function showIndicatorDetails(indicator) {
    const modal = document.getElementById('indicator-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    // Get indicator metadata
    const metadata = currentData?.indicators?.find(i => i.name === indicator.name)?.metadata || {};
    
    // Get detailed information
    const details = getIndicatorDetails(indicator.name);
    
    // Set title
    modalTitle.textContent = details.title || indicator.name;
    
    // Build modal content
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3>📊 Current Status</h3>
            <div class="current-status">
                <div class="status-value">
                    <span class="value">${indicator.value}</span>
                    <span class="status-badge ${indicator.level}">${indicator.level}</span>
                    ${getDataSourceBadge(indicator)}
                </div>
                <p class="status-description">${metadata.description || ''}</p>
            </div>
        </div>

        <div class="modal-section">
            <h3>🔍 What We're Tracking</h3>
            <p>${details.whatWeTrack}</p>
        </div>

        <div class="modal-section">
            <h3>❓ Why This Matters</h3>
            <p>${details.whyItMatters}</p>
        </div>

        <div class="modal-section">
            <h3>📈 Threshold Levels</h3>
            <div class="threshold-levels">
                <div class="threshold-level green">
                    <strong>Green</strong>
                    <span>${details.thresholds.green}</span>
                </div>
                <div class="threshold-level amber">
                    <strong>Amber</strong>
                    <span>${details.thresholds.amber}</span>
                </div>
                <div class="threshold-level red">
                    <strong>Red</strong>
                    <span>${details.thresholds.red}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>📚 References & Sources</h3>
            <ul>
                ${details.references.map(ref => `<li><a href="${ref.url}" target="_blank">${ref.text}</a></li>`).join('')}
            </ul>
        </div>

        ${metadata.source ? `
        <div class="modal-section">
            <h3>🔗 Data Source</h3>
            <p>Source: ${metadata.source}</p>
            ${metadata.api_url ? `<p><a href="${metadata.api_url}" target="_blank">View API Documentation</a></p>` : ''}
        </div>
        ` : ''}
    `;
    
    // Show modal
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('indicator-modal');
    modal.classList.remove('active');
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Close modal on background click
document.getElementById('indicator-modal').addEventListener('click', (e) => {
    if (e.target.id === 'indicator-modal') {
        closeModal();
    }
});

// Get detailed information for each indicator
function getIndicatorDetails(indicatorName) {
    const details = {
        'Treasury': {
            title: '📈 Treasury Market Volatility',
            whatWeTrack: 'We monitor the 10-year Treasury yield volatility, specifically the "auction tail" in basis points. This measures the difference between the highest accepted yield and the average yield at Treasury auctions. A larger tail indicates weaker demand and potential market stress.',
            whyItMatters: 'Treasury markets are the foundation of the global financial system. When volatility spikes, it signals that even the "safest" investments are experiencing uncertainty. This often precedes broader financial instability, bank stress, and credit crunches that can affect your savings, mortgage rates, and overall economic stability.',
            thresholds: {
                green: '< 3 basis points',
                amber: '3-7 basis points',
                red: '> 7 basis points'
            },
            references: [
                { text: 'FRED - 10-Year Treasury Data', url: 'https://fred.stlouisfed.org/series/DGS10' },
                { text: 'Treasury Direct Auction Results', url: 'https://www.treasurydirect.gov/instit/annceresult/press/press_auctionresults.htm' },
                { text: 'Understanding Treasury Auctions', url: 'https://www.newyorkfed.org/markets/treasury-securities' }
            ]
        },
        'HormuzRisk': {
            title: '🚢 Strait of Hormuz Risk',
            whatWeTrack: 'We track war risk insurance premiums for vessels transiting the Strait of Hormuz, through which 21% of global oil passes. We monitor news reports for military activity, shipping threats, and insurance rate changes.',
            whyItMatters: 'Any disruption to Hormuz would immediately spike oil prices globally. Within days, gas prices would surge, shipping costs would skyrocket, and inflation would accelerate. This affects everything from your commute costs to grocery prices, as transportation costs ripple through the entire economy.',
            thresholds: {
                green: '< 1.5% premium',
                amber: '1.5-4% premium',
                red: '> 4% premium'
            },
            references: [
                { text: 'Lloyd\'s List - Shipping Insurance', url: 'https://lloydslist.com' },
                { text: 'EIA - Strait of Hormuz Facts', url: 'https://www.eia.gov/international/analysis/regions-of-interest/Strait_of_Hormuz' },
                { text: 'War Risk Insurance Explained', url: 'https://www.agcs.allianz.com/news-and-insights/expert-risk-articles/war-risk-insurance.html' }
            ]
        },
        'JoblessClaims': {
            title: '📊 Unemployment Claims Surge',
            whatWeTrack: 'Weekly initial unemployment insurance claims (seasonally adjusted) from the Department of Labor. This is the most timely indicator of layoffs spreading across the economy.',
            whyItMatters: 'A surge in jobless claims is the canary in the coal mine for recession. When claims spike, it means mass layoffs are underway. This leads to reduced consumer spending, mortgage defaults, and a downward spiral that can trigger bank failures and economic collapse.',
            thresholds: {
                green: '< 250,000 claims',
                amber: '250,000-275,000 claims',
                red: '> 350,000 claims'
            },
            references: [
                { text: 'DOL Weekly Claims Report', url: 'https://www.dol.gov/ui/data' },
                { text: 'FRED - Initial Claims Data', url: 'https://fred.stlouisfed.org/series/ICSA' },
                { text: 'Understanding Jobless Claims', url: 'https://www.bls.gov/news.release/empsit.nr0.htm' }
            ]
        },
        'LuxuryCollapse': {
            title: '💎 Luxury Market Collapse',
            whatWeTrack: 'Stock performance of luxury goods companies (Ralph Lauren, Tapestry, etc.) as a proxy for wealthy consumer sentiment. We calculate a collapse index based on recent price movements.',
            whyItMatters: 'When the wealthy stop buying luxury goods, they know something the rest of us don\'t. This "smart money" indicator often precedes major market crashes by 3-6 months. If they\'re battening down the hatches, you should too.',
            thresholds: {
                green: '< 15 on index',
                amber: '15-25 on index',
                red: '> 40 on index'
            },
            references: [
                { text: 'Alpha Vantage Stock API', url: 'https://www.alphavantage.co/documentation/' },
                { text: 'Luxury Goods as Economic Indicator', url: 'https://www.mckinsey.com/industries/retail/our-insights/state-of-luxury' },
                { text: 'Veblen Goods Theory', url: 'https://www.investopedia.com/terms/v/veblen-good.asp' }
            ]
        },
        'LaborDisplacement': {
            title: '🤖 AI Job Displacement',
            whatWeTrack: 'Employment trends in information and professional services sectors, comparing year-over-year changes to identify AI-driven job losses. We use FRED employment data to calculate displacement rates.',
            whyItMatters: 'Mass technological unemployment would devastate the economy. When AI replaces large numbers of workers simultaneously, it creates a cascade: no jobs → no income → can\'t pay bills → mass defaults → economic collapse. This is the "great displacement" risk.',
            thresholds: {
                green: '< 20% displacement rate',
                amber: '20-35% displacement rate',
                red: '> 35% displacement rate'
            },
            references: [
                { text: 'FRED Employment Data', url: 'https://fred.stlouisfed.org/series/USINFO' },
                { text: 'MIT Work of the Future', url: 'https://workofthefuture.mit.edu/' },
                { text: 'AI Impact on Employment', url: 'https://www.brookings.edu/research/automation-and-artificial-intelligence-how-machines-affect-people-and-places/' }
            ]
        },
        'GroceryCPI': {
            title: '🛒 Food Inflation Rate',
            whatWeTrack: 'The Consumer Price Index for "Food at home" from the Bureau of Labor Statistics. We calculate the 3-month annualized rate to identify rapid food price acceleration.',
            whyItMatters: 'Food inflation hits everyone immediately. When grocery prices spiral upward, families struggle to afford basics. This leads to social unrest, hoarding behavior, and supply chain disruptions that can quickly spiral out of control.',
            thresholds: {
                green: '< 4% annualized',
                amber: '4-8% annualized',
                red: '> 8% annualized'
            },
            references: [
                { text: 'BLS CPI Report', url: 'https://www.bls.gov/cpi/' },
                { text: 'Food Price Index Data', url: 'https://www.bls.gov/cpi/factsheets/food.htm' },
                { text: 'Historical Food Inflation', url: 'https://www.ers.usda.gov/data-products/food-price-outlook/' }
            ]
        },
        'CISACyber': {
            title: '🔒 Critical Cyber Threats',
            whatWeTrack: 'Known Exploited Vulnerabilities (KEV) catalog from CISA. We count critical vulnerabilities discovered in the past 90 days that are being actively exploited in the wild.',
            whyItMatters: 'A surge in exploited vulnerabilities means hackers are successfully attacking critical infrastructure. This can lead to power outages, water system failures, financial system disruptions, and supply chain attacks that directly impact daily life.',
            thresholds: {
                green: '≤ 2 KEVs in 90 days',
                amber: '3-5 KEVs in 90 days',
                red: '> 5 KEVs in 90 days'
            },
            references: [
                { text: 'CISA KEV Catalog', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
                { text: 'Understanding CVEs', url: 'https://www.cve.org/About/Overview' },
                { text: 'Infrastructure Security', url: 'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience' }
            ]
        },
        'GridOutages': {
            title: '⚡ Power Grid Failures',
            whatWeTrack: 'Major power outages affecting more than 50,000 customers, as reported to the Department of Energy (Form OE-417). We count incidents per quarter to identify grid stress.',
            whyItMatters: 'Without power, modern life stops. No heat/AC, no refrigeration, no internet, no working from home. Multiple major outages signal grid instability that could lead to cascading failures, especially during extreme weather or cyber attacks.',
            thresholds: {
                green: '0-1 major outage/quarter',
                amber: '2 outages/quarter',
                red: '≥ 3 outages/quarter'
            },
            references: [
                { text: 'DOE Electric Disturbance Events', url: 'https://www.oe.netl.doe.gov/OE417_annual_summary.aspx' },
                { text: 'Grid Reliability Metrics', url: 'https://www.nerc.com/pa/RAPA/Pages/default.aspx' },
                { text: 'Power Outage Tracker', url: 'https://poweroutage.us/' }
            ]
        },
        'GDPGrowth': {
            title: '📈 Economic Growth (Positive)',
            whatWeTrack: 'Real GDP growth rate from the Bureau of Economic Analysis. Unlike other indicators, this is POSITIVE - higher values are good. We also check if 10-year Treasury yields are below 4% for a "goldilocks" scenario.',
            whyItMatters: 'Strong economic growth with low interest rates means more jobs, wage growth, and stability. This reduces all other risks. When GDP is above 4% and rates are low, it\'s a green flag that the economy can absorb shocks.',
            thresholds: {
                green: '≥ 4% GDP growth',
                amber: '2-4% GDP growth',
                red: '< 2% GDP growth'
            },
            references: [
                { text: 'BEA GDP Releases', url: 'https://www.bea.gov/data/gdp' },
                { text: 'FRED GDP Data', url: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA' },
                { text: 'Understanding GDP', url: 'https://www.imf.org/external/pubs/ft/fandd/basics/gdp.htm' }
            ]
        },
        'StrikeTracker': {
            title: '🪧 Labor Strike Activity',
            whatWeTrack: 'Total days of work stoppages from Cornell ILR Strike Tracker. We sum all strike days across the month to measure labor unrest intensity.',
            whyItMatters: 'Rising strike activity signals economic stress and potential supply chain disruptions. Major strikes can halt production, shipping, and services - leading to shortages and price spikes.',
            thresholds: {
                green: '< 100,000 worker-days/month',
                amber: '100,000-500,000 worker-days',
                red: '> 500,000 worker-days'
            },
            references: [
                { text: 'Cornell ILR Strike Tracker', url: 'https://striketracker.ilr.cornell.edu/' },
                { text: 'BLS Work Stoppage Data', url: 'https://www.bls.gov/wsp/' },
                { text: 'Labor Action Tracker', url: 'https://www.nlrb.gov/reports/nlrb-case-activity-reports/representation-cases/intake' }
            ]
        },
        'LegiScan': {
            title: '👁️ AI Surveillance Laws',
            whatWeTrack: 'State and federal bills containing AI surveillance keywords tracked via LegiScan API. We count new bills introduced per month.',
            whyItMatters: 'Rapid increase in AI surveillance legislation signals government preparation for social control. This often precedes restrictions on movement, financial surveillance, and erosion of privacy rights.',
            thresholds: {
                green: '< 3 bills/month',
                amber: '3-10 bills/month',
                red: '> 10 bills/month'
            },
            references: [
                { text: 'LegiScan Bill Tracking', url: 'https://legiscan.com/' },
                { text: 'EFF Surveillance Self-Defense', url: 'https://ssd.eff.org/' },
                { text: 'AI Now Institute', url: 'https://ainowinstitute.org/' }
            ]
        },
        'ACLEDProtests': {
            title: '🚨 US Protest Activity',
            whatWeTrack: 'Daily average of protests, riots, and civil unrest events from ACLED (Armed Conflict Location & Event Data). 7-day rolling average.',
            whyItMatters: 'Escalating protests can quickly spiral into supply disruptions, curfews, and economic shutdowns. High protest activity often precedes government crackdowns and emergency declarations.',
            thresholds: {
                green: '< 25 protests/day',
                amber: '25-75 protests/day',
                red: '> 75 protests/day'
            },
            references: [
                { text: 'ACLED Dashboard', url: 'https://acleddata.com/dashboard/' },
                { text: 'US Crisis Monitor', url: 'https://acleddata.com/special-projects/us-crisis-monitor/' },
                { text: 'Protest Tracking Methodology', url: 'https://acleddata.com/resources/methodology/' }
            ]
        },
        'MarketVolatility': {
            title: '📊 Bond Market Shock',
            whatWeTrack: '10-year Treasury yield intraday swings on major data release days (CPI, FOMC, NFP). Measured in basis points.',
            whyItMatters: 'Extreme bond volatility signals that even "safe" investments are unstable. This is a critical early warning of financial system stress that precedes bank failures and credit freezes.',
            thresholds: {
                green: '< 20 basis points',
                amber: '20-29 basis points',
                red: '≥ 30 basis points (CRITICAL)'
            },
            references: [
                { text: 'Yahoo Finance 10Y Yield', url: 'https://finance.yahoo.com/quote/%5ETNX' },
                { text: 'Bond Market Association', url: 'https://www.sifma.org/resources/research/' },
                { text: 'Fed Economic Data', url: 'https://fred.stlouisfed.org/' }
            ]
        },
        'WHODisease': {
            title: '🦠 Disease Outbreak Alert',
            whatWeTrack: 'Countries reporting novel human-to-human disease transmission in WHO Disease Outbreak News. 14-day window. US case triggers automatic red.',
            whyItMatters: 'New H2H transmission means potential pandemic. Early warning allows stocking medicines, N95s, and supplies before panic buying empties shelves.',
            thresholds: {
                green: '0 countries with H2H',
                amber: '1-2 countries',
                red: '≥ 3 countries OR any US case'
            },
            references: [
                { text: 'WHO Disease Outbreak News', url: 'https://www.who.int/emergencies/disease-outbreak-news' },
                { text: 'CDC Current Outbreaks', url: 'https://www.cdc.gov/outbreaks/' },
                { text: 'ProMED Mail', url: 'https://promedmail.org/' }
            ]
        },
        'CREAOil': {
            title: '🛢️ Russian Oil to BRICS',
            whatWeTrack: 'Percentage of Russian crude oil exports going to BRICS nations, from CREA (Centre for Research on Energy and Clean Air) tracker.',
            whyItMatters: 'High BRICS share means petrodollar weakening. This threatens USD reserve status, potentially triggering currency crisis and import price shocks.',
            thresholds: {
                green: '< 60% to BRICS',
                amber: '60-75% to BRICS',
                red: '> 75% to BRICS'
            },
            references: [
                { text: 'CREA Russia Tracker', url: 'https://energyandcleanair.org/russia-sanctions/' },
                { text: 'EIA Oil Market Analysis', url: 'https://www.eia.gov/petroleum/' },
                { text: 'BRICS Economic Data', url: 'https://www.brics2023.gov.za/' }
            ]
        },
        'OFACDesignations': {
            title: '⚖️ Oil Sanctions Escalation',
            whatWeTrack: 'New OFAC sanctions on India/China entities involved in oil/energy trade. 30-day count from Treasury SDN list.',
            whyItMatters: 'Sanctions escalation can trigger retaliation, supply disruptions, and accelerate de-dollarization. This directly impacts energy prices and availability.',
            thresholds: {
                green: '0 new designations',
                amber: '1-5 designations',
                red: '> 5 designations'
            },
            references: [
                { text: 'OFAC SDN List', url: 'https://sanctionssearch.ofac.treas.gov/' },
                { text: 'Treasury Sanctions Programs', url: 'https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-programs-and-country-information' },
                { text: 'Sanctions Compliance', url: 'https://www.treasury.gov/resource-center/sanctions/Pages/default.aspx' }
            ]
        },
        'AILayoffs': {
            title: '🤖 AI-Driven Layoffs',
            whatWeTrack: 'Monthly count of workers laid off explicitly due to AI/automation, aggregated from WARN notices and layoff trackers.',
            whyItMatters: 'Mass AI displacement creates economic cascade: widespread unemployment → reduced spending → business failures → financial crisis. This is the "great replacement" risk.',
            thresholds: {
                green: '< 5,000 workers/month',
                amber: '5,000-25,000 workers',
                red: '> 25,000 workers'
            },
            references: [
                { text: 'Layoffs.fyi Tracker', url: 'https://layoffs.fyi/' },
                { text: 'WARN Notice Search', url: 'https://www.dol.gov/agencies/eta/layoffs/warn' },
                { text: 'AI Impact Research', url: 'https://www.mckinsey.com/featured-insights/future-of-work/ai-automation-and-the-future-of-work' }
            ]
        },
        'MBridgeSettlements': {
            title: '💱 mBridge Energy Payments',
            whatWeTrack: 'Daily settlement volumes for energy transactions on the BIS mBridge platform (USD millions/day). Tracks shift away from dollar-based oil trade.',
            whyItMatters: 'When oil trades bypass the dollar, US loses financial leverage and sanctions power. High mBridge volumes signal petrodollar collapse risk, leading to currency crisis and import shocks.',
            thresholds: {
                green: '< $50M/day',
                amber: '$50-300M/day',
                red: '> $300M/day'
            },
            references: [
                { text: 'BIS mBridge Project', url: 'https://www.bis.org/about/bisih/topics/cbdc/mbridge.htm' },
                { text: 'mBridge Report', url: 'https://www.bis.org/publ/othp65.htm' },
                { text: 'CBDC Tracker', url: 'https://www.atlanticcouncil.org/cbdctracker/' }
            ]
        },
        'JODIOil': {
            title: '🏭 BRICS/OECD Refinery Ratio',
            whatWeTrack: 'Ratio of refinery capacity between India+China vs OECD countries from JODI oil data. Higher ratio means BRICS controls more global refining.',
            whyItMatters: 'When BRICS refining dominates, they control fuel prices and availability. This shifts global energy power eastward, weakening Western energy security.',
            thresholds: {
                green: '< 1.2 ratio',
                amber: '1.2-1.4 ratio',
                red: '> 1.4 ratio'
            },
            references: [
                { text: 'JODI Oil Database', url: 'https://www.jodidata.org/' },
                { text: 'IEA Oil Market Report', url: 'https://www.iea.org/reports/oil-market-report' },
                { text: 'OPEC Monthly Report', url: 'https://www.opec.org/opec_web/en/publications/338.htm' }
            ]
        },
        'AIRansomware': {
            title: '🔓 AI-Powered Ransomware',
            whatWeTrack: 'Count of ransomware attacks using AI tools for automation/evasion in last 90 days. Data from CISA ICS advisories with AI keywords.',
            whyItMatters: 'AI makes ransomware faster, smarter, and harder to stop. Surge in AI ransomware means critical infrastructure attacks that could shut down power, water, hospitals.',
            thresholds: {
                green: '≤ 3 incidents/90 days',
                amber: '4-6 incidents',
                red: '> 6 incidents'
            },
            references: [
                { text: 'CISA ICS Advisories', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/ics-advisories' },
                { text: 'Ransomware Task Force', url: 'https://securityandtechnology.org/ransomwaretaskforce/' },
                { text: 'IC3 Ransomware', url: 'https://www.ic3.gov/Media/Y2023/PSA230510' }
            ]
        },
        'DeepfakeShocks': {
            title: '🎭 Deepfake Market Shocks',
            whatWeTrack: 'Quarterly count of market volatility events triggered by deepfake videos/audio. Monitors news + market correlation for AI-generated content causing >5% swings.',
            whyItMatters: 'Deepfakes can crash stocks, trigger bank runs, or start wars in minutes. As AI improves, these "truth bombs" become undetectable and catastrophic.',
            thresholds: {
                green: '0 events/quarter',
                amber: '1 event',
                red: '≥ 2 events (CRITICAL)'
            },
            references: [
                { text: 'Deepfake Detection Challenge', url: 'https://ai.facebook.com/datasets/dfdc/' },
                { text: 'SEC Market Manipulation', url: 'https://www.sec.gov/newsroom/press-releases' },
                { text: 'Synthetic Media Research', url: 'https://www.partnershiponai.org/synthetic-media-framework/' }
            ]
        }
    };
    
    return details[indicatorName] || {
        title: indicatorName,
        whatWeTrack: 'Monitoring this indicator for changes.',
        whyItMatters: 'This indicator helps assess systemic risks.',
        thresholds: {
            green: 'Low risk',
            amber: 'Medium risk',
            red: 'High risk'
        },
        references: []
    };
}

// Update phase display in sidebar
function updatePhaseDisplay(currentPhase, phaseInfo) {
    // Check if phase display exists, if not create it
    let phaseCard = document.getElementById('phase-display');
    if (!phaseCard) {
        // Create phase display card
        const sidebar = document.querySelector('.sidebar');
        const systemStatusCard = document.querySelector('.sidebar-card');
        
        phaseCard = document.createElement('div');
        phaseCard.id = 'phase-display';
        phaseCard.className = 'sidebar-card phase-card';
        phaseCard.innerHTML = `
            <h3>📍 Current Phase</h3>
            <div class="phase-content">
                <div class="phase-number">0</div>
                <div class="phase-name">Loading...</div>
                <div class="phase-actions">
                    <h4>Recommended Actions:</h4>
                    <ul class="phase-action-list"></ul>
                </div>
            </div>
        `;
        
        // Insert after system status card
        sidebar.insertBefore(phaseCard, systemStatusCard.nextSibling);
    }
    
    // Update phase display
    const phaseNumber = phaseCard.querySelector('.phase-number');
    const phaseName = phaseCard.querySelector('.phase-name');
    const actionList = phaseCard.querySelector('.phase-action-list');
    
    phaseNumber.textContent = currentPhase;
    phaseNumber.className = `phase-number phase-${currentPhase}`;
    phaseName.textContent = phaseInfo.name || `Phase ${currentPhase}`;
    
    // Update actions
    actionList.innerHTML = '';
    if (phaseInfo.actions && phaseInfo.actions.length > 0) {
        phaseInfo.actions.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            actionList.appendChild(li);
        });
    }
    
    // Add phase-specific styling
    if (currentPhase >= 5) {
        phaseCard.classList.add('high-phase');
    } else if (currentPhase >= 3) {
        phaseCard.classList.add('medium-phase');
    } else {
        phaseCard.classList.remove('high-phase', 'medium-phase');
    }
}

// Show Risk Framework (redirect to page)
function showFramework() {
    window.location.href = '/framework';
}

// Show Alert Legend Modal
function showLegend() {
    const modal = document.getElementById('indicator-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'Understanding Alert Levels';
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3>🚦 Alert Color System</h3>
            <p>Each indicator is monitored continuously and assigned a color based on predefined thresholds:</p>
        </div>

        <div class="modal-section">
            <div class="threshold-levels" style="grid-template-columns: 1fr;">
                <div class="threshold-level green" style="text-align: left; padding: 20px;">
                    <strong style="font-size: 1.25rem; margin-bottom: 8px;">🟢 GREEN - Normal Operations</strong>
                    <p style="margin-top: 8px;">Everything is functioning within expected parameters. No action needed. Continue normal activities.</p>
                </div>
                
                <div class="threshold-level amber" style="text-align: left; padding: 20px;">
                    <strong style="font-size: 1.25rem; margin-bottom: 8px;">🟡 AMBER - Elevated Concern</strong>
                    <p style="margin-top: 8px;">Conditions are shifting beyond normal ranges. Pay attention to this indicator. Consider reviewing your preparedness supplies.</p>
                </div>
                
                <div class="threshold-level red" style="text-align: left; padding: 20px;">
                    <strong style="font-size: 1.25rem; margin-bottom: 8px;">🔴 RED - Immediate Attention</strong>
                    <p style="margin-top: 8px;">Significant deviation from normal. This indicator suggests potential disruption. Take preparedness actions if multiple indicators are red.</p>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>🚨 The TIGHTEN-UP Protocol</h3>
            <p>When ANY 3 indicators simultaneously reach RED status:</p>
            <ul>
                <li>You will receive an email alert</li>
                <li>The dashboard will show "TIGHTEN-UP ACTIVE"</li>
                <li>This is your signal to implement basic preparedness measures</li>
                <li>Not a cause for panic - just prudent preparation</li>
            </ul>
        </div>

        <div class="modal-section">
            <h3>📊 Data Source Types</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                <div>
                    <span class="data-source live">LIVE</span>
                    <span style="margin-left: 12px;">Real-time data from APIs and automated sources</span>
                </div>
                <div>
                    <span class="data-source manual">MANUAL</span>
                    <span style="margin-left: 12px;">Requires periodic manual input</span>
                </div>
                <div>
                    <span class="data-source mock">MOCK</span>
                    <span style="margin-left: 12px;">Simulated data for testing</span>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}