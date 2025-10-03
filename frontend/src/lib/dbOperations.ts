export async function safeDbOperation<T>(
  operation: string,
  collection: string,
  dbOperation: () => Promise<T>,
  context?: any,
): Promise<T> {
  try {
    return await dbOperation();
  } catch (error: any) {
    let errorMessage = `Error during ${operation} on ${collection}`;

    // Enhanced logging for MongoDB schema validation errors
    if (error.code === 121 && error.errInfo?.details?.schemaRulesNotSatisfied) {
      const schemaError =
        error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied;
      errorMessage = `Schema validation failed: ${JSON.stringify(schemaError, null, 2)}`;

      // console.error('🚨 MONGODB SCHEMA VALIDATION FAILURE:', {
      //   operation,
      //   collection,
      //   timestamp: new Date().toISOString(),
      //   errorCode: error.code,
      //   schemaViolations: error.errInfo.details.schemaRulesNotSatisfied,
      //   documentContext: context,
      //   detailedErrors: schemaError
      // });
    } else {
      // Log other database errors
      // console.error(`❌ DATABASE OPERATION ERROR:`, {
      //   operation,
      //   collection,
      //   timestamp: new Date().toISOString(),
      //   errorCode: error.code || 'Unknown',
      //   errorMessage: error.message,
      //   documentContext: context,
      //   fullError: error
      // });
    }

    throw new Error(errorMessage);
  }
}
