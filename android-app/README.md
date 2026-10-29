# BunkMeter for Android

This Android wrapper opens the existing BunkMeter website inside a native Android WebView.

## Build an APK in GitHub Actions

1. Push or merge the `android-app` branch.
2. Open the repository's **Actions** tab.
3. Run **Build BunkMeter Android APK** (or wait for the workflow after a push).
4. Open the successful workflow run and download the `BunkMeter-debug-apk` artifact.
5. Extract the ZIP and install `app-debug.apk` on your Android phone. You may need to allow installation from that source.

## Important

- Internet is required because this first version loads the hosted website.
- The calculator does not require a login or backend.
- This is a debug APK for testing, not a signed release build for Google Play.
- Confirm GitHub Pages is enabled and the URL in `MainActivity.java` is correct before building.
