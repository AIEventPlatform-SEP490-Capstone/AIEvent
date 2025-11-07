import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvents,
  fetchEventById,
  searchEvents,
  selectEvents,
  selectCurrentEvent,
  selectEventsLoading,
  selectEventsError,
  selectEventsTotalCount,
  clearCurrentEvent,
  clearEvents
} from '../redux/slices/eventsSlice';

export const useEvents = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const events = useSelector(selectEvents);
  const currentEvent = useSelector(selectCurrentEvent);
  const loading = useSelector(selectEventsLoading);
  const error = useSelector(selectEventsError);
  const totalCount = useSelector(selectEventsTotalCount);

  // Actions
  const getEvents = async (params = {}) => {
    try {
      const response = await dispatch(fetchEvents(params)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to fetch events:', err);
      return null;
    }
  };

  const getEventById = async (eventId) => {
    try {
      const response = await dispatch(fetchEventById(eventId)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to fetch event:', err);
      return null;
    }
  };

  const searchEventsAPI = async (query) => {
    try {
      const response = await dispatch(searchEvents(query)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to search events:', err);
      return null;
    }
  };

  const clearCurrent = () => dispatch(clearCurrentEvent());
  const clearAllEvents = () => dispatch(clearEvents());

  return {
    events,
    currentEvent,
    loading,
    error,
    totalCount,
    getEvents,
    getEventById,
    searchEvents: searchEventsAPI,
    clearCurrentEvent: clearCurrent,
    clearEvents: clearAllEvents,
  };
};

export default useEvents;