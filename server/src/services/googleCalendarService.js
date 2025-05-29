const { google } = require('googleapis');
const User = require('../models/User');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:5001/auth/google/callback'
    );
  }

  async getCalendarClient(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.googleAccessToken) {
        throw new Error('User not found or no Google access token');
      }

      this.oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      return google.calendar({ version: 'v3', auth: this.oauth2Client });
    } catch (error) {
      console.error('Error getting calendar client:', error);
      throw error;
    }
  }

  async syncTemplateToGoogleCalendar(userId, template, date) {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      // Create events for each time block in the template
      const events = [];
      
      for (const timeBlock of template.timeBlocks) {
        const startDateTime = new Date(`${date}T${timeBlock.startTime}:00`);
        const endDateTime = new Date(`${date}T${timeBlock.endTime}:00`);
        
        const event = {
          summary: timeBlock.blockName || timeBlock.activityTypeId.name,
          description: `Eterny Activity: ${timeBlock.activityTypeId.name}${timeBlock.notes ? '\n\nNotes: ' + timeBlock.notes : ''}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'UTC',
          },
          source: {
            title: 'Eterny',
            url: 'https://eterny.app',
          },
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });

        events.push(response.data);
      }

      return events;
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      throw error;
    }
  }

  async deleteEternyEventsForDate(userId, date) {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59Z`);
      
      // Get all events for the day
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        q: 'Eterny Activity',
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      // Delete events that were created by Eterny
      for (const event of events) {
        if (event.description && event.description.includes('Eterny Activity:')) {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: event.id,
          });
        }
      }

      return events.length;
    } catch (error) {
      console.error('Error deleting Eterny events:', error);
      throw error;
    }
  }

  async syncDaySchedule(userId, date, templates) {
    try {
      // First, delete existing Eterny events for this date
      await this.deleteEternyEventsForDate(userId, date);
      
      // Then, create new events for all templates
      const allEvents = [];
      
      for (const templateData of templates) {
        const events = await this.syncTemplateToGoogleCalendar(userId, templateData.template, date);
        allEvents.push(...events);
      }

      return {
        success: true,
        eventsCreated: allEvents.length,
        events: allEvents,
      };
    } catch (error) {
      console.error('Error syncing day schedule:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService(); 