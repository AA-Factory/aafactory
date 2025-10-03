const { createTimestampSchema } = require('./shared/common');

module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['filename', 'path', 'resourceType', 'url', 'type'],
      properties: {
        filename: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        filepath: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        resourceType: {
          enum: ['audio', 'video'],
          description: 'can only be one of the enum values and is required',
        },
        url: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        type: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        ...createTimestampSchema(['isActive']),
      },
    },
  },
};
