module.exports = {
  neo_MarchantCode : process.env.NEO_PAYMENT_MERCHANT_CODE || "",
  neo_SecretKey    : process.env.NEO_PAYMENT_SECRET_KEY   || "",
  neo_Url          : process.env.NEO_PAYMENT_URL || "",
  neo_ReturnUrl    : process.env.PAYMENT_RETURN_URL || "",
  neo_IPN          : process.env.PAYMENT_IPN_URL || "",
}
