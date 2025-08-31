const tasks = require('./tasks');
const videos = require('./videos');
const timeline = require('./timeline');
const avatars = require('./avatars');
// Export all schemas as an object
const collections = {
  tasks,
  videos,
  timeline,
  avatars
};

// Helper function to get individual schema
const getSchema = (collectionName) => {
  return collections[collectionName];
};

// Helper function to get all collection names
const getCollectionNames = () => {
  return Object.keys(collections);
};

module.exports = {
  collections,      // For bulk operations
  getSchema,        // For individual access
  getCollectionNames,
  // Direct exports for convenience
  tasks,
  videos,
  timeline,
  avatars
};