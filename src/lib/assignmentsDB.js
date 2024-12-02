'use server'

import { getDB } from './mongodb.js';

export async function getAssignmentsDB() {
    const client = await getDB();
    const db = client.db('2024');
    const data = await db.collection('assignments').find({}).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postAssignmentsDB(request) {
    const client = await getDB();
    const db = client.db('2024');
    const { gifter, recipient } = await request.json();
    const timestamp = new Date().toISOString();
    const result = await db.collection('assignments').insertOne({ gifter, recipient, timestamp });
    return { insertedId: result.insertedId };
}