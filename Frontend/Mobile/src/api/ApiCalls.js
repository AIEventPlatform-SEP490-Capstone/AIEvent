import EndUrls from './EndUrls';

// Mock data for development
const mockEvents = [
  {
    id: 1,
    title: 'Tech Conference 2024',
    date: '15 Dec 2024',
    time: '09:00 AM',
    location: 'Ho Chi Minh City',
    price: '$50',
    image: 'card1',
    rating: 4.8,
    attendees: 1200,
    description: 'Join us for the biggest tech conference of the year',
    category: 'Technology',
    organizer: 'Tech Corp',
  },
  {
    id: 2,
    title: 'Music Festival',
    date: '20 Dec 2024',
    time: '06:00 PM',
    location: 'Da Nang',
    price: '$30',
    image: 'card2',
    rating: 4.9,
    attendees: 5000,
    description: 'Amazing music festival with top artists',
    category: 'Music',
    organizer: 'Music Events',
  },
  {
    id: 3,
    title: 'Food & Wine Expo',
    date: '25 Dec 2024',
    time: '10:00 AM',
    location: 'Hanoi',
    price: '$25',
    image: 'card3',
    rating: 4.7,
    attendees: 800,
    description: 'Experience the finest food and wine',
    category: 'Food & Drink',
    organizer: 'Culinary Events',
  },
  {
    id: 4,
    title: 'Art Exhibition',
    date: '30 Dec 2024',
    time: '02:00 PM',
    location: 'Hue',
    price: 'Free',
    image: 'card4',
    rating: 4.6,
    attendees: 300,
    description: 'Contemporary art exhibition',
    category: 'Art',
    organizer: 'Art Gallery',
  },
];

class ApiCalls {
  // Mock API calls for development
  static async getEvents() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: mockEvents,
      message: 'Events fetched successfully',
    };
  }

  static async getEventById(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const event = mockEvents.find(e => e.id === parseInt(id));
    return {
      success: !!event,
      data: event,
      message: event ? 'Event found' : 'Event not found',
    };
  }

  static async searchEvents(query) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const filteredEvents = mockEvents.filter(event =>
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.location.toLowerCase().includes(query.toLowerCase()) ||
      event.category.toLowerCase().includes(query.toLowerCase())
    );
    return {
      success: true,
      data: filteredEvents,
      message: 'Search completed',
    };
  }

  static async joinEvent(eventId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { eventId, joined: true },
      message: 'Successfully joined event',
    };
  }

  // Real API calls (for production)
  static async realGetEvents() {
    try {
      const response = await fetch(EndUrls.EVENTS);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch events',
        error: error.message,
      };
    }
  }
  static async getEventDetail(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const event = mockEvents.find(e => e.id === parseInt(id));
    return {
      success: !!event,
      data: event,
      message: event ? 'Event details fetched' : 'Event not found',
    };
  }

  static async joinEvent(eventId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: { eventId, joined: true, joinedAt: new Date().toISOString() },
      message: 'Successfully joined event',
    };
  }

  static async leaveEvent(eventId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: { eventId, joined: false },
      message: 'Successfully left event',
    };
  }

  static async shareEvent(eventId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { eventId, shareUrl: `https://aievent.com/events/${eventId}` },
      message: 'Event shared successfully',
    };
  }
  
}

export default ApiCalls;
