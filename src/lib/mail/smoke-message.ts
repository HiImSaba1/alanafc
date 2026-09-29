export function academyMailSmokeMessage(now = new Date()) {
  const timestamp = now.toISOString();
  return {
    subject: `[ΔΟΚΙΜΗ] Alana FC · Έλεγχος αποστολής · ${timestamp}`,
    text: `Δοκιμαστικό μήνυμα αποστολής Alana FC Academy. Δεν απαιτείται απάντηση. Χρόνος ελέγχου: ${timestamp}.`,
    html: `<div style="margin:0;background:#f2eee6;padding:32px 16px;font-family:Arial,sans-serif;color:#050505"><div style="max-width:640px;margin:auto;background:#fff;border-top:8px solid #ae8d4b;padding:32px"><p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#525252">Alana FC Academy · Δοκιμή</p><h1 style="font-size:28px;line-height:1.1">Η αποστολή email λειτουργεί.</h1><p style="line-height:1.7">Αυτό είναι ελεγχόμενο δοκιμαστικό μήνυμα. Δεν απαιτείται απάντηση και δεν περιέχει δεδομένα φόρμας ή προσωπικά δεδομένα.</p><p style="margin-top:24px;color:#525252;font-size:13px">${timestamp}</p></div></div>`,
  };
}
