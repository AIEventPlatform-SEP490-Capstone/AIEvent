import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Plus,
  CheckCircle2,
  Calendar,
  Edit3,
  X,
  Percent,
  Wallet,
  Clock,
  BellRing,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { dashboardAPI } from '../../api/dashboardAPI';
import { showSuccess, showError } from '../../lib/toastUtils';

const SystemSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configList, setConfigList] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);

  // Phân trang
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isEditing, setIsEditing] = useState(false);
  const [editingMode, setEditingMode] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState('current');

  const [editForm, setEditForm] = useState({
    flatformFee: 0.07,
    fixFee: 45000,
    datePayout: 7,
    eventReminderHours: 2
  });
  const [effectiveDate, setEffectiveDate] = useState('');
  const [displayFixFee, setDisplayFixFee] = useState('45.000');

  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  const formRef = useRef(null);

  // ============== HÀM HỖ TRỢ ==============
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const formatVND = (num) => {
    if (!num && num !== 0) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatDateTime = (dateInput) => {
    if (!dateInput) return 'Chưa xác định';

    let date;
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      if (dateInput.includes('T') || dateInput.includes('Z') || /[\+\-]/.test(dateInput.slice(10))) {
        date = new Date(dateInput);
      } else {
        return 'Invalid Date';
      }
    } else if (typeof dateInput === 'number' || (!isNaN(dateInput) && String(dateInput).length >= 10)) {
      const ts = Number(dateInput);
      const millis = String(ts).length <= 10 ? ts * 1000 : ts;
      date = new Date(millis);
    } else {
      return 'Invalid Date';
    }

    if (isNaN(date?.getTime())) return 'Invalid Date';

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // ============== VALIDATE PHÍ CỐ ĐỊNH (SAU formatVND) ==============
  const MIN_FIX_FEE = 10000;
  const MAX_FIX_FEE = 100000000;
  const fixFeeError = editForm.fixFee < MIN_FIX_FEE || editForm.fixFee > MAX_FIX_FEE
    ? `Phí cố định phải từ ${formatVND(MIN_FIX_FEE)} ₫ đến ${formatVND(MAX_FIX_FEE)} ₫`
    : '';

  // ============== LOAD DỮ LIỆU ==============
  const fetchAllData = async (page = 1) => {
    try {
      setIsLoading(true);
      const [systemData, historyResponse] = await Promise.all([
        dashboardAPI.getSystemSettings(),
        dashboardAPI.getHistorySystemSettings({ pageNumber: page, pageSize })
      ]);

      const history = historyResponse;

      const currentConfig = {
        id: 'current',
        name: 'Cấu hình hiện tại',
        dateApply: systemData?.updatedAt || new Date().toISOString(),
        createTime: systemData?.updatedAt || new Date().toISOString(),
        ...systemData
      };

      const formattedHistory = (history.items || []).map((item, idx) => ({
        ...item,
        id: item.id || `hist-${page}-${idx}`,
        name: `Cấu hình cũ #${(page - 1) * pageSize + idx + 1}`,
        createTime: item.createTime || item.createdAt || item.dateApply || new Date().toISOString(),
      }));

      const fullList = [currentConfig, ...formattedHistory]
        .sort((a, b) => new Date(b.dateApply) - new Date(a.dateApply));

      setConfigList(fullList);
      setActiveConfigId('current');
      setPageNumber(history.pageNumber || page);
      setTotalItems(history.totalItems || 0);
      setTotalPages(history.totalPages || 1);
      setEffectiveDate(getTomorrow());
    } catch (err) {
      showError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(1);
  }, []);

  // ============== HÀM XỬ LÝ FORM ==============
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startCreate = () => {
    const current = configList.find(c => c.id === 'current');
    const defaultForm = {
      flatformFee: current?.flatformFee || 0.07,
      fixFee: current?.fixFee || 45000,
      datePayout: current?.datePayout || 7,
      eventReminderHours: current?.eventReminderHours || 2
    };
    setEditForm(defaultForm);
    setDisplayFixFee(formatVND(defaultForm.fixFee));
    setSelectedTemplate('current');
    setEffectiveDate(getTomorrow());
    setEditingMode('create');
    setIsEditing(true);
    setTimeout(scrollToForm, 100);
  };

  const startReapply = (config) => {
    const form = {
      flatformFee: config.flatformFee,
      fixFee: config.fixFee,
      datePayout: config.datePayout,
      eventReminderHours: config.eventReminderHours
    };
    setEditForm(form);
    setDisplayFixFee(formatVND(form.fixFee));
    setSelectedTemplate(config.id);
    setEffectiveDate(getTomorrow());
    setEditingMode('reapply');
    setIsEditing(true);
    setTimeout(scrollToForm, 100);
  };

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    const config = configList.find(c => c.id === value);
    if (config) {
      setEditForm({
        flatformFee: config.flatformFee,
        fixFee: config.fixFee,
        datePayout: config.datePayout,
        eventReminderHours: config.eventReminderHours
      });
      setDisplayFixFee(formatVND(config.fixFee));
    }
  };

  const handleInputChange = (field, value) => {
    let val = value;
    if (field === 'flatformFee') val = Math.max(0, Math.min(1, parseFloat(value) || 0));
    if (field === 'datePayout') val = Math.max(5, Math.min(15, parseInt(value) || 5));
    if (field === 'eventReminderHours') val = Math.max(1, Math.min(4, parseInt(value) || 1));
    setEditForm(prev => ({ ...prev, [field]: val }));
  };

  const handleFixFeeChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    setEditForm(prev => ({ ...prev, fixFee: num }));
    setDisplayFixFee(raw === '' ? '' : formatVND(num));
  };

  const handleFixFeeFocus = () => setDisplayFixFee(editForm.fixFee === 0 ? '' : editForm.fixFee.toString());
  const handleFixFeeBlur = () => setDisplayFixFee(formatVND(editForm.fixFee));

  const saveConfig = () => {
    if (!effectiveDate) return showError('Vui lòng chọn ngày có hiệu lực');
    if (fixFeeError) return showError(fixFeeError);

    const applyDate = new Date(effectiveDate);
    applyDate.setHours(0, 0, 0, 0);

    setConfirmDialog({
      open: true,
      title: editingMode === 'create' ? 'Tạo cấu hình mới' : 'Áp dụng lại cấu hình',
      description: `Cấu hình sẽ có hiệu lực từ <strong>${formatDateTime(applyDate)}</strong>. Các giao dịch trước ngày này sẽ vẫn giữ theo cấu hình trước đó.`,
      onConfirm: async () => {
        try {
          setIsSaving(true);
          await dashboardAPI.updateSystemSettings({
            ...editForm,
            dateApply: applyDate.toISOString()
          });
          showSuccess(`Thành công! Hiệu lực từ ${formatDateTime(applyDate)}`);
          setIsEditing(false);
          await fetchAllData(pageNumber);
        } catch (err) {
          showError(err.response?.data?.message || 'Thao tác thất bại');
        } finally {
          setIsSaving(false);
          setConfirmDialog({ open: false });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 pb-20">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Settings className="h-8 w-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                  <p className="text-gray-600">Quản lý phí nền tảng và chính sách thanh toán</p>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={startCreate} size="lg" className="gap-3">
                  <Plus className="h-5 w-5" />
                  Tạo cấu hình mới
                </Button>
              )}
            </div>

            {/* Form chỉnh sửa */}
            {isEditing && (
              <div ref={formRef}>
                <Card className="border-2 border-dashed border-gray-300 bg-white shadow-lg">
                  <CardHeader className="border-b bg-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Edit3 className="h-7 w-7 text-gray-700" />
                        <div>
                          <CardTitle className="text-2xl">
                            {editingMode === 'create' ? 'Tạo cấu hình mới' : 'Chỉnh sửa & áp dụng lại'}
                          </CardTitle>
                          <p className="text-gray-600 mt-1">Bạn có thể chọn mẫu hoặc tự điều chỉnh</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-8 space-y-8">
                    <div>
                      <Label>Chọn từ cấu hình có sẵn (tùy chọn)</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="mt-2 w-full max-w-md">
                          <SelectValue placeholder="Chọn mẫu..." />
                        </SelectTrigger>
                        <SelectContent>
                          {configList.map(config => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name} • {formatDateTime(config.dateApply)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Percent className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <Label>Phí nền tảng (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(editForm.flatformFee * 100).toFixed(2)}
                              onChange={(e) => handleInputChange('flatformFee', e.target.value / 100)}
                              className="mt-1 text-lg"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editForm.flatformFee * 100}
                              onChange={(e) => handleInputChange('flatformFee', e.target.value / 100)}
                              className="w-full mt-3 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Wallet className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <Label>Phí cố định (VNĐ)</Label>
                            <Input
                              type="text"
                              value={displayFixFee}
                              onChange={handleFixFeeChange}
                              onFocus={handleFixFeeFocus}
                              onBlur={handleFixFeeBlur}
                              placeholder="0"
                              className={`mt-1 text-lg font-medium ${fixFeeError ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {fixFeeError && (
                              <p className="text-red-600 text-sm mt-1">{fixFeeError}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <Label>Ngày thanh toán (5-15 ngày)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="15"
                              value={editForm.datePayout}
                              onChange={(e) => handleInputChange('datePayout', e.target.value)}
                              className="mt-1 text-lg"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <BellRing className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <Label>Nhắc nhở trước (1-4 giờ)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="4"
                              value={editForm.eventReminderHours}
                              onChange={(e) => handleInputChange('eventReminderHours', e.target.value)}
                              className="mt-1 text-lg"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <Label className="text-red-600 font-medium">Ngày có hiệu lực *</Label>
                            <Input
                              type="date"
                              min={getTomorrow()}
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              className="mt-1 text-lg"
                            />
                            {effectiveDate && (
                              <p className="text-sm font-medium text-gray-700 mt-2">
                                Hiệu lực từ: <strong>{formatDateTime(effectiveDate + 'T00:00:00')}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <Button variant="outline" size="lg" onClick={() => setIsEditing(false)}>
                        Hủy
                      </Button>
                      <Button
                        size="lg"
                        onClick={saveConfig}
                        disabled={isSaving || !effectiveDate || !!fixFeeError}
                        className="px-10"
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu & Áp dụng'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lịch sử + Phân trang */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Lịch sử cấu hình</h2>
                <span className="text-sm text-gray-500">
                  Tổng: <strong>{totalItems}</strong> cấu hình
                </span>
              </div>

              {configList.map((config) => {
                const isActive = config.id === activeConfigId;

                return (
                  <Card
                    key={config.id}
                    className={`p-6 border-2 transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/70 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {isActive ? (
                          <CheckCircle2 className="h-8 w-8 text-blue-600" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-lg font-bold ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>
                              {isActive ? 'Cấu hình hiện tại' : config.name}
                            </span>
                            {isActive && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Đang áp dụng</span>}
                          </div>
                          <p className="text-gray-600">
                            Áp dụng từ: <strong>{formatDateTime(config.dateApply)}</strong>
                            {' '} - {' '}
                            Thời gian tạo: <strong>{formatDateTime(config.createTime)}</strong>
                          </p>

                          <div className="flex items-center gap-8 mt-4 text-gray-700">
                            <span className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              <strong>{(config.flatformFee * 100).toFixed(2)}%</strong>
                            </span>
                            <span className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              <strong>{formatVND(config.fixFee)} ₫</strong>
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <strong>{config.datePayout} ngày</strong>
                            </span>
                            <span className="flex items-center gap-2">
                              <BellRing className="h-4 w-4" />
                              <strong>{config.eventReminderHours}h</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isActive && (
                        <Button onClick={() => startReapply(config)} variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Chỉnh sửa & áp dụng lại
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pageNumber === 1}
                    onClick={() => fetchAllData(pageNumber - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                    Trang {pageNumber} / {totalPages}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pageNumber === totalPages}
                    onClick={() => fetchAllData(pageNumber + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription
              className="text-base"
              dangerouslySetInnerHTML={{ __html: confirmDialog.description || '' }}
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm} disabled={isSaving}>
              {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemSettings;