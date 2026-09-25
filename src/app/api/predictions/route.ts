import { NextResponse } from 'next/server';
import { PREDICTIONS_DATA } from '@/data/predictionsData';
import { redisCommand, recordBetToLiveMemory } from '@/lib/redis';

// 1. GET: Bütün canlı hovuzları Upstash Redis-dən çəkir
export async function GET() {
  try {
    const liveData = await Promise.all(
      PREDICTIONS_DATA.map(async (item) => {
        const liveVol = await redisCommand('GET', `pred:${item.id}:volume`);
        const totalVolume = liveVol ? Number(liveVol) : 0;

        // Hər bir variantın real hovuzunu oxuyuruq
        const updatedOutcomes = await Promise.all(
          item.outcomes.map(async (outcome) => {
            const outcomePool = await redisCommand('GET', `pred:${item.id}:outcome:${outcome.value}`);
            return {
              ...outcome,
              poolAmount: outcomePool ? Number(outcomePool) : 0,
            };
          })
        );

        return {
          ...item,
          totalVolume,
          outcomes: updatedOutcomes,
        };
      })
    );

    return NextResponse.json({ success: true, predictions: liveData });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch live memory' }, { status: 500 });
  }
}

// 2. POST: Yeni mərc ediləndə canlı yaddaşa yazır
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { predictionId, outcomeValue, amount, tokenSymbol } = body;

    if (!predictionId || !outcomeValue || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await recordBetToLiveMemory(predictionId, outcomeValue, Number(amount), tokenSymbol || 'ELA');

    return NextResponse.json({ success: true, message: 'Bet recorded in live memory' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update live memory' }, { status: 500 });
  }
}
