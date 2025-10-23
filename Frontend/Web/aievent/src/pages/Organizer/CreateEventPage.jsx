import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

import { useEvents } from '../../hooks/useEvents';
import TagSelector from '../../components/Event/TagSelector';
import RefundRuleManager from '../../components/Event/RefundRuleManager';

// Redux hooks
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { useRefundRules } from '../../hooks/useRefundRules';
import { useApp } from '../../hooks/useApp';

// Import the EventDetailGuestPage component for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';

// Import ConfirmStatus enum
import { ConfirmStatus } from '../../constants/eventConstants';

// Validation schema
const createEventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề sự kiện là bắt buộc').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().min(1, 'Mô tả sự kiện là bắt buộc').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  detailedDescription: z.string().optional(),
  startTime: z.string().min(1, 'Thời gian bắt đầu là bắt buộc'),
  endTime: z.string().min(1, 'Thời gian kết thúc là bắt buộc'),
  isOnlineEvent: z.boolean().default(false),
  locationName: z.string().optional(),
  address: z.string().optional(),
  linkRef: z.string().optional(),
  eventCategoryId: z.string().optional(),
  ticketType: z.string().min(1, 'Loại vé là bắt buộc'),
  requireApproval: z.nativeEnum(ConfirmStatus).default(ConfirmStatus.NeedConfirm),
  publish: z.boolean().default(false),
  saleStartTime: z.string().min(1, 'Thời gian bắt đầu bán vé là bắt buộc'),
  saleEndTime: z.string().min(1, 'Thời gian kết thúc bán vé là bắt buộc'),
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
}).refine((data) => {
  const saleStart = new Date(data.saleStartTime);
  const saleEnd = new Date(data.saleEndTime);
  const eventStart = new Date(data.startTime);
  
  if (saleStart >= saleEnd) {
    return false;
  }
  
  if (saleStart >= eventStart) {
    return false;
  }
  
  return true;
}, {
  message: 'Thời gian bán vé phải kết thúc trước thời gian bắt đầu sự kiện và thời gian bắt đầu bán vé phải trước thời gian kết thúc bán vé',
  path: ['saleEndTime'],
});

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags: reduxSelectedTags, clearAllSelectedTags } = useTags();
  const { selectedRules, clearSelectedRefundRules } = useRefundRules();
  const { showLoading, hideLoading, updatePageTitle } = useApp();
  const { createEvent: createEventAPI, loading: eventLoading } = useEvents();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      detailedDescription: '',
      startTime: '',
      endTime: '',
      locationName: '',
      address: '',
      linkRef: '',
      eventCategoryId: '',
      isOnlineEvent: false,
      requireApproval: ConfirmStatus.NeedConfirm,
      publish: false,
      saleStartTime: '',
      saleEndTime: '',
      ticketType: '1', // Free by default
      ticketDetails: [
        {
          ticketName: 'Vé thường',
          ticketPrice: 0,
          ticketQuantity: 1,
          ticketDescription: '',
          ruleRefundRequestId: '', // Will be set when refund rule is selected
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

  // Set page title and cleanup on mount
  useEffect(() => {
    updatePageTitle('Tạo sự kiện mới');
    
    return () => {
      clearAllSelectedTags();
      clearSelectedRefundRules();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh');
      return;
    }

    setSelectedImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  // Remove image
  const removeImage = (index) => {
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
      ruleRefundRequestId: selectedRules.length > 0 ? selectedRules[0].ruleRefundId : '',
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

  // Generate preview data from form values
  const generatePreviewData = (formData) => {
    // Get category name from selected category ID
    const selectedCategory = categories.find(cat => cat.eventCategoryId === formData.eventCategoryId);
    
    // Use only selected tags, not all available tags
    const eventTags = reduxSelectedTags.map(tag => ({
      tagId: tag.tagId,
      tagName: tag.tagName || tag.nameTag
    }));
    
    // Format ticket details with refund rule names
    const ticketDetails = formData.ticketDetails.map(ticket => {
      const refundRule = selectedRules.find(rule => rule.ruleRefundId === ticket.ruleRefundRequestId);
      return {
        ...ticket,
        ticketPrice: parseFloat(ticket.ticketPrice) || 0,
        ticketQuantity: parseInt(ticket.ticketQuantity) || 0,
        soldQuantity: 0, // Default for preview
        remainingQuantity: parseInt(ticket.ticketQuantity) || 0, // Default for preview
        ruleRefundRequestName: refundRule ? refundRule.ruleName : ''
      };
    });
    
    // Calculate total tickets
    const totalTickets = ticketDetails.reduce((sum, ticket) => sum + (parseInt(ticket.ticketQuantity) || 0), 0);
    
    // Format image previews
    const imgListEvent = imagePreview.length > 0 ? imagePreview : [];
    
    // Create preview event data
    const previewData = {
      eventId: 'preview-event-id',
      title: formData.title || 'Tiêu đề sự kiện mẫu',
      description: formData.description || 'Mô tả sự kiện mẫu',
      detailedDescription: formData.detailedDescription || '',
      linkRef: formData.linkRef || '',
      startTime: formData.startTime || new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: formData.endTime || new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      saleStartTime: formData.saleStartTime || new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      saleEndTime: formData.saleEndTime || new Date(Date.now() + 82800000).toISOString(), // 23 hours from now
      isOnlineEvent: formData.isOnlineEvent || false,
      locationName: formData.locationName || '',
      address: formData.address || '',
      city: null,
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      soldQuantity: 0,
      remainingTickets: totalTickets,
      ticketType: parseInt(formData.ticketType) || 1,
      imgListEvent: imgListEvent,
      requireApproval: formData.requireApproval === ConfirmStatus.Approve ? 1 : 
                     formData.requireApproval === ConfirmStatus.Reject ? -1 : 0, // For preview compatibility
      eventCategoryName: selectedCategory ? selectedCategory.eventCategoryName : '',
      eventTags: eventTags, // Only use selected tags
      ticketDetails: ticketDetails,
      organizerEvent: {
        organizerId: user?.id || 'preview-organizer-id',
        companyName: user?.fullName || 'Nhà tổ chức mẫu',
        companyDescription: 'Mô tả nhà tổ chức mẫu',
        imgCompany: null
      }
    };
    
    return previewData;
  };

  // Handle form submission
  const onSubmit = async (data) => {
    // Check if user has organizer role
    if (!user || !['Organizer', 'Admin', 'Manager'].includes(user.role)) {
      toast.error('Bạn không có quyền tạo sự kiện');
      return;
    }

    // Validate refund rules selection
    if (selectedRules.length === 0) {
      toast.error('Vui lòng chọn ít nhất một quy tắc hoàn tiền');
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

    // Filter out empty images (từ logic cũ)
    const validImages = selectedImages.filter(img => img instanceof File);
    
    // Calculate total tickets from ticketDetails array
    const totalTickets = data.ticketDetails.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);

    const eventData = {
      title: data.title,
      description: data.description,
      detailedDescription: data.detailedDescription || '',
      linkRef: data.linkRef || '',
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      saleStartTime: new Date(data.saleStartTime).toISOString(),
      saleEndTime: new Date(data.saleEndTime).toISOString(),
      isOnlineEvent: data.isOnlineEvent || false,
      locationName: data.locationName || '',
      address: data.address || '',
      city: null, // Add city field (từ logic cũ)
      latitude: null, // Add latitude (từ logic cũ)
      longitude: null, // Add longitude (từ logic cũ)
      totalTickets: totalTickets,
      ticketType: parseInt(data.ticketType),
      requireApproval: data.requireApproval,
      publish: data.publish || false,
      images: validImages, // Use validated images
      eventCategoryId: data.eventCategoryId,
      tags: reduxSelectedTags.map(tag => ({ tagId: tag.tagId })),
      refundRules: selectedRules.map(rule => ({ ruleRefundId: rule.ruleRefundId })),
      ticketDetails: data.ticketDetails.map(ticket => ({
        ticketName: ticket.ticketName,
        ticketPrice: parseFloat(ticket.ticketPrice),
        ticketQuantity: parseInt(ticket.ticketQuantity),
        ticketDescription: ticket.ticketDescription || '',
        ruleRefundRequestId: ticket.ruleRefundRequestId,
      })),
    };

    // Validate required fields (từ logic cũ)
    const requiredFields = ['title', 'description', 'startTime', 'endTime', 'saleStartTime', 'saleEndTime', 'totalTickets', 'eventCategoryId'];
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

    // Validate dates (từ logic cũ)
    const startDate = new Date(eventData.startTime);
    const endDate = new Date(eventData.endTime);
    const saleStartDate = new Date(eventData.saleStartTime);
    const saleEndDate = new Date(eventData.saleEndTime);
    const now = new Date();

    if (startDate <= now) {
      toast.error('Thời gian bắt đầu phải sau thời điểm hiện tại');
      return;
    }

    if (endDate <= startDate) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    if (saleStartDate >= startDate) {
      toast.error('Thời gian bắt đầu bán vé phải trước thời gian bắt đầu sự kiện');
      return;
    }

    if (saleEndDate <= saleStartDate) {
      toast.error('Thời gian kết thúc bán vé phải sau thời gian bắt đầu bán vé');
      return;
    }

    if (saleEndDate >= startDate) {
      toast.error('Thời gian kết thúc bán vé phải trước thời gian bắt đầu sự kiện');
      return;
    }

    try {
      showLoading();
      setIsSubmitting(true);
      
      const response = await createEventAPI(eventData);
      
      if (response) {
        toast.success('✅ Tạo sự kiện thành công!');
        clearAllSelectedTags();
        clearSelectedRefundRules();
        navigate(PATH.ORGANIZER_MY_EVENTS);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Có lỗi xảy ra khi tạo sự kiện';
      
      // Handle specific error cases (từ logic cũ)
      if (errorData?.errors === 'Invalid Organizer ID in token' || error.response?.status === 401) {
        errorMessage = 'Tài khoản organizer không hợp lệ hoặc phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        // Clear tokens and redirect to login
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <Plus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Tạo sự kiện mới
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Tạo một sự kiện tuyệt vời và chia sẻ với cộng đồng
          </p>
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
                <CardDescription className="text-base">
                  Thông tin cơ bản về sự kiện của bạn
                </CardDescription>
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

                <div>
                  <Label htmlFor="linkRef" className="text-base font-semibold">Liên kết tham khảo</Label>
                  <Input
                    id="linkRef"
                    {...register('linkRef')}
                    placeholder="https://example.com"
                    className="mt-2 h-12 text-base border-2 focus:border-blue-500"
                  />
                  {errors.linkRef && <p className="text-red-500 text-sm mt-1">{errors.linkRef.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="eventCategoryId" className="text-base font-semibold">Danh mục sự kiện *</Label>
                    <Select onValueChange={(value) => setValue('eventCategoryId', value)}>
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
                    <Select onValueChange={(value) => setValue('ticketType', value)} defaultValue="1">
                      <SelectTrigger className="mt-2 h-12 text-base border-2">
                        <SelectValue placeholder="Chọn loại vé" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Miễn phí</SelectItem>
                        <SelectItem value="2">Có phí</SelectItem>
                        <SelectItem value="3">Quyên góp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time & Location */}
            <Card className="border-l-4 border-l-green-500 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Thời gian & Địa điểm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startTime" className="text-base font-semibold">Thời gian bắt đầu *</Label>
                    <Input
                      type="datetime-local"
                      id="startTime"
                      {...register('startTime')}
                      className="mt-2 h-12 text-base border-2 focus:border-green-500"
                    />
                    {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="endTime" className="text-base font-semibold">Thời gian kết thúc *</Label>
                    <Input
                      type="datetime-local"
                      id="endTime"
                      {...register('endTime')}
                      className="mt-2 h-12 text-base border-2 focus:border-green-500"
                    />
                    {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="saleStartTime" className="text-base font-semibold">Thời gian bắt đầu bán vé *</Label>
                    <Input
                      type="datetime-local"
                      id="saleStartTime"
                      {...register('saleStartTime')}
                      className="mt-2 h-12 text-base border-2 focus:border-green-500"
                    />
                    {errors.saleStartTime && <p className="text-red-500 text-sm mt-1">{errors.saleStartTime.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="saleEndTime" className="text-base font-semibold">Thời gian kết thúc bán vé *</Label>
                    <Input
                      type="datetime-local"
                      id="saleEndTime"
                      {...register('saleEndTime')}
                      className="mt-2 h-12 text-base border-2 focus:border-green-500"
                    />
                    {errors.saleEndTime && <p className="text-red-500 text-sm mt-1">{errors.saleEndTime.message}</p>}
                  </div>
                </div>

                {/* Add the missing "Sự kiện trực tuyến?" switch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="isOnlineEvent" className="text-base font-semibold">Sự kiện trực tuyến?</Label>
                    <Switch
                      id="isOnlineEvent"
                      checked={watchIsOnline}
                      onCheckedChange={(checked) => setValue('isOnlineEvent', checked)}
                      className="mt-2"
                    />
                  </div>

                  {!watchIsOnline && (
                    <div>
                      <Label htmlFor="locationName" className="text-base font-semibold">Tên địa điểm *</Label>
                      <Input
                        id="locationName"
                        {...register('locationName')}
                        placeholder="Nhập tên địa điểm"
                        className="mt-2 h-12 text-base border-2 focus:border-green-500"
                      />
                      {errors.locationName && <p className="text-red-500 text-sm mt-1">{errors.locationName.message}</p>}
                    </div>
                  )}

                  {!watchIsOnline && (
                    <div>
                      <Label htmlFor="address" className="text-base font-semibold">Địa chỉ *</Label>
                      <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="Nhập địa chỉ"
                        rows={3}
                        className="mt-2 text-base border-2 focus:border-green-500"
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Images */}
            <Card className="border-l-4 border-l-purple-500 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Image className="h-5 w-5 text-white" />
                  </div>
                  Hình ảnh sự kiện
                </CardTitle>
                <CardDescription className="text-base">
                  Tải lên tối đa 5 hình ảnh cho sự kiện
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Image className="h-12 w-12 text-purple-400 mb-4" />
                        <p className="text-lg font-semibold text-purple-600">Chọn hình ảnh</p>
                        <p className="text-gray-500">PNG, JPG, GIF tối đa 5 file</p>
                      </div>
                    </label>
                  </div>
                  
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <TagSelector
              className="shadow-xl"
            />

            {/* Refund Rules */}
            <RefundRuleManager
              className="shadow-xl"
            />

            {/* Tickets - Dynamic Management */}
            <Card className="border-l-4 border-l-orange-500 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Thông tin vé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50/50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-orange-800">Vé #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicketDetail(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Tên vé *</Label>
                          <Input
                            {...register(`ticketDetails.${index}.ticketName`)}
                            placeholder="Ví dụ: Vé VIP"
                            className="mt-1 border-2 focus:border-orange-500"
                          />
                          {errors.ticketDetails?.[index]?.ticketName && <p className="text-red-500 text-sm mt-1">{errors.ticketDetails[index].ticketName.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-semibold">Giá vé</Label>
                            <Input
                              type="number"
                              {...register(`ticketDetails.${index}.ticketPrice`, { valueAsNumber: true })}
                              placeholder="0"
                              min="0"
                              disabled={watchTicketType === '1'}
                              className="mt-1 border-2 focus:border-orange-500"
                            />
                            {errors.ticketDetails?.[index]?.ticketPrice && <p className="text-red-500 text-sm mt-1">{errors.ticketDetails[index].ticketPrice.message}</p>}
                          </div>

                          <div>
                            <Label className="text-sm font-semibold">Số lượng *</Label>
                            <Input
                              type="number"
                              {...register(`ticketDetails.${index}.ticketQuantity`, { valueAsNumber: true })}
                              placeholder="Số lượng"
                              min="1"
                              className="mt-1 border-2 focus:border-orange-500"
                            />
                            {errors.ticketDetails?.[index]?.ticketQuantity && <p className="text-red-500 text-sm mt-1">{errors.ticketDetails[index].ticketQuantity.message}</p>}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold">Mô tả vé</Label>
                          <Textarea
                            {...register(`ticketDetails.${index}.ticketDescription`)}
                            placeholder="Mô tả chi tiết về loại vé này"
                            rows={2}
                            className="mt-1 border-2 focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-semibold">Quy tắc hoàn tiền *</Label>
                          <Select 
                            onValueChange={(value) => setValue(`ticketDetails.${index}.ruleRefundRequestId`, value)}
                            value={watch(`ticketDetails.${index}.ruleRefundRequestId`) || ''}
                          >
                            <SelectTrigger className="mt-1 border-2 focus:border-orange-500 bg-white">
                              <SelectValue placeholder="Chọn quy tắc hoàn tiền" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {selectedRules.map(rule => (
                                <SelectItem key={rule.ruleRefundId} value={rule.ruleRefundId}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{rule.ruleName}</span>
                                    {rule.ruleDescription && (
                                      <span className="text-xs text-gray-500 truncate max-w-xs">
                                        {rule.ruleDescription}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.ticketDetails?.[index]?.ruleRefundRequestId && <p className="text-red-500 text-sm mt-1">{errors.ticketDetails[index].ruleRefundRequestId.message}</p>}
                          {selectedRules.length === 0 && (
                            <p className="text-sm text-orange-600 mt-1">
                              Vui lòng tạo và chọn quy tắc hoàn tiền ở phần trên
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTicketDetail}
                    className="w-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm loại vé
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="border-l-4 border-l-gray-500 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-500/10 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Cài đặt sự kiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex-1">
                    <Label htmlFor="publish" className="font-semibold text-gray-800 text-base">Xuất bản ngay</Label>
                    <p className="text-sm text-gray-600 mt-1">Sự kiện sẽ hiển thị công khai</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={watch('publish')}
                    onCheckedChange={(checked) => setValue('publish', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit and Preview Buttons */}
          <div className="lg:col-span-3 mt-12 flex justify-center space-x-6">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-xl"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye className="h-5 w-5 mr-3" />
                  Xem trước
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-2xl">Xem trước sự kiện</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  {isPreviewOpen && (
                    <EventDetailGuestPage previewData={generatePreviewData(watch())} />
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Đang tạo sự kiện...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  Tạo sự kiện
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;