import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random

def calculate_risk_profile(user_trades: list) -> tuple:
    """
    Evaluates user's trading patterns to assign a Risk Score (0-100).
    Higher score = more aggressive (frequent trading, volatile stocks).
    Lower score = more conservative.
    """
    if not user_trades:
        return 50, "Moderate" # Default for new users
        
    df = pd.DataFrame(user_trades)
    
    # 1. Trade Frequency Factor
    # (In a real app, calculate trades per month. Here we just use a cap for demonstration)
    trade_count = len(df)
    frequency_score = min(trade_count * 2, 40) # Max 40 points from frequency
    
    # 2. Volatility factor (Simulated based on typical beta of symbols traded)
    # Ideally, we'd fetch the Beta for each symbol. We mock it for the hackathon.
    high_risk_symbols = ['TSLA', 'NVDA', 'COIN', 'ARKK']
    low_risk_symbols = ['JNJ', 'PG', 'KO', 'PEP', 'VOO', 'SPY']
    
    volatility_score = 30 # Default middle ground 30/60 points
    for _, row in df.iterrows():
        if row['symbol'] in high_risk_symbols:
            volatility_score += 2
        elif row['symbol'] in low_risk_symbols:
            volatility_score -= 2
            
    volatility_score = max(10, min(volatility_score, 60)) # Clamp between 10 and 60
    
    total_score = frequency_score + volatility_score
    
    # Categorize
    if total_score > 75:
        category = "Aggressive"
    elif total_score > 40:
        category = "Moderate"
    else:
        category = "Conservative"
        
    return int(total_score), category

def generate_hybrid_recommendations(target_user_id: str, all_trades: list) -> list:
    """
    Combines Collaborative Filtering (User-User) with Content-Based filtering.
    """
    # 1. Prepare Data
    if not all_trades:
        return _fallback_recommendations()
        
    df = pd.DataFrame(all_trades)
    
    # Handle the cold start problem
    user_trades = df[df['user_id'] == target_user_id]
    if user_trades.empty:
        return _fallback_recommendations()

    # Create User-Item Matrix (Rows: users, Columns: symbols, Values: net quantity)
    # 1 for Buy, -1 for Sell to calculate net holdings implicitly
    df['sign_qty'] = df.apply(lambda row: float(row['quantity']) if row['type'] == 'BUY' else -float(row['quantity']), axis=1)
    
    user_item_matrix = df.groupby(['user_id', 'symbol'])['sign_qty'].sum().unstack(fill_value=0)
    
    # Normalizing (0 or 1 based on if they hold it)
    user_item_matrix = user_item_matrix.applymap(lambda x: 1 if x > 0 else 0)

    # If target user isn't in matrix properly yet
    if target_user_id not in user_item_matrix.index:
         return _fallback_recommendations()

    # 2. Collaborative Filtering (Finding similar users)
    try:
        user_vector = user_item_matrix.loc[target_user_id].values.reshape(1, -1)
        similarities = cosine_similarity(user_vector, user_item_matrix)
        
        # Get index of most similar user (excluding themselves)
        similar_indices = similarities[0].argsort()[::-1]
        similar_user_id = None
        for idx in similar_indices:
            uid = user_item_matrix.index[idx]
            if uid != target_user_id:
                similar_user_id = uid
                break
                
        recommendations = []
        if similar_user_id:
            # Find what the similar user bought that the target user hasn't
            target_holdings = user_item_matrix.loc[target_user_id]
            similar_holdings = user_item_matrix.loc[similar_user_id]
            
            for symbol, holds in similar_holdings.items():
                if holds == 1 and target_holdings[symbol] == 0:
                    recommendations.append({
                        "symbol": symbol,
                        "confidence": round(similarities[0][user_item_matrix.index.get_loc(similar_user_id)] * 100, 1),
                        "reason": "Investors similar to you also bought this."
                    })
    except Exception as e:
        print(f"CF Error: {e}")
        recommendations = []
        
    # Fill up with some high-momentum content-based fallbacks if we don't have enough CF recs
    return recommendations[:3] if recommendations else _fallback_recommendations()

def _fallback_recommendations():
    recs = [
        {"symbol": "MSFT", "confidence": 92.5, "reason": "Strong market momentum and low risk."},
        {"symbol": "NVDA", "confidence": 88.0, "reason": "High sector volatility matches growth profiles."},
        {"symbol": "AAPL", "confidence": 85.5, "reason": "Consistent blue-chip performer."}
    ]
    random.shuffle(recs)
    return recs[:2]
