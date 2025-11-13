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

const state = {
  customAssets: loadAssets(),
  quotes: {},
  lastUpdated: null
};

const elements = {
  lastUpdated: document.getElementById('lastUpdated'),
  refreshAll: document.getElementById('refreshAll'),
  trendingBody: document.getElementById('trendingBody'),
  metricValue: document.getElementById('metricValue'),
  metricCost: document.getElementById('metricCost'),
  metricPnL: document.getElementById('metricPnL'),
  metricPnLPercent: document.getElementById('metricPnLPercent'),
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
  return state.customAssets
    .map((asset) => {
      const quote = state.quotes[asset.symbol];
      if (!quote) return null;
      const price = quote.price;
      const value = price * asset.amount;
      const unitCost = asset.cost;
      const cost = asset.amount * unitCost;
      const pnl = value - cost;
      const changePct = cost ? (pnl / cost) * 100 : 0;
      return {
        ...asset,
        name: quote.name,
        price,
        value,
        cost,
        unitCost,
        pnl,
        changePct
      };
    })
    .filter(Boolean);
}

function renderMetrics(positions) {
  const totalValue = positions.reduce((sum, asset) => sum + asset.value, 0);
  const totalCost = positions.reduce((sum, asset) => sum + asset.cost, 0);
  const pnl = totalValue - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost) * 100 : 0;

  elements.metricValue.textContent = formatCurrency(totalValue);
  elements.metricCost.textContent = formatCurrency(totalCost);
  elements.metricPnL.textContent = formatCurrency(pnl);
  elements.metricPnLPercent.textContent = `${pnl >= 0 ? 'Pozitif' : 'Negatif'} (${formatPercent(pnlPct)})`;

  elements.metricPnL.classList.remove('positive', 'negative');
  elements.metricPnL.classList.add(pnl >= 0 ? 'positive' : 'negative');
}

function renderTrending() {
  if (!elements.trendingBody) return;
  const rows = TRENDING_SYMBOLS.map((symbol) => state.quotes[symbol]).filter(Boolean);

  if (!rows.length) {
    elements.trendingBody.innerHTML =
      '<tr><td colspan="5">Populer varlik verileri alinmadi. Yenilemeyi deneyin.</td></tr>';
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
    elements.assetTableBody.innerHTML = '<tr><td colspan="7">Henuz varlik eklenmedi.</td></tr>';
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
                <button class="remove-btn" data-id="${asset.id}">Sil</button>
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
    ctx.fillText('Grafik icin portfoye varlik ekleyin.', 30, height / 2);
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
    ? `Son senkron: ${state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Canli veri bekleniyor...';
}

function render() {
  const positions = getPositions();
  renderMetrics(positions);
  renderAssetsTable(positions);
  renderChart(positions);
  renderTrending();
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
    throw new Error('Sunucudan geçersiz veri döndü.');
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
    setAlert('Veriler guncelleniyor...');
    const quotes = await fetchQuotes(symbols);
    state.quotes = {
      ...state.quotes,
      ...quotes
    };
    state.lastUpdated = new Date();
    setAlert('Veriler guncellendi.', 'success');
    setTimeout(() => setAlert(''), 2000);
  } catch (error) {
    console.error(error);
    setAlert(`CoinMarketCap verisi alinamadi: ${error.message}`, 'error');
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
    setAlert('Lutfen sembol, miktar ve maliyeti dogru girin.', 'error');
    return;
  }

  const submitBtn = elements.assetForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Ekleniyor...';

  try {
    const quotes = await fetchQuotes([symbol]);
    if (!quotes[symbol]) {
      setAlert('Bu sembol CoinMarketCap\'te bulunamadi.', 'error');
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
    setAlert(`${symbol} portfoye eklendi.`, 'success');
    state.lastUpdated = new Date();
  } catch (error) {
    console.error(error);
    setAlert('Varlik eklenirken bir hata olustu.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Varlik ekle';
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

elements.assetTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-btn');
  if (!button) return;
  const { id } = button.dataset;
  state.customAssets = state.customAssets.filter((asset) => asset.id !== id);
  saveAssets();
  render();
});

elements.clearAssets?.addEventListener('click', () => {
  if (!state.customAssets.length) return;
  state.customAssets = [];
  saveAssets();
  render();
  setAlert('Tum varliklar temizlendi.', 'success');
});

elements.refreshAll?.addEventListener('click', () => refreshMarketData());

function init() {
  render();
  refreshMarketData();
}

init();
