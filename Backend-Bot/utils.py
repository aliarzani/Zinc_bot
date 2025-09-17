import pandas as pd

def compute_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def prepare_features(df):
    df['return'] = df['close'].pct_change()
    df['vol_change'] = df['volume'].pct_change()
    df['ma20'] = df['close'].rolling(20).mean()
    df['ma50'] = df['close'].rolling(50).mean()
    df['rsi14'] = compute_rsi(df['close'], 14)
    df = df.dropna()
    features = ['return', 'vol_change', 'rsi14', 'ma20', 'ma50']
    return df, df[features]
