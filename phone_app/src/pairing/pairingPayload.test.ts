import { parsePairingPayload } from './pairingPayload';

const validPayload = {
  v: 1,
  app: 'obsidian-notetaker',
  desktop_id: 'desktop-1',
  desktop_name: 'Studio Mac',
  host: '192.168.1.20',
  port: 4817,
  pairing_id: 'pairing-abc',
  pairing_secret: 'secret-xyz',
  desktop_fingerprint: 'fingerprint-123',
};

test('parses a valid JSON pairing payload', () => {
  expect(parsePairingPayload(JSON.stringify(validPayload))).toEqual(validPayload);
});

test('rejects payloads for another app', () => {
  expect(() =>
    parsePairingPayload(JSON.stringify({ ...validPayload, app: 'other-app' })),
  ).toThrow('Pairing QR is not for this app.');
});

test('rejects unsupported payload versions', () => {
  expect(() => parsePairingPayload(JSON.stringify({ ...validPayload, v: 2 }))).toThrow(
    'Unsupported pairing QR version.',
  );
});

test('rejects a missing host', () => {
  expect(() => parsePairingPayload(JSON.stringify({ ...validPayload, host: '' }))).toThrow(
    'Pairing QR is missing host.',
  );
});

test('rejects an invalid port', () => {
  expect(() => parsePairingPayload(JSON.stringify({ ...validPayload, port: 70000 }))).toThrow(
    'Pairing QR has an invalid port.',
  );
});

test('rejects malformed JSON', () => {
  expect(() => parsePairingPayload('{')).toThrow('Pairing QR is not valid JSON.');
});
