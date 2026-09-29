import { describe, expect, it } from "vitest";
import { deduplicateByExternalId, parseMigrationSource, sanitizeMigratedHtml, stripLegacyBuilderShortcodes } from "./migration";

const fixture = `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/"><channel><title>Alana</title><language>el</language><wp:base_site_url>https://alanafc.gr</wp:base_site_url><item><title><![CDATA[Η Ακαδημία]]></title><link>https://alanafc.gr/academy/</link><dc:creator>admin</dc:creator><content:encoded><![CDATA[[vc_row]<p onclick="bad()">Ελληνικό κείμενο</p><script>bad()</script>[/vc_row]]]></content:encoded><excerpt:encoded><![CDATA[Σύντομο]]></excerpt:encoded><wp:post_id>12</wp:post_id><wp:post_date_gmt>2024-01-02 10:00:00</wp:post_date_gmt><wp:post_name><![CDATA[η-ακαδημία]]></wp:post_name><wp:status>publish</wp:status><wp:post_type>page</wp:post_type><wp:postmeta><wp:meta_key>_yoast_wpseo_metadesc</wp:meta_key><wp:meta_value><![CDATA[Περιγραφή]]></wp:meta_value></wp:postmeta></item></channel></rss>`;

describe("WordPress migration parser", () => {
  it("preserves Greek copy but removes builders and active markup", () => {
    const [page] = parseMigrationSource(fixture).contents;
    expect(page?.slug).toBe("η-ακαδημία");
    expect(page?.bodyHtml).toBe("<p>Ελληνικό κείμενο</p>");
    expect(page?.seoDescription).toBe("Περιγραφή");
    expect(page?.risks).toContain("active-content");
  });

  it("strips legacy shortcode wrappers", () => {
    expect(stripLegacyBuilderShortcodes("[vc_row][vc_column]κείμενο[/vc_column][/vc_row]")).toBe("κείμενο");
    expect(sanitizeMigratedHtml('<a href="javascript:bad()">Σύνδεσμος</a>')).not.toContain("javascript:");
  });

  it("marks conflicting duplicate external ids", () => {
    const base = { externalId: "7", checksum: "a", risks: [] as never[] };
    const result = deduplicateByExternalId([base, { ...base, checksum: "b" }]);
    expect(result.duplicateIds).toEqual(["7"]);
    expect(result.conflictingIds).toEqual(["7"]);
    expect(result.items[0]?.risks).toContain("duplicate-conflict");
  });
});
