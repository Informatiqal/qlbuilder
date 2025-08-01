import { homedir } from "os";
import { readFileSync } from "fs";
import crypto from "crypto";

export const marker = "111111";

export function encryptText(text: string, secret: string) {
  const key = crypto.scryptSync(secret, "salt", 24);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-192-cbc", key, iv);

  const encrypted = cipher.update(text);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);

  const encryptedData =
    finalBuffer.toString("hex") +
    "." +
    iv.toString("hex") +
    "." +
    Buffer.from(marker).toString("hex");

  return encryptedData.trim();
}

export function decryptText(encrypted: string, secret: string) {
  const encryptedSplit = encrypted.split(".");

  if (encryptedSplit.length != 3) {
    //
  }

  const encryptedData = Buffer.from(encryptedSplit[0], "hex");
  const iv = Buffer.from(encryptedSplit[1], "hex");
  const markerString = Buffer.from(encryptedSplit[2], "hex").toString();
  if (markerString != marker) {
    //
  }

  const decipher = crypto.createDecipheriv(
    "aes-192-cbc",
    crypto.scryptSync(secret, "salt", 24),
    iv
  );

  decipher.setAutoPadding(true);

  const decrypted = decipher.update(encryptedData);

  return decrypted.toString().trim();
}

export function isEncrypted(): boolean {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configContent = readFileSync(configPath).toString();

  const potentialMarker = Buffer.from(
    configContent.slice(-12),
    "hex"
  ).toString();

  if (potentialMarker == marker) return true;

  return false;
}
