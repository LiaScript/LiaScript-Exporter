/**
 * After Pack Script for electron-builder
 * 
 * This script runs after the application is packed but before
 * the final installer/executable is created.
 * 
 * Note: Desktop file modifications for --no-sandbox are handled by
 * the post-build.sh script since desktop files are created during
 * the target-specific build phase (deb, rpm, AppImage, etc.)
 */

const fs = require('fs-extra');
const path = require('path');

module.exports = async function(context) {
  const { appOutDir, electronPlatformName } = context;
  
  console.log(`Running after-pack for ${electronPlatformName}...`);
  
  try {
    // Copy LICENSE file to app directory
    const licenseSrc = path.join(__dirname, '../../LICENSE');
    const licenseDest = path.join(appOutDir, 'LICENSE');
    
    if (fs.existsSync(licenseSrc)) {
      await fs.copy(licenseSrc, licenseDest);
      console.log('Copied LICENSE file');
    }
    
    // Ensure assets are properly linked
    const assetsDir = path.join(appOutDir, 'resources', 'assets');
    if (fs.existsSync(assetsDir)) {
      console.log('Assets directory found:', assetsDir);
    } else {
      console.warn('Assets directory not found. Some exports may not work.');
    }
    
    console.log('After-pack completed successfully');
  } catch (error) {
    console.error('Error in after-pack script:', error);
    // Don't fail the build for non-critical errors
  }
};
