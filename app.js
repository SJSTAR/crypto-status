// Referral data
const referrals = {
  "referrals": [
    {
      "name": "Binance",
      "description": "Get 50% fee kickback on each trade.",
      "url": "https://www.binance.com/en/activity/referral-entry?ref=YOURCODE"
    },
    {
      "name": "Kraken", 
      "description": "Earn $10 when you trade $100.",
      "url": "https://r.kraken.com/YOURCODE"
    },
    {
      "name": "Crypto.com",
      "description": "Up to $2,000 sign-up bonus in CRO.",
      "url": "https://crypto.com/exch/YOURCODE"
    }
  ]
};

// DOM elements
const coinsBody = document.getElementById('coins-body');
const referralContainer = document.getElementById('referral-container');
const lastUpdated = document.getElementById('last-updated');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// API endpoint
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupReferralLinks();
  setupSidebar();
  fetchCoinData();
  updateTimestamp(); // Show initial timestamp
  
  // Auto-refresh every 60 seconds
  setInterval(fetchCoinData, 60000);
});

// Setup referral links
function setupReferralLinks() {
  referralContainer.innerHTML = ''; // Clear existing content
  
  referrals.referrals.forEach(referral => {
    const card = document.createElement('div');
    card.className = 'card referral-card';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card__body';
    
    const title = document.createElement('h3');
    title.textContent = referral.name;
    
    const description = document.createElement('p');
    description.textContent = referral.description;
    
    const button = document.createElement('button');
    button.className = 'btn btn--primary btn--full-width';
    button.textContent = `Trade on ${referral.name}`;
    button.setAttribute('aria-label', `Open ${referral.name} referral link in new tab`);
    
    // Add click event to open referral URL
    button.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(referral.url, '_blank', 'noopener,noreferrer');
    });
    
    cardBody.appendChild(title);
    cardBody.appendChild(description);
    cardBody.appendChild(button);
    card.appendChild(cardBody);
    referralContainer.appendChild(card);
  });
}

// Setup sidebar toggle for mobile
function setupSidebar() {
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 767 && 
          sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}

// Fetch cryptocurrency data
async function fetchCoinData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    updateCoinsTable(data);
    updateTimestamp();
  } catch (error) {
    console.error('Error fetching coin data:', error);
    if (coinsBody) {
      coinsBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--color-error);">
            Failed to load data. Retrying in 60 seconds...
          </td>
        </tr>
      `;
    }
    updateTimestamp();
  }
}

// Update coins table
function updateCoinsTable(coins) {
  if (!coinsBody) return;
  
  coinsBody.innerHTML = '';
  
  coins.forEach((coin, index) => {
    const row = document.createElement('tr');
    
    const changeClass = coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative';
    const changeSymbol = coin.price_change_percentage_24h >= 0 ? '+' : '';
    
    const sparklineHtml = generateSparkline(coin.sparkline_in_7d.price);
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div style="display: flex; align-items: center; gap: var(--space-8);">
          <img src="${coin.image}" alt="${coin.name} logo" width="24" height="24" style="border-radius: 50%;" onerror="this.style.display='none'">
          <div>
            <div style="font-weight: var(--font-weight-medium);">${coin.name}</div>
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">${coin.symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td>$${formatNumber(coin.current_price)}</td>
      <td class="${changeClass}">
        ${changeSymbol}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
      </td>
      <td>$${formatLargeNumber(coin.market_cap)}</td>
      <td>${sparklineHtml}</td>
    `;
    
    coinsBody.appendChild(row);
  });
}

// Generate sparkline SVG
function generateSparkline(prices) {
  if (!prices || prices.length === 0) {
    return '<span style="color: var(--color-text-secondary);">No data</span>';
  }
  
  const width = 80;
  const height = 40;
  const padding = 2;
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  if (priceRange === 0) {
    // If all prices are the same, draw a flat line
    const y = height / 2;
    return `
      <svg width="${width}" height="${height}" style="display: block;">
        <polyline
          class="sparkline"
          points="0,${y} ${width},${y}"
        />
      </svg>
    `;
  }
  
  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return `
    <svg width="${width}" height="${height}" style="display: block;">
      <polyline
        class="sparkline"
        points="${points}"
      />
    </svg>
  `;
}

// Format number with commas
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  
  if (num < 0.01) {
    return num.toFixed(6);
  } else if (num < 1) {
    return num.toFixed(4);
  } else {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Format large numbers (market cap)
function formatLargeNumber(num) {
  if (num === null || num === undefined) return '0';
  
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  } else {
    return num.toLocaleString('en-US');
  }
}

// Update timestamp
function updateTimestamp() {
  if (!lastUpdated) return;
  
  const now = new Date();
  const timeString = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
  lastUpdated.textContent = `Last updated: ${timeString}`;
}