import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Send
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
  if (!data.locationName) {
    return false;
  }
  return true;
}, {
  message: 'Địa điểm là bắt buộc',
  path: ['locationName'],
}).refine((data) => {
  if (!data.city) {
    return false;
  }
  return true;
}, {
  message: 'Thành phố là bắt buộc',
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

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedEvidenceImages, setSelectedEvidenceImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [evidenceImagePreview, setEvidenceImagePreview] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [clonedEventData, setClonedEventData] = useState(null);
  // Add state for individual date validation errors
  const [dateErrors, setDateErrors] = useState({
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: ''
  });

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
      city: '',
      linkRef: '',
      eventCategoryId: '',
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

  const watchTicketType = watch('ticketType');

  // Set page title and cleanup on mount
  useEffect(() => {
    updatePageTitle('Tạo sự kiện mới');
    
    // Check for cloned event data
    const storedCloneData = localStorage.getItem('cloneEventData');
    if (storedCloneData) {
      try {
        const cloneData = JSON.parse(storedCloneData);
        setClonedEventData(cloneData);
        
        // Populate form with cloned data
        populateFormWithCloneData(cloneData);
        
        // Remove from localStorage after use
        localStorage.removeItem('cloneEventData');
      } catch (error) {
        console.error('Error parsing cloned event data:', error);
      }
    }
    
    return () => {
      clearAllSelectedTags();
      clearSelectedRefundRules();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Populate form with cloned event data
  const populateFormWithCloneData = (cloneData) => {
    // Set basic fields
    setValue('title', `${cloneData.title} (Bản sao)`);
    setValue('description', cloneData.description);
    setValue('detailedDescription', cloneData.detailedDescription || '');
    setValue('linkRef', cloneData.linkRef || '');
    setValue('locationName', cloneData.locationName || '');
    setValue('address', cloneData.address || '');
    setValue('city', cloneData.city || '');
    setValue('eventCategoryId', cloneData.eventCategoryId || '');
    setValue('ticketType', cloneData.ticketType?.toString() || '1');
    
    // Format dates for datetime-local inputs
    if (cloneData.startTime) {
      const startDate = new Date(cloneData.startTime);
      // Add one day to the start date for the clone
      startDate.setDate(startDate.getDate() + 1);
      setValue('startTime', startDate.toISOString().slice(0, 16));
    }
    
    if (cloneData.endTime) {
      const endDate = new Date(cloneData.endTime);
      // Add one day to the end date for the clone
      endDate.setDate(endDate.getDate() + 1);
      setValue('endTime', endDate.toISOString().slice(0, 16));
    }
    
    // Set sale dates (add one day)
    if (cloneData.saleStartTime) {
      const saleStartDate = new Date(cloneData.saleStartTime);
      saleStartDate.setDate(saleStartDate.getDate() + 1);
      setValue('saleStartTime', saleStartDate.toISOString().slice(0, 16));
    }
    
    if (cloneData.saleEndTime) {
      const saleEndDate = new Date(cloneData.saleEndTime);
      saleEndDate.setDate(saleEndDate.getDate() + 1);
      setValue('saleEndTime', saleEndDate.toISOString().slice(0, 16));
    }
    
    // Handle ticket details
    if (cloneData.ticketDetails && cloneData.ticketDetails.length > 0) {
      // Clear existing ticket details
      remove(0);
      
      // Add cloned ticket details
      cloneData.ticketDetails.forEach((ticket, index) => {
        append({
          ticketName: ticket.ticketName,
          ticketPrice: ticket.ticketPrice || 0,
          ticketQuantity: ticket.ticketQuantity || 1,
          ticketDescription: ticket.ticketDescription || '',
          ruleRefundRequestId: ticket.ruleRefundRequestId || '',
        });
      });
    }
  };

  // Real-time validation effect
  useEffect(() => {
    validateDates();
  }, [watch('startTime'), watch('endTime'), watch('saleStartTime'), watch('saleEndTime')]);

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

  // Handle evidence image upload
  const handleEvidenceImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh bằng chứng');
      return;
    }

    setSelectedEvidenceImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setEvidenceImagePreview(previews);
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  // Remove evidence image
  const removeEvidenceImage = (index) => {
    const newImages = selectedEvidenceImages.filter((_, i) => i !== index);
    const newPreviews = evidenceImagePreview.filter((_, i) => i !== index);
    
    setSelectedEvidenceImages(newImages);
    setEvidenceImagePreview(newPreviews);
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
      city: formData.city || '', // Add city field
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      soldQuantity: 0,
      remainingTickets: totalTickets,
      ticketType: parseInt(formData.ticketType) || 1,
      imgListEvent: imgListEvent,
      requireApproval: formData.requireApproval === ConfirmStatus.Approve ? 1 : 
                     formData.requireApproval === ConfirmStatus.Reject ? -1 : 0,
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

    // Filter out empty images
    const validImages = selectedImages.filter(img => img instanceof File);
    const validEvidenceImages = selectedEvidenceImages.filter(img => img instanceof File);
    
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
      locationName: data.locationName || '',
      address: data.address || '',
      city: data.city || '',
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      ticketType: data.ticketType && !isNaN(parseInt(data.ticketType)) ? parseInt(data.ticketType) : 1,
      requireApproval: data.requireApproval,
      publish: data.publish || false, // This will be false for drafts
      images: validImages,
      evidenceImages: validEvidenceImages,
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
        toast.success(data.publish ? '✅ Tạo sự kiện thành công!' : '✅ Lưu nháp sự kiện thành công!');
        clearAllSelectedTags();
        clearSelectedRefundRules();
        navigate(PATH.ORGANIZER_MY_EVENTS);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      const errorData = error.response?.data;
      let errorMessage = data.publish ? 'Có lỗi xảy ra khi tạo sự kiện' : 'Có lỗi xảy ra khi lưu nháp sự kiện';
      
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

  // Real-time date validation
  const validateDates = () => {
    const startTime = watch('startTime');
    const endTime = watch('endTime');
    const saleStartTime = watch('saleStartTime');
    const saleEndTime = watch('saleEndTime');
    
    // Initialize error object
    const newErrors = {
      startTime: '',
      endTime: '',
      saleStartTime: '',
      saleEndTime: ''
    };
    
    const now = new Date();
    
    // Check if any datetime is in the past
    if (startTime) {
      const start = new Date(startTime);
      if (start <= now) {
        newErrors.startTime = 'Thời gian bắt đầu phải sau thời điểm hiện tại';
      }
    }
    
    if (endTime) {
      const end = new Date(endTime);
      if (end <= now) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời điểm hiện tại';
      }
    }
    
    if (saleStartTime) {
      const saleStart = new Date(saleStartTime);
      if (saleStart <= now) {
        newErrors.saleStartTime = 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại';
      }
    }
    
    if (saleEndTime) {
      const saleEnd = new Date(saleEndTime);
      if (saleEnd <= now) {
        newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại';
      }
    }
    
    // Check relationships between dates (only if all relevant fields have values)
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (end <= start) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    
    if (saleStartTime && saleEndTime && startTime) {
      const start = new Date(startTime);
      const saleStart = new Date(saleStartTime);
      const saleEnd = new Date(saleEndTime);
      
      if (saleStart >= start) {
        newErrors.saleStartTime = 'Thời gian bắt đầu bán vé phải trước thời gian bắt đầu sự kiện';
      }
      
      if (saleEnd <= saleStart) {
        newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải sau thời gian bắt đầu bán vé';
      }
      
      if (saleEnd >= start) {
        newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải trước thời gian bắt đầu sự kiện';
      }
    }
    
    // Update state with new errors
    setDateErrors(newErrors);
    
    // Return the errors object for backward compatibility
    return Object.values(newErrors).filter(error => error !== '');
  };

  // Real-time validation effect
  useEffect(() => {
    validateDates();
  }, [watch('startTime'), watch('endTime'), watch('saleStartTime'), watch('saleEndTime')]);
  
  // Ref to track if we're processing a blur event to avoid infinite loops
  const isProcessingBlur = useRef(false);

  // Handle field clearing when they lose focus and are invalid
  const handleDateTimeBlur = (fieldName) => {
    // Prevent infinite loop by checking if we're already processing
    if (isProcessingBlur.current) return;
    
    const fieldValue = watch(fieldName);
    if (!fieldValue) return;
    
    const fieldDate = new Date(fieldValue);
    const now = new Date();
    
    // Clear field if it's in the past
    if (fieldDate <= now) {
      isProcessingBlur.current = true;
      setValue(fieldName, '');
      // Update the specific error state
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: fieldName.includes('start') ? 
          (fieldName.includes('sale') ? 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại' : 'Thời gian bắt đầu phải sau thời điểm hiện tại') :
          (fieldName.includes('sale') ? 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại' : 'Thời gian kết thúc phải sau thời điểm hiện tại')
      }));
      
      // Reset the flag after a short delay to allow normal operation
      setTimeout(() => {
        isProcessingBlur.current = false;
      }, 0);
    }
  };
  
  // Get minimum datetime for input fields (current time)
  const getMinDateTime = () => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const minDateTime = getMinDateTime();

  if (!user || !['Organizer', 'Admin', 'Manager'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900">Truy cập bị từ chối</h3>
          <p className="mt-2 text-sm text-center text-gray-500">
            Bạn cần đăng nhập với tài khoản Organizer hoặc Admin để tạo sự kiện.
          </p>
          <div className="mt-6">
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth/login")}
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">Tạo sự kiện mới</h1>
            <p className="text-muted-foreground">Tạo và quản lý sự kiện của bạn</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isSubmitting || isLoading}>
                  <Eye className="w-4 h-4 mr-2" />
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
              variant="outline" 
              onClick={() => handleSubmit((data) => onSubmit({...data, publish: false}))()}
              disabled={isSubmitting || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting || isLoading ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            
            <Button 
              onClick={() => handleSubmit((data) => onSubmit({...data, publish: true}))()}
              disabled={isSubmitting || isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting || isLoading ? "Đang xuất bản..." : "Xuất bản"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Thông tin cơ bản về sự kiện của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Tên sự kiện *</Label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề sự kiện"
                    {...register('title')}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Mô tả ngắn *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả ngắn gọn về sự kiện"
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <Label htmlFor="detailedDescription">Mô tả chi tiết</Label>
                  <Textarea
                    id="detailedDescription"
                    placeholder="Mô tả chi tiết về sự kiện..."
                    rows={5}
                    {...register('detailedDescription')}
                  />
                </div>

                <div>
                  <Label htmlFor="linkRef">Liên kết tham khảo</Label>
                  <Input
                    id="linkRef"
                    placeholder="https://example.com"
                    {...register('linkRef')}
                  />
                  {errors.linkRef && <p className="text-red-500 text-sm mt-1">{errors.linkRef.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventCategoryId">Danh mục sự kiện *</Label>
                    <Select onValueChange={(value) => setValue('eventCategoryId', value)}>
                      <SelectTrigger>
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
                    <Label htmlFor="ticketType">Loại vé *</Label>
                    <Select onValueChange={(value) => setValue('ticketType', value)} defaultValue="1">
                      <SelectTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  Thời gian & Địa điểm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Thời gian bắt đầu *</Label>
                    <Input
                      type="datetime-local"
                      id="startTime"
                      min={minDateTime}
                      {...register('startTime')}
                      className={dateErrors.startTime || errors.startTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('startTime')}
                    />
                    {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                    {dateErrors.startTime && <p className="text-red-500 text-sm mt-1">{dateErrors.startTime}</p>}
                  </div>

                  <div>
                    <Label htmlFor="endTime">Thời gian kết thúc *</Label>
                    <Input
                      type="datetime-local"
                      id="endTime"
                      min={minDateTime}
                      {...register('endTime')}
                      className={dateErrors.endTime || errors.endTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('endTime')}
                    />
                    {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                    {dateErrors.endTime && <p className="text-red-500 text-sm mt-1">{dateErrors.endTime}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleStartTime">Thời gian bắt đầu bán vé *</Label>
                    <Input
                      type="datetime-local"
                      id="saleStartTime"
                      min={minDateTime}
                      {...register('saleStartTime')}
                      className={dateErrors.saleStartTime || errors.saleStartTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('saleStartTime')}
                    />
                    {errors.saleStartTime && <p className="text-red-500 text-sm mt-1">{errors.saleStartTime.message}</p>}
                    {dateErrors.saleStartTime && <p className="text-red-500 text-sm mt-1">{dateErrors.saleStartTime}</p>}
                  </div>

                  <div>
                    <Label htmlFor="saleEndTime">Thời gian kết thúc bán vé *</Label>
                    <Input
                      type="datetime-local"
                      id="saleEndTime"
                      min={minDateTime}
                      {...register('saleEndTime')}
                      className={dateErrors.saleEndTime || errors.saleEndTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('saleEndTime')}
                    />
                    {errors.saleEndTime && <p className="text-red-500 text-sm mt-1">{errors.saleEndTime.message}</p>}
                    {dateErrors.saleEndTime && <p className="text-red-500 text-sm mt-1">{dateErrors.saleEndTime}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Thành phố</Label>
                    <Input
                      id="city"
                      placeholder="Nhập thành phố"
                      {...register('city')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="locationName">Tên địa điểm *</Label>
                    <Input
                      id="locationName"
                      placeholder="Nhập tên địa điểm"
                      {...register('locationName')}
                    />
                    {errors.locationName && <p className="text-red-500 text-sm mt-1">{errors.locationName.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Địa chỉ *</Label>
                    <Textarea
                      id="address"
                      placeholder="Nhập địa chỉ"
                      rows={3}
                      {...register('address')}
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                  </div>
                </div>

                {/* Display real-time date validation errors */}
                {/* {dateErrors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Lỗi thời gian:</h4>
                    <ul className="list-disc list-inside text-red-600">
                      {dateErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                  Hình ảnh sự kiện
                </CardTitle>
                <CardDescription>
                  Tải lên tối đa 5 hình ảnh cho sự kiện
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
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
                        <Image className="h-8 w-8 text-purple-400 mb-2" />
                        <p className="text-sm font-semibold text-purple-600">Chọn hình ảnh</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5 file</p>
                      </div>
                    </label>
                  </div>
                  
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evidence Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                  Hình ảnh bằng chứng tổ chức
                </CardTitle>
                <CardDescription>
                  Tải lên tối đa 5 hình ảnh bằng chứng tổ chức sự kiện
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleEvidenceImageChange}
                      className="hidden"
                      id="evidence-image-upload"
                    />
                    <label htmlFor="evidence-image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Image className="h-8 w-8 text-indigo-400 mb-2" />
                        <p className="text-sm font-semibold text-indigo-600">Chọn hình ảnh bằng chứng</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5 file</p>
                      </div>
                    </label>
                  </div>
                  
                  {evidenceImagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {evidenceImagePreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Evidence Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeEvidenceImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
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
            <TagSelector />

            {/* Refund Rules */}
            <RefundRuleManager />

            {/* Tickets - Dynamic Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Thông tin vé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-3">
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

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Tên vé *</Label>
                          <Input
                            {...register(`ticketDetails.${index}.ticketName`)}
                            placeholder="Ví dụ: Vé VIP"
                          />
                          {errors.ticketDetails?.[index]?.ticketName && <p className="text-red-500 text-xs mt-1">{errors.ticketDetails[index].ticketName.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Giá vé</Label>
                            <Input
                              type="number"
                              {...register(`ticketDetails.${index}.ticketPrice`, { valueAsNumber: true })}
                              placeholder="0"
                              min="0"
                              disabled={watchTicketType === '1'}
                            />
                            {errors.ticketDetails?.[index]?.ticketPrice && <p className="text-red-500 text-xs mt-1">{errors.ticketDetails[index].ticketPrice.message}</p>}
                          </div>

                          <div>
                            <Label className="text-sm">Số lượng *</Label>
                            <Input
                              type="number"
                              {...register(`ticketDetails.${index}.ticketQuantity`, { valueAsNumber: true })}
                              placeholder="Số lượng"
                              min="1"
                            />
                            {errors.ticketDetails?.[index]?.ticketQuantity && <p className="text-red-500 text-xs mt-1">{errors.ticketDetails[index].ticketQuantity.message}</p>}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Mô tả vé</Label>
                          <Textarea
                            {...register(`ticketDetails.${index}.ticketDescription`)}
                            placeholder="Mô tả chi tiết về loại vé này"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Quy tắc hoàn tiền *</Label>
                          <Select 
                            onValueChange={(value) => setValue(`ticketDetails.${index}.ruleRefundRequestId`, value)}
                            value={watch(`ticketDetails.${index}.ruleRefundRequestId`) || ''}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Chọn quy tắc hoàn tiền" />
                            </SelectTrigger>
                            <SelectContent>
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
                          {errors.ticketDetails?.[index]?.ruleRefundRequestId && <p className="text-red-500 text-xs mt-1">{errors.ticketDetails[index].ruleRefundRequestId.message}</p>}
                          {selectedRules.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
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
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm loại vé
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  Cài đặt sự kiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex-1">
                    <Label htmlFor="publish" className="font-medium">Xuất bản ngay</Label>
                    <p className="text-xs text-gray-600 mt-1">Sự kiện sẽ hiển thị công khai</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={watch('publish')}
                    onCheckedChange={(checked) => setValue('publish', checked)}
                  />
                </div>
              </CardContent>
            </Card> */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;