import { Server } from "@hapi/hapi"
import { createItemId } from "./utils"
import * as dotenv from 'dotenv';
import { Pool } from "pg";
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
dotenv.config();

// Database. Move to its own file
const pool = new Pool({
    user:  process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Item model.
interface Item {
    id: number,
    name: string,
    price: number
}

interface ErrorStructure {
    field: String,
    message: String
}

async function insertItem(item: Item): Promise<Item | undefined> {
    try {
        const created = await prisma.products.create({
            data: {
                id: item.id,
                name: item.name,
                price: item.price,
            },
        });
        const newItem: Item = {
            id: created.id,
            name: created.name,
            price: Number(created.price)
        };
        return newItem;
    } catch (err) {
        console.error("Prisma insert error:", err);
        return undefined;
    }
}

async function getItemById(id: number): Promise<Item | undefined> {
    try {
        const result = await prisma.products.findUnique({
            where: { id: Number(id) },
        });
        if (!result) {
            return undefined;
        }
        const item: Item = {
            id: result.id,
            name: result.name,
            price: Number(result.price)
        };
        return item;
    } catch (err) {
        console.error("Prisma select error:", err);
        return undefined;
    }
}

async function updateItemById(id: number, updatedData: Partial<Item>): Promise<Item | undefined> {
    try {
        const updated = await prisma.products.update({
            where: { id: Number(id) },
            data: {
                name: updatedData.name,
                price: updatedData.price,
            },
        });
        if (!updated) {
            return undefined;
        }
        const item: Item = {
            id: updated.id,
            name: updated.name,
            price: Number(updated.price)
        };
        return item;
    } catch (err) {
        console.error("Prisma update error:", err);
        return undefined;
    }
}

async function deleteItemById(id: number): Promise<Item | undefined> {
    try {
        const deleted = await prisma.products.delete({
            where: { id: Number(id) },
        });
        if (!deleted) {
            return undefined;
        }
        const item: Item = {
            id: deleted.id,
            name: deleted.name,
            price: Number(deleted.price)
        };
        return item;
    } catch (err) {
        console.error("Prisma delete error:", err);
        return undefined;
    }
}

async function getAllItems(): Promise<Array<Item>>{
    try {
        const queryResult = await prisma.products.findMany();
        console.log("queryResult:", queryResult);
        return queryResult.map((row) => ({
            id: row.id,
            name: row.name,
            price: Number(row.price)
        }));
    } catch (err) {
        console.error("Prisma error:", err);
        throw err;
    }
}

// Schemas can be implemented, like Zod.

export const defineRoutes = (server: Server) => {
    server.route({
        method: 'GET',
        path: '/ping',
        handler: async (request, h) => {
            return {
                ok: true
            }
        }
    })
    server.route({
        method: 'GET',
        path: '/items',
        handler: async (request, h) => {
            return await getAllItems();
        }
    })
    server.route({
        method: 'GET',
        path: '/items/{id}',
        handler: async (request, h) => {
            const { id } = request.params;
            const item = await getItemById(id);
            if (!item) {
                return h.response({ error: 'Item not found' }).code(404);
            }
            return h.response(item).code(200);
        }
    })
    server.route({
        method: 'POST',
        path: '/items',
        handler: async (request, h) => {
            const name = request.payload["name"];
            if (!name) {
                return h.response().code(400);
            }
            const errors: ErrorStructure[] = []
            const price = request.payload["price"];
            if (!price) {
                errors.push({
                    field: "price",
                    message: "Field \"price\" is required"
                });
            }
            if (price < 0) {
                errors.push({
                    field: "price",
                    message: "Field \"price\" cannot be negative"
                });
            }
            if (errors.length) {
                return h.response({errors: errors}).code(400);
            }
            const item = {
                id: createItemId(),
                name: name,
                price: Number(price)
            };
            await insertItem(item);
            return h.response(item).code(201);
        }
    })
    server.route({
        method: 'PUT',
        path: '/items/{id}',
        handler: async (request, h) => {
            const { id } = request.params;
            const item = await getItemById(id);
            if (!item) {
                return h.response({ error: 'Item not found' }).code(404);
            }
            const price = request.payload["price"];
            const errors: ErrorStructure[] = []
            if (!price) {
                errors.push({
                    field: "price",
                    message: "Field \"price\" is required"
                });
            }
            if (price < 0) {
                errors.push({
                    field: "price",
                    message: "Field \"price\" cannot be negative"
                });
            }
            if (errors.length) {
                return h.response({errors: errors}).code(400);
            }
            const updatedItem = await updateItemById(id, request.payload as Partial<Item>);
            return h.response(updatedItem).code(200);
        }
    })
    server.route({
        method: 'DELETE',
        path: '/items/{id}',
        handler: async (request, h) => {
            const { id } = request.params;
            const deletedItem = await deleteItemById(id);
            return h.response(deletedItem!).code(204);
        }
    })
}