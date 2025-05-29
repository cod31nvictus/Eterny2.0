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

  async syncScheduleToCalendar(userId, date, timeBlocks) {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      // First, delete existing events for this date that were created by our app
      await this.deleteExistingEvents(calendar, date);
      
      // Create separate events for each activity
      const events = [];
      for (const timeBlock of timeBlocks) {
        // Create one event per activity in the time block
        for (const activity of timeBlock.activities) {
          const event = await this.createCalendarEventForActivity(calendar, date, timeBlock, activity);
          if (event) {
            events.push(event);
          }
        }
      }
      
      return events;
    } catch (error) {
      console.error('Error syncing schedule to calendar:', error);
      throw error;
    }
  }

  async deleteExistingEvents(calendar, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        q: '[Eterny]', // Search for events with our app identifier
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      // Delete each event
      for (const event of events) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: event.id,
        });
      }
      
      console.log(`Deleted ${events.length} existing Eterny events for ${date}`);
    } catch (error) {
      console.error('Error deleting existing events:', error);
      // Don't throw here, just log the error
    }
  }

  async createCalendarEventForActivity(calendar, date, timeBlock, activity) {
    try {
      const startDateTime = this.createDateTime(date, timeBlock.startTime);
      const endDateTime = this.createDateTime(date, timeBlock.endTime);
      
      // Use custom name if available, otherwise use activity type name
      const activityName = activity.blockName || activity.name;
      
      const event = {
        summary: `[Eterny] ${activityName}`,
        description: `Wellness activity: ${activity.name}${activity.wellnessTags ? `\nTags: ${activity.wellnessTags.join(', ')}` : ''}`,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/New_York', // You might want to make this configurable
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/New_York',
        },
        colorId: '2', // Green color for wellness activities
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event for activity:', error);
      return null;
    }
  }

  async createCalendarEvent(calendar, date, timeBlock) {
    try {
      const startDateTime = this.createDateTime(date, timeBlock.startTime);
      const endDateTime = this.createDateTime(date, timeBlock.endTime);
      
      // Create activity names list
      const activityNames = timeBlock.activities.map(activity => 
        activity.blockName || activity.name
      ).join(', ');
      
      const event = {
        summary: `[Eterny] ${activityNames}`,
        description: `Wellness activities: ${timeBlock.activities.map(a => a.name).join(', ')}`,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/New_York', // You might want to make this configurable
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/New_York',
        },
        colorId: '2', // Green color for wellness activities
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  createDateTime(date, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  }

  async enableCalendarSync(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        googleCalendarEnabled: true
      });
      return { success: true, message: 'Google Calendar sync enabled' };
    } catch (error) {
      console.error('Error enabling calendar sync:', error);
      throw error;
    }
  }

  async disableCalendarSync(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        googleCalendarEnabled: false
      });
      return { success: true, message: 'Google Calendar sync disabled' };
    } catch (error) {
      console.error('Error disabling calendar sync:', error);
      throw error;
    }
  }

  async getCalendarSyncStatus(userId) {
    try {
      const user = await User.findById(userId);
      return {
        enabled: user?.googleCalendarEnabled || false,
        hasTokens: !!(user?.googleAccessToken && user?.googleRefreshToken)
      };
    } catch (error) {
      console.error('Error getting calendar sync status:', error);
      return { enabled: false, hasTokens: false };
    }
  }

  async syncDayToCalendar(userId, date) {
    try {
      const PlannedDay = require('../models/PlannedDay');
      
      // Get the schedule for this date using PlannedDay model
      const plannedDays = await PlannedDay.find({
        userId: userId,
        isActive: true,
        $or: [
          // One-time events on this specific date
          {
            'recurrence.type': 'none',
            startDate: { $lte: new Date(date) },
            $or: [
              { endDate: { $gte: new Date(date) } },
              { endDate: null }
            ]
          },
          // Recurring events that might include this date
          {
            'recurrence.type': { $ne: 'none' },
            startDate: { $lte: new Date(date) },
            $or: [
              { 'recurrence.endDate': { $gte: new Date(date) } },
              { 'recurrence.endDate': null }
            ]
          }
        ]
      }).populate({
        path: 'templateId',
        populate: {
          path: 'timeBlocks.activityTypeId',
          populate: {
            path: 'wellnessTagIds'
          }
        }
      });

      // Filter planned days that actually apply to this specific date
      const applicablePlannedDays = plannedDays.filter(plannedDay => 
        plannedDay.isScheduledForDate(date)
      );

      if (applicablePlannedDays.length === 0) {
        console.log(`No schedule to sync for ${date}`);
        return [];
      }

      // Convert to individual activities format instead of grouping by time blocks
      const activities = [];
      
      applicablePlannedDays.forEach(plannedDay => {
        if (plannedDay.templateId && plannedDay.templateId.timeBlocks) {
          plannedDay.templateId.timeBlocks.forEach(timeBlock => {
            const activity = {
              _id: timeBlock._id,
              name: timeBlock.activityTypeId.name,
              wellnessTags: timeBlock.activityTypeId.wellnessTagIds?.map(tag => tag.name) || [],
              blockName: timeBlock.blockName,
              startTime: timeBlock.startTime,
              endTime: timeBlock.endTime
            };
            
            activities.push(activity);
          });
        }
      });

      // Convert to time blocks format for the sync method
      const timeBlocks = activities.map(activity => ({
        startTime: activity.startTime,
        endTime: activity.endTime,
        activities: [activity]
      }));

      // Sync to Google Calendar
      const events = await this.syncScheduleToCalendar(userId, date, timeBlocks);
      
      console.log(`Synced ${events.length} events to Google Calendar for ${date}`);
      return events;
    } catch (error) {
      console.error('Error syncing day to calendar:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService(); 