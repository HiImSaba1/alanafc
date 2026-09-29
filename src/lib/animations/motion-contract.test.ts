import { describe, expect, it } from "vitest";
import { clipInset, LOGIN_ENTRANCE_MOTION } from "./motion-contract";

describe("shared motion contract", () => {
  it("maps every clip direction to a deterministic hidden state", () => {
    expect(clipInset("bottom")).toBe("inset(100% 0 0 0)");
    expect(clipInset("left")).toBe("inset(0 100% 0 0)");
    expect(clipInset("right")).toBe("inset(0 0 0 100%)");
  });

  it("keeps entrance timing positive and deliberately staggered", () => {
    expect(LOGIN_ENTRANCE_MOTION.visualDuration).toBeGreaterThan(LOGIN_ENTRANCE_MOTION.lineDuration);
    expect(LOGIN_ENTRANCE_MOTION.lineStagger).toBeGreaterThan(0);
    expect(LOGIN_ENTRANCE_MOTION.revealStagger).toBeGreaterThan(0);
  });
});
