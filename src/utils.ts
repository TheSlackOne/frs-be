import { v4 as uuid } from 'uuid';

export const createItemId = (): number => {
    const generatedUuid = uuid();
    const hexString = generatedUuid.replace(/-/g, '');
    const first6char = hexString.substring(0, 6);
    const bigIntUuid = BigInt('0x' + first6char);
    const bigIntUuidString = bigIntUuid.toString(10);
    const itemUuid = bigIntUuidString.substring(0, 8);
    return Number(itemUuid);
}
