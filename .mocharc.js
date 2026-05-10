// Mocha configuration for ESM
export default {
  // Test files pattern
  spec: ['tests/**/*.test.js'],
  
  // Timeout
  timeout: 30000,
  
  // Reporter
  reporter: 'spec',
  
  // Colors
  colors: true,
  
  // Require setup file
  require: ['./tests/mocha-setup.js'],
  
  // ESM loader
  'experimental-specifier-resolution': 'node',
};