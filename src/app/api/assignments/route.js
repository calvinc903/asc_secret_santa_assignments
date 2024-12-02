import { getAssignmentsDB, postAssignmentsDB } from '../../../lib/assignmentsDB';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getAssignmentsDB();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const requestData = await request.json();
        const result = await postAssignmentsDB(requestData);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to post assignment' }, { status: 500 });
    }
}