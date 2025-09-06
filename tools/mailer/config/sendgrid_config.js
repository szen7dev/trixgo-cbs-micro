"use strict";

/**
 * SendGrid Configuration Module
 *
 * This module provides configuration settings for SendGrid email service.
 * It reads API key and other settings from environment variables for security.
 */

module.exports = {
  // SendGrid API Key - REQUIRED
  // Set SENDGRID_API_KEY environment variable
  apiKey: process.env.SENDGRID_API_KEY || "",

  // Default sender information
  defaultSender: {
    email: process.env.SENDGRID_SENDER_EMAIL || "no-reply@trixgo.com",
    name: process.env.SENDGRID_SENDER_NAME || "Trixgo Platform",
  },

  // SendGrid API endpoint (usually doesn't need to be changed)
  apiEndpoint: "https://api.sendgrid.com/v3/mail/send",

  // Rate limiting settings
  rateLimiting: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
  },

  // Validation settings
  validation: {
    maxRecipients: 1000,
    maxSubjectLength: 998,
    maxContentLength: 1000000, // 1MB
  },

  // Template settings
  templates: {
    // Add your template IDs here
    // welcome: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    // passwordReset: 'd-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
  },
};
