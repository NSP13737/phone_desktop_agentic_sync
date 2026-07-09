# Phone App Framework Decision

This document records the phone app framework decision for v1 planning.

## Decision

Use **React Native with Expo** for the phone app.

The app should be planned as a single cross-platform codebase for Android and iOS. Expo should be used for project tooling, development builds, native app builds, and eventual distribution packaging.

This decision fits the project goal: a practical personal tool, not a polished product or a framework experiment.

## Why This Framework

React Native with Expo gives the project:

- one app codebase for Android and iOS.
- a TypeScript/React development model that should be approachable and easy to iterate on.
- a broad ecosystem for storage, networking, permissions, camera access for QR pairing, and app packaging.
- a path from early development to installable builds without switching frameworks.
- the option to use custom native modules through Expo development builds if future requirements need them.

The MVP technical risk is ordinary mobile app reliability: local persistence, pairing, sync, and a fast editing experience.

## Expo Go, Development Builds, And Production Builds

Expo supports several ways to run the same app codebase.

### Expo Go

Expo Go is a generic Expo development app installed from the app store. It can load the project's JavaScript during early development.

Use Expo Go for:

- early UI sketches.
- simple app navigation.
- basic local state experiments.
- Expo-supported APIs that do not require custom native code.
- early pairing and sync client exploration when the needed APIs are available.

Expo Go may be enough for much of the typed-capture MVP. If a dependency requires native configuration that Expo Go does not include, move that work to a development build.

### Development Build

A development build is the project's own native app installed on the device with development tooling enabled.

Use development builds once the app needs:

- custom native modules.
- device behavior that should match the eventual installed app more closely.
- native configuration that Expo Go cannot provide.

Development builds are still a normal part of the Expo path, but they are no longer required up front just to prove the MVP input model.

### Production Build

A production build is the same app without development tooling.

Use production builds for:

- Android APK files for direct personal installation.
- Android App Bundle files if Google Play distribution is ever desired.
- iOS TestFlight or App Store builds if iOS distribution is ever desired.

Moving from development builds to production builds should mostly involve build profiles, signing, release configuration, app metadata, and permissions wording rather than application refactoring.

## Distribution Expectations

The framework choice should preserve these distribution options:

- Android direct install through an APK.
- Android store release through Google Play if desired later.
- iOS testing through TestFlight or device-targeted internal distribution.
- iOS App Store release if desired later.

Android direct APK distribution is expected to be the simplest personal-use route.

iOS does not have an equally casual APK-style sharing path. For iOS, plan on TestFlight, registered-device development/ad hoc installation, or the App Store if the app ever needs broader distribution.

## Implementation Guidance

The app should keep device-specific capabilities behind small interfaces so the rest of the app is not coupled to Expo Go, development builds, or a specific package.

Important boundaries:

- local note storage.
- desktop sync client.
- desktop pairing client.

The app should avoid placing storage or desktop-networking assumptions directly inside UI components.

## Early Technical Spike

Before committing deeply to the full UI, run a small feasibility spike that verifies:

- a note can be created and edited on a physical Android device.
- note text can be saved locally and recovered after app backgrounding or restart.
- QR pairing can provide desktop connection details.
- the app can send a text payload to a local desktop companion endpoint.
- the app can mark a note synced after desktop acknowledgement.

If iOS support remains a serious target, the same spike should later be repeated on a physical iOS device.
