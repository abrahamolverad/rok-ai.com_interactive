# RokAi Interactive Website

This repository contains the code for the RokAi interactive website, featuring 3D elements, dynamic scrolling animations, and AI-responsive content.

## Technologies Used

- **Next.js**: React framework with server-side rendering
- **TypeScript**: For type safety and improved developer experience
- **Three.js/React Three Fiber**: For 3D rendering and interactive elements
- **GSAP**: For advanced animations and transitions
- **Tailwind CSS**: For utility-first styling
- **MongoDB/Mongoose**: For database functionality
- **Lenis**: For smooth scrolling

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- MongoDB (local or remote)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/rokai-interactive.git
cd rokai-interactive
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: React components including 3D elements
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions and state management
- `/src/models`: MongoDB models

## Deployment

The website is configured for deployment on Render. Connect your GitHub repository to Render and set the following:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: Add the same variables as in `.env.production`

## Features

- Interactive 3D navigation experience
- Dynamic scrolling transformations
- AI-responsive content
- Smooth animations and transitions
- Responsive design for all devices
- Contact form with MongoDB integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Utilities

### Merging Alpaca Trades

`src/lib/merge_filled_trades.py` fetches the last 30 days of filled orders from the Alpaca API and matches them with JSONL logs written by the trading bot. Set `APCA_API_KEY_ID`, `APCA_API_SECRET_KEY`, and optionally `APCA_API_BASE_URL` in your environment. When run on Windows it creates `filled_trades_merged.csv` next to `genie_top3_v3_tradelog.jsonl`.

# Test commit to force Render update

