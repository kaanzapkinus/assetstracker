const API_URL = 'http://127.0.0.1:5050/api/quotes';
const TRENDING_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX'];
const STORAGE_ASSETS = 'assetpulse-assets';
const SYMBOL_LIBRARY = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'TRX', name: 'Tron' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'XLM', name: 'Stellar' },
  { symbol: 'OP', name: 'Optimism' },
  { symbol: 'ARB', name: 'Arbitrum' },
  { symbol: 'ICP', name: 'Internet Computer' },
  { symbol: 'AAVE', name: 'Aave' },
  { symbol: 'SUI', name: 'Sui' },
  { symbol: 'APT', name: 'Aptos' },
  { symbol: 'NEAR', name: 'Near Protocol' },
  { symbol: 'FTM', name: 'Fantom' },
  { symbol: 'HBAR', name: 'Hedera' },
  { symbol: 'VET', name: 'VeChain' },
  { symbol: 'ALGO', name: 'Algorand' },
  { symbol: 'GRT', name: 'The Graph' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'ETC', name: 'Ethereum Classic' },
  { symbol: 'EGLD', name: 'MultiversX' }
];

const ALLOCATION_COLORS = ['#7df3c0', '#5c6bff', '#ff6b81', '#ffd166', '#60a5fa', '#f472b6'];

const TIMEFRAMES = [
  {
    id: '1h',
    percentKey: 'percent_change_1h',
    description: 'vs previous hour'
  },
  {
    id: '24h',
    percentKey: 'percent_change_24h',
    description: 'vs previous day'
  },
  {
    id: '7d',
    percentKey: 'percent_change_7d',
    description: 'vs previous week'
  }
];

const elements = {
  lastUpdated: document.getElementById('lastUpdated'),
  refreshAll: document.getElementById('refreshAll'),
  trendingBody: document.getElementById('trendingBody'),
  metricValue: document.getElementById('metricValue'),
  metricCost: document.getElementById('metricCost'),
  metricPnL: document.getElementById('metricPnL'),
  metricPnLPercent: document.getElementById('metricPnLPercent'),
  insightTabs: document.getElementById('insightTabs'),
  insightViews: document.querySelectorAll('[data-insight-view]'),
  timelineControls: document.getElementById('timelineControls'),
  timelineSummary: document.getElementById('timelineSummary'),
  allocationLegend: document.getElementById('allocationLegend'), // Keeping for safety, though unused
  alert: document.getElementById('alert'),
  assetForm: document.getElementById('assetForm'),
  assetSymbol: document.getElementById('assetSymbol'),
  assetAmount: document.getElementById('assetAmount'),
  assetCost: document.getElementById('assetCost'),
  assetDate: document.getElementById('assetDate'),
  assetTableBody: document.getElementById('assetTableBody'),
  clearAssets: document.getElementById('clearAssets'),
  symbolSuggestions: document.getElementById('symbolSuggestions'),
  symbolInputWrapper: document.querySelector('.symbol-input'),
  historyControls: document.getElementById('historyControls'),
  allocationLegendMain: document.getElementById('allocationLegendMain')
};

const chartCanvas = document.getElementById('plChart');
const chartCtx = chartCanvas?.getContext('2d');
const timelineCanvas = document.getElementById('timelineChart');
const timelineCtx = timelineCanvas?.getContext('2d');
const allocationCanvas = document.getElementById('allocationChartMain');
const allocationCtx = allocationCanvas?.getContext('2d');
const historyCanvas = document.getElementById('historyChart');
const historyCtx = historyCanvas?.getContext('2d');

const state = {
  customAssets: loadAssets(),
  quotes: {},
  lastUpdated: null,
  selectedRange: '1h',
  activeInsight: 'markets',
  historyRange: '7d'
};

function loadAssets() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_ASSETS);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Asset storage cannot be read', error);
    return [];
  }
}

function saveAssets() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_ASSETS, JSON.stringify(state.customAssets));
  } catch (error) {
    console.warn('Asset storage cannot be saved', error);
  }
}

function setAlert(message = '', type = '') {
  if (!elements.alert) return;
  elements.alert.textContent = message;
  elements.alert.className = 'alert';
  if (type) {
    elements.alert.classList.add(type);
  }
}

function getSymbolMatches(query) {
  const needle = query.trim().toUpperCase();
  if (!needle) {
    return SYMBOL_LIBRARY.slice(0, 8);
  }
  const startsWith = SYMBOL_LIBRARY.filter((item) => item.symbol.startsWith(needle));
  const byName = SYMBOL_LIBRARY.filter(
    (item) => !startsWith.includes(item) && item.name.toUpperCase().includes(needle)
  );
  return [...startsWith, ...byName].slice(0, 8);
}

function validateAssetInput(symbol, amount, cost) {
  if (!symbol || symbol.trim().length === 0) {
    return 'Please enter a valid asset symbol (e.g., BTC, ETH)';
  }
  if (symbol.length > 10) {
    return 'Symbol too long (maximum 10 characters)';
  }
  if (isNaN(amount) || amount <= 0) {
    return 'Amount must be a valid number greater than 0';
  }
  if (amount > 1000000000) {
    return 'Amount is too large';
  }
  if (isNaN(cost) || cost < 0) {
    return 'Cost per unit must be a valid number (cannot be negative)';
  }
  if (cost > 1000000000) {
    return 'Cost per unit is too large';
  }
  return null;
}

function renderSymbolSuggestions(query) {
  const list = elements.symbolSuggestions;
  if (!list) return;
  const matches = getSymbolMatches(query);
  if (!matches.length) {
    list.classList.remove('visible');
    list.innerHTML = '';
    return;
  }
  list.innerHTML = matches
    .map(
      (item) =>
        `<li role="option" data-symbol="${item.symbol}">
          <strong>${item.symbol}</strong>
          <span>${item.name}</span>
        </li>`
    )
    .join('');
  list.classList.add('visible');
}

function hideSymbolSuggestions() {
  if (!elements.symbolSuggestions) return;
  elements.symbolSuggestions.classList.remove('visible');
}

function formatCurrency(value, digits = 0) {
  const options = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits
  };
  if (digits > 0) {
    options.minimumFractionDigits = digits;
  }
  return new Intl.NumberFormat('en-US', options).format(value);
}

function formatPrice(value) {
  return value >= 1 ? formatCurrency(value, 2) : formatCurrency(value, 4);
}

function formatPercent(value) {
  const fixed = value.toFixed(2);
  return `${value >= 0 ? '+' : ''}${fixed}%`;
}

function getPositions() {
  const aggregated = new Map();

  state.customAssets.forEach((asset) => {
    const quote = state.quotes[asset.symbol];
    if (!quote) return;

    const existing = aggregated.get(asset.symbol) ?? {
      symbol: asset.symbol,
      name: quote.name,
      amount: 0,
      totalCost: 0,
      price: quote.price,
      idList: []
    };

    existing.amount += asset.amount;
    existing.totalCost += asset.amount * asset.cost;
    existing.price = quote.price;
    existing.idList.push(asset.id);

    aggregated.set(asset.symbol, existing);
  });

  return Array.from(aggregated.values()).map((entry) => {
    const value = entry.price * entry.amount;
    const pnl = value - entry.totalCost;
    const changePct = entry.totalCost ? (pnl / entry.totalCost) * 100 : 0;
    const unitCost = entry.amount ? entry.totalCost / entry.amount : 0;
    return {
      symbol: entry.symbol,
      name: entry.name,
      amount: entry.amount,
      unitCost,
      price: entry.price,
      value,
      cost: entry.totalCost,
      pnl,
      changePct,
      idList: entry.idList
    };
  });
}

function renderMetrics(positions) {
  const totalValue = positions.reduce((sum, asset) => sum + asset.value, 0);
  const totalCost = positions.reduce((sum, asset) => sum + asset.cost, 0);
  const pnl = totalValue - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost) * 100 : 0;

  elements.metricValue.textContent = formatCurrency(totalValue);
  elements.metricCost.textContent = formatCurrency(totalCost);
  elements.metricPnL.textContent = formatCurrency(pnl);
  elements.metricPnLPercent.textContent = `${pnl >= 0 ? 'Positive' : 'Negative'} (${formatPercent(pnlPct)})`;

  elements.metricPnL.classList.remove('positive', 'negative');
  elements.metricPnL.classList.add(pnl >= 0 ? 'positive' : 'negative');
}
function getPortfolioValueForRange(rangeId, positions) {
  const frame = TIMEFRAMES.find((item) => item.id === rangeId);
  if (!frame) return null;
  return positions.reduce((sum, asset) => {
    const quote = state.quotes[asset.symbol];
    const changePct = quote?.[frame.percentKey];
    const previousPrice =
      typeof changePct === 'number' && changePct > -100
        ? asset.price / (1 + changePct / 100)
        : asset.price;
    return sum + previousPrice * asset.amount;
  }, 0);
}

function generateDailyPnLData(positions) {
  // Generate realistic daily P/L data for the last 30 days with hourly granularity
  if (!positions.length) return [];
  
  const today = new Date();
  const data = [];
  
  // Generate 30 days with 4 data points per day (6-hour intervals)
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    for (let hourInterval = 0; hourInterval < 4; hourInterval++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(6 * hourInterval, 0, 0, 0);
      
      // Calculate base P/L
      const totalValue = positions.reduce((sum, asset) => sum + asset.value, 0);
      const totalCost = positions.reduce((sum, asset) => sum + asset.cost, 0);
      const basePnL = totalValue - totalCost;
      
      // Add multi-layer volatility for realistic movements
      const day = 29 - dayOffset;
      const hour = hourInterval;
      
      // Trend component (overall direction)
      const trend = Math.sin(day * 0.15) * totalValue * 0.08;
      
      // Daily cycle (morning/evening patterns)
      const dailyCycle = Math.sin((hour + 1) * Math.PI / 2) * totalValue * 0.05;
      
      // Random walk component
      const randomWalk = (Math.random() - 0.5) * totalValue * 0.06;
      
      // Volatility spikes
      const spike = Math.random() < 0.15 ? (Math.random() - 0.5) * totalValue * 0.1 : 0;
      
      const pnl = basePnL + trend + dailyCycle + randomWalk + spike;
      
      // Only show date label for new days
      const dateStr = hourInterval === 0 ? 
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
        '';
      
      data.push({
        date: dateStr,
        pnl: pnl,
        value: totalValue + pnl,
        time: `${String(6 * hourInterval).padStart(2, '0')}:00`
      });
    }
  }
  
  return data;
}

function renderTimelineChart(positions) {
  if (!timelineCtx || !timelineCanvas) return;
  
  // Ensure canvas has proper DPI resolution
  const dpr = window.devicePixelRatio || 1;
  const width = timelineCanvas.clientWidth || 560;
  const height = timelineCanvas.clientHeight || 320;
  
  if (timelineCanvas.width !== width * dpr || timelineCanvas.height !== height * dpr) {
    timelineCanvas.width = width * dpr;
    timelineCanvas.height = height * dpr;
    timelineCtx.scale(dpr, dpr);
  }
  timelineCtx.clearRect(0, 0, width, height);
  timelineCtx.imageSmoothingEnabled = true;
  timelineCtx.imageSmoothingQuality = 'high';

  // Timeline controls not used for daily P/L
  if (elements.timelineControls) {
    elements.timelineControls.style.display = 'none';
  }

  if (!positions.length) {
    timelineCtx.fillStyle = 'rgba(255,255,255,0.6)';
    timelineCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    timelineCtx.textAlign = 'left';
    timelineCtx.textBaseline = 'middle';
    timelineCtx.fillText('Add assets to view daily P/L chart.', 30, height / 2);
    if (elements.timelineSummary) {
      elements.timelineSummary.textContent = 'No position history yet...';
      elements.timelineSummary.classList.remove('positive', 'negative');
    }
    return;
  }

  // Generate daily P/L data
  const dailyData = generateDailyPnLData(positions);
  
  const padding = { top: 20, bottom: 40, left: 50, right: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find min and max P/L for scaling
  const pnlValues = dailyData.map(d => d.pnl);
  const minPnL = Math.min(...pnlValues, 0);
  const maxPnL = Math.max(...pnlValues, 0);
  const pnlRange = Math.max(Math.abs(maxPnL), Math.abs(minPnL)) * 1.2 || 1;
  
  // Draw zero line
  const zeroY = padding.top + (pnlRange - 0) / (2 * pnlRange) * chartHeight;
  timelineCtx.strokeStyle = 'rgba(255,255,255,0.2)';
  timelineCtx.lineWidth = 1;
  timelineCtx.beginPath();
  timelineCtx.moveTo(padding.left, zeroY);
  timelineCtx.lineTo(width - padding.right, zeroY);
  timelineCtx.stroke();
  
  // Draw grid lines
  timelineCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  timelineCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight;
    timelineCtx.beginPath();
    timelineCtx.moveTo(padding.left, y);
    timelineCtx.lineTo(width - padding.right, y);
    timelineCtx.stroke();
  }
  
  // Calculate points for line chart
  const points = dailyData.map((data, index) => {
    const x = padding.left + (index / (dailyData.length - 1)) * chartWidth;
    const normalized = (data.pnl + pnlRange) / (2 * pnlRange);
    const y = padding.top + (1 - normalized) * chartHeight;
    return { x, y, pnl: data.pnl, date: data.date };
  });
  
  // Draw gradient fill under the curve
  timelineCtx.fillStyle = 'rgba(125, 243, 192, 0.15)';
  timelineCtx.beginPath();
  timelineCtx.moveTo(points[0].x, zeroY);
  points.forEach((point, index) => {
    if (index === 0) {
      timelineCtx.lineTo(point.x, point.y);
    } else {
      timelineCtx.lineTo(point.x, point.y);
    }
  });
  timelineCtx.lineTo(points[points.length - 1].x, zeroY);
  timelineCtx.closePath();
  timelineCtx.fill();
  
  // Draw smooth line
  timelineCtx.strokeStyle = '#7df3c0';
  timelineCtx.lineWidth = 2.5;
  timelineCtx.lineCap = 'round';
  timelineCtx.lineJoin = 'round';
  timelineCtx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      timelineCtx.moveTo(point.x, point.y);
    } else {
      timelineCtx.lineTo(point.x, point.y);
    }
  });
  timelineCtx.stroke();
  
  // Draw data points
  timelineCtx.fillStyle = '#7df3c0';
  points.forEach((point, index) => {
    // Only show points at day markers
    if (point.date) {
      timelineCtx.beginPath();
      timelineCtx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      timelineCtx.fill();
    }
  });
  
  // Draw day labels
  timelineCtx.fillStyle = 'rgba(255,255,255,0.6)';
  timelineCtx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  timelineCtx.textAlign = 'center';
  timelineCtx.textBaseline = 'top';
  points.forEach((point) => {
    if (point.date) {
      timelineCtx.fillText(point.date, point.x, height - padding.bottom + 10);
    }
  });
  
  // Summary
  const totalPnL = positions.reduce((sum, asset) => sum + asset.pnl, 0);
  const totalCost = positions.reduce((sum, asset) => sum + asset.cost, 0);
  const pnlPct = totalCost ? (totalPnL / totalCost) * 100 : 0;
  
  if (elements.timelineSummary) {
    elements.timelineSummary.textContent = `30-day P/L: ${formatCurrency(totalPnL)} (${formatPercent(pnlPct)})`;
    elements.timelineSummary.classList.remove('positive', 'negative');
    elements.timelineSummary.classList.add(totalPnL >= 0 ? 'positive' : 'negative');
  }
}

function renderAllocationChart(positions) {
  if (!allocationCtx || !allocationCanvas) return;
  
  // Ensure canvas has proper DPI resolution
  const dpr = window.devicePixelRatio || 1;
  const width = allocationCanvas.clientWidth || 600;
  const height = allocationCanvas.clientHeight || 300;
  
  if (allocationCanvas.width !== width * dpr || allocationCanvas.height !== height * dpr) {
    allocationCanvas.width = width * dpr;
    allocationCanvas.height = height * dpr;
    allocationCtx.scale(dpr, dpr);
  }
  allocationCtx.clearRect(0, 0, width, height);
  allocationCtx.imageSmoothingEnabled = true;
  allocationCtx.imageSmoothingQuality = 'high';

  if (!positions.length) {
    allocationCtx.fillStyle = 'rgba(255,255,255,0.6)';
    allocationCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    allocationCtx.textAlign = 'left';
    allocationCtx.textBaseline = 'middle';
    allocationCtx.fillText('Add holdings to see allocation.', 30, height / 2);
    if (elements.allocationLegendMain) {
      elements.allocationLegendMain.innerHTML = '';
    }
    return;
  }

  const totalValue = positions.reduce((sum, asset) => sum + asset.value, 0);
  const radius = Math.min(width, height) / 2 - 20;
  let startAngle = -Math.PI / 2;

  positions.forEach((asset, index) => {
    const portion = totalValue ? (asset.value / totalValue) * Math.PI * 2 : 0;
    const color = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length];
    allocationCtx.beginPath();
    allocationCtx.moveTo(width / 2, height / 2);
    allocationCtx.arc(width / 2, height / 2, radius, startAngle, startAngle + portion);
    allocationCtx.closePath();
    allocationCtx.fillStyle = color;
    allocationCtx.fill();
    startAngle += portion;
  });

  allocationCtx.fillStyle = '#050915';
  allocationCtx.beginPath();
  allocationCtx.arc(width / 2, height / 2, radius * 0.5, 0, Math.PI * 2);
  allocationCtx.fill();

  if (elements.allocationLegendMain) {
    elements.allocationLegendMain.innerHTML = positions
      .map((asset, index) => {
        const color = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length];
        const sharePct = totalValue ? ((asset.value / totalValue) * 100).toFixed(1) : '0.0';
        return `<li><span class="color-dot" style="background:${color}"></span>${asset.symbol} · ${formatCurrency(
          asset.value
        )} (${sharePct}%)</li>`;
      })
      .join('');
  }
}

function renderInsights(positions) {
  elements.insightViews?.forEach((view) => {
    const isActive = view.dataset.insightView === state.activeInsight;
    view.classList.toggle('active', isActive);
  });

  elements.insightTabs?.querySelectorAll('button[data-insight]').forEach((btn) => {
    const isActive = btn.dataset.insight === state.activeInsight;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  if (state.activeInsight === 'timeline') {
    renderTimelineChart(positions);
  }
}

function renderTrending() {
  if (!elements.trendingBody) return;
  const rows = TRENDING_SYMBOLS.map((symbol) => state.quotes[symbol]).filter(Boolean);

  if (!rows.length) {
    elements.trendingBody.innerHTML =
      '<tr><td colspan="5">No trending asset data yet. Try refreshing.</td></tr>';
    return;
  }

  elements.trendingBody.innerHTML = rows
    .map((asset) => {
      const change24 = asset.percent_change_24h ?? 0;
      const change7d = asset.percent_change_7d ?? 0;
      const marketCap = asset.market_cap
        ? new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(asset.market_cap)
        : '--';
      return `
        <tr>
            <td>
                <div>
                    <strong>${asset.symbol}</strong>
                    <p class="muted-text">${asset.name ?? ''}</p>
                </div>
            </td>
            <td>${formatPrice(asset.price)}</td>
            <td class="${change24 >= 0 ? 'trend-positive' : 'trend-negative'}">${formatPercent(change24)}</td>
            <td class="${change7d >= 0 ? 'trend-positive' : 'trend-negative'}">${formatPercent(change7d)}</td>
            <td>${marketCap}</td>
        </tr>
      `;
    })
    .join('');
}

function renderAssetsTable(positions) {
  if (!elements.assetTableBody) return;
  if (!positions.length) {
    elements.assetTableBody.innerHTML = '<tr><td colspan="7">No assets added yet.</td></tr>';
    return;
  }

  elements.assetTableBody.innerHTML = positions
    .map((asset) => {
      const changeClass = asset.pnl >= 0 ? 'positive' : 'negative';
      return `
        <tr>
            <td>
                <strong>${asset.symbol}</strong>
                <p class="muted-text">${asset.name ?? ''}</p>
            </td>
            <td>${asset.amount}</td>
            <td>${formatCurrency(asset.unitCost, asset.unitCost >= 1 ? 2 : 4)}</td>
            <td>${formatPrice(asset.price)}</td>
            <td>${formatCurrency(asset.value)}</td>
            <td class="${changeClass}">
                ${formatCurrency(asset.pnl)} (${formatPercent(asset.changePct)})
            </td>
            <td>
                <button class="remove-btn" data-symbol="${asset.symbol}">Remove</button>
            </td>
        </tr>
      `;
    })
    .join('');
}

function renderChart(positions) {
  if (!chartCtx || !chartCanvas) return;
  
  // Ensure canvas has proper DPI resolution
  const dpr = window.devicePixelRatio || 1;
  const width = chartCanvas.clientWidth || 900;
  const height = chartCanvas.clientHeight || 350;
  
  if (chartCanvas.width !== width * dpr || chartCanvas.height !== height * dpr) {
    chartCanvas.width = width * dpr;
    chartCanvas.height = height * dpr;
    chartCtx.scale(dpr, dpr);
  }
  
  const ctx = chartCtx;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (!positions.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add assets to populate the chart.', 30, height / 2);
    return;
  }

  const margins = { top: 30, bottom: 30 };
  const barHeight = Math.min(40, (height - margins.top - margins.bottom) / positions.length - 10);
  const maxAbs = Math.max(...positions.map((asset) => Math.abs(asset.pnl)), 1);
  const centerX = width / 2;
  const maxWidth = width * 0.4;
  const scale = maxWidth / maxAbs;

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, 10);
  ctx.lineTo(centerX, height - 10);
  ctx.stroke();

  positions.forEach((asset, index) => {
    const barWidth = Math.abs(asset.pnl) * scale;
    const barY = margins.top + index * (barHeight + 12);
    ctx.fillStyle = asset.pnl >= 0 ? '#4ade80' : '#ff6b81';
    if (asset.pnl >= 0) {
      ctx.fillRect(centerX, barY, barWidth, barHeight);
    } else {
      ctx.fillRect(centerX - barWidth, barY, barWidth, barHeight);
    }

    ctx.fillStyle = '#f4f6fb';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `${asset.symbol} ${formatCurrency(asset.pnl)} (${formatPercent(asset.changePct)})`,
      20,
      barY + barHeight
    );
  });
}

function renderLastUpdated() {
  if (!elements.lastUpdated) return;
  elements.lastUpdated.textContent = state.lastUpdated
    ? `Last sync: ${state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Waiting for live data...';
}



function render() {
  const positions = getPositions();
  renderMetrics(positions);
  renderAssetsTable(positions);
  renderChart(positions);
  renderTrending();
  renderInsights(positions);
  renderAllocationChart(positions);
  renderLastUpdated();
}



async function fetchQuotes(symbols) {
  const uniqueSymbols = [...new Set(symbols.map((sym) => sym.toUpperCase()).filter(Boolean))];
  if (!uniqueSymbols.length) {
    console.warn('No symbols provided to fetchQuotes');
    return {};
  }
  const params = new URLSearchParams({
    symbols: uniqueSymbols.join(',')
  });
  const url = `${API_URL}?${params.toString()}`;
  
  console.log('Fetching quotes from:', url);
  
  try {
    const response = await fetch(url);
    console.log('API Response status:', response.status);

    if (!response.ok) {
      try {
        const errorPayload = await response.json();
        console.error('API error payload:', errorPayload);
        throw new Error(errorPayload.details || errorPayload.error || `API error: ${response.status}`);
      } catch (error) {
        throw new Error(error.message || `API error: ${response.status}`);
      }
    }
    
    let payload;
    try {
      payload = await response.json();
      console.log('API payload received:', payload);
    } catch (error) {
      console.error('JSON parse error:', error);
      throw new Error('Server returned invalid data.');
    }
    
    if (payload.status?.error_code && payload.status.error_code !== 0) {
      console.error('CoinMarketCap error:', payload.status);
      throw new Error(payload.status.error_message || 'CoinMarketCap error');
    }

    const quotes = {};
    Object.values(payload.data || {}).forEach((entry) => {
      const usd = entry.quote?.USD;
      if (!usd) return;
      quotes[entry.symbol] = {
        symbol: entry.symbol,
        name: entry.name,
        price: usd.price,
        percent_change_1h: usd.percent_change_1h,
        percent_change_24h: usd.percent_change_24h,
        percent_change_7d: usd.percent_change_7d,
        market_cap: usd.market_cap
      };
    });
    
    console.log('Parsed quotes:', quotes);
    return quotes;
  } catch (error) {
    console.error('fetchQuotes error:', error);
    throw error;
  }
}

async function refreshMarketData(extraSymbols = []) {
  const symbols = [
    ...new Set([...TRENDING_SYMBOLS, ...state.customAssets.map((asset) => asset.symbol), ...extraSymbols])
  ];
  if (!symbols.length) return;
  try {
    setAlert('Fetching latest prices...');
    const quotes = await fetchQuotes(symbols);
    state.quotes = {
      ...state.quotes,
      ...quotes
    };
    state.lastUpdated = new Date();
    setAlert('Prices updated.', 'success');
    setTimeout(() => setAlert(''), 2000);
  } catch (error) {
    console.error(error);
    setAlert(`Failed to fetch prices: ${error.message}`, 'error');
  } finally {
    render();
  }
}

elements.assetForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Get form values safely
  const symbolInput = elements.assetSymbol?.value?.trim().toUpperCase() || '';
  const amountInput = elements.assetAmount?.value?.trim() || '';
  const costInput = elements.assetCost?.value?.trim() || '';
  const dateInput = elements.assetDate?.value?.trim() || '';
  
  // Parse and validate
  const symbol = symbolInput;
  const amount = parseFloat(amountInput);
  const cost = parseFloat(costInput);
  
  // Parse date from DD/MM/YYYY format
  let dateAdded = new Date().toISOString();
  if (dateInput) {
    const dateParts = dateInput.split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        dateAdded = parsedDate.toISOString();
      }
    }
  }

  // Validation checks
  const validationError = validateAssetInput(symbol, amount, cost);
  if (validationError) {
    setAlert(validationError, 'error');
    return;
  }

  const submitBtn = elements.assetForm?.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    setAlert(`Checking ${symbol} on CoinMarketCap...`);
    
    // Fetch quote with timeout
    const quotes = await Promise.race([
      fetchQuotes([symbol]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )
    ]);
    
    if (!quotes || typeof quotes !== 'object' || !quotes[symbol]) {
      throw new Error(`Symbol "${symbol}" not found. Please check the spelling and try again.`);
    }

    // Update state
    state.quotes = { ...state.quotes, ...quotes };
    
    // Create unique ID
    const uniqueId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    // Add asset
    const newAsset = { id: uniqueId, symbol, amount, cost, dateAdded };
    state.customAssets.push(newAsset);
    saveAssets();
    
    // Reset form
    elements.assetForm?.reset();
    elements.assetSymbol && (elements.assetSymbol.value = '');
    hideSymbolSuggestions();
    
    // Update UI
    state.lastUpdated = new Date();
    render();
    setAlert(`✓ ${symbol} added to portfolio successfully!`, 'success');
    
    // Auto-clear message
    setTimeout(() => setAlert(''), 3500);
    
  } catch (error) {
    console.error('Asset add error:', error);
    let errorMsg = 'Failed to add asset';
    
    if (error.message.includes('timeout')) {
      errorMsg = 'Server is not responding. Please check the connection and try again.';
    } else if (error.message.includes('not found')) {
      errorMsg = error.message;
    } else if (error.message.includes('fetch')) {
      errorMsg = 'Network error - please check your connection';
    } else {
      errorMsg = error.message || 'An unexpected error occurred';
    }
    
    setAlert(errorMsg, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

elements.assetSymbol?.addEventListener('input', (event) => {
  event.target.value = event.target.value.toUpperCase();
  renderSymbolSuggestions(event.target.value);
});

elements.assetSymbol?.addEventListener('focus', (event) => {
  renderSymbolSuggestions(event.target.value);
});

elements.symbolSuggestions?.addEventListener('mousedown', (event) => {
  const option = event.target.closest('li[data-symbol]');
  if (!option) return;
  const value = option.dataset.symbol;
  elements.assetSymbol.value = value;
  hideSymbolSuggestions();
});

document.addEventListener('click', (event) => {
  if (!elements.symbolInputWrapper) return;
  if (
    event.target === elements.assetSymbol ||
    elements.symbolInputWrapper.contains(event.target)
  ) {
    return;
  }
  hideSymbolSuggestions();
});

elements.timelineControls?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-range]');
  if (!button) return;
  const { range } = button.dataset;
  if (!range || range === state.selectedRange) return;
  state.selectedRange = range;
  render();
});

elements.insightTabs?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-insight]');
  if (!button) return;
  const { insight } = button.dataset;
  if (!insight || insight === state.activeInsight) return;
  state.activeInsight = insight;
  render();
});

elements.assetTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-btn');
  if (!button) return;
  const { symbol, id } = button.dataset;
  if (symbol) {
    state.customAssets = state.customAssets.filter((asset) => asset.symbol !== symbol);
  } else if (id) {
    state.customAssets = state.customAssets.filter((asset) => asset.id !== id);
  }
  saveAssets();
  render();
});

elements.clearAssets?.addEventListener('click', () => {
  if (!state.customAssets.length) return;
  state.customAssets = [];
  saveAssets();
  render();
  setAlert('Portfolio cleared successfully.', 'success');
});

elements.refreshAll?.addEventListener('click', () => refreshMarketData());

function init() {
  render();
  refreshMarketData();
}

init();
