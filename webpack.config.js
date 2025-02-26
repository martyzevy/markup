const path = require('path');

module.exports = {
  entry: './popup.js', 
  output: {
    filename: 'popup.bundle.js', 
    path: path.resolve(__dirname,), 
  },
  mode: 'production', 
};