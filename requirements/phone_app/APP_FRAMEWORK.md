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
- a broad ecosystem for audio capture, local files, permissions, storage, networking, and app packaging.
- a path from early development to installable builds without switching frameworks.
- the option to use custom native modules through Expo development builds when needed.

The main technical risk is local transcription, not the ordinary app UI. Because the app needs on-device transcription, the project should validate the audio and transcription path early.

## Expo Go, Development Builds, And Production Builds

Expo supports several ways to run the same app codebase.

### Expo Go

Expo Go is a generic Expo development app installed from the app store. It can load the project's JavaScript during early development.

Use Expo Go for:

- early UI sketches.
- simple app navigation.
- basic local state experiments.
- Expo-supported APIs that do not require custom native code.

Do not rely on Expo Go as the final development environment for this project. Expo Go includes a fixed set of native modules, so it is unlikely to support the final local transcription stack.

### Development Build

A development build is the project's own native app installed on the device with development tooling enabled.

Use development builds once the app needs:

- custom native modules.
- realistic audio handling.
- on-device transcription integration.
- device behavior that should match the eventual installed app more closely.

For this project, development builds should be treated as the main development environment after the initial UI and feasibility experiments.

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

The app should keep device-specific capabilities behind small interfaces so the rest of the app is not coupled to Expo Go, development builds, or a specific native transcription package.

Important boundaries:

- audio recording service.
- temporary audio file service.
- transcription queue.
- transcription engine adapter.
- local note storage.
- desktop sync client.

The app should avoid placing transcription or file-system assumptions directly inside UI components. This keeps the codebase easier to adjust if the chosen transcription binding changes.

## Early Technical Spike

Before committing deeply to the UI, run a small feasibility spike that verifies:

- audio can be recorded on a physical Android device.
- audio can be saved as temporary working data.
- a local Whisper-family transcription path can be invoked from a React Native/Expo development build.
- the transcription result can be inserted into local text state.
- temporary audio can be deleted after successful transcription.

If iOS support remains a serious target, the same spike should later be repeated on a physical iOS device.