# Backend-Bot/backtest.py - Fixed version
import pandas as pd
import matplotlib.pyplot as plt
import argparse
import sys
import os
import time  # Add this import
from trading_bot_base import TradingBotBase
from utils import prepare_features, compute_rsi

class TradingBot(TradingBotBase):
    def __init__(self, mode='backtest'):
        super().__init__(mode)
    
    def run_backtest(self, balance=10000, leverage=1):
        print("Starting backtest...")
        df = self.fetch_data(limit=5000)
        df, features_df = prepare_features(df)
        features_df = features_df.dropna()
        df = df.loc[features_df.index]

        probs = self.model.predict_proba(features_df)[:, 1]
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

        # At the end of the method, return the result
        return {
            "balance": final_balance,
            "net_profit": net_profit,
            "win_rate": win_rate,
            "max_drawdown": max_drawdown,
            "total_trades": total_trades,
            "winning_trades": win_trades,
            "losing_trades": loss_trades
        }

    def run_live_trading(self, balance, leverage, max_risk):
        print("Starting live trading with AI strategy...")
        # Live trading logic
        while True:
            try:
                # Get real-time data
                current_data = self.get_realtime_data()
                
                # Use the same AI logic as backtest
                prediction = self.make_prediction(current_data)
                
                # Execute trades based on AI signals
                if prediction > 0.7:  # Buy signal
                    self.place_order('buy', current_data['price'])
                elif prediction < 0.3:  # Sell signal
                    self.place_order('sell', current_data['price'])
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"Live trading error: {e}")
                time.sleep(30)

def main():
    parser = argparse.ArgumentParser(description='Trading Bot')
    parser.add_argument('--mode', choices=['backtest', 'live'], required=True, help='Operation mode')
    parser.add_argument('--balance', type=float, default=10000, help='Initial balance')
    parser.add_argument('--leverage', type=int, default=1, help='Leverage')
    parser.add_argument('--max-risk', type=float, default=2, help='Max risk (%)')
    parser.add_argument('--user-id', required=True, help='User ID')
    
    args = parser.parse_args()
    
    bot = TradingBot(mode=args.mode)
    
    if args.mode == 'backtest':
        result = bot.run_backtest(args.balance, args.leverage)
        print("Backtest completed!")
        print(f"Final balance: ${result['balance']:.2f}")
        print(f"Net profit: ${result['net_profit']:.2f}")
        print(f"Win rate: {result['win_rate']:.2f}%")
    else:
        bot.run_live_trading(args.balance, args.leverage, args.max_risk)

if __name__ == "__main__":
    main()