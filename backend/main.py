from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import logging
from utils.data_processing import calculate_rsi, add_technical_indicators
from config import API_HOST, API_PORT, ALLOWED_ORIGINS, DEFAULT_MODEL, MAX_PREDICTION_DAYS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Predictor API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Available models
MODELS = {
    "RandomForest": RandomForestRegressor(n_estimators=100, random_state=42),
    "LinearRegression": LinearRegression(),
    "GradientBoosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
}

@app.get("/")
def home():
    return {
        "message": "Stock Predictor API is running!",
        "version": "1.0.0",
        "available_models": list(MODELS.keys()),
        "max_prediction_days": MAX_PREDICTION_DAYS
    }

@app.get("/stock-data")
def get_stock_data(ticker: str = Query(..., description="Stock ticker symbol")):
    """Return last 6 months of OHLC stock data"""
    try:
        df = yf.download(ticker, period="6mo")
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        
        df.reset_index(inplace=True)
        data = df[["Date", "Open", "High", "Low", "Close", "Volume"]]
        data["Date"] = data["Date"].astype(str)
        
        logger.info(f"Successfully fetched data for {ticker}")
        return data.to_dict(orient="records")
    
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@app.get("/predict")
def predict_stock(
    ticker: str = Query(..., description="Stock ticker symbol"),
    days: int = Query(30, ge=1, le=MAX_PREDICTION_DAYS, description="Number of days to predict"),
    model: str = Query(DEFAULT_MODEL, description="ML model to use")
):
    """Predict future stock prices using ML models"""
    try:
        # Validate model
        if model not in MODELS:
            raise HTTPException(status_code=400, detail=f"Invalid model. Available: {list(MODELS.keys())}")
        
        # Download stock data
        df = yf.download(ticker, period="1y")  # Use 1 year for better training
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        
        df.reset_index(inplace=True)
        
        # Add technical indicators
        df = add_technical_indicators(df)
        
        # Prepare features and target
        df.dropna(inplace=True)
        
        feature_cols = ['Open', 'High', 'Low', 'Volume', 'MA_5', 'MA_20', 'RSI', 'Price_Change', 'Volume_MA']
        X = df[feature_cols].values
        y = df['Close'].values
        
        # Train/Test split
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Choose and train model
        reg = MODELS[model]
        reg.fit(X_train, y_train)
        
        # Calculate model performance
        y_pred_test = reg.predict(X_test)
        mse = mean_squared_error(y_test, y_pred_test)
        r2 = r2_score(y_test, y_pred_test)
        
        # Predict future prices
        predictions = []
        current_features = df[feature_cols].iloc[-1].values.reshape(1, -1)
        
        last_date = pd.to_datetime(df["Date"].iloc[-1])
        
        for i in range(days):
            pred_price = reg.predict(current_features)[0]
            future_date = (last_date + timedelta(days=i+1)).strftime("%Y-%m-%d")
            
            predictions.append({
                "Date": future_date,
                "PredictedPrice": float(pred_price)
            })
            
            # Update features for next prediction (simplified)
            current_features[0][0] = pred_price  # Update Open with predicted price
        
        logger.info(f"Successfully predicted {days} days for {ticker} using {model}")
        
        return {
            "predictions": predictions,
            "model_performance": {
                "mse": float(mse),
                "r2_score": float(r2),
                "model_used": model
            }
        }
    
    except Exception as e:
        logger.error(f"Error predicting for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error making predictions: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Stock Predictor API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)