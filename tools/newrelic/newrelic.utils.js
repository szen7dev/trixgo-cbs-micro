"use strict";

const newrelic = require('newrelic');

/**
 * New Relic Utility Functions
 */
module.exports = {
  /**
   * Track a database operation with New Relic
   * @param {Object} params
   * @param {String} params.collection - The MongoDB collection being accessed
   * @param {String} params.operation - The operation being performed (find, update, etc.)
   * @param {Function} params.callback - The function to execute within the segment
   */
  trackDbOperation: async ({ collection, operation, callback }) => {
    return await newrelic.startSegment(`MongoDB:${collection}:${operation}`, true, async () => {
      return await callback();
    });
  },

  /**
   * Track a Redis operation with New Relic
   * @param {Object} params
   * @param {String} params.key - The Redis key being accessed
   * @param {String} params.operation - The operation being performed (get, set, etc.)
   * @param {Function} params.callback - The function to execute within the segment
   */
  trackRedisOperation: async ({ key, operation, callback }) => {
    return await newrelic.startSegment(`Redis:${operation}:${key}`, true, async () => {
      return await callback();
    });
  },

  /**
   * Record a custom metric in New Relic
   * @param {String} name - Metric name (e.g., 'Custom/MyMetric')
   * @param {Number} value - Metric value
   */
  recordMetric: (name, value) => {
    newrelic.recordMetric(`Custom/${name}`, value);
  },

  /**
   * Add a custom attribute to the current transaction
   * @param {String} key - Attribute key
   * @param {*} value - Attribute value
   */
  addAttribute: (key, value) => {
    newrelic.addCustomAttribute(key, value);
  },

  /**
   * Create a custom transaction
   * @param {String} name - Transaction name
   * @param {Function} callback - Function to execute within the transaction
   */
  createTransaction: async (name, callback) => {
    return await newrelic.startWebTransaction(name, async () => {
      return await callback();
    });
  },

  /**
   * Record an error in New Relic
   * @param {Error} error - Error object
   * @param {Object} customParams - Custom parameters to include with the error
   */
  noticeError: (error, customParams = {}) => {
    newrelic.noticeError(error, customParams);
  },
  
  /**
   * Create a custom event in New Relic Insights
   * @param {String} eventType - Event type (name)
   * @param {Object} attributes - Event attributes
   */
  recordCustomEvent: (eventType, attributes) => {
    newrelic.recordCustomEvent(eventType, attributes);
  }
};