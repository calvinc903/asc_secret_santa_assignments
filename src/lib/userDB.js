'use server'

import { getDB } from './mongodb.js';

export async function getUsersDB(query = {}) {
    const client = await getDB();
    const db = client.db('2024');
    const data = await db.collection('users').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postUsersDB(name) {
    const client = await getDB();
    const db = client.db('2024');
    const timestamp = new Date().toISOString();
    const result = await db.collection('users').insertOne({ name, timestamp });
    return { insertedId: result.insertedId };
}

// export async function patchUsersDB(pairs) {
//     const client = await getDB();
//     const db = client.db('2024');
//     const timestamp = new Date().toISOString();
//     const documents = pairs.map(pair => ({ ...pair, timestamp }));
//     const result = await db.collection('users').insertMany(documents);
//     return { insertedCount: result.insertedCount };
// }