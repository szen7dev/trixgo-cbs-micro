"use strict";

/**
 * SendGrid Template Registry
 * Maps template names to SendGrid template IDs and configurations
 */

const TEMPLATE_REGISTRY = {
  // PCM Templates
  PCM_TASK_NOTIFICATION: {
    id:
      process.env.SENDGRID_TEMPLATE_PCM_TASK ||
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    name: "PCM Task Notification",
    description:
      "Template for PCM task notifications including creation, updates, and comments",
    category: "pcm",
    version: "1.0.0",
    requiredFields: ["sender", "notice", "infoTask", "comments"],
    optionalFields: ["customMessage", "additionalData"],
  },

  // Future templates can be added here
  PCM_PROJECT_UPDATE: {
    id:
      process.env.SENDGRID_TEMPLATE_PCM_PROJECT ||
      "d-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    name: "PCM Project Update",
    description: "Template for project update notifications",
    category: "pcm",
    version: "1.0.0",
    requiredFields: ["project", "updates"],
    optionalFields: ["attachments"],
  },

  GENERAL_NOTIFICATION: {
    id:
      process.env.SENDGRID_TEMPLATE_GENERAL ||
      "d-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    name: "General Notification",
    description: "Template for general system notifications",
    category: "general",
    version: "1.0.0",
    requiredFields: ["title", "content"],
    optionalFields: ["actionUrl", "actionText"],
  },
};

/**
 * Get template configuration by name
 * @param {string} templateName - Template name from TEMPLATE_REGISTRY
 * @returns {Object|null} Template configuration or null if not found
 */
function getTemplate(templateName) {
  return TEMPLATE_REGISTRY[templateName] || null;
}

/**
 * Get template ID by name
 * @param {string} templateName - Template name from TEMPLATE_REGISTRY
 * @returns {string|null} SendGrid template ID or null if not found
 */
function getTemplateId(templateName) {
  const template = getTemplate(templateName);
  return template ? template.id : null;
}

/**
 * Get all templates by category
 * @param {string} category - Template category (e.g., 'pcm', 'general')
 * @returns {Array} Array of template configurations
 */
function getTemplatesByCategory(category) {
  return Object.entries(TEMPLATE_REGISTRY)
    .filter(([, config]) => config.category === category)
    .map(([name, config]) => ({ name, ...config }));
}

/**
 * Validate template data against required fields
 * @param {string} templateName - Template name
 * @param {Object} data - Template data to validate
 * @returns {Object} Validation result with isValid and missing fields
 */
function validateTemplateData(templateName, data) {
  const template = getTemplate(templateName);

  if (!template) {
    return {
      isValid: false,
      error: `Template '${templateName}' not found in registry`,
    };
  }

  const missingFields = template.requiredFields.filter((field) => {
    return (
      !data.hasOwnProperty(field) ||
      data[field] === null ||
      data[field] === undefined
    );
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
    template: template.name,
  };
}

/**
 * Get all available template names
 * @returns {Array} Array of template names
 */
function getAvailableTemplates() {
  return Object.keys(TEMPLATE_REGISTRY);
}

module.exports = {
  TEMPLATE_REGISTRY,
  getTemplate,
  getTemplateId,
  getTemplatesByCategory,
  validateTemplateData,
  getAvailableTemplates,
};
