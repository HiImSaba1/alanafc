import { hash, verify } from "@node-rs/argon2";

const passwordHashOptions = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

export function hashAdminPassword(password: string) {
  return hash(password, passwordHashOptions);
}

export function verifyAdminPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}
