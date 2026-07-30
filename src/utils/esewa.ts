const crypto = require('crypto');

const generateTransactionUUID = () => {
  return `LUX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const generateEsewaFormData = ({ totalAmount, transactionUUID, productCode = 'EPAYTEST', successUrl, failureUrl }) => {
  const formattedAmount = Number(totalAmount).toFixed(2);
  const signatureString = `total_amount=${formattedAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
  const secretKey = '8gBm/:&EnhH.1/q';
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('base64');

  return {
    amount: formattedAmount,
    tax_amount: '0',
    product_service_charge: '0',
    product_delivery_charge: '0',
    total_amount: formattedAmount,
    transaction_uuid: transactionUUID,
    product_code: productCode,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature
  };
};

const verifyEsewaPayment = (data) => {
  try {
    const secretKey = '8gBm/:&EnhH.1/q';
    const signedFieldNames = data.signed_field_names;
    const signatureString = signedFieldNames
      .split(',')
      .map(field => `${field}=${data[field]}`)
      .join(',');

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureString)
      .digest('base64');

    return data.signature === expectedSignature;
  } catch (error) {
    console.error('Esewa signature verification failed:', error);
    return false;
  }
};

module.exports = {
  generateEsewaFormData,
  verifyEsewaPayment,
  generateTransactionUUID
};
export {};
