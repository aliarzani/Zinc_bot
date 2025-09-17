import requests
import pandas as pd
import matplotlib.pyplot as plt
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from utils import prepare_features
import argparse
import sys

MODEL_FILE = "trained_rf_model.pkl"

def fetch_data(limit=5000):
    url = f"https://api-pub.bitfinex.com/v2/candles/trade:1m:tBTCUSD/hist?limit={limit}&sort=1"
    data = requests.get(url).json()
    df = pd.DataFrame(data, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df

def train_model():
    df = fetch_data(limit=1500)
    df["future_return"] = df["close"].shift(-1) - df["close"]
    df["target"] = (df["future_return"] > 0).astype(int)

    df, features_df = prepare_features(df)
    features_df = features_df.dropna()
    df = df.loc[features_df.index]

    features = ["return", "vol_change", "rsi14", "ma20", "ma50"]
    X = features_df[features]
    y = df["target"]

    split = int(len(df) * 0.7)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("==== Classification Report ====")
    print(classification_report(y_test, y_pred))

    joblib.dump(model, MODEL_FILE)
    print(f"Model saved to {MODEL_FILE}")
    return model

def load_model():
    try:
        model = joblib.load(MODEL_FILE)
        print(f"Loaded existing model: {MODEL_FILE}")
        return model
    except:
        print("No existing model found. Training new model...")
        return train_model()

def run_backtest(balance=10000, leverage=1):
    model = load_model()
    df = fetch_data(limit=5000)
    df, features_df = prepare_features(df)
    features_df = features_df.dropna()
    df = df.loc[features_df.index]

    probs = model.predict_proba(features_df)[:, 1]
    df["prob_up"] = probs

    # --- Multiple positions support ---
    open_positions = []  # list of dicts: {'type': 'BUY'/'SELL', 'entry': price}
    trade_profits = []
    win_trades = 0
    loss_trades = 0
    total_trades = 0
    balance_history = [balance]
    signals = []

    for i in range(1, len(df)):
        price_now = df.iloc[i]["close"]
        prob = df.iloc[i]["prob_up"]
        signal = "HOLD"

        # Open new positions
        if prob > 0.7:
            open_positions.append({'type': 'BUY', 'entry': price_now})
            total_trades += 1
            signal = "BUY"
        elif prob < 0.3:
            open_positions.append({'type': 'SELL', 'entry': price_now})
            total_trades += 1
            signal = "SELL"

        # Check existing positions for exit
        closed_positions = []
        for pos in open_positions:
            pnl = 0
            if pos['type'] == 'BUY' and prob < 0.5:
                pnl = leverage * (price_now - pos['entry'])
            elif pos['type'] == 'SELL' and prob > 0.5:
                pnl = leverage * (pos['entry'] - price_now)

            if pnl != 0:
                balance += pnl
                trade_profits.append(pnl)
                if pnl > 0:
                    win_trades += 1
                else:
                    loss_trades += 1
                closed_positions.append(pos)
                signal = "EXIT"

        # Remove closed positions
        for pos in closed_positions:
            open_positions.remove(pos)

        signals.append(signal)
        balance_history.append(balance)

    df["signal"] = ["HOLD"] + signals

    # --- Signal Chart ---
    plt.figure(figsize=(12, 5))
    plt.plot(df["timestamp"], df["close"], label="Price", color="blue", alpha=0.6)
    buys = df[df["signal"] == "BUY"]
    sells = df[df["signal"] == "SELL"]
    exits = df[df["signal"] == "EXIT"]
    plt.scatter(buys["timestamp"], buys["close"], marker="^", color="green", label="BUY")
    plt.scatter(sells["timestamp"], sells["close"], marker="v", color="red", label="SELL")
    plt.scatter(exits["timestamp"], exits["close"], marker="o", color="orange", label="EXIT")
    plt.title("Signal Chart")
    plt.legend()
    plt.show()

    # --- Equity Curve ---
    plt.figure(figsize=(12, 5))
    plt.plot(balance_history, label="Balance", color="black")
    plt.title("Equity Curve")
    plt.xlabel("Trade Index")
    plt.ylabel("Balance")
    plt.legend()
    plt.show()

    # --- Metrics ---
    win_rate = round(100 * win_trades / total_trades, 2) if total_trades else 0
    net_profit = round(balance - balance_history[0], 2)
    initial_balance = balance_history[0]
    final_balance = balance

    # Max Drawdown
    balance_series = pd.Series(balance_history)
    rolling_max = balance_series.cummax()
    drawdown_series = (balance_series - rolling_max) / rolling_max
    max_drawdown = drawdown_series.min() * 100  # %

    # Backtest period
    period_start = df["timestamp"].iloc[0]
    period_end = df["timestamp"].iloc[-1]

    # --- Report ---
    print("\n==== Backtest Report ====")
    print(f"Period:           {period_start} to {period_end}")
    print(f"Initial Balance:  {initial_balance:.2f}")
    print(f"Final Balance:    {final_balance:.2f}")
    print(f"Net Profit:       {net_profit:.2f}")
    print(f"Total Trades:     {total_trades}")
    print(f"Winning Trades:   {win_trades}")
    print(f"Losing Trades:    {loss_trades}")
    print(f"Win Rate:         {win_rate:.2f}%")
    print(f"Max Drawdown:     {max_drawdown:.2f}%")
    print(f"Open Positions Left: {len(open_positions)}")

    return {
        "balance": round(final_balance, 2),
        "net_profit": net_profit,
        "win_rate": win_rate,
        "max_drawdown": round(max_drawdown, 2),
        "total_trades": total_trades,
        "winning_trades": win_trades,
        "losing_trades": loss_trades,
        "period_start": period_start,
        "period_end": period_end,
        "open_positions_left": len(open_positions)
    }



def main():
    parser = argparse.ArgumentParser(description='Run Bitcoin trading backtest')
    parser.add_argument('--balance', type=float, default=10000, help='Initial balance')
    parser.add_argument('--leverage', type=int, default=1, help='Leverage')
    parser.add_argument('--user-id', required=True, help='User ID')
    
    args = parser.parse_args()
    
    print(f"Starting backtest for user {args.user_id}")
    print(f"Initial balance: ${args.balance}")
    print(f"Leverage: {args}x")
    print("=" * 50)
    
    try:
        result = run_backtest(balance=args.balance, leverage=args.leverage)
        print("Backtest completed successfully!")
        print(f"Final balance: ${result['balance']:.2f}")
        print(f"Net profit: ${result['net_profit']:.2f}")
        print(f"Win rate: {result['win_rate']:.2f}%")
    except Exception as e:
        print(f"Backtest failed: {str(e)}")
        sys.exit(1)



if __name__ == "__main__":
    run_backtest(balance=10000)
