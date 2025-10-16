# Booth 360 – PWA (Capacitor-ready)

## Run
npm i
npm run dev

## Build web
npm run build

## Capacitor (Android/iOS)
npm i -D @capacitor/cli @capacitor/core @capacitor/android @capacitor/ios
npx cap init "Booth 360" com.cotillonxpress.booth360 --web-dir=dist
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
