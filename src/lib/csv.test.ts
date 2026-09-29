import { describe, expect, it } from "vitest";
import { createCsv, csvCell } from "./csv";

describe("secure CSV exports", () => {
  it("escapes quotes and neutralizes spreadsheet formulas", () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell('κείμενο "με" εισαγωγικά')).toBe('"κείμενο ""με"" εισαγωγικά"');
  });

  it("uses an Excel-compatible UTF-8 BOM and CRLF rows", () => {
    expect(createCsv(["Όνομα"], [["Αλάνα"]])).toBe('\uFEFF"Όνομα"\r\n"Αλάνα"\r\n');
  });
});
