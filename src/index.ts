// Packages
import express, { Request, Response, json } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { RedisClient, CacheManager } from "./cache/index";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import multer from "multer";
import multerS3 from "multer-s3";
import { Metadata } from "./database/index";
import { S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as crypto from "crypto";
import * as path from "path";
import * as Logger from "./logger";
import "dotenv/config";

// Servers
const publicServer = express();
const admin = express();

// Server Middleware (public)
publicServer.use(cors.default());
publicServer.use(bodyParser.urlencoded({ extended: true }));
publicServer.use(bodyParser.json());
publicServer.use(json());
publicServer.use(
	compression.default({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) return false;
			return compression.filter(req, res);
		},
		threshold: 0,
	})
);
publicServer.use(
	rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 20,
		standardHeaders: true,
		legacyHeaders: true,
		store: new RedisStore({
			sendCommand: (...args: string[]) => RedisClient.sendCommand(args),
		}),
		skip: (req) => {
			if (req.url === "/upload") return false;
			else return true;
		},
	})
);

// Server Middleware (admin)
admin.use(cors.default());
admin.use(bodyParser.urlencoded({ extended: true }));
admin.use(bodyParser.json());
admin.use(json());
admin.use(
	compression.default({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) return false;
			return compression.filter(req, res);
		},
		threshold: 0,
	})
);

// AWS Configuration
const s3 = new S3({
	endpoint: process.env.S3_ENDPOINT,
	region: "any",
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.S3_KEY,
		secretAccessKey: process.env.S3_SECRET,
	},
});

// Multer Configuration
const storage = multer({
	storage: new multerS3({
		s3: s3,
		acl: "public-read",
		bucket: "popkat",
		key: (
			req: express.Request,
			file: Express.Multer.File,
			cb: (error: Error, key: string) => void
		) => {
			const fileName = `${crypto
				.createHash("md5")
				.update(file.originalname)
				.digest("hex")}_${new Date().getUTCMilliseconds()}${path
				.extname(file.originalname)
				.toLowerCase()}`;
			cb(null, fileName);
		},
	}),
	limits: { fileSize: 1024 * 1024 * 100 }, // 100MB (CF MAX)
	fileFilter: (
		req: express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback
	) => {
		return cb(null, true);
	},
});

// Public Routes
publicServer.get("/:file", async (req, res) => {
	const file = req.params["file"];

	try {
		const command = new GetObjectCommand({
			Bucket: "popkat",
			Key: file,
		});
		const item = await s3.send(command);
		const readStream = item.Body as Readable;

		readStream.pipe(res);
	} catch (error) {
		res.status(500).send(error);
	}
});

publicServer.get("/:file/meta", async (req, res) => {
	const file = req.params["file"];

	try {
		const cache = await CacheManager.get(`${file}/meta`);

		if (cache) res.status(200).send(JSON.parse(cache));
		else {
			const metadata = await Metadata.get({
				key: file,
			});

			await CacheManager.setEX(
				`${file}/meta`,
				4,
				JSON.stringify(metadata)
			);
			res.status(200).send(metadata);
		}
	} catch (error) {
		res.status(500).send(error);
	}
});

publicServer.post("/upload", async (req, res) => {
	storage.single("file")(req, res, async (err: any) => {
		try {
			await Metadata.create({
				key: req.file["key"],
				userID: req.get("userID") || "unknown",
				platform: req.get("platform") || "unknown",
				fileType: req.file["mimetype"],
				fileSize: req.file["size"],
			});

			if (err) return res.status(500).send(err);
			else return res.status(200).json({ key: req.file["key"] });
		} catch (error) {
			res.status(500).send(error);
		}
	});
});

// Admin Routes
admin.delete("/delete", async (req, res) => {
	const key = req.get("key");

	if (!key)
		return res.status(500).json({
			message: "Missing key in Header",
		});

	try {
		const metadata = await Metadata.get({
			key: key,
		});
        
		if (metadata) {
			let success = await Metadata.delete({
				key: key,
			});

			if (success) {
				success = false;

				await CacheManager.delete(`${key}/meta`);

				await s3
					.deleteObject({ Bucket: "popkat", Key: key })
					.then(() => (success = true))
					.catch((err) => {
						throw new Error(err);
					});

				if (success) {
                    return res.status(200).json({ success: true });
                }
				else
					throw new Error(
						"Hmm, There was an unexpected error deleting this key"
					);
			} else
				throw new Error(
					"Hmm, There was an unexpected error deleting this key"
				);
		} else throw new Error("Hmm, that key could not be found.");
	} catch (error) {
		return res.status(500).send(error);
	}
});

// Expose Server (public)
publicServer.listen(process.env.PORT, () =>
	Logger.debug(
		"Server (public)",
		`Listening on http://localhost:${process.env.PORT}/`
	)
);

// Expose Server (admin)
admin.listen(process.env.ADMIN_PORT, () =>
	Logger.debug(
		"Server (admin)",
		`Listening on http://localhost:${process.env.ADMIN_PORT}/`
	)
);// Packages
import express, { Request, Response, json } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { RedisClient, CacheManager } from "./cache/index";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import multer from "multer";
import multerS3 from "multer-s3";
import { Metadata } from "./database/index";
import { S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as crypto from "crypto";
import * as path from "path";
import * as Logger from "./logger";
import "dotenv/config";

// Servers
const publicServer = express();
const admin = express();

// Server Middleware (public)
publicServer.use(cors.default());
publicServer.use(bodyParser.urlencoded({ extended: true }));
publicServer.use(bodyParser.json());
publicServer.use(json());
publicServer.use(
	compression.default({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) return false;
			return compression.filter(req, res);
		},
		threshold: 0,
	})
);
publicServer.use(
	rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 20,
		standardHeaders: true,
		legacyHeaders: true,
		store: new RedisStore({
			sendCommand: (...args: string[]) => RedisClient.sendCommand(args),
		}),
		skip: (req) => {
			if (req.url === "/upload") return false;
			else return true;
		},
	})
);

// Server Middleware (admin)
admin.use(cors.default());
admin.use(bodyParser.urlencoded({ extended: true }));
admin.use(bodyParser.json());
admin.use(json());
admin.use(
	compression.default({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) return false;
			return compression.filter(req, res);
		},
		threshold: 0,
	})
);

// AWS Configuration
const s3 = new S3({
	endpoint: process.env.S3_ENDPOINT,
	region: "any",
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.S3_KEY,
		secretAccessKey: process.env.S3_SECRET,
	},
});

// Multer Configuration
const storage = multer({
	storage: new multerS3({
		s3: s3,
		acl: "public-read",
		bucket: "popkat",
		key: (
			req: express.Request,
			file: Express.Multer.File,
			cb: (error: Error, key: string) => void
		) => {
			const fileName = `${crypto
				.createHash("md5")
				.update(file.originalname)
				.digest("hex")}_${new Date().getUTCMilliseconds()}${path
				.extname(file.originalname)
				.toLowerCase()}`;
			cb(null, fileName);
		},
	}),
	limits: { fileSize: 1024 * 1024 * 100 }, // 100MB (CF MAX)
	fileFilter: (
		req: express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback
	) => {
		return cb(null, true);
	},
});

// Public Routes
publicServer.get("/:file", async (req, res) => {
	const file = req.params["file"];

	try {
		const command = new GetObjectCommand({
			Bucket: "popkat",
			Key: file,
		});
		const item = await s3.send(command);
		const readStream = item.Body as Readable;

		readStream.pipe(res);
	} catch (error) {
		res.status(500).send(error);
	}
});

publicServer.get("/:file/meta", async (req, res) => {
	const file = req.params["file"];

	try {
		const cache = await CacheManager.get(`${file}/meta`);

		if (cache) res.status(200).send(JSON.parse(cache));
		else {
			const metadata = await Metadata.get({
				key: file,
			});

			await CacheManager.setEX(
				`${file}/meta`,
				4,
				JSON.stringify(metadata)
			);
			res.status(200).send(metadata);
		}
	} catch (error) {
		res.status(500).send(error);
	}
});

publicServer.post("/upload", async (req, res) => {
	storage.single("file")(req, res, async (err: any) => {
		try {
			await Metadata.create({
				key: req.file["key"],
				userID: req.get("userID") || "unknown",
				platform: req.get("platform") || "unknown",
				fileType: req.file["mimetype"],
				fileSize: req.file["size"],
			});

			if (err) return res.status(500).send(err);
			else return res.status(200).json({ key: req.file["key"] });
		} catch (error) {
			res.status(500).send(error);
		}
	});
});

// Admin Routes
admin.delete("/delete", async (req, res) => {
	const key = req.get("key");

	if (!key)
		return res.status(500).json({
			message: "Missing key in Header",
		});

	try {
		const metadata = await Metadata.get({
			key: key,
		});
        
		if (metadata) {
			let success = await Metadata.delete({
				key: key,
			});

			if (success) {
				success = false;

				await CacheManager.delete(`${key}/meta`);

				await s3
					.deleteObject({ Bucket: "popkat", Key: key })
					.then(() => (success = true))
					.catch((err) => {
						throw new Error(err);
					});

				if (success) {
                    return res.status(200).json({ success: true });
                }
				else
					throw new Error(
						"Hmm, There was an unexpected error deleting this key"
					);
			} else
				throw new Error(
					"Hmm, There was an unexpected error deleting this key"
				);
		} else throw new Error("Hmm, that key could not be found.");
	} catch (error) {
		return res.status(500).send(error);
	}
});

// Expose Server (public)
publicServer.listen(process.env.PORT, () =>
	Logger.debug(
		"Server (public)",
		`Listening on http://localhost:${process.env.PORT}/`
	)
);

// Expose Server (admin)
admin.listen(process.env.ADMIN_PORT, () =>
	Logger.debug(
		"Server (admin)",
		`Listening on http://localhost:${process.env.ADMIN_PORT}/`
	)
);
