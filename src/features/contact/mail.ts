import "server-only";
import { createAcademyMailTransport } from "@/lib/mail/transport";
import type { ContactInput } from "./core";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
const frame = (title: string, body: string) => `<div style="margin:0;background:#f2eee6;padding:32px 16px;font-family:Arial,sans-serif;color:#050505"><div style="max-width:640px;margin:auto;background:#fff;border-top:8px solid #ae8d4b;padding:32px"><p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#525252">Alana FC Academy</p><h1>${escapeHtml(title)}</h1>${body}<p style="margin-top:32px;padding-top:20px;border-top:1px solid #ddd;color:#525252;font-size:13px">Αυτόματο μήνυμα από τη φόρμα επικοινωνίας.</p></div></div>`;

export async function sendContactEmails(input: ContactInput, reference: string) {
  const { configuration, transporter } = createAcademyMailTransport();
  const details = `<p><strong>Κωδικός:</strong> ${escapeHtml(reference)}</p><p><strong>Αποστολέας:</strong> ${escapeHtml(input.senderName)}</p><p><strong>Email:</strong> ${escapeHtml(input.senderEmail)}</p><p><strong>Τηλέφωνο:</strong> ${escapeHtml(input.senderPhone || "—")}</p><p><strong>Θέμα:</strong> ${escapeHtml(input.subject)}</p><p><strong>Μήνυμα:</strong><br>${escapeHtml(input.message).replaceAll("\n", "<br>")}</p>`;
  await transporter.sendMail({ from: configuration.from, to: configuration.to, replyTo: input.senderEmail, subject: `Νέο μήνυμα ${reference} · ${input.subject}`, html: frame("Νέο μήνυμα επικοινωνίας", details) });
  await transporter.sendMail({ from: configuration.from, to: input.senderEmail, subject: `Λάβαμε το μήνυμά σας · ${reference}`, html: frame("Το μήνυμά σας καταχωρήθηκε", `<p style="line-height:1.7">Ευχαριστούμε που επικοινωνήσατε με την Alana FC Academy. Ο κωδικός του μηνύματός σας είναι <strong>${escapeHtml(reference)}</strong>. Θα σας απαντήσουμε το συντομότερο δυνατό.</p>`) });
}
