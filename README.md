# Create README.md with proper formatting
cat > README.md << 'EOF'
# ZincBot - AI-Powered Crypto Trading Bot

A sophisticated algorithmic trading bot for cryptocurrency markets with backtesting and live trading capabilities.

## Features

- 🤖 **AI-Powered Trading**: Machine learning models for market prediction
- 📊 **Backtesting**: Historical performance simulation
- ⚡ **Live Trading**: Real-time trading execution
- 🔐 **Secure API Handling**: Encrypted API key storage
- 📈 **Real-time Monitoring**: Live bot status and logs
- 💹 **Multiple Strategies**: Support for various trading strategies

## Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Vite
- Shadcn UI Components

### Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT Authentication

### Trading Engine
- Python 3
- Scikit-learn
- Pandas, NumPy
- Bitfinex API

## Project Structure
ZincBot/
├── UI/ # React frontend
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── App.tsx # Main app component
│ │ └── ...
│ └── package.json
├── Backend-Bot/ # Python trading bot
│ ├── backtest.py # Backtesting script
│ ├── live_trading.py # Live trading script
│ └── utils.py # Utility functions
├── src/ # Node.js backend
│ ├── controllers/ # API controllers
│ ├── models/ # Database models
│ ├── routes/ # API routes
│ └── app.js # Express app
└── docker-compose.yml # Docker configuration





## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.8+

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/ZincBot.git
   cd ZincBot
   \`\`\`

2. **Start with Docker**
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

## Usage

1. **Register/Login**: Create an account or login
2. **Set API Keys**: Configure your Bitfinex API keys
3. **Backtest**: Test strategies with historical data
4. **Live Trading**: Start automated trading with real funds

## API Endpoints

- \`POST /api/v1/auth/register\` - User registration
- \`POST /api/v1/auth/login\` - User login
- \`POST /api/v1/user/keys\` - Save API keys
- \`POST /api/v1/backtest/start\` - Start backtest
- \`POST /api/v1/live/start\` - Start live trading

## Configuration

Environment variables are configured in \`docker-compose.yml\`:
- \`DATABASE_URL\`: PostgreSQL connection string
- \`JWT_SECRET\`: JWT token secret
- \`JWT_EXPIRE\`: JWT expiration time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

⚠️ **Trading involves significant risk**. This software is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses.
EOF
