module.exports = {
  neo_MarchantCode      : process.env.NEO_PAYMENT_MERCHANT_CODE || "",
  neo_SecretKey         : process.env.NEO_PAYMENT_SECRET_KEY   || "",
  neo_ClientId          : process.env.NEO_CLIENT_ID || "",
  neo_ClientSecret      : process.env.NEO_CLIENT_SECRET || "",
  neo_OApiUrl           : process.env.NEO_OAPI_URL || "",
  neo_Url               : process.env.NEO_PAYMENT_URL || "",
  neo_ReturnUrl         : process.env.PAYMENT_RETURN_URL || "",
  neo_Ipn               : process.env.PAYMENT_IPN_URL || "",
  client_Url_Payment_Success            : process.env.CLIENT_URL_REDIRECT_PAYMENT_SUCCESS || "",
  client_Url_Payment_Failed            : process.env.CLIENT_URL_REDIRECT_PAYMENT_FAILED || "",
}
