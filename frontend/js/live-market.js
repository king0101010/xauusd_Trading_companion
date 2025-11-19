// live-market.js - Enhanced with Real Market Data Integration

class LiveMarket {
    constructor() {
        this.liveData = null;
        this.updateInterval = null;
        this.isConnected = false;
        this.apiStatus = 'checking';
    }

    initialize() {
        console.log('🌐 Initializing Live Market Data with Real APIs...');
        this.startLiveUpdates();
        this.setupMarketListeners();
        this.updateConnectionStatus();
    }

    async startLiveUpdates() {
        // Update every 5 seconds for real-time feel
        this.updateInterval = setInterval(() => {
            this.fetchLiveData();
        }, 5000);
        
        // Initial fetch
        await this.fetchLiveData();
    }

    async fetchLiveData() {
        try {
            const response = await fetch('/live-price');
            if (!response.ok) throw new Error('Failed to fetch live data');
            
            this.liveData = await response.json();
            this.isConnected = this.liveData.success !== false;
            this.apiStatus = this.isConnected ? 'connected' : 'simulated';
            
            this.updateMarketDisplay();
            this.updateConnectionStatus();
            
        } catch (error) {
            console.error('Error fetching live data:', error);
            this.isConnected = false;
            this.apiStatus = 'error';
            this.fallbackToRealisticData();
        }
    }

    fallbackToRealisticData() {
        // Generate data based on actual current XAU/USD market conditions
        const basePrice = 1835 + (Math.random() * 30 - 15);
        const change = (Math.random() * 10 - 5);
        const changePercent = (change / basePrice) * 100;
        
        this.liveData = {
            symbol: 'XAU/USD',
            price: basePrice.toFixed(2),
            timestamp: new Date().toISOString(),
            source: 'Market Simulation',
            change: change.toFixed(2),
            change_percent: changePercent.toFixed(2),
            high: (basePrice + Math.random() * 8).toFixed(2),
            low: (basePrice - Math.random() * 8).toFixed(2),
            volume: Math.floor(Math.random() * 50000 + 20000),
            success: false
        };
        
        this.updateMarketDisplay();
        this.updateConnectionStatus();
    }

    updateMarketDisplay() {
        if (!this.liveData) return;

        // Update main price display
        const livePrice = document.getElementById('livePrice');
        const currentPrice = document.getElementById('currentPrice');
        const currentLevel = document.getElementById('currentLevel');

        if (livePrice) {
            livePrice.textContent = `$${this.liveData.price}`;
            livePrice.classList.add('animate-pulse');
            setTimeout(() => livePrice.classList.remove('animate-pulse'), 1000);
        }
        
        if (currentPrice) {
            currentPrice.textContent = `$${this.liveData.price}`;
        }
        
        if (currentLevel) {
            currentLevel.textContent = `$${this.liveData.price}`;
        }

        // Update market status and price change
        this.updateMarketStatus();
        this.updatePriceChange();
        
        // Update additional market info if elements exist
        this.updateMarketDetails();
    }

    updateMarketStatus() {
        const marketStatus = document.getElementById('marketStatus');
        if (!marketStatus) return;

        switch(this.apiStatus) {
            case 'connected':
                marketStatus.textContent = 'LIVE';
                marketStatus.className = 'px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium';
                break;
            case 'simulated':
                marketStatus.textContent = 'SIMULATED';
                marketStatus.className = 'px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium';
                break;
            case 'error':
                marketStatus.textContent = 'OFFLINE';
                marketStatus.className = 'px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium';
                break;
            default:
                marketStatus.textContent = 'CHECKING';
                marketStatus.className = 'px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium';
        }
    }

    updatePriceChange() {
        const priceChange = document.getElementById('priceChange');
        const change = parseFloat(this.liveData.change);
        const changePercent = parseFloat(this.liveData.change_percent);

        if (!priceChange) {
            // Create price change element if it doesn't exist
            const priceContainer = document.getElementById('livePrice');
            if (priceContainer && priceContainer.parentElement) {
                const changeHtml = `<div id="priceChange" class="text-xs font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}">${change >= 0 ? '+' : ''}${this.liveData.change} (${changePercent >= 0 ? '+' : ''}${this.liveData.change_percent}%)</div>`;
                priceContainer.parentElement.insertAdjacentHTML('beforeend', changeHtml);
            }
        } else {
            priceChange.textContent = `${change >= 0 ? '+' : ''}${this.liveData.change} (${changePercent >= 0 ? '+' : ''}${this.liveData.change_percent}%)`;
            priceChange.className = `text-xs font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`;
        }
    }

    updateMarketDetails() {
        // Update high/low if elements exist
        const marketHigh = document.getElementById('marketHigh');
        const marketLow = document.getElementById('marketLow');
        const marketVolume = document.getElementById('marketVolume');
        
        if (marketHigh) marketHigh.textContent = `$${this.liveData.high}`;
        if (marketLow) marketLow.textContent = `$${this.liveData.low}`;
        if (marketVolume) marketVolume.textContent = this.liveData.volume.toLocaleString();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        let statusText, statusClass;
        
        switch(this.apiStatus) {
            case 'connected':
                statusText = '✅ Connected to Live Market Data';
                statusClass = 'text-green-600 dark:text-green-400';
                break;
            case 'simulated':
                statusText = '🔄 Using Realistic Market Simulation';
                statusClass = 'text-yellow-600 dark:text-yellow-400';
                break;
            case 'error':
                statusText = '❌ Market Data Offline - Using Simulation';
                statusClass = 'text-red-600 dark:text-red-400';
                break;
            default:
                statusText = '⏳ Connecting to Market Data...';
                statusClass = 'text-blue-600 dark:text-blue-400';
        }
        
        statusElement.textContent = statusText;
        statusElement.className = `text-sm ${statusClass}`;
    }

    setupMarketListeners() {
        // Add manual refresh capability
        const refreshPrice = document.getElementById('refreshPrice');
        if (refreshPrice) {
            refreshPrice.addEventListener('click', () => {
                this.fetchLiveData();
                if (window.showNotification) {
                    window.showNotification('🔄 Refreshing live market data...', 'info');
                }
            });
        }

        // Add API key configuration reminder
        this.showApiKeyReminder();

        // Visibility management
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
    }

    showApiKeyReminder() {
        // Show reminder about getting real API keys
        if (this.apiStatus === 'simulated' && window.showNotification) {
            setTimeout(() => {
                window.showNotification(
                    '💡 Get free API keys for real-time XAU/USD data from Alpha Vantage or Financial Modeling Prep',
                    'info'
                );
            }, 3000);
        }
    }

    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    resumeUpdates() {
        if (!this.updateInterval) {
            this.startLiveUpdates();
        }
    }

    // Get current market data
    getMarketData() {
        return this.liveData;
    }

    // Get market summary for dashboard
    getMarketSummary() {
        if (!this.liveData) return null;

        return {
            price: this.liveData.price,
            change: this.liveData.change,
            changePercent: this.liveData.change_percent,
            status: this.apiStatus,
            timestamp: this.liveData.timestamp,
            high: this.liveData.high,
            low: this.liveData.low,
            volume: this.liveData.volume,
            source: this.liveData.source
        };
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize Live Market when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.liveMarket = new LiveMarket();
    
    setTimeout(() => {
        if (window.liveMarket) {
            window.liveMarket.initialize();
        }
    }, 1000);
});

// Export for global access
window.LiveMarket = LiveMarket;