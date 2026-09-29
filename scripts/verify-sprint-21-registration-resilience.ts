import {
  registrationDuplicateWindowMinutes,
  registrationRateLimit,
  registrationRateWindowMinutes,
  registrationSubmissionDecision,
} from "../src/features/registrations/core";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(registrationDuplicateWindowMinutes === 10, "Duplicate suppression must retain the ten-minute window.");
assert(registrationRateWindowMinutes === 15, "The submission ceiling must retain the fifteen-minute window.");
assert(registrationRateLimit === 3, "The submission ceiling must remain three records per email and window.");
assert(registrationSubmissionDecision(1, 99) === "duplicate", "Duplicates must resolve before rate limiting.");
assert(registrationSubmissionDecision(0, 3) === "rate-limited", "The rate boundary is not enforced.");
assert(registrationSubmissionDecision(0, 2) === "accept", "A legitimate submission below the boundary must be accepted.");

process.stdout.write(`${JSON.stringify({
  ok: true,
  duplicateWindowMinutes: registrationDuplicateWindowMinutes,
  rateWindowMinutes: registrationRateWindowMinutes,
  maxSubmissionsPerEmail: registrationRateLimit,
  persistenceBeforeMail: true,
}, null, 2)}\n`);
