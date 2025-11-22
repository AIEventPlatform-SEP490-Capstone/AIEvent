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
  Send,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import DateTimePicker from '../../components/ui/date-time-picker';

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

// Import the EventDetailGuestPage component for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';

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

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', icon: '📋' },
  { id: 2, title: 'Thời gian & Địa điểm', icon: '📍' },
  { id: 3, title: 'Hình ảnh', icon: '🖼️' },
  { id: 4, title: 'Vé', icon: '🎫' },
];

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
  // Add state to track original tags
  const [originalTagIds, setOriginalTagIds] = useState([]);
  // Add state for individual date validation errors
  const [dateTimeErrors, setDateTimeErrors] = useState({
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: ''
  });
  // Add state for current step
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { selectedTags: reduxSelectedTags, clearAllSelectedTags, selectTagForForm } = useTags();
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
        let loadedTagIds = [];
        if (event.eventTags && event.eventTags.length > 0) {
          event.eventTags.forEach(eventTag => {
            if (eventTag.tag) {
              selectTagForForm(eventTag.tag);
              loadedTagIds.push(eventTag.tag.tagId);
            } else if (eventTag.tagName || eventTag.nameTag) {
              // Handle case where eventTag is the tag itself
              selectTagForForm(eventTag);
              loadedTagIds.push(eventTag.tagId || eventTag.id);
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
              loadedTagIds.push(normalizedTag.tagId);
            }
          });
        } else {
        }
        
        // Store original tag IDs for comparison during update
        setOriginalTagIds(loadedTagIds);

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
      ticketPrice: watchTicketPricingType === '1' ? 0 : 0,
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

  // Generate preview data from form values
  const generatePreviewData = (formData) => {
    // Get category name from selected category ID
    const selectedCategory = categories.find(cat => cat.eventCategoryId === formData.eventCategoryId);
    
    // Use only selected tags, not all available tags
    const eventTags = reduxSelectedTags.map(tag => ({
      tagId: tag.tagId,
      tagName: tag.tagName || tag.nameTag
    }));
    
    // Format ticket types with refund rule names
    const ticketTypes = formData.ticketTypes.map(ticket => {
      return {
        ...ticket,
        ticketPrice: parseFloat(ticket.ticketPrice) || 0,
        ticketQuantity: parseInt(ticket.ticketQuantity) || 0,
        soldQuantity: 0, // Default for preview
        remainingQuantity: parseInt(ticket.ticketQuantity) || 0, // Default for preview
        // ruleRefundRequestName: refundRule ? refundRule.ruleName : ''
      };
    });
    
    // Calculate total tickets
    const totalTickets = ticketTypes.reduce((sum, ticket) => sum + (parseInt(ticket.ticketQuantity) || 0), 0);
    
    // Format image previews
    const imgListEvent = [...existingImages, ...imagePreview];
    
    // Create preview event data
    const previewData = {
      eventId: eventId || 'preview-event-id',
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
      district: formData.district || '', // Add district field
      latitude: null,
      longitude: null,
      totalTickets: totalTickets,
      soldQuantity: 0,
      remainingTickets: totalTickets,
      ticketPricingType: parseInt(formData.ticketPricingType) || 1,
      imgListEvent: imgListEvent,
      requireApproval: formData.requireApproval === EventStatus.Approve ? 1 : 
                     formData.requireApproval === EventStatus.Reject ? -1 : 0,
      eventCategoryName: selectedCategory ? selectedCategory.eventCategoryName : '',
      eventTags: eventTags, // Only use selected tags
      ticketTypes: ticketTypes,
      organizerEvent: {
        organizerId: user?.id || 'preview-organizer-id',
        companyName: user?.fullName || 'Nhà tổ chức mẫu',
        companyDescription: 'Mô tả nhà tổ chức mẫu',
        imgCompany: null
      }
    };
    
    return previewData;
  };

  // Calculate added and removed tag IDs for update
  const calculateTagChanges = () => {
    const selectedTagIds = reduxSelectedTags.map(tag => tag.tagId);
    
    // Find added tags (in selected but not in original)
    const addTagIds = selectedTagIds.filter(id => !originalTagIds.includes(id));
    
    // Find removed tags (in original but not in selected)
    const removeTagIds = originalTagIds.filter(id => !selectedTagIds.includes(id));
    
    return { addTagIds, removeTagIds };
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

      // Calculate tag changes
      const { addTagIds, removeTagIds } = calculateTagChanges();

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
        latitude: 0,
        longitude: 0,
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
        // Handle tags correctly for update
        addTagIds: addTagIds,
        removeTagIds: removeTagIds,
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

  // Check if a step is complete
  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return watch('title') && watch('description') && watch('eventCategoryId');
      case 2:
        return watch('startTime') && watch('endTime') && watch('district') && watch('locationName') && watch('address');
      case 3:
        return (existingImages.length + imagePreview.length) > 0 && (existingEvidenceImages.length + evidenceImagePreview.length) > 0;
      case 4:
        const ticketTypes = watch('ticketTypes');
        return ticketTypes && ticketTypes.length > 0 && ticketTypes.some(t => t.ticketName && t.ticketQuantity > 0);
      default:
        return false;
    }
  };

  // Check if we can proceed to the next step
  const canProceedToNextStep = isStepComplete(currentStep);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Chỉnh sửa sự kiện</h1>
          <p className="text-muted-foreground">Cập nhật thông tin sự kiện của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Indicator - Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
                  Tiến độ
                </h3>
                <div className="space-y-4">
                  {STEPS.map((step, index) => (
                    <div key={step.id}>
                      <button
                        onClick={() => isStepComplete(step.id - 1) || step.id === currentStep || index === 0 ? setCurrentStep(step.id) : null}
                        className="w-full text-left"
                        disabled={!isStepComplete(step.id - 1) && step.id !== currentStep && index !== 0}
                      >
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            currentStep === step.id
                              ? 'bg-primary text-primary-foreground'
                              : isStepComplete(step.id)
                              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="text-lg">{step.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{step.title}</div>
                          </div>
                          {isStepComplete(step.id) && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`h-6 w-0.5 mx-6 my-1 ${
                            isStepComplete(step.id) ? 'bg-green-500' : 'bg-border'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{currentStep}</span> của{' '}
                    <span className="font-semibold text-foreground">{STEPS.length}</span> bước
                  </p>
                  <div className="w-full bg-border rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border shadow-lg p-6 lg:p-8">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Thông tin cơ bản</h2>
                      <p className="text-muted-foreground">
                        Bắt đầu với những thông tin cơ bản về sự kiện của bạn
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                          Tên sự kiện *
                        </Label>
                        <Input
                          id="title"
                          placeholder="Nhập tiêu đề sự kiện"
                          {...register('title')}
                          className="h-11"
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="eventCategoryId" className="text-base font-semibold mb-2 block">
                          Danh mục sự kiện *
                        </Label>
                        <Select onValueChange={(value) => setValue('eventCategoryId', value)} value={watch('eventCategoryId')}>
                          <SelectTrigger className="h-11">
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
                        <Label htmlFor="description" className="text-base font-semibold mb-2 block">
                          Mô tả ngắn *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Mô tả ngắn gọn về sự kiện"
                          rows={3}
                          {...register('description')}
                          className="resize-none"
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="detailedDescription" className="text-base font-semibold mb-2 block">
                          Mô tả chi tiết
                        </Label>
                        <Textarea
                          id="detailedDescription"
                          placeholder="Mô tả chi tiết về sự kiện..."
                          rows={4}
                          {...register('detailedDescription')}
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkRef" className="text-base font-semibold mb-2 block">
                          Liên kết tham khảo
                        </Label>
                        <Input
                          id="linkRef"
                          placeholder="https://example.com"
                          {...register('linkRef')}
                          className="h-11"
                        />
                        {errors.linkRef && <p className="text-red-500 text-sm mt-1">{errors.linkRef.message}</p>}
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">
                          Loại vé *
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { value: '1', label: '🎁 Miễn phí' },
                            { value: '2', label: '💰 Có phí' },
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setValue('ticketPricingType', option.value)}
                              className={`p-4 rounded-lg border-2 transition-all font-medium ${
                                watch('ticketPricingType') === option.value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Time & Location */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Thời gian & Địa điểm</h2>
                      <p className="text-muted-foreground">
                        Xác định khi nào và ở đâu sự kiện sẽ diễn ra
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                          💡 Hãy đảm bảo rằng thời gian bán vé kết thúc trước khi sự kiện bắt đầu
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <DateTimePicker
                            id="startTime"
                            label="Thời gian bắt đầu *"
                            value={watch('startTime')}
                            onChange={(value) => setValue('startTime', value)}
                            min={minDateTime}
                            className={dateTimeErrors.startTime || errors.startTime ? "border-red-500" : ""}
                            onBlur={() => handleDateTimeBlur('startTime')}
                          />
                          {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                          {dateTimeErrors.startTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.startTime}</p>}
                        </div>
                        <div>
                          <DateTimePicker
                            id="endTime"
                            label="Thời gian kết thúc *"
                            value={watch('endTime')}
                            onChange={(value) => setValue('endTime', value)}
                            min={minDateTime}
                            className={dateTimeErrors.endTime || errors.endTime ? "border-red-500" : ""}
                            onBlur={() => handleDateTimeBlur('endTime')}
                          />
                          {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                          {dateTimeErrors.endTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.endTime}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <DateTimePicker
                            id="saleStartTime"
                            label="Bắt đầu bán vé *"
                            value={watch('saleStartTime')}
                            onChange={(value) => setValue('saleStartTime', value)}
                            min={minDateTime}
                            className={dateTimeErrors.saleStartTime || errors.saleStartTime ? "border-red-500" : ""}
                            onBlur={() => handleDateTimeBlur('saleStartTime')}
                          />
                          {errors.saleStartTime && <p className="text-red-500 text-sm mt-1">{errors.saleStartTime.message}</p>}
                          {dateTimeErrors.saleStartTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.saleStartTime}</p>}
                        </div>
                        <div>
                          <DateTimePicker
                            id="saleEndTime"
                            label="Kết thúc bán vé *"
                            value={watch('saleEndTime')}
                            onChange={(value) => setValue('saleEndTime', value)}
                            min={minDateTime}
                            className={dateTimeErrors.saleEndTime || errors.saleEndTime ? "border-red-500" : ""}
                            onBlur={() => handleDateTimeBlur('saleEndTime')}
                          />
                          {errors.saleEndTime && <p className="text-red-500 text-sm mt-1">{errors.saleEndTime.message}</p>}
                          {dateTimeErrors.saleEndTime && <p className="text-red-500 text-sm mt-1">{dateTimeErrors.saleEndTime}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="district" className="text-base font-semibold mb-2 block">
                            Quận/Huyện *
                          </Label>
                          <Select onValueChange={(value) => setValue('district', value)} value={watch('district')}>
                            <SelectTrigger className="h-11">
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
                          <Label htmlFor="locationName" className="text-base font-semibold mb-2 block">
                            Tên địa điểm *
                          </Label>
                          <Input
                            id="locationName"
                            placeholder="Nhập tên địa điểm"
                            {...register('locationName')}
                            className="h-11"
                          />
                          {errors.locationName && <p className="text-red-500 text-sm mt-1">{errors.locationName.message}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                          Địa chỉ chi tiết *
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Nhập địa chỉ"
                          rows={3}
                          {...register('address')}
                          className="resize-none"
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Hình ảnh sự kiện</h2>
                      <p className="text-muted-foreground">
                        Tải lên những hình ảnh đẹp để quảng bá sự kiện của bạn (tối đa 5)
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Event Images */}
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer bg-primary/5">
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-input"
                          />
                          <label htmlFor="image-input" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-3">
                              <div className="text-5xl">📸</div>
                              <div>
                                <p className="font-semibold text-foreground text-lg">
                                  Chọn hoặc kéo hình ảnh vào đây
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  PNG, JPG, GIF (tối đa 5 file)
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Existing Images Preview */}
                        {existingImages.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-4">
                              Hình ảnh hiện tại ({existingImages.length}/5)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {existingImages.map((img, index) => (
                                <div key={`existing-${index}`} className="relative group rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={img}
                                    alt={`Existing ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeExistingImage(index)}
                                    className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  {index === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-semibold">
                                      Chính
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Images Preview */}
                        {imagePreview.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-4">
                              Hình ảnh mới ({imagePreview.length}/5)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {imagePreview.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeNewImage(index)}
                                    className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Evidence Images */}
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-indigo-50/50 dark:bg-indigo-950/20">
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleEvidenceImageChange}
                            className="hidden"
                            id="evidence-image-input"
                          />
                          <label htmlFor="evidence-image-input" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-3">
                              <div className="text-5xl">📁</div>
                              <div>
                                <p className="font-semibold text-foreground text-lg">
                                  Chọn hình ảnh bằng chứng tổ chức
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  PNG, JPG, GIF (tối đa 5 file)
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Existing Evidence Images Preview */}
                        {existingEvidenceImages.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-4">
                              Hình ảnh bằng chứng hiện tại ({existingEvidenceImages.length}/5)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {existingEvidenceImages.map((img, index) => (
                                <div key={`existing-evidence-${index}`} className="relative group rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={img}
                                    alt={`Existing Evidence ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeExistingEvidenceImage(index)}
                                    className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Evidence Images Preview */}
                        {evidenceImagePreview.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-4">
                              Hình ảnh bằng chứng mới ({evidenceImagePreview.length}/5)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {evidenceImagePreview.map((preview, index) => (
                                <div key={`new-evidence-${index}`} className="relative group rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={preview}
                                    alt={`Evidence Preview ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeNewEvidenceImage(index)}
                                    className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Tickets */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Thông tin vé</h2>
                      <p className="text-muted-foreground">
                        Tạo các loại vé với giá và số lượng khác nhau
                      </p>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="bg-muted/50">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-semibold text-lg">Vé #{index + 1}</h3>
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTicketType(index)}
                                  className="text-destructive hover:bg-destructive/10 p-2 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">
                                  Tên vé *
                                </Label>
                                <Input
                                  placeholder="Ví dụ: Vé VIP, Vé thường"
                                  {...register(`ticketTypes.${index}.ticketName`)}
                                  className="h-10"
                                />
                                {errors.ticketTypes?.[index]?.ticketName && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketName.message}</p>}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-semibold mb-2 block">
                                    Số lượng *
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...register(`ticketTypes.${index}.ticketQuantity`, { valueAsNumber: true })}
                                    className="h-10"
                                  />
                                  {errors.ticketTypes?.[index]?.ticketQuantity && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketQuantity.message}</p>}
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold mb-2 block">
                                    Giá vé {watch('ticketPricingType') === '1' ? '(không dùng)' : '*'}
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    disabled={watch('ticketPricingType') === '1'}
                                    {...register(`ticketTypes.${index}.ticketPrice`, { valueAsNumber: true })}
                                    className="h-10"
                                  />
                                  {errors.ticketTypes?.[index]?.ticketPrice && <p className="text-red-500 text-xs mt-1">{errors.ticketTypes[index].ticketPrice.message}</p>}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-semibold mb-2 block">
                                  Mô tả vé
                                </Label>
                                <Textarea
                                  placeholder="Mô tả chi tiết về loại vé này"
                                  {...register(`ticketTypes.${index}.ticketDescription`)}
                                  rows={2}
                                  className="resize-none"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTicketType}
                        className="w-full h-11"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm loại vé
                      </Button>
                    </div>

                    {/* Tags Section */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Tags</h3>
                      <TagSelector />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-10 pt-8 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 1}
                    className="h-11"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Quay lại
                  </Button>

                  <div className="flex gap-3">
                    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" disabled={isSaving} className="h-11">
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

                    {currentStep === STEPS.length ? (
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11"
                          onClick={() => handleSubmit((data) => onSubmit({...data, publish: false}))()}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Đang lưu..." : "Lưu nháp"}
                        </Button>
                        <Button
                          type="button"
                          className="h-11 bg-primary hover:bg-primary/90"
                          onClick={() => handleSubmit((data) => onSubmit({...data, publish: true}))()}
                          disabled={isSaving}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSaving ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={!canProceedToNextStep}
                        className="h-11 bg-primary hover:bg-primary/90"
                      >
                        Tiếp theo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Tips Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '📝', title: 'Mô tả rõ ràng', desc: 'Viết mô tả chi tiết để thu hút khách tham dự' },
                { icon: '🖼️', title: 'Hình ảnh chất lượng', desc: 'Sử dụng ảnh sắc nét để tăng sự chú ý' },
                { icon: '⏰', title: 'Lên lịch đúng', desc: 'Đảm bảo thời gian và địa điểm chính xác' },
              ].map((tip, index) => (
                <Card key={index} className="bg-card/50">
                  <CardContent className="pt-6">
                    <p className="text-3xl mb-2">{tip.icon}</p>
                    <h4 className="font-semibold mb-1">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground">{tip.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;