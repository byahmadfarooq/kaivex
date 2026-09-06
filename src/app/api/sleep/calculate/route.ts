import { NextRequest, NextResponse } from 'next/server';
import { calculateSleepQuality } from '@/lib/sleep-calc';
import { DEFAULT_SLEEP_SETTINGS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sleep_time, wake_time, settings = DEFAULT_SLEEP_SETTINGS, naps = [] } = body;

    if (!sleep_time || !wake_time) {
      return NextResponse.json({ error: 'sleep_time and wake_time are required' }, { status: 400 });
    }

    const breakdown = calculateSleepQuality(sleep_time, wake_time, settings, naps);
    return NextResponse.json({ success: true, breakdown });
  } catch (err) {
    console.error('Sleep calculate error:', err);
    return NextResponse.json({ error: 'Failed to calculate sleep quality' }, { status: 500 });
  }
}