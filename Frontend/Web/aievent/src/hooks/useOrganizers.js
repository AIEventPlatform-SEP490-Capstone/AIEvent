import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchOrganizers,
  fetchOrganizerById,
  fetchOrganizerProfile,
  createOrganizer,
  updateOrganizer,
  confirmOrganizer,
  selectOrganizers,
  selectOrganizer,
  selectOrganizerProfile,
  selectOrganizersLoading,
  selectOrganizersError,
  clearOrganizer,
  clearOrganizers,
} from "../store/slices/organizersSlice";

export const useOrganizers = () => {
  const dispatch = useDispatch();

  const organizers = useSelector(selectOrganizers);
  const organizer = useSelector(selectOrganizer);
  const profile = useSelector(selectOrganizerProfile);
  const loading = useSelector(selectOrganizersLoading);
  const error = useSelector(selectOrganizersError);

  const getOrganizers = async (params = {}) => {
    try {
      return await dispatch(fetchOrganizers(params)).unwrap();
    } catch {
      toast.error("Không thể tải danh sách tổ chức");
    }
  };

  const getOrganizerById = async (id) => {
    try {
      return await dispatch(fetchOrganizerById(id)).unwrap();
    } catch {
      toast.error("Không thể tải thông tin tổ chức");
    }
  };

  const getOrganizerProfile = async () => {
    try {
      return await dispatch(fetchOrganizerProfile()).unwrap();
    } catch {
      toast.error("Không thể tải hồ sơ tổ chức");
    }
  };

  const createOrganizerAPI = async (data) => {
    try {
      const res = await dispatch(createOrganizer(data));
      return res;
    } catch {
      return error?.response?.data || error;
    }
  };

  const updateOrganizerAPI = async (data) => {
    try {
      const res = await dispatch(updateOrganizer(data)).unwrap();
      toast.success("Cập nhật tổ chức thành công!");
      return res;
    } catch {
      toast.error("Không thể cập nhật tổ chức");
    }
  };

  const confirmOrganizerAPI = async (id, confirmData) => {
    try {
      const res = await dispatch(
        confirmOrganizer({ id, confirmData })
      ).unwrap();
      toast.success("Xác nhận tổ chức thành công!");
      return res;
    } catch {
      toast.error("Không thể xác nhận tổ chức");
    }
  };

  return {
    organizers,
    organizer,
    profile,
    loading,
    error,
    getOrganizers,
    getOrganizerById,
    getOrganizerProfile,
    createOrganizer: createOrganizerAPI,
    updateOrganizer: updateOrganizerAPI,
    confirmOrganizer: confirmOrganizerAPI,
    clearOrganizer: () => dispatch(clearOrganizer()),
    clearOrganizers: () => dispatch(clearOrganizers()),
  };
};

export default useOrganizers;
