# Assets Tracker (Web Design & Development project)

This repository now contains only the Assets Tracker project we built for the Web Design & Development course. The brief required:

- A custom front-end (HTML/CSS/JS only) with live data
- A UI/UX concept that feels polished without frameworks
- An API integration (CoinMarketCap) plus a small full-stack touch

## What’s inside

```
├─ index.html        # main dashboard UI
├─ styles.css        # aurora theme and responsive layout
├─ app.js            # CoinMarketCap integration + state management
├─ server.py         # Python proxy hiding the API key
├─ coinmarket.ini    # local API key holder (do not commit secrets in production!)
├─ test.html         # quick BTC-price tester for the proxy
```

## Run locally

1. **Install dependencies** (only `requests` is required):
   ```bash
   pip install requests python-dateutil pytz
   ```
2. **Start the CoinMarketCap proxy**:
   ```bash
   python server.py
   ```
3. **Serve the front-end** in another terminal:
   ```bash
   python -m http.server 5500
   ```
   Then open http://localhost:5500/ in your browser (or `/test.html` to verify the API key quickly).

## Highlights

- Trending cards with live 24h / 7d data
- Custom holdings form with autocomplete ticker input
- Profit/loss analytics with a canvas-based chart
- Python proxy (HTTPServer + `requests`) to keep the API key private and bypass CORS

`version1` is our initial release for the class submission; future tweaks can build from this minimal codebase.
