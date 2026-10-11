export const FEE_TOKEN = {
  symbol: 'USDCX',
  faucetId: '0x4cbdcaffe75f0a317482224dae6436',
  decimals: 6, // faucet metadata'sindan dogrulayin
} as const;

export const FEE_FAUCET_URL = 'https://faucet.testnet.miden.io/';
export const FEE_REQUEST_AMOUNT = 10; // faucet'ten istenecek USDCX

// Testnet reset olduysa bu ID'ler zincirde yoktur; yeniden deploy edip burayi guncelleyin.
export const CLAIM_TOKENS = {
  ANR: { symbol: 'ANR', faucetId: '0xb7326fab564eef51689d3d52d464ce', decimals: 6, amount: 100 },
  ELA: { symbol: 'ELA', faucetId: '0x332754bb94b4b5b115acadbb844c8c', decimals: 6, amount: 100 },
} as const;

export type ClaimTokenKey = keyof typeof CLAIM_TOKENS;

export const SWAP_VAULT_CONTRACT_ID = '0xc05fa91f939040d1751dc990cb2dde';
export const ANR_LOGO_URL =
  'https://raw.githubusercontent.com/anaraydinli55/miden-arena/main/Gemini_Generated_Image_sa45oasa45oasa45.jpg';

// --- Bahis (escrow) konfiqurasiyasi ----------------------------------------
// Escrow hesabi ve SKS faucet ID'si yeni deploydan sonra env'de verilir.
export const ESCROW_ACCOUNT_ID = process.env.NEXT_PUBLIC_ESCROW_ACCOUNT_ID ?? '';

export const BET_TOKENS: Record<'ELA' | 'ANR' | 'SKS', string> = {
  ELA: CLAIM_TOKENS.ELA.faucetId,
  ANR: CLAIM_TOKENS.ANR.faucetId,
  SKS: process.env.NEXT_PUBLIC_SKS_FAUCET_ID ?? '',
};
