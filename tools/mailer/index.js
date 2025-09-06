"use strict";

/**
 * Mailer Module Index
 *
 * This file provides a unified interface for all email sending functionality,
 * including both the legacy Nodemailer implementation and the new SendGrid implementation.
 *
 * Usage:
 * const mailer = require('./tools/mailer');
 *
 * // Use SendGrid (recommended)
 * const result = await mailer.sendGrid.sendMail(to, subject, content);
 *
 * // Use legacy Nodemailer (for backward compatibility)
 * mailer.nodemailer(to, subject, content, callback);
 */

// Import SendGrid mailer
const sendGridMailer = require("./sendgrid_mailer");

// Import legacy Nodemailer (for backward compatibility)
const nodemailer = require("./mailer");

/**
 * Unified Mailer Interface
 */
class UnifiedMailer {
  constructor() {
    this.sendGrid = sendGridMailer;
    this.nodemailer = nodemailer;
  }

  /**
   * Send email using the recommended SendGrid service
   * @param {string|Array} to - Recipient email(s)
   * @param {string} subject - Email subject
   * @param {string} content - Email content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  async send(to, subject, content, options = {}) {
    return this.sendGrid.sendMail(to, subject, content, options);
  }

  /**
   * Send template email using SendGrid
   * @param {string|Array} to - Recipient email(s)
   * @param {string} templateId - SendGrid template ID
   * @param {Object} templateData - Template data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  async sendTemplate(to, templateId, templateData = {}, options = {}) {
    return this.sendGrid.sendDynamicTemplateMail(
      to,
      templateId,
      templateData,
      options
    );
  }

  /**
   * Send bulk emails using SendGrid
   * @param {Array} recipients - Recipients with template data
   * @param {string} templateId - SendGrid template ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  async sendBulk(recipients, templateId, options = {}) {
    return this.sendGrid.sendBulkTemplateMail(recipients, templateId, options);
  }

  /**
   * Legacy method for backward compatibility
   * Wraps the old callback-based nodemailer function with Promise
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} content - Email content
   * @param {string} from - Sender email (optional)
   * @returns {Promise<Object>} Delivery status
   */
  async sendLegacy(to, subject, content, from) {
    return new Promise((resolve, reject) => {
      try {
        this.nodemailer(
          to,
          subject,
          content,
          (result) => {
            if (result.error) {
              resolve({
                success: false,
                error: result.message,
                legacy: true,
              });
            } else {
              resolve({
                success: true,
                message: result.message,
                legacy: true,
              });
            }
          },
          from
        );
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          legacy: true,
        });
      }
    });
  }

  /**
   * Get mailer configuration and status
   * @returns {Object} Configuration information
   */
  getConfig() {
    return {
      sendGrid: {
        available: !!process.env.SENDGRID_API_KEY,
        senderEmail: process.env.SENDGRID_SENDER_EMAIL || "Not configured",
        senderName: process.env.SENDGRID_SENDER_NAME || "Not configured",
      },
      nodemailer: {
        available: !!process.env.MAILER_SENDER,
        service: process.env.MAILER_HOST || "Gmail",
        senderEmail: process.env.MAILER_SENDER || "Not configured",
      },
      recommended: "sendGrid",
    };
  }

  /**
   * Test email configuration
   * @param {string} testEmail - Email to send test to
   * @returns {Promise<Object>} Test results
   */
  async testConfiguration(testEmail = "test@example.com") {
    const results = {
      sendGrid: null,
      nodemailer: null,
    };

    // Test SendGrid
    try {
      if (process.env.SENDGRID_API_KEY) {
        const sendGridResult = await this.send(
          testEmail,
          "SendGrid Test Email",
          "<h1>SendGrid Test</h1><p>This is a test email from SendGrid mailer.</p>"
        );
        results.sendGrid = {
          success: sendGridResult.success,
          message: sendGridResult.success
            ? "SendGrid test successful"
            : sendGridResult.error,
        };
      } else {
        results.sendGrid = {
          success: false,
          message: "SendGrid API key not configured",
        };
      }
    } catch (error) {
      results.sendGrid = {
        success: false,
        message: `SendGrid test failed: ${error.message}`,
      };
    }

    // Test Nodemailer
    try {
      if (process.env.MAILER_SENDER) {
        const nodemailerResult = await this.sendLegacy(
          testEmail,
          "Nodemailer Test Email",
          "<h1>Nodemailer Test</h1><p>This is a test email from Nodemailer.</p>"
        );
        results.nodemailer = {
          success: nodemailerResult.success,
          message: nodemailerResult.success
            ? "Nodemailer test successful"
            : nodemailerResult.error,
        };
      } else {
        results.nodemailer = {
          success: false,
          message: "Nodemailer configuration not found",
        };
      }
    } catch (error) {
      results.nodemailer = {
        success: false,
        message: `Nodemailer test failed: ${error.message}`,
      };
    }

    return results;
  }
}

// Create singleton instance
const unifiedMailer = new UnifiedMailer();

// Export everything for maximum flexibility
module.exports = {
  // Unified interface (recommended)
  ...unifiedMailer,

  // Direct access to SendGrid functionality
  sendGrid: sendGridMailer,

  // Legacy Nodemailer for backward compatibility
  nodemailer: nodemailer,

  // Convenience functions
  send: unifiedMailer.send.bind(unifiedMailer),
  sendTemplate: unifiedMailer.sendTemplate.bind(unifiedMailer),
  sendBulk: unifiedMailer.sendBulk.bind(unifiedMailer),
  sendLegacy: unifiedMailer.sendLegacy.bind(unifiedMailer),

  // Utility functions
  getConfig: unifiedMailer.getConfig.bind(unifiedMailer),
  testConfiguration: unifiedMailer.testConfiguration.bind(unifiedMailer),

  // Classes for advanced usage
  UnifiedMailer,
  SendGridMailer: sendGridMailer.SendGridMailer,
};

// For backward compatibility, also export the legacy function directly
module.exports.default = nodemailer;
