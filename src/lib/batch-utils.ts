import { batchConfig } from './query-config';

export class QueryBatcher {
  private static batchTimeout: NodeJS.Timeout | undefined;
  private static pendingQueries: Map<string, Promise<any>> = new Map();

  static async batchQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    delay: number = batchConfig.batchDelay
  ): Promise<T> {
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key)!;
    }

    const promise = new Promise<T>((resolve, reject) => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      this.batchTimeout = setTimeout(async () => {
        try {
          const result = await queryFn();
          this.pendingQueries.delete(key);
          resolve(result);
        } catch (error) {
          this.pendingQueries.delete(key);
          reject(error);
        }
      }, delay);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  static clearBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }
    this.pendingQueries.clear();
  }
}

// Utility function to batch array operations efficiently
export function batchArray<T>(array: T[], batchSize: number = batchConfig.batchSize): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Utility for batching Firestore queries with Promise.all
export async function batchPromises<T>(
  promises: Promise<T>[],
  batchSize: number = batchConfig.batchSize
): Promise<T[]> {
  const batches = batchArray(promises, batchSize);
  const results: T[] = [];
  
  for (const batch of batches) {
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  
  return results;
}