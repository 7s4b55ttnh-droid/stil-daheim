#!/bin/sh
# Baut die Android-App (APK zum Testen, AAB für Google Play) nach android/ausgabe/.
# Braucht: Java 17+, Android-SDK (ANDROID_HOME), Gradle 8.13+, Schlüssel-Datei (STIL_KEY_PROPS, liegt im privaten Erbbuch-Repo unter android/).
set -e
cd "$(dirname "$0")"
: "${STIL_KEY_PROPS:=/home/claude/erbbuch-/android/stil-daheim-schluessel.properties}"
export STIL_KEY_PROPS
gradle --no-daemon -q assembleRelease bundleRelease
mkdir -p ausgabe
cp app/build/outputs/apk/release/app-release.apk ausgabe/stil-daheim.apk
cp app/build/outputs/bundle/release/app-release.aab ausgabe/stil-daheim.aab
echo "fertig: android/ausgabe/stil-daheim.apk und .aab"
