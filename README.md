# Miden Arena

Premium frontend prototype for a private prediction market built around Miden.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Routes

- `/` Landing
- `/arena` Prediction Arena
- `/markets` Markets
- `/market/[id]` Market detail
- `/reputation` Reputation
- `/leaderboard` Leaderboard
- `/badges` Badges

This version is frontend-only with mock data and mock prediction interactions. Miden wallet, contracts, oracle/settlement and onchain reputation are intentionally left for the next layer.
