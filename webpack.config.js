const path = require('path');

module.exports = {
  entry: {
    popup: './popup.js', // Entry point for popup.js
    contentScript: './ContentScript.js', // Entry point for ContentScript.js
  },
  output: {
    filename: '[name].bundle.js', // Outputs popup.bundle.js and contentScript.bundle.js
    path: path.resolve(__dirname), // Output directory
  },
  mode: 'production', // Or 'development' for debugging
};