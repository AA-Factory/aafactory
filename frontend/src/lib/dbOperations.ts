export async function safeDbOperation<T>(
  operation: string,
  collection: string,
  dbOperation: () => Promise<T>,
  context?: any,
): Promise<T> {
  try {
    return await dbOperation();
  } catch (error: any) {
    const errorMessage = `Error during ${operation} on ${collection}: ${
      error.message || 'Unknown error'
    }`;
    if (context) {
      console.error(errorMessage, context);
    } else {
      console.error(errorMessage);
    }
    throw new Error(errorMessage);
  }
}
