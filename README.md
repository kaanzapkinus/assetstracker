# AssetPulse

AssetPulse is a modern, real-time crypto portfolio tracker powered by the CoinMarketCap API. Track your holdings, view profit/loss analysis, and monitor market trends in a beautiful, dark-mode interface.

## Features

- **Real-time Data**: Fetches live prices and market data from CoinMarketCap.
- **Portfolio Tracking**: Add your assets, tracking amount and cost basis.
- **Profit/Loss Analysis**: Instantly see your gains/losses per asset and for the total portfolio.
- **Interactive Graphs**: Visual timeline of simulated portfolio value and allocation charts.
- **Trending Markets**: Watch top cryptocurrencies and their 24h/7d performance.
- **Privacy Focused**: Data is stored locally in your browser.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kaanzapkinus/assetstracker.git
    cd assetstracker
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  (Optional) Set up your API Key:
    - Get a free API key from [CoinMarketCap](https://coinmarketcap.com/api/).
    - Create a `coinmarket.ini` file in the root directory:
      ```ini
      [DEFAULT]
      API_KEY = your_actual_api_key_here
      ```
    - Or set it as an environment variable: `CMC_API_KEY`.

## Usage

1.  Start the local proxy server:
    ```bash
    python server.py
    ```

2.  Open `index.html` in your web browser (or use a live server extension).

3.  Start adding your assets to the portfolio!

## Technologies

- **Frontend**: HTML5, CSS3 (Custom properties, Flexbox/Grid), Vanilla JavaScript.
- **Backend**: Python (Simple HTTP Server for API proxying).
