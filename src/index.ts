// Packages
import express, { Request, Response, json } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { RedisClient } from "./cache/index";
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

// Server
const app = express();

// Server Middleware
app.use(cors.default());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(json());
app.use(
	compression.default({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) return false;
			return compression.filter(req, res);
		},
		threshold: 0,
	})
);
app.use(
	rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 20,
		standardHeaders: true,
		legacyHeaders: true,
		store: new RedisStore({
			sendCommand: (...args: string[]) => RedisClient.sendCommand(args),
		}),
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

// Routes
app.get("/:file", async (req, res) => {
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

app.get("/:file/meta", async (req, res) => {
	const file = req.params["file"];

	try {
		const metadata = await Metadata.get({
			key: file,
		});

		res.status(200).send(metadata);
	} catch (error) {
		res.status(500).send(error);
	}
});

app.post("/upload", async (req, res, next) => {
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

// Expose Server
app.listen(process.env.PORT, () =>
	Logger.debug("Server", `Listening on http://localhost:${process.env.PORT}/`)
);
