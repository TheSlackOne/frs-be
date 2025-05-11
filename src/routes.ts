import { Server } from "@hapi/hapi"
import { createItemId } from "./utils"

// Item model.
interface Item {
    id: Number,
    name: String,
    price: Number
}

// ToDo: In-memory database. Replace by a persistent database.
// const inMemoryDb = new Map<number, Item>()
let inMemoryDb: Array<Item> = []

async function getItemById(id: number) {
    return inMemoryDb.find(item => item.id === Number(id));
}

async function updateItemById(id: number, updatedData: Partial<Item>) {
    const itemIndex = inMemoryDb.findIndex(item => item.id === Number(id));
    if (itemIndex === -1) {
        return;
    }
    inMemoryDb[itemIndex] = {
        ...inMemoryDb[itemIndex],
        ...updatedData
    };
    return inMemoryDb[itemIndex];
}

async function deleteItemById(id: number) {
    const itemIndex = inMemoryDb.findIndex(item => item.id === Number(id));
    if (itemIndex === -1) {
        return null;
    }
    const [deletedItem] = inMemoryDb.splice(itemIndex, 1);
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
            const price = request.payload["price"];
            const item = {
                id: createItemId(),
                name: name,
                price: Number(price)
            };
            inMemoryDb.push(item);
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