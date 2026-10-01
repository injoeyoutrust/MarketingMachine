import { runJobById } from '../../src/lib/jobs/index';

// Background function (the "-background" suffix): Netlify answers 202 at once
// and lets this run for up to 15 minutes, long enough for Claude to write a prompt.
export default async function handler(req: Request) {
  const { jobId } = (await req.json().catch(() => ({}))) as { jobId?: string };
  if (typeof jobId === 'string' && /^[0-9a-f-]{36}$/i.test(jobId)) await runJobById(jobId);
}
