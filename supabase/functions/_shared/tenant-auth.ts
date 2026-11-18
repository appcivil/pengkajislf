import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

export async function readJsonBody(req: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body too large" };
  }

  if (!req.body) return { ok: false, status: 400, error: "Invalid JSON body" };

  // Enforce the limit while streaming so chunked/incorrect Content-Length
  // requests cannot force the function to buffer an unbounded body.
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Request body too large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Unable to read request body" };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, data: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }
}

export type ProjectAuthResult =
  | { ok: true; userId: string; organizationId: string }
  | { ok: false; status: number; error: string };

/** AI execution is distinct from project read access: viewer stays read-only. */
export function canExecuteProjectAI(role: unknown): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export async function authenticateProject(req: Request, projectId: unknown): Promise<ProjectAuthResult> {
  const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return { ok: false, status: 401, error: "Valid user session required" };
  if (typeof projectId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) {
    return { ok: false, status: 400, error: "A valid proyekId is required" };
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return { ok: false, status: 500, error: "Authentication service is not configured" };

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return { ok: false, status: 401, error: "Session is invalid or expired" };

  // The caller-scoped client preserves the user's JWT. RLS on public.proyek
  // is the authority for organization/project membership; never use service role here.
  const scopedClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: project, error: projectError } = await scopedClient
    .from("proyek")
    .select("id, organization_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project?.organization_id) {
    return { ok: false, status: 403, error: "Project access denied" };
  }

  // RLS visibility only proves read access. Verify the tenant role explicitly
  // before either Edge Function calls the paid Gemini provider.
  const { data: membership, error: membershipError } = await scopedClient
    .from("organization_members")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership || !canExecuteProjectAI(membership.role)) {
    return { ok: false, status: 403, error: "Role is read-only or not authorized to execute AI for this project" };
  }

  return { ok: true, userId: user.id, organizationId: project.organization_id };
}
