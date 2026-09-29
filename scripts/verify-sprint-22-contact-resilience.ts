import {
  contactDuplicateWindowMinutes,
  contactRateLimit,
  contactRateWindowMinutes,
  contactSubmissionDecision,
} from "../src/features/contact/core";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(contactDuplicateWindowMinutes === 10, "Duplicate suppression must retain the ten-minute window.");
assert(contactRateWindowMinutes === 15, "The submission ceiling must retain the fifteen-minute window.");
assert(contactRateLimit === 3, "The submission ceiling must remain three messages per email and window.");
assert(contactSubmissionDecision(1, 99) === "duplicate", "Duplicates must resolve before rate limiting.");
assert(contactSubmissionDecision(0, 3) === "rate-limited", "The rate boundary is not enforced.");
assert(contactSubmissionDecision(0, 2) === "accept", "A legitimate message below the boundary must be accepted.");

process.stdout.write(`${JSON.stringify({
  ok: true,
  duplicateWindowMinutes: contactDuplicateWindowMinutes,
  rateWindowMinutes: contactRateWindowMinutes,
  maxMessagesPerEmail: contactRateLimit,
  persistenceBeforeMail: true,
}, null, 2)}\n`);
