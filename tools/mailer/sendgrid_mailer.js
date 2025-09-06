"use strict";

const sgMail = require("@sendgrid/mail");
const sendgridConfig = require("./config/sendgrid_config");

/**
 * SendGrid Mail Module
 *
 * A robust email sending module using SendGrid's official Node.js client
 * with comprehensive error handling, input validation, and support for
 * both basic and dynamic template emails.
 *
 * Features:
 * - Basic email sending with HTML/text content
 * - Dynamic template email sending
 * - Input validation
 * - Retry mechanism
 * - Comprehensive error handling
 * - Security best practices
 */

class SendGridMailer {
  constructor() {
    this.config = sendgridConfig;
    this.validateConfiguration();
    this.initializeSendGrid();
  }

  /**
   * Initialize SendGrid client with API key
   */
  initializeSendGrid() {
    sgMail.setApiKey(this.config.apiKey);
  }

  /**
   * Validates the SendGrid configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfiguration() {
    if (!this.config.apiKey) {
      throw new Error(
        "SendGrid API key is required. Please set SENDGRID_API_KEY environment variable."
      );
    }

    if (!this.config.defaultSender.email) {
      throw new Error(
        "Default sender email is required. Please set SENDGRID_SENDER_EMAIL environment variable."
      );
    }
  }

  /**
   * Validates email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates input parameters for sending email
   * @param {string|Array} to - Recipient email(s)
   * @param {string} subject - Email subject
   * @param {string} content - Email content
   * @throws {Error} If validation fails
   */
  validateEmailInput(to, subject, content) {
    // Validate recipients
    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 0) {
      throw new Error("At least one recipient is required");
    }

    if (recipients.length > this.config.validation.maxRecipients) {
      throw new Error(
        `Too many recipients. Maximum allowed: ${this.config.validation.maxRecipients}`
      );
    }

    recipients.forEach((email) => {
      if (!email || typeof email !== "string") {
        throw new Error("Recipient email must be a non-empty string");
      }
      if (!this.isValidEmail(email.trim())) {
        throw new Error(`Invalid email address: ${email}`);
      }
    });

    // Validate subject
    if (!subject || typeof subject !== "string") {
      throw new Error("Subject is required and must be a string");
    }

    if (subject.length > this.config.validation.maxSubjectLength) {
      throw new Error(
        `Subject too long. Maximum length: ${this.config.validation.maxSubjectLength}`
      );
    }

    // Validate content
    if (!content || typeof content !== "string") {
      throw new Error("Content is required and must be a string");
    }
  }

  /**
   * Validates input parameters for dynamic template email
   * @param {string|Array} to - Recipient email(s)
   * @param {string} templateId - SendGrid template ID
   * @param {Object} templateData - Dynamic data for template
   * @throws {Error} If validation fails
   */
  validateTemplateInput(to, templateId, templateData = {}) {
    // Validate recipients
    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 0) {
      throw new Error("At least one recipient is required");
    }

    recipients.forEach((email) => {
      if (!email || typeof email !== "string") {
        throw new Error("Recipient email must be a non-empty string");
      }
      if (!this.isValidEmail(email.trim())) {
        throw new Error(`Invalid email address: ${email}`);
      }
    });

    // Validate template ID
    if (!templateId || typeof templateId !== "string") {
      throw new Error("Template ID is required and must be a string");
    }

    // Validate template data
    if (templateData && typeof templateData !== "object") {
      throw new Error("Template data must be an object");
    }
  }

  /**
   * Formats recipients for SendGrid API
   * @param {string|Array} to - Recipient email(s)
   * @returns {Array} Formatted recipients array
   */
  formatRecipients(to) {
    const recipients = Array.isArray(to) ? to : [to];
    return recipients.map((email) => ({ email: email.trim() }));
  }

  /**
   * Handle SendGrid API responses and errors with retry logic
   * @param {Function} sendFunction - Function that sends the email
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Standardized response object
   */
  async handleSendGridRequest(sendFunction, retryCount = 0) {
    try {
      const response = await sendFunction();
      
      return {
        success: true,
        messageId: response[0]?.headers?.["x-message-id"] || "unknown",
        statusCode: response[0]?.statusCode || 202,
        message: "Email sent successfully",
      };
    } catch (error) {
      // Handle rate limiting and temporary errors with retry
      if (
        retryCount < this.config.rateLimiting.maxRetries &&
        (error.code === 429 || error.code >= 500)
      ) {
        await this.delay(
          this.config.rateLimiting.retryDelay * (retryCount + 1)
        );
        return this.handleSendGridRequest(sendFunction, retryCount + 1);
      }

      // Format error response
      const errorDetails = {
        success: false,
        error: error.message || "Unknown error occurred",
        statusCode: error.code || 0,
        details: error.response?.body || null,
      };

      if (error.response?.body?.errors) {
        errorDetails.validationErrors = error.response.body.errors;
      }

      return errorDetails;
    }
  }

  /**
   * Utility function to create delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sends a basic email with HTML or plain text content
   *
   * @param {string|Array} to - Recipient email address(es)
   * @param {string} subject - Email subject line
   * @param {string} content - Email content (HTML or plain text)
   * @param {Object} options - Additional options
   * @param {string} options.from - Sender email (optional, uses default if not provided)
   * @param {string} options.fromName - Sender name (optional)
   * @param {boolean} options.isHtml - Whether content is HTML (default: true)
   * @param {Array} options.attachments - File attachments (optional)
   * @returns {Promise<Object>} Delivery status and details
   */
  async sendMail(to, subject, content, options = {}) {
    try {
      // Validate input
      this.validateEmailInput(to, subject, content);

      // Prepare email message
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: options.from || this.config.defaultSender.email,
          name: options.fromName || this.config.defaultSender.name,
        },
        subject: subject.trim(),
        [options.isHtml !== false ? "html" : "text"]: content,
      };

      // Add attachments if provided
      if (options.attachments && Array.isArray(options.attachments)) {
        msg.attachments = options.attachments;
      }

      // Send email using @sendgrid/mail
      return await this.handleSendGridRequest(() => sgMail.send(msg));
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
      };
    }
  }

  /**
   * Sends an email using SendGrid dynamic templates
   *
   * @param {string|Array} to - Recipient email address(es)
   * @param {string} templateId - SendGrid template ID
   * @param {Object} templateData - Dynamic data for template substitution
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status and details
   */
  async sendDynamicTemplateMail(
    to,
    templateId,
    templateData = {},
    options = {}
  ) {
    try {
      // Validate input
      this.validateTemplateInput(to, templateId, templateData);

      // Prepare email message
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: options.from || this.config.defaultSender.email,
          name: options.fromName || this.config.defaultSender.name,
        },
        templateId: templateId,
        dynamicTemplateData: templateData,
      };

      // Add subject override if provided
      if (options.subject) {
        msg.subject = options.subject;
      }

      // Send email using @sendgrid/mail
      return await this.handleSendGridRequest(() => sgMail.send(msg));
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
      };
    }
  }

  /**
   * Sends bulk emails using dynamic templates (batch processing)
   *
   * @param {Array} recipients - Array of recipient objects with email and templateData
   * @param {string} templateId - SendGrid template ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status and details
   */
  async sendBulkTemplateMail(recipients, templateId, options = {}) {
    try {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new Error("Recipients array is required and must not be empty");
      }

      // Validate template ID
      if (!templateId || typeof templateId !== "string") {
        throw new Error("Template ID is required and must be a string");
      }

      // Prepare messages for each recipient
      const messages = recipients.map((recipient) => {
        if (!recipient.email || !this.isValidEmail(recipient.email)) {
          throw new Error(`Invalid email address: ${recipient.email}`);
        }

        return {
          to: recipient.email,
          from: {
            email: options.from || this.config.defaultSender.email,
            name: options.fromName || this.config.defaultSender.name,
          },
          templateId: templateId,
          dynamicTemplateData: recipient.templateData || {},
        };
      });

      // Send bulk emails using @sendgrid/mail
      return await this.handleSendGridRequest(() => sgMail.send(messages));
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
      };
    }
  }
}

// Create singleton instance
const sendGridMailer = new SendGridMailer();

// Export both the class and convenience functions
module.exports = {
  SendGridMailer,

  /**
   * Convenience function for sending basic emails
   * @param {string|Array} to - Recipient email(s)
   * @param {string} subject - Email subject
   * @param {string} content - Email content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  sendMail: (to, subject, content, options = {}) => {
    return sendGridMailer.sendMail(to, subject, content, options);
  },

  /**
   * Convenience function for sending dynamic template emails
   * @param {string|Array} to - Recipient email(s)
   * @param {string} templateId - SendGrid template ID
   * @param {Object} templateData - Template data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  sendDynamicTemplateMail: (
    to,
    templateId,
    templateData = {},
    options = {}
  ) => {
    return sendGridMailer.sendDynamicTemplateMail(
      to,
      templateId,
      templateData,
      options
    );
  },

  /**
   * Convenience function for sending bulk template emails
   * @param {Array} recipients - Recipients with template data
   * @param {string} templateId - SendGrid template ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery status
   */
  sendBulkTemplateMail: (recipients, templateId, options = {}) => {
    return sendGridMailer.sendBulkTemplateMail(recipients, templateId, options);
  },
};
