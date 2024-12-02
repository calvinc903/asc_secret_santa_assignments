import { getAssignmentsDB, postAssignmentsDB, patchAssignmentsDB } from '../../../lib/assignmentsDB';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = {};
        if (searchParams.has('gifter')) {
            query.gifter = searchParams.get('gifter').toLowerCase();
        }
        if (searchParams.has('recipient')) {
            query.recipient = searchParams.get('recipient');
        }
        const data = await getAssignmentsDB(query);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { gifter, recipient } = await request.json();
        const result = await postAssignmentsDB(gifter, recipient);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to post assignment' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const { names } = await request.json();
        const lowerCaseNames = names.map(name => name.toLowerCase());
        const pairs = generatePairs(lowerCaseNames);
        const result = await patchAssignmentsDB(pairs);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to patch assignments' }, { status: 500 });
    }
}

function generatePairs(names) {
    const shuffled = names.slice().sort(() => Math.random() - 0.5);
    const pairs = [];
    const usedRecipients = new Set();

    for (let i = 0; i < names.length; i++) {
        const gifter = names[i];
        let recipient = shuffled[i];

        // Ensure gifter is not matched to themselves and no reciprocal matches
        while (gifter === recipient || usedRecipients.has(recipient) || pairs.some(pair => pair.recipient === gifter && pair.gifter === recipient)) {
            recipient = shuffled[Math.floor(Math.random() * shuffled.length)];
        }

        pairs.push({ gifter, recipient });
        usedRecipients.add(recipient);
    }

    return pairs;
}