// charts.js - Enhanced Chart Visualization with Live Data Integration
let priceChartInstance, technicalChartInstance;
let currentTimeframe = '1D';

// ================================
// 2D Price Chart with Chart.js
// ================================
function updateChart(predictions) {
    if (!predictions || predictions.length === 0) {
        console.warn('No prediction data available for chart');
        showEmptyChart();
        return;
    }

    const filteredData = filterDataByTimeframe(predictions, currentTimeframe);
    renderPriceChart(filteredData);
}

function showEmptyChart() {
    const ctx = document.getElementById("priceChart");
    if (!ctx) return;
    
    if (priceChartInstance) priceChartInstance.destroy();
    
    priceChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ['No Data'],
            datasets: [{
                label: "No Prediction Data",
                data: [0],
                borderColor: "gray",
                backgroundColor: "rgba(128, 128, 128, 0.1)",
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Run AI Analysis to See Predictions'
                }
            }
        }
    });
}

function filterDataByTimeframe(predictions, timeframe) {
    if (!predictions || predictions.length === 0) return predictions;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeframe) {
        case '1D':
            cutoffDate.setDate(now.getDate() - 1);
            break;
        case '1W':
            cutoffDate.setDate(now.getDate() - 7);
            break;
        case '1M':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        default:
            return predictions;
    }
    
    return predictions.filter(pred => {
        try {
            const predDate = new Date(pred.date);
            return predDate >= cutoffDate;
        } catch (e) {
            return true; // Keep data if date parsing fails
        }
    });
}

function renderPriceChart(data) {
    const { labels, actual, predicted, trends } = data;
    const ctx = document.getElementById("priceChart");
    if (!ctx) return;
    
    if (priceChartInstance) priceChartInstance.destroy();

    // Safe trend-based color styling for points
    const pointBackgroundColors = actual.map((_, i) => {
        if (i === 0) return 'rgba(0,0,0,0)';
        if (trends && trends[i]) {
            return trends[i].actual === trends[i].predicted ? 
                'rgba(0, 200, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        }
        return 'rgba(128, 128, 128, 0.8)'; // Default color
    });

    priceChartInstance = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Actual Price",
                    data: actual,
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: pointBackgroundColors,
                    pointBorderColor: pointBackgroundColors,
                    borderWidth: 3
                },
                {
                    label: "Predicted Price",
                    data: predicted,
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ],
            trends: trends // Store trends for highlight updates
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { 
                mode: 'index', 
                intersect: false 
            },
            plugins: {
                legend: { 
                    position: 'top', 
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    } 
                },
                tooltip: {
                    backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                    titleColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000',
                    bodyColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000',
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD' 
                                }).format(context.parsed.y);
                            }
                            return label;
                        },
                        afterBody: function(context) {
                            const i = context[0].dataIndex;
                            const trends = priceChartInstance.data.trends;
                            if (trends && trends[i]) {
                                const trend = trends[i];
                                const isCorrect = trend.actual === trend.predicted;
                                return [
                                    `Actual Trend: ${getTrendText(trend.actual)}`,
                                    `Predicted Trend: ${getTrendText(trend.predicted)}`,
                                    `Match: ${isCorrect ? '✅ Yes' : '❌ No'}`
                                ];
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { 
                        display: true, 
                        text: 'Date',
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    },
                    grid: { 
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    },
                    ticks: {
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    }
                },
                y: {
                    title: { 
                        display: true, 
                        text: 'Gold Price (USD)',
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    },
                    grid: { 
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    },
                    ticks: {
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000',
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function getTrendText(trend) {
    switch(trend) {
        case 1: return '📈 Up';
        case -1: return '📉 Down';
        case 0: return '➡️ Same';
        default: return '❓ Unknown';
    }
}

// ================================
// Timeframe Filter Functionality
// ================================
window.filterChartByTimeframe = function(timeframe) {
    currentTimeframe = timeframe;
    
    // Update UI
    document.querySelectorAll('.time-filter').forEach(btn => {
        btn.classList.remove('bg-primary-500', 'text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    });
    
    const activeBtn = document.querySelector(`.time-filter[data-timeframe="${timeframe}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        activeBtn.classList.add('bg-primary-500', 'text-white');
    }
    
    // Reload and filter data
    if (window.simulator && window.simulator.data) {
        const filteredData = filterDataByTimeframe(window.simulator.data, timeframe);
        updateChart(filteredData);
    }
};

// ================================
// Update Chart with Simulation Data - FIXED VERSION
// ================================
window.updateChartWithSimulationData = function(predictions) {
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
        console.warn('No valid prediction data available for chart');
        showEmptyChart();
        return;
    }

    try {
        // Transform prediction data for chart with validation
        const chartData = {
            labels: predictions.map(d => {
                try {
                    const date = new Date(d.date);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } catch (e) {
                    console.warn('Invalid date format:', d.date);
                    return d.date || 'Unknown Date';
                }
            }),
            actual: predictions.map(d => {
                const price = parseFloat(d.actual_price);
                return isNaN(price) ? 0 : price;
            }),
            predicted: predictions.map(d => {
                const price = parseFloat(d.predicted_price);
                return isNaN(price) ? 0 : price;
            }),
            trends: predictions.map(d => ({
                actual: parseInt(d.actual_trend) || 0,
                predicted: parseInt(d.predicted_trend) || 0
            }))
        };

        // Validate data before rendering
        if (chartData.actual.length === 0 || chartData.predicted.length === 0) {
            console.error('Invalid chart data after processing:', chartData);
            showEmptyChart();
            return;
        }

        const filteredData = filterDataByTimeframe(chartData, currentTimeframe);
        renderPriceChart(filteredData);
        
    } catch (error) {
        console.error('Error updating chart with simulation data:', error);
        showEmptyChart();
    }
};

// ================================
// Chart Highlight for Simulation - FIXED VERSION
// ================================
window.updateChartHighlight = function(index) {
    if (!priceChartInstance || !priceChartInstance.data || !priceChartInstance.data.datasets) {
        console.warn('Chart instance not ready for highlight');
        return;
    }
    
    try {
        // Reset all points to default colors first
        priceChartInstance.data.datasets.forEach(dataset => {
            if (dataset.pointBackgroundColor && Array.isArray(dataset.pointBackgroundColor)) {
                // Recreate the original color array based on trends
                dataset.pointBackgroundColor = dataset.pointBackgroundColor.map((color, i) => {
                    if (i === 0) return 'rgba(0,0,0,0)';
                    
                    // Get trend data safely
                    const trends = priceChartInstance.data.trends;
                    if (trends && trends[i] && trends[i].actual !== undefined && trends[i].predicted !== undefined) {
                        return trends[i].actual === trends[i].predicted ? 
                            'rgba(0, 200, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
                    }
                    return 'rgba(128, 128, 128, 0.8)'; // Default color
                });
                
                // Highlight current index if valid
                if (index >= 0 && index < dataset.pointBackgroundColor.length) {
                    dataset.pointBackgroundColor[index] = 'rgba(255, 215, 0, 1)'; // Gold color
                }
                
                dataset.pointBorderColor = dataset.pointBackgroundColor;
            }
        });
        
        priceChartInstance.update('none');
    } catch (error) {
        console.error('Error updating chart highlight:', error);
    }
};

// ================================
// Technical Analysis Chart
// ================================
function updateTechnicalChart(analysisData) {
    const ctx = document.getElementById("technicalChart");
    if (!ctx) return;
    
    if (technicalChartInstance) technicalChartInstance.destroy();

    const labels = Array.from({length: 50}, (_, i) => `Point ${i + 1}`);
    
    technicalChartInstance = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "RSI",
                    data: generateRSIData(),
                    borderColor: "rgb(147, 51, 234)",
                    backgroundColor: "rgba(147, 51, 234, 0.1)",
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: "MACD",
                    data: generateMACDData(),
                    borderColor: "rgb(234, 88, 12)",
                    backgroundColor: "rgba(234, 88, 12, 0.1)",
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    },
                    ticks: {
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    }
                },
                y: {
                    grid: { 
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    },
                    ticks: {
                        color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#fff' : '#000'
                    }
                }
            }
        }
    });
}

function generateRSIData() {
    // Generate realistic RSI data (30-70 range)
    return Array.from({length: 50}, () => 30 + Math.random() * 40);
}

function generateMACDData() {
    // Generate realistic MACD data
    return Array.from({length: 50}, () => (Math.random() - 0.5) * 2);
}

// ================================
// Initialize Charts
// ================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize empty charts
    showEmptyChart();
    updateTechnicalChart();
    
    // Update charts when theme changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                // Re-render charts with updated theme colors
                if (priceChartInstance) {
                    priceChartInstance.destroy();
                    if (window.simulator && window.simulator.data) {
                        window.updateChartWithSimulationData(window.simulator.data);
                    } else {
                        showEmptyChart();
                    }
                }
                if (technicalChartInstance) {
                    technicalChartInstance.destroy();
                    updateTechnicalChart();
                }
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
});

// ================================
// Export for global access
// ================================
window.updateChart = updateChart;
window.updateTechnicalChart = updateTechnicalChart;