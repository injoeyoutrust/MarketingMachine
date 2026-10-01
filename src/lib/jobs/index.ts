import { supabaseServer } from '../supabaseServer';
import { JobError } from './error';
import { runFollowupJob } from './followup';
import { runImageJob } from './image';
import { runLandingJob } from './landing';
import { runVideoJob } from './video';

export const JOB_KINDS = ['image', 'video', 'landing', 'followup'] as const;
export type JobKind = (typeof JOB_KINDS)[number];

const RUNNERS = { image: runImageJob, video: runVideoJob, landing: runLandingJob, followup: runFollowupJob } as const;

/**
 * Runs one queued prompt job to completion and records the outcome on its row.
 * Claude takes about a minute per prompt — longer than a normal web request
 * may live on Netlify — so this runs in a background function (or, in local
 * dev, after the response), and the page polls the job row for the result.
 */
export async function runJobById(jobId: string): Promise<void> {
  const db = supabaseServer();
  // Claim the job so a retried trigger can't write the prompt twice.
  const { data: job } = await db.from('prompt_jobs').update({ status: 'running' }).eq('id', jobId).eq('status', 'queued').select('*').maybeSingle();
  if (!job) return;
  try {
    const result = await RUNNERS[job.kind as JobKind](job.params, db);
    await db.from('prompt_jobs').update({ status: 'done', result }).eq('id', jobId);
  } catch (e) {
    const error = e instanceof JobError ? e.message : 'Could not write the prompt. Please retry.';
    await db.from('prompt_jobs').update({ status: 'error', error }).eq('id', jobId);
  }
}
