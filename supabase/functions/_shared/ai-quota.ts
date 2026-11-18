import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AIQuotaContext {
  userId: string;
  organizationId: string | null;
}

export interface AIQuotaReservation {
  id: string;
  reservedTokens: number;
}

export class AIQuotaDeniedError extends Error {
  retryAfter?: string;
  constructor(reason: string, retryAfter?: string) {
    super(reason);
    this.name = "AIQuotaDeniedError";
    this.retryAfter = retryAfter;
  }
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("AI quota service is not configured");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Reserve before contacting a paid provider. Idempotency keys are server-generated. */
export async function reserveAIUsage(
  context: AIQuotaContext,
  estimatedTokens: number,
): Promise<AIQuotaReservation> {
  if (!Number.isInteger(estimatedTokens) || estimatedTokens < 1 || estimatedTokens > 1_000_000) {
    throw new Error("Invalid AI token reservation estimate");
  }

  const client = serviceClient();
  const { data, error } = await client.rpc("ai_quota_reserve", {
    p_user_id: context.userId,
    p_organization_id: context.organizationId,
    p_idempotency_key: crypto.randomUUID(),
    p_reserved_tokens: estimatedTokens,
    p_ttl_seconds: 900,
  });

  if (error) throw new Error("Unable to reserve AI usage");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.allowed || !row?.reservation_id) {
    throw new AIQuotaDeniedError(row?.reason || "AI quota exceeded", row?.retry_after || undefined);
  }

  return { id: row.reservation_id, reservedTokens: estimatedTokens };
}

/** Finalize with provider-reported usage when available, otherwise a conservative estimate. */
export async function finalizeAIUsage(
  reservation: AIQuotaReservation,
  actualTokens: number,
): Promise<void> {
  const safeActual = Math.max(0, Math.min(1_000_000, Math.ceil(actualTokens)));
  const { error, data } = await serviceClient().rpc("ai_quota_finalize", {
    p_reservation_id: reservation.id,
    p_actual_tokens: safeActual,
  });
  if (error || data !== true) {
    // Leave the reservation to expire; never release after an ambiguous provider result.
    throw new Error("Unable to finalize AI usage reservation");
  }
}

/** Release a reservation only when the provider request is known not to have started. */
export async function releaseAIUsage(reservation: AIQuotaReservation): Promise<void> {
  const { error, data } = await serviceClient().rpc("ai_quota_release", {
    p_reservation_id: reservation.id,
  });
  if (error || data !== true) {
    // Keep the reservation until expiry if release status is ambiguous.
    throw new Error("Unable to release AI usage reservation");
  }
}

/** Normalize token usage from Gemini, OpenAI-compatible, and Anthropic responses. */
export function extractProviderUsageTokens(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const usage = (root.usageMetadata ?? root.usage ?? root) as Record<string, unknown>;
  if (!usage || typeof usage !== "object") return null;
  const candidates = [
    usage.totalTokenCount,
    usage.total_tokens,
    usage.input_tokens !== undefined && usage.output_tokens !== undefined
      ? Number(usage.input_tokens) + Number(usage.output_tokens)
      : undefined,
    usage.prompt_tokens !== undefined && usage.completion_tokens !== undefined
      ? Number(usage.prompt_tokens) + Number(usage.completion_tokens)
      : undefined,
  ];
  const value = candidates.find((item) => typeof item === "number" && Number.isFinite(item) && item >= 0);
  return typeof value === "number" ? Math.ceil(value) : null;
}

/** Convert a bounded text payload into a deliberately conservative token estimate. */
export function estimateTextTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 3));
}
