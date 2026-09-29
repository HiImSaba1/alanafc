export type MailEnvironment = Record<string, string | undefined>;

export function academyMailConfiguration(values: MailEnvironment = process.env) {
  const host = values.SMTP_HOST?.trim();
  const user = values.SMTP_USER?.trim();
  const password = values.SMTP_PASSWORD;
  const from = values.MAIL_FROM?.trim();
  const to = values.MAIL_TO?.trim();
  const port = Number(values.SMTP_PORT ?? "465");
  const secureValue = values.SMTP_SECURE?.trim().toLowerCase() ?? "true";

  if (!host || !user || !password || !from || !to) throw new Error("Η ρύθμιση SMTP δεν είναι πλήρης.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Η θύρα SMTP δεν είναι έγκυρη.");
  if (secureValue !== "true" && secureValue !== "false") throw new Error("Η ρύθμιση ασφάλειας SMTP δεν είναι έγκυρη.");
  if (!from.toLowerCase().includes(user.toLowerCase())) throw new Error("Η διεύθυνση αποστολής πρέπει να αντιστοιχεί στον SMTP λογαριασμό.");

  const recipients = to.split(",").map((recipient) => recipient.trim()).filter(Boolean);
  if (!recipients.length) throw new Error("Δεν έχουν οριστεί παραλήπτες email.");
  return { host, port, secure: secureValue === "true", user, password, from, to, recipients };
}
