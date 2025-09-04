import { logger } from './logger.js';

export class CalendarUtils {
  
  static convertTimezone(date, fromTz, toTz) {
    const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return new Date(utcTime.toLocaleString('en-US', { timeZone: toTz }));
  }

  static isBusinessHours(date, workingHours = { start: 9, end: 17 }, timezone = 'UTC') {
    const hour = date.getHours();
    return hour >= workingHours.start && hour < workingHours.end;
  }

  static getNextBusinessDay(date) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  static getMeetingDurations() {
    return [
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 45, label: '45 minutes' },
      { value: 60, label: '1 hour' },
      { value: 90, label: '1.5 hours' },
      { value: 120, label: '2 hours' }
    ];
  }

  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  static getEventColor(meetingType) {
    const colorMap = {
      'code-review': '3',
      'planning': '2',
      'standup': '1',
      'incident': '11',
      'retrospective': '5',
      'interview': '9',
      'default': '7'
    };
    
    return colorMap[meetingType] || colorMap.default;
  }

  static generateICalString(meeting) {
    const formatDate = (date) => {
      return date.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WorkflowGenie//EN
BEGIN:VEVENT
UID:${meeting.id}@workflowgenie.com
DTSTART:${formatDate(meeting.start)}
DTEND:${formatDate(meeting.end)}
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.description}
LOCATION:${meeting.location || ''}
STATUS:CONFIRMED
ORGANIZER:mailto:${meeting.organizer}
${meeting.attendees.map(a => `ATTENDEE:mailto:${a.email}`).join('\n')}
END:VEVENT
END:VCALENDAR`;
  }

  static parseNaturalTime(expression) {
    const now = new Date();
    const cleanExpr = expression.toLowerCase().trim();
    
    if (cleanExpr.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (cleanExpr.includes('morning')) {
        tomorrow.setHours(9, 0, 0, 0);
      } else if (cleanExpr.includes('afternoon')) {
        tomorrow.setHours(14, 0, 0, 0);
      } else {
        tomorrow.setHours(10, 0, 0, 0);
      }
      
      return tomorrow;
    }
    
    if (cleanExpr.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0);
      return nextWeek;
    }
    
    const timeMatch = cleanExpr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
    if (timeMatch) {
      const [, hours, minutes = '00', period] = timeMatch;
      let hour = parseInt(hours);
      
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      const result = new Date(now);
      result.setHours(hour, parseInt(minutes), 0, 0);
      
      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }
      
      return result;
    }
    
    return null;
  }

  static getOptimalMeetingTimes(preferences = {}) {
    const {
      timezone = 'UTC',
      duration = 30,
      teamSize = 5,
      meetingType = 'general'
    } = preferences;

    const suggestions = [];
    const now = new Date();
    
    for (let day = 1; day <= 5; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      if (['standup', 'planning'].includes(meetingType)) {
        suggestions.push({
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, duration),
          score: 0.9,
          reason: 'Morning - good for team sync'
        });
      }
      
      suggestions.push({
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, duration),
        score: 0.8,
        reason: 'Mid-morning - focused time'
      });
      
      if (['code-review', 'planning'].includes(meetingType)) {
        suggestions.push({
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, duration),
          score: 0.85,
          reason: 'Early afternoon - good for reviews'
        });
      }
    }
    
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  static calculateMeetingComplexity(meetingData) {
    let complexity = 0;
    
    complexity += meetingData.duration || 30;
    
    const attendeeCount = meetingData.attendees?.length || 0;
    complexity += attendeeCount * 5;
    
    if (meetingData.crossTimezone) {
      complexity += 20;
    }
    
    if (meetingData.hasExternalAttendees) {
      complexity += 15;
    }
    
    const typeComplexity = {
      'standup': 5,
      'code-review': 15,
      'planning': 25,
      'interview': 30,
      'incident': 10
    };
    complexity += typeComplexity[meetingData.type] || 10;
    
    return Math.min(complexity, 100);
  }

  static generateAgendaTemplate(meetingType, context = {}) {
    const templates = {
      'code-review': `# Code Review Agenda
      
## Pull Request Details
- **PR #${context.prNumber || 'XXX'}**: ${context.prTitle || 'Title'}
- **Author**: ${context.author || 'Author Name'}
- **Branch**: ${context.branch || 'feature-branch'} → main

## Review Checklist
- [ ] Code quality and style
- [ ] Test coverage
- [ ] Security considerations
- [ ] Performance impact
- [ ] Documentation updates

## Discussion Points
- 

## Action Items
- [ ] 
- [ ] 

## Next Steps
- `,

      'planning': `# Planning Meeting Agenda

## Objectives
- Define project goals and scope
- Identify key milestones
- Assign responsibilities

## Topics
1. **Project Overview**
2. **Timeline Discussion** 
3. **Resource Allocation**
4. **Risk Assessment**
5. **Next Steps**

## Action Items
- [ ] 
- [ ] 

## Meeting Notes
- `,

      'standup': `# Daily Standup

## Team Updates
### What did you accomplish yesterday?
### What will you work on today?  
### Any blockers or impediments?

## Sprint Progress
- [ ] Current sprint goals
- [ ] Blockers to resolve
- [ ] Upcoming deadlines

## Action Items
- [ ] 
- [ ] `,

      'incident': `# Incident Response Meeting

## Incident Details
- **Severity**: ${context.severity || 'TBD'}
- **Affected Services**: ${context.services || 'TBD'}
- **Started**: ${context.startTime || 'TBD'}

## Current Status
- 

## Timeline
- 

## Action Items
- [ ] Immediate fixes
- [ ] Root cause analysis  
- [ ] Post-mortem planning

## Communication Plan
- [ ] Status page updates
- [ ] Customer notifications
- [ ] Internal updates`
    };

    return templates[meetingType] || `# ${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} Meeting

## Agenda
1. 
2. 
3. 

## Notes
- 

## Action Items
- [ ] 
- [ ] `;
  }

  static estimatePreparationTime(meetingData) {
    const baseTime = 5;
    let prepTime = baseTime;
    
    prepTime += Math.floor((meetingData.duration || 30) / 10);
    
    const complexity = this.calculateMeetingComplexity(meetingData);
    prepTime += Math.floor(complexity / 10);
    
    const prepTimeMap = {
      'code-review': 15,
      'interview': 30,
      'planning': 20,
      'presentation': 45,
      'standup': 2
    };
    
    prepTime += prepTimeMap[meetingData.type] || 10;
    
    return Math.min(prepTime, 60);
  }
}

export default CalendarUtils;