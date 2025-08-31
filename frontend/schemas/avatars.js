const { createTimestampSchema } = require('./shared/common');

module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        ...createTimestampSchema(['isActive'])
      }
    }
  }
};