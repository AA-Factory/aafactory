const { createTimestampSchema } = require('./shared/common');

module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Task Object Validation",
      required: ["avatarId", "taskType", "status", "taskId", "createdAt"],
      properties: {
        avatarId: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        taskType: {
          enum: ["audio", "video", "image", "text"],
          description: "can only be one of the enum values and is required"
        },
        status: {
          enum: ["PENDING", "RECEIVED", "STARTED", "SUCCESS", "FAILURE"],
          description: "can only be one of the enum values and is required"
        },
        taskId: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        metadata: {
          bsonType: "object",
          description: "task metadata object"
        },
        ...createTimestampSchema()
      }
    }
  },
  // Optional: Add indexes for this collection
  indexes: [
    { key: { taskId: 1 }, unique: true }
  ]
};
