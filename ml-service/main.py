import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from recommender import generate_hybrid_recommendations, calculate_risk_profile
import yfinance as yf

load_dotenv()

app = FastAPI(title="FinFlex ML Microservice")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Admin Client for DB access
url: str = os.environ.get("VITE_SUPABASE_URL", "")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

# In production use the Service Key, using anon for demo/hackathon purposes if it has RLS bypass
supabase: Client = create_client(url, key) if url and key else None

@app.get("/")
def read_root():
    return {"status": "ML Service is running", "models": ["CF", "Content-Based", "Time-Series"]}

@app.get("/api/ml/risk-profile/{user_id}")
async def get_risk_profile(user_id: str):
    """
    Calculate user's risk profile based on their trades and holdings.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    try:
        # Fetch user's trades
        res = supabase.table("stock_trades").select("*").eq("user_id", user_id).execute()
        trades = res.data
        
        # Calculate Risk Score (1-100)
        risk_score, category = calculate_risk_profile(trades)
        
        return {
            "user_id": user_id,
            "risk_score": risk_score,
            "category": category,
            "trade_count": len(trades)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """
    Generate personalized stock recommendations using Hybrid Filtering.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        # 1. Fetch ALL users and their trades for Collaborative Filtering
        all_trades_res = supabase.table("stock_trades").select("*").execute()
        all_trades = all_trades_res.data
        
        if not all_trades:
            # Cold start fallback
            return {"recommendations": [{"symbol": "AAPL", "confidence": 0.95, "reason": "Popular market leader"}]}

        recommendations = generate_hybrid_recommendations(user_id, all_trades)
        return {"user_id": user_id, "recommendations": recommendations}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/predict/{symbol}")
async def predict_stock_trend(symbol: str):
    """
    Predict generic short-term trend for a stock using Simple Moving Averages.
    """
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="3mo")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found")
            
        # Basic Technical Analysis for the hackathon instead of a long LSTM training cycle
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        
        current_price = hist['Close'].iloc[-1]
        sma_20 = hist['SMA_20'].iloc[-1]
        sma_50 = hist['SMA_50'].iloc[-1]
        
        # Determine trend
        trend = "Neutral"
        confidence = 50.0
        
        if current_price > sma_20 and sma_20 > sma_50:
            trend = "Bullish"
            confidence = 85.0
        elif current_price < sma_20 and sma_20 < sma_50:
            trend = "Bearish"
            confidence = 80.0
            
        return {
            "symbol": symbol,
            "current_price": current_price,
            "predicted_trend": trend,
            "confidence_score": confidence,
            "indicators": {
                "sma_20": sma_20,
                "sma_50": sma_50
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
