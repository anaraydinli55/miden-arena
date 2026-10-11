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

function extractTxHash(res: any): string | null {
  if (!res) return null;
  if (typeof res === 'string') return res.length >= 16 ? res : null;
  if (typeof res !== 'object') return null;
  for (const k of ['transactionHash', 'transactionId', 'txId', 'hash', 'id']) {
    const v = res[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return extractTxHash(res.result) ?? extractTxHash(res.transaction);
}

export async function sendViaBread(params: SendParams): Promise<string> {
  const provider = getBreadProvider();
  if (!provider) throw new Error('Bread Wallet provider bulunamadi. Eklenti kurulu ve acik mi?');

  const txObj = { ...params, noteType: 'public' as const };

  const direct = ['requestSend', 'requestSendTransaction', 'sendTransaction'].find(
    (m) => typeof provider[m] === 'function'
  );
  let call: (() => Promise<any>) | null = null;
  if (direct) call = () => provider[direct](txObj);
  else if (typeof provider.request === 'function')
    call = () => provider.request({ method: 'miden_sendTransaction', params: [txObj] });

  if (!call) {
    console.error('Bread provider anahtarlari:', Object.keys(provider));
    throw new Error('Bread Wallet icinde uygun gonderim metodu yok.');
  }

  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('Bread Wallet 120 sn icinde yanit vermedi.')), 120_000)
  );

  let res: any;
  try {
    res = await Promise.race([call(), timeout]);
  } catch (e: any) {
    console.error('[bread] hata:', e);
    throw new Error(e?.message || String(e) || 'Cuzdan istegi basarisiz');
  }

  if (
    res && typeof res === 'object' &&
    (res.error || res.success === false || (typeof res.status === 'string' && /fail|error|reject/i.test(res.status)))
  ) {
    throw new Error(res.error?.message || (typeof res.error === 'string' ? res.error : '') || 'Cuzdan islemi reddetti');
  }

  const txHash = extractTxHash(res);
  if (!txHash) {
    console.error('[bread] hash yok, yanit:', res);
    throw new Error('Cuzdan gercek bir islem hash dondurmedi, islem basarisiz.');
  }
  return txHash;
}
