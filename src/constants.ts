// https://simplewebauthn.dev/docs/packages/server#identifying-your-rp

// Human-readable title for your website
export const rpName = 'SimpleWebAuthn Example';
// A unique identifier for your website
export const rpID = 'localhost';
// The URL at which registrations and authentications should occur
export const origin = `http://${rpID}:3000`;
