export interface MarketMeta {
  id: string;
  category: 'Miden ZK' | 'Crypto' | 'Economy' | 'AI & Tech';
  title: string;
  icon: string;
  tokenSymbol: string;
  expiresAt: number;
}

export const OFFICIAL_MARKETS: MarketMeta[] = [
  {
    id: 'miden-mainnet-q4',
    category: 'Miden ZK',
    title: 'Will Miden Mainnet launch before Q4 2026 ends?',
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
    id: 'uni-10-oct',
    category: 'Crypto',
    title: 'Will Uniswap (UNI) hit $10 by October 10, 2026?',
    icon: '🦄',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-10-10T23:59:59Z').getTime(),
  },
  {
    id: 'ltc-100-dec',
    category: 'Crypto',
    title: 'Will Litecoin (LTC) close above $100 on any UTC day before Dec 2026?',
    icon: '🪙',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-01T23:59:59Z').getTime(),
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
    id: 'sol-300-ath',
    category: 'Crypto',
    title: 'Will Solana (SOL) break $300 before November 2026?',
    icon: '🟣',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-11-01T23:59:59Z').getTime(),
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
    title: 'Will Gold spot price exceed US$4,500/oz by end of 2026?',
    icon: '🥇',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-11-30T23:59:59Z').getTime(),
  },
  {
    id: 'usdc-miden-native',
    category: 'Miden ZK',
    title: 'Will Native USDC deploy directly on Miden zkVM?',
    icon: '💵',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-20T23:59:59Z').getTime(),
  },
  {
    id: 'ai-agents-zkvm',
    category: 'AI & Tech',
    title: 'Will autonomous AI agents execute over 1M txs on zkVM chains?',
    icon: '🤖',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-15T23:59:59Z').getTime(),
  },
  {
    id: 'nvidia-ai-revenue',
    category: 'AI & Tech',
    title: 'Will Nvidia AI data center revenue surpass $50B in a single quarter?',
    icon: '🖥️',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-11-25T23:59:59Z').getTime(),
  },
  {
    id: 'stablecoin-300b',
    category: 'Economy',
    title: 'Will total global stablecoin market cap reach $300 Billion?',
    icon: '🏛️',
    tokenSymbol: 'ANR',
    expiresAt: new Date('2026-12-31T23:59:59Z').getTime(),
  },
];
