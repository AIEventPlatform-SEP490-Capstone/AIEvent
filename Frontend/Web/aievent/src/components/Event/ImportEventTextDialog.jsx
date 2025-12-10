import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
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
  Info
} from 'lucide-react';
import { parseEventFromText } from '../../utils/cloudflareAI';
import { toast } from 'react-hot-toast';

const EXAMPLE_TEXT = `Sự kiện: Đêm nhạc Acoustic "Những Bản Tình Ca"
Mô tả: Đêm nhạc acoustic với những bản tình ca bất hủ
Địa điểm: Nhà hát Hòa Bình, 240 Đường 3/2, Quận 10, TP.HCM
Thời gian: 20:00 ngày 15/02/2025 đến 23:00
Bán vé từ 01/01/2025 đến 14/02/2025
Vé VIP: 500.000đ - 50 vé
Vé Thường: 200.000đ - 200 vé`;

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
        toast.success('Phân tích thành công! Kiểm tra kết quả bên dưới.');
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            Import thông tin sự kiện bằng AI
          </DialogTitle>
          <DialogDescription>
            Nhập mô tả sự kiện bằng văn bản tự nhiên, AI sẽ tự động phân tích và điền vào form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Hướng dẫn:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>Nhập thông tin sự kiện theo dạng văn bản tự nhiên</li>
                  <li>Bao gồm: tên sự kiện, địa điểm, thời gian, giá vé...</li>
                  <li>AI sẽ tự động trích xuất và điền vào form</li>
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
                className="text-xs text-muted-foreground hover:text-foreground"
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
                setParsedData(null);
              }}
              placeholder="Ví dụ: Sự kiện âm nhạc 'Đêm Nhạc Trịnh' tại Nhà hát Hòa Bình, 240 Đường 3/2, Quận 10, TP.HCM. Thời gian: 20:00 ngày 15/02/2025. Vé VIP 500.000đ (50 vé), Vé thường 200.000đ (200 vé)..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} ký tự
            </p>
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

          {/* Parsed Result Preview */}
          {parsedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Kết quả phân tích:</span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3 text-sm max-h-64 overflow-y-auto">
                {parsedData.title && (
                  <div>
                    <span className="font-medium text-muted-foreground">Tiêu đề:</span>
                    <p className="text-foreground">{parsedData.title}</p>
                  </div>
                )}
                {parsedData.description && (
                  <div>
                    <span className="font-medium text-muted-foreground">Mô tả:</span>
                    <p className="text-foreground">{parsedData.description}</p>
                  </div>
                )}
                {parsedData.locationName && (
                  <div>
                    <span className="font-medium text-muted-foreground">Địa điểm:</span>
                    <p className="text-foreground">{parsedData.locationName}</p>
                  </div>
                )}
                {parsedData.address && (
                  <div>
                    <span className="font-medium text-muted-foreground">Địa chỉ:</span>
                    <p className="text-foreground">{parsedData.address}</p>
                  </div>
                )}
                {parsedData.district && (
                  <div>
                    <span className="font-medium text-muted-foreground">Quận/Huyện:</span>
                    <p className="text-foreground">{parsedData.district}</p>
                  </div>
                )}
                {parsedData.startTime && (
                  <div>
                    <span className="font-medium text-muted-foreground">Bắt đầu:</span>
                    <p className="text-foreground">{parsedData.startTime}</p>
                  </div>
                )}
                {parsedData.endTime && (
                  <div>
                    <span className="font-medium text-muted-foreground">Kết thúc:</span>
                    <p className="text-foreground">{parsedData.endTime}</p>
                  </div>
                )}
                {parsedData.ticketTypes && parsedData.ticketTypes.length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground">Loại vé:</span>
                    <ul className="mt-1 space-y-1">
                      {parsedData.ticketTypes.map((ticket, idx) => (
                        <li key={idx} className="text-foreground pl-2 border-l-2 border-primary">
                          {ticket.ticketName}: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticket.ticketPrice)} 
                          ({ticket.ticketQuantity} vé)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
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
