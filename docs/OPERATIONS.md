# Miden Arena: operations runbook

## Environment variables

Vercel (production):

| Variable | Notes |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Ledger |
| `MINT_SERVICE_URL` | e.g. `https://miden-mint-service.onrender.com`, no trailing slash |
| `MINT_SERVICE_SECRET` | Must equal `MINT_SECRET` on Render (secret) |
| `ADMIN_SECRET` | At least 24 characters (secret) |
| `BETS_LEDGER_OPEN` | `1` opens betting |
| `NEXT_PUBLIC_ESCROW_ACCOUNT_ID` | Escrow account ID (public, baked in at build time: redeploy after changing) |

Render (mint service):

| Variable | Notes |
| --- | --- |
| `MINT_SECRET` | At least 24 characters (secret) |
| `BOOTSTRAP_B64` | Keystore and `deployed.json` bundle (secret), or a secret file `bootstrap.b64` |
| `MINT_COOLDOWN_SECS` | Default 3600 per token and address |

## Health checks

```bash
curl -s https://miden-mint-service.onrender.com/health
curl -s https://miden-mint-service.onrender.com/status -H "Authorization: Bearer $(cat ~/.mint-secret-prod)"
set -a; . ./.env.local; set +a; python3 scripts/reconcile.py --consume
```

`reconcile.py` compares the escrow vault with the stakes of open markets. A difference of 0 (or a few base units of dust) is healthy.
Negative means unconsumed notes, positive means a deposit without a ledger record.
Monitor `/health` (not `/`) with an uptime service so the free Render instance stays awake.

## Resolving a market

```bash
scripts/resolve_market.sh <market_id> <YES|NO|VOID>
```

It prints a dry-run plan, asks for `yes`, resolves, consumes pending notes and pays every item.
If a payment is left `pending` (the service did not answer in time), do not resend blindly: check Bread or the explorer first.
Only if the note was not created, call `/api/admin/payout` again with `"retry_pending": true`.
After payouts, run `scripts/reconcile.py`.

## Markets

Markets are defined in `lib/markets.ts`.
- Changing an expiry date or title is safe.
- Never rename the `id` of a market that already has stakes (pools, stakes and payouts are keyed by it).
- Expired markets stay visible for 14 days as "Closed: awaiting result".

## Repairing the stake index

`scripts/rebuild_stakes.py` rebuilds `stakes:*` from the verified deposit history (idempotent) and compares it with the pools.

## Fee fuel (USDCx)

Every account pays its own fees in USDCx (about 0.0001-0.0002 per transaction). To top up, request USDCx for the account's address at https://faucet.testnet.miden.io (public note):

| Account | Address |
| --- | --- |
| ANR faucet | `mtst1apae2yhu0l7dd5f7g0frr08kxy9xh69p` |
| SKS faucet | `mtst1azn7yqn02jvzu526g4yn78t37vpawkrq` |
| ELA faucet | `mtst1aq04tv5rq6d5252xweyfch3vdq0fsq8v` |
| Escrow | `mtst1aq9qxfvlq0whp52wj7nfx3g0ngu6m28w` |

## Rotating secrets

- Mint secret: set the same new value as `MINT_SECRET` (Render) and `MINT_SERVICE_SECRET` (Vercel), then redeploy Vercel.
- Admin secret: set `ADMIN_SECRET` (Vercel), redeploy, update `~/.admin-secret` on the admin machine.

## Keystore backup

The faucet and escrow keys exist only in `data-run1/keystore` of the mint service project and in `BOOTSTRAP_B64`. Keep an encrypted offline copy:

```bash
tar czf miden-keys-backup.tgz -C data-run1 keystore deployed.json
```

Without the keys the faucets and the escrow can never be used again.

## Deploying

- Web app: push to `main`, Vercel builds. Variables starting with `NEXT_PUBLIC_` need a redeploy after a change.
- Mint service: push to `main` of `miden-mint-service`, Render rebuilds (10-20 minutes). Restarting wipes the disk; the keystore is restored and the accounts are re-imported from the chain at boot.

## If the testnet is reset

All accounts and notes disappear.
1. In `miden-mint-service`, run `cargo run --release --bin provision -- data-new` (creates the three faucets and the escrow; request USDCx for each address from the official faucet when asked).
2. Put the new IDs into `lib/miden/tokens.ts`, `docs/` and `NEXT_PUBLIC_ESCROW_ACCOUNT_ID`.
3. Build a new bundle from `data-new` and set `BOOTSTRAP_B64` on Render.
4. Clear the old ledger keys in Redis (`pools:*`, `stakes:*`, `user:*`, `history:*`, `lb:users`, `leaderboard:xp`, `resolved:*`, `plan:*`, `payout:*`) and redeploy.

## Admin tools (`scripts/`)

| Script | Purpose |
| --- | --- |
| `resolve_market.sh <market> <YES\|NO\|VOID>` | Dry run, confirmation, resolve, pay. Warns when the plan is empty (an empty plan only closes the market) |
| `admin_payout.py <market>` | Consume and pay only; use it to resume after an interruption |
| `dry_run_check.py [market]` | Checks a dry-run plan and recomputes every winner's payout from the stake index |
| `reconcile.py [--consume]` | Escrow vault versus the stakes of open markets |
| `markets_overview.py` | Pools per market and token, number of wallets, resolved state |
| `rebuild_stakes.py` | Rebuilds the stake index from the verified deposit history |
| `reopen_empty_market.py <market>` | Reopens a market resolved by mistake; refuses if it has any data |

## Payout rounding

Each payout is rounded down. The leftover dust (at most one base unit per winner) stays in the escrow, so `reconcile.py` can show a difference of a few base units after a payout.

## Testing payouts

Resolving a market closes it for good. To test a payout, add a temporary market to `lib/markets.ts` (use a new id), place the bets on that market, run the dry run first and remove the entry afterwards.
Always read the dry run before confirming: a split needs at least two wallets on the winning side to show proportional shares.

## Moving a market date

`scripts/move_market_date.py <market_id> <YYYY-MM-DD> [--replace "old" "new"] [--allow-staked]` changes the expiry (and optionally a phrase in the title).
It refuses resolved markets and markets with stakes unless `--allow-staked` is given; for a market with real bettors, resolve it and add a new market with a new id instead.
