import * as crypto from 'crypto';

export const BOG_API_URL = 'https://api.bog.ge/payments/v1/ecommerce';

export const getTourPaymentsCallbackUrl = () => {
  return `${process.env.BASE_URL}/api/tours/payments/bog/callback`;
};

export const getTransfersCallbackUrl = () => {
  return `${process.env.BASE_URL}/api/transfer/payments/bog/callback`;
};

export const BOG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

export function verifyBOGSignature(body: string, signature: string): boolean {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(body, 'utf8');
    return verifier.verify(BOG_PUBLIC_KEY, signature, 'base64');
  } catch {
    return false;
  }
}

/**
 * Turn a BOG reject reason into a human-readable message.
 * BOG sends "expiration" for abandoned sessions; other reasons
 * (e.g. "Payment declined by the acquirer bank") are already readable.
 */
export function humanizeBogRejectReason(reason: string | null | undefined) {
  if (!reason) return null;
  if (reason === 'expiration') {
    return 'Session expired — customer did not complete the payment';
  }
  return reason;
}

/**
 * Extract the failure reason from a stored BOG callback payload,
 * preferring the explicit rejection column where a module has one.
 */
export function extractBogFailureReason(
  callbackData: unknown,
  rejectionReason?: string | null,
): string | null {
  if (rejectionReason) return humanizeBogRejectReason(rejectionReason);
  const cb = callbackData as {
    reject_reason?: string;
    payment_detail?: { code?: string; code_description?: string };
  } | null;
  return humanizeBogRejectReason(
    cb?.payment_detail?.code_description || cb?.reject_reason,
  );
}
