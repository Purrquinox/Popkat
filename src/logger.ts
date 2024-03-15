// Packages
import "colors";

// Info
const info = (name: string, message: string) =>
	console.log(`${"[INFO]".red} [${name.green}] => ${message}`);

// Debug
const debug = (name: string, message: string) =>
	console.log(`${"[DEBUG]".yellow} [${name.green}] => ${message}`);

// Error
const error = (name: string, message: string) =>
	console.log(`${"[ERROR]".red} [${name.green}] => ${message}`);

// Success
const success = (name: string, message: string) =>
	console.log(`${"[SUCCESS]".green} [${name.green}] => ${message}`);

// Export
export { info, debug, error, success };
