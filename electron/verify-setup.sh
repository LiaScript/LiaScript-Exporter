#!/bin/bash

# Electron Setup Verification Script
# This script checks if all prerequisites for building the Electron app are met

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  LiaScript Exporter - Electron Setup Verification         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        if [ ! -z "$2" ]; then
            VERSION=$($1 --version 2>&1 | head -n 1)
            echo "  └─ $VERSION"
        fi
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ((ISSUES++))
        if [ ! -z "$3" ]; then
            echo "  └─ Install: $3"
        fi
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        if [ ! -z "$2" ]; then
            SIZE=$(du -h "$1" | cut -f1)
            echo "  └─ Size: $SIZE"
        fi
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ((ISSUES++))
        if [ ! -z "$2" ]; then
            echo "  └─ $2"
        fi
    fi
}

# Function to check directory
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        if [ ! -z "$2" ]; then
            COUNT=$(find "$1" -type f | wc -l)
            echo "  └─ Files: $COUNT"
        fi
    else
        echo -e "${YELLOW}⚠${NC} $1 is missing"
        ((WARNINGS++))
        if [ ! -z "$2" ]; then
            echo "  └─ $2"
        fi
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  System Requirements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_command "node" "version" "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
check_command "npm" "version"
check_command "git" "version" "sudo apt-get install git"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Project Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "package.json" "size"
check_file "electron-builder.json" "size"
check_directory "electron" "count"
check_file "electron/main.js" 
check_file "electron/preload.js"
check_file "electron/server-wrapper.js"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Built Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_directory "dist" "count"
check_file "dist/index.js" "size"
check_directory "dist/server" "count"
check_directory "dist/assets" "count"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Node Modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    
    # Check critical dependencies
    if [ -d "node_modules/electron" ]; then
        echo -e "${GREEN}  ✓${NC} electron installed"
    else
        echo -e "${RED}  ✗${NC} electron NOT installed"
        ((ISSUES++))
    fi
    
    if [ -d "node_modules/electron-builder" ]; then
        echo -e "${GREEN}  ✓${NC} electron-builder installed"
    else
        echo -e "${RED}  ✗${NC} electron-builder NOT installed"
        ((ISSUES++))
    fi
else
    echo -e "${RED}✗${NC} node_modules is missing"
    ((ISSUES++))
    echo "  └─ Run: npm install"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build Resources (Icons)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_directory "electron/build"

# Check for source icon
if [ -f "LiaScript/resources/icon.png" ]; then
    echo -e "${GREEN}✓${NC} Source icon found: LiaScript/resources/icon.png"
else
    echo -e "${YELLOW}⚠${NC} Source icon not found"
    ((WARNINGS++))
fi

# Check platform-specific icons
if [ -f "electron/build/icon.icns" ]; then
    echo -e "${GREEN}✓${NC} macOS icon (icon.icns) exists"
else
    echo -e "${YELLOW}⚠${NC} macOS icon (icon.icns) missing"
    echo "  └─ Required for macOS builds"
    ((WARNINGS++))
fi

if [ -f "electron/build/icon.ico" ]; then
    echo -e "${GREEN}✓${NC} Windows icon (icon.ico) exists"
else
    echo -e "${YELLOW}⚠${NC} Windows icon (icon.ico) missing"
    echo "  └─ Required for Windows builds"
    ((WARNINGS++))
fi

if [ -d "electron/build/icons" ]; then
    ICON_COUNT=$(find electron/build/icons -name "*.png" | wc -l)
    if [ $ICON_COUNT -ge 8 ]; then
        echo -e "${GREEN}✓${NC} Linux icons exist ($ICON_COUNT PNG files)"
    else
        echo -e "${YELLOW}⚠${NC} Linux icons incomplete ($ICON_COUNT PNG files)"
        echo "  └─ Need 8 sizes: 16, 32, 48, 64, 128, 256, 512, 1024"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Linux icons directory missing"
    echo "  └─ Required for Linux builds"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Platform-Specific Build Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for Linux build tools
if [ "$(uname)" = "Linux" ]; then
    check_command "dpkg-deb" "" "sudo apt-get install dpkg"
    check_command "fakeroot" "" "sudo apt-get install fakeroot"
    check_command "rpmbuild" "" "sudo apt-get install rpm"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to build.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Generate icons (if not done):"
    echo "     npm install -g electron-icon-builder"
    echo "     cd electron/build && electron-icon-builder --input=../../LiaScript/resources/icon.png --output=."
    echo ""
    echo "  2. Build the app:"
    echo "     npm run electron:build"
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup is mostly complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Warnings are usually about missing icons. Generate them with:"
    echo "  npm install -g electron-icon-builder"
    echo "  cd electron/build"
    echo "  electron-icon-builder --input=../../LiaScript/resources/icon.png --output=."
    echo ""
    echo "You can proceed with building, but some platforms may fail without icons."
else
    echo -e "${RED}✗ Found $ISSUES critical issue(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the critical issues before building."
    echo ""
    echo "Common fixes:"
    echo "  - Install Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  - Install dependencies: npm install"
    echo "  - Build application: npm run build"
    echo "  - Generate icons: See electron/build/README.md"
fi

echo ""
echo "For detailed instructions, see:"
echo "  - ELECTRON_BUILD_GUIDE.md"
echo "  - electron/README.md"
echo "  - electron/build/README.md"
echo ""

exit $ISSUES
