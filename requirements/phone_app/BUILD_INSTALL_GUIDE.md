# Phone App Build And Installation Guide

This guide explains how to get the Expo phone app onto a real phone for personal testing.

The phone app lives in:

```bash
phone_app/
```

## Quick Choice

Use one of these paths:

- **Fastest test on your phone:** Expo Go.
- **Installable Android app:** EAS internal distribution APK.
- **Installable iPhone app:** EAS internal distribution, TestFlight, or an Apple developer device build.

For early personal testing, start with Expo Go. Use an installable build when you want the app on your phone without keeping the development server running.

## Prerequisites

Install Node.js and npm on the computer that will run the project.

From the repository root:

```bash
cd phone_app
npm install
```

Check that the app still builds at the TypeScript/test level:

```bash
npm test -- --runInBand
npm run typecheck
```

## Option 1: Run On Your Phone With Expo Go

This is the quickest way to try the app.

1. Install **Expo Go** on the phone from the iOS App Store or Google Play Store.
2. Start the Expo development server:

```bash
cd phone_app
npx expo start
```

3. Make sure the phone and computer are on the same reachable network.
4. Scan the QR code shown in the terminal or browser with Expo Go.

If the phone cannot reach the computer over local Wi-Fi, start with a tunnel:

```bash
npx expo start --tunnel
```

Notes:

- The app uses Expo SQLite, SecureStore, and Camera APIs.
- If a future dependency stops working in Expo Go, use a development build instead.
- `--localhost` is useful for local simulators, but a physical phone usually needs LAN or tunnel mode.

## Option 2: Android Installable APK

Use this when you want an Android app that can be installed directly on the phone.

1. Install and log in to EAS CLI:

```bash
npm install --global eas-cli
eas login
```

2. Configure EAS for this app:

```bash
cd phone_app
eas build:configure
```

3. Make sure `eas.json` has an internal Android APK profile. If EAS does not create one, add a profile like this:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

4. Build the APK:

```bash
eas build --platform android --profile preview
```

5. When EAS finishes, open the build URL on the Android phone and install the APK.

Android may ask you to allow installs from the browser or file manager. Only allow this for build links you trust.

## Option 3: iPhone Installable Build

iOS installation is stricter than Android. There is no casual APK-style side-load path for a normal iPhone.

Practical choices:

- **Expo Go:** easiest for development.
- **EAS internal distribution:** good for a registered personal device.
- **TestFlight:** good when you want a more normal iPhone installation flow.

For an EAS internal distribution build:

```bash
cd phone_app
npm install --global eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
```

Follow the EAS prompts for Apple credentials and device registration. After the build finishes, open the EAS install link on the iPhone.

For TestFlight, use Expo's iOS production/TestFlight flow. This requires an Apple Developer account.

## Development Build Alternative

A development build is your own installable development version of the app. It is useful when Expo Go is not enough because the app needs native configuration or custom native modules.

Typical setup:

```bash
cd phone_app
npx expo install expo-dev-client
eas build --profile development --platform android
```

Then install the resulting build on the phone and run:

```bash
npx expo start --dev-client
```

Use this later if Expo Go becomes limiting.

## Troubleshooting

### Phone Cannot Open The Expo Go App

Try:

```bash
npx expo start --tunnel
```

Also confirm the computer firewall allows Expo/Metro traffic.

### Metro Starts But React Native DevTools Fails

The app can still run if Metro is waiting for connections. In this environment, DevTools failed because a system library was missing:

```text
libnspr4.so: cannot open shared object file
```

That is a local desktop tooling issue, not an app install blocker.

### Android Build Produces AAB Instead Of APK

Android App Bundles (`.aab`) are for Google Play and cannot be directly installed on a device. Use an EAS profile with:

```json
"android": {
  "buildType": "apk"
}
```

### Camera Permission Does Not Appear

The app config includes the Expo Camera plugin and a camera permission message. If this changes, check `phone_app/app.json`.

## Useful Commands

```bash
cd phone_app
npm test -- --runInBand
npm run typecheck
npx expo start
npx expo start --tunnel
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

## References

- Expo environment setup: https://docs.expo.dev/get-started/set-up-your-environment/
- Expo Go and development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Create a development build: https://docs.expo.dev/develop/development-builds/create-a-build/
- EAS Build setup: https://docs.expo.dev/build/setup/
- EAS internal distribution: https://docs.expo.dev/build/internal-distribution/
- Android APK builds: https://docs.expo.dev/build-reference/apk/
- iOS/TestFlight production flow: https://docs.expo.dev/tutorial/eas/ios-production-build/
