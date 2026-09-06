import { Habit, HabitLog, SleepEntry, NapEntry, Run, PipelineContact, Task } from '../types/index';
import { DEFAULT_USER_ID, DEFAULT_HABITS, DEFAULT_PIPELINE_STAGES } from './constants';
import { calculateSleepQuality } from './sleep-calc';
import { DEFAULT_SLEEP_SETTINGS } from './constants';
import { format, subDays } from 'date-fns';

export function generateSampleData() {
  const today = new Date();
  const dateStr = (offset: number) => format(subDays(today, offset), 'yyyy-MM-dd');

  // 1. Habit Logs for last 14 days
  const sampleHabitLogs: HabitLog[] = [];
  const habits = DEFAULT_HABITS;

  for (let d = 0; d < 14; d++) {
    const curDate = dateStr(d);
    habits.forEach((habit) => {
      let value = 0;
      if (habit.type === 'boolean') {
        value = (d % 7 !== 3) ? 1 : 0;
      } else if (habit.type === 'counter') {
        if (habit.name.includes('Comments')) {
          value = 5 + (d % 4);
        } else if (habit.name.includes('Connection Requests')) {
          value = 18 + (d % 6);
        } else if (habit.name.includes('Conversations')) {
          value = 4 + (d % 3);
        } else {
          value = habit.target_value ?? 1;
        }
      }
      sampleHabitLogs.push({
        id: `sample-log-${habit.id}-${curDate}`,
        habit_id: habit.id,
        date: curDate,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  // 2. Sleep Entries & Naps for last 14 days
  const sampleSleepEntries: SleepEntry[] = [];
  const sampleNaps: NapEntry[] = [];

  for (let d = 0; d < 14; d++) {
    const curDate = dateStr(d);
    const prevDate = dateStr(d + 1);

    const sleepHour = 22;
    const sleepMin = (d * 5) % 30;
    const wakeHour = 5;
    const wakeMin = (d * 7) % 30;

    const sleepTimeIso = `${prevDate}T${String(sleepHour).padStart(2, '0')}:${String(sleepMin).padStart(2, '0')}:00`;
    const wakeTimeIso = `${curDate}T0${wakeHour}:${String(wakeMin).padStart(2, '0')}:00`;

    const dayNaps: NapEntry[] = [];
    if (d % 4 === 1) {
      const napStart = `${curDate}T13:30:00`;
      const napEnd = `${curDate}T14:15:00`;
      const nap: NapEntry = {
        id: `sample-nap-${curDate}`,
        user_id: DEFAULT_USER_ID,
        date: curDate,
        start_time: napStart,
        end_time: napEnd,
        duration_minutes: 45,
        notes: 'Mid-day recharge nap',
        created_at: new Date().toISOString(),
      };
      dayNaps.push(nap);
      sampleNaps.push(nap);
    }

    const breakdown = calculateSleepQuality(sleepTimeIso, wakeTimeIso, DEFAULT_SLEEP_SETTINGS, dayNaps);
    sampleSleepEntries.push({
      id: `sample-sleep-${curDate}`,
      user_id: DEFAULT_USER_ID,
      date: curDate,
      sleep_time: sleepTimeIso,
      wake_time: wakeTimeIso,
      duration_minutes: breakdown.duration_minutes,
      quality_score: breakdown.final_quality_score,
      notes: d % 3 === 0 ? 'Deep, restorative sleep' : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 3. Runs (6 runs over last 14 days)
  const sampleRuns: Run[] = [
    {
      id: 'sample-run-1',
      user_id: DEFAULT_USER_ID,
      date: dateStr(1),
      distance_km: 5.2,
      duration_minutes: 27.5,
      pace: '5:17',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Zone 2 aerobic base builder, crisp morning',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sample-run-2',
      user_id: DEFAULT_USER_ID,
      date: dateStr(3),
      distance_km: 7.0,
      duration_minutes: 36.4,
      pace: '5:12',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Tempo intervals on track, strong finish',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sample-run-3',
      user_id: DEFAULT_USER_ID,
      date: dateStr(6),
      distance_km: 10.0,
      duration_minutes: 52.0,
      pace: '5:12',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Long Sunday run along river trail, hydration on point',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sample-run-4',
      user_id: DEFAULT_USER_ID,
      date: dateStr(8),
      distance_km: 5.0,
      duration_minutes: 26.0,
      pace: '5:12',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Midweek recovery jog',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sample-run-5',
      user_id: DEFAULT_USER_ID,
      date: dateStr(11),
      distance_km: 6.5,
      duration_minutes: 33.2,
      pace: '5:06',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Progressive acceleration final 2km',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sample-run-6',
      user_id: DEFAULT_USER_ID,
      date: dateStr(13),
      distance_km: 8.2,
      duration_minutes: 42.0,
      pace: '5:07',
      source: 'manual',
      strava_activity_id: null,
      notes: 'Endurance foundation run',
      created_at: new Date().toISOString(),
    },
  ];

  // 4. LinkedIn Pipeline Contacts
  const stages = DEFAULT_PIPELINE_STAGES;
  const stageMap = {
    contacted: stages[0]?.id || '22222222-0000-0000-0000-000000000001',
    replied: stages[1]?.id || '22222222-0000-0000-0000-000000000002',
    conversation: stages[2]?.id || '22222222-0000-0000-0000-000000000003',
    booked: stages[3]?.id || '22222222-0000-0000-0000-000000000004',
    closed: stages[4]?.id || '22222222-0000-0000-0000-000000000005',
  };

  const sampleContacts: PipelineContact[] = [
    {
      id: 'sample-contact-1',
      user_id: DEFAULT_USER_ID,
      name: 'Alexander Sterling',
      linkedin_url: 'https://linkedin.com/in/alex-sterling',
      current_stage_id: stageMap.closed,
      last_contact_date: dateStr(1),
      notes: 'Signed $12k enterprise retainer. Onboarding scheduled for Monday.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-contact-2',
      user_id: DEFAULT_USER_ID,
      name: 'Elena Rostova',
      linkedin_url: 'https://linkedin.com/in/elena-rostova',
      current_stage_id: stageMap.booked,
      last_contact_date: dateStr(2),
      notes: 'Strategy call booked for Thursday 2 PM EST. Interested in growth automation.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-contact-3',
      user_id: DEFAULT_USER_ID,
      name: 'Marcus Vance',
      linkedin_url: 'https://linkedin.com/in/marcus-vance',
      current_stage_id: stageMap.conversation,
      last_contact_date: dateStr(3),
      notes: 'Sent executive summary deck. Discussing Q4 scope and KPIs.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-contact-4',
      user_id: DEFAULT_USER_ID,
      name: 'Sarah Chen',
      linkedin_url: 'https://linkedin.com/in/sarahchen-tech',
      current_stage_id: stageMap.replied,
      last_contact_date: dateStr(4),
      notes: 'Positive response to case study post. Follow-up regarding outbound infrastructure.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-contact-5',
      user_id: DEFAULT_USER_ID,
      name: 'Julian Mercer',
      linkedin_url: 'https://linkedin.com/in/julian-mercer',
      current_stage_id: stageMap.contacted,
      last_contact_date: dateStr(1),
      notes: 'Custom outreach personalized around recent Series A funding announcement.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-contact-6',
      user_id: DEFAULT_USER_ID,
      name: 'David K. Thorne',
      linkedin_url: 'https://linkedin.com/in/david-thorne',
      current_stage_id: stageMap.contacted,
      last_contact_date: dateStr(2),
      notes: 'Outreach sent referencing podcast episode on founder resilience.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 5. Weekly Tasks
  const sampleTasks: Task[] = [
    {
      id: 'sample-task-1',
      user_id: DEFAULT_USER_ID,
      title: 'Review Q4 outbound conversion metrics',
      notes: 'Export LinkedIn pipeline and analyze reply-to-meeting ratios',
      day_of_week: 'Monday',
      week_start_date: dateStr(6),
      date: dateStr(6),
      is_done: true,
      priority: 'high',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-2',
      user_id: DEFAULT_USER_ID,
      title: 'Send contract agreement to Alexander Sterling',
      notes: 'Include revised billing milestones and deliverable terms',
      day_of_week: 'Monday',
      week_start_date: dateStr(6),
      date: dateStr(6),
      is_done: true,
      priority: 'high',
      order_index: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-3',
      user_id: DEFAULT_USER_ID,
      title: 'Record 5km tempo run baseline',
      notes: 'Focus on breathing control and even cadence',
      day_of_week: 'Tuesday',
      week_start_date: dateStr(6),
      date: dateStr(5),
      is_done: true,
      priority: 'medium',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-4',
      user_id: DEFAULT_USER_ID,
      title: 'Prepare presentation deck for Elena Rostova',
      notes: 'Highlight pipeline architecture & 30-day ROI schedule',
      day_of_week: 'Wednesday',
      week_start_date: dateStr(6),
      date: dateStr(4),
      is_done: true,
      priority: 'high',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-5',
      user_id: DEFAULT_USER_ID,
      title: 'Strategy discovery call with Elena Rostova',
      notes: 'Scheduled for 2:00 PM EST via Google Meet',
      day_of_week: 'Thursday',
      week_start_date: dateStr(6),
      date: dateStr(3),
      is_done: true,
      priority: 'high',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-6',
      user_id: DEFAULT_USER_ID,
      title: 'Draft 5 thought-leadership posts for next week',
      notes: 'Themes: Outbound engineering, sleep discipline, daily systems',
      day_of_week: 'Friday',
      week_start_date: dateStr(6),
      date: dateStr(2),
      is_done: false,
      priority: 'medium',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-7',
      user_id: DEFAULT_USER_ID,
      title: 'Long 10K endurance run',
      notes: 'Outdoor trail run, maintain conversational Zone 2 pace',
      day_of_week: 'Saturday',
      week_start_date: dateStr(6),
      date: dateStr(1),
      is_done: false,
      priority: 'high',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sample-task-8',
      user_id: DEFAULT_USER_ID,
      title: 'Weekly review & system optimization',
      notes: 'Audit sleep quality average, habits streak, and pipeline velocity',
      day_of_week: 'Sunday',
      week_start_date: dateStr(6),
      date: dateStr(0),
      is_done: false,
      priority: 'low',
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    habits,
    habitLogs: sampleHabitLogs,
    sleepEntries: sampleSleepEntries,
    naps: sampleNaps,
    runs: sampleRuns,
    contacts: sampleContacts,
    tasks: sampleTasks,
  };
}
