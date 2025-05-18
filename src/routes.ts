import { Server } from "@hapi/hapi"
import { createItemId } from "./utils"
import * as dotenv from 'dotenv';
import { Pool } from "pg";

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

// ToDo: In-memory database. Replace by a persistent database.
let inMemoryDb: Array<Item> = []

async function insertItem(item: Item): Promise<Item | undefined> {
    inMemoryDb.push(item);
    const query = `INSERT INTO products (id, name, price)
        VALUES ($1, $2, $3) RETURNING *;`;
    const values = [item.id, item.name, item.price];
    try {
        console.log("item.id:", item.id)
        const res = await pool.query(query, values);
        console.log("Inserted item ID:", res.rows[0].id)
        return res.rows[0].id;
    } catch (err) {
        console.error("DB insert error:", err);
        return undefined;
    }
}

async function getItemById(id: number): Promise<Item | undefined> {
    // console.log("find id:", id);
    const itemM = inMemoryDb.find(item => item.id === Number(id));
    // console.log("itemM id:", itemM?.id);
    const query = `SELECT * FROM products WHERE id = $1`;
    try {
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return undefined;
        }
        const item: Item = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            price: Number(result.rows[0].price)
        };
        // console.log("db item id:", item.id);
        return item;
    } catch (err) {
        console.error("DB select error:", err);
        return undefined;
    }
}

async function updateItemById(id: number, updatedData: Partial<Item>): Promise<Item | undefined> {
    const itemIndex = inMemoryDb.findIndex(item => item.id === Number(id));
    if (itemIndex === -1) {
        return;
    }
    inMemoryDb[itemIndex] = {
        ...inMemoryDb[itemIndex],
        ...updatedData
    };
    // Persist update.
    const query = `UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *;`;
    const values = [inMemoryDb[itemIndex].name, inMemoryDb[itemIndex].price, id];
    try {
        await pool.query(query, values);
    } catch (err) {
        console.error("DB update error:", err);
    }
    return inMemoryDb[itemIndex];
}

async function deleteItemById(id: number) {
    const itemIndex = inMemoryDb.findIndex(item => item.id === Number(id));
    if (itemIndex === -1) {
        return null;
    }
    const [deletedItem] = inMemoryDb.splice(itemIndex, 1);
    // Persist delete.
    const query = `DELETE FROM products WHERE id = $1 RETURNING *;`;
    const values = [id];
    try {
        await pool.query(query, values);
    }
    catch (err) {
        console.error("DB delete error:", err);
    }
    return deletedItem;
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
            return inMemoryDb;
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