"use strict";

/**
 * Data Formatter Utility
 * Provides functions to format and transform data for email templates
 */

/**
 * Convert newlines to HTML paragraphs (similar to nl2p function)
 * @param {string} text - Text with newlines
 * @returns {string} HTML with paragraph tags
 */
function nl2p(text) {
    if (!text) return '';
    
    return text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
}

/**
 * Format text for HTML display (escape HTML and convert newlines)
 * @param {string} text - Raw text
 * @param {boolean} preserveNewlines - Whether to preserve newlines as <br>
 * @returns {string} HTML-safe formatted text
 */
function formatTextForHTML(text, preserveNewlines = true) {
    if (!text) return '';
    
    // Escape HTML characters
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    // Convert newlines to <br> if preserveNewlines is true
    if (preserveNewlines) {
        formatted = formatted.replace(/\n/g, '<br>');
    }
    
    return formatted;
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'VND')
 * @param {string} locale - Locale for formatting (default: 'vi-VN')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
    if (amount === null || amount === undefined) return '';
    
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        // Fallback formatting
        return `${amount.toLocaleString()} ${currency}`;
    }
}

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @param {string} locale - Locale for formatting (default: 'vi-VN')
 * @returns {string} Formatted number string
 */
function formatNumber(number, locale = 'vi-VN') {
    if (number === null || number === undefined) return '';
    
    return number.toLocaleString(locale);
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text || '';
    
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code (default: '+84')
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone, countryCode = '+84') {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format Vietnamese phone numbers
    if (countryCode === '+84' && cleaned.length >= 9) {
        if (cleaned.startsWith('84')) {
            return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
        } else if (cleaned.startsWith('0')) {
            return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
        }
    }
    
    return phone; // Return original if can't format
}

/**
 * Format address for display
 * @param {Object} address - Address object
 * @returns {string} Formatted address string
 */
function formatAddress(address) {
    if (!address) return '';
    
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
}

/**
 * Generate initials from full name
 * @param {string} fullName - Full name
 * @param {number} maxInitials - Maximum number of initials (default: 2)
 * @returns {string} Initials
 */
function generateInitials(fullName, maxInitials = 2) {
    if (!fullName) return '';
    
    return fullName
        .split(' ')
        .filter(name => name.length > 0)
        .slice(0, maxInitials)
        .map(name => name.charAt(0).toUpperCase())
        .join('');
}

/**
 * Format duration in human readable format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0 seconds';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value (default: 100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, total = 100, decimals = 1) {
    if (value === null || value === undefined || total === 0) return '0%';
    
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * Clean and format email address
 * @param {string} email - Email address
 * @returns {string} Cleaned email address
 */
function formatEmail(email) {
    if (!email) return '';
    
    return email.toLowerCase().trim();
}

/**
 * Format priority level for display
 * @param {number|string} priority - Priority level (1-5 or low/medium/high)
 * @returns {Object} Priority display object with text and color
 */
function formatPriority(priority) {
    const priorityMap = {
        1: { text: 'Very Low', color: '#28a745', badge: 'success' },
        2: { text: 'Low', color: '#6c757d', badge: 'secondary' },
        3: { text: 'Medium', color: '#ffc107', badge: 'warning' },
        4: { text: 'High', color: '#fd7e14', badge: 'warning' },
        5: { text: 'Very High', color: '#dc3545', badge: 'danger' },
        'low': { text: 'Low', color: '#6c757d', badge: 'secondary' },
        'medium': { text: 'Medium', color: '#ffc107', badge: 'warning' },
        'high': { text: 'High', color: '#dc3545', badge: 'danger' }
    };
    
    return priorityMap[priority] || { text: 'Unknown', color: '#6c757d', badge: 'secondary' };
}

/**
 * Format status for display
 * @param {string} status - Status string
 * @returns {Object} Status display object with text and color
 */
function formatStatus(status) {
    if (!status) return { text: 'Unknown', color: '#6c757d', badge: 'secondary' };
    
    const statusMap = {
        'pending': { text: 'Pending', color: '#ffc107', badge: 'warning' },
        'in_progress': { text: 'In Progress', color: '#17a2b8', badge: 'info' },
        'completed': { text: 'Completed', color: '#28a745', badge: 'success' },
        'cancelled': { text: 'Cancelled', color: '#dc3545', badge: 'danger' },
        'on_hold': { text: 'On Hold', color: '#6c757d', badge: 'secondary' },
        'review': { text: 'Under Review', color: '#fd7e14', badge: 'warning' },
        'approved': { text: 'Approved', color: '#28a745', badge: 'success' },
        'rejected': { text: 'Rejected', color: '#dc3545', badge: 'danger' }
    };
    
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return statusMap[normalizedStatus] || { text: status, color: '#6c757d', badge: 'secondary' };
}

module.exports = {
    nl2p,
    formatTextForHTML,
    formatFileSize,
    formatCurrency,
    formatNumber,
    truncateText,
    formatPhoneNumber,
    formatAddress,
    generateInitials,
    formatDuration,
    formatPercentage,
    formatEmail,
    formatPriority,
    formatStatus
};