// app.js - Fixed for your existing HTML structure
const API_URL = "http://127.0.0.1:8000";

// Application state
const AppState = {
    currentUser: null,
    currentChart: null,
    isLoading: false,
    lastAnalysis: null
};

// Utility Functions
const Utils = {
    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = message;
        element.className = type === 'error' ? 'error-message' : 'success-message';
        element.style.display = 'block';
        
        // Auto-hide success messages
        if (type !== 'error') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    },

    hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },

    setLoading(isLoading) {
        AppState.isLoading = isLoading;
        const loadingElement = document.getElementById("loading");
        const analyzeBtn = document.querySelector('.analyze-btn');
        
        if (loadingElement) {
            loadingElement.style.display = isLoading ? "block" : "none";
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = isLoading;
            analyzeBtn.innerHTML = isLoading ? 
                '🔄 Analyzing...' : 
                '🔮 Analyze & Predict';
        }
    },

    validateInput(ticker, days) {
        if (!ticker) {
            throw new Error("Please enter a stock ticker symbol!");
        }
        
        if (days < 1 || days > 365) {
            throw new Error("Please enter a valid number of days (1-365)!");
        }
        
        return true;
    },

    formatPercentage(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }
};

// Authentication Functions - Fixed for your HTML structure
async function signup() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        window.FirebaseAuth.showAuthMessage("Please fill in all fields.", true);
        return;
    }
    
    if (password.length < 6) {
        window.FirebaseAuth.showAuthMessage("Password must be at least 6 characters long.", true);
        return;
    }
    
    const signupBtn = document.getElementById("signup-btn");
    const originalText = signupBtn.innerHTML;
    signupBtn.disabled = true;
    signupBtn.innerHTML = "Creating Account...";
    
    try {
        // Check if FirebaseAuth is available
        if (!window.FirebaseAuth) {
            throw new Error('Firebase authentication not loaded');
        }
        
        const result = await window.FirebaseAuth.signUp(email, password);
        
        if (result.success) {
            window.FirebaseAuth.showAuthMessage(result.message || "Account created successfully!");
            AppState.currentUser = result.user;
            
            // Clear form
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
        } else {
            window.FirebaseAuth.showAuthMessage(result.error, true);
        }
    } catch (error) {
        console.error('Signup error:', error);
        window.FirebaseAuth.showAuthMessage(`Signup failed: ${error.message}`, true);
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = originalText;
    }
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        window.FirebaseAuth.showAuthMessage("Please fill in all fields.", true);
        return;
    }
    
    const loginBtn = document.getElementById("login-btn");
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = "Logging in...";
    
    try {
        // Check if FirebaseAuth is available
        if (!window.FirebaseAuth) {
            throw new Error('Firebase authentication not loaded');
        }
        
        const result = await window.FirebaseAuth.signIn(email, password);
        
        if (result.success) {
            window.FirebaseAuth.showAuthMessage(result.message || "Login successful!");
            AppState.currentUser = result.user;
            
            // Clear form
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
        } else {
            window.FirebaseAuth.showAuthMessage(result.error, true);
        }
    } catch (error) {
        console.error('Login error:', error);
        window.FirebaseAuth.showAuthMessage(`Login failed: ${error.message}`, true);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
}

async function loginAsDemo() {
    const demoEmail = "demo@stockpredictor.com";
    const demoPassword = "demo123456";
    
    const demoBtn = document.querySelector(".demo-btn");
    const originalText = demoBtn.innerHTML;
    demoBtn.disabled = true;
    demoBtn.innerHTML = "Signing in...";
    
    try {
        if (!window.FirebaseAuth) {
            throw new Error('Firebase authentication not loaded');
        }
        
        // Try to sign in first
        let result = await window.FirebaseAuth.signIn(demoEmail, demoPassword);
        
        // If demo account doesn't exist, create it
        if (!result.success && (result.code === 'auth/user-not-found' || result.code === 'auth/invalid-credential')) {
            console.log('Demo account not found, creating...');
            result = await window.FirebaseAuth.signUp(demoEmail, demoPassword);
        }
        
        if (result.success) {
            window.FirebaseAuth.showAuthMessage("Demo login successful!");
            AppState.currentUser = result.user;
        } else {
            window.FirebaseAuth.showAuthMessage(`Demo login failed: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Demo login error:', error);
        window.FirebaseAuth.showAuthMessage("Demo login failed. Please try manual login.", true);
    } finally {
        demoBtn.disabled = false;
        demoBtn.innerHTML = originalText;
    }
}

async function logout() {
    try {
        if (!window.FirebaseAuth) {
            throw new Error('Firebase authentication not loaded');
        }
        
        const result = await window.FirebaseAuth.signOut();
        
        if (result.success) {
            AppState.currentUser = null;
            AppState.currentChart = null;
            AppState.lastAnalysis = null;
            
            // Clear form data
            const tickerInput = document.getElementById("ticker");
            const daysInput = document.getElementById("days");
            const chartDiv = document.getElementById("chart");
            
            if (tickerInput) tickerInput.value = "";
            if (daysInput) daysInput.value = "30";
            if (chartDiv) chartDiv.innerHTML = "";
            
            // Clear messages
            Utils.hideMessage("error-message");
            Utils.hideMessage("performance-info");
            window.FirebaseAuth.clearAuthMessage();
        } else {
            window.FirebaseAuth.showAuthMessage(result.error, true);
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.FirebaseAuth.showAuthMessage("Logout failed. Please refresh the page.", true);
    }
}

// Stock Analysis Functions
async function loadCandlestick() {
    const ticker = document.getElementById("ticker").value.trim().toUpperCase();
    const model = document.getElementById("model").value;
    const days = parseInt(document.getElementById("days").value);

    try {
        // Validate inputs
        Utils.validateInput(ticker, days);
        
        // Clear previous messages and results
        Utils.hideMessage("error-message");
        Utils.hideMessage("performance-info");
        document.getElementById("chart").innerHTML = "";
        
        // Set loading state
        Utils.setLoading(true);

        // Fetch data in parallel for better performance
        const [stockResponse, predictionResponse] = await Promise.all([
            fetchWithTimeout(`${API_URL}/stock-data?ticker=${ticker}`, 30000),
            fetchWithTimeout(`${API_URL}/predict?ticker=${ticker}&days=${days}&model=${model}`, 30000)
        ]);

        // Handle stock data response
        if (!stockResponse.ok) {
            const errorData = await stockResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch stock data (${stockResponse.status})`);
        }

        // Handle prediction response
        if (!predictionResponse.ok) {
            const errorData = await predictionResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to generate predictions (${predictionResponse.status})`);
        }

        const stockData = await stockResponse.json();
        const predictionData = await predictionResponse.json();

        // Store analysis data
        AppState.lastAnalysis = {
            ticker,
            model,
            days,
            stockData,
            predictionData,
            timestamp: new Date()
        };

        // Display model performance
        displayModelPerformance(predictionData, ticker, model);

        // Create and display chart
        createStockChart(stockData, predictionData, ticker, model);

        console.log('Analysis completed:', AppState.lastAnalysis);

    } catch (error) {
        console.error('Analysis error:', error);
        Utils.showMessage("error-message", 
            `Analysis failed: ${error.message}. Please check the ticker symbol and try again.`, 
            "error");
    } finally {
        Utils.setLoading(false);
    }
}

function displayModelPerformance(predictionData, ticker, model) {
    const performanceElement = document.getElementById("performance-info");
    if (!performanceElement) return;

    const predictions = predictionData.predictions || predictionData;
    const performance = predictionData.model_performance;

    let content = `<h3>📊 Analysis Results for ${ticker}</h3>`;
    
    if (performance) {
        const r2Percentage = (performance.r2_score * 100).toFixed(1);
        const mseFormatted = performance.mse.toFixed(4);
        
        content += `
            <div class="metrics-grid">
                <span class="metric">Model: ${performance.model_used}</span>
                <span class="metric">Accuracy: ${r2Percentage}%</span>
                <span class="metric">Error (MSE): ${mseFormatted}</span>
                <span class="metric">Predictions: ${predictions.length} days</span>
            </div>
        `;
        
        // Add performance interpretation
        let interpretation = '';
        if (performance.r2_score >= 0.7) {
            interpretation = '🎯 High accuracy prediction model';
        } else if (performance.r2_score >= 0.5) {
            interpretation = '⚠️ Moderate accuracy - use with caution';
        } else {
            interpretation = '🚨 Low accuracy - high uncertainty';
        }
        
        content += `<p style="margin-top: 10px; font-weight: 600;">${interpretation}</p>`;
    }

    // Add prediction summary
    if (predictions && predictions.length > 0) {
        const firstPred = predictions[0];
        const lastPred = predictions[predictions.length - 1];
        const priceChange = lastPred.PredictedPrice - firstPred.PredictedPrice;
        const priceChangePercent = (priceChange / firstPred.PredictedPrice) * 100;
        
        content += `
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                <strong>Prediction Summary:</strong><br>
                Expected price change: ${Utils.formatCurrency(priceChange)} (${Utils.formatPercentage(priceChangePercent)})<br>
                Target price: ${Utils.formatCurrency(lastPred.PredictedPrice)}
            </div>
        `;
    }

    performanceElement.innerHTML = content;
    performanceElement.style.display = "block";
    performanceElement.classList.add('slide-up');
}

function createStockChart(stockData, predictionData, ticker, model) {
    // Check if ChartUtils is available
    if (typeof ChartUtils === 'undefined') {
        console.error('ChartUtils not loaded');
        Utils.showMessage("error-message", "Chart utilities not loaded. Please refresh the page.", "error");
        return;
    }

    const predictions = predictionData.predictions || predictionData;
    
    // Create traces
    const candlestickTrace = ChartUtils.createCandlestickTrace(stockData, "Historical Data");
    const predictionTrace = ChartUtils.createPredictionTrace(predictions, model, ChartUtils.getModelColor(model));
    
    // Add moving averages if we have enough data
    const traces = [candlestickTrace, predictionTrace];
    
    if (stockData.length >= 20) {
        const ma20Trace = ChartUtils.createMovingAverageTrace(stockData, 20, "#ffa726");
        traces.push(ma20Trace);
    }
    
    if (stockData.length >= 50) {
        const ma50Trace = ChartUtils.createMovingAverageTrace(stockData, 50, "#ef5350");
        traces.push(ma50Trace);
    }

    // Create layout
    const layout = ChartUtils.createLayout(ticker);
    
    // Add custom styling
    layout.annotations = [{
        xref: 'paper',
        yref: 'paper',
        x: 0.02,
        y: 0.98,
        xanchor: 'left',
        yanchor: 'top',
        text: `Generated on ${new Date().toLocaleDateString()}`,
        font: { size: 10, color: '#718096' },
        showarrow: false
    }];

    // Create config
    const config = ChartUtils.createConfig();

    // Plot the chart
    Plotly.newPlot("chart", traces, layout, config)
        .then(() => {
            AppState.currentChart = {
                data: traces,
                layout: layout,
                config: config
            };
            
            // Add chart container animation
            const chartContainer = document.getElementById("chart-container");
            if (chartContainer) {
                chartContainer.classList.add('slide-up');
            }
        })
        .catch(error => {
            console.error('Chart creation error:', error);
            Utils.showMessage("error-message", "Failed to create chart. Please try again.", "error");
        });
}

// Utility function for fetch with timeout
async function fetchWithTimeout(url, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw error;
    }
}

// Export analysis data
function exportAnalysis() {
    if (!AppState.lastAnalysis) {
        Utils.showMessage("error-message", "No analysis data to export.", "error");
        return;
    }
    
    const data = {
        ...AppState.lastAnalysis,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_analysis_${data.ticker}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for Firebase...');
    
    // Wait for Firebase to load
    const checkFirebaseAuth = () => {
        if (typeof window.FirebaseAuth !== 'undefined') {
            console.log('Firebase Authentication loaded successfully');
            
            // Add keyboard shortcuts after Firebase is ready
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const tickerInput = document.getElementById('ticker');
            const daysInput = document.getElementById('days');
            
            // Auth form shortcuts
            if (emailInput) {
                emailInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        login();
                    }
                });
                emailInput.addEventListener('input', function() {
                    window.FirebaseAuth.clearAuthMessage();
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        login();
                    }
                });
                passwordInput.addEventListener('input', function() {
                    window.FirebaseAuth.clearAuthMessage();
                });
            }
            
            // App form shortcuts
            if (tickerInput) {
                tickerInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !AppState.isLoading) {
                        loadCandlestick();
                    }
                });
                tickerInput.addEventListener('input', function() {
                    Utils.hideMessage('error-message');
                });
                tickerInput.addEventListener('blur', function(e) {
                    e.target.value = e.target.value.toUpperCase().trim();
                });
            }
            
            if (daysInput) {
                daysInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !AppState.isLoading) {
                        loadCandlestick();
                    }
                });
            }
            
            // Add tooltips
            addTooltips();
            
        } else {
            console.log('Waiting for Firebase Authentication to load...');
            setTimeout(checkFirebaseAuth, 500);
        }
    };
    
    checkFirebaseAuth();
});

// Add helpful tooltips
function addTooltips() {
    const tooltips = {
        'ticker': 'Enter stock symbols like AAPL (US stocks) or TATAPOWER.NS (Indian stocks)',
        'model': 'Random Forest: Best for most stocks | Linear Regression: Simple trend analysis | Gradient Boosting: Complex pattern recognition',
        'days': 'Number of future days to predict (1-365). Shorter periods are generally more accurate.'
    };
    
    Object.entries(tooltips).forEach(([id, tip]) => {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute('title', tip);
        }
    });
}

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    Utils.showMessage("error-message", "An unexpected error occurred. Please refresh and try again.", "error");
    event.preventDefault();
});

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    return false;
};