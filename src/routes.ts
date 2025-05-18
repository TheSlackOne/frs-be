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

async function insertItem(item: Item): Promise<Item | undefined> {
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
        return item;
    } catch (err) {
        console.error("DB select error:", err);
        return undefined;
    }
}

async function updateItemById(id: number, updatedData: Partial<Item>): Promise<Item | undefined> {
    const query = `UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *;`;
    const values = [updatedData.name, updatedData.price, id];
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return undefined;
        }
        const item: Item = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            price: Number(result.rows[0].price)
        };
        return item;
    } catch (err) {
        console.error("DB update error:", err);
        return undefined;
    }
}

async function deleteItemById(id: number): Promise<Item | undefined> {
    const query = `DELETE FROM products WHERE id = $1 RETURNING *;`;
    const values = [id];
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return undefined;
        }
        const item: Item = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            price: Number(result.rows[0].price)
        };
        return item;
    }
    catch (err) {
        console.error("DB delete error:", err);
        return undefined
    }
}

async function getAllItems(): Promise<Array<Item>>{
    const query = `SELECT * FROM products`;
    try {
        const result = await pool.query(query);
        if (result.rows.length === 0) {
            return [];
        }
        const items: Array<Item> = result.rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            price: Number(row.price)
        }));
        return items;
    } catch (err) {
        console.error("DB select error:", err);
        return [];
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