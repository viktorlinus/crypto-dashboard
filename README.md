# Crypto Dashboard

A real-time cryptocurrency dashboard built with Next.js, TypeScript, and Supabase. This application fetches and displays data for various cryptocurrencies, allowing users to analyze and compare different coins.

## Features

- **Real-time Cryptocurrency Data**: Displays prices, market caps, and trading volumes
- **Interactive Charts**: Using Chart.js and react-chartjs-2 with multiple Y-axes
- **Multiple Coin Selection**: Compare up to 5 different cryptocurrencies
- **Customizable Time Ranges**: 7D, 1M, 3M, 6M, 1Y, and All options
- **Different Data Views**: Toggle between prices, market caps, and volumes
- **Logarithmic Scale Toggle**: For comparing coins with large price differences
- **Statistics Cards**: Shows current values and percentage changes
- **Y-Axis Visualization Modes**: Switch between multiple and single Y-axis modes
- **Historical Coin Tracking**: Keep tracking coins even after they fall out of the top 100
- **Metrics Workbench**: Build custom metrics using formulas

## Tech Stack

- **Frontend**: React with TypeScript, Next.js
- **Styling**: Tailwind CSS
- **Data Visualization**: Chart.js
- **Data Storage**: Supabase
- **API Integration**: Using CoinGecko API

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.7+ (for the data fetching script)
- Supabase account
- CoinGecko API key (Pro account required)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crypto-dashboard.git
   cd crypto-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   COINGECKO_API_KEY=your-coingecko-api-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. To fetch current cryptocurrency data:
   ```bash
   python top100_supabase.py
   ```

## Database Setup

The project requires the following tables in your Supabase database:
- `crypto_prices`: Stores price data for each cryptocurrency
- `crypto_market_caps`: Stores market cap data
- `crypto_volumes`: Stores volume data
- `tracked_coins`: Tracks information about coins being monitored
- `crypto_rankings`: Stores daily rankings of cryptocurrencies

## Deployment

This project is configured for easy deployment to Netlify:

1. Connect your GitHub repository to Netlify
2. Set up the environment variables in Netlify's dashboard
3. Deploy using the default settings

## License

[MIT](LICENSE)

## Acknowledgements

- Data provided by [CoinGecko](https://www.coingecko.com/)
- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.io/)
