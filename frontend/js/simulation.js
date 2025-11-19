// simulation.js - Enhanced Stepwise Simulation Functionality

class PredictionSimulator {
    constructor() {
        this.data = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.speed = 1000;
        this.isInitialized = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            setTimeout(() => {
                this.initialize();
            }, 100);
        }
    }

    initialize() {
        this.initializeElements();
        this.bindEvents();
        this.isInitialized = true;
        console.log('PredictionSimulator initialized');
    }

    initializeElements() {
        this.elements = {
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            timelineSlider: document.getElementById('timelineSlider'),
            currentStep: document.getElementById('currentStep'),
            speedSelect: document.getElementById('speedSelect')
        };

        this.createSimulationStatus();
        this.updateControlStates();
    }

    createSimulationStatus() {
        if (!document.getElementById('simulationStatus')) {
            const statusHTML = `
                <div id="simulationStatus" class="trader-card mt-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Simulation Status</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-500 dark:text-gray-400">Date</div>
                            <div id="simCurrentDate" class="font-semibold">-</div>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-500 dark:text-gray-400">Actual Price</div>
                            <div id="simActualPrice" class="font-semibold">-</div>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-500 dark:text-gray-400">Predicted Price</div>
                            <div id="simPredictedPrice" class="font-semibold">-</div>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-500 dark:text-gray-400">Result</div>
                            <div id="simResult" class="font-semibold">-</div>
                        </div>
                    </div>
                    <div id="simulationStats" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-gray-500 dark:text-gray-400">Total Trades</div>
                            <div id="totalTrades" class="font-semibold">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500 dark:text-gray-400">Correct Predictions</div>
                            <div id="correctPredictions" class="font-semibold">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500 dark:text-gray-400">Accuracy</div>
                            <div id="simulationAccuracy" class="font-semibold">0%</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500 dark:text-gray-400">Profit/Loss</div>
                            <div id="simulationProfit" class="font-semibold">$0.00</div>
                        </div>
                    </div>
                    <div id="simulationMessage" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        Load prediction data to start simulation
                    </div>
                </div>
            `;
            
            const simulationSection = document.querySelector('.trader-card:last-child');
            if (simulationSection) {
                simulationSection.insertAdjacentHTML('afterend', statusHTML);
            }
        }
        
        this.stats = {
            totalTrades: 0,
            correctPredictions: 0,
            totalProfit: 0
        };
    }

    bindEvents() {
        const bindEvent = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                return true;
            }
            return false;
        };

        bindEvent(this.elements.playBtn, 'click', () => this.play());
        bindEvent(this.elements.pauseBtn, 'click', () => this.pause());
        bindEvent(this.elements.resetBtn, 'click', () => this.reset());
        
        if (this.elements.timelineSlider) {
            this.elements.timelineSlider.addEventListener('input', (e) => this.goToStep(parseInt(e.target.value)));
        }
        
        if (this.elements.speedSelect) {
            this.elements.speedSelect.addEventListener('change', (e) => this.setSpeed(parseInt(e.target.value)));
        }
    }

    updateControlStates() {
        const hasData = this.data && this.data.length > 0;
        
        if (this.elements.playBtn) {
            this.elements.playBtn.disabled = !hasData || this.isPlaying;
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = !hasData || !this.isPlaying;
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.disabled = !hasData;
        }
        if (this.elements.timelineSlider) {
            this.elements.timelineSlider.disabled = !hasData;
        }
        if (this.elements.speedSelect) {
            this.elements.speedSelect.disabled = !hasData;
        }
    }

    async loadData() {
        try {
            console.log('Loading prediction data...');
            const response = await fetch('/prediction-data');
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Prediction data not found. Please run AI analysis first.');
                }
                throw new Error(`Server error: ${response.status}`);
            }
            
            const realData = await response.json();
            
            if (realData && Array.isArray(realData) && realData.length > 0) {
                // Validate and clean data
                this.data = realData.map(item => ({
                    date: item.date || 'Unknown Date',
                    actual_price: typeof item.actual_price === 'number' ? item.actual_price : 0,
                    predicted_price: typeof item.predicted_price === 'number' ? item.predicted_price : 0,
                    confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : 0.5,
                    trade_suggestion: item.trade_suggestion || 'HOLD',
                    actual_trend: typeof item.actual_trend === 'number' ? item.actual_trend : 0,
                    predicted_trend: typeof item.predicted_trend === 'number' ? item.predicted_trend : 0
                }));
                
                this.setupSimulation();
                this.updateControlStates();
                
                console.log(`Simulation data loaded: ${this.data.length} records`);
                this.updateSimulationMessage(`✅ Loaded ${this.data.length} prediction records`, 'success');
                
                return true;
            } else {
                throw new Error('No valid prediction data available');
            }
        } catch (error) {
            console.error('Error loading prediction data:', error);
            this.updateSimulationMessage(`❌ ${error.message}`, 'error');
            
            if (window.showNotification) {
                window.showNotification('Simulation data not available. Run AI analysis first.', 'warning');
            }
            return false;
        }
    }

    setupSimulation() {
        if (!this.data || this.data.length === 0) {
            console.warn('No data available for simulation');
            this.updateSimulationMessage('❌ No prediction data available. Run AI analysis first.', 'error');
            return;
        }
        
        // Reset stats
        this.stats = {
            totalTrades: 0,
            correctPredictions: 0,
            totalProfit: 0
        };
        
        // Safely setup slider
        if (this.elements.timelineSlider) {
            this.elements.timelineSlider.max = Math.max(0, this.data.length - 1);
            this.elements.timelineSlider.value = 0;
        }
        
        this.currentIndex = 0;
        
        // Safely update display
        try {
            this.updateDisplay();
            this.updateStats();
        } catch (error) {
            console.error('Error in setupSimulation display:', error);
        }
        
        if (this.elements.currentStep) {
            this.elements.currentStep.textContent = `Step: 1/${this.data.length}`;
        }
        
        console.log(`Simulation setup complete with ${this.data.length} data points`);
    }

    play() {
        if (!this.data || this.data.length === 0) {
            this.updateSimulationMessage('❌ No data available. Please run AI analysis first.', 'error');
            if (window.showNotification) {
                window.showNotification('No simulation data available. Run AI analysis first.', 'warning');
            }
            return;
        }
        
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.updateControlStates();
        
        this.playInterval = setInterval(() => {
            if (this.currentIndex < this.data.length - 1) {
                this.currentIndex++;
                this.updateDisplay();
                this.updateStats();
            } else {
                this.pause();
                this.showCompletionMessage();
            }
        }, this.speed);
    }

    pause() {
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        this.updateControlStates();
    }

    reset() {
        this.pause();
        this.currentIndex = 0;
        this.setupSimulation();
    }

    goToStep(step) {
        if (step >= 0 && step < this.data.length) {
            this.currentIndex = step;
            this.updateDisplay();
            this.updateStats();
        }
    }

    setSpeed(speed) {
        this.speed = speed;
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    updateDisplay() {
        if (!this.data || this.data.length === 0 || this.currentIndex >= this.data.length) {
            console.warn('No data available for display');
            return;
        }

        try {
            const currentData = this.data[this.currentIndex];
            this.updateSimulationStatus(currentData);

            if (this.elements.timelineSlider) {
                this.elements.timelineSlider.value = this.currentIndex;
            }
            
            if (this.elements.currentStep) {
                this.elements.currentStep.textContent = `Step: ${this.currentIndex + 1}/${this.data.length}`;
            }

            this.updateChartHighlight(this.currentIndex);
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }

    updateSimulationStatus(data) {
        try {
            const currentDate = document.getElementById('simCurrentDate');
            const actualPrice = document.getElementById('simActualPrice');
            const predictedPrice = document.getElementById('simPredictedPrice');
            const result = document.getElementById('simResult');
            
            if (currentDate) {
                try {
                    const date = new Date(data.date);
                    currentDate.textContent = date.toLocaleDateString();
                } catch (e) {
                    currentDate.textContent = data.date || 'Unknown Date';
                }
            }
            
            if (actualPrice) {
                actualPrice.textContent = `$${typeof data.actual_price === 'number' ? data.actual_price.toFixed(2) : '0.00'}`;
            }
            
            if (predictedPrice) {
                predictedPrice.textContent = `$${typeof data.predicted_price === 'number' ? data.predicted_price.toFixed(2) : '0.00'}`;
            }
            
            if (result) {
                let resultText = '-';
                let resultClass = 'text-gray-600 dark:text-gray-400';
                
                if (this.currentIndex > 0) {
                    const isCorrect = data.actual_trend === data.predicted_trend;
                    resultText = isCorrect ? '✅ Correct' : '❌ Incorrect';
                    resultClass = isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                }
                
                result.textContent = resultText;
                result.className = `font-semibold ${resultClass}`;
            }
        } catch (error) {
            console.error('Error updating simulation status:', error);
        }
    }

    updateStats() {
        if (this.currentIndex === 0 || !this.data || this.data.length === 0) return;
        
        try {
            const currentData = this.data[this.currentIndex];
            const isCorrect = currentData.actual_trend === currentData.predicted_trend;
            
            if (this.currentIndex > 0) {
                this.stats.totalTrades++;
                if (isCorrect) {
                    this.stats.correctPredictions++;
                }
                
                // Simple P&L calculation (for demonstration)
                const prevData = this.data[this.currentIndex - 1];
                if (prevData && typeof prevData.actual_price === 'number' && typeof currentData.actual_price === 'number') {
                    const priceChange = currentData.actual_price - prevData.actual_price;
                    const tradeProfit = isCorrect ? Math.abs(priceChange) : -Math.abs(priceChange);
                    this.stats.totalProfit += tradeProfit;
                }
            }
            
            const accuracy = this.stats.totalTrades > 0 ? (this.stats.correctPredictions / this.stats.totalTrades) * 100 : 0;
            
            // Update UI
            const totalTrades = document.getElementById('totalTrades');
            const correctPredictions = document.getElementById('correctPredictions');
            const simulationAccuracy = document.getElementById('simulationAccuracy');
            const simulationProfit = document.getElementById('simulationProfit');
            
            if (totalTrades) totalTrades.textContent = this.stats.totalTrades;
            if (correctPredictions) correctPredictions.textContent = this.stats.correctPredictions;
            if (simulationAccuracy) {
                simulationAccuracy.textContent = `${accuracy.toFixed(1)}%`;
                simulationAccuracy.className = `font-semibold ${
                    accuracy >= 70 ? 'text-green-600 dark:text-green-400' :
                    accuracy >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                }`;
            }
            if (simulationProfit) {
                simulationProfit.textContent = `$${this.stats.totalProfit.toFixed(2)}`;
                simulationProfit.className = `font-semibold ${
                    this.stats.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    showCompletionMessage() {
        this.updateSimulationMessage('🎉 Simulation completed! Review the performance metrics.', 'success');
        if (window.showNotification) {
            window.showNotification('Simulation completed! Check the performance metrics.', 'success');
        }
    }

    updateSimulationMessage(message, type = 'info') {
        const messageElement = document.getElementById('simulationMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `mt-4 text-center text-sm ${
                type === 'success' ? 'text-green-600 dark:text-green-400' :
                type === 'error' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
            }`;
        }
    }

    updateChartHighlight(index) {
        if (window.updateChartHighlight) {
            try {
                window.updateChartHighlight(index);
            } catch (error) {
                console.error('Error in chart highlight:', error);
            }
        }
    }

    // Public method to manually set data
    setData(data) {
        if (data && Array.isArray(data) && data.length > 0) {
            this.data = data;
            this.setupSimulation();
            this.updateControlStates();
            if (window.updateChartWithSimulationData) {
                try {
                    window.updateChartWithSimulationData(this.data);
                } catch (error) {
                    console.error('Error updating chart with simulation data:', error);
                }
            }
        } else {
            console.warn('Invalid data provided to simulator');
        }
    }

    // Check if simulation is ready
    isReady() {
        return this.data && this.data.length > 0;
    }
}

// Initialize simulator
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing PredictionSimulator...');
    window.simulator = new PredictionSimulator();
    
    // Try to load data after a delay
    setTimeout(() => {
        if (window.simulator && window.simulator.isInitialized) {
            console.log('Attempting to load simulation data...');
            window.simulator.loadData().then(success => {
                if (!success) {
                    console.log('No simulation data available yet. This is normal on first load.');
                }
            });
        }
    }, 2000);
});

// Export for global access
window.PredictionSimulator = PredictionSimulator;