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

const state = {
  customAssets: loadAssets(),
  quotes: {},
  lastUpdated: null,
  selectedRange: '1h',
  activeInsight: 'markets'
};

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
  allocationLegend: document.getElementById('allocationLegend'),
  alert: document.getElementById('alert'),
  assetForm: document.getElementById('assetForm'),
  assetSymbol: document.getElementById('assetSymbol'),
  assetAmount: document.getElementById('assetAmount'),
  assetCost: document.getElementById('assetCost'),
  assetTableBody: document.getElementById('assetTableBody'),
  clearAssets: document.getElementById('clearAssets'),
  symbolSuggestions: document.getElementById('symbolSuggestions'),
  symbolInputWrapper: document.querySelector('.symbol-input')
};

const chartCanvas = document.getElementById('plChart');
const chartCtx = chartCanvas?.getContext('2d');
const timelineCanvas = document.getElementById('timelineChart');
const timelineCtx = timelineCanvas?.getContext('2d');
const allocationCanvas = document.getElementById('allocationChart');
const allocationCtx = allocationCanvas?.getContext('2d');

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

function renderTimelineChart(positions) {
  if (!timelineCtx || !timelineCanvas) return;
  const width = timelineCanvas.clientWidth || timelineCanvas.width;
  const height = timelineCanvas.clientHeight || timelineCanvas.height;
  if (timelineCanvas.width !== width || timelineCanvas.height !== height) {
    timelineCanvas.width = width;
    timelineCanvas.height = height;
  }
  timelineCtx.clearRect(0, 0, width, height);

  if (elements.timelineControls) {
    elements.timelineControls.querySelectorAll('button[data-range]').forEach((btn) => {
      const isActive = btn.dataset.range === state.selectedRange;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  if (!positions.length) {
    timelineCtx.fillStyle = 'rgba(255,255,255,0.6)';
    timelineCtx.font = '16px "Inter", sans-serif';
    timelineCtx.fillText('Add assets to view the timeline.', 30, height / 2);
    if (elements.timelineSummary) {
      elements.timelineSummary.textContent = 'Waiting for positions...';
      elements.timelineSummary.classList.remove('positive', 'negative');
    }
    return;
  }

  const currentValue = positions.reduce((sum, asset) => sum + asset.value, 0);
  const baseValue = getPortfolioValueForRange(state.selectedRange, positions) ?? currentValue;
  const steps = 8;
  const values = [];
  for (let i = 0; i < steps; i += 1) {
    const progress = i / (steps - 1);
    const linear = baseValue + (currentValue - baseValue) * progress;
    const wave = Math.sin(progress * Math.PI) * (currentValue - baseValue) * 0.08;
    values.push(linear + wave);
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const padding = 30;
  timelineCtx.strokeStyle = 'rgba(255,255,255,0.15)';
  timelineCtx.lineWidth = 1;
  timelineCtx.beginPath();
  timelineCtx.moveTo(padding, height - padding);
  timelineCtx.lineTo(width - padding, height - padding);
  timelineCtx.stroke();

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
    return { x, y };
  });

  timelineCtx.strokeStyle = '#7df3c0';
  timelineCtx.lineWidth = 3;
  timelineCtx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      timelineCtx.moveTo(point.x, point.y);
    } else {
      timelineCtx.lineTo(point.x, point.y);
    }
  });
  timelineCtx.stroke();

  timelineCtx.fillStyle = '#0d1b2a';
  timelineCtx.globalAlpha = 0.35;
  timelineCtx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      timelineCtx.moveTo(point.x, point.y);
    } else {
      timelineCtx.lineTo(point.x, point.y);
    }
  });
  timelineCtx.lineTo(width - padding, height - padding);
  timelineCtx.lineTo(padding, height - padding);
  timelineCtx.closePath();
  timelineCtx.fill();
  timelineCtx.globalAlpha = 1;

  timelineCtx.fillStyle = '#7df3c0';
  points.forEach((point) => {
    timelineCtx.beginPath();
    timelineCtx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    timelineCtx.fill();
  });

  const delta = currentValue - baseValue;
  const deltaPct = baseValue ? (delta / baseValue) * 100 : 0;
  if (elements.timelineSummary) {
    const frameInfo = TIMEFRAMES.find((item) => item.id === state.selectedRange);
    const label = frameInfo?.description ?? 'Change';
    elements.timelineSummary.textContent = `${label}: ${formatCurrency(delta)} (${formatPercent(deltaPct)})`;
    elements.timelineSummary.classList.remove('positive', 'negative');
    elements.timelineSummary.classList.add(delta >= 0 ? 'positive' : 'negative');
  }
}

function renderAllocationChart(positions) {
  if (!allocationCtx || !allocationCanvas) return;
  const width = allocationCanvas.clientWidth || allocationCanvas.width;
  const height = allocationCanvas.clientHeight || allocationCanvas.height;
  if (allocationCanvas.width !== width || allocationCanvas.height !== height) {
    allocationCanvas.width = width;
    allocationCanvas.height = height;
  }
  allocationCtx.clearRect(0, 0, width, height);

  if (!positions.length) {
    allocationCtx.fillStyle = 'rgba(255,255,255,0.6)';
    allocationCtx.font = '16px "Inter", sans-serif';
    allocationCtx.fillText('Add holdings to see allocation.', 30, height / 2);
    if (elements.allocationLegend) {
      elements.allocationLegend.innerHTML = '';
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

  if (elements.allocationLegend) {
    elements.allocationLegend.innerHTML = positions
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
  } else if (state.activeInsight === 'allocation') {
    renderAllocationChart(positions);
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
  const ctx = chartCtx;
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  ctx.clearRect(0, 0, width, height);

  if (!positions.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px "Inter", sans-serif';
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
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText(
      `${asset.symbol} ${formatCurrency(asset.pnl)} (${formatPercent(asset.changePct)})`,
      20,
      barY + barHeight - 4
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
  renderLastUpdated();
}

async function fetchQuotes(symbols) {
  const uniqueSymbols = [...new Set(symbols.map((sym) => sym.toUpperCase()).filter(Boolean))];
  if (!uniqueSymbols.length) return {};
  const params = new URLSearchParams({
    symbols: uniqueSymbols.join(',')
  });
  const url = `${API_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    try {
      const errorPayload = await response.json();
      throw new Error(errorPayload.details || errorPayload.error || `API error: ${response.status}`);
    } catch (error) {
      throw new Error(error.message || `API error: ${response.status}`);
    }
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('Server returned invalid data.');
  }
  if (payload.status?.error_code && payload.status.error_code !== 0) {
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

  return quotes;
}

async function refreshMarketData(extraSymbols = []) {
  const symbols = [
    ...new Set([...TRENDING_SYMBOLS, ...state.customAssets.map((asset) => asset.symbol), ...extraSymbols])
  ];
  if (!symbols.length) return;
  try {
    setAlert('Refreshing market data...');
    const quotes = await fetchQuotes(symbols);
    state.quotes = {
      ...state.quotes,
      ...quotes
    };
    state.lastUpdated = new Date();
    setAlert('Market data updated.', 'success');
    setTimeout(() => setAlert(''), 2000);
  } catch (error) {
    console.error(error);
    setAlert(`Unable to fetch CoinMarketCap data: ${error.message}`, 'error');
  } finally {
    render();
  }
}

elements.assetForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const symbol = elements.assetSymbol.value.trim().toUpperCase();
  const amount = parseFloat(elements.assetAmount.value);
  const cost = parseFloat(elements.assetCost.value);

  if (!symbol || !amount || amount <= 0 || isNaN(cost) || cost < 0) {
    setAlert('Please provide a valid symbol, amount and cost.', 'error');
    return;
  }

  const submitBtn = elements.assetForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    const quotes = await fetchQuotes([symbol]);
    if (!quotes[symbol]) {
      setAlert('This symbol could not be found on CoinMarketCap.', 'error');
      return;
    }

    state.quotes = { ...state.quotes, ...quotes };
    const uniqueId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.customAssets = [
      ...state.customAssets,
      {
        id: uniqueId,
        symbol,
        amount,
        cost
      }
    ];
    saveAssets();
    elements.assetForm.reset();
    hideSymbolSuggestions();
    setAlert(`${symbol} added to your portfolio.`, 'success');
    state.lastUpdated = new Date();
  } catch (error) {
    console.error(error);
    setAlert('Something went wrong while adding the asset.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add asset';
    render();
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
  setAlert('All assets cleared.', 'success');
});

elements.refreshAll?.addEventListener('click', () => refreshMarketData());

function init() {
  render();
  refreshMarketData();
}

init();
