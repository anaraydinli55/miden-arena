export const FEE_TOKEN = {
  symbol: 'USDCX',
  faucetId: '0x4cbdcaffe75f0a317482224dae6436',
  decimals: 6,
} as const;

export const FEE_FAUCET_URL = 'https://faucet.testnet.miden.io/';
export const FEE_REQUEST_AMOUNT = 10; // USDCX to request from the official faucet

// Faucets deployed on the 0.17 testnet. If the testnet is reset again these IDs disappear
// from the chain: redeploy the faucets and update them here.
export const CLAIM_TOKENS = {
  ANR: { symbol: 'ANR', faucetId: '0x7b9512fc7ffcd6d13e43d231bcf631', decimals: 6, amount: 100 },
  SKS: { symbol: 'SKS', faucetId: '0xa7e2026f54982e515a45493f1d71f3', decimals: 6, amount: 100 },
  ELA: { symbol: 'ELA', faucetId: '0x1f55b283069b45514676489c5e2c68', decimals: 6, amount: 100 },
} as const;

export type ClaimTokenKey = keyof typeof CLAIM_TOKENS;

export const ANR_LOGO_URL =
  'https://raw.githubusercontent.com/anaraydinli55/miden-arena/main/Gemini_Generated_Image_sa45oasa45oasa45.jpg';

// --- Betting (escrow) configuration ---------------------------------------
// The escrow account comes from the environment; betting stays closed while it is empty.
export const ESCROW_ACCOUNT_ID = process.env.NEXT_PUBLIC_ESCROW_ACCOUNT_ID ?? '';

export const BET_TOKENS: Record<'ELA' | 'ANR' | 'SKS', string> = {
  ELA: CLAIM_TOKENS.ELA.faucetId,
  ANR: CLAIM_TOKENS.ANR.faucetId,
  SKS: CLAIM_TOKENS.SKS.faucetId,
};
