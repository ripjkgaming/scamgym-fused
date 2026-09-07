const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|sg|net|org)\b\S*/gi;
const LONG_NUMBER_PATTERN = /(?<!\w)(?:\+?\d[\s-]?){4,}\d(?!\w)/g;
const OTP_PATTERN = /\b(?:otp|pin|password|passcode)\s*(?:is|:)?\s*[a-z0-9-]{3,}\b/gi;

export function redactSensitive(input: string) {
  const sanitized = input
    .replace(EMAIL_PATTERN, "[REDACTED]")
    .replace(URL_PATTERN, "[REDACTED]")
    .replace(OTP_PATTERN, "[REDACTED]")
    .replace(LONG_NUMBER_PATTERN, "[REDACTED]");

  return {
    text: sanitized,
    redacted: sanitized !== input,
  };
}
