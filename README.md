# AssetPulse - Crypto Portfolio Tracker

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

A sophisticated, real-time cryptocurrency portfolio tracker powered by the CoinMarketCap API. Track your crypto holdings, analyze profit/loss performance, and monitor market trends through an intuitive, modern dark-mode interface.

## 📋 Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Author](#author)
- [License](#license)

## ✨ Features

### Core Functionality
- **Real-time Market Data**: Live price feeds and market information from CoinMarketCap API
- **Portfolio Management**: Add, track, and manage your cryptocurrency holdings with precise cost basis
- **Profit/Loss Analytics**: Detailed P/L analysis per asset and portfolio-wide performance metrics
- **30-Day Performance Chart**: Visual timeline showing daily profit/loss movements with trend analysis
- **Allocation Dashboard**: Interactive donut chart displaying portfolio composition and asset distribution
- **Market Insights**: Trending cryptocurrencies with 24-hour and 7-day percentage changes
- **P/L Distribution**: Bar chart visualization of individual asset performance

### Technical Features
- **Local Data Storage**: All portfolio data stored securely in browser's localStorage
- **Responsive Design**: Optimized for desktop viewing with adaptive layouts
- **High-DPI Support**: Crystal-clear rendering on Retina and high-resolution displays
- **Dark Mode Interface**: Modern, easy-on-the-eyes design with custom CSS properties
- **Real-time Refresh**: Auto-updating price quotes and performance metrics

## 💻 System Requirements

- **Python**: 3.8 or higher
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet**: Active connection for API calls to CoinMarketCap
- **Storage**: Minimal (data stored in browser localStorage)

## 📥 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/assetpulse.git
cd assetpulse
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- `requests` (HTTP library for API calls)

### Step 3: Configure API Key

You have two options to provide your CoinMarketCap API key:

#### Option A: Using Configuration File
Create a `coinmarket.ini` file in the project root directory:
```ini
[DEFAULT]
API_KEY = your_api_key_here
```

#### Option B: Using Environment Variable
Set the environment variable:
```bash
# Linux/macOS
export CMC_API_KEY="your_api_key_here"

# Windows PowerShell
$env:CMC_API_KEY="your_api_key_here"

# Windows Command Prompt
set CMC_API_KEY=your_api_key_here
```

> Get your free API key at [CoinMarketCap API](https://coinmarketcap.com/api/)

## 🚀 Usage

### Starting the Application

1. **Start the Python proxy server:**
   ```bash
   python server.py
   ```
   You should see: `CMC proxy listening on http://127.0.0.1:5050/api/quotes`

2. **Open the application:**
   - Navigate to `file://path/to/assetpulse/index.html` in your browser, or
   - Use a local server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     # Then visit http://localhost:8000/index.html
     ```

3. **Add your assets:**
   - Enter cryptocurrency symbol (e.g., BTC, ETH, SOL)
   - Specify amount held
   - Enter cost per unit in USD
   - Select date added (DD/MM/YYYY format)
   - Click "Add asset"

4. **Monitor your portfolio:**
   - View real-time price updates and P/L changes
   - Analyze allocation across different assets
   - Check 30-day performance trends
   - Compare asset performance metrics

## 🏗️ Architecture

```
assetpulse/
├── index.html           # Main UI and structure
├── app.js              # Core application logic and rendering
├── styles.css          # Design system and styling
├── server.py           # CoinMarketCap API proxy server
├── coinmarket.ini      # API configuration (create this)
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

### Data Flow
```
Browser (index.html/app.js)
    ↓
Local Proxy (server.py:5050)
    ↓
CoinMarketCap API
    ↓
Price Data → localStorage → Canvas Charts
```

## 🛠️ Technologies

### Frontend
- **HTML5**: Semantic markup and canvas elements
- **CSS3**: Custom properties, Flexbox, Grid, and animations
- **Vanilla JavaScript**: ES6+, async/await, fetch API
- **Canvas API**: For chart rendering with high-DPI support

### Backend
- **Python 3**: Core language
- **http.server**: Lightweight HTTP server for file serving
- **requests**: HTTP library for CoinMarketCap API integration
- **configparser**: Configuration file management

### APIs & Services
- **CoinMarketCap API**: Real-time cryptocurrency data
- **Browser APIs**: localStorage, fetch, requestAnimationFrame

## � Authors

AssetPulse was developed by:

- **Caner Akcasu** - Core Architecture & Portfolio Analytics
- **Kaan Yazıcıoğlu** - Frontend Development & UI/UX Design
- **Sedat Kara** - Backend API Integration & Server Implementation

Created: February 2026

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Privacy & Security

- **No account required**: Complete anonymity and privacy
- **Local storage only**: Your portfolio data never leaves your browser
- **No tracking**: No analytics, cookies, or user tracking
- **API proxy only**: Server acts as a secure proxy to CoinMarketCap API

## 🐛 Troubleshooting

### Server Not Responding
- Ensure `server.py` is running on port 5050
- Check firewall settings
- Verify API key is valid

### API Key Invalid
- Regenerate key at CoinMarketCap dashboard
- Check for trailing/leading whitespace in configuration
- Verify environment variable is set correctly

### Data Not Displaying
- Clear browser cache and localStorage
- Check browser console for errors (F12)
- Ensure CoinMarketCap API is accessible

## 📞 Support

For issues, questions, or suggestions:
1. Check the troubleshooting section above
2. Review browser console errors (F12 → Console)
3. Verify server is running and accessible

## 🚀 Future Enhancements

Potential features for future releases:
- [ ] Portfolio export (CSV, PDF)
- [ ] Mobile-responsive design
- [ ] Historical price tracking
- [ ] Portfolio comparison and benchmarking
- [ ] Tax reporting calculations
- [ ] Multi-portfolio management
- [ ] Dark/light theme toggle

---

**Built with ❤️ for crypto enthusiasts**
