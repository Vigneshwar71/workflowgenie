import { google } from 'googleapis';
import { logger, createPerformanceTimer } from '../utils/logger.js';

export class CalendarConnector {
  constructor() {
    this.clients = new Map();
    this.isInitialized = false;
    this.calendar = google.calendar('v3');
  }

  async initialize() {
    logger.info('Initializing Google Calendar connector...');
    this.isInitialized = true;
    logger.info('Google Calendar connector initialized');
  }

  getClient(userToken) {
    if (!userToken) {
      throw new Error('Google Calendar token required for API access');
    }

    if (this.clients.has(userToken)) {
      return this.clients.get(userToken);
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userToken
    });

    this.clients.set(userToken, oauth2Client);
    return oauth2Client;
  }

  async findOptimalTime(attendees, userToken, requestId, preferences = {}) {
    const timer = createPerformanceTimer('calendar_find_optimal_time');
    
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      logger.debug('Finding optimal meeting time', {
        requestId,
        attendeeCount: attendees.length,
        preferences
      });

      const {
        duration = 30,
        timeMin = new Date(),
        timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        workingHours = { start: 9, end: 17 },
        timezone = 'UTC',
        bufferMinutes = 15
      } = preferences;

      const calendarIds = this.extractCalendarIds(attendees);
      
      if (calendarIds.length === 0) {
        throw new Error('No valid email addresses found for attendees');
      }

      const freeBusyRequest = {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map(email => ({ id: email })),
        timeZone: timezone
      };

      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: freeBusyRequest
      });

      const busyTimes = freeBusyResponse.data.calendars;
      
      const availableSlots = this.findAvailableSlots({
        busyTimes,
        calendarIds,
        timeMin,
        timeMax,
        duration,
        workingHours,
        timezone,
        bufferMinutes
      });

      if (availableSlots.length === 0) {
        throw new Error('No available time slots found for all attendees');
      }

      const optimalSlot = this.selectOptimalSlot(availableSlots, preferences);

      logger.info('Optimal meeting time found', {
        requestId,
        startTime: optimalSlot.start,
        endTime: optimalSlot.end,
        attendeeCount: attendees.length,
        alternativesFound: availableSlots.length,
        executionTime: timer.end()
      });

      return {
        start: optimalSlot.start,
        end: optimalSlot.end,
        duration: duration,
        timezone: timezone,
        attendees: calendarIds,
        alternatives: availableSlots.slice(1, 4),
        formatted: this.formatMeetingTime(optimalSlot.start, optimalSlot.end, timezone),
        confidence: this.calculateConfidence(optimalSlot, availableSlots)
      };

    } catch (error) {
      timer.end();
      
      logger.error('Failed to find optimal meeting time', {
        requestId,
        error: error.message,
        attendeeCount: attendees.length
      });
      
      throw new Error(`Calendar scheduling failed: ${error.message}`);
    }
  }

  async createMeeting(meetingData, userToken, requestId) {
    const timer = createPerformanceTimer('calendar_create_meeting');
    
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      logger.debug('Creating calendar meeting', {
        requestId,
        title: meetingData.title,
        startTime: meetingData.start
      });

      const event = {
        summary: meetingData.title,
        description: this.buildMeetingDescription(meetingData),
        start: {
          dateTime: meetingData.start instanceof Date ? meetingData.start.toISOString() : meetingData.start,
          timeZone: meetingData.timezone || 'UTC'
        },
        end: {
          dateTime: meetingData.end instanceof Date ? meetingData.end.toISOString() : meetingData.end,
          timeZone: meetingData.timezone || 'UTC'
        },
        attendees: this.buildAttendeeList(meetingData.attendees),
        location: meetingData.location || 'Video Conference',
        conferenceData: meetingData.createVideoCall ? {
          createRequest: {
            requestId: `${requestId}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        } : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 }
          ]
        },
        visibility: meetingData.private ? 'private' : 'default',
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: true
      };

      if (meetingData.recurringPattern) {
        event.recurrence = [meetingData.recurringPattern];
      }

      if (meetingData.attachments && meetingData.attachments.length > 0) {
        event.attachments = meetingData.attachments.map(attachment => ({
          fileUrl: attachment.url,
          title: attachment.title,
          mimeType: attachment.mimeType || 'application/octet-stream'
        }));
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: meetingData.createVideoCall ? 1 : 0,
        sendUpdates: 'all'
      });

      const createdEvent = response.data;

      logger.info('Calendar meeting created successfully', {
        requestId,
        eventId: createdEvent.id,
        title: createdEvent.summary,
        startTime: createdEvent.start.dateTime,
        attendeeCount: createdEvent.attendees?.length || 0,
        hasVideoCall: !!createdEvent.conferenceData,
        executionTime: timer.end()
      });

      return {
        id: createdEvent.id,
        title: createdEvent.summary,
        description: createdEvent.description,
        start: new Date(createdEvent.start.dateTime || createdEvent.start.date),
        end: new Date(createdEvent.end.dateTime || createdEvent.end.date),
        timezone: createdEvent.start.timeZone,
        location: createdEvent.location,
        attendees: createdEvent.attendees?.map(a => ({
          email: a.email,
          responseStatus: a.responseStatus,
          optional: a.optional
        })) || [],
        videoCall: createdEvent.conferenceData ? {
          joinUrl: createdEvent.conferenceData.entryPoints?.[0]?.uri,
          conferenceId: createdEvent.conferenceData.conferenceId
        } : null,
        htmlLink: createdEvent.htmlLink,
        icalUID: createdEvent.iCalUID,
        status: createdEvent.status,
        created: new Date(createdEvent.created),
        updated: new Date(createdEvent.updated)
      };

    } catch (error) {
      timer.end();
      
      if (error.code === 403) {
        throw new Error('Calendar access denied. Please check Google Calendar permissions.');
      }
      
      if (error.code === 409) {
        throw new Error('Meeting conflict detected. Please choose a different time.');
      }
      
      logger.error('Failed to create calendar meeting', {
        requestId,
        error: error.message,
        code: error.code
      });
      
      throw new Error(`Failed to create meeting: ${error.message}`);
    }
  }

  async getCalendarEvents(userToken, timeMin, timeMax, requestId) {
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      logger.debug('Fetching calendar events', {
        requestId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      const events = response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        location: event.location,
        attendees: event.attendees?.length || 0,
        status: event.status,
        creator: event.creator.email,
        organizer: event.organizer.email
      }));

      logger.info('Calendar events retrieved', {
        requestId,
        eventCount: events.length,
        dateRange: `${timeMin.toISOString().split('T')[0]} to ${timeMax.toISOString().split('T')[0]}`
      });

      return events;

    } catch (error) {
      logger.error('Failed to fetch calendar events', {
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  async updateMeeting(eventId, updates, userToken, requestId) {
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      logger.debug('Updating calendar meeting', {
        requestId,
        eventId,
        updates: Object.keys(updates)
      });

      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const updatedEvent = {
        ...existingEvent.data,
        ...updates,
        start: updates.start ? {
          dateTime: updates.start instanceof Date ? updates.start.toISOString() : updates.start,
          timeZone: updates.timezone || existingEvent.data.start.timeZone
        } : existingEvent.data.start,
        end: updates.end ? {
          dateTime: updates.end instanceof Date ? updates.end.toISOString() : updates.end,
          timeZone: updates.timezone || existingEvent.data.end.timeZone
        } : existingEvent.data.end
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      logger.info('Calendar meeting updated', {
        requestId,
        eventId,
        title: response.data.summary
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to update calendar meeting', {
        requestId,
        eventId,
        error: error.message
      });
      throw error;
    }
  }

  async deleteMeeting(eventId, userToken, requestId, sendUpdates = true) {
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      logger.debug('Deleting calendar meeting', {
        requestId,
        eventId
      });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: sendUpdates ? 'all' : 'none'
      });

      logger.info('Calendar meeting deleted', {
        requestId,
        eventId
      });

      return { deleted: true, eventId };

    } catch (error) {
      logger.error('Failed to delete calendar meeting', {
        requestId,
        eventId,
        error: error.message
      });
      throw error;
    }
  }

  extractCalendarIds(attendees) {
    const calendarIds = [];
    
    for (const attendee of attendees) {
      let email;
      
      if (typeof attendee === 'string') {
        email = attendee.includes('@') ? attendee : null;
      } else if (attendee.email) {
        email = attendee.email;
      } else if (attendee.login && attendee.login.includes('@')) {
        email = attendee.login;
      }
      
      if (email && email.includes('@')) {
        calendarIds.push(email);
      }
    }
    
    return [...new Set(calendarIds)];
  }

  findAvailableSlots({ busyTimes, calendarIds, timeMin, timeMax, duration, workingHours, timezone, bufferMinutes }) {
    const availableSlots = [];
    const durationMs = duration * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;
    
    const allBusyPeriods = [];
    
    for (const calendarId of calendarIds) {
      const busyData = busyTimes[calendarId];
      if (busyData && busyData.busy) {
        for (const busyPeriod of busyData.busy) {
          allBusyPeriods.push({
            start: new Date(busyPeriod.start),
            end: new Date(busyPeriod.end)
          });
        }
      }
    }

    allBusyPeriods.sort((a, b) => a.start - b.start);

    const mergedBusyPeriods = this.mergeBusyPeriods(allBusyPeriods);

    let currentTime = new Date(Math.max(timeMin.getTime(), Date.now()));
    
    currentTime = this.roundToNextQuarter(currentTime);
    
    for (const busyPeriod of mergedBusyPeriods) {
      const gapStart = currentTime;
      const gapEnd = new Date(busyPeriod.start.getTime() - bufferMs);
      
      if (gapEnd > gapStart) {
        const slotsInGap = this.findSlotsInTimeRange(gapStart, gapEnd, durationMs, workingHours, timezone);
        availableSlots.push(...slotsInGap);
      }
      
      currentTime = new Date(busyPeriod.end.getTime() + bufferMs);
    }

    if (currentTime < timeMax) {
      const finalSlots = this.findSlotsInTimeRange(currentTime, timeMax, durationMs, workingHours, timezone);
      availableSlots.push(...finalSlots);
    }

    return availableSlots.slice(0, 20);
  }

  findSlotsInTimeRange(startTime, endTime, durationMs, workingHours, timezone) {
    const slots = [];
    const current = new Date(startTime);
    
    while (current.getTime() + durationMs <= endTime.getTime()) {
      const hour = current.getHours();
      
      if (hour >= workingHours.start && hour < workingHours.end) {
        const slotEnd = new Date(current.getTime() + durationMs);
        
        if (slotEnd.getHours() <= workingHours.end) {
          slots.push({
            start: new Date(current),
            end: slotEnd
          });
        }
      }
      
      current.setTime(current.getTime() + 15 * 60 * 1000);
    }
    
    return slots;
  }

  mergeBusyPeriods(busyPeriods) {
    if (busyPeriods.length === 0) return [];
    
    const merged = [busyPeriods[0]];
    
    for (let i = 1; i < busyPeriods.length; i++) {
      const current = busyPeriods[i];
      const lastMerged = merged[merged.length - 1];
      
      if (current.start <= lastMerged.end) {
        lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), current.end.getTime()));
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }

  selectOptimalSlot(availableSlots, preferences) {
    if (availableSlots.length === 0) {
      throw new Error('No available slots provided');
    }

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const scoredSlots = availableSlots.map(slot => {
      let score = 0;
      const hour = slot.start.getHours();
      const day = slot.start.getDay();

      if (slot.start > twoHoursFromNow) {
        score += 100;
      }

      if (hour >= 10 && hour <= 16) {
        score += 50;
      }

      if (day >= 2 && day <= 4) {
        score += 20;
      }

      if (day === 1 && hour < 10) score -= 30;
      if (day === 5 && hour > 15) score -= 30;

      const hoursSinceNow = (slot.start.getTime() - now.getTime()) / (60 * 60 * 1000);
      if (hoursSinceNow < 48) {
        score += Math.max(0, 50 - hoursSinceNow);
      }

      return { slot, score };
    });

    scoredSlots.sort((a, b) => b.score - a.score);
    return scoredSlots[0].slot;
  }

  roundToNextQuarter(date) {
    const minutes = date.getMinutes();
    const remainder = minutes % 15;
    
    if (remainder === 0) return date;
    
    const roundedDate = new Date(date);
    roundedDate.setMinutes(minutes + (15 - remainder));
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    
    return roundedDate;
  }

  buildMeetingDescription(meetingData) {
    let description = meetingData.description || '';
    
    if (meetingData.prNumber && meetingData.repository) {
      description += `\n\nRelated Pull Request: https://github.com/${meetingData.repository}/pull/${meetingData.prNumber}`;
    }
    
    if (meetingData.slackChannel) {
      description += `\nDiscussion Channel: ${meetingData.slackChannel}`;
    }
    
    if (meetingData.notionPage) {
      description += `\nMeeting Notes: ${meetingData.notionPage}`;
    }
    
    description += '\n\n---\nScheduled by WorkflowGenie';
    
    return description;
  }

  buildAttendeeList(attendees) {
    if (!attendees) return [];
    
    return attendees.map(attendee => {
      if (typeof attendee === 'string') {
        return { email: attendee };
      }
      
      return {
        email: attendee.email || attendee.login,
        displayName: attendee.name || attendee.login,
        optional: attendee.optional || false,
        responseStatus: 'needsAction'
      };
    });
  }

  formatMeetingTime(start, end, timezone) {
    const options = {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone
    };
    
    const startFormatted = start.toLocaleString('en-US', options);
    const endTime = end.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: timezone 
    });
    
    return `${startFormatted} - ${endTime}`;
  }

  calculateConfidence(selectedSlot, allSlots) {
    const totalSlots = allSlots.length;
    
    if (totalSlots === 1) return 1.0;
    if (totalSlots <= 3) return 0.9;
    if (totalSlots <= 10) return 0.8;
    
    return 0.7;
  }

  async getCalendarInfo(userToken) {
    try {
      const auth = this.getClient(userToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.calendars.get({
        calendarId: 'primary'
      });

      return {
        id: response.data.id,
        summary: response.data.summary,
        timeZone: response.data.timeZone,
        accessRole: response.data.accessRole
      };

    } catch (error) {
      logger.error('Failed to get calendar info', { error: error.message });
      throw error;
    }
  }

  async cleanup() {
    logger.info('Cleaning up Google Calendar connector...');
    this.clients.clear();
    logger.info('Google Calendar cleanup complete');
  }
}