import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { z } from "zod";
import { PATH } from "../../routes/path";
import RichTextEditor from '../../components/RichTextEditor';
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
  CheckCircle,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  X,
  Edit3,
  MapPin,
  Tag,
  Ticket,
  Flag,
  CreditCard,
  User,
  Sparkles,
  Pencil,
  Pen,
  Upload,
  AlertCircle
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import DateTimePicker from '../../components/ui/date-time-picker';
import { useEvents } from '../../hooks/useEvents';
import TagSelector from '../../components/Event/TagSelector';
import CategorySelector from '../../components/Event/CategorySelector'; // Add this import

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
// Import geocoding utility
import { geocodeAddress } from '../../utils/geocoding';
import { stripHtml } from '../../utils/stripHtml';// Import predefined cities
import { PredefinedCities } from '../../constants/userConstants';

// Import the EventDetailGuestPage component for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';

// Import EventTimeline component
import { EventTimeline } from '../../components/Event/EventTimeline';
import { useSidebar } from '../../components/ui/sidebar'; // Add this import
// Import number formatting utility
import { formatNumberWithSeparator, removeNumberFormatting } from '../../utils/numberFormat';
// Import datetime validation utility
import datetimeValidation from '../../utils/datetimeValidation';

// Validation schema (updated to match CreateEventPage)
const editEventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề sự kiện là bắt buộc').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().min(1, 'Mô tả sự kiện là bắt buộc').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  detailedDescription: z.string().min(1, 'Mô tả chi tiết sự kiện là bắt buộc').refine(
    (val) => stripHtml(val).length <= 1500, 
    'Mô tả chi tiết không được vượt quá 1500 ký tự'
  ),  startTime: z.string().min(1, 'Thời gian bắt đầu là bắt buộc'),
  endTime: z.string().min(1, 'Thời gian kết thúc là bắt buộc'),
  locationName: z.string().min(1, 'Địa điểm là bắt buộc'),
  address: z.string().min(1, 'Địa chỉ chi tiết là bắt buộc'),
  district: z.string().min(1, 'Quận/Huyện là bắt buộc'),
  linkRef: z.string().optional(),
  eventCategoryId: z.string().min(1, 'Danh mục sự kiện là bắt buộc'), // Make this required
  publish: z.boolean().default(false),
  saleStartTime: z.string().min(1, 'Thời gian bắt đầu bán vé là bắt buộc'),
  saleEndTime: z.string().min(1, 'Thời gian kết thúc bán vé là bắt buộc'),
  ticketTypes: z.array(z.object({
    ticketName: z.string().min(1, 'Tên vé là bắt buộc'),
    ticketPrice: z.number().min(10000, 'Giá vé phải lớn hơn 10.000 VND'),
    ticketQuantity: z.number().min(20, 'Số lượng vé phải từ 20 đến 100.000').max(100000, 'Số lượng vé phải từ 20 đến 100.000'),
    ticketDescription: z.string().optional(),
    // ruleRefundRequestId: z.string().min(1, 'Quy tắc hoàn tiền là bắt buộc'),
  })).min(1, 'Phải có ít nhất một loại vé')}).refine((data) => {
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
}).refine((data) => {
  return data.ticketTypes.some(ticket => ticket.ticketPrice > 10000);
}, {
  message: 'Phải có ít nhất một loại vé có giá > 10.000 VND và số lượng > 20',
  path: ['ticketTypes'],
});

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { state } = useSidebar(); // Add this line to get sidebar state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedEvidenceImages, setSelectedEvidenceImageUrls] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [evidenceImagePreview, setEvidenceImagePreview] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [removedEvidenceImages, setRemovedEvidenceImages] = useState([]);
  const [removedTickets, setRemovedTickets] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Add state to track original tags
  const [originalTagIds, setOriginalTagIds] = useState([]);
  // Track if validation has been triggered (to avoid showing errors before user interaction)
  const [hasValidated, setHasValidated] = useState(false);
  
  // Add state for individual date validation errors
  const [dateErrors, setDateErrors] = useState({
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: ''
  });
  
  // Add state for tag validation errors
  const [tagError, setTagError] = useState('');
  
  // Add state for image validation errors
  const [imageError, setImageError] = useState('');
  const [evidenceImageError, setEvidenceImageError] = useState('');
  
  // Add state for ticket name validation errors
  const [ticketNameError, setTicketNameError] = useState('');
  
  // Add state for ticket validation errors
  const [ticketErrors, setTicketErrors] = useState({});
  
  // Add state for field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    title: '',
    description: '',
    detailedDescription: '',
    locationName: '',
    address: '',
    district: '',
    eventCategoryId: '',
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: ''
  });
  
  // Add state for editing modes
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  
  // Add state for ticket editing
  const [editingTicketIndex, setEditingTicketIndex] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    ticketName: '',
    ticketPrice: 10000,
    ticketQuantity: 1,
    ticketDescription: ''
  });
  
  // Add state for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Add state for selected category
  const [selectedCategory, setSelectedCategory] = useState(null);
  
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
      ticketTypes: [
        {
          ticketName: 'Vé thường',
          ticketPrice: 10000,
          ticketQuantity: 1,
          ticketDescription: '',
          // ruleRefundRequestId: '',
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  const watchEventCategoryId = watch('eventCategoryId');

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
    validateDates();
  }, [watch('startTime'), watch('endTime'), watch('saleStartTime'), watch('saleEndTime')]);

  // Handle image upload - append new images to existing ones (similar to CreateEventPage)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = selectedImages.length + imagePreview.length;
    
    if (totalImages + files.length > 5) {
      toast.error(`Chỉ được tải lên tối đa 5 hình ảnh. Bạn có thể thêm ${5 - totalImages} ảnh nữa.`);
      return;
    }
    
    // Append new files to existing ones
    setSelectedImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
    
    // Clear image error when images are selected
    if (files.length > 0) {
      setImageError('');
    }
  };

  // Handle evidence image upload (similar to CreateEventPage)
  const handleEvidenceImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh bằng chứng');
      return;
    }
    setSelectedEvidenceImageUrls(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setEvidenceImagePreview(prev => [...prev, ...previews]);
    // Clear evidence image error when images are selected
    if (files.length > 0) {
      setEvidenceImageError('');
    }
  };

  // Remove image (similar to CreateEventPage)
  const removeImage = (index) => {
    // If this is an existing image (from existingImages), add it to removedImages
    if (index < imagePreview.length) {
      const imageUrl = imagePreview[index];
      // Check if this image URL exists in the existing images (not a newly uploaded one)
      if (eventData && eventData.imgListEvent && eventData.imgListEvent.includes(imageUrl)) {
        setRemovedImages(prev => [...prev, imageUrl]);
      }
    }
    
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
    
    // Set error if no images left
    if (newImages.length === 0 && newPreviews.length === 0) {
      setImageError('Vui lòng tải lên ít nhất một hình ảnh sự kiện');
    }
  };

  // Remove evidence image (similar to CreateEventPage)
  const removeEvidenceImage = (index) => {
    // If this is an existing evidence image (from existingEvidenceImages), add it to removedEvidenceImages
    if (index < evidenceImagePreview.length) {
      const imageUrl = evidenceImagePreview[index];
      // Check if this image URL exists in the existing evidence images (not a newly uploaded one)
      if (eventData && eventData.imgListEvidences && eventData.imgListEvidences.includes(imageUrl)) {
        setRemovedEvidenceImages(prev => [...prev, imageUrl]);
      }
    }
    
    const newImages = selectedEvidenceImages.filter((_, i) => i !== index);
    const newPreviews = evidenceImagePreview.filter((_, i) => i !== index);
    
    setSelectedEvidenceImageUrls(newImages);
    setEvidenceImagePreview(newPreviews);
    
    // Set error if no evidence images left
    if (newImages.length === 0 && newPreviews.length === 0) {
      setEvidenceImageError('Vui lòng tải lên ít nhất một hình ảnh bằng chứng');
    }
  };

  // Add ticket type
  const addTicketType = () => {
    append({
      ticketName: 'Vé thường',
      ticketPrice: 10000,
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

  // Start editing a ticket
  const startEditingTicket = (index, ticket) => {
    setEditingTicketIndex(index);
    setTicketForm({
      ticketName: ticket.ticketName || '',
      ticketPrice: formatNumberWithSeparator(ticket.ticketPrice || 10000),
      ticketQuantity: formatNumberWithSeparator(ticket.ticketQuantity || 1),
      ticketDescription: ticket.ticketDescription || ''
    });
  };

  // Validate ticket
  const validateTicket = (ticket) => {
    const errors = {};
    
    // Check ticket name
    if (!ticket.ticketName || ticket.ticketName.trim() === '') {
      errors.ticketName = 'Tên vé là bắt buộc';
    }
    
    // Check ticket price
    const ticketPrice = parseFloat(ticket.ticketPrice);
    if (isNaN(ticketPrice) || ticketPrice < 10000) {
      errors.ticketPrice = 'Giá vé phải lớn hơn 10.000 VND';
    }
    
    // Check ticket quantity
    const ticketQuantity = parseInt(ticket.ticketQuantity);
    if (isNaN(ticketQuantity) || ticketQuantity < 20 || ticketQuantity > 100000) {
      errors.ticketQuantity = 'Số lượng vé phải từ 20 đến 100.000';
    }
    
    return errors;
  };

  // Validate basic event information
  const validateBasicInfo = (data) => {
    const errors = {};
    
    if (!data.title || data.title.trim() === '') {
      errors.title = 'Tiêu đề sự kiện là bắt buộc';
    } else if (data.title.length > 200) {
      errors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }
    
    if (!data.description || data.description.trim() === '') {
      errors.description = 'Mô tả sự kiện là bắt buộc';
    } else if (data.description.length > 1000) {
      errors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }
    
    if (!data.detailedDescription || data.detailedDescription.trim() === '') {
      errors.detailedDescription = 'Mô tả chi tiết sự kiện là bắt buộc';
    } else if (stripHtml(data.detailedDescription).length > 1500) {
      errors.detailedDescription = 'Mô tả chi tiết không được vượt quá 1500 ký tự';
    }
    
    if (!data.eventCategoryId || data.eventCategoryId.trim() === '') {
      errors.eventCategoryId = 'Danh mục sự kiện là bắt buộc';
    }
    
    return errors;
  };

  // Validate location information
  const validateLocation = (data) => {
    const errors = {};
    
    if (!data.locationName || data.locationName.trim() === '') {
      errors.locationName = 'Địa điểm là bắt buộc';
    }
    
    if (!data.address || data.address.trim() === '') {
      errors.address = 'Địa chỉ chi tiết là bắt buộc';
    }
    
    if (!data.district || data.district.trim() === '') {
      errors.district = 'Quận/Huyện là bắt buộc';
    }
    
    return errors;
  };

  // Validate datetime information
  const validateDatetimes = (data) => {
    const errors = {};
    
    if (!data.startTime || data.startTime.trim() === '') {
      errors.startTime = 'Thời gian bắt đầu là bắt buộc';
    }
    
    if (!data.endTime || data.endTime.trim() === '') {
      errors.endTime = 'Thời gian kết thúc là bắt buộc';
    }
    
    if (!data.saleStartTime || data.saleStartTime.trim() === '') {
      errors.saleStartTime = 'Thời gian bắt đầu bán vé là bắt buộc';
    }
    
    if (!data.saleEndTime || data.saleEndTime.trim() === '') {
      errors.saleEndTime = 'Thời gian kết thúc bán vé là bắt buộc';
    }
    
    // Check datetime relationships
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      if (start >= end) {
        errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    
    if (data.saleStartTime && data.saleEndTime) {
      const saleStart = new Date(data.saleStartTime);
      const saleEnd = new Date(data.saleEndTime);
      if (saleStart >= saleEnd) {
        errors.saleEndTime = 'Thời gian kết thúc bán vé phải sau thời gian bắt đầu';
      }
    }
    
    if (data.saleStartTime && data.startTime) {
      const saleStart = new Date(data.saleStartTime);
      const eventStart = new Date(data.startTime);
      if (saleStart >= eventStart) {
        errors.saleStartTime = 'Thời gian bắt đầu bán vé phải trước thời gian bắt đầu sự kiện';
      }
    }
    
    return errors;
  };

  // Save edited ticket
  const saveEditingTicket = () => {
    if (editingTicketIndex !== null) {
      // Clean the formatted values before validation
      const cleanPrice = parseFloat(removeNumberFormatting(ticketForm.ticketPrice)) || 10000;
      const cleanQuantity = parseInt(removeNumberFormatting(ticketForm.ticketQuantity)) || 1;
      
      // Create a clean version for validation
      const cleanTicketForm = {
        ...ticketForm,
        ticketPrice: cleanPrice,
        ticketQuantity: cleanQuantity
      };
      
      // Validate the ticket
      const errors = validateTicket(cleanTicketForm);
      
      if (Object.keys(errors).length > 0) {
        // Show errors
        setTicketErrors(prev => ({
          ...prev,
          [editingTicketIndex]: errors
        }));
        return;
      }
      
      // Clear errors if validation passes
      setTicketErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[editingTicketIndex];
        return newErrors;
      });
      
      // Update the ticket in the form with clean values
      setValue(`ticketTypes.${editingTicketIndex}.ticketName`, ticketForm.ticketName);
      setValue(`ticketTypes.${editingTicketIndex}.ticketPrice`, cleanPrice);
      setValue(`ticketTypes.${editingTicketIndex}.ticketQuantity`, cleanQuantity);
      setValue(`ticketTypes.${editingTicketIndex}.ticketDescription`, ticketForm.ticketDescription);
      
      // Reset editing state
      setEditingTicketIndex(null);
      setTicketForm({
        ticketName: '',
        ticketPrice: 10000,
        ticketQuantity: 1,
        ticketDescription: ''
      });
    }
  };

  // Cancel editing ticket
  const cancelEditingTicket = () => {
    setEditingTicketIndex(null);
    setTicketForm({
      ticketName: '',
      ticketPrice: 10000,
      ticketQuantity: 1,
      ticketDescription: ''
    });
  };

  // Handle ticket form change
  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    
    // Format price and quantity with thousand separators
    if (name === 'ticketPrice' || name === 'ticketQuantity') {
      const numValue = removeNumberFormatting(value);
      setTicketForm(prev => ({
        ...prev,
        [name]: numValue ? formatNumberWithSeparator(numValue) : ''
      }));
    } else {
      setTicketForm(prev => ({
        ...prev,
        [name]: value
      }));
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
        ticketPrice: (() => {
          const price = parseFloat(ticket.ticketPrice);
          return isNaN(price) ? 10000 : price;
        })(),
        ticketQuantity: parseInt(ticket.ticketQuantity) || 0,
        soldQuantity: 0, // Default for preview
        remainingQuantity: parseInt(ticket.ticketQuantity) || 0,
      };
    });
    
    // Calculate total tickets
    const totalTickets = ticketTypes.reduce((sum, ticket) => sum + (parseInt(ticket.ticketQuantity) || 0), 0);
    
    // Format image previews
    const imgListEvent = imagePreview.length > 0 ? imagePreview : [];
    
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
      latitude: 0,
      longitude: 0,
      totalTickets: totalTickets,
      soldQuantity: 0,
      remainingTickets: totalTickets,
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
  const onSubmit = async (data, publishStatus = null) => {
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }

    try {
      // Validate all fields at once and show inline errors
      const hasErrors = validateAllFields();
      
      // Additional validation for datetime fields to ensure they're still valid
      const currentValidationTime = new Date();
      const validationSaleStartTime = new Date(data.saleStartTime);
      const validationSaleEndTime = new Date(data.saleEndTime);
      const validationEventStartTime = new Date(data.startTime);
      const validationEventEndTime = new Date(data.endTime);
      
      // Check if any datetime has become invalid since form was filled
      if (validationSaleStartTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          saleStartTime: 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian bắt đầu bán vé phải sau thời điểm hiện tại');
        return;
      }
      
      if (validationSaleEndTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          saleEndTime: 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc bán vé phải sau thời điểm hiện tại');
        return;
      }
      
      if (validationEventStartTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          startTime: 'Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại');
        return;
      }
      
      if (validationEventEndTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          endTime: 'Thời gian kết thúc sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc sự kiện phải sau thời điểm hiện tại');
        return;
      }
      
      if (hasErrors) {
        const errorMessage = publishStatus !== null ? 
          (publishStatus ? 'Vui lòng kiểm tra lại thông tin sự kiện trước khi xuất bản' : 'Vui lòng kiểm tra lại thông tin sự kiện trước khi lưu nháp') : 
          'Vui lòng kiểm tra lại thông tin sự kiện';
        toast.error(errorMessage);
        return;
      }
      
      showLoading('Đang cập nhật sự kiện...');
      setIsSaving(true);
      
      // Geocode the address to get latitude and longitude
      const geocodeResult = await geocodeAddress(data.locationName, data.district, data.address);
      if (!geocodeResult) {
        toast.error('Không thể xác định tọa độ địa chỉ. Vui lòng kiểm tra lại thông tin địa chỉ.');
        hideLoading();
        setIsSaving(false);
        return;
      }

      // Upload images
      let imageUrls = [];
      if (selectedImages.length > 0) {
        // Upload new images
        imageUrls = await uploadImagesToCloudinary(selectedImages);
      } else {
        // If no new images selected, send existing images that are not marked for removal
        imageUrls = imagePreview.filter(img => !removedImages.includes(img));
      }
      
      let evidenceImageUrls = [];
      if (selectedEvidenceImages.length > 0) {
        // Upload new evidence images
        evidenceImageUrls = await uploadImagesToCloudinary(selectedEvidenceImages);
      } else {
        // If no new evidence images selected, send existing evidence images that are not marked for removal
        evidenceImageUrls = evidenceImagePreview.filter(img => !removedEvidenceImages.includes(img));
      }
      
      // Calculate total tickets from ticketTypes array
      const totalTickets = data.ticketTypes.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);
      
      const convertToUTCISOString = (localDateTimeString) => {
        const date = new Date(localDateTimeString);
        return date.toISOString();
      };
      
      // Calculate added and removed tag IDs for update
      const { addTagIds, removeTagIds } = calculateTagChanges();
      
      // Prepare event data for update
      const eventDataToSend = {
        eventId: eventId,
        title: data.title,
        description: data.description,
        detailedDescription: data.detailedDescription || '',
        linkRef: data.linkRef || '',
        startTime: convertToUTCISOString(data.startTime),
        endTime: convertToUTCISOString(data.endTime),
        saleStartTime: convertToUTCISOString(data.saleStartTime),
        saleEndTime: convertToUTCISOString(data.saleEndTime),
        locationName: data.locationName || '',
        address: data.address || '',
        district: data.district || '',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        totalTickets: totalTickets,
        publish: publishStatus !== null ? publishStatus : (data.publish || false),
        // Send Cloudinary URLs instead of File objects
        images: imageUrls,
        // Send Cloudinary URLs instead of File objects
        evidenceImages: evidenceImageUrls,
        removeImageUrls: removedImages,
        removeEvidenceImageUrls: removedEvidenceImages,
        eventCategoryId: data.eventCategoryId,
        // Handle tags correctly for update
        addTagIds: addTagIds,
        removeTagIds: removeTagIds,
        ticketTypes: data.ticketTypes.map((ticket, index) => ({
          // Include the ID if it exists (for existing tickets)
          ...(eventData?.ticketDetails?.[index]?.ticketDetailId && { 
            id: eventData.ticketDetails[index].ticketDetailId 
          }),
          ticketName: ticket.ticketName,
          ticketPrice: (() => {
            const price = parseFloat(ticket.ticketPrice);
            return isNaN(price) ? 10000 : price;
          })(),
          ticketQuantity: parseInt(ticket.ticketQuantity),
          ticketDescription: ticket.ticketDescription || '',
          // ruleRefundRequestId: ticket.ruleRefundRequestId,
        })),
        removeTicketTypeIds: removedTickets,
      };

      const response = await updateEventAPI(eventDataToSend);
      
      if (response) {
        navigate(`/organizer/event/${eventId}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorData = error.response?.data;
      let errorMessage = (publishStatus !== null ? publishStatus : (data.publish || false)) ? 'Có lỗi xảy ra khi cập nhật sự kiện' : 'Có lỗi xảy ra khi lưu nháp sự kiện';
      
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

  // Function to validate all fields at once
  const validateAllFields = () => {
    // Set validation flag to show errors
    setHasValidated(true);
    
    // Validate timeline
    validateDates();
    
    // Validate tags
    if (!reduxSelectedTags || reduxSelectedTags.length === 0) {
      setTagError('Vui lòng chọn ít nhất một tag cho sự kiện');
    } else {
      setTagError('');
    }
    
    // Validate event images
    if (selectedImages.length === 0 && imagePreview.length === 0) {
      setImageError('Vui lòng tải lên ít nhất một hình ảnh sự kiện');
    } else {
      setImageError('');
    }
    
    // Validate evidence images
    if (selectedEvidenceImages.length === 0 && evidenceImagePreview.length === 0) {
      setEvidenceImageError('Vui lòng tải lên ít nhất một hình ảnh bằng chứng');
    } else {
      setEvidenceImageError('');
    }
    
    // Validate ticket names
    const ticketTypes = watch('ticketTypes') || [];
    const hasEmptyTicketNames = ticketTypes.some(ticket => !ticket.ticketName || ticket.ticketName.trim() === '');
    
    if (hasEmptyTicketNames) {
      setTicketNameError('Vui lòng nhập đầy đủ tên cho tất cả các loại vé');
    } else {
      setTicketNameError('');
    }
    
    // Return true if there are validation errors
    const hasTagErrors = !reduxSelectedTags || reduxSelectedTags.length === 0;
    const hasImageErrors = selectedImages.length === 0 && imagePreview.length === 0;
    const hasEvidenceImageErrors = selectedEvidenceImages.length === 0 && evidenceImagePreview.length === 0;
    const hasTimelineErrors = Object.values(dateErrors).some(error => error !== '');
    const hasTicketNameErrors = hasEmptyTicketNames;
    
    // Force re-render of timeline errors by updating state
    
    return hasTagErrors || hasImageErrors || hasEvidenceImageErrors || hasTimelineErrors || hasTicketNameErrors;
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
    const maxDate = datetimeValidation.getMaxDate(now);
    
    // Check if any datetime is in the past or beyond 2 months
    if (startTime) {
      const start = new Date(startTime);
      if (start <= now) {
        newErrors.startTime = 'Thời gian bắt đầu phải sau thời điểm hiện tại';
      } else if (start > maxDate) {
        newErrors.startTime = 'Thời gian bắt đầu không được quá 2 tháng kể từ hiện tại';
      }
    }
    
    if (endTime) {
      const end = new Date(endTime);
      if (end <= now) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời điểm hiện tại';
      } else if (end > maxDate) {
        newErrors.endTime = 'Thời gian kết thúc không được quá 2 tháng kể từ hiện tại';
      }
    }
    
    if (saleStartTime) {
      const saleStart = new Date(saleStartTime);
      if (saleStart <= now) {
        newErrors.saleStartTime = 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại';
      } else if (saleStart > maxDate) {
        newErrors.saleStartTime = 'Thời gian bắt đầu bán vé không được quá 2 tháng kể từ hiện tại';
      }
    }
    
    if (saleEndTime) {
      const saleEnd = new Date(saleEndTime);
      if (saleEnd <= now) {
        newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại';
      } else if (saleEnd > maxDate) {
        newErrors.saleEndTime = 'Thời gian kết thúc bán vé không được quá 2 tháng kể từ hiện tại';
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
  
  // Get maximum datetime for input fields (2 months from now)
  const getMaxDateTime = () => {
    const maxDate = datetimeValidation.getMaxDate();
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    const hours = String(maxDate.getHours()).padStart(2, '0');
    const minutes = String(maxDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const minDateTime = getMinDateTime();
  const maxDateTime = getMaxDateTime();

  // Check if a step is complete
  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return watch('title') && watch('description') && watch('eventCategoryId');
      case 2:
        return watch('startTime') && watch('endTime') && watch('district') && watch('locationName') && watch('address');
      case 3:
        return (imagePreview.length > 0) && (evidenceImagePreview.length > 0);
      case 4:
        const ticketTypes = watch('ticketTypes');
        return ticketTypes && ticketTypes.length > 0 && ticketTypes.some(t => t.ticketName && t.ticketQuantity > 0);
      default:
        return false;
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
          ticketTypes: event.ticketDetails && event.ticketDetails.length > 0 
            ? event.ticketDetails.map(ticket => ({
                ticketName: ticket.ticketName || '',
                ticketPrice: ticket.ticketPrice || 10000,
                ticketQuantity: ticket.ticketQuantity || 1,
                ticketDescription: ticket.ticketDescription || '',
                // ruleRefundRequestId: ticket.ruleRefundRequestId || '',
              }))
            : [
                {
                  ticketName: 'Vé thường',
                  ticketPrice: 10000,
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
          // Filter out null, undefined, empty strings, and invalid URLs
          const validImages = event.imgListEvent.filter(img => 
            img !== null && 
            img !== undefined && 
            img !== '' && 
            typeof img === 'string' && 
            img.trim() !== '' && 
            !img.includes('System.Collections.Generic.List') &&
            img.startsWith('http')
          );
          if (validImages.length > 0) {
            setImagePreview(validImages);
          }
        }

        // Load existing evidence images
        if (event.imgListEvidences && event.imgListEvidences.length > 0) {
          // Filter out null, undefined, empty strings, and invalid URLs
          const validEvidenceImages = event.imgListEvidences.filter(img => 
            img !== null && 
            img !== undefined && 
            img !== '' && 
            typeof img === 'string' && 
            img.trim() !== '' && 
            !img.includes('System.Collections.Generic.List') &&
            img.startsWith('http')
          );
          if (validEvidenceImages.length > 0) {
            setEvidenceImagePreview(validEvidenceImages);
          }
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
        }
        
        // Store original tag IDs for comparison during update
        setOriginalTagIds(loadedTagIds);

        // Set selected category
        if (event.eventCategory) {
          setSelectedCategory(event.eventCategory);
        }
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

  // Start editing a field
  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value || '');
  };

  // Save edited field
  const saveEditing = () => {
    if (editingField) {
      // Validate the field before saving
      let error = '';
      
      if (editingField === 'title') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Tiêu đề sự kiện là bắt buộc';
        } else if (tempValue.length > 200) {
          error = 'Tiêu đề không được vượt quá 200 ký tự';
        }
      } else if (editingField === 'description') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Mô tả sự kiện là bắt buộc';
        } else if (tempValue.length > 1000) {
          error = 'Mô tả không được vượt quá 1000 ký tự';
        }
      } else if (editingField === 'detailedDescription') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Mô tả chi tiết sự kiện là bắt buộc';
        } else if (stripHtml(tempValue).length > 1500) {
          error = 'Mô tả chi tiết không được vượt quá 1500 ký tự';
        }
      } else if (editingField === 'locationName') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Địa điểm là bắt buộc';
        }
      } else if (editingField === 'address') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Địa chỉ chi tiết là bắt buộc';
        }
      } else if (editingField === 'district') {
        if (!tempValue || tempValue.trim() === '') {
          error = 'Quận/Huyện là bắt buộc';
        }
      } else if (editingField === 'linkRef') {
        // linkRef is optional, no validation needed
      }
      
      if (error) {
        // Show error
        setFieldErrors(prev => ({
          ...prev,
          [editingField]: error
        }));
        return;
      }
      
      // Clear error and save
      setFieldErrors(prev => ({
        ...prev,
        [editingField]: ''
      }));
      
      setValue(editingField, tempValue);
      setEditingField(null);
      setTempValue('');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  // Handle key press for editing
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Format ticket price
  const formatTicketPrice = (ticket) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(ticket.ticketPrice);
  };

  // Function to go to next image
  const nextImage = () => {
    if (imagePreview && imagePreview.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === imagePreview.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Function to go to previous image
  const prevImage = () => {
    if (imagePreview && imagePreview.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? imagePreview.length - 1 : prevIndex - 1
      );
    }
  };

  // Reset image index when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [imagePreview?.length]);

  // Clear tag error when tags are selected
  useEffect(() => {
    if (reduxSelectedTags && reduxSelectedTags.length > 0) {
      setTagError('');
    }
  }, [reduxSelectedTags]);

  // Clear image errors when images are selected
  useEffect(() => {
    if (selectedImages.length > 0 || imagePreview.length > 0) {
      setImageError('');
    }
  }, [selectedImages, imagePreview]);

  // Clear evidence image errors when evidence images are selected
  useEffect(() => {
    if (selectedEvidenceImages.length > 0 || evidenceImagePreview.length > 0) {
      setEvidenceImageError('');
    }
  }, [selectedEvidenceImages, evidenceImagePreview]);

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

  // Generate preview data for the WYSIWYG interface
  const previewData = generatePreviewData(watch());
  const sidebarState = state === "collapsed" ? "lg:pl-20" : "lg:pl-0.2";
  
  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ${sidebarState}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-3xl font-bold text-balance">Chỉnh sửa sự kiện</h1>
          </div>
          <p className="text-muted-foreground">Cập nhật thông tin sự kiện của bạn</p>
        </div>
        
        {/* Event Banner with Editable Image */}
        <div className="relative h-96 w-full overflow-hidden bg-gray-100">
          {imagePreview && imagePreview.length > 0 ? (
            <>
              <img 
                src={imagePreview[currentImageIndex]} 
                alt="Event Banner" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Editable Badges */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                {/* Display price badge first */}
                <Badge className="bg-primary text-primary-foreground border-0 shadow-lg px-3 py-1.5 font-semibold">
                    {(() => {
                      const types = watch("ticketTypes") || [];

                      const paidPrices = types
                        .map(t => Number(t.ticketPrice) || 0)
                        .filter(p => p > 0);

                      // Nếu tất cả vé giá = 0 → Miễn phí
                      if (paidPrices.length === 0) {
                        return "Chưa có thông tin giá vé";
                      }

                      // Ngược lại → Có phí + hiển thị khoảng giá
                      const min = Math.min(...paidPrices);
                      const max = Math.max(...paidPrices);

                      const formatter = new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      });

                      return min === max
                        ? formatter.format(min)
                        : `${formatter.format(min)} - ${formatter.format(max)}`;
                    })()}
                  </Badge>

                {/* Display category badge */}
                <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg px-3 py-1.5 font-semibold">
                  <Tag className="w-3 h-3 mr-1" />
                  {editingField === 'eventCategoryId' ? (
                    <Select value={watch('eventCategoryId')} onValueChange={(value) => setValue('eventCategoryId', value)}>
                      <SelectTrigger className="h-6 w-auto border-0 bg-transparent text-gray-900">
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
                  ) : (
                    previewData.eventCategoryName || "Chưa phân loại"
                  )}
                </Badge>
                {/* Display event tags */}
                {previewData.eventTags && previewData.eventTags.map((tag, index) => (
                  <Badge key={index} className="bg-indigo-100 text-indigo-800 border-0 shadow-lg px-3 py-1.5 font-semibold">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
              
              {/* Image carousel indicators */}
              {imagePreview.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {imagePreview.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentImageIndex === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* Navigation arrows */}
              {imagePreview.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Edit Image Button */}
              <label className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full cursor-pointer">
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <label className="cursor-pointer flex flex-col items-center">
                <Image className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-400 font-medium">
                  Nhấn để tải lên hình ảnh
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        {/* Display event image validation error */}
        {hasValidated && imageError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2 mx-4">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {imageError}
            </p>
          </div>
        )}
        
        {/* Image Thumbnails Row */}
        {imagePreview.length > 0 && (
          <div className="flex flex-wrap gap-2 my-6">
            {imagePreview.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500"
                  onClick={() => setCurrentImageIndex(index)}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Add More Images Button */}
            {imagePreview.length < 5 && (
              <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <Plus className="w-6 h-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main Content - Event Detail Preview */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              {/* Editable Title */}
              {editingField === 'title' ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={saveEditing}
                  onKeyDown={handleKeyPress}
                  className="text-4xl font-bold text-foreground leading-tight"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-4xl font-bold text-foreground leading-tight cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={() => startEditing('title', watch('title'))}
                >
                  {watch('title') || 'Nhấp để nhập tiêu đề sự kiện'}
                  <Pencil className="w-4 h-4 inline-block ml-2 text-gray-400" />
                </h1>
              )}
              {(fieldErrors.title || (hasValidated && errors.title)) && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.title || errors.title?.message}
                </p>
              )}
              
              {/* Editable Description */}
              {editingField === 'description' ? (
                <Textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={saveEditing}
                  onKeyDown={handleKeyPress}
                  className="text-lg text-muted-foreground leading-relaxed"
                  rows={3}
                  autoFocus
                />
              ) : (
                <p 
                  className="text-lg text-muted-foreground leading-relaxed cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={() => startEditing('description', watch('description'))}
                >
                  {watch('description') || 'Nhấp để nhập mô tả sự kiện'}
                  <Pencil className="w-4 h-4 inline-block ml-2 text-gray-400" />
                </p>
              )}
              {(fieldErrors.description || (hasValidated && errors.description)) && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.description || errors.description?.message}
                </p>
              )}
            </div>
            
            {/* Event Timeline */}
            <EventTimeline 
              stages={[
                {
                  label: "Mở bán vé",
                  time: watch('saleStartTime') 
                    ? `${new Date(watch('saleStartTime')).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(watch('saleStartTime')).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : "Chưa xác định",
                  icon: <Ticket className="w-5 h-5" />,
                  color: "bg-blue-500"
                },
                {
                  label: "Đóng bán vé",
                  time: watch('saleEndTime') 
                    ? `${new Date(watch('saleEndTime')).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(watch('saleEndTime')).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : "Chưa xác định",
                  icon: <Clock className="w-5 h-5" />,
                  color: "bg-red-500"
                },
                {
                  label: "Sự kiện bắt đầu",
                  time: watch('startTime') 
                    ? `${new Date(watch('startTime')).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(watch('startTime')).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : "Chưa xác định",
                  icon: <Calendar className="w-5 h-5" />,
                  color: "bg-green-500"
                },
                {
                  label: "Sự kiện kết thúc",
                  time: watch('endTime') 
                    ? `${new Date(watch('endTime')).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(watch('endTime')).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : "Chưa xác định",
                  icon: <Flag className="w-5 h-5" />,
                  color: "bg-purple-500"
                }
              ]}
              rawTimes={[
                watch('saleStartTime'),
                watch('saleEndTime'),
                watch('startTime'),
                watch('endTime')
              ]}
              onTimeChange={(index, value) => {
                const fields = ['saleStartTime', 'saleEndTime', 'startTime', 'endTime'];
                setValue(fields[index], value);
              }}
              currentStage={(() => {
                const now = new Date();
                // Stage 0: Mở bán vé (Ticket sale start)
                if (watch('saleStartTime') && now < new Date(watch('saleStartTime'))) return -1; // Not yet started
                // Stage 1: Đóng bán vé (Ticket sale end)
                if (watch('saleEndTime') && now < new Date(watch('saleEndTime'))) return 0; // Sale is ongoing
                // Stage 2: Sự kiện bắt đầu (Event start)
                if (now < new Date(watch('startTime'))) return 1;
                // Stage 3: Sự kiện kết thúc (Event end)
                if (now < new Date(watch('endTime'))) return 2;
                return 2; // Event has ended
              })()}
              isEditable={true}
              minDateTime={minDateTime}
              maxDateTime={maxDateTime}
            />
            {/* Display timeline validation errors */}
            {hasValidated && (
              <div className="space-y-2 mt-2">
                {(!watch('saleStartTime') || !watch('saleEndTime') || !watch('startTime') || !watch('endTime')) && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Thời gian của sự kiện cần nhập đầy đủ
                  </p>
                )}
                {/* Display individual field errors */}
                {Object.entries(dateErrors).map(([field, error]) => {
                  if (error) {
                    return (
                      <p key={field} className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            
            {/* Ticket Information */}
            {previewData.ticketTypes && previewData.ticketTypes.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    Tình trạng vé
                  </h3>
                  <span className="text-sm font-medium text-primary">
                    {previewData.ticketTypes.reduce((acc, ticket) => acc + (ticket.soldQuantity || 0), 0) / 
                     previewData.ticketTypes.reduce((acc, ticket) => acc + (ticket.ticketQuantity || 0), 0) * 100 || 0}% Đã bán
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(previewData.ticketTypes.reduce((acc, ticket) => acc + (ticket.soldQuantity || 0), 0) / 
                                previewData.ticketTypes.reduce((acc, ticket) => acc + (ticket.ticketQuantity || 0), 0) * 100) || 0}%` 
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {previewData.ticketTypes.reduce((acc, ticket) => acc + (ticket.ticketQuantity - (ticket.soldQuantity || 0)), 0)} chỗ còn lại
                </p>
              </div>
            )}
            
            {/* Ticket Options */}
            {previewData.ticketTypes && previewData.ticketTypes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-foreground">Loại vé có sẵn</h3>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTicketType}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm vé
                  </Button>
                </div>
                {previewData.ticketTypes.map((ticket, index) => {
                  const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
                  const isAvailable = availableTickets > 0;
                  const soldPercentage = ticket.soldQuantity ? (ticket.soldQuantity / ticket.ticketQuantity) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/30 hover:shadow-md transition"
                    >
                      {/* Ticket Editing Form */}
                      {editingTicketIndex === index ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground mb-1">Chỉnh sửa vé</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-1">Tên vé</Label>
                              <Input
                                name="ticketName"
                                value={ticketForm.ticketName}
                                onChange={handleTicketFormChange}
                                placeholder="Nhập tên vé"
                                className={ticketErrors[editingTicketIndex]?.ticketName ? 'border-red-500' : ''}
                              />
                              {ticketErrors[editingTicketIndex]?.ticketName && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {ticketErrors[editingTicketIndex].ticketName}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-1">Số lượng</Label>
                              <Input
                                type="text"
                                name="ticketQuantity"
                                value={ticketForm.ticketQuantity}
                                onChange={handleTicketFormChange}
                                placeholder="20 - 100.000"
                                className={ticketErrors[editingTicketIndex]?.ticketQuantity ? 'border-red-500' : ''}
                              />
                              {ticketErrors[editingTicketIndex]?.ticketQuantity && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {ticketErrors[editingTicketIndex].ticketQuantity}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-1">Giá vé (VND)</Label>
                              <Input
                                type="text"
                                name="ticketPrice"
                                value={ticketForm.ticketPrice}
                                onChange={handleTicketFormChange}
                                placeholder="10.000 trở lên"
                                className={ticketErrors[editingTicketIndex]?.ticketPrice ? 'border-red-500' : ''}
                              />
                              {ticketErrors[editingTicketIndex]?.ticketPrice && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {ticketErrors[editingTicketIndex].ticketPrice}
                                </p>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium mb-1">Mô tả</Label>
                              <Textarea
                                name="ticketDescription"
                                value={ticketForm.ticketDescription}
                                onChange={handleTicketFormChange}
                                placeholder="Mô tả vé (tùy chọn)"
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEditingTicket}>
                              Hủy
                            </Button>
                            <Button size="sm" onClick={saveEditingTicket}>
                              Lưu
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Ticket Display */
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">{ticket.ticketName}</h4>
                              <p className="text-sm text-muted-foreground">{ticket.ticketDescription}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                  {ticket.ticketPrice === 0 ? "" : formatTicketPrice(ticket)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => startEditingTicket(index, ticket)}
                                className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                              >
                                <Pen className="w-4 h-4" />
                              </button>
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
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{ticket.soldQuantity || 0} / {ticket.ticketQuantity} đã bán</span>
                            <span className="font-medium">{availableTickets} còn lại</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Display ticket name validation error */}
            {hasValidated && ticketNameError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {ticketNameError}
                </p>
              </div>
            )}
            {/* Display ticket types validation error */}
            {hasValidated && errors.ticketTypes && errors.ticketTypes.message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.ticketTypes.message}
                </p>
              </div>
            )}
            
            {/* About Event */}
            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-foreground mb-6">Về sự kiện</h2>
              <div className="space-y-4 mb-6">
                <RichTextEditor
                  value={watch('detailedDescription')}
                  onChange={(value) => {
                    setValue('detailedDescription', value);
                    // Clear any existing errors when user starts typing
                    if (hasValidated && errors.detailedDescription) {
                      clearErrors('detailedDescription');
                    }
                  }}
                  placeholder="Nhập mô tả chi tiết sự kiện..."
                  viewMode={true}
                />
                {hasValidated && errors.detailedDescription && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.detailedDescription.message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Organizer */}
            <div className="bg-white rounded-xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-foreground mb-6">Nhà tổ chức</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{user?.fullName || "Nhà tổ chức"}</h3>
                  <p className="text-muted-foreground mt-1">Thông tin về nhà tổ chức chưa được cập nhật.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Form Controls */}
          <div className="lg:col-span-1 space-y-5">
            {/* Main Card */}
            <div className="sticky top-24">
              {/* Header Section */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-t-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      <Pen className="w-5 h-5" />
                      Thông tin sự kiện
                    </h3>
                    <p className="text-blue-100 text-sm">Cập nhật sự kiện của bạn một cách dễ dàng</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <Card className="border-0 rounded-t-none shadow-2xl">
                <CardContent className="space-y-1 pt-6 pb-6">
                  {/* Category Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg shadow-md">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Danh mục sự kiện</h4>
                        <p className="text-xs text-muted-foreground">Chọn loại sự kiện của bạn</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
                      <CategorySelector 
                        selectedCategories={selectedCategory ? [selectedCategory] : []}
                        onCategoriesChange={(categories) => {
                          if (categories.length > 0) {
                            const category = categories[0];
                            setSelectedCategory(category);
                            setValue('eventCategoryId', category.eventCategoryId);
                            setFieldErrors(prev => ({
                              ...prev,
                              eventCategoryId: ''
                            }));
                          } else {
                            setSelectedCategory(null);
                            setValue('eventCategoryId', '');
                          }
                        }}
                      />
                      {(fieldErrors.eventCategoryId || (errors.eventCategoryId && hasValidated)) && (
                        <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-600 dark:text-red-400 text-xs">
                            {fieldErrors.eventCategoryId || errors.eventCategoryId?.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-lg shadow-md">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Địa điểm tổ chức</h4>
                        <p className="text-xs text-muted-foreground">Quán lý vị trí sự kiện</p>
                      </div>
                    </div>
                    <div className="bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-5 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quận/Huyện</Label>
                        <Select 
                          value={watch('district')} 
                          onValueChange={(value) => {
                            setValue('district', value);
                            setFieldErrors(prev => ({
                              ...prev,
                              district: ''
                            }));
                          }}
                        >
                          <SelectTrigger className={`rounded-lg h-9 border-gray-200 dark:border-gray-800 ${fieldErrors.district ? 'border-red-500' : ''}`}>
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
                        {(fieldErrors.district || (errors.district && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.district || errors.district?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Tên địa điểm
                        </Label>
                        <Input
                          placeholder="Ví dụ: Trung tâm hội nghị thành phố"
                          value={watch('locationName') || ''}
                          onChange={(e) => {
                            setValue('locationName', e.target.value);
                            setFieldErrors(prev => ({
                              ...prev,
                              locationName: ''
                            }));
                          }}
                          onBlur={() => {
                            const value = watch('locationName');
                            let error = '';
                            if (!value || value.trim() === '') {
                              error = 'Địa điểm là bắt buộc';
                            }
                            setFieldErrors(prev => ({
                              ...prev,
                              locationName: error
                            }));
                          }}
                          className={`rounded-lg h-9 border-gray-200 dark:border-gray-800 focus:border-blue-400 ${fieldErrors.locationName ? 'border-red-500' : ''}`}
                        />
                        {(fieldErrors.locationName || (errors.locationName && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.locationName || errors.locationName?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Địa chỉ chi tiết</Label>
                        <Textarea
                          placeholder="Nhập địa chỉ đầy đủ"
                          rows={2}
                          value={watch('address') || ''}
                          onChange={(e) => {
                            setValue('address', e.target.value);
                            setFieldErrors(prev => ({
                              ...prev,
                              address: ''
                            }));
                          }}
                          onBlur={() => {
                            const value = watch('address');
                            let error = '';
                            if (!value || value.trim() === '') {
                              error = 'Địa chỉ chi tiết là bắt buộc';
                            }
                            setFieldErrors(prev => ({
                              ...prev,
                              address: error
                            }));
                          }}
                          className={`rounded-lg border-gray-200 dark:border-gray-800 resize-none focus:border-blue-400 text-sm ${fieldErrors.address ? 'border-red-500' : ''}`}
                        />
                        {(fieldErrors.address || (errors.address && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.address || errors.address?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-pink-600 p-2.5 rounded-lg shadow-md">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Thẻ gắn sự kiện</h4>
                        <p className="text-xs text-muted-foreground">Giúp người dùng tìm kiếm sự kiện dễ dàng</p>
                      </div>
                    </div>
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-5 rounded-xl">
                      <TagSelector />
                    </div>
                    {/* Display tag validation error */}
                    {hasValidated && tagError && (
                      <p className="text-red-500 text-xs mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {tagError}
                      </p>
                    )}
                  </div>

                  {/* Evidence Images Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-pink-500 to-red-600 p-2.5 rounded-lg shadow-md">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Hình ảnh bằng chứng</h4>
                        <p className="text-xs text-muted-foreground">Tối đa 5 hình ảnh</p>
                      </div>
                    </div>

                    <div className="relative group">
                      <label htmlFor="evidence-image-input" className="block cursor-pointer">
                        <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/20 border-2 border-dashed border-pink-200 dark:border-pink-800 rounded-xl p-6 text-center hover:border-pink-400 dark:hover:border-pink-600 transition-all hover:bg-pink-50/80 dark:hover:bg-pink-950/30">
                          <div className="text-4xl mb-3">📸</div>
                          <p className="text-sm font-semibold text-foreground">
                            Thêm hình ảnh bằng chứng
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, GIF (Tối đa 5MB mỗi ảnh)
                          </p>
                        </div>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleEvidenceImageChange}
                          className="hidden"
                          id="evidence-image-input"
                        />
                      </label>
                    </div>

                    {evidenceImagePreview.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Đã tải lên ({evidenceImagePreview.filter(img => img).length}/5)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {evidenceImagePreview.filter(img => img !== null && img !== undefined && img !== '').map((img, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-600">
                              <img
                                src={img}
                                alt={`Evidence Preview ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeEvidenceImage(index)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Display error for evidence images if needed */}
                    {hasValidated && errors.evidenceImages && (
                      <p className="text-red-500 text-xs mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.evidenceImages.message}
                      </p>
                    )}
                    {/* Display custom evidence image error if needed */}
                    {hasValidated && evidenceImageError && (
                      <p className="text-red-500 text-xs mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {evidenceImageError}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2 space-y-0">
                    {!watch('publish') && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-lg font-medium border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 bg-white dark:bg-transparent transition-all hover:border-gray-400 dark:hover:border-gray-600"
                        onClick={() => {
                          validateAllFields();
                          handleSubmit((data) => onSubmit(data, false))();
                        }}
                        disabled={isSaving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Đang lưu..." : "Lưu nháp"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="h-11 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => {
                        validateAllFields();
                        handleSubmit((data) => onSubmit(data, true))();
                      }}
                      disabled={isSaving}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSaving ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;
