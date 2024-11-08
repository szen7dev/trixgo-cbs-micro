const {
  renderStatusCodeAndResponse,
} = require("../../../tools/utils/status_code");
const ZALO_MODEL = require("../model/zalo.model").MODEL;

module.exports = {
  sendMessage: {
    params: {
      text: { type: "string" },
      appId: { type: "string" },
      userId: { type: "string" },
    },
    async handler(ctx) {
      try {
        const { text, userId, appId } = ctx.params;
        const resultAfterCallHandler = await ZALO_MODEL.sendMessage({
          text,
          userId,
          appId,
          cacher: this.broker.cacher,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },

  sendMessageZNS: {
    params: {
      phone: { type: "string" },
      templateData: { type: "object" },
      templateId: { type: "string", optional: true },
      appId: { type: "string" },
    },
    async handler(ctx) {
      try {
        const { phone, templateData, templateId, appId } = ctx.params;
        const resultAfterCallHandler = await ZALO_MODEL.sendMessageZNS({
          phone,
          templateData,
          templateId,
          appId,
          cacher: this.broker.cacher,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },

  requestZaloOAPermission: {
    async handler(ctx) {
      try {
        const { appId } = ctx.params;

        const resultAfterCallHandler = await ZALO_MODEL.generateUrlRequest({
          cacher: this.broker.cacher,
          appId,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },

  renewAccessToken: {
    params: {
      appId: { type: "string" },
      isCache: { type: "boolean" },
    },
    async handler(ctx) {
      try {
        const resultAfterCallHandler = await ZALO_MODEL.renewAccessToken({
          appId,
          isCache: ctx.params.isCache,
          cacher: this.broker.cacher,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },

  zaloOACallback: {
    // params: {
    //   oa_id: { type: "string" },
    //   code: { type: "string" },
    //   code_challenge: { type: "string" },
    //   state: { type: "string" },
    // },
    async handler(ctx) {
      try {
        const { code_challenge, code, state } = ctx.params;
        const resultAfterCallHandler = await ZALO_MODEL.requestToken({
          code_challenge,
          authCode: code,
          state,
          ctx,
          cacher: this.broker.cacher,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },

  zaloOAWebhook: {
    params: {
      oa_id: { type: "string" },
      source: { type: "string" },
      event_name: { type: "string" },
      timestamp: { type: "string" },
      follower: { type: "object" },
    },
    async handler(ctx) {
      try {
        const { oa_id, source, follower, event_name, timestamp } = ctx.params;

        const resultAfterCallHandler = await ZALO_MODEL.handleWebhookFollower({
          oaId: oa_id,
          source,
          followerId: follower.id,
          eventName: event_name,
          timestamp,
          cacher: this.broker.cacher,
        });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return renderStatusCodeAndResponse({
          ctx,
          error_message: error.message,
        });
      }
    },
  },
};
