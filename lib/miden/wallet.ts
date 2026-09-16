/*
 * Miden wallet integration boundary.
 *
 * The application must use the official Miden wallet/SDK implementation
 * here once the exact browser wallet API is selected.
 */

export type MidenWallet = {
  address: string;
  balance: string;
  network: string;
};

export type MidenTransactionRequest = {
  marketId: string;
  position: "YES" | "NO";
  amount: string;
};

export async function connectMidenWallet(): Promise<MidenWallet> {
  throw new Error(
    "Miden wallet adapter is not configured yet. Connect the official Miden wallet SDK here."
  );
}

export async function sendMidenTransaction(
  request: MidenTransactionRequest
) {
  console.log("Miden transaction request", request);

  throw new Error(
    "Miden transaction adapter is not configured yet."
  );
}
