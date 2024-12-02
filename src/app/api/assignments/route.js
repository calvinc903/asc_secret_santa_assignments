import { getAssignmentsDB, postAssignmentsDB, patchAssignmentsDB } from '../../../lib/assignmentsDB';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = {};
        if (searchParams.has('gifter')) {
            query.gifter = searchParams.get('gifter');
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
        const pairs = generatePairs(names);
        const result = await patchAssignmentsDB(pairs);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to patch assignments' }, { status: 500 });
    }
}

function generatePairs(names) {
    const shuffled = names.slice().sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < names.length; i++) {
        const gifter = names[i];
        const recipient = shuffled[i];
        if (gifter === recipient) {
            return generatePairs(names); // Retry if a name is matched to itself
        }
        pairs.push({ gifter, recipient });
    }
    return pairs;
}