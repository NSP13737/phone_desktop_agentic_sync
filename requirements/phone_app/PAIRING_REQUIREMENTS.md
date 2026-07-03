# Phone App Pairing Requirements

This document defines how the phone app pairs with the desktop companion for v1 planning.

Pairing is the trust bootstrap between the phone and the desktop companion. Sync is the later repeated data handoff that uses the pairing result.

## V1 Direction

Use QR-code pairing for the first connection between the phone app and the desktop companion.

The desktop companion should show a QR code. The phone app should scan that QR code, use it to contact the desktop companion on the local network, and store credentials that allow future sync without scanning again.

This should be implemented as a small project-specific pairing flow using standard building blocks, not as a broad home-automation or service-discovery framework. Libraries should still be used for QR generation, QR scanning, secure storage, HTTP, cryptographic randomness, and optional local service discovery.

The MVP should include actual pairing, not a mock-only sync path. Pairing can stay simple and local-network-only, but the first usable version should let the phone trust a desktop companion and send queued captures using stored credentials.

## Goals

- Make first setup easy for one person using their own phone and desktop.
- Avoid accounts, cloud relay infrastructure, and always-online assumptions for v1.
- Let the phone keep captures safely when the desktop is unavailable.
- Let future sync recover when the desktop IP address changes.
- Keep pairing understandable enough that an implementation agent can build and test it without reverse-engineering a large framework.

## Non-Goals

- Pairing through a cloud account.
- Syncing when the phone and desktop are on unrelated networks.
- Supporting multiple users.
- Supporting complex device management beyond one or more trusted phones.
- Solving post-sync edit conflicts. Synced notes are read-only on the phone for this iteration.

## First Pairing Flow

1. The desktop companion enters pairing mode.
2. The desktop starts a local pairing endpoint on an available port.
3. The desktop creates a short-lived one-time pairing secret.
4. The desktop displays a QR code with the pairing payload.
5. The phone scans the QR code.
6. The phone validates that the QR payload is for this app and supported by this app version.
7. The phone calls the desktop pairing endpoint using the host, port, pairing session id, and one-time secret from the QR payload.
8. The desktop validates the one-time secret.
9. The desktop shows a final confirmation before trusting the phone.
10. The phone and desktop exchange stable device identities and sync credentials.
11. The phone stores the trusted desktop identity and sync credentials.
12. The desktop stores the trusted phone identity and sync credentials.
13. The one-time pairing secret is invalidated.

## QR Payload

The QR payload should contain only the minimum information needed to complete pairing.

For v1, encode the QR payload as JSON. An app-specific URL can be added later if deep linking becomes useful.

Suggested fields:

- `v`: pairing payload version.
- `app`: app identifier, such as `obsidian-notetaker`.
- `desktop_id`: stable desktop companion id.
- `desktop_name`: human-readable desktop label.
- `host`: current local network address or hostname.
- `port`: current local pairing endpoint port.
- `pairing_id`: short-lived pairing session id.
- `pairing_secret`: high-entropy one-time secret.
- `desktop_public_key` or `desktop_fingerprint`: stable desktop identity material.

The phone should reject QR payloads with an unknown `app`, unsupported `v`, missing required fields, expired pairing session, or malformed host and port.

## Stored Pairing State

After successful pairing, the phone should store:

- trusted `desktop_id`.
- trusted `desktop_name`.
- trusted desktop public key or fingerprint.
- sync credential or token.
- last known host.
- last known port.
- last successful connection time.

The phone should store sensitive credentials in secure device storage rather than ordinary local note storage.

For v1, use a random bearer-token-style sync credential generated during pairing. Store the token in secure device storage on the phone and in the desktop companion's trusted-device store. Ordinary app storage may keep non-secret routing and display fields such as desktop name, id, last known host, and last known port.

The desktop should store:

- trusted phone id.
- phone display name if available.
- phone credential or public key.
- pairing creation time.
- last successful sync time.

## Future Sync After Pairing

Future sync should not require scanning the QR code again.

When the phone has queued captures and wants to sync, it should:

1. Try the last known host and port for the paired desktop.
2. Verify that the responding desktop matches the stored trusted desktop identity.
3. If verification succeeds, send queued text capture payloads using the stored sync credential.
4. If the last known address fails, allow manual host and port recovery or re-pairing.
5. If manual recovery reaches the paired desktop and identity verification succeeds, update the last known host and port and retry sync.
6. If recovery fails, leave captures queued locally and show that the desktop is unreachable.

For the MVP, use JSON over local HTTP for sync. The phone should send the stored sync credential in an authorization header and include its paired phone id in the request. The desktop should reject requests with missing, invalid, or revoked credentials.

For the MVP, the desktop acknowledgement means the capture was received and durably accepted by the desktop companion. It does not mean the desktop has finished processing the capture into Obsidian.

## IP Address Changes

The phone must assume the desktop's IP address can change.

Common reasons:

- the home router leases a different IP address after DHCP renewal.
- the desktop moves from home Wi-Fi to work Wi-Fi.
- the phone and desktop are on different networks.
- VPN, firewall, or guest network isolation prevents local discovery.
- the desktop companion restarts on a different port.

The stored pairing should not trust an IP address as identity. The IP address is only a route to try. The trusted desktop identity should come from the stored `desktop_id` plus public key or fingerprint.

Expected behavior when the IP changes:

1. The phone tries the last known address.
2. The connection fails or reaches the wrong service.
3. For the MVP, the user may use manual address entry or re-pairing to recover.
4. If manual recovery reaches a desktop whose identity matches the stored trusted identity, the phone updates the last known address.
5. If the paired desktop is not reachable, the phone keeps captures queued and reports that the desktop is unavailable.
6. A future version may add local service discovery before manual recovery if this becomes too annoying.

If the user moves from home to work, sync should work only if the phone and desktop are on the same reachable local network and the network allows device-to-device traffic. Otherwise, the phone should keep captures locally until the desktop is reachable again.

## Discovery Strategy

Use a layered strategy:

1. **Last known address first.** This is fastest and simplest when the desktop has not moved.
2. **Manual address fallback.** The settings screen may allow entering a host and port when discovery fails.
3. **Re-pair fallback.** If credentials are lost or the desktop identity changes intentionally, the user can scan a new QR code.
4. **Optional local service discovery later.** The desktop may eventually advertise a service name such as `_obsidian-notetaker._tcp.local`, with metadata that includes the `desktop_id`.

For the MVP, implement last-known address, manual address fallback, and re-pairing before mDNS/DNS-SD discovery. Local service discovery can be added later if manual recovery is too annoying. If discovery is added, treat it as discovery, not trust. The phone must still verify the stored desktop identity after connecting.

## Security Requirements

- Pairing secrets must be high entropy.
- Pairing secrets must expire quickly.
- Pairing secrets must be single-use.
- The desktop should stop accepting a pairing secret after successful pairing.
- Future sync must authenticate with the stored bearer-token-style credential.
- The phone should verify the desktop identity before sending captures.
- The desktop should reject unpaired phones.
- The user should be able to remove a trusted phone from the desktop companion.
- The phone should be able to forget a paired desktop.
- MVP transport may use local HTTP with token authentication on a trusted local network. Future versions may add pinned local TLS or mutual public-key request signing if needed.

## User Experience Requirements

The desktop companion should provide:

- a "Pair phone" action.
- a QR code.
- pairing status, such as waiting, paired, expired, or failed.
- a way to revoke trusted phones.

The phone app should provide:

- a "Pair desktop" action in settings or first-run setup.
- QR scanner flow.
- paired desktop status.
- last successful sync time if available.
- clear unreachable state when the desktop cannot be found.
- manual address fallback for MVP recovery.

## Implementation Building Blocks

Preferred building blocks for agents to consider:

- QR generation on desktop: a small QR generation package, such as `qrcode`.
- QR scanning on phone: Expo Camera barcode scanning.
- secure credential storage on phone: Expo SecureStore or equivalent secure storage.
- local HTTP endpoint on desktop: the desktop companion's ordinary backend/server framework.
- random ids and secrets: platform crypto APIs or Expo Crypto on phone where needed.
- bearer-token-style sync authentication for the MVP.
- optional future local discovery: mDNS/DNS-SD library on desktop and a compatible phone-side discovery approach if available in the chosen build environment.

Do not make a broad framework like Homebridge or HomeKit the center of this feature. Those ecosystems solve larger home automation problems than this app needs. A small custom pairing protocol using ordinary libraries should be easier for future agents to understand, test, and modify.

## References For Implementation Research

- Expo Camera supports barcode scanning, including QR codes, through `CameraView` and `onBarcodeScanned`.
- Expo SecureStore is the expected first place to evaluate phone-side secure credential storage.
- A small QR generation package such as `qrcode` is enough for the desktop QR image.
- mDNS/DNS-SD libraries such as `@homebridge/ciao` may be useful for local service discovery, but should not define the overall pairing architecture.

## Open Questions

- How should the desktop companion expose trusted-device management?
- Should a future version add mDNS/DNS-SD discovery after the MVP?
- Should a future version add pinned local TLS or mutual public-key request signing?
