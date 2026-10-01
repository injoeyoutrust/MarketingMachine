import { after, NextResponse } from 'next/server';
import { supabaseServer } from './supabaseServer';
import { JOB_KINDS, runJobById, type JobKind } from './jobs';

/**
 * Queues a prompt-writing job and returns its id right away; the page polls
 * /api/jobs/[id]. On Netlify the work runs in a background function (up to 15
 * minutes); everywhere else (local dev) it runs in-process after the response.
 */
export async function startPromptJob(kind: JobKind, params: unknown, origin: string) {
  if (!JOB_KINDS.includes(kind) || !params || typeof params !== 'object') return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  const db = supabaseServer();
  const { data: job, error } = await db.from('prompt_jobs').insert({ kind, params }).select('id').single();
  if (error || !job) return NextResponse.json({ error: 'Could not start the job. Has the prompt_jobs migration been run?' }, { status: 500 });

  if (process.env.NETLIFY === 'true') {
    const res = await fetch(`${origin}/.netlify/functions/prompt-job-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => null);
    if (!res || !res.ok) {
      await db.from('prompt_jobs').update({ status: 'error', error: 'Could not start the background writer. Please retry.' }).eq('id', job.id);
      return NextResponse.json({ error: 'Could not start the background writer. Please retry.' }, { status: 502 });
    }
  } else {
    after(() => runJobById(job.id));
  }
  return NextResponse.json({ jobId: job.id });
}
