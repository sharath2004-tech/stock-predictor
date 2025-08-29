# from fastapi import FastAPI, Query, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse, JSONResponse
# import yfinance as yf
# import pandas as pd
# import numpy as np
# from datetime import datetime, timedelta
# from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
# from sklearn.linear_model import LinearRegression
# from sklearn.metrics import mean_squared_error, r2_score
# import os
# import logging
# import warnings
# warnings.filterwarnings("ignore")

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="Stock Predictor API", version="1.0.0")

# # CORS configuration - Be more specific in production
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, specify your frontend URL
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "OPTIONS"],
#     allow_headers=["*"],
# )

# # Serve frontend files
# frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
# if os.path.exists(frontend_path):
#     app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# @app.get("/")
# def root():
#     """Serve frontend index.html"""
#     if os.path.exists(os.path.join(frontend_path, "index.html")):
#         return FileResponse(os.path.join(frontend_path, "index.html"))
#     else:
#         return {"message": "Stock Predictor API", "status": "running", "endpoints": ["/stock-data", "/predict", "/stocks"]}

# # Stock lists
# POPULAR_STOCKS = [
#     "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META", "NFLX", "AMD", "INTC"
# ]

# INDIAN_STOCKS = [
#     "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFC.NS", "ICICIBANK.NS", 
#     "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "LT.NS"
# ]

# @app.get("/stocks")
# def get_stock_list():
#     """Get list of popular stocks"""
#     return {
#         "popular": POPULAR_STOCKS,
#         "indian": INDIAN_STOCKS,
#         "message": "Use .NS suffix for Indian stocks (e.g., RELIANCE.NS)"
#     }

# @app.get("/stock-data")
# def get_stock_data(ticker: str = Query(..., description="Stock ticker symbol")):
#     """Fetch historical stock data"""
#     try:
#         # Clean ticker symbol
#         ticker = ticker.upper().strip()
#         logger.info(f"Fetching data for ticker: {ticker}")
        
#         # Download stock data
#         stock = yf.Ticker(ticker)
        
#         # Try different periods to ensure we get data
#         for period in ["6mo", "3mo", "1mo"]:
#             try:
#                 data = stock.history(period=period)
#                 if not data.empty:
#                     break
#             except:
#                 continue
        
#         if data.empty:
#             raise HTTPException(
#                 status_code=404, 
#                 detail=f"No data found for ticker '{ticker}'. Please check the symbol."
#             )
        
#         # Reset index to get Date as a column
#         data.reset_index(inplace=True)
        
#         # Format data for frontend
#         stock_data = []
#         for _, row in data.iterrows():
#             stock_data.append({
#                 "Date": row["Date"].strftime("%Y-%m-%d"),
#                 "Open": round(float(row["Open"]), 2),
#                 "High": round(float(row["High"]), 2),
#                 "Low": round(float(row["Low"]), 2),
#                 "Close": round(float(row["Close"]), 2),
#                 "Volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0
#             })
        
#         # Get basic stock info
#         info = stock.info
#         company_name = info.get('longName', info.get('shortName', ticker))
        
#         logger.info(f"Successfully fetched {len(stock_data)} data points for {ticker}")
        
#         return {
#             "ticker": ticker,
#             "company_name": company_name,
#             "data": stock_data,
#             "data_points": len(stock_data),
#             "latest_price": stock_data[-1]["Close"] if stock_data else None
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error fetching data for {ticker}: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to fetch data: {str(e)}"
#         )

# @app.get("/predict")
# def predict_stock(
#     ticker: str = Query(..., description="Stock ticker symbol"),
#     days: int = Query(30, ge=1, le=365, description="Number of days to predict"),
#     model: str = Query("RandomForest", description="ML model to use")
# ):
#     """Generate stock price predictions"""
#     try:
#         # Clean inputs
#         ticker = ticker.upper().strip()
#         logger.info(f"Generating predictions for {ticker}, {days} days, model: {model}")
        
#         # Download stock data
#         stock = yf.Ticker(ticker)
        
#         # Try different periods to get enough data
#         for period in ["1y", "6mo", "3mo"]:
#             try:
#                 data = stock.history(period=period)
#                 if len(data) >= 30:  # Need at least 30 days for good predictions
#                     break
#             except:
#                 continue
        
#         if data.empty or len(data) < 10:
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"Insufficient data for ticker '{ticker}'"
#             )
        
#         # Prepare data
#         data.reset_index(inplace=True)
#         data = data.dropna()
        
#         # Create features (simple time-based features)
#         X = np.arange(len(data)).reshape(-1, 1)
#         y = data["Close"].values
        
#         # Split data (80% train, 20% test)
#         train_size = int(len(X) * 0.8)
#         X_train, X_test = X[:train_size], X[train_size:]
#         y_train, y_test = y[:train_size], y[train_size:]
        
#         # Available models
#         models = {
#             "RandomForest": RandomForestRegressor(
#                 n_estimators=100, 
#                 random_state=42, 
#                 max_depth=10
#             ),
#             "LinearRegression": LinearRegression(),
#             "GradientBoosting": GradientBoostingRegressor(
#                 n_estimators=100, 
#                 random_state=42, 
#                 max_depth=6
#             )
#         }
        
#         # Use specified model or default
#         if model not in models:
#             model = "RandomForest"
        
#         selected_model = models[model]
        
#         # Train model
#         selected_model.fit(X_train, y_train)
        
#         # Make predictions on test set for performance evaluation
#         test_predictions = selected_model.predict(X_test)
        
#         # Calculate performance metrics
#         mse = mean_squared_error(y_test, test_predictions)
#         r2 = r2_score(y_test, test_predictions)
        
#         # Generate future predictions
#         future_X = np.arange(len(X), len(X) + days).reshape(-1, 1)
#         future_predictions = selected_model.predict(future_X)
        
#         # Create future dates
#         last_date = data["Date"].iloc[-1]
#         future_dates = []
#         for i in range(1, days + 1):
#             # Skip weekends for stock predictions
#             future_date = last_date + timedelta(days=i)
#             # Simple weekend skip (you might want more sophisticated market calendar)
#             while future_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
#                 future_date += timedelta(days=1)
#             future_dates.append(future_date)
        
#         # Format predictions
#         predictions = []
#         for i, (date, price) in enumerate(zip(future_dates, future_predictions)):
#             predictions.append({
#                 "Date": date.strftime("%Y-%m-%d"),
#                 "PredictedPrice": round(float(price), 2),
#                 "DayNumber": i + 1
#             })
        
#         # Calculate prediction confidence based on model performance
#         confidence = "High" if r2 > 0.7 else "Medium" if r2 > 0.5 else "Low"
        
#         logger.info(f"Prediction completed: R² = {r2:.3f}, MSE = {mse:.3f}")
        
#         return {
#             "ticker": ticker,
#             "predictions": predictions,
#             "model_performance": {
#                 "model_used": model,
#                 "r2_score": round(float(r2), 4),
#                 "mse": round(float(mse), 4),
#                 "confidence": confidence,
#                 "training_days": len(data),
#                 "prediction_days": days
#             },
#             "latest_price": round(float(data["Close"].iloc[-1]), 2),
#             "prediction_range": {
#                 "min": round(float(min(future_predictions)), 2),
#                 "max": round(float(max(future_predictions)), 2),
#                 "avg": round(float(np.mean(future_predictions)), 2)
#             }
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Prediction error for {ticker}: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Prediction failed: {str(e)}"
#         )

# @app.get("/health")
# def health_check():
#     """Health check endpoint"""
#     return {
#         "status": "healthy",
#         "timestamp": datetime.now().isoformat(),
#         "version": "1.0.0"
#     }

# # Error handler for CORS preflight requests
# @app.options("/{path:path}")
# def handle_options():
#     return JSONResponse(content={}, headers={
#         "Access-Control-Allow-Origin": "*",
#         "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
#         "Access-Control-Allow-Headers": "*"
#     })

# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.environ.get("PORT", 8000))
#     uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)















# backend.py
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from fastapi import FastAPI


app = FastAPI(title="Stock Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
@app.get("/stock-data")
def get_stock_data(ticker: str = Query(...)):
    ticker = ticker.upper().strip()
    try:
        stock = yf.Ticker(ticker)
        data = None
        for period in ["6mo","3mo","1mo"]:
            data = stock.history(period=period)
            if not data.empty: break
        if data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for '{ticker}'")
        data.reset_index(inplace=True)
        stock_data = [{"Date":d.strftime("%Y-%m-%d"),"Open":round(float(o),2),"High":round(float(h),2),
                       "Low":round(float(l),2),"Close":round(float(c),2),"Volume":int(v)}
                      for d,o,h,l,c,v in zip(data.Date,data.Open,data.High,data.Low,data.Close,data.Volume)]
        info = stock.info
        company_name = info.get("longName",info.get("shortName",ticker))
        return {"ticker":ticker,"company_name":company_name,"data":stock_data,"latest_price":stock_data[-1]["Close"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict")
def predict_stock(ticker: str = Query(...), days: int = Query(30, ge=1, le=365), model: str = Query("RandomForest")):
    ticker = ticker.upper().strip()
    try:
        stock = yf.Ticker(ticker)
        data = None
        for period in ["1y","6mo","3mo"]:
            data = stock.history(period=period)
            if len(data) >= 30: break
        if data.empty or len(data)<10:
            raise HTTPException(status_code=404, detail=f"Insufficient data for '{ticker}'")
        data.reset_index(inplace=True)
        data = data.dropna()
        X = np.arange(len(data)).reshape(-1,1)
        y = data["Close"].values
        train_size = int(len(X)*0.8)
        X_train,X_test=X[:train_size],X[train_size:]
        y_train,y_test=y[:train_size],y[train_size:]

        models = {
            "RandomForest": RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10),
            "GradientBoosting": GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=6),
            "LinearRegression": LinearRegression()
        }
        selected_model = models.get(model,models["RandomForest"])
        selected_model.fit(X_train,y_train)
        test_pred = selected_model.predict(X_test)
        mse = mean_squared_error(y_test,test_pred)
        r2 = r2_score(y_test,test_pred)

        future_X = np.arange(len(X),len(X)+days).reshape(-1,1)
        future_pred = selected_model.predict(future_X)
        last_date = data["Date"].iloc[-1]
        future_dates = []
        for i in range(1,days+1):
            d = last_date + timedelta(days=i)
            while d.weekday()>=5: d += timedelta(days=1)
            future_dates.append(d)
        predictions=[{"Date":d.strftime("%Y-%m-%d"),"PredictedPrice":round(float(p),2)} 
                     for d,p in zip(future_dates,future_pred)]

        confidence = "High" if r2>0.7 else "Medium" if r2>0.5 else "Low"
        return {
            "ticker":ticker,
            "predictions":predictions,
            "model_performance":{"model_used":model,"r2_score":round(float(r2),4),"mse":round(float(mse),4),"confidence":confidence},
            "latest_price":round(float(data["Close"].iloc[-1]),2),
            "prediction_range":{"min":round(float(min(future_pred)),2),"max":round(float(max(future_pred)),2),"avg":round(float(np.mean(future_pred)),2)}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
