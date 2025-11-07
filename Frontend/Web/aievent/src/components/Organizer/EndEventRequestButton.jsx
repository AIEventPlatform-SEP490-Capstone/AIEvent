import React, { useState, useEffect } from 'react';
import { useEndEventRequests } from '../../hooks/useEndEventRequests';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import { EndEventStatus } from '../../constants/eventConstants';

// Import Cloudinary utility
import { uploadImagesToCloudinary } from '../../utils/cloudinary';

// Import wallet API
import { walletAPI } from '../../api/walletAPI';

const EndEventRequestButton = ({ event, onEndEventRequested }) => {
  const { user } = useAuth();
  const { requestEndEvent, loading } = useEndEventRequests();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    eventId: event?.eventId || '',
    paymentInformationId: '',
    summary: '',
    evidenceImages: []
  });
  const [errors, setErrors] = useState({});
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);

  // Check if the event can be requested to end
  // The button should be active if the current date is 10 days after the event end date
  const canRequestEnd = () => {
    // Temporarily disable condition checking for testing
    // if (!event?.endTime) return false;
    
    // const eventEndDate = new Date(event.endTime);
    // const tenDaysAfterEventEnd = new Date(eventEndDate);
    // tenDaysAfterEventEnd.setDate(tenDaysAfterEventEnd.getDate() + 10);
    
    // const currentDate = new Date();
    
    // return currentDate >= tenDaysAfterEventEnd;
    return true; // Always allow for testing
  };

  const isActive = canRequestEnd();

  // Fetch payment informations when modal opens
  useEffect(() => {
    if (showModal) {
      fetchPaymentInformations();
    }
  }, [showModal]);

  const fetchPaymentInformations = async () => {
    setIsLoadingPaymentInfo(true);
    try {
      const response = await walletAPI.getPaymentInformations({ pageNumber: 1, pageSize: 100 });
      if (response.data) {
        setPaymentInformations(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching payment informations:', error);
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  };

  const handleOpenModal = () => {
    if (!isActive) return;
    setFormData({
      eventId: event?.eventId || '',
      paymentInformationId: '',
      summary: '',
      evidenceImages: []
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      eventId: event?.eventId || '',
      paymentInformationId: '',
      summary: '',
      evidenceImages: []
    });
    setErrors({});
    setPaymentInformations([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      evidenceImages: files
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.paymentInformationId) {
      newErrors.paymentInformationId = 'Thông tin thanh toán là bắt buộc';
    }
    
    if (formData.evidenceImages.length === 0) {
      newErrors.evidenceImages = 'Ít nhất một hình ảnh bằng chứng là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Upload evidence images to Cloudinary and get URLs
      let evidenceImageUrls = [];
      if (formData.evidenceImages.length > 0) {
        evidenceImageUrls = await uploadImagesToCloudinary(formData.evidenceImages);
      }
      
      // Create request data object with image URLs
      const requestData = {
        eventId: formData.eventId,
        paymentInformationId: formData.paymentInformationId,
        summary: formData.summary,
        evidenceImages: evidenceImageUrls // Send Cloudinary URLs instead of File objects
      };
      
      const result = await requestEndEvent(requestData);
      
      if (result) {
        handleCloseModal();
        if (onEndEventRequested) {
          onEndEventRequested();
        }
      }
    } catch (error) {
      console.error('Error uploading images or requesting end event:', error);
    }
  };

  // Format payment information display name
  const formatPaymentInfoName = (paymentInfo) => {
    if (!paymentInfo) return '';
    return `${paymentInfo.bankName} - ${paymentInfo.accountHolderName} (${paymentInfo.accountNumber})`;
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={!isActive || loading}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Đang xử lý...' : 'Yêu cầu kết thúc'}
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Yêu cầu kết thúc sự kiện">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thông tin thanh toán *
            </label>
            {isLoadingPaymentInfo ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                Đang tải thông tin thanh toán...
              </div>
            ) : paymentInformations.length > 0 ? (
              <select
                name="paymentInformationId"
                value={formData.paymentInformationId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.paymentInformationId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn thông tin thanh toán</option>
                {paymentInformations.map((paymentInfo) => (
                  <option 
                    key={paymentInfo.paymentInformationId} 
                    value={paymentInfo.paymentInformationId}
                  >
                    {formatPaymentInfoName(paymentInfo)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                Không có thông tin thanh toán nào
              </div>
            )}
            {errors.paymentInformationId && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentInformationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tóm tắt
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nhập tóm tắt sự kiện"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh bằng chứng *
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.evidenceImages ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.evidenceImages && (
              <p className="mt-1 text-sm text-red-600">{errors.evidenceImages}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default EndEventRequestButton;