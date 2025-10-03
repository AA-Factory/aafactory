const { createTimestampSchema } = require('./shared/common');

module.exports = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'Video Element Object Validation',
      required: ['elementId', 'elementData', 'createdAt', 'updatedAt'],
      properties: {
        elementId: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9]+$',
          minLength: 1,
          maxLength: 50,
          description: 'unique element identifier',
        },
        elementData: {
          bsonType: 'object',
          required: [
            'id',
            'name',
            'type',
            'placement',
            'timeFrame',
            'properties',
          ],
          properties: {
            id: {
              bsonType: 'string',
              description: 'must match elementId',
            },
            name: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'human readable name',
            },
            type: {
              enum: ['video'],
              description: 'element type',
            },
            placement: {
              bsonType: 'object',
              required: [
                'x',
                'y',
                'width',
                'height',
                'rotation',
                'scaleX',
                'scaleY',
              ],
              properties: {
                x: { bsonType: 'number' },
                y: { bsonType: 'number' },
                width: { bsonType: 'number', minimum: 0, maximum: 10000 },
                height: { bsonType: 'number', minimum: 0, maximum: 10000 },
                rotation: { bsonType: 'number', minimum: -360, maximum: 360 },
                scaleX: { bsonType: 'number', minimum: 0.1, maximum: 10 },
                scaleY: { bsonType: 'number', minimum: 0.1, maximum: 10 },
              },
              additionalProperties: false,
            },
            timeFrame: {
              bsonType: 'object',
              required: ['start', 'end'],
              properties: {
                start: { bsonType: 'number', minimum: 0 },
                end: { bsonType: 'number', minimum: 0 },
              },
              additionalProperties: false,
            },
            properties: {
              bsonType: 'object',
              required: ['elementId', 'src', 'effect'],
              properties: {
                elementId: {
                  bsonType: 'string',
                  pattern: '^[a-zA-Z0-9-]+$',
                },
                src: {
                  bsonType: 'string',
                  pattern: '^(https?://|/)',
                  description: 'video file URL or path',
                },
                effect: {
                  bsonType: 'object',
                  required: ['type'],
                  properties: {
                    type: {
                      enum: [
                        'none',
                        'fade',
                        'slide',
                        'zoom',
                        'blur',
                        'sepia',
                        'grayscale',
                      ],
                    },
                    intensity: { bsonType: 'number', minimum: 0, maximum: 1 },
                    duration: { bsonType: 'number', minimum: 0 },
                  },
                },
              },
            },
          },
        },
        ...createTimestampSchema(),
      },
    },
  },
  indexes: [
    { key: { elementId: 1 }, unique: true },
    { key: { 'elementData.type': 1 } },
    { key: { createdAt: -1 } },
    {
      key: { 'elementData.timeFrame.start': 1, 'elementData.timeFrame.end': 1 },
    },
  ],
};
