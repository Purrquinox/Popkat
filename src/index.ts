// Packages
import * as Bun from "bun";
import * as Cache from "./cache/index";
import * as dotenv from "dotenv";
import * as logger from "./logger";

// Dotenv Config
dotenv.config();

// Serve
const server = Bun.serve({
	port: process.env.PORT,
	fetch(request) {
		return new Response("Welcome to Bun!");
	},
});

logger.debug("Server", `Listening on http://localhost:${server.port}/`);
