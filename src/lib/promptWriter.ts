import Anthropic from '@anthropic-ai/sdk';

/** Thrown with a message that is safe to show the user. */
export class PromptWriterError extends Error {}

/**
 * One Claude call that returns JSON matching `schema` (structured outputs).
 * Server-side refusal fallback is on: if the model declines, the API retries
 * on a fallback model inside the same call.
 */
export async function writeJson<T>(system: string, user: string, schema: Record<string, unknown>): Promise<T> {
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await new Anthropic().beta.messages
      .stream({
        model: 'claude-opus-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
        system,
        messages: [{ role: 'user', content: user }],
      })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new PromptWriterError('ANTHROPIC_API_KEY is missing or invalid in .env.local.');
    if (e instanceof Anthropic.RateLimitError) throw new PromptWriterError('Claude is rate-limited right now. Wait a moment and try again.');
    if (e instanceof Anthropic.APIError) throw new PromptWriterError(`Claude returned an error (${e.status ?? 'network'}). Please retry.`);
    throw e;
  }
  if (message.stop_reason === 'refusal') throw new PromptWriterError('Claude declined to write this prompt. Try rewording the ad copy or notes.');
  if (message.stop_reason === 'max_tokens') throw new PromptWriterError('The prompt came back incomplete. Please retry.');
  const text = message.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PromptWriterError('The prompt came back malformed. Please retry.');
  }
}
