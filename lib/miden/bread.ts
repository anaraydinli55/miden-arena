export function getBreadProvider(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.bread || w.miden || w.midenWallet || null;
}

export type SendParams = {
  senderAddress: string;
  recipientAddress: string;
  faucetId: string;
  amount: number;
};

export async function sendViaBread(params: SendParams): Promise<string> {
  const provider = getBreadProvider();
  if (!provider) throw new Error('Bread Wallet provider bulunamadi. Eklenti kurulu ve acik mi?');

  const method = ['requestSend', 'requestSendTransaction', 'sendTransaction'].find(
    (m) => typeof provider[m] === 'function'
  );
  if (!method) {
    console.error('Bread provider anahtarlari:', Object.keys(provider));
    throw new Error('Bread Wallet icinde uygun gonderim metodu yok (requestSend/requestSendTransaction/sendTransaction).');
  }

  const txObj = { ...params, noteType: 'public' as const };
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('Bread Wallet 120 sn icinde yanit vermedi.')), 120_000)
  );

  let res: any;
  try {
    res = await Promise.race([provider[method](txObj), timeout]);
  } catch (e: any) {
    console.error(`[bread.${method}] hata:`, e);
    throw new Error(e?.message || String(e) || 'Cuzdan istegi basarisiz');
  }

  const txHash = res?.transactionId || res?.hash;
  if (!txHash) throw new Error('Cuzdan gercek bir islem hash dondurmedi, islem basarisiz.');
  return txHash;
}
