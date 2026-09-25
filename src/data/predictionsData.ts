export interface OutcomeOption {
  label: string;
  value: string;
  color?: string;
  poolAmount: number; // 0-dan başlayır (Real on-chain depozitlər)
}

export interface PredictionItem {
  id: string;
  title: string;
  category: 'Market' | 'Arena';
  subCategory: 'Crypto' | 'Economy' | 'Sports' | 'E-Sports' | 'Entertainment';
  status: 'Active' | 'Resolved' | 'Closed';
  isBoosted: boolean;
  endDate: string; // ISO Format (Real Tarix)
  tokenSymbol: 'ELA' | 'ANR';
  totalVolume: number; // 0 ELA / 0 ANR (Mock rəqəm YOXDUR)
  outcomes: OutcomeOption[];
  image: string;
  description: string;
}

// Canlı Gerisayım Hesablayıcı (Heç bir statik/mock vaxt yoxdur)
export const getTimeRemaining = (endDateStr: string): string => {
  const total = Date.parse(endDateStr) - Date.now();
  if (total <= 0) return 'Ended';

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);

  return `${days}d : ${hours}h : ${minutes}m`;
};

// Faizləri real hovuz miqdarına görə dinamik hesablayır (Başlanğıcda 50/50 neytral)
export const calculateProbability = (outcomes: OutcomeOption[], totalVolume: number): number => {
  if (totalVolume === 0 || outcomes.length < 2) return 50;
  return Math.round((outcomes[0].poolAmount / totalVolume) * 100);
};

export const PREDICTIONS_DATA: PredictionItem[] = [
  // =================================================================
  // 🏪 MARKET KATEQORİYASI (Token: ELA & ANR | Bütün Həcmlər = 0)
  // =================================================================

  // --- 📅 10 Oktyabr 2026 Hədəfləri ---
  {
    id: 'mkt-uni-10k',
    title: 'Will Uniswap (UNI) hit $10 by October 10, 2026?',
    category: 'Market',
    subCategory: 'Crypto',
    status: 'Active',
    isBoosted: true,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    description: 'Resolves to YES if Uniswap (UNI) touches or exceeds $10.00 on major exchanges before Oct 10, 2026 UTC.',
  },
  {
    id: 'mkt-btc-80k',
    title: 'Will Bitcoin close above $80,000 on October 10, 2026?',
    category: 'Market',
    subCategory: 'Crypto',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    description: 'Resolves to YES if BTC/USD daily candle closes strictly above $80,000 on Oct 10, 2026 23:59 UTC.',
  },
  {
    id: 'mkt-morpho-3',
    title: 'Will Morpho (MORPHO) hit $3 by October 10, 2026?',
    category: 'Market',
    subCategory: 'Crypto',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/morpho-morpho-logo.png',
    description: 'Resolves to YES if MORPHO reaches or surpasses $3.00 on spot markets before Oct 10.',
  },
  {
    id: 'mkt-total-3t',
    title: 'Will total crypto market cap hit $3 trillion before October 10, 2026?',
    category: 'Market',
    subCategory: 'Crypto',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    description: 'Based on CoinGecko global total crypto market capitalization metric.',
  },

  // --- 📅 Oktyabrın Sonu (31 Oktyabr 2026) ---
  {
    id: 'mkt-gold-4500',
    title: 'Will gold hit US$4,500/oz by end of October 2026?',
    category: 'Market',
    subCategory: 'Economy',
    status: 'Active',
    isBoosted: true,
    endDate: '2026-10-31T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    description: 'Resolves to YES if Gold Spot (XAU/USD) trades at or above $4,500 before Oct 31, 2026.',
  },
  {
    id: 'mkt-ltc-120',
    title: 'Will Litecoin (LTC) close above $120 by end of October 2026?',
    category: 'Market',
    subCategory: 'Crypto',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-31T23:59:59Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
    description: 'Resolves to YES if LTC daily close is higher than $120.00 in October 2026.',
  },
  {
    id: 'mkt-nvda-hf',
    title: 'Will NVIDIA complete its acquisition of Hugging Face by Oct 31, 2026?',
    category: 'Market',
    subCategory: 'Economy',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-31T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cryptologos.cc/logos/nvidia-logo.png',
    description: 'Resolves to YES upon signed regulatory or SEC filing confirming formal completion.',
  },

  // =================================================================
  // ⚔️ ARENA KATEQORİYASI (Token: ANR & ELA | Bütün Həcmlər = 0)
  // =================================================================

  // --- 📅 10 Oktyabr 2026 Hədəfləri ---
  {
    id: 'arn-liv-top3',
    title: 'Will Liverpool be in the Premier League Top 3 on October 10, 2026?',
    category: 'Arena',
    subCategory: 'Sports',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    description: 'Based on official Premier League standings table as of Oct 10 matchday.',
  },
  {
    id: 'arn-lol-worlds',
    title: 'Will an LCS or LEC team advance to LoL Worlds Semifinals by Oct 10?',
    category: 'Arena',
    subCategory: 'E-Sports',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-10T23:59:59Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/LoL_icon.svg',
    description: 'Resolves to YES if any Western (LCS/LEC) esports team qualifies for semifinals.',
  },

  // --- 📅 Oktyabrın Sonu (25-31 Oktyabr 2026) ---
  {
    id: 'arn-clasico-oct25',
    title: 'El Clásico (Oct 25, 2026): Real Madrid, Barcelona, or Draw?',
    category: 'Arena',
    subCategory: 'Sports',
    status: 'Active',
    isBoosted: true,
    endDate: '2026-10-25T21:00:00Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Real Madrid', value: 'REAL_MADRID', color: '#3B82F6', poolAmount: 0 },
      { label: 'Barcelona', value: 'BARCELONA', color: '#9333EA', poolAmount: 0 },
      { label: 'Draw', value: 'DRAW', color: '#F59E0B', poolAmount: 0 },
    ],
    image: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    description: 'Official La Liga fixture match outcome at Santiago Bernabéu on Oct 25, 2026.',
  },
  {
    id: 'arn-mancity-oct31',
    title: 'Will Manchester City lead the Premier League table on October 31, 2026?',
    category: 'Arena',
    subCategory: 'Sports',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-31T23:59:59Z',
    tokenSymbol: 'ANR',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    description: 'Resolves to YES if Man City holds 1st position after final October match fixtures.',
  },
  {
    id: 'arn-anime-oct31',
    title: 'Will Witch Hat Atelier be the #1 most-watched anime premiere by Oct 31, 2026?',
    category: 'Arena',
    subCategory: 'Entertainment',
    status: 'Active',
    isBoosted: false,
    endDate: '2026-10-31T23:59:59Z',
    tokenSymbol: 'ELA',
    totalVolume: 0,
    outcomes: [
      { label: 'Yes', value: 'YES', color: '#10B981', poolAmount: 0 },
      { label: 'No', value: 'NO', color: '#EF4444', poolAmount: 0 },
    ],
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    description: 'Based on verified weekly fall ranking metrics across streaming platforms.',
  }
];
