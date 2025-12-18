import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  Send,
  CheckCircle2,
  CheckCircle,
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
  Loader2,
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
// Import the EventDetailGuestPage component for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';
// Import EventStatus enum
import { EventStatus } from '../../constants/eventConstants';
// Import Cloudinary utility
import { uploadImagesToCloudinary } from '../../utils/cloudinary';
// Import date utility
import { convertUTC7ToUTC, convertUTCToUTC7 } from '../../utils/dateUtils';

// Import predefined cities
import { PredefinedCities } from '../../constants/userConstants';
// Import EventTimeline component
import { EventTimeline } from '../../components/Event/EventTimeline';

// Import datetime validation utility
import datetimeValidation from '../../utils/datetimeValidation';
import { stripHtml } from '../../utils/stripHtml';
// Import number formatting utility
import { formatNumberWithSeparator, removeNumberFormatting } from '../../utils/numberFormat';
// Import AI text import dialog
import ImportEventTextDialog from '../../components/Event/ImportEventTextDialog';
// Import Wand2 icon for AI button
import { Wand2 } from 'lucide-react';
// Import LocationMapPicker component
import LocationMapPicker from '../../components/Event/LocationMapPicker';
// Validation schema
const createEventSchema = z.object({
  title: z.string().min(1, 'Tiêu đề sự kiện là bắt buộc').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().min(1, 'Mô tả sự kiện là bắt buộc').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  detailedDescription: z.string().min(1, 'Mô tả chi tiết sự kiện là bắt buộc').refine(
    (val) => stripHtml(val).length <= 1500, 
    'Mô tả chi tiết không được vượt quá 1500 ký tự'
  ),
  startTime: z.string().min(1, 'Thời gian bắt đầu là bắt buộc'),  endTime: z.string().min(1, 'Thời gian kết thúc là bắt buộc'),
  locationName: z.string().min(1, 'Địa điểm là bắt buộc'),
  address: z.string().min(1, 'Địa chỉ chi tiết là bắt buộc'),
  district: z.string().min(1, 'Quận/Huyện là bắt buộc'),
  linkRef: z.string().optional(),
  eventCategoryId: z.string().min(1, 'Danh mục sự kiện là bắt buộc'), // Make this required
  requireApproval: z.nativeEnum(EventStatus).default(EventStatus.PendingApproval),
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

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedEvidenceImages, setSelectedEvidenceImageUrls] = useState([]);
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
  
  // Track if validation has been triggered (to avoid showing errors before user interaction)
  const [hasValidated, setHasValidated] = useState(false);
  
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
  
  // Add state for AI import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Add state for map picker dialog
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  
  // Redux hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { selectedTags: reduxSelectedTags, clearAllSelectedTags, selectTagForForm } = useTags();
  // const { selectedRules, clearSelectedRefundRules } = useRefundRules();
  const { showLoading, hideLoading, updatePageTitle } = useApp();
  const { createEvent: createEventAPI, loading: eventLoading } = useEvents();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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
      district: '',
      linkRef: '',
      eventCategoryId: '',
      requireApproval: EventStatus.PendingApproval,
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
  
  // Get the getEventById function from the hook
  const { getEventById } = useEvents();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });
  const watchEventCategoryId = watch('eventCategoryId');
  // Set page title and cleanup on mount
  useEffect(() => {
    updatePageTitle('Tạo sự kiện mới');
    
    // Check for cloned event data
    const storedCloneData = localStorage.getItem('cloneEventData');
    const cloneEventId = localStorage.getItem('cloneEventId');
    
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
    } else if (cloneEventId) {
      // Load event data for cloning
      loadCloneEventData(cloneEventId);
    }
    
    return () => {
      clearAllSelectedTags();
      // clearSelectedRefundRules();
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
    setValue('district', cloneData.district || '');
    setValue('eventCategoryId', cloneData.eventCategoryId || cloneData.eventCategory?.eventCategoryId || '');
    
    // Format dates for datetime-local inputs
    if (cloneData.startTime) {
      const startDate = convertUTCToUTC7(cloneData.startTime);
      // Add one day to the start date for the clone
      startDate.setDate(startDate.getDate() + 1);
      setValue('startTime', startDate.toISOString().slice(0, 16));
    }
    
    if (cloneData.endTime) {
      const endDate = convertUTCToUTC7(cloneData.endTime);
      // Add one day to the end date for the clone
      endDate.setDate(endDate.getDate() + 1);
      setValue('endTime', endDate.toISOString().slice(0, 16));
    }
    
    // Set sale dates (add one day)
    if (cloneData.saleStartTime) {
      const saleStartDate = convertUTCToUTC7(cloneData.saleStartTime);
      saleStartDate.setDate(saleStartDate.getDate() + 1);
      setValue('saleStartTime', saleStartDate.toISOString().slice(0, 16));
    }
    
    if (cloneData.saleEndTime) {
      const saleEndDate = convertUTCToUTC7(cloneData.saleEndTime);
      saleEndDate.setDate(saleEndDate.getDate() + 1);
      setValue('saleEndTime', saleEndDate.toISOString().slice(0, 16));
    }
    
    // Handle ticket types
    if (cloneData.ticketTypes && cloneData.ticketTypes.length > 0) {
      // Clear existing ticket types
      remove(0);
      
      // Add cloned ticket types
      cloneData.ticketTypes.forEach((ticket, index) => {
        append({
          ticketName: ticket.ticketName,
          ticketPrice: ticket.ticketPrice || 10000,
          ticketQuantity: ticket.ticketQuantity || 1,
          ticketDescription: ticket.ticketDescription || '',
          // ruleRefundRequestId: ticket.ruleRefundRequestId || '',
        });
      });
    } else if (cloneData.ticketDetails && cloneData.ticketDetails.length > 0) {
      // Handle alternative ticket structure
      remove(0);
      cloneData.ticketDetails.forEach((ticket, index) => {
        append({
          ticketName: ticket.ticketName || ticket.TicketName || '',
          ticketPrice: ticket.ticketPrice || ticket.TicketPrice || 10000,
          ticketQuantity: ticket.ticketQuantity || ticket.TicketQuantity || 1,
          ticketDescription: ticket.ticketDescription || ticket.TicketDescription || '',
        });
      });
    }
    
    // Handle tags - select them in the Redux store
    if (cloneData.eventTags && cloneData.eventTags.length > 0) {
      // Process tags and select them
      cloneData.eventTags.forEach(tag => {
        // Normalize tag structure
        const normalizedTag = {
          tagId: tag.tagId || tag.id || tag.TagId,
          tagName: tag.tagName || tag.nameTag || tag.name || tag.TagName,
          nameTag: tag.nameTag || tag.tagName || tag.name || tag.TagName,
          ...tag
        };
        
        // Select the tag in the Redux store
        selectTagForForm(normalizedTag);
      });
    } else if (cloneData.tags && cloneData.tags.length > 0) {
      // Handle alternative tag structure
      cloneData.tags.forEach(tag => {
        // Normalize tag structure
        const normalizedTag = {
          tagId: tag.tagId || tag.id || tag.TagId,
          tagName: tag.tagName || tag.nameTag || tag.name || tag.TagName,
          nameTag: tag.nameTag || tag.tagName || tag.name || tag.TagName,
          ...tag
        };
        
        // Select the tag in the Redux store
        selectTagForForm(normalizedTag);
      });
    }
    
    // Handle images - set image previews for cloning
    if (cloneData.imgListEvent && cloneData.imgListEvent.length > 0) {
      // Filter out null, undefined, empty strings, and invalid URLs
      const validImages = cloneData.imgListEvent.filter(img => 
        img !== null && 
        img !== undefined && 
        img !== '' && 
        typeof img === 'string' && 
        img.trim() !== '' && 
        !img.includes('System.Collections.Generic.List') &&
        img.startsWith('http')
      );
      // Set existing images as previews
      if (validImages.length > 0) {
        setImagePreview(validImages);
      }
    }
    
    // Set selected category
    if (cloneData.eventCategory) {
      setSelectedCategory(cloneData.eventCategory);
    } else if (cloneData.eventCategoryId) {
      const category = categories.find(cat => cat.eventCategoryId === cloneData.eventCategoryId);
      if (category) {
        setSelectedCategory(category);
      }
    }
    
    // Set coordinates from cloned event data
    if (cloneData.latitude && cloneData.longitude) {
      setSelectedCoordinates({
        lat: cloneData.latitude,
        lng: cloneData.longitude
      });
    }
  };
  // Load event data for cloning
  const loadCloneEventData = async (cloneEventId) => {
    try {
      setIsLoading(true);
      showLoading();
      
      // Clear previously selected tags
      clearAllSelectedTags();
      
      // Fetch event details by ID using the hook function
      const event = await getEventById(cloneEventId);
      
      if (event) {
        // Populate form with cloned event data
        const formData = {
          title: `${event.title} (Bản sao)` || '',
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
          publish: false, // Always start as draft for cloned events
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
        }
        
        // Set selected category
        if (event.eventCategory) {
          setSelectedCategory(event.eventCategory);
        }
        
        // Set coordinates from cloned event data
        if (event.latitude && event.longitude) {
          setSelectedCoordinates({
            lat: event.latitude,
            lng: event.longitude
          });
        }
      } else {
        toast.error('Không tìm thấy sự kiện để sao chép');
      }
    } catch (error) {
      console.error('Error loading clone event:', error);
      toast.error('Không thể tải thông tin sự kiện để sao chép');
    } finally {
      setIsLoading(false);
      hideLoading();
      // Remove the clone event ID from localStorage
      localStorage.removeItem('cloneEventId');
    }
  };
  // Real-time validation effect
  useEffect(() => {
    validateDates();
  }, [watch('startTime'), watch('endTime'), watch('saleStartTime'), watch('saleEndTime')]);
  // Handle image upload - append new images to existing ones
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
  };  // Handle evidence image upload
  const handleEvidenceImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 hình ảnh bằng chứng');
      return;
    }
    setSelectedEvidenceImageUrls(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setEvidenceImagePreview(previews);
    // Clear evidence image error when images are selected
    if (files.length > 0) {
      setEvidenceImageError('');
    }
  };
  // Remove image
  const removeImage = (index) => {
    const removedPreview = imagePreview[index];
    
    // Remove from preview array
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newPreviews);
    
    // Only remove from selectedImages if it's a blob URL (newly uploaded file)
    if (removedPreview && removedPreview.startsWith('blob:')) {
      // Find the corresponding file index in selectedImages
      // Count how many blob URLs come before this index
      const blobsBefore = imagePreview.slice(0, index).filter(url => 
        typeof url === 'string' && url.startsWith('blob:')
      ).length;
      
      // Remove the corresponding file
      const newImages = selectedImages.filter((_, i) => i !== blobsBefore);
      setSelectedImages(newImages);
      
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(removedPreview);
    }
    
    // Set error if no images left
    if (newPreviews.length === 0) {
      setImageError('Vui lòng tải lên ít nhất một hình ảnh sự kiện');
    }
  };
  // Remove evidence image
  const removeEvidenceImage = (index) => {
    const removedPreview = evidenceImagePreview[index];
    
    // Remove from preview array
    const newPreviews = evidenceImagePreview.filter((_, i) => i !== index);
    setEvidenceImagePreview(newPreviews);
    
    // Only remove from selectedEvidenceImages if it's a blob URL (newly uploaded file)
    if (removedPreview && removedPreview.startsWith('blob:')) {
      // Find the corresponding file index in selectedEvidenceImages
      // Count how many blob URLs come before this index
      const blobsBefore = evidenceImagePreview.slice(0, index).filter(url => 
        typeof url === 'string' && url.startsWith('blob:')
      ).length;
      
      // Remove the corresponding file
      const newImages = selectedEvidenceImages.filter((_, i) => i !== blobsBefore);
      setSelectedEvidenceImageUrls(newImages);
      
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(removedPreview);
    }
    
    // Set error if no evidence images left
    if (newPreviews.length === 0) {
      setEvidenceImageError('Vui lòng tải lên ít nhất một hình ảnh bằng chứng');
    }
  };
  // Add ticket type
  const addTicketType = () => {
    append({
      ticketName: '',
      ticketPrice: 10000,
      ticketQuantity: 1,
      ticketDescription: '',
      // ruleRefundRequestId: selectedRules.length > 0 ? selectedRules[0].ruleRefundId : '',
    });
  };
  // Remove ticket type
  const removeTicketType = (index) => {
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
        remainingQuantity: parseInt(ticket.ticketQuantity) || 0, // Default for preview
        // ruleRefundRequestName: refundRule ? refundRule.ruleName : ''
      };
    });
    
    // Calculate total tickets
    const totalTickets = ticketTypes.reduce((sum, ticket) => sum + (parseInt(ticket.ticketQuantity) || 0), 0);
    
    // Format image previews
    const imgListEvent = imagePreview.length > 0 ? imagePreview : [];
    
    // Create preview event data
    const previewData = {
      eventId: 'preview-event-id',
      title: formData.title || 'Tiêu đề sự kiện mẫu',
      description: formData.description || 'Mô tả sự kiện mẫu',
      detailedDescription: formData.detailedDescription || '',
      linkRef: formData.linkRef || '',
      startTime: formData.startTime || new Date(Date.now() + 866400000).toISOString(), // Tomorrow
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
  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Validate all fields at once and show inline errors
      const hasErrors = validateAllFields();
      
      // Additional validation for datetime fields to ensure they're still valid
      const currentTime = new Date();
      const saleStartTime = new Date(data.saleStartTime);
      const saleEndTime = new Date(data.saleEndTime);
      const eventStartTime = new Date(data.startTime);
      const eventEndTime = new Date(data.endTime);
      
      // Check if any datetime has become invalid since form was filled
      if (saleStartTime <= currentTime) {
        setDateErrors(prev => ({
          ...prev,
          saleStartTime: 'Thời gian bắt đầu bán vé phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian bắt đầu bán vé phải sau thời điểm hiện tại');
        return;
      }
      
      if (saleEndTime <= currentTime) {
        setDateErrors(prev => ({
          ...prev,
          saleEndTime: 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc bán vé phải sau thời điểm hiện tại');
        return;
      }
      
      if (eventStartTime <= currentTime) {
        setDateErrors(prev => ({
          ...prev,
          startTime: 'Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại');
        return;
      }
      
      if (eventEndTime <= currentTime) {
        setDateErrors(prev => ({
          ...prev,
          endTime: 'Thời gian kết thúc sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc sự kiện phải sau thời điểm hiện tại');
        return;
      }
      
      if (hasErrors) {
        const errorMessage = data.publish 
          ? 'Vui lòng kiểm tra lại thông tin sự kiện trước khi xuất bản' 
          : 'Vui lòng kiểm tra lại thông tin sự kiện trước khi lưu nháp';
        toast.error(errorMessage);
        return;
      }
      
      showLoading('Đang tạo sự kiện...');
      setIsSubmitting(true);
      // Validate required fields
      if (!data.title?.trim()) {
        toast.error('Vui lòng nhập tiêu đề sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      // Validate category
      if (!data.eventCategoryId) {
        toast.error('Vui lòng chọn danh mục sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      // Validate event images - check for either uploaded or cloned images
      if (selectedImages.length === 0 && imagePreview.length === 0) {
        setImageError('Vui lòng tải lên ít nhất một hình ảnh sự kiện');
        toast.error('Vui lòng tải lên ít nhất một hình ảnh sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      } else {
        setImageError('');
      }
      // Validate evidence images - check for either uploaded or cloned images
      if (selectedEvidenceImages.length === 0 && evidenceImagePreview.length === 0) {
        setEvidenceImageError('Vui lòng tải lên ít nhất một hình ảnh bằng chứng');
        toast.error('Vui lòng tải lên ít nhất một hình ảnh bằng chứng');
        hideLoading();
        setIsSubmitting(false);
        return;
      } else {
        setEvidenceImageError('');
      }
      
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
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      if (validationSaleEndTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          saleEndTime: 'Thời gian kết thúc bán vé phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc bán vé phải sau thời điểm hiện tại');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      if (validationEventStartTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          startTime: 'Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian bắt đầu sự kiện phải sau thời điểm hiện tại');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      if (validationEventEndTime <= currentValidationTime) {
        setDateErrors(prev => ({
          ...prev,
          endTime: 'Thời gian kết thúc sự kiện phải sau thời điểm hiện tại'
        }));
        toast.error('Thời gian kết thúc sự kiện phải sau thời điểm hiện tại');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      // Convert datetime strings to Date objects for validation
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      const saleStartDate = new Date(data.saleStartTime);
      const saleEndDate = new Date(data.saleEndTime);
      
      // Create now date in the same timezone as the input dates (UTC+7)
      // Since datetime inputs are in local time (UTC+7), we need to compare with local time
      const now = new Date();
      if (startDate <= now) {
        toast.error('Thời gian bắt đầu phải sau thời điểm hiện tại');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      if (endDate <= startDate) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      if (saleStartDate >= startDate) {
        toast.error('Thời gian bắt đầu bán vé phải trước thời gian bắt đầu sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      if (saleEndDate <= saleStartDate) {
        toast.error('Thời gian kết thúc bán vé phải sau thời gian bắt đầu bán vé');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      if (saleEndDate >= startDate) {
        toast.error('Thời gian kết thúc bán vé phải trước thời gian bắt đầu sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      // Validate that coordinates have been selected from map
      if (!selectedCoordinates) {
        toast.error('Vui lòng chọn vị trí trên bản đồ trước khi tạo sự kiện');
        hideLoading();
        setIsSubmitting(false);
        return;
      }
      
      let imageUrls = [];
      // Separate existing URLs (from clone/edit) and new files to upload
      const existingImageUrls = imagePreview.filter(url => 
        typeof url === 'string' && 
        (url.startsWith('http://') || url.startsWith('https://')) &&
        !url.startsWith('blob:')
      );
      
      if (selectedImages.length > 0) {
        // Upload new images to Cloudinary
        const newImageUrls = await uploadImagesToCloudinary(selectedImages);
        // Combine existing URLs with newly uploaded URLs
        imageUrls = [...existingImageUrls, ...newImageUrls];
      } else if (existingImageUrls.length > 0) {
        // Only use existing URLs if no new images to upload
        imageUrls = [...existingImageUrls];
      }
      
      let evidenceImageUrls = [];
      // Separate existing URLs (from clone/edit) and new files to upload
      const existingEvidenceUrls = evidenceImagePreview.filter(url => 
        typeof url === 'string' && 
        (url.startsWith('http://') || url.startsWith('https://')) &&
        !url.startsWith('blob:')
      );
      
      if (selectedEvidenceImages.length > 0) {
        // Upload new evidence images to Cloudinary
        const newEvidenceUrls = await uploadImagesToCloudinary(selectedEvidenceImages);
        // Combine existing URLs with newly uploaded URLs
        evidenceImageUrls = [...existingEvidenceUrls, ...newEvidenceUrls];
      } else if (existingEvidenceUrls.length > 0) {
        // Only use existing URLs if no new images to upload
        evidenceImageUrls = [...existingEvidenceUrls];
      }
      
      // Calculate total tickets from ticketTypes array
      const totalTickets = data.ticketTypes.reduce((sum, ticket) => sum + parseInt(ticket.ticketQuantity), 0);
      // Function to convert datetime-local string (local time) to UTC ISO string
      // Fixed to properly convert local time to UTC
      const convertToUTCISOString = (localDateTimeString) => {
        // "2025-12-02T14:00" → JS tự hiểu là giờ local → tự trừ 7h khi chuyển sang UTC
        const date = new Date(localDateTimeString);
        return date.toISOString(); // ĐÚNG: ra 2025-12-02T07:00:00.000Z
      };
      const eventData = {
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
        latitude: selectedCoordinates.lat,
        longitude: selectedCoordinates.lng,
        totalTickets: totalTickets,
        requireApproval: data.requireApproval,
        publish: data.publish || false, // This will be false for drafts
        images: imageUrls, // Send Cloudinary URLs instead of File objects
        evidenceImages: evidenceImageUrls, // Send Cloudinary URLs instead of File objects
        eventCategoryId: data.eventCategoryId,
        tags: reduxSelectedTags.map(tag => {
          return { tagId: tag.tagId };
        }),
        // refundRules: selectedRules.map(rule => ({ ruleRefundId: rule.ruleRefundId })),
        ticketTypes: data.ticketTypes.map(ticket => ({
          ticketName: ticket.ticketName,
          ticketPrice: (() => {
            const price = parseFloat(ticket.ticketPrice);
            return isNaN(price) ? 0 : price;
          })(),
          ticketQuantity: parseInt(ticket.ticketQuantity),
          ticketDescription: ticket.ticketDescription || '',
          // ruleRefundRequestId: ticket.ruleRefundRequestId,
        })),
      };
      
      const response = await createEventAPI(eventData);
      
      if (response) {
        clearAllSelectedTags();
        // clearSelectedRefundRules();
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
  // Real-time date validation using the new utility
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
    
    // Check for required fields
    if (!startTime) {
      newErrors.startTime = 'Thời gian bắt đầu sự kiện là bắt buộc';
    }
    if (!endTime) {
      newErrors.endTime = 'Thời gian kết thúc sự kiện là bắt buộc';
    }
    if (!saleStartTime) {
      newErrors.saleStartTime = 'Thời gian bắt đầu bán vé là bắt buộc';
    }
    if (!saleEndTime) {
      newErrors.saleEndTime = 'Thời gian kết thúc bán vé là bắt buộc';
    }
    
    // Create now date in the same timezone as the input dates (UTC+7)
    // Since datetime inputs are in local time (UTC+7), we need to compare with local time
    const now = new Date();
    const maxDate = datetimeValidation.getMaxDate(now);
    
    // Check if any datetime is in the past
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
    
    // Check relationships between dates using the new validation utility
    if (startTime && endTime) {
      if (!datetimeValidation.validateEventTimeRange(startTime, endTime)) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    
    if (saleStartTime && saleEndTime && startTime) {
      const saleTimeErrors = datetimeValidation.validateSaleTimeRange(saleStartTime, saleEndTime, startTime);
      if (saleTimeErrors.length > 0) {
        // Assign the first error to the appropriate field
        if (saleTimeErrors[0].includes('bán vé phải trước thời gian kết thúc bán vé')) {
          newErrors.saleEndTime = saleTimeErrors[0];
        } else if (saleTimeErrors[0].includes('bán vé phải trước thời gian bắt đầu sự kiện')) {
          newErrors.saleStartTime = saleTimeErrors[0];
        } else if (saleTimeErrors[0].includes('kết thúc bán vé phải trước thời gian bắt đầu sự kiện')) {
          newErrors.saleEndTime = saleTimeErrors[0];
        }
      }
    }
    
    // Update state with new errors
    setDateErrors(newErrors);
    
    // Kiểm tra xem có lỗi nào không
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    setIsTimelineValid(!hasErrors);
    
    // Return the errors object for backward compatibility
    return Object.values(newErrors).filter(error => error !== '');
  };
  
  // Thêm state để quản lý lỗi validation cho timeline
  const [timelineErrors, setTimelineErrors] = useState({});
  
  // Thêm state để theo dõi validation status
  const [isTimelineValid, setIsTimelineValid] = useState(true);
  
  // Thêm hàm xử lý validation change từ EventTimeline
  const handleTimelineValidationChange = (index, error) => {
    const fieldNames = ['saleStartTime', 'saleEndTime', 'startTime', 'endTime'];
    const fieldName = fieldNames[index];
    
    setTimelineErrors(prev => {
      const newErrors = {
        ...prev,
        [fieldName]: error
      };
      
      // Cập nhật trạng thái validation tổng thể
      const hasErrors = Object.values(newErrors).some(err => err !== '');
      setIsTimelineValid(!hasErrors);
      
      return newErrors;
    });
  };
  
  // Cập nhật useEffect để theo dõi timeline errors
  useEffect(() => {
    const hasErrors = Object.values(timelineErrors).some(error => error !== '');
    setIsTimelineValid(!hasErrors);
  }, [timelineErrors]);
  
  // Ref to track if we're processing a blur event to avoid infinite loops
  const isProcessingBlur = useRef(false);
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
        // Filter out null/undefined values before checking length
        const validImages = imagePreview.filter(img => img !== null && img !== undefined && img !== '');
        const validEvidenceImages = evidenceImagePreview.filter(img => img !== null && img !== undefined && img !== '');
        return validImages.length > 0 && validEvidenceImages.length > 0;
      case 4:
        const ticketTypes = watch('ticketTypes');
        return ticketTypes && ticketTypes.length > 0 && ticketTypes.some(t => t.ticketName && t.ticketQuantity > 0);
      default:
        return false;
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
    const hasTimelineErrors = Object.values(timelineErrors).some(error => error !== '') || 
                            Object.values(dateErrors).some(error => error !== '');
    const hasTicketNameErrors = hasEmptyTicketNames;
    
    // Force re-render of timeline errors by updating state
    setIsTimelineValid(!hasTimelineErrors);
    
    return hasTagErrors || hasImageErrors || hasEvidenceImageErrors || hasTimelineErrors || hasTicketNameErrors;
  };

  // Handle AI import data
  const handleImportFromAI = (parsedData) => {
    // Set basic fields
    if (parsedData.title) setValue('title', parsedData.title);
    if (parsedData.description) setValue('description', parsedData.description);
    if (parsedData.detailedDescription) setValue('detailedDescription', parsedData.detailedDescription);
    if (parsedData.locationName) setValue('locationName', parsedData.locationName);
    if (parsedData.address) setValue('address', parsedData.address);
    if (parsedData.linkRef) setValue('linkRef', parsedData.linkRef);
    
    // Match district with PredefinedCities
    if (parsedData.district) {
      const districtInput = parsedData.district.toLowerCase().trim();
      const matchedDistrict = PredefinedCities.find(city => {
        const cityLower = city.toLowerCase();
        // Exact match
        if (cityLower === districtInput) return true;
        // Partial match (e.g., "Quận 10" matches "quận 10, tp.hcm")
        if (districtInput.includes(cityLower) || cityLower.includes(districtInput)) return true;
        // Match without "Quận" prefix (e.g., "10" matches "Quận 10")
        const numberMatch = districtInput.match(/\d+/);
        if (numberMatch && cityLower.includes(numberMatch[0])) return true;
        return false;
      });
      
      if (matchedDistrict) {
        setValue('district', matchedDistrict);
      }
    }
    
    // Set datetime fields
    if (parsedData.startTime) setValue('startTime', parsedData.startTime);
    if (parsedData.endTime) setValue('endTime', parsedData.endTime);
    if (parsedData.saleStartTime) setValue('saleStartTime', parsedData.saleStartTime);
    if (parsedData.saleEndTime) setValue('saleEndTime', parsedData.saleEndTime);
    
    // Set ticket types - use replace instead of remove/append loop
    if (parsedData.ticketTypes && parsedData.ticketTypes.length > 0) {
      const newTickets = parsedData.ticketTypes.map((ticket) => ({
        ticketName: ticket.ticketName || '',
        ticketPrice: ticket.ticketPrice || 10000,
        ticketQuantity: ticket.ticketQuantity || 20,
        ticketDescription: ticket.ticketDescription || '',
      }));
      
      // Use setValue to replace all tickets at once
      setValue('ticketTypes', newTickets);
    }
    
    // Handle AI generated images (multiple)
    if (parsedData.generatedImages && parsedData.generatedImages.length > 0) {
      // Add AI generated images to preview (limit to 5 total)
      const currentCount = imagePreview.length;
      const availableSlots = 5 - currentCount;
      const imagesToAdd = parsedData.generatedImages.slice(0, availableSlots);
      
      if (imagesToAdd.length > 0) {
        setImagePreview(prev => [...imagesToAdd, ...prev]);
        setImageError('');
        toast.success(`Đã thêm ${imagesToAdd.length} ảnh AI vào sự kiện`);
      }
    }
    
    // Trigger validation after import
    validateDates();
  };

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
  
  // Generate preview data for the WYSIWYG interface
  const previewData = generatePreviewData(watch());
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Tạo sự kiện mới</h1>
            <p className="text-muted-foreground">Tạo và quản lý sự kiện của bạn</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-400"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Import bằng AI
          </Button>
        </div>
        
        {/* AI Import Dialog */}
        <ImportEventTextDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImportFromAI}
        />
        
        {/* Location Map Picker Dialog */}
        <LocationMapPicker
          open={isMapPickerOpen}
          onOpenChange={setIsMapPickerOpen}
          initialLocation={selectedCoordinates}
          currentDistrict={watch('district')}
          currentAddress={watch('address')}
          currentLocationName={watch('locationName')}
          onLocationSelect={(location) => {
            // Update coordinates
            setSelectedCoordinates({ lat: location.latitude, lng: location.longitude });
            
            // Update form fields if we got valid data
            if (location.district) {
              // Find matching district in PredefinedCities
              const matchedDistrict = PredefinedCities.find(city => 
                city.toLowerCase().includes(location.district.toLowerCase()) ||
                location.district.toLowerCase().includes(city.toLowerCase().replace(/, tp\.hcm/i, ''))
              );
              if (matchedDistrict) {
                setValue('district', matchedDistrict);
                setFieldErrors(prev => ({ ...prev, district: '' }));
              }
            }
            
            // Use full address (includes ward, district info)
            if (location.address) {
              setValue('address', location.address);
              setFieldErrors(prev => ({ ...prev, address: '' }));
            }
            
            // If locationName is empty, use short address as location name hint
            if (!watch('locationName') && location.shortAddress) {
              setValue('locationName', location.shortAddress);
              setFieldErrors(prev => ({ ...prev, locationName: '' }));
            }
            
            toast.success('Đã cập nhật vị trí từ bản đồ');
          }}
        />
        
        {/* Event Banner with Editable Image */}
         <div className="relative h-96 w-full overflow-hidden bg-gray-100 mb-6">
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
                  {/* Display error for event images if needed */}
                  {errors.images && (
                    <div className="absolute bottom-4 right-1/2 transform translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.images.message}
                    </div>
                  )}
                  {/* Display custom image error if needed */}
                  {hasValidated && imageError && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {imageError}
                    </p>
                  )}
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
          
          {/* Image Thumbnails Row */}
          {imagePreview.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
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
          )}        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                if (watch('startTime') && now < new Date(watch('startTime'))) return 1;
                // Stage 3: Sự kiện kết thúc (Event end)
                if (watch('endTime') && now < new Date(watch('endTime'))) return 2;
                // Stage 4: Sự kiện đã kết thúc
                return 3; // Event has ended
              })()}
              isEditable={true}
              minDateTime={minDateTime}
              maxDateTime={maxDateTime}
              // Thêm props để xử lý validation
              validationTimes={{
                startTime: watch('startTime'),
                endTime: watch('endTime'),
                saleStartTime: watch('saleStartTime'),
                saleEndTime: watch('saleEndTime')
              }}
              onValidationChange={handleTimelineValidationChange}
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
                {Object.entries(timelineErrors).map(([field, error]) => {
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
            {/* Ticket Options - Ticket-style Design */}
            {previewData.ticketTypes && previewData.ticketTypes.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    Loại vé có sẵn
                  </h3>
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
                  const isSoldOut = availableTickets <= 0;
                  
                  return (
                    <div
                      key={index}
                      className={`relative group ${isSoldOut ? 'opacity-60' : ''}`}
                    >
                      {/* Ticket Editing Form */}
                      {editingTicketIndex === index ? (
                        <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-4">
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
                        /* Ticket Display - Ticket-style */
                        <div className="flex bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                          {/* Left Section - Price */}
                          <div className={`relative w-32 flex-shrink-0 flex flex-col items-center justify-center p-4 ${
                            isSoldOut 
                              ? 'bg-gray-400' 
                              : ticket.ticketPrice === 0 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}>
                            {/* Decorative circles for ticket perforation effect */}
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full"></div>
                            
                            {/* Price Display */}
                            <div className="text-white text-center">
                              {ticket.ticketPrice === 0 ? (
                                <>
                                  <span className="text-2xl font-bold">MIỄN</span>
                                  <span className="block text-lg font-semibold">PHÍ</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold">
                                    {new Intl.NumberFormat('vi-VN').format(ticket.ticketPrice / 1000)}K
                                  </span>
                                  <span className="block text-xs opacity-80">VNĐ</span>
                                </>
                              )}
                            </div>
                            
                            {/* Ticket Icon */}
                            <Ticket className="w-5 h-5 text-white/50 mt-2" />
                          </div>

                          {/* Dashed Separator */}
                          <div className="relative flex items-center">
                            <div className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-gray-200"></div>
                          </div>

                          {/* Right Section - Details */}
                          <div className="flex-1 p-4 pl-6">
                            {/* Ticket Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-foreground text-lg">{ticket.ticketName}</h4>
                                  {isSoldOut && (
                                    <Badge className="bg-red-100 text-red-700 text-xs">Hết vé</Badge>
                                  )}
                                  {!isSoldOut && availableTickets <= 10 && (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs animate-pulse">
                                      Sắp hết
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {ticket.ticketDescription || "Vé tham dự sự kiện"}
                                </p>
                              </div>
                              {/* Edit/Delete buttons */}
                              <div className="flex items-center gap-1 ml-2">
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

                            {/* Ticket Stats */}
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">{ticket.soldQuantity || 0}</span>
                                    <span className="text-xs">/ {ticket.ticketQuantity}</span>
                                  </span>
                                  <span className={`font-semibold ${
                                    isSoldOut ? 'text-red-500' : availableTickets <= 10 ? 'text-orange-500' : 'text-green-600'
                                  }`}>
                                    {isSoldOut ? 'Đã bán hết' : `Còn ${availableTickets} vé`}
                                  </span>
                                </div>
                                
                                {/* Progress indicator */}
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        soldPercentage >= 90 ? 'bg-red-500' : 
                                        soldPercentage >= 70 ? 'bg-orange-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {soldPercentage.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Barcode Effect */}
                            <div className="mt-3 flex items-center gap-0.5 opacity-30">
                              {[...Array(30)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className="bg-gray-800 rounded-sm"
                                  style={{ 
                                    width: Math.random() > 0.5 ? '2px' : '3px', 
                                    height: `${12 + Math.random() * 8}px` 
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover Effect Overlay */}
                      {!isSoldOut && editingTicketIndex !== index && (
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all duration-300 pointer-events-none"></div>
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
              <h2 className="text-2xl font-bold text-foreground mb-6">Chi tiết sự kiện</h2>
              <div className="space-y-4 mb-6">
                <RichTextEditor
                  value={watch('detailedDescription')}
                  onChange={(value) => {
                    setValue('detailedDescription', value);
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
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Nhà tổ chức</h2>
              <div className="group relative flex items-center">
                {/* Avatar overlapping the card */}
                <div className="relative z-20 flex-shrink-0">
                  <div className="relative">
                    {/* Animated ring on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110" />
                    {/* White border ring */}
                    <div className="relative w-28 h-28 rounded-full bg-white p-1.5 shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-all duration-300">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rectangle card - positioned behind avatar */}
                <div className="relative z-10 -ml-14 flex-1 bg-white rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500 border border-blue-100 group-hover:border-blue-300 overflow-hidden">
                  <div className="relative flex items-center justify-between pl-20 pr-6 py-6">
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-xl group-hover:text-blue-700 transition-colors duration-300">
                        {user?.fullName || "Nhà tổ chức"}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-1 group-hover:text-gray-600 transition-colors duration-300">
                        Nhà tổ chức sự kiện
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-180">
                        <div className="space-y-1.5 group-hover:space-y-2 transition-all duration-300">
                          <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                          <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                          <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar - Form Controls */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Floating Header Card */}
            
              {/* Main Form Card */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Category Section */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-40" />
                        <div className="relative p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Danh mục</h4>
                        <p className="text-xs text-muted-foreground">Phân loại sự kiện</p>
                      </div>
                      {watch('eventCategoryId') && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
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
                      <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs">{fieldErrors.eventCategoryId || errors.eventCategoryId?.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Location Section */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-40" />
                        <div className="relative p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Địa điểm</h4>
                        <p className="text-xs text-muted-foreground">Vị trí tổ chức sự kiện</p>
                      </div>
                      {selectedCoordinates && watch('district') && watch('locationName') && watch('address') && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* Map Picker Button - FIRST, required to enable other fields */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMapPickerOpen(true)}
                        className={`w-full h-12 rounded-xl border-2 transition-all ${
                          selectedCoordinates 
                            ? 'border-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30' 
                            : 'border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 mr-2 ${selectedCoordinates ? 'text-green-600' : 'text-orange-500'}`} />
                        <span className={selectedCoordinates ? 'text-green-700 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                          {selectedCoordinates ? 'Đã chọn vị trí - Nhấn để thay đổi' : 'Chọn vị trí trên bản đồ (bắt buộc)'}
                        </span>
                      </Button>
                      
                      {/* Show selected coordinates */}
                      {selectedCoordinates && (
                        <div className="space-y-2">
                          <div className="text-xs text-green-700 bg-green-100 dark:bg-green-950/30 dark:text-green-400 px-3 py-2 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span className="font-medium">Tọa độ:</span>
                              {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                          </div>
                          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-2 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                              Vui lòng kiểm tra thông tin Quận, Huyện, Thành Phố và Tên Địa Điểm. 
                              <br></br>Tọa độ được lưu chính xác nhưng sẽ có sự sai lệch thông tin.
                          </div>
                        </div>
                      )}
                      
                      {/* Show hint if no coordinates selected */}
                      {!selectedCoordinates && (
                        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-2 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Vui lòng chọn vị trí trên bản đồ trước để mở khóa các trường bên dưới
                        </div>
                      )}

                      {/* District Select - disabled until coordinates selected */}
                      <div className="relative">
                        <Select 
                          value={watch('district')} 
                          onValueChange={(value) => {
                            setValue('district', value);
                            setFieldErrors(prev => ({ ...prev, district: '' }));
                          }}
                          disabled={!selectedCoordinates}
                        >
                          <SelectTrigger 
                            className={`h-11 rounded-xl border-2 transition-all ${
                              !selectedCoordinates 
                                ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60' 
                                : fieldErrors.district 
                                  ? 'border-red-400 bg-red-50 dark:bg-red-950/20' 
                                  : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <SelectValue placeholder="Chọn quận/huyện" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {PredefinedCities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(fieldErrors.district || (errors.district && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.district || errors.district?.message}
                          </p>
                        )}
                      </div>

                      {/* Location Name Input - disabled until coordinates selected */}
                      <div className="relative">
                        <Input
                          placeholder="Tên địa điểm (VD: Nhà văn hóa Thanh niên)"
                          value={watch('locationName') || ''}
                          onChange={(e) => {
                            setValue('locationName', e.target.value);
                            setFieldErrors(prev => ({ ...prev, locationName: '' }));
                          }}
                          onBlur={() => {
                            const value = watch('locationName');
                            if (selectedCoordinates && (!value || value.trim() === '')) {
                              setFieldErrors(prev => ({ ...prev, locationName: 'Địa điểm là bắt buộc' }));
                            }
                          }}
                          disabled={!selectedCoordinates}
                          className={`h-11 rounded-xl border-2 transition-all pl-10 ${
                            !selectedCoordinates 
                              ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60' 
                              : fieldErrors.locationName 
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/20' 
                                : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-400'
                          }`}
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        {(fieldErrors.locationName || (errors.locationName && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.locationName || errors.locationName?.message}
                          </p>
                        )}
                      </div>

                      {/* Address Textarea - disabled until coordinates selected */}
                      <div className="relative">
                        <Textarea
                          placeholder="Địa chỉ chi tiết..."
                          rows={2}
                          value={watch('address') || ''}
                          onChange={(e) => {
                            setValue('address', e.target.value);
                            setFieldErrors(prev => ({ ...prev, address: '' }));
                          }}
                          onBlur={() => {
                            const value = watch('address');
                            if (selectedCoordinates && (!value || value.trim() === '')) {
                              setFieldErrors(prev => ({ ...prev, address: 'Địa chỉ chi tiết là bắt buộc' }));
                            }
                          }}
                          disabled={!selectedCoordinates}
                          className={`rounded-xl border-2 transition-all resize-none text-sm ${
                            !selectedCoordinates 
                              ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60' 
                              : fieldErrors.address 
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/20' 
                                : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-400'
                          }`}
                        />
                        {(fieldErrors.address || (errors.address && hasValidated)) && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.address || errors.address?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-pink-500 rounded-xl blur-md opacity-40" />
                        <div className="relative p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Thẻ tag</h4>
                        <p className="text-xs text-muted-foreground">Tăng khả năng tìm kiếm</p>
                      </div>
                      {reduxSelectedTags?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-pink-600 bg-pink-100 dark:bg-pink-950/50 px-2 py-0.5 rounded-full">
                            {reduxSelectedTags.length} tag
                          </span>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    <TagSelector minimal />
                    {hasValidated && tagError && (
                      <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs">{tagError}</p>
                      </div>
                    )}
                  </div>

                  {/* Evidence Images Section */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-md opacity-40" />
                        <div className="relative p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Bằng chứng</h4>
                        <p className="text-xs text-muted-foreground">Hình ảnh xác thực</p>
                      </div>
                      {evidenceImagePreview.filter(img => img).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                            {evidenceImagePreview.filter(img => img).length}/5
                          </span>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>

                    {/* Upload Area */}
                    <label htmlFor="evidence-image-input" className="block cursor-pointer group">
                      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 text-center transition-all hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                        <div className="flex items-center justify-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">Tải ảnh bằng chứng</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG • Tối đa 5MB</p>
                          </div>
                        </div>
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

                    {/* Image Preview Grid */}
                    {evidenceImagePreview.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {evidenceImagePreview.filter(img => img !== null && img !== undefined && img !== '').map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden group ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-emerald-400 transition-all">
                            <img src={img} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeEvidenceImage(index)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                            >
                              <X className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {hasValidated && (errors.evidenceImages || evidenceImageError) && (
                      <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs">{errors.evidenceImages?.message || evidenceImageError}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-5 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent">
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                        onClick={() => {
                          validateAllFields();
                          handleSubmit((data) => onSubmit({ ...data, publish: false }))();
                        }}
                        disabled={isSubmitting || isLoading || !isTimelineValid}
                      >
                        <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        {isSubmitting || isLoading ? "Đang lưu..." : "Lưu nháp"}
                      </Button>
                      
                      <Button
                        type="button"
                        className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all group"
                        onClick={() => {
                          validateAllFields();
                          handleSubmit((data) => onSubmit({ ...data, publish: true }))();
                        }}
                        disabled={isSubmitting || isLoading || !isTimelineValid}
                      >
                        <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                        {isSubmitting || isLoading ? "Đang xuất bản..." : "Xuất bản sự kiện"}
                      </Button>
                    </div>
                    
                    {/* Helper Text */}
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Lưu nháp để chỉnh sửa sau hoặc xuất bản ngay
                    </p>
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

export default CreateEventPage;
