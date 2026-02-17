# Play Store AAB Build - Quick Guide

Complete workflow to build and upload a signed Android App Bundle (AAB) to Google Play Store.

---

## 📋 Prerequisites

### 1. Create Keystore (One-time Only)
```bash
keytool -genkey -v -keystore release.keystore -alias release \
  -keyalg RSA -keysize 2048 -validity 10000
```
**⚠️ Important:** Backup your keystore securely! You'll need it for all future updates.

### 2. Organize Your Course
Put your markdown file in a clean folder (avoid large binaries or unrelated files):
```bash
mkdir -p ~/my-course
cp your-course.md ~/my-course/
# Copy any images/resources the course needs
```

### 3. Set Up Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in store listing details (title, description, screenshots)
4. Set up app category and content rating

---

## 🏗️ Build Process

### Step 1: Build Docker Image
```bash
cd ~/LiaScript-Exporter
docker build -t liascript-exporter-android .
```

### Step 2: Build Signed AAB
```bash
docker run --rm \
  -v $(pwd)/release.keystore:/keystore/release.keystore \
  -v $(pwd)/output:/output \
  -v ~/my-course:/input \
  -e KEYSTORE_PASSWORD="your-password" \
  -e KEY_PASSWORD="your-key-password" \
  liascript-exporter-android \
  --input /input/your-course.md \
  --format android \
  --output /output/my-app \
  --android-bundle \
  --android-appId "com.yourcompany.yourapp" \
  --android-appName "Your App Name"
```

**Output:** `output/my-app.aab` (ready for upload)

---

## 📤 Upload to Play Store

### Step 1: Create Release in Play Console
1. Open [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Production** → **Create new release**
4. Upload `output/my-app.aab`

### Step 2: Complete Release Details
- **Release name:** e.g., "Version 1.0.0"
- **Release notes:** Describe what's in your course
- Click **Review release**

### Step 3: Submit for Review
- Review all details
- Click **Start rollout to Production**
- Google will review your app (typically 1-3 days)

---

## 🔄 Updating Your App

When you need to update your course:

1. **Update your markdown file**
2. **Increment version** in your build (optional: add `--android-versionCode` flag)
3. **Rebuild AAB** with the same keystore and passwords
4. **Upload to Play Console** as a new release

---

## ⚙️ Configuration Options

### Required Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--android-bundle` | Build AAB instead of APK | Required for Play Store |
| `--android-appId` | Unique app identifier | `com.company.app` |
| `--android-appName` | App display name | `"My Course"` |

### Optional Flags
| Flag | Description | Default |
|------|-------------|---------|
| `--android-keystore` | Keystore file path | `/keystore/release.keystore` |
| `--android-keystorePassword` | Keystore password | From `KEYSTORE_PASSWORD` env var |
| `--android-keyPassword` | Key password | From `KEY_PASSWORD` env var |
| `--android-keyAlias` | Key alias in keystore | `release` |
| `--android-icon` | Custom app icon (1024x1024px) | LiaScript default |

---

## 🐛 Troubleshooting

### Build takes too long
- **Cause:** Large files in course directory
- **Fix:** Ensure only course files are in the input folder

### "No input defined" error
- **Cause:** Course file not mounted correctly
- **Fix:** Check `-v ~/my-course:/input` matches `--input /input/your-course.md`

### "Keystore file not found"
- **Cause:** Keystore not mounted or wrong path
- **Fix:** Verify `-v $(pwd)/release.keystore:/keystore/release.keystore`

### AAB file not created
- **Cause:** Gradle build failed
- **Fix:** Check error messages in build output, ensure passwords are correct

---

## 📚 Example: Complete Workflow

```bash
# 1. Create keystore (first time only)
keytool -genkey -v -keystore release.keystore -alias release \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Prepare course folder
mkdir -p ~/courses/intro-to-physics
cp intro-to-physics.md ~/courses/intro-to-physics/

# 3. Build Docker image
cd ~/LiaScript-Exporter
docker build -t liascript-exporter-android .

# 4. Build signed AAB
docker run --rm \
  -v $(pwd)/release.keystore:/keystore/release.keystore \
  -v $(pwd)/output:/output \
  -v ~/courses/intro-to-physics:/input \
  -e KEYSTORE_PASSWORD="mySecretPass123" \
  -e KEY_PASSWORD="mySecretPass123" \
  liascript-exporter-android \
  --input /input/intro-to-physics.md \
  --format android \
  --output /output/physics-app \
  --android-bundle \
  --android-appId "com.education.physics" \
  --android-appName "Physics 101"

# 5. Upload output/physics-app.aab to Google Play Console
```

---

## 📖 Additional Resources

- **Google Play Console:** https://play.google.com/console
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **App Signing Help:** https://developer.android.com/studio/publish/app-signing
- **LiaScript Documentation:** https://liascript.github.io