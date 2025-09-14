"use strict";

const { getTemplate, validateTemplateData } = require('./template_registry');

/**
 * Template Configuration Utilities
 * Provides helper functions for template management and configuration
 */

/**
 * Default template settings
 */
const DEFAULT_SETTINGS = {
    // Default sender information
    defaultSender: {
        email: process.env.SENDGRID_SENDER_EMAIL || 'noreply@trixgo.com',
        name: process.env.SENDGRID_SENDER_NAME || 'TRIXGO System'
    },
    
    // Default template settings
    templateSettings: {
        trackClicks: true,
        trackOpens: true,
        subscriptionTracking: {
            enable: false
        },
        clickTracking: {
            enable: true,
            enableText: false
        },
        openTracking: {
            enable: true,
            substitutionTag: '%open-track%'
        }
    },
    
    // Branding settings
    branding: {
        companyName: 'TRIXGO',
        companyUrl: 'https://trixgo.com',
        appUrl: 'https://app.trixgo.com',
        logoUrl: process.env.AWS_BUCKET_URL ? `${process.env.AWS_BUCKET_URL}/files/branding/logo.png` : 'https://trx-main.sgp1.cdn.digitaloceanspaces.com//files/branding/logo.png',
        supportEmail: 'support@trixgo.com',
        unsubscribeUrl: 'https://app.trixgo.com/unsubscribe'
    },
    
    // Common styling
    styling: {
        primaryColor: '#4267b2',
        secondaryColor: '#1B75D0',
        backgroundColor: '#f8f9fa',
        textColor: '#333333',
        linkColor: '#0066ff',
        borderRadius: '4px',
        fontFamily: 'Arial, sans-serif'
    }
};

/**
 * Get template configuration with defaults
 * @param {string} templateName - Template name
 * @param {Object} customConfig - Custom configuration to merge
 * @returns {Object} Complete template configuration
 */
function getTemplateConfig(templateName, customConfig = {}) {
    const template = getTemplate(templateName);
    
    if (!template) {
        throw new Error(`Template '${templateName}' not found`);
    }
    
    return {
        template,
        settings: {
            ...DEFAULT_SETTINGS,
            ...customConfig
        }
    };
}

/**
 * Prepare template data with common fields
 * @param {string} templateName - Template name
 * @param {Object} data - Template data
 * @param {Object} options - Additional options
 * @returns {Object} Prepared template data
 */
function prepareTemplateData(templateName, data, options = {}) {
    // Validate template data
    const validation = validateTemplateData(templateName, data);
    if (!validation.isValid) {
        throw new Error(`Template data validation failed: ${validation.error || `Missing fields: ${validation.missingFields.join(', ')}`}`);
    }
    
    const config = getTemplateConfig(templateName, options.config);
    
    // Add common template variables
    const templateData = {
        ...data,
        // Branding information
        branding: config.settings.branding,
        // Styling information
        styling: config.settings.styling,
        // System information
        system: {
            timestamp: new Date().toISOString(),
            year: new Date().getFullYear(),
            appName: 'TRIXGO',
            version: '1.0.0'
        },
        // AWS/CDN links
        cdn: {
            baseUrl: process.env.AWS_BUCKET_URL || 'https://trx-main.sgp1.cdn.digitaloceanspaces.com/',
            filesPath: '/files/db/users/',
            brandingPath: '/files/branding/'
        }
    };
    
    return templateData;
}

/**
 * Format user information for templates
 * @param {Object} user - User object
 * @returns {Object} Formatted user information
 */
function formatUserInfo(user) {
    if (!user) return null;
    
    const cdnBaseUrl = process.env.AWS_BUCKET_URL || 'https://trx-main.sgp1.cdn.digitaloceanspaces.com/';
    
    return {
        id: user._id || user.id,
        fullname: user.fullname || user.name || 'Unknown User',
        email: user.email || '',
        image: user.image ? `${cdnBaseUrl}/files/db/users/${user.image}` : null,
        avatar: user.image ? `${cdnBaseUrl}/files/db/users/${user.image}` : `${cdnBaseUrl}/files/branding/default-avatar.png`
    };
}

/**
 * Format date for templates
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'datetime')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'datetime') {
    if (!date) return '';
    
    const dateObj = new Date(date);
    
    switch (format) {
        case 'short':
            return dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
        case 'long':
            return dateObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'datetime':
        default:
            return dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            });
    }
}

/**
 * Generate action URL for templates
 * @param {string} type - Action type ('task', 'project', 'general')
 * @param {string} id - Resource ID
 * @param {Object} params - Additional URL parameters
 * @returns {string} Complete action URL
 */
function generateActionUrl(type, id, params = {}) {
    const baseUrl = process.env.APP_BASE_URL || 'https://app.trixgo.com';
    
    let path = '';
    switch (type) {
        case 'task':
        case 'pcm':
            path = `/pcm/detail/${id}`;
            break;
        case 'project':
            path = `/projects/${id}`;
            break;
        case 'mobile-task':
            path = `/mobile/pcm/${id}`;
            break;
        default:
            path = `/${type}/${id}`;
    }
    
    // Add query parameters if provided
    const queryString = Object.keys(params).length > 0 
        ? '?' + new URLSearchParams(params).toString()
        : '';
    
    return `${baseUrl}${path}${queryString}`;
}

module.exports = {
    DEFAULT_SETTINGS,
    getTemplateConfig,
    prepareTemplateData,
    formatUserInfo,
    formatDate,
    generateActionUrl
};