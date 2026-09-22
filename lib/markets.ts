export interface MarketMeta {
  id: string;
  category: 'Miden ZK' | 'Crypto' | 'Economy' | 'AI & Tech';
  title: string;
  icon: string;
  tokenSymbol: string;
  expiresAt: number; // Unix timestamp (ms)
}

// Real son tarixləri ilə təyin olunmuş rəsmi bazarlar
export const OFFICIAL_MARKETS: MarketMeta[] = [
  {
    id: 'miden-mainnet-q4',
    category: 'Miden ZK',
    title: 'Will Polygon Miden Mainnet launch before Q4 2026 ends?',
    icon: '⚡',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-31T23:59:59Z').getTime(),
  },
  {
    id: 'miden-zk-dex',
    category: 'Miden ZK',
    title: 'Will a Confidential ZK-DEX launch on Miden Testnet?',
    icon: '🛡️',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-11-15T23:59:59Z').getTime(),
  },
  {
    id: 'btc-120k',
    category: 'Crypto',
    title: 'Will Bitcoin (BTC) reach a new All-Time High above $120,000 in 2026?',
    icon: '₿',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-31T23:59:59Z').getTime(),
  },
  {
    id: 'eth-pos-ratio',
    category: 'Crypto',
    title: 'Will Ethereum Staking Ratio exceed 35% of total supply?',
    icon: '🔷',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-10-31T23:59:59Z').getTime(),
  },
  {
    id: 'gold-4500-ath',
    category: 'Economy',
    title: 'Will Gold spot price exceed US$4,500/oz in 2026?',
    icon: '🪙',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-11-30T23:59:59Z').getTime(),
  },
  {
    id: 'ai-agents-zkvm',
    category: 'AI & Tech',
    title: 'Will autonomous AI agents execute over 1M txs on zkVM chains?',
    icon: '🤖',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-15T23:59:59Z').getTime(),
  },
];
