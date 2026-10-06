import { NextResponse } from 'next/server';
import { PREDICTIONS_DATA } from '@/src/data/predictionsData';
import { redisCommand, recordBetToLiveMemory } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const liveData = await Promise.all(
      PREDICTIONS_DATA.map(async (item) => {
        const liveVol = await redisCommand('GET', `pred:${item.id}:volume`);
        const totalVolume = liveVol ? Number(liveVol) : 0;
        const updatedOutcomes = await Promise.all(
          item.outcomes.map(async (outcome) => {
            const pool = await redisCommand('GET', `pred:${item.id}:outcome:${outcome.value}`);
            return { ...outcome, poolAmount: pool ? Number(pool) : 0 };
          })
        );
        return { ...item, totalVolume, outcomes: updatedOutcomes };
      })
    );
    return NextResponse.json({ success: true, predictions: liveData });
  } catch (error) {
    console.error('Predictions GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { predictionId, outcomeValue, amount, tokenSymbol } = await req.json();
    if (!predictionId || !outcomeValue || !amount)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    await recordBetToLiveMemory(predictionId, outcomeValue, Number(amount), tokenSymbol || 'ANR');
    return NextResponse.json({ success: true, message: 'Bet recorded' });
  } catch (error) {
    console.error('Predictions POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record' }, { status: 500 });
  }
}
