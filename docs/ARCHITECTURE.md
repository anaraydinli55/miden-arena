# Miden Arena: architecture

Zero-knowledge prediction markets on the Miden testnet (protocol 0.17, fee token USDCx).
Users hold tokens in Bread Wallet and bet by sending real notes to an escrow account.

## Components

| Part | Where | What it does |
| --- | --- | --- |
| Web app (Next.js) | Vercel | UI, bet intents, deposit verification, ledger, admin routes |
| Mint service (Rust, miden-client 0.17.3) | Render, private repo `miden-mint-service` | Holds the faucet and escrow keys, mints, verifies deposits, pays out |
| Ledger | Upstash Redis | Pools, stakes, history, leaderboard, resolution and payout state |
| Wallet | Bread Wallet (browser extension) | Signs the user's deposit and receives minted tokens and payouts |
| Chain | Miden testnet | Faucet accounts, escrow account, notes |

## Accounts (public IDs)

| Role | Account ID | Decimals |
| --- | --- | --- |
| ANR faucet | `0x7b9512fc7ffcd6d13e43d231bcf631` | 6 |
| SKS faucet | `0xa7e2026f54982e515a45493f1d71f3` | 6 |
| ELA faucet | `0x1f55b283069b45514676489c5e2c68` | 6 |
| Escrow wallet | `0x0a03259f03dd70d14e97a693450f9a` | |
| USDCx fee faucet (official) | `0x4cbdcaffe75f0a317482224dae6436` | 6 |

The private keys exist only in the mint service keystore. Nothing secret is stored in either repository.

## Flows

### Faucet
Site `POST /api/faucet` -> mint service `/mint` -> the faucet account signs a public P2ID note of 100 tokens -> Bread Wallet consumes it.
The amount is fixed on the server (100). A cooldown per token and address applies, plus 20 claims per hour per IP.

### Bet
1. `POST /api/bet/intent`: the server validates the market, side, token and a whole amount between 1 and 1000, then adds a random 1..9999 base-unit suffix so the deposit amount is unique, and stores the intent for 6 hours.
2. The browser sends exactly that amount from Bread Wallet to the escrow account as a public note.
3. `POST /api/bet/confirm`: the server asks the mint service (`/deposits/find`) whether the escrow received a note from that wallet with that token and amount. If so, it takes a `SET NX` lock on the note ID (a note is counted once), credits the pool and the stake index, and updates stats, history and the leaderboard.

Because the amount is unique per intent, nobody can bind someone else's deposit to a different market or side.
If the user closes the page before confirmation, a banner offers "Check now" for up to 6 hours.

### Resolve and pay out
Admin only (`ADMIN_SECRET`).
1. `POST /api/admin/resolve` with `dry_run: true` shows the plan. The real call closes the market, waits a moment for in-flight deposits, rebuilds the plan from the stake index and refuses to continue if the index does not match the pools.
2. `POST /api/admin/payout` with `step: "consume"` moves the escrow's pending notes into its vault, then `step: "pay"` sends the plan item by item as P2ID notes.
3. Pari-mutuel rule per token: winners share the whole pool of that token in proportion to their stake (rounded down, dust stays in escrow). If one side is empty, the winning side is empty, or the outcome is `VOID`, everyone is refunded.
4. Each payment is guarded by `payout:{market}:{token}:{wallet}` in Redis (`pending` then `done`). An ambiguous failure leaves `pending` and is never retried automatically.

## Redis keys

| Key | Purpose |
| --- | --- |
| `pools:{TOKEN}` (hash) | `{market}:yes` and `{market}:no` totals in base units |
| `stakes:{market}:{TOKEN}` (hash) | `{wallet}:yes` and `{wallet}:no` stakes in base units |
| `intent:{wallet}:{token}:{total}` | Open bet intent (6 h) |
| `deposit:{noteId}` | Lock: this deposit was counted |
| `credited:{wallet}:{token}:{total}` | Idempotent confirmation marker (24 h) |
| `user:{wallet}`, `history:{wallet}` | Stats and history (bets and payouts) |
| `leaderboard:xp`, `lb:users` | Leaderboard |
| `resolved:{market}`, `resolved:all` | Resolution state |
| `plan:{market}`, `payout:{market}:{token}:{wallet}` | Payout plan and per-payment state |
| `rl:*` | Rate limits |

Wallet keys are normalised: lower case, without the `_suffix` that Bread appends.

## Security model

- Secrets live only in environment variables and on the admin's machine (`~/.admin-secret`, `~/.mint-secret-prod`).
- Betting opens only when `BETS_LEDGER_OPEN=1`, Redis, the mint service URL and its secret are all configured.
- The legacy endpoints `/api/submit` and `/api/swap` return 410.
- Payout routes need the admin secret; the escrow endpoints of the mint service need the mint secret.

## Known limitations

- Test tokens only. Markets are resolved by hand (no oracle).
- The free Render plan sleeps after inactivity and has no persistent disk; the keystore is restored from `BOOTSTRAP_B64` on every start and accounts are re-imported from the chain.
- Stats are updated with read-modify-write, so two simultaneous confirmations for the same wallet could lose an update (pools and stakes use atomic increments and stay exact).
- If the testnet is reset, all accounts disappear (see `docs/OPERATIONS.md`).
