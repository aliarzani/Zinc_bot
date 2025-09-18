# Backend-Bot/live_trading.py
import time
import json
import hmac
import hashlib
import argparse
import sys
import os
import requests
from trading_bot_base import TradingBotBase  # Import from base class

class LiveTrader(TradingBotBase):
    def __init__(self, api_key, api_secret):
        super().__init__(mode='live')
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://api.bitfinex.com/v2"
        self.open_positions = []
        
    def generate_signature(self, path, body, nonce):
        signature = f"/api/v2{path}{nonce}{body}"
        return hmac.new(self.api_secret.encode(), signature.encode(), hashlib.sha384).hexdigest()
    
    def place_order(self, symbol, amount, price, order_type="EXCHANGE LIMIT"):
        nonce = str(int(time.time() * 1000))
        path = "/auth/w/order/submit"
        body = json.dumps({
            "type": order_type,
            "symbol": symbol,
            "amount": str(amount),
            "price": str(price)
        })
        
        signature = self.generate_signature(path, body, nonce)
        
        headers = {
            "bfx-apikey": self.api_key,
            "bfx-signature": signature,
            "bfx-nonce": nonce,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{self.base_url}{path}", headers=headers, data=body)
            if response.status_code == 200:
                print(f"✓ Order placed: {amount} {symbol} @ ${price}")
                return response.json()
            else:
                print(f"✗ Order failed: {response.text}")
                return None
        except Exception as e:
            print(f"✗ Order error: {e}")
            return None
    
    def get_realtime_data(self):
        """Get real-time market data"""
        try:
            response = requests.get(f"{self.base_url}/ticker/tBTCUSD")
            data = response.json()
            return {
                'price': data[6],  # Last price
                'volume': data[7],  # Volume
                'high': data[8],    # High
                'low': data[9]      # Low
            }
        except Exception as e:
            print(f"Data fetch error: {e}")
            return None
    
    def make_prediction(self, current_data):
        """Use the same AI logic as backtest"""
        # This would use your ML model to make predictions
        # You need to implement this based on your features
        # For now, return a dummy value
        return 0.5
    
    def run_live_trading(self, balance, leverage, max_risk):
        print("🚀 LIVE TRADING STARTED")
        print(f"   Balance: ${balance}")
        print(f"   Leverage: {leverage}x")
        print(f"   Max Risk: {max_risk}%")
        print("=" * 50)
        
        iteration = 0
        while True:
            try:
                iteration += 1
                print(f"📊 Live trading iteration {iteration}")
                
                # Get real-time data
                market_data = self.get_realtime_data()
                if not market_data:
                    time.sleep(10)
                    continue
                
                print(f"   BTC Price: ${market_data['price']:,.2f}")
                
                # Use the SAME AI logic as backtest
                prediction = self.make_prediction(market_data)
                print(f"   AI Prediction: {prediction:.2%}")
                
                # Trading logic (same as backtest)
                if prediction > 0.7:  # Strong buy signal
                    print("   🟢 STRONG BUY SIGNAL")
                    # This would place a real order
                    # self.place_order("tBTCUSD", 0.001, market_data['price'])
                    
                elif prediction < 0.3:  # Strong sell signal
                    print("   🔴 STRONG SELL SIGNAL")
                    # This would place a real order
                    # self.place_order("tBTCUSD", -0.001, market_data['price'])
                
                else:
                    print("   🟡 HOLD - No strong signal")
                
                print("✅ Cycle completed")
                time.sleep(60)  # Check every minute
                
            except KeyboardInterrupt:
                print("\n🛑 Live trading stopped")
                break
            except Exception as e:
                print(f"⚠️ Error: {e}")
                time.sleep(30)

def main():
    parser = argparse.ArgumentParser(description='Live Trading Bot')
    parser.add_argument('--balance', type=float, required=True)
    parser.add_argument('--leverage', type=int, default=1)
    parser.add_argument('--max-risk', type=float, default=2)
    parser.add_argument('--user-id', required=True)
    
    args = parser.parse_args()
    
    api_key = os.environ.get('BITFINEX_PUBLIC_KEY')
    api_secret = os.environ.get('BITFINEX_SECRET_KEY')
    
    if not api_key or not api_secret:
        print("❌ API keys missing")
        sys.exit(1)
    
    trader = LiveTrader(api_key, api_secret)
    trader.run_live_trading(args.balance, args.leverage, args.max_risk)

if __name__ == "__main__":
    main()