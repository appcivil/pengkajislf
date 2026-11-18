/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
const apiUrl = Deno.env.get("API_URL") ?? "http://127.0.0.1:54321";
const anonKey = Deno.env.get("ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
const projectId = "dddddddd-1111-4ddd-8ddd-dddddddddddd";
Deno.test("viewer receives HTTP 403 from each local AI Edge Function", async () => {
  if (!anonKey) throw new Error("ANON_KEY missing");
  const login = await fetch(apiUrl + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email: "edge-viewer@example.test", password: "ci-viewer-password" }),
  });
  const loginBody = await login.json();
  assertEquals(login.status, 200, "local viewer must authenticate with GoTrue: " + JSON.stringify(loginBody));
  const token = loginBody.access_token as string;
  const requests = [
    ["ai-proxy", { provider: "gemini", model: "gemini-2.0-flash", prompt: "deny", projectId }],
    ["auto-fill-simak", { proyekId: projectId, proyekData: { nama_bangunan: "viewer" } }],
    ["photo-checklist-mapper", { proyekId: projectId, photos: [{ id: "p1", base64: "AQID", mimeType: "image/png" }] }],
  ] as const;
  for (const [name, body] of requests) {
    const response = await fetch(apiUrl + "/functions/v1/" + name, {
      method: "POST",
      headers: { authorization: "Bearer " + token, apikey: anonKey, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseText = await response.text();
    assertEquals(response.status, 403, name + " must reject viewer before provider execution: " + responseText);
  }
});
