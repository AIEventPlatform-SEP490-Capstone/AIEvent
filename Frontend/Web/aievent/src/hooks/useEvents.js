import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchEvents,
  fetchEventById,
  fetchRelatedEvents,
  fetchDraftEvents,
  fetchEventsByStatus,
  createEvent,
  updateEvent,
  deleteEvent,
  confirmEvent,
  inviteFriends,
  confirmInvitation,
  fetchInvitationsStatus,
  selectEvents,
  selectCurrentEvent,
  selectRelatedEvents,
  selectEventsLoading,
  selectEventsError,
  selectEventsTotalCount,
  selectInvitations,
  selectInvitationsLoading,
  selectInvitationsError,
  selectInvitationsTotalCount,
  clearCurrentEvent,
  clearEvents,
  clearRelatedEvents,
} from "../store/slices/eventsSlice";

export const useEvents = () => {
  const dispatch = useDispatch();

  // Selectors
  const events = useSelector(selectEvents);
  const currentEvent = useSelector(selectCurrentEvent);
  const relatedEvents = useSelector(selectRelatedEvents);
  const loading = useSelector(selectEventsLoading);
  const error = useSelector(selectEventsError);
  const totalCount = useSelector(selectEventsTotalCount);
  // Invitations selectors
  const invitations = useSelector(selectInvitations);
  const invitationsLoading = useSelector(selectInvitationsLoading);
  const invitationsError = useSelector(selectInvitationsError);
  const invitationsTotalCount = useSelector(selectInvitationsTotalCount);

  // Actions
  const getEvents = async (params = {}) => {
    try {
      const response = await dispatch(fetchEvents(params)).unwrap();
      return response;
    } catch (err) {
      toast.error("Không thể tải danh sách sự kiện");
      return null;
    }
  };

  const getEventById = async (eventId) => {
    try {
      const response = await dispatch(fetchEventById(eventId)).unwrap();
      return response;
    } catch (err) {
      toast.error("Không thể tải thông tin sự kiện");
      return null;
    }
  };

  const getRelatedEvents = async (eventId) => {
    try {
      const response = await dispatch(fetchRelatedEvents(eventId)).unwrap();
      return response;
    } catch (err) {
      toast.error("Không thể tải sự kiện có cùng thẻ hoặc danh mục");
      return null;
    }
  };

  // Get draft events (requires Organizer role)
  const getDraftEvents = async (params = {}) => {
    try {
      const response = await dispatch(fetchDraftEvents(params)).unwrap();
      return response;
    } catch (err) {
      toast.error("Không thể tải danh sách sự kiện nháp");
      return null;
    }
  };

  // Get events by status (requires Admin, Manager, Organizer roles)
  const getEventsByStatus = async (params = {}) => {
    try {
      const response = await dispatch(fetchEventsByStatus(params)).unwrap();
      return response;
    } catch (err) {
      toast.error("Không thể tải danh sách sự kiện theo trạng thái");
      return null;
    }
  };

  const createEventAPI = async (eventData) => {
    try {
      const response = await dispatch(createEvent(eventData)).unwrap();
      toast.success("Tạo sự kiện thành công!");
      return response;
    } catch (err) {
      toast.error("Không thể tạo sự kiện");
      return null;
    }
  };

  const updateEventAPI = async (eventData) => {
    try {
      const response = await dispatch(updateEvent(eventData)).unwrap();
      toast.success("Cập nhật sự kiện thành công!");
      return response;
    } catch (err) {
      console.error("Error updating event:", err);
      let errorMessage = "Không thể cập nhật sự kiện";

      // Check if there's a specific error message from the backend
      if (err && typeof err === "object") {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (Object.keys(err).length > 0) {
          // If it's an object with keys, try to find a meaningful error message
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === "string") {
            errorMessage = err[firstKey];
          }
        }
      }

      toast.error(errorMessage);
      return null;
    }
  };

  const deleteEventAPI = async (eventId, reasonCancel = null) => {
    try {
      const response = await dispatch(
        deleteEvent({ eventId, reasonCancel })
      ).unwrap();
      toast.success("Xóa sự kiện thành công!");
      return response;
    } catch (err) {
      console.error("Delete event error:", err);
      let errorMessage = "Không thể xóa sự kiện";

      // Check if there's a specific error message from the backend
      if (err && typeof err === "object") {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (Object.keys(err).length > 0) {
          // If it's an object with keys, try to find a meaningful error message
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === "string") {
            errorMessage = err[firstKey];
          }
        }
      }

      toast.error(errorMessage);
      return null;
    }
  };

  // Confirm event (requires Admin, Manager roles)
  const confirmEventAPI = async (eventId, confirmData) => {
    try {
      const response = await dispatch(
        confirmEvent({ eventId, confirmData })
      ).unwrap();
      toast.success("Xác nhận sự kiện thành công!");
      return response;
    } catch (err) {
      toast.error("Không thể xác nhận sự kiện");
      return null;
    }
  };

  const inviteFriendsAPI = async (eventId, invitationData) => {
    try {
      const response = await dispatch(
        inviteFriends({ eventId, invitationData })
      ).unwrap();
      toast.success("Gửi lời mời thành công!");
      return response;
    } catch (err) {
      console.error("Invite friends error:", err);
      let errorMessage = "Không thể gửi lời mời";
      if (err && typeof err === "object") {
        if (err.message) errorMessage = err.message;
        else if (err.error) errorMessage = err.error;
        else if (Object.keys(err).length > 0) {
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === "string") {
            errorMessage = err[firstKey];
          }
        }
      }
      toast.error(errorMessage);
      return null;
    }
  };

  const confirmInvitationAPI = async (invitationId, confirmData) => {
    try {
      const response = await dispatch(
        confirmInvitation({ invitationId, confirmData })
      ).unwrap();
      toast.success("Đã phản hồi lời mời!");
      return response;
    } catch (err) {
      console.error("Confirm invitation error:", err);
      let errorMessage = "Không thể phản hồi lời mời";
      if (err && typeof err === "object") {
        if (err.message) errorMessage = err.message;
        else if (err.error) errorMessage = err.error;
        else if (Object.keys(err).length > 0) {
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === "string") {
            errorMessage = err[firstKey];
          }
        }
      }
      toast.error(errorMessage);
      return null;
    }
  };

  const getInvitationsStatus = async (params = {}) => {
    try {
      const response = await dispatch(fetchInvitationsStatus(params)).unwrap();
      return response;
    } catch (err) {
      console.error("Fetch invitations status error:", err);
      toast.error("Không thể tải thông tin lời mời");
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
    invitations,
    invitationsLoading,
    invitationsError,
    invitationsTotalCount,
    getEvents,
    getEventById,
    getRelatedEvents,
    getDraftEvents,
    getEventsByStatus,
    createEvent: createEventAPI,
    updateEvent: updateEventAPI,
    deleteEvent: deleteEventAPI,
    confirmEvent: confirmEventAPI,
    clearCurrentEvent: clearCurrent,
    clearEvents: clearAllEvents,
    clearRelatedEvents: clearRelated,
    inviteFriends: inviteFriendsAPI,
    confirmInvitation: confirmInvitationAPI,
    getInvitationsStatus,
  };
};

export default useEvents;
