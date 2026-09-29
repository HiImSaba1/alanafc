import "server-only";
import { createAcademyMailTransport } from "@/lib/mail/transport";
import type { RegistrationInput } from "./core";
import { registrationMailMessages } from "./mail-messages";
import { getRegistrationSettings } from "@/features/site-settings/registration-settings";

export async function sendRegistrationEmails(input: RegistrationInput, reference: string) {
  const { configuration: config, transporter } = createAcademyMailTransport();
  const settings = await getRegistrationSettings();
  const messages = registrationMailMessages(input, reference, settings.guardianEmailMessage);
  try {
    const results = await Promise.allSettled([
      transporter.sendMail({ from: config.from, to: settings.notificationRecipients.join(", "), replyTo: input.guardianEmail, ...messages.owner }),
      transporter.sendMail({ from: config.from, to: input.guardianEmail, ...messages.guardian }),
    ]);
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) throw new Error(`Απέτυχαν ${failed} από τις 2 αποστολές email εγγραφής.`);
  } finally {
    transporter.close();
  }
}
