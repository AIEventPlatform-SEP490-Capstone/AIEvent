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

import { useEvents } from '../../hooks/useEvents';
import TagSelector from '../../components/Event/TagSelector';
import RefundRuleManager from '../../components/Event/RefundRuleManager';

// Redux hooks
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { useRefundRules } from '../../hooks/useRefundRules';
import { useApp } from '../../hooks/useApp';

// Import ConfirmStatus enum
import { ConfirmStatus } from '../../constants/eventConstants';

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
  city: z.string().optional(),
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
  if (!data.isOnlineEvent && !data.city) {
    return false;
  }
  return true;
}, {
  message: 'Thành phố là bắt buộc cho sự kiện offline',
  path: ['city'],
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

const ManagerEditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags: reduxSelectedTags, clearAllSelectedTags, selectTagForForm } = useTags();
  const { selectedRules, clearSelectedRefundRules, selectRuleForForm } = useRefundRules();
  const { showLoading, hideLoading, updatePageTitle } = useApp();
  const { getEventById, updateEvent: updateEventAPI, loading: eventLoading } = useEvents();

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
      city: '', // Add city field
      linkRef: '',
      eventCategoryId: '',
      isOnlineEvent: false,
      requireApproval: ConfirmStatus.NeedConfirm,
      publish: false,
      saleStartTime: '',
      saleEndTime: '',
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
      
      const event = await getEventById(eventId);
      
      if (event) {
        setEventData(event);
        
        // Convert backend enum value to frontend enum
        let requireApprovalValue = ConfirmStatus.NeedConfirm;
        if (event.requireApproval === 'Approve') {
          requireApprovalValue = ConfirmStatus.Approve;
        } else if (event.requireApproval === 'Reject') {
          requireApprovalValue = ConfirmStatus.Reject;
        } else if (event.requireApproval === 'NeedConfirm') {
          requireApprovalValue = ConfirmStatus.NeedConfirm;
        }
        
        // Populate form with existing data
        const formData = {
          title: event.title || '',
          description: event.description || '',
          detailedDescription: event.detailedDescription || '',
          linkRef: event.linkRef || '',
          startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
          endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
          saleStartTime: event.saleStartTime ? new Date(event.saleStartTime).toISOString().slice(0, 16) : '',
          saleEndTime: event.saleEndTime ? new Date(event.saleEndTime).toISOString().slice(0, 16) : '',
          locationName: event.locationName || '',
          address: event.address || '',
          city: event.city || '',
          eventCategoryId: event.eventCategoryId || event.eventCategory?.eventCategoryId || '',
          isOnlineEvent: event.isOnlineEvent || false,
          requireApproval: requireApprovalValue,
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
        } else if (event.tags && event.tags.length > 0) {
          // Alternative structure
          event.tags.forEach(tag => {
            selectTagForForm(tag);
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
        navigate(PATH.MANAGER_MY_EVENTS);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Không thể tải thông tin sự kiện');
      navigate(PATH.MANAGER_MY_EVENTS);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length + selectedImages.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
  };

  const [removedImages, setRemovedImages] = useState([]); // Track removed images
  const [removedTickets, setRemovedTickets] = useState([]); // Track removed tickets

  // Remove existing image
  const removeExistingImage = (index) => {
    const imageUrl = existingImages[index];
    setRemovedImages(prev => [...prev, imageUrl]);
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
      ruleRefundRequestId: selectedRules.length > 0 ? selectedRules[0].ruleRefundId : '',
    });
  };

  // Remove ticket detail
  const removeTicketDetail = (index) => {
    // If this is an existing ticket (has an ID), add it to removed tickets
    if (eventData && eventData.ticketDetails && eventData.ticketDetails[index] && eventData.ticketDetails[index].ticketDetailId) {
      setRemovedTickets(prev => [...prev, eventData.ticketDetails[index].ticketDetailId]);
    }
    
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error('Phải có ít nhất một loại vé');
    }
  };

  // Handle form submission
  const onSubmit = async (formData) => {
    // Check if user has manager role
    if (!user || !['Manager'].includes(user.role)) {
      toast.error('Bạn không có quyền chỉnh sửa sự kiện');
      return;
    }

    // Validate refund rule selection for each ticket
    const hasEmptyRefundRule = formData.ticketDetails.some(ticket => !ticket.ruleRefundRequestId);
    if (hasEmptyRefundRule) {
      toast.error('Vui lòng chọn quy tắc hoàn tiền cho tất cả các loại vé');
      return;
    }

    // Validate category selection
    if (!formData.eventCategoryId) {
      toast.error('Vui lòng chọn danh mục sự kiện');
      return;
    }

    // Calculate total tickets from ticketDetails array
    const totalTickets = formData.ticketDetails.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);

    // Prepare tag operations
    let addTagIds = [];
    let removeTagIds = [];
    
    // If we have existing event data, calculate tag differences
    if (eventData && eventData.eventTags) {
      // Tags to add (in selected tags but not in existing tags)
      addTagIds = reduxSelectedTags
        .filter(selectedTag => 
          !eventData.eventTags.some(existingTag => 
            existingTag.tag?.tagId === selectedTag.tagId
          )
        )
        .map(tag => tag.tagId);
      
      // Tags to remove (in existing tags but not in selected tags)
      removeTagIds = eventData.eventTags
        .filter(existingTag => 
          !reduxSelectedTags.some(selectedTag => 
            selectedTag.tagId === existingTag.tag?.tagId
          )
        )
        .map(et => et.tag?.tagId)
        .filter(id => id); // Remove any undefined/null values
    } else {
      // If no existing event data, add all selected tags
      addTagIds = reduxSelectedTags.map(tag => tag.tagId);
    }

    const eventDataToSend = {
      eventId: eventId,
      title: formData.title,
      description: formData.description,
      detailedDescription: formData.detailedDescription || '',
      linkRef: formData.linkRef || '',
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      saleStartTime: new Date(formData.saleStartTime).toISOString(),
      saleEndTime: new Date(formData.saleEndTime).toISOString(),
      isOnlineEvent: formData.isOnlineEvent || false,
      locationName: formData.locationName || '',
      address: formData.address || '',
      city: formData.city || '',
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      ticketType: formData.ticketType && !isNaN(parseInt(formData.ticketType)) ? parseInt(formData.ticketType) : 1,
      requireApproval: formData.requireApproval,
      publish: formData.publish || false,
      images: selectedImages, // Only new images
      removeImageUrls: removedImages, // Images to remove
      eventCategoryId: formData.eventCategoryId,
      // Handle tags correctly
      addTagIds: addTagIds,
      removeTagIds: removeTagIds,
      ticketDetails: formData.ticketDetails.map((ticket, index) => ({
        // Include the ID if it exists (for existing tickets)
        ...(eventData?.ticketDetails?.[index]?.ticketDetailId && { 
          id: eventData.ticketDetails[index].ticketDetailId 
        }),
        ticketName: ticket.ticketName,
        ticketPrice: parseFloat(ticket.ticketPrice),
        ticketQuantity: parseInt(ticket.ticketQuantity),
        ticketDescription: ticket.ticketDescription || '',
        ruleRefundRequestId: ticket.ruleRefundRequestId,
      })),
      removeTicketDetailIds: removedTickets, // Tickets to remove
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'startTime', 'endTime', 'saleStartTime', 'saleEndTime', 'totalTickets', 'eventCategoryId'];
    if (!eventData.isOnlineEvent) {
      requiredFields.push('locationName', 'address');
    }
    
    const missingFields = requiredFields.filter(field => !eventDataToSend[field]);
    if (missingFields.length > 0) {
      toast.error(`Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`);
      return;
    }
    
    if (eventDataToSend.totalTickets <= 0) {
      toast.error('Tổng số vé phải lớn hơn 0');
      return;
    }

    // Validate dates
    const startDate = new Date(eventDataToSend.startTime);
    const endDate = new Date(eventDataToSend.endTime);
    const saleStartDate = new Date(eventDataToSend.saleStartTime);
    const saleEndDate = new Date(eventDataToSend.saleEndTime);
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
      setIsSaving(true);
      
      const response = await updateEventAPI(eventDataToSend);
      
      if (response) {
        toast.success('✅ Cập nhật sự kiện thành công!');
        navigate(`/manager/event/${eventId}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sự kiện';
      
      if (errorData?.errors === 'Invalid Organizer ID in token' || error.response?.status === 401) {
        errorMessage = 'Tài khoản manager không hợp lệ hoặc phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
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
      navigate(`/manager/event/${eventId}`);
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
                    <Label htmlFor="isOnlineEvent" className="text-base font-semibold">Sự kiện trực tuyến?</Label>
                    <Switch
                      id="isOnlineEvent"
                      checked={watchIsOnline}
                      onCheckedChange={(checked) => setValue('isOnlineEvent', checked)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-base font-semibold">Thành phố</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Nhập thành phố"
                      className="mt-2 h-12 text-base border-2 focus:border-green-500"
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
                  Tải lên tối đa 5 hình ảnh cho sự kiện (đã chọn {existingImages.length + selectedImages.length}/5)
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
                  
                  {/* Existing Images Preview */}
                  {existingImages.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Hình ảnh hiện tại:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {existingImages.map((img, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={img}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg shadow-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeExistingImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images Preview */}
                  {imagePreview.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Hình ảnh mới:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagePreview.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
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
                              onClick={() => removeNewImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex-1">
                    <Label htmlFor="requireApproval" className="font-semibold text-gray-800 text-base">Yêu cầu phê duyệt</Label>
                    <p className="text-sm text-gray-600 mt-1">Người tham gia cần được phê duyệt trước</p>
                  </div>
                  <Switch
                    id="requireApproval"
                    checked={watch('requireApproval')}
                    onCheckedChange={(checked) => setValue('requireApproval', checked)}
                  />
                </div>

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
        </form>
      </div>
    </div>
  );
};

export default ManagerEditEventPage;