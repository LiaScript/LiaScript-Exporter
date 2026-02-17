# Docker image for Android export with Play Store signing support 

# Base image with Java 21 for Android SDK and Gradle
FROM eclipse-temurin:21-jdk-jammy

# Limit Java memory usage (adjust values as needed)
#ENV JAVA_OPTS="-Xmx256m -Xms128m -XX:MaxMetaspaceSize=128m"
#ENV GRADLE_OPTS="-Xmx256m -Xms128m -XX:MaxMetaspaceSize=128m -Dorg.gradle.daemon=false -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=1 -Dorg.gradle.jvmargs=-Xmx256m"

ARG ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}
ENV ANDROID_HOME=${ANDROID_SDK_ROOT}
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/build-tools/34.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget unzip git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Android SDK command line tools
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools \
    && mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip

# Accept licenses + install required SDK packages (adjust as needed)
RUN yes | sdkmanager --licenses
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "platforms;android-36" \
    "build-tools;34.0.0" \
    "build-tools;35.0.0"

# ---- Install Node.js 24.x (NodeSource) ----
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    git \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the dist folder
COPY dist/ ./dist/

# Pre-cache Capacitor dependencies for Android builds
RUN mkdir -p dist/capacitor-cache && \
    cd dist/capacitor-cache && \
    echo '{"dependencies":{"@capacitor/cli":"^8.0.0","@capacitor-community/text-to-speech":"git+https://github.com/capacitor-community/text-to-speech.git#v8.0.0","@capacitor/android":"^8.0.0","@capacitor/assets":"^3.0.5","@capacitor/core":"^8.0.0"}}' > package.json && \
    npm install && \
    echo "import type { CapacitorConfig } from '@capacitor/cli'; const config: CapacitorConfig = { appId: 'io.liascript.course', appName: 'App', webDir: 'www' }; export default config;" > capacitor.config.ts && \
    mkdir -p www && \
    cp -r ../assets/capacitor/* www/ && \
    cp -r ../assets/common/* www/ && \
    npx cap add android && \
    cd android && \
    ./gradlew assembleDebug && \
    cd .. && \
    rm -rf www android capacitor.config.ts

# Install Puppeteer's Chrome explicitly
RUN npx puppeteer browsers install chrome

# Find and set the Chrome executable path
RUN CHROME_PATH=$(find /root/.cache/puppeteer -name chrome -type f | head -n 1) && \
    echo "export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /etc/profile.d/puppeteer.sh && \
    echo "Chrome installed at: $CHROME_PATH" && \
    chmod +x /etc/profile.d/puppeteer.sh

# Create directory for keystore (to be mounted as volume for Play Store builds)
RUN mkdir -p /keystore

# Create entrypoint script with keystore support for signed Android builds
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Set Puppeteer executable path\n\
export PUPPETEER_EXECUTABLE_PATH=$(find /root/.cache/puppeteer -name chrome -type f | head -n 1)\n\
\n\
# Check for keystore configuration when building release\n\
if [[ "$*" == *"--android-bundle"* ]] || [[ "$*" == *"--android-release"* ]]; then\n\
  if [ -z "$KEYSTORE_FILE" ] && [ ! -f "/keystore/release.keystore" ]; then\n\
    echo "Warning: No keystore found. Set KEYSTORE_FILE env var or mount keystore to /keystore/release.keystore"\n\
  fi\n\
  \n\
  # Export signing environment variables if not already set\n\
  export KEYSTORE_FILE=${KEYSTORE_FILE:-/keystore/release.keystore}\n\
  export KEYSTORE_PASSWORD=${KEYSTORE_PASSWORD:-}\n\
  export KEY_ALIAS=${KEY_ALIAS:-release}\n\
  export KEY_PASSWORD=${KEY_PASSWORD:-}\n\
fi\n\
\n\
# Execute the main application\n\
exec node /app/dist/index.js "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["sh", "-c", "node /app/dist/index.js serve --port ${PORT:-4000}"]