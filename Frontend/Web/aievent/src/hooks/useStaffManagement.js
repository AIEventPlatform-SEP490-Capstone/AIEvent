import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    fetchAllStaff,
    addStaff as addStaffAction,
    deleteStaff as deleteStaffAction,
    setStaffFilters,
    clearStaffFilters as clearStaffFiltersAction,
    clearStaffError as clearStaffErrorAction,
    selectStaffList,
    selectStaffPagination,
    selectStaffFilters,
    selectStaffLoading,
    selectStaffError
} from '../store/slices/staffManageSlice';

export const useStaffManagement = () => {
    const dispatch = useDispatch();
    const staffList = useSelector(selectStaffList);
    const staffPagination = useSelector(selectStaffPagination);
    const staffFilters = useSelector(selectStaffFilters);
    const staffLoading = useSelector(selectStaffLoading);
    const staffError = useSelector(selectStaffError);

    useEffect(() => {
        dispatch(fetchAllStaff({
            pageNumber: staffPagination.currentPage,
            pageSize: staffPagination.pageSize,
            ...staffFilters
        }));
    }, [dispatch, staffPagination.currentPage, staffPagination.pageSize, staffFilters]);

    const refreshStaff = () => {
        dispatch(fetchAllStaff({
            pageNumber: staffPagination.currentPage,
            pageSize: staffPagination.pageSize,
            ...staffFilters
        }));
    };

    const loadStaff = (pageNumber, pageSize, email, name) => {
        dispatch(fetchAllStaff({
            pageNumber: pageNumber || staffPagination.currentPage,
            pageSize: pageSize || staffPagination.pageSize,
            email: email !== undefined ? email : staffFilters.email,
            name: name !== undefined ? name : staffFilters.name
        }));
    };

    const createStaff = async (staffdata) => {
        return dispatch(addStaffAction(staffdata));
    };

    const deleteStaff = async (staffId) => {
        return dispatch(deleteStaffAction(staffId));
    };

    const updateStaffFilters = (newFilters) => {
        dispatch(setStaffFilters(newFilters));
    };

    const clearStaffFilters = () => {
        dispatch(clearStaffFiltersAction());
    };

    const clearStaffError = () => {
        dispatch(clearStaffErrorAction());
    };

    return {
        staffList,
        staffPagination,
        staffFilters,
        loading: staffLoading,
        error: staffError,
        refreshStaff,
        loadStaff,
        createStaff,
        deleteStaff,
        updateStaffFilters,
        clearStaffFilters,
        clearStaffError,
    };
};

export default useStaffManagement;