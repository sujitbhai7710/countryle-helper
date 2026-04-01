import CryptoJS from 'crypto-js';

const AES_KEY = '4%w!KpB+?FC<P9W*';

export function decryptCountryId(encryptedId: string): number {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedId, AES_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return parseInt(decrypted, 10);
  } catch (error) {
    console.error('Failed to decrypt country ID:', error);
    return -1;
  }
}

export function encryptCountryId(countryId: number): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(countryId.toString(), AES_KEY);
    return encrypted.toString();
  } catch (error) {
    console.error('Failed to encrypt country ID:', error);
    return '';
  }
}
