import { NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
const config = require('../../../../config.js');

export async function GET(request) {
  try {
    const client = await getDB();
    
    // Get years to include from config
    const yearsToInclude = config.getArchiveYears();
    
    if (yearsToInclude.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get event info for all years from events/info collection
    const eventsDb = client.db('events');
    const eventInfoDocs = await eventsDb.collection('info').find({
      year: { $in: yearsToInclude }
    }).toArray();
    console.log('[Archives] Found event info docs:', eventInfoDocs);
    
    // Create a map of year -> event info
    const eventInfoMap = {};
    eventInfoDocs.forEach(doc => {
      eventInfoMap[doc.year] = {
        partyDate: doc.party_date,
        spreadsheetLink: doc.spreadsheet_link
      };
    });
    
    // Collect all archives from applicable years
    const allArchives = [];
    
    for (const year of yearsToInclude) {
      const db = client.db(year);
      const eventInfo = eventInfoMap[year];
      console.log(`[Archives] Year ${year}: Event info:`, eventInfo);
      
      // Get assignments
      const assignments = await db.collection('assignments').find({}).toArray();
      console.log(`[Archives] Year ${year}: Found ${assignments.length} assignments`);
      
      // Get videos from youtube collection
      const youtubeVideos = await db.collection('youtube').find({}).toArray();
      console.log(`[Archives] Year ${year}: Found ${youtubeVideos.length} videos in 'youtube'`);
      
      if (youtubeVideos.length > 0) {
        console.log(`[Archives] Year ${year}: Sample video:`, youtubeVideos[0]);
      }
      
      // Create a map of recipient -> videoURL
      const videoMap = {};
      youtubeVideos.forEach(video => {
        console.log(`[Archives] Processing video for user_id: ${video.user_id}, videoURL: ${video.videoURL}`);
        if (video.user_id && video.videoURL) {
          videoMap[video.user_id.toLowerCase()] = video.videoURL;
        }
      });
      console.log(`[Archives] Year ${year}: Video map:`, videoMap);
      
      // Collect unique players for this year
      const playersSet = new Set();
      assignments.forEach(assignment => {
        playersSet.add(assignment.gifter.toLowerCase());
        playersSet.add(assignment.recipient.toLowerCase());
      });
      const players = Array.from(playersSet).sort();
      
      // Combine assignments with videos
      assignments.forEach(assignment => {
        const gifter = assignment.gifter.toLowerCase();
        const recipient = assignment.recipient.toLowerCase();
        const videoURL = videoMap[recipient];
        
        allArchives.push({
          gifter,
          recipient,
          videoURL: videoURL || null,
          year,
          partyDate: eventInfo?.partyDate || null,
          spreadsheetLink: eventInfo?.spreadsheetLink || null,
          players: players,
          playerCount: players.length
        });
      });
    }
    
    // Sort by year (descending) then by gifter name
    allArchives.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year.localeCompare(a.year); // Newest first
      }
      return a.gifter.localeCompare(b.gifter);
    });
    
    return NextResponse.json(allArchives);
  } catch (error) {
    console.error('Archives API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}
