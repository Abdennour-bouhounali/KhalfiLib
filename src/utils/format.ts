/**
 * Utility functions for formatting data consistently across the app.
 */

/**
 * Ensures numbers are displayed using Latin digits (0-9).
 * This forces en-US/en-UK style numbering even in Arabic locale.
 */
export const formatNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '';
    const n = typeof num === 'string' ? num : num.toString();

    // Convert Arabic/Eastern digits to Latin digits just in case
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.split('').map(char => {
        const index = arabicDigits.indexOf(char);
        return index !== -1 ? index.toString() : char;
    }).join('');
};

/**
 * Formats a phone number consistently.
 */
export const formatPhone = (phone: string): string => {
    return formatNumber(phone);
};

/**
 * Formats a date object or string into DD-MM-YYYY using Latin digits.
 */
export const formatDate = (date: Date | string): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return formatNumber(date.toString());

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return formatNumber(`${day}-${month}-${year}`);
};
