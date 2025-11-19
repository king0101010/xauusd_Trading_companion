// app.js - Enhanced Trading Companion Version with Live Data

// ---------------- DOM Elements ----------------
let runBtn, useSampleBtn, progressContainer, progressBar, metricsDiv, uploadForm, uploadStatus;

// ---------------- Initialization ----------------
document.addEventListener("DOMContentLoaded", function () {
  initializeDOMElements();
  initializeEventListeners();
  initializeLiveUpdates();
});

// ---------------- Initialize DOM Elements ----------------
function initializeDOMElements() {
  // Main buttons and containers
  runBtn = document.getElementById("quickPredict") || document.getElementById("runModelBtn");
  useSampleBtn = document.getElementById("useSampleData");

  // Progress elements
  progressContainer = document.getElementById("progressContainer");
  progressBar = document.getElementById("progressBar");

  // Display containers
  metricsDiv = document.getElementById("performanceMetrics") || document.getElementById("metricsCards");

  // Upload elements
  uploadForm = document.getElementById("uploadForm");
  uploadStatus = document.getElementById("uploadStatus");

  // Create missing elements if needed
  createMissingElements();
}

// ---------------- Create Missing Elements ----------------
function createMissingElements() {
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.id = "progressContainer";
    progressContainer.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden";
    progressContainer.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Processing</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">AI model is analyzing data...</p>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div id="progressBar" class="bg-primary-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(progressContainer);
    progressBar = document.getElementById("progressBar");
  }

  if (!uploadStatus) {
    uploadStatus = document.createElement("div");
    uploadStatus.id = "uploadStatus";
    uploadStatus.className = "hidden p-4 rounded-lg mb-4";
    const main = document.querySelector("main");
    if (main) {
      main.insertBefore(uploadStatus, main.firstChild);
    }
  }
}

// ---------------- Event Listeners ----------------
function initializeEventListeners() {
  // Quick Predict / Run Model button
  if (runBtn) {
    runBtn.addEventListener("click", runQuickPredict);
  }

  // Sample Data button
  if (useSampleBtn) {
    useSampleBtn.addEventListener("click", useSampleData);
  }

  // File input
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileInput);
  }

  // Upload form (if exists in new UI)
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleFileUpload);
  }

  // Download buttons
  const downloadCSV = document.getElementById("downloadCSV");
  const downloadTxt = document.getElementById("downloadTxt");
  const downloadJson = document.getElementById("downloadJson");

  if (downloadCSV) downloadCSV.addEventListener("click", () => downloadPredictionsCSV());
  if (downloadTxt) downloadTxt.addEventListener("click", () => downloadResultsTXT());
  if (downloadJson) downloadJson.addEventListener("click", () => downloadResultsJSON());
}

// ---------------- Live Updates ----------------
function initializeLiveUpdates() {
  // Update live prices every 3 seconds
  setInterval(updateLiveData, 3000);
  updateLiveData(); // Initial call
}

// ---------------- Update Live Data ----------------
async function updateLiveData() {
  try {
    const response = await fetch("/live-price");
    if (!response.ok) throw new Error("Failed to fetch live data");
    
    const liveData = await response.json();
    updateLivePriceDisplay(liveData);
    
    // Update technical analysis every 10 seconds
    if (Date.now() % 10000 < 3000) {
      updateTechnicalAnalysis();
      updateTradingSignals();
    }
  } catch (error) {
    console.error("Error updating live data:", error);
    // Fallback to simulated data
    updateLivePriceDisplay({
      price: (1820 + Math.random() * 40 - 20).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      change_percent: (Math.random() * 2 - 1).toFixed(2)
    });
  }
}

// ---------------- Update Live Price Display ----------------
function updateLivePriceDisplay(liveData) {
  const livePrice = document.getElementById("livePrice");
  const currentPrice = document.getElementById("currentPrice");
  const currentLevel = document.getElementById("currentLevel");

  if (livePrice) {
    livePrice.textContent = `$${liveData.price}`;
    livePrice.classList.add("animate-pulse");
    setTimeout(() => livePrice.classList.remove("animate-pulse"), 1000);
  }
  
  if (currentPrice) {
    currentPrice.textContent = `$${liveData.price}`;
  }
  
  if (currentLevel) {
    currentLevel.textContent = `$${liveData.price}`;
  }

  // Update price change indicator
  if (liveData.change) {
    const changeElement = document.getElementById("priceChange");
    if (!changeElement) {
      // Create change indicator if it doesn't exist
      const priceContainer = document.getElementById("livePrice").parentElement;
      const changeHtml = `<div id="priceChange" class="text-xs ${liveData.change >= 0 ? 'text-green-500' : 'text-red-500'}">${liveData.change >= 0 ? '+' : ''}${liveData.change} (${liveData.change_percent}%)</div>`;
      priceContainer.insertAdjacentHTML('beforeend', changeHtml);
    } else {
      changeElement.textContent = `${liveData.change >= 0 ? '+' : ''}${liveData.change} (${liveData.change_percent}%)`;
      changeElement.className = `text-xs ${liveData.change >= 0 ? 'text-green-500' : 'text-red-500'}`;
    }
  }
}

// ---------------- Update Technical Analysis ----------------
async function updateTechnicalAnalysis() {
  try {
    const response = await fetch("/technical-analysis");
    if (!response.ok) throw new Error("Failed to fetch technical analysis");
    
    const analysis = await response.json();
    updateTechnicalIndicators(analysis);
  } catch (error) {
    console.error("Error updating technical analysis:", error);
  }
}

// ---------------- Update Technical Indicators ----------------
function updateTechnicalIndicators(analysis) {
  const indicators = {
    'rsiValue': analysis.rsi,
    'macdValue': analysis.macd,
    'momentumValue': analysis.momentum,
    'volatilityValue': analysis.volatility
  };

  for (const [id, value] of Object.entries(indicators)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = typeof value === 'number' ? value.toFixed(2) : value;
      
      // Add color coding for RSI
      if (id === 'rsiValue' && value !== '--') {
        const rsiValue = parseFloat(value);
        if (rsiValue > 70) element.className = "text-xl font-bold text-red-500";
        else if (rsiValue < 30) element.className = "text-xl font-bold text-green-500";
        else element.className = "text-xl font-bold text-yellow-500";
      }
    }
  }

  // Update risk assessment
  updateRiskAssessment(analysis);
}

// ---------------- Update Trading Signals ----------------
async function updateTradingSignals() {
  try {
    const response = await fetch("/trading-signals");
    if (!response.ok) throw new Error("Failed to fetch trading signals");
    
    const signals = await response.json();
    displayTradingSignals(signals);
  } catch (error) {
    console.error("Error updating trading signals:", error);
  }
}

// ---------------- Display Trading Signals ----------------
function displayTradingSignals(signals) {
  const signalsContainer = document.getElementById("tradingSignals");
  if (!signalsContainer) return;

  const signalClass = 
    signals.signal === "BUY" ? "signal-buy" :
    signals.signal === "SELL" ? "signal-sell" : "signal-hold";

  const signalIcon = 
    signals.signal === "BUY" ? "🟢" :
    signals.signal === "SELL" ? "🔴" : "🟡";

  signalsContainer.innerHTML = `
    <div class="${signalClass} p-4 rounded-lg animate-pulse">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="font-semibold text-lg">${signals.signal} Signal</div>
          <div class="text-sm opacity-75">${signals.recommendation}</div>
        </div>
        <div class="text-2xl">${signalIcon}</div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="opacity-75">Confidence:</span>
          <span class="font-semibold">${(signals.confidence * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span class="opacity-75">Trend:</span>
          <span class="font-semibold">${signals.trend}</span>
        </div>
        <div>
          <span class="opacity-75">Strength:</span>
          <span class="font-semibold">${(signals.strength * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span class="opacity-75">Risk:</span>
          <span class="font-semibold ${signals.risk_level === 'HIGH' ? 'text-red-500' : signals.risk_level === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'}">${signals.risk_level}</span>
        </div>
      </div>
    </div>
  `;
}

// ---------------- Update Risk Assessment ----------------
function updateRiskAssessment(analysis) {
  const volatilityLevel = document.getElementById("volatilityLevel");
  const aiConfidence = document.getElementById("aiConfidence");
  const recommendedPosition = document.getElementById("recommendedPosition");

  if (volatilityLevel) {
    const volatility = parseFloat(analysis.volatility) || 0;
    if (volatility > 0.02) {
      volatilityLevel.textContent = "HIGH";
      volatilityLevel.className = "px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm";
    } else if (volatility > 0.01) {
      volatilityLevel.textContent = "MEDIUM";
      volatilityLevel.className = "px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm";
    } else {
      volatilityLevel.textContent = "LOW";
      volatilityLevel.className = "px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm";
    }
  }

  if (aiConfidence) {
    const confidence = analysis.strength || 0.5;
    aiConfidence.textContent = `${(confidence * 100).toFixed(1)}%`;
  }

  if (recommendedPosition) {
    const sentiment = analysis.sentiment;
    if (sentiment === "BULLISH") {
      recommendedPosition.textContent = "LONG";
      recommendedPosition.className = "px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm";
    } else if (sentiment === "BEARISH") {
      recommendedPosition.textContent = "SHORT";
      recommendedPosition.className = "px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm";
    } else {
      recommendedPosition.textContent = "NEUTRAL";
      recommendedPosition.className = "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm";
    }
  }
}

// ---------------- Quick Predict ----------------
async function runQuickPredict() {
  showProgressBar();

  try {
    const response = await fetch("/predict");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    completeProgress();
    displayResults(data);

    // Load all data components
    await loadPredictionData();
    await loadTradingInsights();
    await loadSupportResistance();
    await loadLatestPrediction();

    showNotification("✅ AI analysis completed successfully!", "success");
    updateUploadStatus("✅ AI analysis completed successfully!", "success");
  } catch (error) {
    handleError(error);
    showNotification(`❌ Error: ${error.message}`, "error");
    updateUploadStatus(`❌ Error: ${error.message}`, "error");
  }
}

// ---------------- Handle File Upload ----------------
async function handleFileUpload(e) {
  e.preventDefault();

  const formData = new FormData();
  const dailyFile = document.getElementById("daily-csv")?.files[0];
  const hourlyFile = document.getElementById("hourly-csv")?.files[0];

  if (!dailyFile) {
    showNotification("Please upload a Daily CSV file first!", "error");
    return;
  }

  formData.append("daily_csv", dailyFile);
  if (hourlyFile) formData.append("hourly_csv", hourlyFile);

  await processFileUpload(formData);
}

// ---------------- Handle File Input ----------------
async function handleFileInput(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("daily_csv", file);

  await processFileUpload(formData);
}

// ---------------- Process File Upload ----------------
async function processFileUpload(formData) {
  showProgressBar();

  try {
    const response = await fetch("/upload-predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.results) {
      completeProgress();
      displayResults(data);

      // Load all data components
      await loadPredictionData();
      await loadTradingInsights();
      await loadSupportResistance();
      await loadLatestPrediction();

      showNotification("✅ CSV processed and AI predictions generated!", "success");
      updateUploadStatus("✅ CSV processed and AI predictions generated!", "success");
    } else {
      throw new Error("No results received from server");
    }
  } catch (error) {
    handleError(error);
    showNotification(`❌ Error: ${error.message}`, "error");
    updateUploadStatus(`❌ Error: ${error.message}`, "error");
  }
}

// ---------------- Sample Data ----------------
async function useSampleData() {
  showProgressBar();

  try {
    const response = await fetch("/predict");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    completeProgress();
    displayResults(data);

    // Load all data components
    await loadPredictionData();
    await loadTradingInsights();
    await loadSupportResistance();
    await loadLatestPrediction();

    showNotification("✅ Using AI model with sample dataset!", "success");
    updateUploadStatus("✅ Using AI model with sample dataset!", "success");
  } catch (error) {
    handleError(error);
    showNotification(`❌ Error: ${error.message}`, "error");
    updateUploadStatus(`❌ Error: ${error.message}`, "error");
  }
}

// ---------------- Load Prediction Data ----------------
async function loadPredictionData() {
    try {
        const response = await fetch('/prediction-data');
        if (!response.ok) throw new Error("Failed to load prediction data");

        const realData = await response.json();
        
        // Validate data structure
        if (!realData || !Array.isArray(realData)) {
            throw new Error("Invalid prediction data format");
        }

        if (realData.length === 0) {
            console.warn("No prediction data available");
            showNotification("⚠️ No prediction data available. Run AI analysis first.", "warning");
            return;
        }

        // Validate each data point has required fields
        const validatedData = realData.map(item => ({
            date: item.date || 'Unknown Date',
            actual_price: typeof item.actual_price === 'number' ? item.actual_price : 0,
            predicted_price: typeof item.predicted_price === 'number' ? item.predicted_price : 0,
            confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : 0.5,
            trade_suggestion: item.trade_suggestion || 'HOLD',
            actual_trend: typeof item.actual_trend === 'number' ? item.actual_trend : 0,
            predicted_trend: typeof item.predicted_trend === 'number' ? item.predicted_trend : 0
        }));

        if (window.simulator && validatedData.length > 0) {
            window.simulator.setData(validatedData);
            updateChartWithSimulationData(validatedData);
            console.log(`Prediction data loaded: ${validatedData.length} records`);
        } else {
            console.warn("Simulator not available or no valid data");
        }
    } catch (error) {
        console.error("Error loading prediction data:", error);
        showNotification("⚠️ Failed to load prediction data: " + error.message, "error");
    }
}

// ---------------- Load Trading Insights ----------------
async function loadTradingInsights() {
  try {
    const response = await fetch("/trading-insights");
    if (!response.ok) throw new Error("Failed to load trading insights");

    const insights = await response.json();
    displayTradingInsights(insights);
  } catch (error) {
    console.error("Error loading trading insights:", error);
  }
}

// ---------------- Load Support/Resistance ----------------
async function loadSupportResistance() {
  try {
    const response = await fetch("/support-resistance");
    if (!response.ok) throw new Error("Failed to load support/resistance");

    const levels = await response.json();
    displaySupportResistance(levels);
  } catch (error) {
    console.error("Error loading support/resistance:", error);
  }
}

// ---------------- Load Latest Prediction ----------------
async function loadLatestPrediction() {
  try {
    const response = await fetch("/latest-prediction");
    if (!response.ok) throw new Error("Failed to load latest prediction");

    const prediction = await response.json();
    updateDashboard(prediction);
  } catch (error) {
    console.error("Error loading latest prediction:", error);
  }
}

// ---------------- Display Trading Insights ----------------
function displayTradingInsights(insights) {
  const insight = insights.insight;

  let insightsContainer = document.getElementById("tradingInsights");
  const existingInsights = document.querySelector(".trading-insights");

  if (existingInsights) {
    existingInsights.remove();
  }

  const container = document.createElement("div");
  container.className = "trading-insights trader-card mt-6";

  const trendIcon = insight.trend === "BULLISH" ? "📈" : insight.trend === "BEARISH" ? "📉" : "➡️";
  const suggestionIcon = insight.suggestion === "BUY" ? "🟢" : insight.suggestion === "SELL" ? "🔴" : "🟡";

  container.innerHTML = `
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🎯 Trading Insights</h3>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div class="insight-card ${insight.trend.toLowerCase()} text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div class="label text-sm opacity-75 mb-1">Market Trend</div>
        <div class="value font-semibold">${trendIcon} ${insight.trend}</div>
      </div>
      <div class="insight-card ${insight.suggestion.toLowerCase()} text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div class="label text-sm opacity-75 mb-1">Trade Suggestion</div>
        <div class="value font-semibold">${suggestionIcon} ${insight.suggestion}</div>
      </div>
      <div class="insight-card text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div class="label text-sm opacity-75 mb-1">Model Confidence</div>
        <div class="value font-semibold">${(insight.confidence * 100).toFixed(1)}%</div>
      </div>
      <div class="insight-card text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div class="label text-sm opacity-75 mb-1">Risk Level</div>
        <div class="value font-semibold">${insight.risk_level}</div>
      </div>
    </div>
  `;

  const metricsSection = document.querySelector(".trader-card");
  if (metricsSection && metricsSection.parentNode) {
    metricsSection.parentNode.insertBefore(container, metricsSection.nextSibling);
  }
}

// ---------------- Display Support/Resistance ----------------
function displaySupportResistance(levels) {
  const existingLevels = document.querySelector(".support-resistance");

  if (existingLevels) {
    existingLevels.remove();
  }

  const supportLevel = document.getElementById("supportLevel");
  const resistanceLevel = document.getElementById("resistanceLevel");
  const supportDistance = document.getElementById("supportDistance");
  const resistanceDistance = document.getElementById("resistanceDistance");

  if (supportLevel) supportLevel.textContent = `$${levels.support?.toFixed(2) || "---.--"}`;
  if (resistanceLevel) resistanceLevel.textContent = `$${levels.resistance?.toFixed(2) || "---.--"}`;
  if (supportDistance) supportDistance.textContent = `${levels.distance_to_support?.toFixed(2) || "--"} points below`;
  if (resistanceDistance) resistanceDistance.textContent = `${levels.distance_to_resistance?.toFixed(2) || "--"} points above`;
}

// ---------------- Update Dashboard ----------------
function updateDashboard(prediction) {
  const predictedPrice = document.getElementById("predictedPrice");
  const confidenceScore = document.getElementById("confidenceScore");
  const trendIndicator = document.getElementById("trendIndicator");

  if (predictedPrice) predictedPrice.textContent = `$${prediction.predicted_price?.toFixed(2) || "---.--"}`;
  if (confidenceScore) confidenceScore.textContent = `${prediction.confidence_percentage || "--"}%`;
  if (trendIndicator) {
    trendIndicator.textContent = prediction.trend || "---";
    trendIndicator.className = `text-xl font-bold ${
      prediction.trend === "UP" ? "profit-text" :
      prediction.trend === "DOWN" ? "loss-text" : "text-gray-500"
    }`;
  }
}

// ---------------- Display Results ----------------
function displayResults(data) {
  if (data.results && metricsDiv) {
    const metrics = data.results;
    metricsDiv.innerHTML = `
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.MAE || "--"}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">MAE</div>
      </div>
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.RMSE || "--"}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">RMSE</div>
      </div>
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.R2 || "--"}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">R² Score</div>
      </div>
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.Trend_Accuracy || "--"}%</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Trend Accuracy</div>
      </div>
      ${metrics.Cumulative_Return ? `
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.Cumulative_Return}%</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Cumulative Return</div>
      </div>` : ""}
      ${metrics.Sharpe_Ratio ? `
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">${metrics.Sharpe_Ratio}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</div>
      </div>` : ""}
    `;
  }
}

// ---------------- Progress Bar Functions ----------------
function showProgressBar() {
  if (progressContainer) {
    progressContainer.classList.remove("hidden");
    if (progressBar) {
      progressBar.style.width = "0%";
    }
  }

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 85) progress = 85;
    if (progressBar) {
      progressBar.style.width = progress + "%";
    }
    window.progressInterval = interval;
  }, 300);
}

function completeProgress() {
  if (window.progressInterval) clearInterval(window.progressInterval);
  if (progressBar) {
    progressBar.style.width = "100%";
  }

  setTimeout(() => {
    if (progressContainer) {
      progressContainer.classList.add("hidden");
    }
  }, 1000);
}

function handleError(err) {
  if (window.progressInterval) clearInterval(window.progressInterval);
  if (progressBar) {
    progressBar.style.backgroundColor = "red";
  }
  console.error("Application error:", err);
}

// ---------------- Upload Status ----------------
function updateUploadStatus(message, type = "info") {
  if (uploadStatus) {
    uploadStatus.textContent = message;
    uploadStatus.className = `p-4 rounded-lg mb-4 ${
      type === "success" ? "bg-green-100 text-green-800 border border-green-300" :
      type === "error" ? "bg-red-100 text-red-800 border border-red-300" :
      type === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
      "bg-blue-100 text-blue-800 border border-blue-300"
    }`;
    uploadStatus.classList.remove("hidden");
  }
}

// ---------------- Notification System ----------------
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
    type === "success" ? "bg-green-500 text-white" :
    type === "error" ? "bg-red-500 text-white" :
    type === "warning" ? "bg-yellow-500 text-white" :
    "bg-blue-500 text-white"
  }`;
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-lg">${
        type === "success" ? "✅" :
        type === "error" ? "❌" :
        type === "warning" ? "⚠️" : "ℹ️"
      }</span>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 10);

  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// ---------------- Chart Update ----------------
function updateChartWithSimulationData(predictions) {
  if (typeof updateChart === "function") {
    updateChart(predictions);
  }
}

// ---------------- Export functions for other modules ----------------
window.updateChartWithSimulationData = updateChartWithSimulationData;
window.showNotification = showNotification;
window.reRunSimulation = reRunSimulation;

// ---------------- Simulation Rerun ----------------
function reRunSimulation() {
  if (window.simulator && window.simulator.data) {
    window.simulator.setupSimulation();
    showNotification("🔁 Simulation reset and ready!", "success");
  } else {
    showNotification("Please upload data or use sample data first to generate predictions!", "warning");
  }
}

// ---------------- Download Functions (existing implementations remain) ----------------
async function downloadPredictionsCSV() {
  try {
    const response = await fetch("/prediction-data");
    if (!response.ok) throw new Error("Failed to load prediction data");

    const data = await response.json();

    if (!data || data.length === 0) {
      showNotification("No prediction data available to download!", "warning");
      return;
    }

    const rows = [
      ["Date", "Actual_Price", "Predicted_Price", "Confidence_Score", "Trade_Suggestion", "Actual_Trend", "Predicted_Trend"],
      ...data.map((d) => [
        d.date, d.actual_price, d.predicted_price, d.confidence_score || 0.5, d.trade_suggestion || "HOLD", d.actual_trend, d.predicted_trend
      ]),
    ];

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xau_usd_trading_predictions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("📊 Predictions downloaded as CSV!", "success");
  } catch (error) {
    console.error("Download error:", error);
    showNotification("Error downloading predictions: " + error.message, "error");
  }
}

async function downloadResultsJSON() {
  try {
    const response = await fetch("/prediction-data");
    if (!response.ok) throw new Error("Failed to load prediction data");

    const data = await response.json();

    if (!data || data.length === 0) {
      showNotification("No results available to download!", "warning");
      return;
    }

    const resultsData = {
      timestamp: new Date().toISOString(),
      predictions: data,
      metrics: await getMetricsData(),
    };

    const blob = new Blob([JSON.stringify(resultsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xau_usd_trading_companion_results.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("📁 Results downloaded as JSON!", "success");
  } catch (error) {
    console.error("Download error:", error);
    showNotification("Error downloading results: " + error.message, "error");
  }
}

async function downloadResultsTXT() {
  try {
    const response = await fetch("/prediction-data");
    if (!response.ok) throw new Error("Failed to load prediction data");

    const data = await response.json();

    if (!data || data.length === 0) {
      showNotification("No results available to download!", "warning");
      return;
    }

    const metrics = await getMetricsData();

    let textContent = `XAU/USD TRADING COMPANION RESULTS\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    textContent += `PERFORMANCE METRICS:\n`;
    textContent += `MAE: ${metrics.MAE || "N/A"}\n`;
    textContent += `RMSE: ${metrics.RMSE || "N/A"}\n`;
    textContent += `R² Score: ${metrics.R2 || "N/A"}\n`;
    textContent += `Trend Accuracy: ${metrics.Trend_Accuracy || "N/A"}%\n\n`;

    textContent += `RECENT PREDICTIONS:\n`;
    data.slice(-10).forEach((pred) => {
      textContent += `${pred.date}: Actual=$${pred.actual_price}, Predicted=$${pred.predicted_price}, Suggestion=${pred.trade_suggestion}, Confidence=${((pred.confidence_score || 0.5) * 100).toFixed(1)}%\n`;
    });

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xau_usd_trading_insights.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("📄 Insights downloaded as TXT!", "success");
  } catch (error) {
    console.error("Download error:", error);
    showNotification("Error downloading results: " + error.message, "error");
  }
}

async function getMetricsData() {
  try {
    const response = await fetch("/predict");
    const data = await response.json();
    return data.results || {};
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return {};
  }
}