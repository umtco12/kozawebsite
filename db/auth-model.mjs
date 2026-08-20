import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export function validatePassword(password) {
  const value = String(password ?? "");
  if (value.length < 12) return "Parola en az 12 karakter olmalı.";
  if (value.length > 128) return "Parola en fazla 128 karakter olabilir.";
  if (!/[A-ZÇĞİÖŞÜ]/.test(value) || !/[a-zçğıöşü]/.test(value) || !/\d/.test(value) || !/[^\p{L}\p{N}]/u.test(value)) return "Parola büyük harf, küçük harf, rakam ve özel karakter içermeli.";
  return null;
}

export function hashPassword(password) {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, saltHex, hashHex] = String(encoded).split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(String(password), Buffer.from(saltHex, "hex"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function generateTemporaryPassword() {
  return `Kz!${randomBytes(14).toString("hex")}7aA`;
}
