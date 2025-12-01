'use server'

import { getDB } from './mongodb.js';

export async function getUsersDB(query = {}) {
    const client = await getDB();
    const db = client.db('2025');
    const data = await db.collection('users').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postUsersDB(name) {
    const client = await getDB();
    const db = client.db('2025');
    const timestamp = new Date().toISOString();
    const result = await db.collection('users').insertOne({ name, timestamp });
    return { insertedId: result.insertedId };
}

export async function postUsersBatchDB(names) {
    const client = await getDB();
    const db = client.db('2025');
    const timestamp = new Date().toISOString();
    const documents = names.map(name => ({ name, timestamp }));
    const result = await db.collection('users').insertMany(documents);
    return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
}

// export async function patchUsersDB(pairs) {
//     const client = await getDB();
//     const db = client.db('2025');
//     const timestamp = new Date().toISOString();
//     const documents = pairs.map(pair => ({ ...pair, timestamp }));
//     const result = await db.collection('users').insertMany(documents);
//     return { insertedCount: result.insertedCount };
// }