import { Item, ErrorStructure } from './models';
import { ItemSchema } from '../schemas/item.schema';
import { createItemId } from './utils';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const getAllItems = async (request, h) => {
    const items = await prisma.products.findMany();
    return items.map(row => ({
        id: row.id,
        name: row.name,
        price: Number(row.price)
    }));
};

export const getItem = async (request, h) => {
    const { id } = request.params;
    const item = await prisma.products.findUnique({ where: { id: Number(id) } });
    if (!item) {
        return h.response({ error: 'Item not found' }).code(404);
    }
    return h.response({
        id: item.id,
        name: item.name,
        price: Number(item.price)
    }).code(200);
};

export const createItem = async (request, h) => {
    const errors: ErrorStructure[] = [];
    const { name, price } = request.payload;

    if (!name) {
        errors.push({ field: "name", message: "Field \"name\" is required" });
    }
    if (price == null) {
        errors.push({ field: "price", message: "Field \"price\" is required" });
    } else if (price < 0) {
        errors.push({ field: "price", message: "Field \"price\" cannot be negative" });
    }
    if (errors.length) {
        return h.response({ errors }).code(400);
    }

    const parseResult = ItemSchema.safeParse(request.payload);
    if (!parseResult.success) {
        return h.response({ errors: parseResult.error.errors }).code(400);
    }

    const item: Item = {
        id: createItemId(),
        name: parseResult.data.name,
        price: parseResult.data.price
    };
    await prisma.products.create({ data: item });
    return h.response(item).code(201);
};

export const updateItem = async (request, h) => {
    const { id } = request.params;
    const existingItem = await prisma.products.findUnique({ where: { id: Number(id) } });
    if (!existingItem) {
        return h.response({ error: 'Item not found' }).code(404);
    }

    const errors: ErrorStructure[] = [];
    const { price } = request.payload;
    if (price == null) {
        errors.push({ field: "price", message: "Field \"price\" is required" });
    } else if (price < 0) {
        errors.push({ field: "price", message: "Field \"price\" cannot be negative" });
    }
    if (errors.length) {
        return h.response({ errors }).code(400);
    }

    const parseResult = ItemSchema.safeParse(request.payload);
    if (!parseResult.success) {
        return h.response({ errors: parseResult.error.errors }).code(400);
    }

    const updated = await prisma.products.update({
        where: { id: Number(id) },
        data: parseResult.data,
    });
    return h.response({
        id: updated.id,
        name: updated.name,
        price: Number(updated.price)
    }).code(200);
};

export const deleteItem = async (request, h) => {
    const { id } = request.params;
    const deleted = await prisma.products.delete({ where: { id: Number(id) } });
    if (!deleted) {
        return h.response({ error: 'Item not found' }).code(404);
    }
    return h.response().code(204);
};
