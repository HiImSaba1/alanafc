import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("alanafc_cookie_consent_v1", "accepted"));
});

test("Greek public shell and menu remain keyboard operable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "el");
  const trigger = page.getByRole("button", { name: "Άνοιγμα μενού" });
  await trigger.click();
  const navigation = page.getByRole("navigation", { name: "Κύρια πλοήγηση" });
  await expect(navigation).toBeVisible();
  const firstMenuLink = navigation.getByRole("link").first();
  const lastMenuLink = page.locator('#site-menu a[href]').last();
  await expect(firstMenuLink).toBeFocused();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Shift+Tab");
  await expect(lastMenuLink).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});

test("reduced motion keeps the menu immediately operable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Άνοιγμα μενού" }).click();
  const navigation = page.getByRole("navigation", { name: "Κύρια πλοήγηση" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link").first()).toBeFocused();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
});

test("homepage presents the full academy journey and registration path", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Μαθαίνουμε");
  await expect(page.getByText("Το όραμά μας · 02")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Οι άνθρωποι και οι χώροι/ })).toBeVisible();
  await expect(page.getByText("Η διαδρομή · 03")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Γνωρίστε την ομάδα/ })).toHaveAttribute("href", "/coaching-staff");
  await expect(page.getByRole("link", { name: /Δείτε τους χώρους/ })).toHaveAttribute("href", "/our-facilities");
  await expect(page.getByRole("link", { name: /Ανακαλύψτε το club/ })).toHaveAttribute("href", "/sportclub-alana");
  await expect(page.locator(".academy-services .parallax-media")).toHaveCount(3);
  const newsCards = page.locator(".home-news-card");
  if (await newsCards.count()) {
    await expect(newsCards.first().locator(".parallax-media")).toBeVisible();
  } else {
    await expect(page.getByText("Τα νέα εμφανίζονται εδώ μόλις δημοσιευθούν από τη διαχείριση.")).toBeVisible();
  }
  await expect(page.locator(".academy-testimonials__portrait .parallax-media")).toHaveCount(1);
  await expect(page.locator(".home-registration")).toHaveCount(0);
  await expect(page.locator(".academy-services__media").first()).toHaveCSS("min-height", "0px");
  await expect(page.locator(".academy-services__media").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByRole("heading", { name: /Τελευταία νέα/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Εγγραφές 2026–2027/ }).first()).toHaveAttribute("href", "/eggrafes-2026-2027");
  await expect.poll(() => page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 180;
  }), { timeout: 8_000 }).toBe(true);
});

test("homepage testimonials use verified legacy records and remain keyboard operable", async ({ page }) => {
  await page.goto("/");
  const testimonials = page.getByRole("region", { name: "Είπαν για εμάς." });
  await expect(testimonials.getByText("Προσωρινό δείγμα διάταξης — όχι για δημοσίευση.")).toHaveCount(0);
  await expect(testimonials.getByText("Testimonials")).toBeVisible();
  await expect(testimonials.getByText("Μαρία Κ.")).toBeVisible();
  await expect(testimonials.getByText("01 / 05")).toBeVisible();
  await testimonials.getByRole("button", { name: "Επόμενη μαρτυρία" }).click();
  await expect(testimonials.getByText("02 / 05")).toBeVisible();
  await expect(testimonials.getByText("Γιώργος Π.")).toBeVisible();
  await expect(testimonials.getByRole("button", { name: "Μαρτυρία 2" })).toHaveAttribute("aria-current", "true");
});

test("homepage carousel exposes three clear destination routes", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Κύριες επιλογές Alana FC" });
  await expect(carousel.getByRole("link", { name: "Εγγραφές 2026–2027" })).toHaveAttribute("href", "/eggrafes-2026-2027");
  await carousel.getByRole("button", { name: /Διαφάνεια 2:/ }).click();
  await expect(carousel.getByRole("link", { name: "Γνωρίστε την Alana" })).toHaveAttribute("href", "/about-us");
  await carousel.getByRole("button", { name: /Διαφάνεια 3:/ }).click();
  await expect(carousel.getByRole("link", { name: "Επικοινωνήστε μαζί μας" })).toHaveAttribute("href", "/contact-us");
  await expect(carousel.getByRole("button", { name: "Προηγούμενη διαφάνεια" })).toBeVisible();
  await expect(carousel.getByRole("button", { name: "Επόμενη διαφάνεια" })).toBeVisible();
});

test("homepage displays only the verified legacy sponsors", async ({ page }) => {
  await page.goto("/");
  const sponsors = page.getByRole("region", { name: "Οι χορηγοί μας." });
  await expect(sponsors.getByRole("link")).toHaveCount(3);
  await expect(sponsors.getByRole("link", { name: /Georgiadis Accessories/ })).toHaveAttribute("href", "https://www.georgiadisaccessories.com/");
  await expect(sponsors.getByRole("link", { name: /Το Ιδιαίτερο Αλεξανδρούπολη/ })).toHaveAttribute("href", "https://www.facebook.com/toidiaiteroalexandroupoli");
  await expect(sponsors.getByRole("link", { name: /DataEvros/ })).toHaveAttribute("href", "https://dataevros.gr/");
});

test("homepage closes with direct and accessible contact paths", async ({ page }) => {
  await page.goto("/");
  const contact = page.getByRole("region", { name: "Η επόμενη κίνηση ξεκινά με μια συζήτηση." });
  await expect(contact.getByRole("link", { name: "Μιλήστε με την ομάδα μας" })).toHaveAttribute("href", "/contact-us");
  await expect(contact.getByRole("link", { name: "697 492 4194" })).toHaveAttribute("href", "tel:+306974924194");
  await expect(contact.getByRole("link", { name: "25510 88355" })).toHaveAttribute("href", "tel:+302551088355");
  await expect(contact.getByRole("link", { name: "f.c.alana@hotmail.com" })).toHaveAttribute("href", "mailto:f.c.alana@hotmail.com");
  await expect(contact).toContainText("Εργατικά, Παλαγιά, Αλεξανδρούπολη 681 32");
});

test("admin is private and excluded from indexing", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByLabel("Όνομα χρήστη")).toBeVisible();
  await expect(page.getByLabel("Κωδικός πρόσβασης")).toHaveAttribute("type", "password");
});

test("news index renders without exposing drafts", async ({ page }) => {
  await page.goto("/nea"); 
  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ιστορίες από το γήπεδο");
  await expect(page.locator(".content-preview-banner")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/news$/);
  const cards = page.locator(".news-grid--editorial .home-news-card");
  if (await cards.count()) {
    await expect(cards.first().locator(".parallax-media")).toBeVisible();
    expect(await cards.count()).toBeLessThanOrEqual(15);
    if (await cards.count() === 15) await expect(page.getByRole("navigation", { name: "Σελιδοποίηση νέων" })).toBeVisible();
  } else {
    await expect(page.getByText("Δεν υπάρχουν δημοσιευμένα άρθρα για αυτό το φίλτρο.")).toBeVisible();
  }
});

test("homepage limits published news to the latest six", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".home-news > .news-grid--editorial .home-news-card");
  expect(await cards.count()).toBeLessThanOrEqual(6);
  if (await cards.count()) await expect(cards.first().getByRole("link")).toHaveAttribute("href", /^\/news\//);
});

test("Greek legacy news URL redirects to the ASCII archive", async ({ page }) => {
  await page.goto("/τα-νέα-μας");
  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ιστορίες από το γήπεδο");
});

test("SEO discovery includes every canonical public route and excludes private surfaces", async ({ page }) => {
  await page.goto("/");
  const structuredData = JSON.parse(await page.locator("#academy-structured-data").textContent() || "{}");
  expect(structuredData["@type"]).toContain("SportsOrganization");
  expect(structuredData.address.addressLocality).toBe("Αλεξανδρούπολη");

  const sitemapResponse = await page.request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  for (const route of ["/about-us", "/coaching-staff", "/our-facilities", "/sportclub-alana", "/news", "/eggrafes-2026-2027", "/contact-us"]) {
    expect(sitemap).toContain(`${route}</loc>`);
  }
  expect(sitemap).not.toContain("/admin");
  expect(sitemap).not.toContain("/api/");
  expect(sitemap).not.toContain("/τα-νέα-μας");
  expect(sitemap).not.toContain("/our-story");

  const robotsResponse = await page.request.get("/robots.txt");
  const robots = await robotsResponse.text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /api");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "el_GR");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({ name: "Alana FC Academy", short_name: "Alana FC", lang: "el", start_url: "/", display: "standalone" });
});

test("unknown public routes return a recoverable, non-indexable Greek 404", async ({ page }) => {
  const response = await page.goto("/den-yparchei-afti-i-selida");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  await expect(page.getByRole("heading", { level: 1, name: "Η σελίδα βγήκε εκτός γηπέδου." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Επιστροφή στην αρχική" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Δείτε τα νέα" })).toHaveAttribute("href", "/news");
  const robotsDirectives = await page.locator('meta[name="robots"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("content") || ""),
  );
  expect(robotsDirectives.length).toBeGreaterThan(0);
  for (const directive of robotsDirectives) {
    expect(directive).toMatch(/(?:^|,\s*)noindex(?:,|$)/);
    expect(directive).not.toMatch(/(?:^|,\s*)index(?:,|$)/);
  }

  const missingPostResponse = await page.goto("/news/den-yparchei-afto-to-arthro");
  expect(missingPostResponse?.status()).toBe(404);
  const missingPostRobots = await page.locator('meta[name="robots"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("content") || ""),
  );
  expect(missingPostRobots.length).toBeGreaterThan(0);
  for (const directive of missingPostRobots) {
    expect(directive).toMatch(/(?:^|,\s*)noindex(?:,|$)/);
    expect(directive).not.toMatch(/(?:^|,\s*)index(?:,|$)/);
  }
});

test("registration form is Greek, privacy-aware and excludes AMKA", async ({ page }) => {
  await page.goto("/eggrafes-2026-2027");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Το επόμενο");
  const childNameInput = page.getByLabel("Ονοματεπώνυμο παιδιού *");
  await expect(childNameInput).toBeVisible();
  await expect(childNameInput).toHaveCSS("border-top-style", "solid");
  await expect(childNameInput).toHaveCSS("border-top-width", "1px");
  await expect(page.getByText("Τα υποχρεωτικά πεδία σημειώνονται με")).toHaveCount(0);
  await expect(page.getByLabel("Email *")).toHaveAttribute("type", "email");
  await expect(page.getByText("Δεν ζητάμε ΑΜΚΑ")).toBeVisible();
  await expect(page.locator('input[name="amka"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "πολιτική απορρήτου" })).toHaveAttribute("href", "/privacy");
  const programTabs = page.getByRole("tablist", { name: "Αναπτυξιακά στάδια" });
  const tabs = programTabs.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  const firstPanelId = await tabs.first().getAttribute("aria-controls");
  expect(firstPanelId).toBeTruthy();
  await expect(page.locator(`#${firstPanelId}`)).toBeVisible();
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const secondPanelId = await tabs.nth(1).getAttribute("aria-controls");
  expect(secondPanelId).toBeTruthy();
  await expect(page.locator(`#${secondPanelId}`)).toBeVisible();
  await expect(page.getByText(/Η τελική ένταξη σε τμήμα επιβεβαιώνεται/)).toBeVisible();
  await expect(page.locator(".registration-programs__media.parallax-media")).toBeVisible();
  await expect(page.locator('input[name="website"]')).toBeAttached();
  await expect(page.locator('input[name="website"]')).toHaveAttribute("tabindex", "-1");
  await page.getByRole("button", { name: "Υποβολή ενδιαφέροντος" }).click();
  await expect(childNameInput).toHaveAttribute("aria-invalid", "true");
  await expect(childNameInput).toHaveAttribute("aria-describedby", "child-name-error");
  await expect(page.locator("#child-name-error")).toBeVisible();
  await expect(childNameInput).toBeFocused();
});

test("contact page exposes a private, accessible Greek form", async ({ page }) => {
  await page.goto("/contact-us");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ας μιλήσουμε");
  const contactNameInput = page.getByLabel("Ονοματεπώνυμο *");
  await expect(contactNameInput).toBeVisible();
  await expect(contactNameInput).toHaveCSS("border-top-style", "solid");
  await expect(contactNameInput).toHaveCSS("border-top-width", "1px");
  await expect(page.getByLabel("Email *")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Μήνυμα *")).toBeVisible();
  await expect(page.getByRole("link", { name: "πολιτική απορρήτου" })).toHaveAttribute("href", "/privacy");
  await expect(page.locator('.contact-form input[name="website"]')).toBeAttached();
  await expect(page.locator('.contact-form input[name="website"]')).toHaveAttribute("tabindex", "-1");
  await expect(page.getByText("Εργατικά, Παλαγιά, Αλεξανδρούπολη 681 32").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "25510 88355" })).toHaveAttribute("href", "tel:+302551088355");
  await expect(page.getByTitle("Χάρτης τοποθεσίας Alana FC Academy")).toHaveCount(0);
  await page.getByRole("button", { name: "Φόρτωση χάρτη" }).click();
  await expect(page.getByTitle("Χάρτης τοποθεσίας Alana FC Academy")).toBeVisible();
  await expect(page.getByRole("link", { name: "Οδηγίες πρόσβασης" })).toHaveAttribute("target", "_blank");
  await page.getByRole("button", { name: "Αποστολή μηνύματος" }).click();
  await expect(contactNameInput).toHaveAttribute("aria-invalid", "true");
  await expect(contactNameInput).toHaveAttribute("aria-describedby", "sender-name-error");
  await expect(page.locator("#sender-name-error")).toBeVisible();
  await expect(contactNameInput).toBeFocused();
});

test("notification center remains behind admin authentication", async ({ page }) => {
  await page.goto("/admin/notifications");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

for (const destination of [
  { path: "/about-us", title: "Αναπτύσσουμε ποδοσφαιριστές. Διαμορφώνουμε χαρακτήρες.", cta: "Ξεκινήστε την εγγραφή", galleryCount: 3 },
  { path: "/coaching-staff", title: "Η καρδιά της Alana FC.", cta: "Επικοινωνήστε μαζί μας", galleryCount: 6 },
  { path: "/our-facilities", title: "Εγκαταστάσεις για παιχνίδι και εξέλιξη.", cta: "Εγγραφές 2026–2027", galleryCount: 3 },
  { path: "/sportclub-alana", title: "Μία κοινότητα γύρω από το ποδόσφαιρο.", cta: "Μιλήστε με την ομάδα μας", galleryCount: 6 },
]) {
  test(`${destination.path} uses the designed Greek academy page contract`, async ({ page }) => {
    await page.goto(destination.path);
    const heroTitle = page.getByRole("heading", { level: 1 });
    await expect(heroTitle).toContainText(destination.title);
    await expect.poll(() => heroTitle.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.left >= -1 && box.right <= window.innerWidth + 1;
    })).toBe(true);
    await expect(page.locator('.academy-destination__gallery [class~="parallax-media"]')).toHaveCount(destination.galleryCount);
    await expect(page.getByRole("link", { name: destination.cta })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("vc_row");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${destination.path}$`));
  });
}

test("academy story uses a sticky narrative and three philosophy pillars", async ({ page }) => {
  await page.goto("/about-us");
  await expect(page.locator(".academy-destination__story--sticky")).toBeVisible();
  const pillars = page.getByRole("region", { name: "Οι αρχές της Alana FC Academy" });
  await expect(pillars.locator("article")).toHaveCount(3);
  await expect(pillars.getByRole("heading", { name: "Παιδί πρώτα" })).toBeVisible();
  await expect(pillars.getByRole("heading", { name: "Μάθηση με σκοπό" })).toBeVisible();
  await expect(pillars.getByRole("heading", { name: "Μαζί ως ομάδα" })).toBeVisible();
});

test("coaching page presents the verified team photography without invented profiles", async ({ page }) => {
  await page.goto("/coaching-staff");
  const peopleGallery = page.locator(".academy-destination__gallery--people");
  await expect(peopleGallery.getByRole("heading", { name: "Οι άνθρωποι πίσω από κάθε προπόνηση." })).toBeVisible();
  await expect(peopleGallery.locator("figure")).toHaveCount(6);
  await expect(peopleGallery.locator("figcaption")).toHaveCount(6);
  await expect(peopleGallery).not.toContainText("Βιογραφικό");
});

test("facilities page presents the verified pitch inventory", async ({ page }) => {
  await page.goto("/our-facilities");
  const facilities = page.getByRole("region", { name: "Χώροι για κάθε στάδιο εξέλιξης." });
  await expect(facilities.locator("article")).toHaveCount(3);
  await expect(facilities).toContainText("11×11");
  await expect(facilities).toContainText("8×8");
  await expect(facilities).toContainText("2× 5×5 + 3×3");
  await expect(facilities).toContainText("φυσικό χόρτο");
  await expect(facilities).toContainText("συνθετικό χλοοτάπητα");
});

test("sportclub page presents verified community experiences and imagery", async ({ page }) => {
  await page.goto("/sportclub-alana");
  const experiences = page.getByRole("region", { name: "Ένας χώρος που φέρνει την κοινότητα κοντά." });
  await expect(experiences.locator("article")).toHaveCount(3);
  await expect(experiences.getByRole("heading", { name: "Γιορτές και κοινωνικές εκδηλώσεις" })).toBeVisible();
  await expect(experiences.getByRole("heading", { name: "Φιλανθρωπικές δράσεις" })).toBeVisible();
  await expect(experiences.getByRole("heading", { name: "Καφετέρια και σημείο συνάντησης" })).toBeVisible();
  const gallery = page.locator(".academy-destination__gallery--community");
  await expect(gallery.locator("figure")).toHaveCount(6);
  await expect(gallery.locator("figcaption")).toHaveCount(6);
});

test("legacy story URL consolidates into the academy page", async ({ page }) => {
  await page.goto("/our-story");
  await expect(page).toHaveURL(/\/about-us$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Αναπτύσσουμε ποδοσφαιριστές");
});
