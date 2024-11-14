const token = "user_token"; // Token người dùng đăng nhập
const encoder = new TextEncoder();
export const salt = encoder.encode(token); // Token là salt

export async function deriveKeyFromToken(salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    salt, // Sử dụng token làm salt
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt, // Salt là token
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  // Tạo IV cố định từ một chuỗi cụ thể (ví dụ "static_iv_value")
  const staticIv = new TextEncoder().encode("static_iv_value").slice(0, 12); // IV cố định, đảm bảo độ dài 12 bytes

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM", // Thuật toán AES-GCM
      iv: staticIv, // IV cố định
    },
    key,
    new TextEncoder().encode(data) // Dữ liệu cần mã hóa
  );

  return encryptedData;
}

export async function decryptData(
  encryptedData: ArrayBuffer,
  key: CryptoKey
): Promise<string> {
  // Tạo IV cố định từ một chuỗi cụ thể (ví dụ "static_iv_value")
  const staticIv = new TextEncoder().encode("static_iv_value").slice(0, 12); // IV cố định, đảm bảo độ dài 12 bytes

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM", // Thuật toán AES-GCM
      iv: staticIv, // IV cố định
    },
    key,
    encryptedData // Dữ liệu đã mã hóa
  );

  return new TextDecoder().decode(decryptedData);
}
