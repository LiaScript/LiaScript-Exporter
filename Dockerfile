# Android builds currently work well with JDK 17 for modern AGP
FROM eclipse-temurin:17-jdk-jammy

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
    "build-tools;34.0.0"

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

# Install prod deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Install Puppeteer's Chrome explicitly
RUN npx puppeteer browsers install chrome

# Find and set the Chrome executable path
RUN CHROME_PATH=$(find /root/.cache/puppeteer -name chrome -type f | head -n 1) && \
    echo "export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /etc/profile.d/puppeteer.sh && \
    echo "Chrome installed at: $CHROME_PATH" && \
    chmod +x /etc/profile.d/puppeteer.sh

COPY dist/ liascript-exporter/

# Create entrypoint script that sources the environment
RUN echo '#!/bin/sh\n\
    export PUPPETEER_EXECUTABLE_PATH=$(find /root/.cache/puppeteer -name chrome -type f | head -n 1)\n\
    exec node liascript-exporter/index.js "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["serve", "--port", "4000"]