# Assets Tracker (Web Design & Development project)

All project files now live under ssetstracker/ on the desktop. The brief required:

- A custom front-end (HTML/CSS/JS only) with live data
- A UI/UX concept that feels polished without frameworks
- An API integration (CoinMarketCap) plus a small full-stack touch

## Folder layout

`
assetstracker/
├─ index.html        # main dashboard UI
├─ styles.css        # aurora theme and responsive layout
├─ app.js            # CoinMarketCap integration + state management
├─ server.py         # Python proxy hiding the API key
├─ coinmarket.ini    # local API key holder (do not commit secrets in production!)
└─ test.html         # quick BTC-price tester for the proxy
`

## Terminal commands to launch everything

Run these commands exactly (each block in its own terminal window):

1. **Install dependencies once**
   `powershell
   pip install requests python-dateutil pytz
   `
2. **Start the CoinMarketCap proxy**
   `powershell
   python server.py
   `
3. **Start the front-end server (new terminal)**
   `powershell
   python -m http.server 5500
   `
4. Open http://localhost:5500/ in the browser (or /test.html to verify the API key quickly).

### Tek satırda ikisini de başlatmak için (terminal zaten klasördeyken)

`powershell
Start-Process powershell -ArgumentList '-NoExit','-Command','python server.py'; Start-Process powershell -ArgumentList '-NoExit','-Command','python -m http.server 5500'
`

## Highlights

- Trending cards with live 24h / 7d data
- Custom holdings form with autocomplete ticker input
- Profit/loss analytics with a canvas-based chart
- Python proxy (HTTPServer + 
equests) to keep the API key private and bypass CORS

ersion1 is our initial release for the class submission; future tweaks can build from this minimal codebase.
