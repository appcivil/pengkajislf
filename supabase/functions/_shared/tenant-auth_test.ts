import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { canExecuteProjectAI } from "./tenant-auth.ts";

Deno.test("project AI role matrix allows owner, admin, and member", () => {
  assertEquals(canExecuteProjectAI("owner"), true);
  assertEquals(canExecuteProjectAI("admin"), true);
  assertEquals(canExecuteProjectAI("member"), true);
});

Deno.test("project AI role matrix denies viewer, platform admin, and unknown roles", () => {
  assertEquals(canExecuteProjectAI("viewer"), false);
  assertEquals(canExecuteProjectAI("platform_admin"), false);
  assertEquals(canExecuteProjectAI(null), false);
  assertEquals(canExecuteProjectAI(undefined), false);
});
