import type { DesktopPairingPayload } from '../domain/types';

const APP_ID = 'obsidian-notetaker';

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }

  return value.trim();
}

export function parsePairingPayload(raw: string): DesktopPairingPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Pairing QR is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Pairing QR is not an object.');
  }

  const payload = parsed as Record<string, unknown>;

  if (payload.app !== APP_ID) {
    throw new Error('Pairing QR is not for this app.');
  }

  if (payload.v !== 1) {
    throw new Error('Unsupported pairing QR version.');
  }

  const port = payload.port;
  if (!Number.isInteger(port) || typeof port !== 'number' || port < 1 || port > 65535) {
    throw new Error('Pairing QR has an invalid port.');
  }

  return {
    v: 1,
    app: APP_ID,
    desktop_id: requireString(payload.desktop_id, 'Pairing QR is missing desktop id.'),
    desktop_name: requireString(payload.desktop_name, 'Pairing QR is missing desktop name.'),
    host: requireString(payload.host, 'Pairing QR is missing host.'),
    port,
    pairing_id: requireString(payload.pairing_id, 'Pairing QR is missing pairing id.'),
    pairing_secret: requireString(payload.pairing_secret, 'Pairing QR is missing pairing secret.'),
    desktop_fingerprint: requireString(
      payload.desktop_fingerprint,
      'Pairing QR is missing desktop fingerprint.',
    ),
  };
}
