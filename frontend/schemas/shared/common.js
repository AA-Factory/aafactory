// schemas/shared/common.js - Reusable schema components
const commonFields = {
  createdAt: {
    bsonType: 'date',
    description: 'creation timestamp, required',
  },
  updatedAt: {
    bsonType: 'date',
    description: 'last update timestamp',
  },
  isActive: {
    bsonType: 'bool',
    description: 'soft delete flag',
  },
};

const createTimestampSchema = (additionalRequired = []) => ({
  createdAt: commonFields.createdAt,
  updatedAt: commonFields.updatedAt,
  ...(additionalRequired.includes('isActive') && {
    isActive: commonFields.isActive,
  }),
});

module.exports = { commonFields, createTimestampSchema };
