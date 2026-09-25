const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redisCommand(command: string, ...args: (string | number)[]) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn("⚠️ Upstash Redis keys are missing in .env.local");
    return null;
  }

  try {
    const formattedArgs = args.map(arg => encodeURIComponent(String(arg))).join('/');
    const res = await fetch(`${UPSTASH_URL}/${command}/${formattedArgs}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error("Redis command error:", error);
    return null;
  }
}

// Bütün proqnozların canlı həcmini gətirir
export async function getLiveMarketPool(predictionId: string) {
  const totalVolume = await redisCommand('GET', `pred:${predictionId}:volume`) || 0;
  return Number(totalVolume);
}

// Yeni mərc ediləndə canlı yaddaşda həcmi artırır
export async function recordBetToLiveMemory(
  predictionId: string,
  outcomeValue: string,
  amount: number,
  tokenSymbol: string
) {
  // 1. Ümumi həcmi artırırıq
  await redisCommand('INCRBYFLOAT', `pred:${predictionId}:volume`, amount);
  // 2. Xüsusi variantın (Yes/No/Real Madrid və s.) hovuzunu artırırıq
  await redisCommand('INCRBYFLOAT', `pred:${predictionId}:outcome:${outcomeValue}`, amount);
  // 3. Son edilən mərclər jurnalına qeyd edirik
  await redisCommand('LPUSH', `pred:${predictionId}:recent_bets`, JSON.stringify({
    outcome: outcomeValue,
    amount,
    token: tokenSymbol,
    timestamp: Date.now()
  }));
}
