import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Copy,
  Info,
  Calendar,
  MapPin,
  Ticket,
  Clock,
} from 'lucide-react';
import { parseEventFromText } from '../../utils/cloudflareAI';
import { toast } from 'react-hot-toast';

const EXAMPLE_TEXT = `Sự kiện: Đêm nhạc Acoustic "Những Bản Tình Ca Bất Hủ"
Mô tả: Đêm nhạc acoustic lãng mạn với những ca khúc tình yêu được yêu thích nhất
Chi tiết: Chương trình quy tụ các nghệ sĩ acoustic hàng đầu Việt Nam, mang đến không gian âm nhạc ấm cúng và đầy cảm xúc.
Địa điểm: Nhà hát Hòa Bình
Địa chỉ: 240 Đường 3 Tháng 2
Quận: Quận 10
Thời gian sự kiện: 20:00 ngày 15/02/2025 đến 23:00 ngày 15/02/2025
Bán vé từ 20/12/2024 08:00 đến 14/02/2025 18:00
Vé VIP: 800.000đ - 100 vé - Hàng ghế đầu
Vé Standard: 250.000đ - 300 vé - Khu vực phía sau`;

const ImportEventTextDialog = ({ open, onOpenChange, onImport }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập thông tin sự kiện');
      return;
    }

    setIsLoading(true);
    setError('');
    setParsedData(null);

    try {
      const result = await parseEventFromText(text);

      if (result.success) {
        setParsedData(result.data);
        toast.success('Phân tích thành công!');
      } else {
        setError(result.error || 'Không thể phân tích thông tin sự kiện');
        toast.error('Không thể phân tích thông tin');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi phân tích');
      toast.error('Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      handleClose();
      toast.success('Đã import thông tin sự kiện');
    }
  };

  const handleClose = () => {
    setText('');
    setParsedData(null);
    setError('');
    onOpenChange(false);
  };

  const handleUseExample = () => {
    setText(EXAMPLE_TEXT);
    setParsedData(null);
    setError('');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            Import thông tin sự kiện bằng AI
          </DialogTitle>
          <DialogDescription>
            Nhập mô tả sự kiện bằng văn bản tự nhiên, AI sẽ tự động phân tích và
            điền vào form.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Left Side - Input */}
          <div className="space-y-4">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Nhập thông tin sự kiện dạng văn bản tự nhiên</li>
                    <li>Bao gồm: tên, địa điểm, thời gian, giá vé...</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="event-text" className="text-sm font-medium">
                  Mô tả sự kiện
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseExample}
                  className="text-xs text-muted-foreground hover:text-foreground h-7"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Dùng ví dụ
                </Button>
              </div>
              <Textarea
                id="event-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError('');
                }}
                placeholder="Ví dụ: Sự kiện âm nhạc 'Đêm Nhạc Trịnh' tại Nhà hát Hòa Bình, Quận 10. Thời gian: 20:00 ngày 15/02/2025. Vé VIP 500.000đ (50 vé)..."
                rows={12}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">{text.length} ký tự</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Parse Button */}
            <Button
              type="button"
              onClick={handleParse}
              disabled={isLoading || !text.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Phân tích bằng AI
                </>
              )}
            </Button>
          </div>

          {/* Right Side - Result Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Kết quả phân tích</Label>
            </div>

            {!parsedData && !isLoading && (
              <div className="h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground p-6">
                  <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Kết quả phân tích sẽ hiển thị ở đây</p>
                  <p className="text-xs mt-1">Nhập mô tả và nhấn "Phân tích bằng AI"</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[300px] border-2 border-dashed border-purple-200 dark:border-purple-700 rounded-lg flex items-center justify-center bg-purple-50/50 dark:bg-purple-950/20">
                <div className="text-center text-purple-600 p-6">
                  <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium">Đang phân tích...</p>
                  <p className="text-xs mt-1">AI đang xử lý thông tin sự kiện</p>
                </div>
              </div>
            )}

            {parsedData && (
              <div className="border border-green-200 dark:border-green-800 rounded-lg bg-green-50/50 dark:bg-green-950/20 overflow-hidden">
                {/* Success Header */}
                <div className="bg-green-100 dark:bg-green-900/50 px-4 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Phân tích thành công
                  </span>
                </div>

                {/* Result Content */}
                <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
                  {/* Title */}
                  {parsedData.title && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Tiêu đề
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {parsedData.title}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {parsedData.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Mô tả
                      </p>
                      <p className="text-sm text-foreground">{parsedData.description}</p>
                    </div>
                  )}

                  {/* Location */}
                  {(parsedData.locationName || parsedData.address || parsedData.district) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Địa điểm
                        </p>
                        {parsedData.locationName && (
                          <p className="text-sm font-medium text-foreground">
                            {parsedData.locationName}
                          </p>
                        )}
                        {parsedData.address && (
                          <p className="text-sm text-muted-foreground">{parsedData.address}</p>
                        )}
                        {parsedData.district && (
                          <p className="text-sm text-muted-foreground">{parsedData.district}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Time */}
                  {(parsedData.startTime || parsedData.endTime) && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Thời gian sự kiện
                        </p>
                        <p className="text-sm text-foreground">
                          {formatDateTime(parsedData.startTime)}
                          {parsedData.endTime && ` - ${formatDateTime(parsedData.endTime)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sale Time */}
                  {(parsedData.saleStartTime || parsedData.saleEndTime) && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Thời gian bán vé
                        </p>
                        <p className="text-sm text-foreground">
                          {formatDateTime(parsedData.saleStartTime)}
                          {parsedData.saleEndTime && ` - ${formatDateTime(parsedData.saleEndTime)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tickets */}
                  {parsedData.ticketTypes && parsedData.ticketTypes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Ticket className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Loại vé ({parsedData.ticketTypes.length})
                        </p>
                        <div className="space-y-2">
                          {parsedData.ticketTypes.map((ticket, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-foreground">
                                  {ticket.ticketName}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(ticket.ticketPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {ticket.ticketQuantity} vé
                                </span>
                                {ticket.ticketDescription && (
                                  <span className="text-xs text-muted-foreground">
                                    {ticket.ticketDescription}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!parsedData}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Import vào form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEventTextDialog;
