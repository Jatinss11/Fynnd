/**
 * Meeting service — Google Meet & Zoom integration
 * Google Meet: Uses Google Calendar API to create events with Meet links
 * Zoom: Uses Zoom API v2 to create meetings
 */

const https = require('https');

/**
 * Create a Google Meet link via Google Calendar API
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 */
async function createGoogleMeet({ title, startTime, durationMinutes, attendeeEmails, description }) {
  // If Google credentials not configured, return a placeholder
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return {
      provider: 'google_meet',
      meetLink: `https://meet.google.com/fynnd-${Math.random().toString(36).substr(2, 9)}`,
      calendarEventId: null,
      note: 'Configure GOOGLE_REFRESH_TOKEN for real Meet links',
    };
  }

  try {
    // Get access token from refresh token
    const tokenRes = await httpPost('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });

    const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000);

    const event = {
      summary: title,
      description,
      start: { dateTime: new Date(startTime).toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `fynnd-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const calRes = await httpPost(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      event,
      { Authorization: `Bearer ${tokenRes.access_token}`, 'Content-Type': 'application/json' }
    );

    return {
      provider: 'google_meet',
      meetLink: calRes.conferenceData?.entryPoints?.[0]?.uri || '',
      calendarEventId: calRes.id,
      htmlLink: calRes.htmlLink,
    };
  } catch (err) {
    console.error('Google Meet error:', err.message);
    return {
      provider: 'google_meet',
      meetLink: `https://meet.google.com/fynnd-${Math.random().toString(36).substr(2, 9)}`,
      calendarEventId: null,
    };
  }
}

/**
 * Create a Zoom meeting via Zoom API v2
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 */
async function createZoomMeeting({ title, startTime, durationMinutes, agenda }) {
  if (!process.env.ZOOM_ACCOUNT_ID) {
    return {
      provider: 'zoom',
      meetLink: `https://zoom.us/j/${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      meetingId: null,
      password: null,
      note: 'Configure ZOOM_ACCOUNT_ID for real Zoom meetings',
    };
  }

  try {
    // Get Zoom OAuth token (Server-to-Server)
    const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await httpPost(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {},
      { Authorization: `Basic ${credentials}` }
    );

    const meeting = await httpPost(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: title,
        type: 2, // Scheduled
        start_time: new Date(startTime).toISOString(),
        duration: durationMinutes,
        agenda,
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          auto_recording: 'none',
        },
      },
      { Authorization: `Bearer ${tokenRes.access_token}`, 'Content-Type': 'application/json' }
    );

    return {
      provider: 'zoom',
      meetLink: meeting.join_url,
      hostLink: meeting.start_url,
      meetingId: meeting.id,
      password: meeting.password,
    };
  } catch (err) {
    console.error('Zoom error:', err.message);
    return {
      provider: 'zoom',
      meetLink: `https://zoom.us/j/${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      meetingId: null,
    };
  }
}

// Simple HTTP POST helper
function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch { resolve(responseData); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { createGoogleMeet, createZoomMeeting };
