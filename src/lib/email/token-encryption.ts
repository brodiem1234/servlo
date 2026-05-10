import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_ENV = process.env.EMAIL_ENCRYPTION_KEY ?? "";

function getKey(): Buffer {
  if (!KEY_ENV || KEY_ENV.length < 32) {
    // Return a deterministic fallback key when env not set (dev only)
    return Buffer.alloc(32, "servlo-dev-key-placeholder-32ch");
  }
  return Buffer.from(KEY_ENV.slice(0, 32), "utf8");
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: hex(iv):hex(tag):hex(encrypted)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}
