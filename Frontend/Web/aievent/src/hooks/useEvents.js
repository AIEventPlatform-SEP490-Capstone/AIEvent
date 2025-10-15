import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  fetchEvents,
  fetchEventsByOrganizer,
  fetchEventById,
  fetchRelatedEvents,
  fetchEventsNeedApproval,
  createEvent,
  updateEvent,
  deleteEvent,
  selectEvents,
  selectCurrentEvent,
  selectRelatedEvents,
  selectEventsLoading,
  selectEventsError,
  selectEventsTotalCount,
  clearCurrentEvent,
  clearEvents,
  clearRelatedEvents
} from '../store/slices/eventsSlice';

export const useEvents = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const events = useSelector(selectEvents);
  const currentEvent = useSelector(selectCurrentEvent);
  const relatedEvents = useSelector(selectRelatedEvents);
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

  const getRelatedEvents = async (eventId) => {
    try {
      const response = await dispatch(fetchRelatedEvents(eventId)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải sự kiện liên quan');
      return null;
    }
  };

  // Get events needing approval (requires Manager role)
  const getEventsNeedApproval = async (params = {}) => {
    try {
      const response = await dispatch(fetchEventsNeedApproval(params)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải danh sách sự kiện cần phê duyệt');
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
  const clearRelated = () => dispatch(clearRelatedEvents());

  return {
    events,
    currentEvent,
    relatedEvents,
    loading,
    error,
    totalCount,
    getEvents,
    getEventsByOrganizer,
    getEventById,
    getRelatedEvents,
    getEventsNeedApproval,
    createEvent: createEventAPI,
    updateEvent: updateEventAPI,
    deleteEvent: deleteEventAPI,
    clearCurrentEvent: clearCurrent,
    clearEvents: clearAllEvents,
    clearRelatedEvents: clearRelated
  };
};

export default useEvents;