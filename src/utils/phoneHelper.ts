import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalizes a phone number to E.164 format.
 * Returns null if the number is invalid.
 */
export const normalizePhoneNumber = (phone: string): string | null => {
  // If your users are mostly from one country, you can add a default 2-letter country code (e.g., 'US', 'IL')
  const phoneNumber = parsePhoneNumberFromString(phone);
  
  if (!phoneNumber || !phoneNumber.isValid()) {
    return null;
  }
  
  return phoneNumber.format('E.164');
};