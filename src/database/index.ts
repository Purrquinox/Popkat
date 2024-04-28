// Packages
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Metadata
class Metadata {
	static async get(data: any): Promise<Metadata> {
		try {
			const doc = await prisma.metadata.findUnique({
				where: {
					...data,
				},
			});

			return doc;
		} catch (error) {
			throw new Error(error);
		}
	}

	static async find(data: any): Promise<Metadata[]> {
		try {
			const docs = await prisma.metadata.findMany({
				where: {
					...data,
				},
			});

			return docs;
		} catch (error) {
			throw new Error(error);
		}
	}

	static async create(data: any): Promise<Metadata> {
		try {
			const doc = await prisma.metadata.create({
				data: data,
			});

			return doc;
		} catch (error) {
			throw new Error(error);
		}
	}

	static async update(where: any, data: any): Promise<Metadata> {
		try {
			const doc = await prisma.metadata.update({
				where: where,
				data: data,
			});

			return doc;
		} catch (error) {
			throw new Error(error);
		}
	}

	static async delete(where: any): Promise<boolean> {
		try {
			await prisma.metadata.delete({
				where: where,
			});

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
}

// Export
export { Metadata, prisma };
