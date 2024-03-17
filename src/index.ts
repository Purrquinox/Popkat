// Packages
import express, { Request, Response, json } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { CacheManager, RedisClient } from "./cache/index";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import multer from "multer";
import multerS3 from "multer-s3";
import * as aws from "aws-sdk";
import { S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import { createWriteStream } from "node:fs";
import * as crypto from "crypto";
import * as path from "path";
import * as Database from "./database/index";
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
	limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
	fileFilter: (
		req: express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback
	) => {
		const filetypes = /jpeg|jpg|png/;
		const extname = filetypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		const mimetype = filetypes.test(file.mimetype);

		if (mimetype && extname) return cb(null, true);
		else cb(new Error("Allow images only of extensions jpeg|jpg|png."));
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

app.post("/upload", storage.single("file"), (req, res, next) => {
	res.send(req.file);
});

// Expose Server
app.listen(process.env.PORT, () =>
	Logger.debug("Server", `Listening on http://localhost:${process.env.PORT}/`)
);
