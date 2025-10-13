import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  fetchEvents,
  fetchEventsByOrganizer,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  selectEvents,
  selectCurrentEvent,
  selectEventsLoading,
  selectEventsError,
  selectEventsTotalCount,
  clearCurrentEvent,
  clearEvents
} from '../store/slices/eventsSlice';

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
      toast.error('Không thể tải danh sách sự kiện');
      return null;
    }
  };

  const getEventsByOrganizer = async (params = {}) => {
    try {
      const response = await dispatch(fetchEventsByOrganizer(params)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải danh sách sự kiện');
      return null;
    }
  };

  const getEventById = async (eventId) => {
    try {
      const response = await dispatch(fetchEventById(eventId)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải thông tin sự kiện');
      return null;
    }
  };

  const createEventAPI = async (eventData) => {
    try {
      const response = await dispatch(createEvent(eventData)).unwrap();
      toast.success('Tạo sự kiện thành công!');
      return response;
    } catch (err) {
      toast.error('Không thể tạo sự kiện');
      return null;
    }
  };

  const updateEventAPI = async (eventData) => {
    try {
      const response = await dispatch(updateEvent(eventData)).unwrap();
      toast.success('Cập nhật sự kiện thành công!');
      return response;
    } catch (err) {
      toast.error('Không thể cập nhật sự kiện');
      return null;
    }
  };

  const deleteEventAPI = async (eventId) => {
    try {
      const response = await dispatch(deleteEvent(eventId)).unwrap();
      toast.success('Xóa sự kiện thành công!');
      return response;
    } catch (err) {
      toast.error('Không thể xóa sự kiện');
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
    getEventsByOrganizer,
    getEventById,
    createEvent: createEventAPI,
    updateEvent: updateEventAPI,
    deleteEvent: deleteEventAPI,
    clearCurrentEvent: clearCurrent,
    clearEvents: clearAllEvents
  };
};

export default useEvents;