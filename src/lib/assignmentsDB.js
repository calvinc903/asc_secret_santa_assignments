'use server'

import { getDB } from './mongodb.js';
const config = require('../../config.js');

export async function getAssignmentsDB(query = {}) {
    const client = await getDB();
    const db = client.db(config.currentYearDatabase);
    const data = await db.collection('assignments').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postAssignmentsDB(gifter, recipient) {
    const client = await getDB();
    const db = client.db('2025');
    const timestamp = new Date().toISOString();
    const result = await db.collection('assignments').insertOne({ gifter, recipient, timestamp });
    return { insertedId: result.insertedId };
}

export async function patchAssignmentsDB(pairs) {
    const client = await getDB();
    const db = client.db(config.currentYearDatabase);
    const timestamp = new Date().toISOString();
    const documents = pairs.map(pair => ({ ...pair, timestamp }));
    const result = await db.collection('assignments').insertMany(documents);
    return { insertedCount: result.insertedCount };
}