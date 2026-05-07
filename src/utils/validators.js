// Input validation utilities
export const validators = {
  isValidPhoneNumber: (phone) => {
    // Match Tanzania +255 format and variations
    const tanzaniaRegex = /^(\+?255|0)[\d]{9}$/;
    const cleaned = String(phone).replace(/\s|-/g, '');
    return tanzaniaRegex.test(cleaned);
  },

  normalizePhoneNumber: (phone) => {
    if (!phone) return null;
    let normalized = String(phone).replace(/\s|-|\(|\)/g, '');
    
    // Handle Tanzania numbers
    if (normalized.startsWith('0')) {
      normalized = '+255' + normalized.slice(1);
    } else if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  },

  isValidIMEI: (imei) => {
    // IMEI should be 15 digits
    return /^\d{15}$/.test(String(imei));
  },

  sanitizeInput: (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>\"']/g, '');
  },

  validateOrderId: (orderId) => {
    return orderId && String(orderId).length > 0;
  },

  validateCustomerName: (name) => {
    return name && String(name).trim().length >= 2;
  },
};

export default validators;
