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
        method: 'POST',
        path: '/items',
        handler: async (request, h) => {
            const name = request.payload["name"];
            const price = request.payload["price"];
            inMemoryDb.push({
                id: createItemId(),
                name: name,
                price: Number(price)
            });
            return 0;
        }
    })
}