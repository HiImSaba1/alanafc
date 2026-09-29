import type { RegistrationInput } from "./core";

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function emailFrame(title: string, content: string, footer: string) {
  return `<div style="margin:0;background:#f2eee6;padding:32px 16px;font-family:Arial,sans-serif;color:#050505"><div style="max-width:640px;margin:auto;background:#fff;border-top:8px solid #ae8d4b;padding:32px"><p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#525252">Alana FC Academy</p><h1 style="font-size:28px;line-height:1.1">${escapeHtml(title)}</h1>${content}<p style="margin-top:32px;padding-top:20px;border-top:1px solid #ddd;color:#525252;font-size:13px">${escapeHtml(footer)}</p></div></div>`;
}

export function registrationMailMessages(input: RegistrationInput, reference: string, welcomeMessage = "Σας ευχαριστούμε θερμά και σας συγχαίρουμε για την απόφασή σας να κάνετε το πρώτο βήμα ώστε το παιδί σας να γνωρίσει την Alana FC Academy.") {
  const details = [
    ["Κωδικός", reference], ["Παιδί", input.childName], ["Έτος γέννησης", input.childBirthYear],
    ["Τμήμα", input.preferredGroup], ["Κηδεμόνας", input.guardianName], ["Σχέση", input.guardianRelationship],
    ["Email", input.guardianEmail], ["Τηλέφωνο", input.guardianPhone], ["Διεύθυνση", input.address || "—"],
    ["Φωτογραφίες", input.photoPreference === "yes" ? "Ναι" : "Όχι"], ["Σημειώσεις", input.notes || "—"],
  ] as const;
  const rows = details.map(([label, value]) => `<tr><th style="text-align:left;padding:9px;border-bottom:1px solid #eee">${escapeHtml(label)}</th><td style="padding:9px;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`).join("");
  const ownerText = details.map(([label, value]) => `${label}: ${value}`).join("\n");
  const guardianText = [
    `Αγαπητέ/ή ${input.guardianName},`,
    "",
    welcomeMessage,
    `Η εκδήλωση ενδιαφέροντος καταχωρήθηκε με κωδικό ${reference}.`,
    "Η υποβολή αποτελεί εκδήλωση ενδιαφέροντος και όχι οριστική εγγραφή. Η ομάδα μας θα επικοινωνήσει μαζί σας για τα επόμενα βήματα.",
  ].join("\n");

  return {
    owner: {
      subject: `Νέα εκδήλωση ενδιαφέροντος ${reference} · ${input.childName}`,
      text: ownerText,
      html: emailFrame("Νέα εκδήλωση ενδιαφέροντος", `<table style="width:100%;border-collapse:collapse">${rows}</table>`, "Αυτόματο μήνυμα από την ασφαλή φόρμα εγγραφών της Alana FC Academy."),
    },
    guardian: {
      subject: `Λάβαμε την εκδήλωση ενδιαφέροντος · ${reference}`,
      text: guardianText,
      html: emailFrame("Καλώς ήρθατε στην πρώτη σας επαφή με την Alana FC", `<p style="line-height:1.7">Αγαπητέ/ή ${escapeHtml(input.guardianName)},</p><p style="line-height:1.7">${escapeHtml(welcomeMessage)}</p><p style="line-height:1.7">Η εκδήλωση ενδιαφέροντος καταχωρήθηκε με κωδικό <strong>${escapeHtml(reference)}</strong>. Η υποβολή αποτελεί εκδήλωση ενδιαφέροντος και όχι οριστική εγγραφή. Η ομάδα μας θα επικοινωνήσει μαζί σας για τα επόμενα βήματα.</p>`, "Αυτόματο μήνυμα επιβεβαίωσης από την Alana FC Academy."),
    },
  };
}
