import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_USER_ID, DEFAULT_HABITS, DEFAULT_PIPELINE_STAGES, DEFAULT_SLEEP_SETTINGS } from '@/lib/constants';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const filename = `kaivex-export-${today}.json`;

  try {
    let exportData: Record<string, unknown> = {};

    if (isSupabaseConfigured() && supabaseAdmin) {
      const [
        habitsRes,
        logsRes,
        sleepRes,
        napsRes,
        settingsRes,
        runsRes,
        stagesRes,
        contactsRes,
        tasksRes,
        dailyLogsRes,
        dailySummariesRes,
      ] = await Promise.all([
        supabaseAdmin.from('habits').select('*'),
        supabaseAdmin.from('habit_logs').select('*'),
        supabaseAdmin.from('sleep_entries').select('*'),
        supabaseAdmin.from('nap_entries').select('*'),
        supabaseAdmin.from('sleep_settings').select('*'),
        supabaseAdmin.from('runs').select('*'),
        supabaseAdmin.from('pipeline_stages').select('*'),
        supabaseAdmin.from('pipeline_contacts').select('*'),
        supabaseAdmin.from('tasks').select('*'),
        supabaseAdmin.from('daily_logs').select('*'),
        supabaseAdmin.from('daily_summaries').select('*'),
      ]);

      exportData = {
        exported_at: new Date().toISOString(),
        user_id: DEFAULT_USER_ID,
        habits: habitsRes.data || [],
        habit_logs: logsRes.data || [],
        sleep_entries: sleepRes.data || [],
        nap_entries: napsRes.data || [],
        sleep_settings: settingsRes.data || [DEFAULT_SLEEP_SETTINGS],
        runs: runsRes.data || [],
        pipeline_stages: stagesRes.data || DEFAULT_PIPELINE_STAGES,
        pipeline_contacts: contactsRes.data || [],
        tasks: tasksRes.data || [],
        daily_logs: dailyLogsRes.data || [],
        daily_summaries: dailySummariesRes.data || [],
      };
    } else {
      exportData = {
        exported_at: new Date().toISOString(),
        user_id: DEFAULT_USER_ID,
        habits: DEFAULT_HABITS,
        habit_logs: [],
        sleep_entries: [],
        nap_entries: [],
        sleep_settings: [DEFAULT_SLEEP_SETTINGS],
        runs: [],
        pipeline_stages: DEFAULT_PIPELINE_STAGES,
        pipeline_contacts: [],
        tasks: [],
        daily_logs: [],
        daily_summaries: [],
      };
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}