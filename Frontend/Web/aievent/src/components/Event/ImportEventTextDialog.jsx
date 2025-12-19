import { useState, useMemo } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import {
  parseEventFromText,
  generateMultipleEventImages,
} from '../../utils/cloudflareAI';
import { toast } from 'react-hot-toast';
import { PredefinedCities } from '../../constants/userConstants';
import { Image as ImageIcon, Check, Plus, Minus } from 'lucide-react';

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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]); // Array of images
  const [selectedImages, setSelectedImages] = useState([]); // Selected images to import
  const [imageCount, setImageCount] = useState(3); // Number of images to generate

  // Validate parsed data and return warnings - only check fields that have data
  const validationWarnings = useMemo(() => {
    if (!parsedData) return [];

    const warnings = [];
    const now = new Date();

    // Title validation - only if has value
    if (parsedData.title && parsedData.title.length > 200) {
      warnings.push({
        field: 'title',
        message: `Tiêu đề vượt quá 200 ký tự (${parsedData.title.length}/200)`,
        type: 'error',
      });
    }

    // Description validation - only if has value
    if (parsedData.description && parsedData.description.length > 1000) {
      warnings.push({
        field: 'description',
        message: `Mô tả vượt quá 1000 ký tự (${parsedData.description.length}/1000)`,
        type: 'error',
      });
    }

    // District validation - only if has value, check if matches predefined list
    if (parsedData.district) {
      const districtInput = parsedData.district.toLowerCase().trim();
      const matchedDistrict = PredefinedCities.find((city) => {
        const cityLower = city.toLowerCase();
        if (cityLower === districtInput) return true;
        if (districtInput.includes(cityLower) || cityLower.includes(districtInput)) return true;
        const numberMatch = districtInput.match(/\d+/);
        if (numberMatch && cityLower.includes(numberMatch[0])) return true;
        return false;
      });
      if (!matchedDistrict) {
        warnings.push({
          field: 'district',
          message: `Quận "${parsedData.district}" không khớp với danh sách. Sẽ cần chọn lại thủ công.`,
          type: 'warning',
        });
      }
    }

    // DateTime validations - only if has value
    if (parsedData.startTime) {
      const startTime = new Date(parsedData.startTime);
      if (startTime <= now) {
        warnings.push({
          field: 'startTime',
          message: 'Thời gian bắt đầu phải sau thời điểm hiện tại',
          type: 'error',
        });
      }
    }

    if (parsedData.endTime && parsedData.startTime) {
      const startTime = new Date(parsedData.startTime);
      const endTime = new Date(parsedData.endTime);
      if (endTime <= startTime) {
        warnings.push({
          field: 'endTime',
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
          type: 'error',
        });
      }
    }

    if (parsedData.saleStartTime) {
      const saleStartTime = new Date(parsedData.saleStartTime);
      if (saleStartTime <= now) {
        warnings.push({
          field: 'saleStartTime',
          message: 'Thời gian mở bán vé phải sau thời điểm hiện tại',
          type: 'error',
        });
      }
    }

    if (parsedData.saleEndTime && parsedData.saleStartTime) {
      const saleStartTime = new Date(parsedData.saleStartTime);
      const saleEndTime = new Date(parsedData.saleEndTime);
      if (saleEndTime <= saleStartTime) {
        warnings.push({
          field: 'saleEndTime',
          message: 'Thời gian đóng bán vé phải sau thời gian mở bán',
          type: 'error',
        });
      }
    }

    if (parsedData.saleStartTime && parsedData.startTime) {
      const saleStartTime = new Date(parsedData.saleStartTime);
      const eventStartTime = new Date(parsedData.startTime);
      if (saleStartTime >= eventStartTime) {
        warnings.push({
          field: 'saleStartTime',
          message: 'Thời gian mở bán vé phải trước thời gian bắt đầu sự kiện',
          type: 'error',
        });
      }
    }

    if (parsedData.saleEndTime && parsedData.startTime) {
      const saleEndTime = new Date(parsedData.saleEndTime);
      const eventStartTime = new Date(parsedData.startTime);
      if (saleEndTime >= eventStartTime) {
        warnings.push({
          field: 'saleEndTime',
          message: 'Thời gian đóng bán vé phải trước thời gian bắt đầu sự kiện',
          type: 'error',
        });
      }
    }

    // Ticket validations - only if has tickets
    if (parsedData.ticketTypes && parsedData.ticketTypes.length > 0) {
      parsedData.ticketTypes.forEach((ticket, idx) => {
        // Only validate price if it exists
        if (ticket.ticketPrice !== null && ticket.ticketPrice !== undefined && ticket.ticketPrice < 10000) {
          warnings.push({
            field: `ticket_${idx}`,
            message: `Vé "${ticket.ticketName || idx + 1}": Giá vé phải >= 10.000 VND`,
            type: 'error',
          });
        }
        // Only validate quantity if it exists
        if (ticket.ticketQuantity !== null && ticket.ticketQuantity !== undefined) {
          if (ticket.ticketQuantity < 20) {
            warnings.push({
              field: `ticket_${idx}`,
              message: `Vé "${ticket.ticketName || idx + 1}": Số lượng phải >= 20`,
              type: 'error',
            });
          }
          if (ticket.ticketQuantity > 100000) {
            warnings.push({
              field: `ticket_${idx}`,
              message: `Vé "${ticket.ticketName || idx + 1}": Số lượng phải <= 100.000`,
              type: 'error',
            });
          }
        }
      });
    }

    return warnings;
  }, [parsedData]);

  const hasErrors = validationWarnings.some(w => w.type === 'error');
  const hasWarnings = validationWarnings.some(w => w.type === 'warning');

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
      // Include selected generated images
      const dataToImport = {
        ...parsedData,
        generatedImages: selectedImages.length > 0 ? selectedImages : null,
      };
      onImport(dataToImport);
      handleClose();
      toast.success('Đã import thông tin sự kiện');
    }
  };

  const handleClose = () => {
    setText('');
    setParsedData(null);
    setError('');
    setGeneratedImages([]);
    setSelectedImages([]);
    onOpenChange(false);
  };

  const handleUseExample = () => {
    setText(EXAMPLE_TEXT);
    setParsedData(null);
    setError('');
    setGeneratedImages([]);
    setSelectedImages([]);
  };

  const handleGenerateImages = async () => {
    if (!parsedData) {
      toast.error('Vui lòng phân tích thông tin sự kiện trước');
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedImages([]);
    setSelectedImages([]);

    try {
      const result = await generateMultipleEventImages(parsedData, imageCount);
      if (result.success && result.images.length > 0) {
        setGeneratedImages(result.images);
        // Auto-select first image
        setSelectedImages([result.images[0].image]);
        toast.success(`Đã tạo ${result.totalGenerated} ảnh thành công!`);
      } else {
        toast.error(result.error || 'Không thể tạo ảnh');
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi tạo ảnh');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const toggleImageSelection = (image) => {
    setSelectedImages((prev) => {
      if (prev.includes(image)) {
        return prev.filter((img) => img !== image);
      } else if (prev.length < 5) {
        return [...prev, image];
      } else {
        toast.error('Chỉ được chọn tối đa 5 ảnh');
        return prev;
      }
    });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-purple-600" />
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
                className="resize-y text-sm min-h-[200px] max-h-[500px]"
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
              className="w-full bg-purple-600 hover:bg-purple-700"
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
              <div className={`border rounded-lg overflow-hidden ${
                hasErrors 
                  ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                  : hasWarnings
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20'
                    : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
              }`}>
                {/* Status Header */}
                <div className={`px-4 py-2 flex items-center gap-2 ${
                  hasErrors 
                    ? 'bg-red-100 dark:bg-red-900/50'
                    : hasWarnings
                      ? 'bg-yellow-100 dark:bg-yellow-900/50'
                      : 'bg-green-100 dark:bg-green-900/50'
                }`}>
                  {hasErrors ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Có {validationWarnings.filter(w => w.type === 'error').length} lỗi cần sửa
                      </span>
                    </>
                  ) : hasWarnings ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        Có {validationWarnings.filter(w => w.type === 'warning').length} cảnh báo
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Phân tích thành công
                      </span>
                    </>
                  )}
                </div>

                {/* Validation Warnings/Errors */}
                {validationWarnings.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {validationWarnings.map((warning, idx) => (
                        <div key={idx} className={`flex items-start gap-2 text-xs ${
                          warning.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {warning.type === 'error' ? (
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                  {/* AI Generated Image Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Ảnh sự kiện (AI) {selectedImages.length > 0 && `- Đã chọn ${selectedImages.length}`}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Image count selector */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1">
                          <button
                            type="button"
                            onClick={() => setImageCount((c) => Math.max(1, c - 1))}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            disabled={imageCount <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium w-4 text-center">{imageCount}</span>
                          <button
                            type="button"
                            onClick={() => setImageCount((c) => Math.min(5, c + 1))}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            disabled={imageCount >= 5}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleGenerateImages}
                          disabled={isGeneratingImage || !parsedData}
                          className="h-7 text-xs"
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Tạo {imageCount} ảnh
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {generatedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {generatedImages.map((imgData, idx) => (
                          <div
                            key={idx}
                            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                              selectedImages.includes(imgData.image)
                                ? 'border-green-500 ring-2 ring-green-200'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }`}
                            onClick={() => toggleImageSelection(imgData.image)}
                          >
                            <img
                              src={imgData.image}
                              alt={`AI Generated ${idx + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            {/* Selection indicator */}
                            {selectedImages.includes(imgData.image) && (
                              <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1">
                              <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-30" />
                          <p className="text-xs">Nhấn "Tạo ảnh" để tạo banner</p>
                          <p className="text-[10px] mt-1">Click ảnh để chọn, tối đa 5 ảnh</p>
                        </div>
                      </div>
                    )}
                  </div>
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
            disabled={!parsedData || hasErrors}
            className={`${
              hasErrors
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title={hasErrors ? 'Vui lòng sửa các lỗi trước khi import' : ''}
          >
            <FileText className="w-4 h-4 mr-2" />
            {hasErrors
              ? 'Có lỗi - Không thể import'
              : hasWarnings
                ? 'Import (có cảnh báo)'
                : selectedImages.length > 0
                  ? `Import (${selectedImages.length} ảnh)`
                  : 'Import vào form'}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
};

export default ImportEventTextDialog;
