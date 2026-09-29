import { describe, expect, it } from "vitest";
import { runtimeErrorReference, runtimeRecoveryCopy } from "./runtime-recovery";

describe("public runtime recovery", () => {
  it("uses helpful Greek copy without exposing technical details", () => {
    expect(runtimeRecoveryCopy.title).toMatch(/[Α-Ωα-ω]/);
    expect(JSON.stringify(runtimeRecoveryCopy)).not.toContain("stack");
    expect(JSON.stringify(runtimeRecoveryCopy)).not.toContain("database");
  });

  it("exposes only a constrained framework reference", () => {
    expect(runtimeErrorReference(Object.assign(new Error("private database detail"), { digest: "safe-123<script>" }))).toBe("safe-123script");
    expect(runtimeErrorReference(new Error("private database detail"))).toBeNull();
  });
});
