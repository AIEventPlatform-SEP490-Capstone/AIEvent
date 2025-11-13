import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
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

import { useEvents } from '../../hooks/useEvents';
import TagSelector from '../../components/Event/TagSelector';

// Redux hooks
import { useCategories } from '../../hooks/useCategories';
import { useTags } from '../../hooks/useTags';
import { useApp } from '../../hooks/useApp';

// Import EventStatus enum
import { EventStatus } from '../../constants/eventConstants';

// Import Cloudinary utility
import { uploadImagesToCloudinary } from '../../utils/cloudinary';
// Import date utility
import { convertUTC7ToUTC, convertUTCToUTC7 } from '../../utils/dateUtils';

// Import predefined cities
import { PredefinedCities } from '../../constants/userConstants';

// Validation schema (updated to match CreateEventPage)
const editEventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề sự kiện là bắt buộc').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().min(1, 'Mô tả sự kiện là bắt buộc').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  detailedDescription: z.string().optional(),
  startTime: z.string().min(1, 'Thời gian bắt đầu là bắt buộc'),
  endTime: z.string().min(1, 'Thời gian kết thúc là bắt buộc'),
  locationName: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  linkRef: z.string().optional(),
  eventCategoryId: z.string().optional(),
  ticketPricingType: z.string().min(1, 'Loại vé là bắt buộc'),
  publish: z.boolean().default(false),
  saleStartTime: z.string().min(1, 'Thời gian bắt đầu bán vé là bắt buộc'),
  saleEndTime: z.string().min(1, 'Thời gian kết thúc bán vé là bắt buộc'),
  ticketTypes: z.array(z.object({
    ticketName: z.string().min(1, 'Tên vé là bắt buộc'),
    ticketPrice: z.number().min(0, 'Giá vé không được âm'),
    ticketQuantity: z.number().min(1, 'Số lượng vé phải lớn hơn 0'),
    ticketDescription: z.string().optional(),
    // ruleRefundRequestId: z.string().min(1, 'Quy tắc hoàn tiền là bắt buộc'),
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
  if (!data.district) {
    return false;
  }
  return true;
}, {
  message: 'Quận/Huyện là bắt buộc',
  path: ['district'],
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

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedEvidenceImages, setSelectedEvidenceImageUrls] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [evidenceImagePreview, setEvidenceImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingEvidenceImages, setExistingEvidenceImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [removedEvidenceImages, setRemovedEvidenceImages] = useState([]);
  const [removedTickets, setRemovedTickets] = useState([]);
  // Add state for individual date validation errors
  const [dateTimeErrors, setDateTimeErrors] = useState({
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: ''
  });

  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags: reduxSelectedTags, clearAllSelectedTags, selectTagForForm } = useTags();
  // const { selectedRules, clearSelectedRefundRules, selectRuleForForm } = useRefundRules();
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
      district: '',
      linkRef: '',
      eventCategoryId: '',
      publish: false,
      saleStartTime: '',
      saleEndTime: '',
      ticketPricingType: '1',
      ticketTypes: [
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
    name: 'ticketTypes',
  });

  const watchTicketPricingType = watch('ticketPricingType');

  // Set page title and load event data
  useEffect(() => {
    updatePageTitle('Chỉnh sửa sự kiện');
    if (eventId) {
      loadEventData();
    }
    
    return () => {
      clearAllSelectedTags();
      // clearSelectedRefundRules();
    };
  }, [eventId]);

  // Real-time validation effect
  useEffect(() => {
    // Skip validation if we're processing a blur event
    if (isProcessingBlur.current) {
      isProcessingBlur.current = false;
      return;
    }
    validateDates();
  }, [watch('startTime'), watch('endTime'), watch('saleStartTime'), watch('saleEndTime')]);
  
  // Ref to track if we're processing a blur event to avoid infinite loops
  const isProcessingBlur = useRef(false);
  // Ref to track which field was blurred
  const blurredField = useRef(null);

  // Handle field clearing when they lose focus and are invalid
  const handleDateTimeBlur = (fieldName) => {
    // Prevent infinite loop by checking if we're already processing
    if (isProcessingBlur.current) return;
    
    const fieldValue = watch(fieldName);
    if (!fieldValue) return;
    
    const fieldDate = new Date(fieldValue);
    // Create now date in the same timezone as the input dates (UTC+7)
    // Since datetime inputs are in local time (UTC+7), we need to compare with local time
    const now = new Date();
    
    // Clear field if it's in the past
    if (fieldDate <= now) {
      isProcessingBlur.current = true;
      blurredField.current = fieldName;
      setValue(fieldName, '');
      // Update the specific error state
      setDateTimeErrors(prev => ({
        ...prev,
        [fieldName]: fieldName.includes('start') ? 
          (fieldName.includes('sale') ? 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại' : 'Thời gian bắt đầu phải sau thời điểm hiện tại') :
          (fieldName.includes('sale') ? 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại' : 'Thời gian kết thúc phải sau thời điểm hiện tại')
      }));
    }
  };

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      showLoading();
      
      // Clear previously selected tags
      clearAllSelectedTags();
      
      const event = await getEventById(eventId);
      
      if (event) {
        setEventData(event);
        
        // Populate form with existing data
        const formData = {
          title: event.title || '',
          description: event.description || '',
          detailedDescription: event.detailedDescription || '',
          linkRef: event.linkRef || '',
          startTime: event.startTime ? convertUTCToUTC7(event.startTime).toISOString().slice(0, 16) : '',
          endTime: event.endTime ? convertUTCToUTC7(event.endTime).toISOString().slice(0, 16) : '',
          saleStartTime: event.saleStartTime ? convertUTCToUTC7(event.saleStartTime).toISOString().slice(0, 16) : '',
          saleEndTime: event.saleEndTime ? convertUTCToUTC7(event.saleEndTime).toISOString().slice(0, 16) : '',
          locationName: event.locationName || '',
          address: event.address || '',
          district: event.district || '',
          eventCategoryId: event.eventCategoryId || event.eventCategory?.eventCategoryId || '',
          publish: event.publish || false,
          ticketPricingType: (event.ticketPricingType !== undefined && event.ticketPricingType !== null) ? 
          (event.ticketPricingType === 'Free' || event.ticketPricingType === 1 ? '1' : 
           event.ticketPricingType === 'Paid' || event.ticketPricingType === 2 ? '2' : '1') : '1',
          ticketTypes: event.ticketDetails && event.ticketDetails.length > 0 
            ? event.ticketDetails.map(ticket => ({
                ticketName: ticket.ticketName || '',
                ticketPrice: ticket.ticketPrice || 0,
                ticketQuantity: ticket.ticketQuantity || 1,
                ticketDescription: ticket.ticketDescription || '',
                // ruleRefundRequestId: ticket.ruleRefundRequestId || '',
              }))
            : [
                {
                  ticketName: 'Vé thường',
                  ticketPrice: 0,
                  ticketQuantity: event.totalTickets || 1,
                  ticketDescription: '',
                  // ruleRefundRequestId: '',
                }
              ],
        };
        
        // Reset form with loaded data
        reset(formData);

        // Load existing images
        if (event.imgListEvent && event.imgListEvent.length > 0) {
          setExistingImages(event.imgListEvent);
        }

        // Load existing evidence images
        if (event.imgListEvidences && event.imgListEvidences.length > 0) {
          setExistingEvidenceImages(event.imgListEvidences);
        }

        // Load existing tags if any
        if (event.eventTags && event.eventTags.length > 0) {
          event.eventTags.forEach(eventTag => {
            if (eventTag.tag) {
              selectTagForForm(eventTag.tag);
            } else if (eventTag.tagName || eventTag.nameTag) {
              // Handle case where eventTag is the tag itself
              selectTagForForm(eventTag);
            }
          });
        } else if (event.tags && event.tags.length > 0) {
          // Alternative structure
          event.tags.forEach(tag => {
            // Ensure tag has the correct structure
            if (tag && (tag.tagId || tag.id)) {
              const normalizedTag = {
                tagId: tag.tagId || tag.id,
                tagName: tag.tagName || tag.nameTag || tag.name,
                nameTag: tag.nameTag || tag.tagName || tag.name,
                ...tag
              };
              selectTagForForm(normalizedTag);
            }
          });
        } else {
        }
        // Load existing refund rule if any
        if (event.ticketDetails && event.ticketDetails.length > 0) {
          const firstTicket = event.ticketDetails[0];
          // if (firstTicket.ruleRefundRequestId && firstTicket.refundRule) {
          //   selectRuleForForm(firstTicket.refundRule);
          // }
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
    if (files.length + existingImages.length + selectedImages.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
  };

  // Handle evidence image upload
  const handleEvidenceImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingEvidenceImages.length + selectedEvidenceImages.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh bằng chứng');
      return;
    }

    setSelectedEvidenceImageUrls(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setEvidenceImagePreview(prev => [...prev, ...previews]);
  };

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

  // Remove existing evidence image
  const removeExistingEvidenceImage = (index) => {
    const imageUrl = existingEvidenceImages[index];
    setRemovedEvidenceImages(prev => [...prev, imageUrl]);
    setExistingEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new evidence image
  const removeNewEvidenceImage = (index) => {
    const newImages = selectedEvidenceImages.filter((_, i) => i !== index);
    const newPreviews = evidenceImagePreview.filter((_, i) => i !== index);
    
    setSelectedEvidenceImageUrls(newImages);
    setEvidenceImagePreview(newPreviews);
  };

  // Add ticket type
  const addTicketType = () => {
    append({
      ticketName: '',
      ticketPrice: watchTicketPricingType === '1' ? 0 : '',
      ticketQuantity: 1,
      ticketDescription: '',
      // ruleRefundRequestId: selectedRules.length > 0 ? selectedRules[0].ruleRefundId : '',
    });
  };

  // Remove ticket type
  const removeTicketType = (index) => {
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
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }

    try {
      showLoading();
      setIsSaving(true);

      // Upload new images to Cloudinary and get URLs
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImagesToCloudinary(selectedImages);
      }

      // Upload new evidence images to Cloudinary and get URLs
      let evidenceImageUrls = [];
      if (selectedEvidenceImages.length > 0) {
        evidenceImageUrls = await uploadImagesToCloudinary(selectedEvidenceImages);
      }

      // Calculate total tickets from ticketTypes array
      const totalTickets = formData.ticketTypes.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);

      // Function to convert datetime-local string (local time) to UTC ISO string
      // Fixed to properly convert local time to UTC
      const convertToUTCISOString = (dateString) => {
        if (!dateString) return '';
        
        // Parse the datetime string manually to avoid timezone issues
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Create a UTC date using the parsed components
        // Since the user entered local time (UTC+7), we need to subtract 7 hours to get UTC
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));
        
        // Return proper UTC ISO string
        return utcDate.toISOString();
      };

      // Prepare data to send
      const eventDataToSend = {
        eventId: eventId,
        title: formData.title,
        description: formData.description,
        detailedDescription: formData.detailedDescription || '',
        linkRef: formData.linkRef || '',
        startTime: convertToUTCISOString(formData.startTime),
        endTime: convertToUTCISOString(formData.endTime),
        saleStartTime: convertToUTCISOString(formData.saleStartTime),
        saleEndTime: convertToUTCISOString(formData.saleEndTime),
        locationName: formData.locationName || '',
        address: formData.address || '',
        district: formData.district || '',
        latitude: null,
        longitude: null,
        totalTickets: totalTickets,
        ticketPricingType: formData.ticketPricingType && !isNaN(parseInt(formData.ticketPricingType)) ? parseInt(formData.ticketPricingType) : 1,
        publish: formData.publish || false,
        // Send existing images that are not removed + new images
        images: [...existingImages.filter(img => !removedImages.includes(img)), ...imageUrls],
        // Send existing evidence images that are not removed + new evidence images
        evidenceImages: [...existingEvidenceImages.filter(img => !removedEvidenceImages.includes(img)), ...evidenceImageUrls],
        removeImageUrls: removedImages,
        removeEvidenceImageUrls: removedEvidenceImages,
        eventCategoryId: formData.eventCategoryId,
        // Handle tags correctly
        tags: reduxSelectedTags.map(tag => {
          return { tagId: tag.tagId };
        }),
        ticketTypes: formData.ticketTypes.map((ticket, index) => ({
          // Include the ID if it exists (for existing tickets)
          ...(eventData?.ticketDetails?.[index]?.ticketDetailId && { 
            id: eventData.ticketDetails[index].ticketDetailId 
          }),
          ticketName: ticket.ticketName,
          ticketPrice: parseFloat(ticket.ticketPrice),
          ticketQuantity: parseInt(ticket.ticketQuantity),
          ticketDescription: ticket.ticketDescription || '',
          // ruleRefundRequestId: ticket.ruleRefundRequestId,
        })),
        removeTicketTypeIds: removedTickets,
      };
      // Validate required fields
      const requiredFields = ['title', 'description', 'startTime', 'endTime', 'saleStartTime', 'saleEndTime', 'totalTickets', 'eventCategoryId'];
      if (!eventDataToSend.isOnlineEvent) {
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
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      const saleStartDate = new Date(formData.saleStartTime);
      const saleEndDate = new Date(formData.saleEndTime);
      
      // Create now date in the same timezone as the input dates (UTC+7)
      // Since datetime inputs are in local time (UTC+7), we need to compare with local time
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

      const response = await updateEventAPI(eventDataToSend);
      
      if (response) {
        navigate(`/organizer/event/${eventId}`);
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
    
    // Create now date in the same timezone as the input dates (UTC+7)
    // Since datetime inputs are in local time (UTC+7), we need to compare with local time
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
    setDateTimeErrors(newErrors);
    
    // Return the errors object for backward compatibility
    return Object.values(newErrors).filter(error => error !== '');
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
            Bạn cần đăng nhập với tài khoản Organizer hoặc Admin để chỉnh sửa sự kiện.
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
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-balance">Chỉnh sửa sự kiện</h1>
              <p className="text-muted-foreground">Cập nhật thông tin sự kiện của bạn</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Thông tin cơ bản
                </CardTitle>
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
                    <Select onValueChange={(value) => setValue('eventCategoryId', value)} value={watch('eventCategoryId')}>
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
                    <Label htmlFor="ticketPricingType">Loại vé *</Label>
                    <Select onValueChange={(value) => setValue('ticketPricingType', value)} value={watchTicketPricingType}>
                      <SelectTrigger>
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
                      className={dateTimeErrors.startTime || errors.startTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('startTime')}
                    />
                    {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                    {dateTimeErrors.startTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.startTime}</p>}
                  </div>

                  <div>
                    <Label htmlFor="endTime">Thời gian kết thúc *</Label>
                    <Input
                      type="datetime-local"
                      id="endTime"
                      min={minDateTime}
                      {...register('endTime')}
                      className={dateTimeErrors.endTime || errors.endTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('endTime')}
                    />
                    {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                    {dateTimeErrors.endTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.endTime}</p>}
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
                      className={dateTimeErrors.saleStartTime || errors.saleStartTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('saleStartTime')}
                    />
                    {errors.saleStartTime && <p className="text-red-500 text-sm mt-1">{errors.saleStartTime.message}</p>}
                    {dateTimeErrors.saleStartTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.saleStartTime}</p>}
                  </div>

                  <div>
                    <Label htmlFor="saleEndTime">Thời gian kết thúc bán vé *</Label>
                    <Input
                      type="datetime-local"
                      id="saleEndTime"
                      min={minDateTime}
                      {...register('saleEndTime')}
                      className={dateTimeErrors.saleEndTime || errors.saleEndTime ? "border-red-500" : ""}
                      onBlur={() => handleDateTimeBlur('saleEndTime')}
                    />
                    {errors.saleEndTime && <p className="text-red-500 text-sm mt-1">{errors.saleEndTime.message}</p>}
                    {dateTimeErrors.saleEndTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.saleEndTime}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district">Quận/Huyện *</Label>
                    <Select onValueChange={(value) => setValue('district', value)} value={watch('district')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {PredefinedCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
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
                  Tải lên tối đa 5 hình ảnh cho sự kiện (đã chọn {existingImages.length + selectedImages.length}/5)
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
                  
                  {/* Existing Images Preview */}
                  {existingImages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Hình ảnh hiện tại:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {existingImages.map((img, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={img}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg shadow-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeExistingImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images Preview */}
                  {imagePreview.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Hình ảnh mới:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {imagePreview.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
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
                              onClick={() => removeNewImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
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
                  Tải lên tối đa 5 hình ảnh bằng chứng tổ chức sự kiện (đã chọn {existingEvidenceImages.length + selectedEvidenceImages.length}/5)
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
                  
                  {/* Existing Evidence Images Preview */}
                  {existingEvidenceImages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Hình ảnh bằng chứng hiện tại:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {existingEvidenceImages.map((img, index) => (
                          <div key={`existing-evidence-${index}`} className="relative group">
                            <img
                              src={img}
                              alt={`Existing Evidence ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg shadow-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeExistingEvidenceImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Evidence Images Preview */}
                  {evidenceImagePreview.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Hình ảnh bằng chứng mới:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {evidenceImagePreview.map((preview, index) => (
                          <div key={`new-evidence-${index}`} className="relative group">
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
                              onClick={() => removeNewEvidenceImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
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
            <TagSelector />

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
                            onClick={() => removeTicketType(index)}
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
                            {...register(`ticketTypes.${index}.ticketName`)}
                            placeholder="Ví dụ: Vé VIP"
                          />
                          {errors.ticketTypes?.[index]?.ticketName && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketName.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Giá vé</Label>
                            <Input
                              type="number"
                              {...register(`ticketTypes.${index}.ticketPrice`, { valueAsNumber: true })}
                              placeholder="0"
                              min="0"
                              disabled={watchTicketPricingType === '1'}
                            />
                            {errors.ticketTypes?.[index]?.ticketPrice && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketPrice.message}</p>}
                          </div>

                          <div>
                            <Label className="text-sm">Số lượng *</Label>
                            <Input
                              type="number"
                              {...register(`ticketTypes.${index}.ticketQuantity`, { valueAsNumber: true })}
                              placeholder="Số lượng"
                              min="1"
                            />
                            {errors.ticketTypes?.[index]?.ticketQuantity && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketQuantity.message}</p>}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Mô tả vé</Label>
                          <Textarea
                            {...register(`ticketTypes.${index}.ticketDescription`)}
                            placeholder="Mô tả chi tiết về loại vé này"
                            rows={2}
                          />
                        </div>

                        {/* <div>
                          <Label className="text-sm">Quy tắc hoàn tiền *</Label>
                          <Select 
                            // onValueChange={(value) => setValue(`ticketTypes.${index}.ruleRefundRequestId`, value)}
                            // value={watch(`ticketTypes.${index}.ruleRefundRequestId`) || ''}
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
                          {errors.ticketTypes?.[index]?.ruleRefundRequestId && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ruleRefundRequestId.message}</p>
}
                          {selectedRules.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Vui lòng tạo và chọn quy tắc hoàn tiền ở phần trên
                            </p>
                          )}
                        </div> */}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTicketType}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm loại vé
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Settings */}
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
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;