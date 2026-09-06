import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { Run } from '@/types';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ runs: [], warning: 'No database configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('runs')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('date', { ascending: false });

    if (error) {
      console.error('API GET /api/runs error:', error);
      return NextResponse.json({ runs: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs: data || [] });
  } catch (err: any) {
    console.error('API GET /api/runs catch:', err);
    return NextResponse.json({ runs: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const run: Run = {
      id: body.id || crypto.randomUUID(),
      user_id: DEFAULT_USER_ID,
      date: body.date,
      distance_km: Number(body.distance_km),
      duration_minutes: Number(body.duration_minutes),
      pace: body.pace || '5:00',
      source: 'manual',
      strava_activity_id: null,
      notes: body.notes || null,
      created_at: body.created_at || new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('runs')
        .upsert(run)
        .select()
        .single();

      if (error) {
        console.error('API POST /api/runs supabase error:', error);
        return NextResponse.json({ error: error.message, run }, { status: 500 });
      }

      return NextResponse.json({ run: data });
    }

    return NextResponse.json({ run });
  } catch (err: any) {
    console.error('API POST /api/runs catch:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing run id' }, { status: 400 });
    }

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('runs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('API DELETE /api/runs error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('API DELETE /api/runs catch:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
