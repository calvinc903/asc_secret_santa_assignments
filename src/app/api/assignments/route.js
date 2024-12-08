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
        if (!Array.isArray(names) || names.length === 0) {
            return NextResponse.json({ error: 'Invalid names array' }, { status: 400 });
        }

        // make all names lowercase
        const lowerCaseNames = names.map(name => name.toLowerCase());

        // generate pairs set to let if we want to check tests 
        const pairs = generatePairs(lowerCaseNames);

        // pairs = [
        //     { gifter: 'alice', recipient: 'charlie' },
        //     { gifter: 'charlie', recipient: 'jack' },
        //     { gifter: 'jack', recipient: 'alice' },
        //     { gifter: 'alpha', recipient: 'alpha' },
        //     { gifter: 'alpha', recipient: 'alpha' }
        // ];

        // no duplicate pairs
        if (!checkPairs(pairs)) {
            return NextResponse.json({ error: 'Duplicate Pair Detected: Multiple Same Gifter or Recipient', pairs }, { status: 400 });
        }
        
        // A-to-B and B-to-A rule
        if (!checkMatchesPairs(pairs)) {
            return NextResponse.json({ error: 'A-to-B and B-to-A Rule Violated', pairs }, { status: 400 });
        }

        // no unmatched names
        if (!checkAllNamesMatched(names, pairs)) {
            return NextResponse.json({ error: 'Unmatched Names Found: Each Person Must Have a Gifter and Recipient', pairs }, { status: 400 });
        }

        // no self-gifting
        if (!checkSelfGift(pairs)) {
            return NextResponse.json({ error: 'Self-Gifting Detected: A Person Cannot Gift to Themselves', pairs }, { status: 400 });
        }

        // equal length
        if (!checkEqualLength(names, pairs)) {
            return NextResponse.json({ error: 'Mismatch in Number of Participants and Pairs', pairs }, { status: 400 });
        }

        // If all checks pass
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

        while (gifter === recipient || usedRecipients.has(recipient) || pairs.some(pair => pair.recipient === gifter && pair.gifter === recipient)) {
            recipient = shuffled[Math.floor(Math.random() * shuffled.length)];
        }

        pairs.push({ gifter, recipient });
        usedRecipients.add(recipient);
    }

    return pairs;
}

function checkPairs(pairs) {
    const gifterSet = new Set();
    const recipientSet = new Set();

    for (const pair of pairs) {
        if (gifterSet.has(pair.gifter) || recipientSet.has(pair.recipient)) {
            return false;
        }
        gifterSet.add(pair.gifter);
        recipientSet.add(pair.recipient);
    }
    return true;
}

function checkMatchesPairs(pairs) {
    const mapCheck = new Map();
    for (const pair of pairs) {
        if (mapCheck.get(pair.gifter) === pair.recipient) {
            return false;
        }
        mapCheck.set(pair.recipient, pair.gifter);
    }
    return true;
}

function checkAllNamesMatched(names, pairs) {
    const gifters = new Set(pairs.map(pair => pair.gifter));
    const recipients = new Set(pairs.map(pair => pair.recipient));
    
    // Find names missing as gifters or recipients
    const missingAsGifters = names.filter(name => !gifters.has(name));
    const missingAsRecipients = names.filter(name => !recipients.has(name));

    // Return true if there are missing names in either role
    return missingAsGifters.length > 0 || missingAsRecipients.length > 0;
}

function checkSelfGift(pairs) {
    return pairs.every(pair => pair.gifter !== pair.recipient);
}

function checkEqualLength(names, pairs) {
    return names.length === pairs.length;
}