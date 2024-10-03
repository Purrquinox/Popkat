// Packages
import Fastify from "fastify";
import FastifyRateLimit from "@fastify/rate-limit";
import FastifyRedis from "@fastify/redis";
import FastifyMultipart from "@fastify/multipart";
import FastifyCors from "@fastify/cors";
import FastifyCompress from "@fastify/compress";
import { RedisClient, CacheManager } from "./cache/index";
import { Metadata } from "./database/index";
import { S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as crypto from "crypto";
import * as path from "path";
import * as Logger from "./logger";
import "dotenv/config";

// Servers
const publicServer = Fastify();
const admin = Fastify();

// Server Middleware (public)
publicServer.register(FastifyCors);
publicServer.register(FastifyCompress, { threshold: 0 });
publicServer.register(FastifyRateLimit, {
  max: 20,
  timeWindow: "1 minute",
  redis: RedisClient,
  keyGenerator: (req) => req.ip,
  allowList: ["/upload"],
});
publicServer.register(FastifyRedis, { client: RedisClient });
publicServer.register(FastifyMultipart);

// Server Middleware (admin)
admin.register(FastifyCors);
admin.register(FastifyCompress, { threshold: 0 });

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

// Public Routes
publicServer.get("/:file", async (req, reply) => {
  const { file } = req.params as { file: string };

  try {
    const command = new GetObjectCommand({
      Bucket: "popkat",
      Key: file,
    });
    const item = await s3.send(command);
    const readStream = item.Body as Readable;

    reply.raw.setHeader("Content-Type", item.ContentType);
    readStream.pipe(reply.raw);
  } catch (error) {
    reply.status(500).send(error);
  }
});

publicServer.get("/:file/meta", async (req, reply) => {
  const { file } = req.params as { file: string };

  try {
    const cache = await CacheManager.get(`${file}/meta`);

    if (cache) {
      reply.status(200).send(JSON.parse(cache));
    } else {
      const metadata = await Metadata.get({ key: file });

      await CacheManager.setEX(`${file}/meta`, 4, JSON.stringify(metadata));
      reply.status(200).send(metadata);
    }
  } catch (error) {
    reply.status(500).send(error);
  }
});

// File Upload Route
publicServer.post("/upload", async (req, reply) => {
  const parts = await req.file();
  const fileName = `${crypto
    .createHash("md5")
    .update(parts.filename)
    .digest("hex")}_${new Date().getUTCMilliseconds()}${path
    .extname(parts.filename)
    .toLowerCase()}`;

  try {
    const data = await s3.putObject({
      Bucket: "popkat",
      Key: fileName,
      Body: parts.file,
      ACL: "public-read",
    });

    await Metadata.create({
      key: fileName,
      userID: req.headers["userid"] || "unknown",
      platform: req.headers["platform"] || "unknown",
      fileType: parts.mimetype,
      fileSize: parts.file.truncated ? parts.file.truncated : undefined,
    });

    reply.status(200).send({ key: fileName });
  } catch (error) {
    reply.status(500).send(error);
  }
});

// Admin Routes
admin.delete("/delete", async (req, reply) => {
  const key = req.headers["key"] as string;

  if (!key) {
    return reply.status(500).send({
      message: "Missing key in Header",
    });
  }

  try {
    const metadata = await Metadata.get({ key });

    if (metadata) {
      let success = await Metadata.delete({ key });

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
          return reply.status(200).send({ success: true });
        } else {
          throw new Error("Unexpected error deleting the key");
        }
      } else {
        throw new Error("Unexpected error deleting the key");
      }
    } else {
      throw new Error("Key not found.");
    }
  } catch (error) {
    return reply.status(500).send(error);
  }
});

// Expose Server (public)
publicServer.listen({ port: parseInt(process.env.PORT) }, (err, address) => {
  if (err) {
    Logger.error("Server (public)", err.toString());
    process.exit(1);
  }
  Logger.debug("Server (public)", `Listening on ${address}`);
});

// Expose Server (admin)
admin.listen({ port: parseInt(process.env.ADMIN_PORT) }, (err, address) => {
  if (err) {
    Logger.error("Server (admin)", err.toString());
    process.exit(1);
  }
  Logger.debug("Server (admin)", `Listening on ${address}`);
});
