/**
 * Bank of Thailand (BOT) Standard EMVCo PromptPay QR Code Generator
 * Compatible with all Thai mobile banking apps (K PLUS, SCB EASY, Krungthai NEXT, etc.)
 */

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Normalizes phone number or national ID to PromptPay target format
 */
export function formatPromptPayTarget(target: string): { type: 'phone' | 'citizenId' | 'invalid'; value: string } {
  const digits = target.replace(/\D/g, '');
  
  if (digits.length === 10 && digits.startsWith('0')) {
    // Mobile number: convert 0812345678 -> 0066812345678
    return {
      type: 'phone',
      value: `0066${digits.substring(1)}`
    };
  } else if (digits.length === 13) {
    // 13-digit National ID / Tax ID
    return {
      type: 'citizenId',
      value: digits
    };
  } else if (digits.length === 9) {
    return {
      type: 'phone',
      value: `0066${digits}`
    };
  }
  
  return { type: 'invalid', value: target };
}

/**
 * Generates an EMVCo compliant PromptPay QR Code payload string
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const parsed = formatPromptPayTarget(target);
  
  // Base fields
  let payload = '';
  payload += formatTag('00', '01'); // Format Indicator
  payload += formatTag('01', amount && amount > 0 ? '12' : '11'); // 11: Static, 12: Dynamic (amount included)
  
  // Tag 29: Merchant Account Information (PromptPay)
  let tag29 = '';
  tag29 += formatTag('00', 'A000000677010111'); // PromptPay AID
  
  if (parsed.type === 'phone') {
    tag29 += formatTag('01', parsed.value);
  } else if (parsed.type === 'citizenId') {
    tag29 += formatTag('02', parsed.value);
  } else {
    // Fallback best-effort phone formatting
    const rawDigits = target.replace(/\D/g, '');
    const formatted = rawDigits.startsWith('0') ? `0066${rawDigits.slice(1)}` : `0066${rawDigits}`;
    tag29 += formatTag('01', formatted);
  }
  payload += formatTag('29', tag29);
  
  payload += formatTag('53', '764'); // Country Currency: THB (764)
  
  // Tag 54: Amount if specified
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }
  
  payload += formatTag('58', 'TH'); // Country Code: TH
  
  // Tag 63: Checksum
  const checksumPlaceholder = payload + '6304';
  const checksum = crc16(checksumPlaceholder);
  
  return checksumPlaceholder + checksum;
}
