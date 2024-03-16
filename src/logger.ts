// Packages
import "colors";

/**
 * Info
 * @param name name of the module or component
 * @param message message to be logged
 */
const info = (name: string, message: string) =>
	console.log(`${"[INFO]".red} [${name.green}] => ${message}`);

/**
 * Debug
 * @param name name of the module or component
 * @param message message to be logged
 */
const debug = (name: string, message: string) =>
	console.log(`${"[DEBUG]".yellow} [${name.green}] => ${message}`);

/**
 * Error
 * @param name name of the module or component
 * @param message message to be logged
 */
const error = (name: string, message: string) =>
	console.log(`${"[ERROR]".red} [${name.green}] => ${message}`);

/**
 * Success
 * @param name name of the module or component
 * @param message message to be logged
 */
const success = (name: string, message: string) =>
	console.log(`${"[SUCCESS]".green} [${name.green}] => ${message}`);

// Export
export { info, debug, error, success };
