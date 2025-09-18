# Backend-Bot/backtest.py - Fixed version with JSON output
import pandas as pd
import matplotlib.pyplot as plt
import argparse
import sys
import os
import time
import json
from trading_bot_base import TradingBotBase
from utils import prepare_features, compute_rsi

class TradingBot(TradingBotBase):
    def __init__(self, mode='backtest'):
        super().__init__(mode)
    
    def run_backtest(self, balance=10000, leverage=1, period='7', timeframe='1m'):
        print("Starting backtest...")
        try:
            df = self.fetch_data(limit=5000)
            if df is None or df.empty:
                print("Error: No data fetched for backtest")
                return None
                
            df, features_df = prepare_features(df)
            features_df = features_df.dropna()
            df = df.loc[features_df.index]

            if len(df) == 0:
                print("Error: No data after feature preparation")
                return None

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
            max_drawdown = round(drawdown_series.min() * 100, 2)  # %

            # Output results in JSON format for Node.js to parse
            result = {
                "initialBalance": initial_balance,
                "finalBalance": final_balance,
                "netProfit": net_profit,
                "winRate": win_rate,
                "maxDrawdown": max_drawdown,
                "totalTrades": total_trades,
                "winningTrades": win_trades,
                "losingTrades": loss_trades
            }
            
            # Print JSON result for Node.js to capture
            print("==== BACKTEST_RESULT_START ====")
            print(json.dumps(result))
            print("==== BACKTEST_RESULT_END ====")
            
            print(f"Backtest completed successfully!")
            print(f"Initial Balance: ${initial_balance:.2f}")
            print(f"Final Balance: ${final_balance:.2f}")
            print(f"Net Profit: ${net_profit:.2f}")
            print(f"Win Rate: {win_rate:.2f}%")
            print(f"Max Drawdown: {max_drawdown:.2f}%")
            print(f"Total Trades: {total_trades}")
            print(f"Winning Trades: {win_trades}")
            print(f"Losing Trades: {loss_trades}")
            
            return result
            
        except Exception as e:
            print(f"Error during backtest: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

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
    parser.add_argument('--period', type=str, default='7', help='Backtest period')
    parser.add_argument('--timeframe', type=str, default='1m', help='Timeframe')
    
    args = parser.parse_args()
    
    bot = TradingBot(mode=args.mode)
    
    if args.mode == 'backtest':
        result = bot.run_backtest(args.balance, args.leverage, args.period, args.timeframe)
        if result is None:
            print("Backtest failed!")
            sys.exit(1)
    else:
        bot.run_live_trading(args.balance, args.leverage, args.max_risk)

if __name__ == "__main__":
    main()