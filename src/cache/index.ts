// Packages
import * as redis from "redis";
import * as dotenv from "dotenv";
import * as logger from "../logger";

// Dotenv Config
dotenv.config();

// Create a Redis client
const client = redis.createClient({
	url: process.env.REDIS_URI,
});

client.connect();

// Cache Manager
class CacheManager {
	static async set(key: string, value: any): Promise<boolean> {
		try {
			await client.set(key, value);
			return true;
		} catch (error) {
			console.error("Error setting cache:", error);
			return false;
		}
	}

	static async get(key: string): Promise<any> {
		try {
			return await client.get(key);
		} catch (error) {
			console.error("Error getting cache:", error);
			return null;
		}
	}
}

// Export Cache Manager
export default CacheManager;
