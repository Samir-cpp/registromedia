#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TEMP:?Run this setup in GitHub Actions}"
: "${GITHUB_ENV:?GitHub Actions environment file is required}"
: "${GITHUB_PATH:?GitHub Actions path file is required}"
sdk_root="$RUNNER_TEMP/registromedia-sdk"
archive="$RUNNER_TEMP/registromedia-android-tools.zip"
mkdir -p "$sdk_root/cmdline-tools" "$RUNNER_TEMP/registromedia-android-user"
curl --fail --location --retry 3 --proto '=https' --tlsv1.2 \
  https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip \
  --output "$archive"
# SHA-256 of the official archive, also verified against Google's signed-over-TLS
# repository metadata SHA-1 (5fdcc763663eefb86a5b8879697aa6088b041e70).
printf '%s  %s\n' '7ec965280a073311c339e571cd5de778b9975026cfcbe79f2b1cdcb1e15317ee' "$archive" | sha256sum --check
unzip -q "$archive" -d "$sdk_root/cmdline-tools"
mv "$sdk_root/cmdline-tools/cmdline-tools" "$sdk_root/cmdline-tools/19.0"
export ANDROID_HOME="$sdk_root"
export ANDROID_SDK_ROOT="$sdk_root"
export ANDROID_USER_HOME="$RUNNER_TEMP/registromedia-android-user"
manager="$sdk_root/cmdline-tools/19.0/bin/sdkmanager"
printf 'y\n%.0s' {1..100} > "$RUNNER_TEMP/registromedia-sdk-license-answers"
"$manager" --sdk_root="$sdk_root" --licenses < "$RUNNER_TEMP/registromedia-sdk-license-answers" > "$RUNNER_TEMP/registromedia-sdk-licenses.log"
"$manager" --sdk_root="$sdk_root" 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'
printf 'ANDROID_HOME=%s\nANDROID_SDK_ROOT=%s\nANDROID_USER_HOME=%s\n' "$sdk_root" "$sdk_root" "$ANDROID_USER_HOME" >> "$GITHUB_ENV"
printf '%s\n%s\n' "$sdk_root/cmdline-tools/19.0/bin" "$sdk_root/platform-tools" >> "$GITHUB_PATH"
