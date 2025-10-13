import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { z } from "zod";
import { PATH } from "../../routes/path";
import {
  Calendar,
  Image,
  Plus,
  Trash2,
  Save,
  Clock,
  Users,
  Settings,
  Globe,
  ArrowLeft,
  Loader2
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

import { eventAPI } from '../../api/eventAPI';
import TagSelector from '../../components/Event/TagSelector';
import RefundRuleManager from '../../components/Event/RefundRuleManager';

// Redux hooks
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { useRefundRules } from '../../hooks/useRefundRules';
import { useApp } from '../../hooks/useApp';

// Validation schema (same as CreateEventPage)
const editEventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề sự kiện là bắt buộc').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().min(1, 'Mô tả sự kiện là bắt buộc').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  detailedDescription: z.string().optional(),
  startTime: z.string().min(1, 'Thời gian bắt đầu là bắt buộc'),
  endTime: z.string().min(1, 'Thời gian kết thúc là bắt buộc'),
  isOnlineEvent: z.boolean().default(false),
  locationName: z.string().optional(),
  address: z.string().optional(),
  eventCategoryId: z.string().optional(),
  ticketType: z.string().min(1, 'Loại vé là bắt buộc'),
  requireApproval: z.boolean().default(false),
  publish: z.boolean().default(false),
  ticketDetails: z.array(z.object({
    ticketName: z.string().min(1, 'Tên vé là bắt buộc'),
    ticketPrice: z.number().min(0, 'Giá vé không được âm'),
    ticketQuantity: z.number().min(1, 'Số lượng vé phải lớn hơn 0'),
    ticketDescription: z.string().optional(),
    ruleRefundRequestId: z.string().min(1, 'Quy tắc hoàn tiền là bắt buộc'),
  })).min(1, 'Phải có ít nhất một loại vé')
}).refine((data) => {
  if (!data.isOnlineEvent && !data.locationName) {
    return false;
  }
  return true;
}, {
  message: 'Địa điểm là bắt buộc cho sự kiện offline',
  path: ['locationName'],
});

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags: reduxSelectedTags, clearAllSelectedTags, selectTagForForm } = useTags();
  const { selectedRules, clearSelectedRefundRules, selectRuleForForm } = useRefundRules();
  const { showLoading, hideLoading, updatePageTitle } = useApp();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: '',
      description: '',
      detailedDescription: '',
      startTime: '',
      endTime: '',
      locationName: '',
      address: '',
      eventCategoryId: '',
      isOnlineEvent: false,
      requireApproval: false,
      publish: false,
      ticketType: '1',
      ticketDetails: [
        {
          ticketName: 'Vé thường',
          ticketPrice: 0,
          ticketQuantity: 1,
          ticketDescription: '',
          ruleRefundRequestId: '',
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketDetails',
  });

  const watchIsOnline = watch('isOnlineEvent');
  const watchTicketType = watch('ticketType');

  // Set page title and load event data
  useEffect(() => {
    updatePageTitle('Chỉnh sửa sự kiện');
    if (eventId) {
      loadEventData();
    }
    
    return () => {
      clearAllSelectedTags();
      clearSelectedRefundRules();
    };
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      showLoading();
      
      const response = await eventAPI.getEventById(eventId);
      
      if (response?.data) {
        const event = response.data;
        
        // Populate form with existing data
        const formData = {
          title: event.title || '',
          description: event.description || '',
          detailedDescription: event.detailedDescription || '',
          startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
          endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
          locationName: event.locationName || '',
          address: event.address || '',
          eventCategoryId: event.eventCategoryId || '',
          isOnlineEvent: event.isOnlineEvent || false,
          requireApproval: event.requireApproval || false,
          publish: event.publish || false,
          ticketType: String(event.ticketType || 1),
          ticketDetails: event.ticketDetails && event.ticketDetails.length > 0 
            ? event.ticketDetails.map(ticket => ({
                ticketName: ticket.ticketName || '',
                ticketPrice: ticket.ticketPrice || 0,
                ticketQuantity: ticket.ticketQuantity || 1,
                ticketDescription: ticket.ticketDescription || '',
                ruleRefundRequestId: ticket.ruleRefundRequestId || '',
              }))
            : [
                {
                  ticketName: 'Vé thường',
                  ticketPrice: 0,
                  ticketQuantity: event.totalTickets || 1,
                  ticketDescription: '',
                  ruleRefundRequestId: '',
                }
              ],
        };

        // Reset form with loaded data
        reset(formData);

        // Load existing images
        if (event.imgListEvent && event.imgListEvent.length > 0) {
          setExistingImages(event.imgListEvent);
        }

        // Load existing tags if any
        if (event.eventTags && event.eventTags.length > 0) {
          event.eventTags.forEach(eventTag => {
            if (eventTag.tag) {
              selectTagForForm(eventTag.tag);
            }
          });
        }

        // Load existing refund rule if any
        if (event.ticketDetails && event.ticketDetails.length > 0) {
          const firstTicket = event.ticketDetails[0];
          if (firstTicket.ruleRefundRequestId && firstTicket.refundRule) {
            selectRuleForForm(firstTicket.refundRule);
          }
        }

        toast.success('Đã tải thông tin sự kiện');
      } else {
        toast.error('Không tìm thấy sự kiện');
        navigate(PATH.ORGANIZER_MY_EVENTS);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Không thể tải thông tin sự kiện');
      navigate(PATH.ORGANIZER_MY_EVENTS);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new image
  const removeNewImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  // Add ticket detail
  const addTicketDetail = () => {
    append({
      ticketName: '',
      ticketPrice: watchTicketType === '1' ? 0 : '',
      ticketQuantity: 1,
      ticketDescription: '',
      ruleRefundRequestId: selectedRule?.ruleRefundId || '',
    });
  };

  // Remove ticket detail
  const removeTicketDetail = (index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error('Phải có ít nhất một loại vé');
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    // Check if user has organizer role
    if (!user || !['Organizer', 'Admin', 'Manager'].includes(user.role)) {
      toast.error('Bạn không có quyền chỉnh sửa sự kiện');
      return;
    }

    // Validate refund rule selection for each ticket
    const hasEmptyRefundRule = data.ticketDetails.some(ticket => !ticket.ruleRefundRequestId);
    if (hasEmptyRefundRule) {
      toast.error('Vui lòng chọn quy tắc hoàn tiền cho tất cả các loại vé');
      return;
    }

    // Validate category selection
    if (!data.eventCategoryId) {
      toast.error('Vui lòng chọn danh mục sự kiện');
      return;
    }

    // Calculate total tickets from ticketDetails array
    const totalTickets = data.ticketDetails.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);

    const eventData = {
      eventId: eventId,
      title: data.title,
      description: data.description,
      detailedDescription: data.detailedDescription || '',
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      isOnlineEvent: data.isOnlineEvent || false,
      locationName: data.locationName || '',
      address: data.address || '',
      city: null,
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      ticketType: parseInt(data.ticketType),
      requireApproval: data.requireApproval || false,
      publish: data.publish || false,
      images: selectedImages, // New images
      existingImages: existingImages, // Keep existing images
      eventCategoryId: data.eventCategoryId,
      tags: reduxSelectedTags.map(tag => ({ tagId: tag.tagId })),
      ticketDetails: data.ticketDetails.map(ticket => ({
        ticketName: ticket.ticketName,
        ticketPrice: parseFloat(ticket.ticketPrice),
        ticketQuantity: parseInt(ticket.ticketQuantity),
        ticketDescription: ticket.ticketDescription || '',
        ruleRefundRequestId: ticket.ruleRefundRequestId,
      })),
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'startTime', 'endTime', 'totalTickets', 'eventCategoryId'];
    if (!eventData.isOnlineEvent) {
      requiredFields.push('locationName', 'address');
    }
    
    const missingFields = requiredFields.filter(field => !eventData[field]);
    if (missingFields.length > 0) {
      toast.error(`Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`);
      return;
    }
    
    if (eventData.totalTickets <= 0) {
      toast.error('Tổng số vé phải lớn hơn 0');
      return;
    }

    // Validate dates
    const startDate = new Date(eventData.startTime);
    const endDate = new Date(eventData.endTime);
    const now = new Date();

    if (endDate <= startDate) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    try {
      showLoading();
      setIsSaving(true);
      
      const response = await eventAPI.updateEvent(eventData);
      
      if (response?.statusCode?.startsWith('AIE200') || response?.statusCode === 'AIE20000') {
        toast.success('✅ Cập nhật sự kiện thành công!');
        navigate(`/organizer/event/${eventId}`);
      } else {
        toast.error(response?.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sự kiện';
      
      if (errorData?.errors === 'Invalid Organizer ID in token' || error.response?.status === 401) {
        errorMessage = 'Tài khoản organizer không hợp lệ hoặc phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => {
          localStorage.removeItem('currentUser');
          navigate('/auth/login');
        }, 2000);
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      hideLoading();
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy? Mọi thay đổi sẽ không được lưu.')) {
      navigate(`/organizer/event/${eventId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chỉnh sửa sự kiện
              </h1>
              <p className="text-gray-600 text-lg">
                Cập nhật thông tin sự kiện của bạn
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <Card className="border-l-4 border-l-blue-500 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div>
                  <Label htmlFor="title" className="text-base font-semibold">Tiêu đề sự kiện *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Nhập tiêu đề sự kiện"
                    className="mt-2 h-12 text-base border-2 focus:border-blue-500"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold">Mô tả ngắn *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Mô tả ngắn gọn về sự kiện"
                    rows={3}
                    className="mt-2 text-base border-2 focus:border-blue-500"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <Label htmlFor="detailedDescription" className="text-base font-semibold">Mô tả chi tiết</Label>
                  <Textarea
                    id="detailedDescription"
                    {...register('detailedDescription')}
                    placeholder="Mô tả chi tiết về sự kiện..."
                    rows={5}
                    className="mt-2 text-base border-2 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="eventCategoryId" className="text-base font-semibold">Danh mục sự kiện *</Label>
                    <Select onValueChange={(value) => setValue('eventCategoryId', value)} value={watch('eventCategoryId')}>
                      <SelectTrigger className="mt-2 h-12 text-base border-2">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.eventCategoryId} value={category.eventCategoryId}>
                            {category.eventCategoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.eventCategoryId && <p className="text-red-500 text-sm mt-1">{errors.eventCategoryId.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="ticketType" className="text-base font-semibold">Loại vé *</Label>
                    <Select onValueChange={(value) => setValue('ticketType', value)} value={watchTicketType}>
                      <SelectTrigger className="mt-2 h-12 text-base border-2">
                        <SelectValue placeholder="Chọn loại vé" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Miễn phí</SelectItem>
                        <SelectItem value="2">Có phí</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <TagSelector
              className="shadow-xl"
            />
            
            <RefundRuleManager
              className="shadow-xl"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
