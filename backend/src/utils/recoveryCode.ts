import crypto from "crypto";

export const RECOVERY_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const normalizeRecoveryCode = (code: string) =>
  code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export const createRecoveryCode = () => {
  const raw = crypto.randomBytes(8).toString("hex").toUpperCase();
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
};
