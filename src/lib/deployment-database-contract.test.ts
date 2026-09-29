import { describe, expect, it } from "vitest";
import { assessDeploymentDatabase, requiredApplicationTables } from "./deployment-database-contract";

describe("deployment database contract", () => {
  it("accepts a migrated database with an active owner", () => {
    expect(assessDeploymentDatabase({ tables: [...requiredApplicationTables, "__drizzle_migrations"], migrationCount: 10, activeOwnerCount: 1 })).toMatchObject({ ok: true, missingTables: [], migrationCount: 10, activeOwnerCount: 1 });
  });

  it("reports missing schema and owner readiness without records", () => {
    const report = assessDeploymentDatabase({ tables: ["admin_users"], migrationCount: 0, activeOwnerCount: 0 });
    expect(report.ok).toBe(false);
    expect(report.missingTables).toContain("content_entries");
    expect(report.errors.join(" ")).toContain("migration journal");
    expect(report.errors.join(" ")).toContain("active owner");
  });
});
