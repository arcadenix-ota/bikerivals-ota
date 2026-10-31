# bikerivals-ota

OTA (hot update) content for the Bike Rivals Android client (Cocos Creator 3.8), published by
`BikeRivalsCocos/tools/hot-update` in the bike-rivals-cocos repo.

- `main` holds only the pointer `latest/android.json` telling clients which immutable tag to load.
- Each release is a commit on `dist-android` (the whole `android/` tree of that version) with an immutable tag
  `android-A.B.C.D`, served from `https://raw.githubusercontent.com/arcadenix-ota/bikerivals-ota/<tag>/android/`.
- The pointer is read from `raw.githubusercontent.com` (`main`), with jsDelivr `@main` as fallback.

Release order: push the content branch and tag first, check them on raw, then update the pointer on `main`.
Never rewrite or delete `android-*` tags; roll back by publishing a higher version.
