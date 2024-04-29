// Packages
import { Metadata, prisma } from "./database/index";
import { S3 } from "@aws-sdk/client-s3";
import fs from "node:fs";
import * as crypto from "crypto";
import * as Logger from "./logger";
import "dotenv/config";

// AWS S3 Configuration
const s3 = new S3({
	endpoint: process.env.S3_ENDPOINT,
	region: "any",
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.S3_KEY,
		secretAccessKey: process.env.S3_SECRET,
	},
});

// i wanna die
(async () => {
	let changedURIs: {
		oldURI: string;
		newURI: string;
		type: string;
		ID: string;
	}[] = [];
	const posts = await fetch("https://api.sparkyflight.xyz/posts/list").then(
		async (res) => await res.json()
	);

	// List all objects
	const objects = await s3.listObjectsV2({ Bucket: "popkat" });
	const keys = objects.Contents.map((object) => object.Key);

	// Delete all objects
	for (const key of keys) {
		await s3
			.deleteObject({ Bucket: "popkat", Key: key })
			.then((p) => {
				Logger.success("S3 (Truncate)", "Deleted key!");
			})
			.catch((err) =>
				Logger.error(
					"S3 (Truncate)",
					"Failed to delete key!" + err.toString()
				)
			);
	}

	console.log("------ S3 Purge Finished ------");

	// Delete all keys from database
	await prisma.metadata.deleteMany({});

	posts.forEach(async (post) => {
		if (post.image)
			changedURIs.push({
				oldURI: post.image,
				newURI: "none",
				type: "posts",
				ID: post.postid,
			});

		if (post.user.avatar) {
			changedURIs.push({
				oldURI: post.user.avatar,
				newURI: "none",
				type: "users",
				ID: post.user.userid,
			});
		}
	});

	changedURIs.map(async (p) => {
		if (p) {
			let file = await fetch(p.oldURI);
			let blob = Buffer.from(await file.arrayBuffer());

			let key = `${crypto
				.createHash("md5")
				.update(crypto.randomUUID())
				.digest(
					"hex"
				)}_${new Date().getUTCMilliseconds()}`.toLowerCase();

			await s3
				.putObject({
					Bucket: "popkat",
					Key: key,
					Body: blob,
				})
				.then(async () => {
					Logger.success("S3 (Upload)", "Uploaded file!");

					await Metadata.create({
						key: key,
						userID: `${p.ID}_${p.type}`,
						platform: "sparkyflight*migrate",
						fileType: "unknown",
						fileSize: 0,
					});

					p.newURI = `https://popkat.purrquinox.com/${key}`;
					changedURIs[
						changedURIs.findIndex((i) => i.oldURI === p.oldURI)
					] = p;
				})
				.catch((err) => {
					Logger.error(
						"S3 (Upload)",
						"Failed to upload file!" + err.toString()
					);
				});

			if (changedURIs.every((a) => a.newURI != "none"))
				console.log("------ S3 Upload Finished ------");
		}
	});

	setTimeout(() => {
		let sqlScript: string = "";
		sqlScript = changedURIs
			.map((a) => {
				return `UPDATE ${a.type}\n\tSET ${
					a.type === "users" ? "avatar" : "image"
				}="${a.newURI}"\n\tWHERE ${
					a.type === "users" ? "avatar" : "image"
				}="${a.oldURI}";`;
			})
			.join("\n\n");

		fs.writeFile("sql_migrate.sql", sqlScript, (err) => {
			if (err) throw new Error(err.message);
			else
				console.log("./sql_migrate.sql has been written successfully!");
		});
	}, 60000);
})();
