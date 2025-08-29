// Chart Utility Functions
const ChartUtils = {
    // Create candlestick trace for Plotly
    createCandlestickTrace(data, name = "Historical Data") {
        return {
            x: data.map(row => row.Date),
            open: data.map(row => row.Open),
            high: data.map(row => row.High),
            low: data.map(row => row.Low),
            close: data.map(row => row.Close),
            type: "candlestick",
            name: name,
            increasing: {
                line: { color: '#00ff88', width: 1 },
                fillcolor: 'rgba(0, 255, 136, 0.2)'
            },
            decreasing: {
                line: { color: '#ff4757', width: 1 },
                fillcolor: 'rgba(255, 71, 87, 0.2)'
            },
            xaxis: 'x',
            yaxis: 'y'
        };
    },

    // Create prediction trace
    createPredictionTrace(predictions, model, color = "#ff6b6b") {
        return {
            x: predictions.map(p => p.Date),
            y: predictions.map(p => p.PredictedPrice),
            mode: "lines+markers",
            name: `Predicted (${model})`,
            line: {
                color: color,
                width: 3,
                dash: "dot",
                shape: 'spline'
            },
            marker: {
                size: 6,
                color: color,
                symbol: 'diamond',
                line: {
                    width: 2,
                    color: '#ffffff'
                }
            },
            hovertemplate: '<b>%{fullData.name}</b><br>' +
                          'Date: %{x}<br>' +
                          'Price: $%{y:.2f}<br>' +
                          '<extra></extra>'
        };
    },

    // Create volume trace
    createVolumeTrace(data) {
        return {
            x: data.map(row => row.Date),
            y: data.map(row => row.Volume),
            type: 'bar',
            name: 'Volume',
            marker: {
                color: 'rgba(66, 153, 225, 0.6)'
            },
            yaxis: 'y2',
            hovertemplate: '<b>Volume</b><br>' +
                          'Date: %{x}<br>' +
                          'Volume: %{y:,.0f}<br>' +
                          '<extra></extra>'
        };
    },

    // Create moving average trace
    createMovingAverageTrace(data, period, color = "#ffa726") {
        // Calculate moving average
        const ma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                ma.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1)
                    .reduce((acc, row) => acc + row.Close, 0);
                ma.push(sum / period);
            }
        }

        return {
            x: data.map(row => row.Date),
            y: ma,
            mode: 'lines',
            name: `MA(${period})`,
            line: {
                color: color,
                width: 2
            },
            hovertemplate: '<b>%{fullData.name}</b><br>' +
                          'Date: %{x}<br>' +
                          'Value: $%{y:.2f}<br>' +
                          '<extra></extra>'
        };
    },

    // Create default layout
    createLayout(ticker, showVolume = false) {
        const layout = {
            title: {
                text: `${ticker} - Technical Analysis & ML Prediction`,
                font: {
                    size: 24,
                    color: '#2d3748',
                    family: 'Segoe UI, sans-serif'
                },
                x: 0.5
            },
            xaxis: {
                title: {
                    text: "Date",
                    font: { size: 14, color: '#4a5568' }
                },
                gridcolor: '#e2e8f0',
                gridwidth: 1,
                showgrid: true,
                zeroline: false,
                rangeslider: { visible: false }, // Hide range slider for cleaner look
                type: 'date'
            },
            yaxis: {
                title: {
                    text: "Price ($)",
                    font: { size: 14, color: '#4a5568' }
                },
                gridcolor: '#e2e8f0',
                gridwidth: 1,
                showgrid: true,
                zeroline: false,
                side: 'left'
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            font: {
                family: 'Segoe UI, sans-serif',
                size: 12,
                color: '#2d3748'
            },
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: '#e2e8f0',
                borderwidth: 1,
                font: { size: 12 }
            },
            margin: {
                t: 80,
                b: 60,
                l: 80,
                r: 60
            },
            hovermode: 'x unified',
            dragmode: 'zoom'
        };

        // Add volume subplot if requested
        if (showVolume) {
            layout.yaxis2 = {
                title: "Volume",
                overlaying: 'y',
                side: 'right',
                showgrid: false
            };
            layout.grid = {
                rows: 2,
                columns: 1,
                pattern: 'independent',
                roworder: 'top to bottom'
            };
        }

        return layout;
    },

    // Create plot configuration
    createConfig() {
        return {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                'lasso2d',
                'select2d',
                'hoverClosestCartesian',
                'hoverCompareCartesian',
                'toggleSpikelines'
            ],
            toImageButtonOptions: {
                format: 'png',
                filename: 'stock_analysis',
                height: 600,
                width: 1200,
                scale: 2
            }
        };
    },

    // Get color based on model type
    getModelColor(model) {
        const colors = {
            'RandomForest': '#ff6b6b',
            'LinearRegression': '#4ecdc4',
            'GradientBoosting': '#45b7d1',
            'XGBoost': '#96ceb4',
            'LSTM': '#feca57'
        };
        return colors[model] || '#ff6b6b';
    },

    // Format large numbers for display
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(2);
    },

    // Calculate price change percentage
    calculatePriceChange(current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    },

    // Create annotation for significant events
    createAnnotation(x, y, text, color = '#ff6b6b') {
        return {
            x: x,
            y: y,
            xref: 'x',
            yref: 'y',
            text: text,
            showarrow: true,
            arrowhead: 2,
            arrowsize: 1,
            arrowwidth: 2,
            arrowcolor: color,
            font: {
                color: color,
                size: 12
            },
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            bordercolor: color,
            borderwidth: 2
        };
    },

    // Add trend lines
    addTrendLine(data, startIdx, endIdx, color = '#666') {
        const startPoint = data[startIdx];
        const endPoint = data[endIdx];
        
        return {
            x: [startPoint.Date, endPoint.Date],
            y: [startPoint.Close, endPoint.Close],
            mode: 'lines',
            name: 'Trend Line',
            line: {
                color: color,
                width: 2,
                dash: 'dash'
            },
            showlegend: false
        };
    },

    // Create support/resistance levels
    createSupportResistance(data, level, type = 'support') {
        const color = type === 'support' ? '#00ff88' : '#ff4757';
        
        return {
            x: [data[0].Date, data[data.length - 1].Date],
            y: [level, level],
            mode: 'lines',
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Level`,
            line: {
                color: color,
                width: 2,
                dash: 'dash'
            },
            hovertemplate: `<b>${type} Level</b><br>Price: $%{y:.2f}<extra></extra>`
        };
    }
};

// Export for global use
window.ChartUtils = ChartUtils;