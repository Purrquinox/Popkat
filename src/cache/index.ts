// Packages
import * as redis from "redis";
import "dotenv/config";

// Create a Redis client
const RedisClient = redis.createClient({
	url: process.env.REDIS_URI,
});

RedisClient.connect();

// Cache Manager
class CacheManager {
	/**
	 * Get a value from the cache
	 * @param key the key of the value to retrieve
	 */
	static async get(key: string): Promise<any> {
		try {
			return await RedisClient.get(key);
		} catch (error) {
			console.error("Error getting cache:", error);
			return null;
		}
	}

	/**
	 * Set a value in the cache
	 * @param key the key of the value to set
	 * @param value the value to set
	 */
	static async set(key: string, value: any): Promise<boolean> {
		try {
			await RedisClient.set(key, value);
			return true;
		} catch (error) {
			console.error("Error setting cache:", error);
			return false;
		}
	}

	/**
	 * Update a value in the cache
	 * @param key the key of the value to update
	 * @param value the new value to set
	 */
	static async update(key: string, value: any): Promise<boolean> {
		try {
			await RedisClient.del(key);
			await RedisClient.set(key, value);
			return true;
		} catch (error) {
			console.error("Error updating cache:", error);
			return false;
		}
	}

	/**
	 * Delete a value from the cache
	 * @param key the key of the value to delete
	 */
	static async delete(key: string): Promise<boolean> {
		try {
			await RedisClient.del(key);
			return true;
		} catch (error) {
			console.error("Error deleting cache:", error);
			return false;
		}
	}
}

// Export Cache Manager and RedisClient
export { CacheManager, RedisClient };
