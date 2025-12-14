import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Wallet, CreditCard, Building2, User, Copy, CheckCircle2, Trash2, MapPin, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { walletAPI } from '../../api/walletAPI';

const PaymentInfoTab = () => {
  const { user } = useAuth();
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [paymentInfoError, setPaymentInfoError] = useState(null);
  const hasFetchedPaymentInfo = useRef(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch payment information
  const fetchPaymentInformations = useCallback(async () => {
    if (!user) return;

    setIsLoadingPaymentInfo(true);
    setPaymentInfoError(null);

    try {
      const response = await walletAPI.getPaymentInformations({ pageNumber: 1, pageSize: 10 });
      if (response.data) {
        const items = response.data.items || [];
        setPaymentInformations(items);
      }
    } catch (error) {
      console.error('Error fetching payment informations:', error);
      setPaymentInfoError(error.message || 'Không thể tải thông tin thẻ');
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hasFetchedPaymentInfo.current && user) {
      hasFetchedPaymentInfo.current = true;
      fetchPaymentInformations();
    }
  }, [user, fetchPaymentInformations]);

  const handleCopyToClipboard = async (text, accountNumber) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccountNumber(accountNumber);
      setTimeout(() => setCopiedAccountNumber(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeletePaymentInfo = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin thẻ này? Sau khi xóa bạn có thể thêm thẻ mới.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await walletAPI.deletePaymentInformation(id);
      await fetchPaymentInformations();
    } catch (error) {
      console.error('Error deleting payment information:', error);
      alert('Không thể xóa thông tin thẻ: ' + (error.message || 'Có lỗi xảy ra'));
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPaymentInfo = paymentInformations.length > 0;
  const singlePaymentInfo = paymentInformations[0];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-blue-600" />
            Thông tin thẻ
          </h2>
          <p className="text-gray-600 text-sm">Quản lý thông tin tài khoản ngân hàng của bạn (chỉ hỗ trợ 1 thẻ)</p>
        </div>

        {!hasPaymentInfo && (
          <Button
            onClick={() => setIsAddPaymentModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Thêm thẻ
          </Button>
        )}
      </div>

      {isLoadingPaymentInfo ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2 text-sm">Đang tải thông tin thẻ...</p>
        </div>
      ) : paymentInfoError ? (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-red-700 text-sm font-medium">{paymentInfoError}</p>
            </div>
          </div>
        </div>
      ) : !hasPaymentInfo ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">Chưa có thông tin thẻ nào được lưu</p>
          <p className="text-gray-500 text-sm mt-1">Thêm thẻ để thanh toán nhanh chóng</p>
        </div>
      ) : (
        <>
          {/* Hiển thị chỉ 1 thẻ duy nhất */}
          <div className="max-w-2xl mx-auto">
            <div
              key={singlePaymentInfo.paymentInformationId}
              className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#D1D5DB]"
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gray-300 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-300 rounded-full -ml-16 -mb-16"></div>
              </div>

              <div className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {singlePaymentInfo.bankLogo ? (
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <img
                          src={singlePaymentInfo.bankLogo}
                          alt={singlePaymentInfo.bankName}
                          className="w-20 h-20 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <Building2 className="w-20 h-20 text-gray-700" />
                      </div>
                    )}
                    <div>
                      <Badge className="bg-gray-300/40 text-gray-800 border border-gray-300/50 text-xs px-3 py-1 shadow-sm">
                        {singlePaymentInfo.bankShortName || singlePaymentInfo.bankName}
                      </Badge>
                      {singlePaymentInfo.branchName && (
                        <p className="text-gray-600 text-xs mt-1">{singlePaymentInfo.branchName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePaymentInfo(singlePaymentInfo.paymentInformationId)}
                    disabled={isDeleting}
                    className="w-10 h-10 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center border border-gray-200 hover:border-red-300 shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    title="Xóa thông tin thẻ"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900 tracking-wider">
                      {singlePaymentInfo.accountNumber}
                    </p>
                    <button
                      onClick={() => handleCopyToClipboard(singlePaymentInfo.accountNumber, singlePaymentInfo.accountNumber)}
                      className="ml-3 p-2 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:scale-105 shadow-sm"
                      title="Sao chép số tài khoản"
                    >
                      {copiedAccountNumber === singlePaymentInfo.accountNumber ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-gray-200 shadow-sm">
                      <User className="w-4 h-4 text-gray-700" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">
                      {singlePaymentInfo.accountHolderName}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 opacity-10">
                  <div className="grid grid-cols-4 gap-1">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal thêm thẻ - chỉ mở khi chưa có thẻ */}
      <Dialog open={isAddPaymentModalOpen && !hasPaymentInfo} onOpenChange={setIsAddPaymentModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <AddPaymentModal
              onClose={() => setIsAddPaymentModalOpen(false)}
              onSuccess={() => {
                setIsAddPaymentModalOpen(false);
                fetchPaymentInformations();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Payment Information Modal Component
const AddPaymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    bankBin: '',
    bankShortName: '',
    bankLogo: ''
  });
  const [banks, setBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const response = await walletAPI.getBanksFromVietnamQR();
        if (response.data) {
          setBanks(response.data);
        }
      } catch (error) {
        console.error('Error loading banks:', error);
        setError('Không thể tải danh sách ngân hàng');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankSelect = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankBin: bank.bin,
      bankShortName: bank.shortName,
      bankLogo: bank.logo
    }));
    setSearchTerm('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.accountHolderName.trim()) {
      setError('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (formData.accountNumber.trim().length < 6) {
      setError('Số tài khoản phải có ít nhất 6 ký tự');
      return;
    }
    if (!formData.bankName) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }
    if (!formData.branchName.trim()) {
      setError('Vui lòng nhập tên chi nhánh');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await walletAPI.createPaymentInformation(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating payment information:', error);

      // Xử lý error message từ server và chuyển sang tiếng Việt
      let errorMessage = 'Không thể thêm thông tin thanh toán';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Xử lý error từ validation server
        if (errorData.errors && typeof errorData.errors === 'object') {
          const firstError = Object.values(errorData.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            const serverMessage = firstError[0];
            // Map các thông báo lỗi phổ biến từ server sang tiếng Việt
            if (serverMessage.includes('AccountNumber') || serverMessage.includes('account number')) {
              if (serverMessage.includes('minimum') || serverMessage.includes('least')) {
                errorMessage = 'Số tài khoản phải có ít nhất 6 ký tự';
              } else if (serverMessage.includes('required')) {
                errorMessage = 'Vui lòng nhập số tài khoản';
              } else {
                errorMessage = 'Số tài khoản không hợp lệ';
              }
            } else if (serverMessage.includes('AccountHolderName') || serverMessage.includes('account holder')) {
              errorMessage = 'Tên chủ tài khoản không hợp lệ';
            } else if (serverMessage.includes('Bank') || serverMessage.includes('bank')) {
              errorMessage = 'Thông tin ngân hàng không hợp lệ';
            } else if (serverMessage.includes('Branch') || serverMessage.includes('branch')) {
              errorMessage = 'Thông tin chi nhánh không hợp lệ';
            } else if (serverMessage.includes('duplicate') || serverMessage.includes('already exists')) {
              errorMessage = 'Thông tin thanh toán này đã tồn tại';
            } else {
              errorMessage = serverMessage;
            }
          }
        } else if (errorData.message) {
          // Xử lý error message trực tiếp
          const serverMessage = errorData.message.toLowerCase();
          if (serverMessage.includes('accountnumber') || serverMessage.includes('account number')) {
            if (serverMessage.includes('minimum') || serverMessage.includes('least') || serverMessage.includes('6')) {
              errorMessage = 'Số tài khoản phải có ít nhất 6 ký tự';
            } else if (serverMessage.includes('required')) {
              errorMessage = 'Vui lòng nhập số tài khoản';
            } else {
              errorMessage = 'Số tài khoản không hợp lệ';
            }
          } else if (serverMessage.includes('duplicate') || serverMessage.includes('already exists')) {
            errorMessage = 'Thông tin thanh toán này đã tồn tại';
          } else if (serverMessage.includes('invalid')) {
            errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại';
          } else {
            errorMessage = errorData.message;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Hết thời gian chờ. Vui lòng thử lại';
        } else if (errorMsg.includes('500')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
        } else if (errorMsg.includes('400')) {
          errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại';
        } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
          Thêm thẻ ngân hàng mới
        </DialogTitle>
        <p className="text-gray-600 text-sm">Thêm thông tin tài khoản ngân hàng của bạn để sử dụng</p>
      </DialogHeader>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full lg:w-[28rem] xl:w-[30rem] flex-shrink-0 space-y-6 pr-1 lg:pr-3 pb-6 lg:pb-0 lg:max-h-[70vh] lg:overflow-y-auto">
          {/* Bank Selection */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              Chọn ngân hàng <span className="text-red-500">*</span>
            </Label>
            {isLoadingBanks ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 text-sm mt-3 font-medium">Đang tải danh sách ngân hàng...</p>
              </div>
            ) : (
              <div className="relative">
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm ngân hàng..."
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>

                {/* Selected Bank Display */}
                {formData.bankName && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {formData.bankLogo && (
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {!formData.bankLogo && (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{formData.bankShortName}</p>
                          <p className="text-xs text-gray-600">{formData.bankName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          bankName: '',
                          bankBin: '',
                          bankShortName: '',
                          bankLogo: ''
                        }))}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors border border-red-200"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank List */}
                {!formData.bankName && (
                  <div className="border-2 border-gray-200 rounded-xl max-h-60 sm:max-h-64 lg:max-h-72 overflow-y-auto shadow-inner bg-gray-50">
                    {filteredBanks.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Không tìm thấy ngân hàng</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y divide-gray-200">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => handleBankSelect(bank)}
                            className="p-4 hover:bg-blue-50 transition-colors flex items-center space-x-3 text-left w-full group"
                          >
                            {bank.logo ? (
                              <div className="w-12 h-12 bg-white rounded-lg p-2 border border-gray-200 group-hover:border-blue-300 shadow-sm">
                                <img
                                  src={bank.logo}
                                  alt={bank.shortName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{bank.shortName}</p>
                              <p className="text-xs text-gray-600 truncate">{bank.name}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <Label htmlFor="accountHolderName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Tên chủ tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) => handleInputChange('accountHolderName', e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 uppercase font-semibold tracking-wide"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên in hoa giống trên thẻ ngân hàng</p>
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
              Số tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => {
                // Chỉ không cho phép ký tự đặc biệt và khoảng trắng
                // Cho phép: chữ, số
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                handleInputChange('accountNumber', value);
                // Xóa error khi user bắt đầu nhập
                if (error && error.includes('số tài khoản')) {
                  setError(null);
                }
              }}
              placeholder="0337252208"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 font-mono text-lg tracking-widest"
              type="text"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">Số tài khoản không có dấu cách hoặc ký tự đặc biệt</p>
          </div>

          {/* Branch Name */}
          <div>
            <Label htmlFor="branchName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              placeholder="Ví dụ: Hồ Chí Minh, Hà Nội..."
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên chi nhánh hoặc thành phố</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Card Preview */}
        <div className="flex-1 min-w-0 w-full">
          <div className="lg:sticky lg:top-0">
            {formData.bankName ? (
              <div className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#D1D5DB]">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gray-300 rounded-full -mr-24 -mt-24"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-300 rounded-full -ml-16 -mb-16"></div>
                </div>

                {/* Card Content */}
                <div className="relative p-5">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {formData.bankLogo ? (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-20 h-20 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <Building2 className="w-20 h-20 text-gray-700" />
                        </div>
                      )}
                      <div>
                        <Badge className="bg-gray-300/40 text-gray-800 border border-gray-300/50 text-xs px-3 py-1 shadow-sm">
                          {formData.bankShortName || formData.bankName}
                        </Badge>
                        <p className="text-gray-600 text-xs mt-1">
                          {formData.branchName || 'Chưa nhập'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                        <CreditCard className="w-4 h-4 text-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Account Number Section */}
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900 tracking-wider">
                        {formData.accountNumber || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>

                  {/* Account Holder Section */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-gray-200 shadow-sm">
                        <User className="w-4 h-4 text-gray-700" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formData.accountHolderName || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Decoration */}
                  <div className="absolute bottom-3 right-3 opacity-10">
                    <div className="grid grid-cols-4 gap-1">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl p-10 sm:p-12 text-center min-h-[320px] sm:min-h-[400px] flex flex-col justify-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-blue-100 transform hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-3">Xem trước thẻ ngân hàng</h3>
                <p className="text-base text-gray-600 mb-6">Nhập thông tin bên trái để xem thẻ ngân hàng của bạn</p>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <MapPin className="w-5 h-5" />
                  <p className="text-sm font-medium">Hãy bắt đầu bằng việc chọn ngân hàng</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:space-x-3 gap-3 sm:gap-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 hover:border-gray-400 px-6 w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 px-8 w-full sm:w-auto"
          >
            {isSubmitting ? 'Đang thêm...' : 'Thêm thẻ'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoTab;

