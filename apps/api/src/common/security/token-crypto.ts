import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

const deriveKey = (secret: string): Buffer => {
  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptToken = (plaintext: string, secret: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptToken = (
  encoded: string | null | undefined,
  secret: string
): string | null => {
  if (!encoded) return null;
  const [ivB64, tagB64, payloadB64] = encoded.split(":");
  if (!ivB64 || !tagB64 || !payloadB64) return null;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(payloadB64, "base64");
  const key = deriveKey(secret);

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
};
