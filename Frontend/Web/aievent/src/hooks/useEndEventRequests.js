import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  requestEndEvent,
  confirmEndEvent,
  fetchEndEventRequestById,
  fetchEndEventRequests,
  selectEndEventRequests,
  selectCurrentEndEventRequest,
  selectEndEventRequestsLoading,
  selectEndEventRequestsError,
  selectEndEventRequestsTotalCount,
  clearCurrentEndEventRequest,
  clearEndEventRequests
} from '../store/slices/endEventRequestsSlice';

export const useEndEventRequests = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const endEventRequests = useSelector(selectEndEventRequests);
  const currentEndEventRequest = useSelector(selectCurrentEndEventRequest);
  const loading = useSelector(selectEndEventRequestsLoading);
  const error = useSelector(selectEndEventRequestsError);
  const totalCount = useSelector(selectEndEventRequestsTotalCount);

  // Request to end event (requires Admin, Manager, Organizer roles)
  const requestEndEventAPI = async (requestData) => {
    try {
      const response = await dispatch(requestEndEvent(requestData)).unwrap();
      toast.success('Yêu cầu kết thúc sự kiện đã được gửi!');
      return response;
    } catch (err) {
      console.error('Error requesting end event:', err);
      let errorMessage = 'Không thể gửi yêu cầu kết thúc sự kiện';
      
      // Check if there's a specific error message from the backend
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (Object.keys(err).length > 0) {
          // If it's an object with keys, try to find a meaningful error message
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === 'string') {
            errorMessage = err[firstKey];
          }
        }
      }
      
      toast.error(errorMessage);
      return null;
    }
  };

  // Confirm end event (requires Admin, Manager roles)
  const confirmEndEventAPI = async (requestData) => {
    try {
      const response = await dispatch(confirmEndEvent(requestData)).unwrap();
      toast.success('Xác nhận kết thúc sự kiện thành công!');
      return response;
    } catch (err) {
      console.error('Error confirming end event:', err);
      let errorMessage = 'Không thể xác nhận kết thúc sự kiện';
      
      // Check if there's a specific error message from the backend
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (Object.keys(err).length > 0) {
          // If it's an object with keys, try to find a meaningful error message
          const firstKey = Object.keys(err)[0];
          if (typeof err[firstKey] === 'string') {
            errorMessage = err[firstKey];
          }
        }
      }
      
      toast.error(errorMessage);
      return null;
    }
  };

  // Get end event request by ID (requires Admin, Manager, Organizer roles)
  const getEndEventRequestById = async (endEventRequestId) => {
    try {
      const response = await dispatch(fetchEndEventRequestById(endEventRequestId)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải thông tin yêu cầu kết thúc sự kiện');
      return null;
    }
  };

  // Get end event requests with filters (requires Admin, Manager, Organizer roles)
  const getEndEventRequests = async (params = {}) => {
    try {
      const response = await dispatch(fetchEndEventRequests(params)).unwrap();
      return response;
    } catch (err) {
      toast.error('Không thể tải danh sách yêu cầu kết thúc sự kiện');
      return null;
    }
  };

  const clearCurrent = () => dispatch(clearCurrentEndEventRequest());
  const clearAllEndEventRequests = () => dispatch(clearEndEventRequests());

  return {
    endEventRequests,
    currentEndEventRequest,
    loading,
    error,
    totalCount,
    requestEndEvent: requestEndEventAPI,
    confirmEndEvent: confirmEndEventAPI,
    getEndEventRequestById,
    getEndEventRequests,
    clearCurrentEndEventRequest: clearCurrent,
    clearEndEventRequests: clearAllEndEventRequests
  };
};

export default useEndEventRequests;