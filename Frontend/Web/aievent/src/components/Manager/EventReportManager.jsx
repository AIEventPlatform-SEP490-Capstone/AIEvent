import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Clock,
  Eye,
  CheckCircle,
  Flag,
  Loader2,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import eventAPI from '../../api/eventAPI';

const REPORT_PAGE_SIZE = 10;

const EventReportManager = ({ event, isOpen, onClose, onReportCountChange }) => {
  const [eventReports, setEventReports] = useState([]);
  const [reportPagination, setReportPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: REPORT_PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loadingEventReports, setLoadingEventReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [reportDetailLoading, setReportDetailLoading] = useState(false);
  const [reportReply, setReportReply] = useState('');
  const [isSubmittingReportReply, setIsSubmittingReportReply] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setEventReports([]);
      setSelectedReport(null);
      setIsReportDetailOpen(false);
      setReportReply('');
      setIsSubmittingReportReply(false);
      setReportPagination({
        page: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: REPORT_PAGE_SIZE,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }
  }, [isOpen]);

  // Fetch reports when dialog opens
  useEffect(() => {
    if (isOpen && event?.eventId) {
      fetchEventReports(event.eventId, 1);
    }
  }, [isOpen, event?.eventId]);

  // Update reportReply when selectedReport changes
  useEffect(() => {
    if (selectedReport) {
      setReportReply(selectedReport.reply ?? '');
    } else {
      setReportReply('');
    }
    setIsSubmittingReportReply(false);
  }, [selectedReport]);

  const getReportId = (report) => {
    if (!report) return null;
    
    // Thử các field ID phổ biến trước
    if (report.id !== undefined && report.id !== null) return report.id;
    if (report.reportId !== undefined && report.reportId !== null) return report.reportId;
    if (report.eventReportId !== undefined && report.eventReportId !== null) return report.eventReportId;
    
    // Tìm kiếm bất kỳ key nào chứa "id" hoặc "Id" (case-insensitive)
    const keys = Object.keys(report);
    const idKey = keys.find(key => 
      key.toLowerCase() === 'id' || 
      key.toLowerCase() === 'reportid' || 
      key.toLowerCase() === 'eventreportid' ||
      key.toLowerCase().endsWith('id')
    );
    
    if (idKey && report[idKey] !== undefined && report[idKey] !== null) {
      return report[idKey];
    }
    
    return null;
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'Scam':
        return 'Lừa đảo';
      case 'FakeInfo':
        return 'Thông tin sai lệch';
      case 'Reactionary':
        return 'Phản động';
      case 'SexualHarassment':
        return 'Quấy rối tình dục';
      case 'Violence':
        return 'Bạo lực';
      case 'Inappropriate':
        return 'Không phù hợp';
      case 'Other':
        return 'Khác';
      default:
        return type || 'Không xác định';
    }
  };

  const fetchEventReports = async (eventId, pageNumber = 1, pageSize = REPORT_PAGE_SIZE) => {
    setLoadingEventReports(true);
    try {
      const response = await eventAPI.getEventReports(eventId, { pageNumber, pageSize });
      const reports = response.items || [];
      setEventReports(reports);
      setReportPagination({
        page: response.currentPage ?? pageNumber,
        totalPages: response.totalPages ?? 1,
        totalItems: response.totalItems ?? (response.items?.length ?? 0),
        pageSize: response.pageSize ?? pageSize,
        hasNextPage: response.hasNextPage ?? false,
        hasPreviousPage: response.hasPreviousPage ?? false,
      });
      
      // Notify parent component about report count change
      if (onReportCountChange) {
        onReportCountChange(eventId, response.totalItems ?? (response.items?.length ?? 0));
      }
    } catch (error) {
      console.error('Error fetching event reports:', error);
      toast.error('Không thể tải danh sách báo cáo của sự kiện.');
      setEventReports([]);
    } finally {
      setLoadingEventReports(false);
    }
  };

  const handleReportPageChange = (nextPage) => {
    if (!event?.eventId) return;
    if (nextPage < 1 || nextPage > reportPagination.totalPages) return;
    fetchEventReports(event.eventId, nextPage, reportPagination.pageSize);
  };

  const fetchReportDetail = async (reportId, { showErrorToast = true } = {}) => {
    if (!reportId) return;
    setReportDetailLoading(true);
    try {
      const detail = await eventAPI.getEventReportDetail(reportId);
      
      if (detail) {
        const detailId = getReportId(detail);
        
        setSelectedReport((prev) => {
          const prevId = getReportId(prev);
          
          // Merge detail vào prev, đảm bảo giữ lại ID từ prev nếu detail không có
          const merged = { ...prev, ...detail };
          // Nếu detail không có ID nhưng prev có, giữ lại ID từ prev
          if (!detailId && prevId) {
            // Tìm key ID từ prev và gán lại vào merged
            const prevKeys = Object.keys(prev || {});
            const prevIdKey = prevKeys.find(key => {
              const val = prev[key];
              return val === prevId && (key.toLowerCase().includes('id'));
            });
            if (prevIdKey) {
              merged[prevIdKey] = prevId;
            }
          }
          
          return merged;
        });
        setEventReports((prev) =>
          prev.map((report) => (getReportId(report) === getReportId(detail) ? { ...report, ...detail } : report))
        );
      }
    } catch (error) {
      console.error('Error fetching event report detail:', error);
      if (showErrorToast) {
        toast.error('Không thể tải chi tiết báo cáo.');
      }
    } finally {
      setReportDetailLoading(false);
    }
  };

  const handleOpenReportDetail = (report) => {
    const reportId = getReportId(report);
    
    if (!reportId) {
      toast.error('Không thể xác định ID báo cáo. Vui lòng thử lại.');
      return;
    }
    
    setSelectedReport(report);
    setIsReportDetailOpen(true);
    setReportReply(report?.reply ?? '');
    setIsSubmittingReportReply(false);
    
    // Luôn fetch detail để đảm bảo có đầy đủ thông tin
    fetchReportDetail(reportId);
  };

  const handleCloseReportDetail = () => {
    setIsReportDetailOpen(false);
    setSelectedReport(null);
    setReportDetailLoading(false);
    setReportReply('');
    setIsSubmittingReportReply(false);
  };

  const handleSubmitReportReply = async () => {
    const selectedReportId = getReportId(selectedReport);
    
    if (!selectedReportId) {
      toast.error('Không xác định được báo cáo cần phản hồi.');
      return;
    }
  
    const trimmedReply = reportReply.trim();
    const originalReply = (selectedReport.reply ?? '').trim();
  
    if (!trimmedReply) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }
  
    if (trimmedReply === originalReply) {
      toast.error('Phản hồi chưa thay đổi.');
      return;
    }
  
    const hasExistingReply = Boolean(originalReply);
    if (hasExistingReply) {
      toast.error('Báo cáo này đã được phản hồi.');
      return;
    }
  
    setIsSubmittingReportReply(true);
    try {
      await eventAPI.replyEventReport(selectedReportId, trimmedReply);
  
      // Cập nhật UI
      setSelectedReport(prev => prev ? { ...prev, reply: trimmedReply } : prev);
      setEventReports(prev =>
        prev.map(report =>
          getReportId(report) === selectedReportId ? { ...report, reply: trimmedReply } : report
        )
      );
  
      toast.success('Đã gửi phản hồi thành công!');
    } catch (error) {
      console.error('Lỗi gửi phản hồi:', error);
      const msg = error.response?.data?.message || error.message || 'Không thể gửi phản hồi';
      toast.error(`Gửi thất bại: ${msg}`);
    } finally {
      setIsSubmittingReportReply(false);
    }
  };

  const trimmedReportReply = reportReply.trim();
  const originalReportReply = (selectedReport?.reply ?? '').trim();
  const hasExistingReply = Boolean(originalReportReply);
  const isReplySubmitDisabled =
    hasExistingReply ||
    isSubmittingReportReply ||
    !trimmedReportReply ||
    trimmedReportReply === originalReportReply;

  return (
    <>
      {/* Report List Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Báo cáo sự kiện</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {event?.title ? (
                <>
                  <span className="font-medium">{event.title}</span>
                  <span className="ml-2">
                    • Tổng: <strong>{reportPagination.totalItems}</strong> báo cáo
                  </span>
                </>
              ) : (
                'Danh sách báo cáo cho sự kiện'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingEventReports ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground mt-2">Đang tải báo cáo...</p>
              </div>
            ) : eventReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-muted-foreground">Chưa có báo cáo nào cho sự kiện này.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Người báo cáo</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Loại báo cáo</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Lý do báo cáo</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Thời gian</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-700">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {eventReports.map((report, idx) => {
                        const reportId = getReportId(report);
                        const date = report.createdAt ? new Date(report.createdAt) : null;
                        const timeStr = date?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) || '-';
                        const dateStr = date?.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) || '-';
                        return (
                          <tr key={reportId ?? `report-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">{report.userName || 'Ẩn danh'}</p>
                                <p className="text-xs text-gray-500">{report.userEmail || '-'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                {getReportTypeLabel(report.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <p className="text-sm text-gray-700 line-clamp-2">{report.reason || '(Không có lý do)'}</p>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium">{dateStr}</div>
                                <div className="text-xs text-gray-500">{timeStr}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-xs ${report.reply
                                    ? 'border-green-300 bg-green-50 text-green-700'
                                    : 'border-orange-300 bg-orange-50 text-orange-600'
                                  }`}
                              >
                                {report.reply ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Đã phản hồi
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Chưa phản hồi
                                  </>
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenReportDetail(report)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {reportPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>
                      Trang <strong>{reportPagination.page}</strong> / <strong>{reportPagination.totalPages}</strong>
                      {' • Tổng: '}
                      <strong>{reportPagination.totalItems}</strong> báo cáo
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportPageChange(reportPagination.page - 1)}
                        disabled={!reportPagination.hasPreviousPage}
                      >
                        Trước
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportPageChange(reportPagination.page + 1)}
                        disabled={!reportPagination.hasNextPage}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={isReportDetailOpen} onOpenChange={(open) => !open && handleCloseReportDetail()}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chi tiết báo cáo</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Xem và phản hồi báo cáo từ người dùng
            </DialogDescription>
          </DialogHeader>

          {selectedReport ? (
            <div className="space-y-4 mt-3 text-sm">
              {/* Người báo cáo & Thời gian */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người báo cáo</p>
                  <p className="font-medium text-gray-900">{selectedReport.userName || 'Ẩn danh'}</p>
                  <p className="text-xs text-gray-600 break-all">{selectedReport.userEmail || '(Không có email)'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian báo cáo</p>
                  <p className="text-gray-900">
                    {selectedReport.createdAt
                      ? new Date(selectedReport.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'Không xác định'}
                  </p>
                </div>
              </div>

              {/* Loại báo cáo & Trạng thái */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Loại báo cáo</p>
                  <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {getReportTypeLabel(selectedReport.type)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${selectedReport.reply
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-orange-300 bg-orange-50 text-orange-600'
                    }`}
                  >
                    {selectedReport.reply ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã phản hồi
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Chưa phản hồi
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Lý do báo cáo */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lý do báo cáo</p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs leading-relaxed">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedReport.reason || '(Không có nội dung lý do)'}
                  </p>
                </div>
              </div>

              {/* Minh chứng */}
              {selectedReport.attachmentUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Minh chứng</p>
                  <a
                    href={selectedReport.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Mở liên kết
                  </a>
                </div>
              )}

              {/* Phản hồi */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Phản hồi tới người báo cáo
                </label>
                {hasExistingReply ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900 whitespace-pre-wrap">
                    {selectedReport.reply}
                  </div>
                ) : (
                  <>
                    <Textarea
                      rows={4}
                      value={reportReply}
                      onChange={(event) => setReportReply(event.target.value)}
                      placeholder="Nhập nội dung phản hồi để gửi tới người báo cáo..."
                      className="text-sm"
                      disabled={isSubmittingReportReply}
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Nội dung phản hồi sẽ được gửi trực tiếp tới người báo cáo.
                    </p>
                  </>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseReportDetail}
                  className="flex-1 text-xs"
                  disabled={isSubmittingReportReply}
                >
                  Đóng
                </Button>
                {!hasExistingReply && (
                  <Button
                    size="sm"
                    onClick={handleSubmitReportReply}
                    className="flex-1 text-xs"
                    disabled={isReplySubmitDisabled}
                  >
                    {isSubmittingReportReply ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi phản hồi'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">Không có dữ liệu báo cáo.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventReportManager;

