import React, { useEffect, useState } from 'react';
import { useEndEventRequests } from '../../hooks/useEndEventRequests';
import { useAuth } from '../../hooks/useAuth';
import { EndEventStatus, EndEventStatusDisplay } from '../../constants/eventConstants';
import Pagination from '../../components/common/Pagination';

const ManagerEndEventRequestsPage = () => {
  const { user } = useAuth();
  const { endEventRequests, loading, error, totalCount, getEndEventRequests, confirmEndEvent } = useEndEventRequests();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    loadEndEventRequests();
  }, [currentPage, statusFilter]);

  const loadEndEventRequests = async () => {
    const params = {
      pageNumber: currentPage,
      pageSize: pageSize
    };
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    await getEndEventRequests(params);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleApprove = async (endEventRequestId) => {
    setApprovingRequestId(endEventRequestId);
    try {
      await confirmEndEvent({
        endEventRequestId,
        status: 'Approved',
        adminNote
      });
      setAdminNote('');
      loadEndEventRequests(); // Refresh the list
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleReject = async (endEventRequestId) => {
    setApprovingRequestId(endEventRequestId);
    try {
      await confirmEndEvent({
        endEventRequestId,
        status: 'Rejected',
        adminNote
      });
      setAdminNote('');
      loadEndEventRequests(); // Refresh the list
    } finally {
      setApprovingRequestId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case EndEventStatus.PendingApprovalEnd:
        return 'bg-yellow-100 text-yellow-800';
      case EndEventStatus.Approved:
        return 'bg-green-100 text-green-800';
      case EndEventStatus.Rejected:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Duyệt yêu cầu kết thúc sự kiện</h1>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(EndEventStatus).map(([key, value]) => (
              <option key={key} value={value}>
                {EndEventStatusDisplay[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading and error states */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">Có lỗi xảy ra: {error}</p>
        </div>
      )}

      {/* Requests list */}
      {!loading && !error && (
        <>
          {endEventRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có yêu cầu kết thúc sự kiện nào.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {endEventRequests.map((request) => (
                  <li key={request.endEventRequestId}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-blue-600 truncate">
                          {request.eventTitle}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {EndEventStatusDisplay[request.status]}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Tổ chức bởi: {request.organizerName}
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Tổng tiền: {request.totalAmount?.toLocaleString('vi-VN')} VNĐ
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Phí nền tảng: {request.platformFee?.toLocaleString('vi-VN')} VNĐ
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Số tiền nhận: {request.payoutAmount?.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Ngày tạo: {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      {request.summary && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Tóm tắt:</span> {request.summary}
                          </p>
                        </div>
                      )}
                      {request.evidenceImages && request.evidenceImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Hình ảnh bằng chứng:</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {request.evidenceImages.map((image, index) => (
                              <img 
                                key={index} 
                                src={image} 
                                alt={`Evidence ${index + 1}`} 
                                className="h-16 w-16 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {request.adminNote && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Ghi chú từ quản trị viên:</span> {request.adminNote}
                          </p>
                        </div>
                      )}
                      
                      {/* Approval actions for pending requests */}
                      {request.status === EndEventStatus.PendingApprovalEnd && user?.role === 'Manager' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ghi chú (tùy chọn)
                              </label>
                              <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập ghi chú cho quyết định của bạn"
                              />
                            </div>
                            <div className="flex items-end space-x-2">
                              <button
                                onClick={() => handleReject(request.endEventRequestId)}
                                disabled={approvingRequestId === request.endEventRequestId}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {approvingRequestId === request.endEventRequestId ? 'Đang xử lý...' : 'Từ chối'}
                              </button>
                              <button
                                onClick={() => handleApprove(request.endEventRequestId)}
                                disabled={approvingRequestId === request.endEventRequestId}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                              >
                                {approvingRequestId === request.endEventRequestId ? 'Đang xử lý...' : 'Duyệt'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagerEndEventRequestsPage;