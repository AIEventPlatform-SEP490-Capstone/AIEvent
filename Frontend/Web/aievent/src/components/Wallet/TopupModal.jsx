import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { useWallet } from '../../hooks/useWallet';
import { 
  QrCode, 
  Loader2, 
  AlertCircle,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TopupModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { 
    topupPayment, 
    isTopupLoading, 
    topupError, 
    createTopup, 
    clearTopupError, 
    clearTopupPayment 
  } = useWallet();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [showPaymentLink, setShowPaymentLink] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleAmountSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (amount < 10000) {
      setError('Số tiền nạp ít nhất phải là: 10.000 VNĐ');
      return;
    }

    setError(null);
    createTopup(parseInt(amount));
  };

  // Real-time validation when user types
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear error when user starts typing a valid amount
    if (value && parseInt(value) >= 10000) {
      setError(null);
    }
  };

  // Handle topup payment success - automatically open checkoutUrl
  useEffect(() => {
    if (topupPayment && !isTopupLoading) {
      console.log('Topup payment received:', topupPayment);
      
      // Check if checkoutUrl exists in data object
      const checkoutUrl = topupPayment.data?.checkoutUrl || topupPayment.checkoutUrl;
      
      if (checkoutUrl) {
        console.log('Opening checkout URL:', checkoutUrl);
        
        // Try to open the URL
        const newWindow = window.open(checkoutUrl, '_blank');
        
        if (newWindow) {
          toast.success('Đang chuyển hướng đến trang thanh toán...');
          
          // Close modal after a short delay
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          // Popup blocked, show error and display link
          toast.error('Trình duyệt đã chặn popup. Vui lòng cho phép popup hoặc click vào link bên dưới.');
          setShowPaymentLink(true);
        }
      } else {
        console.error('No checkoutUrl in response:', topupPayment);
        toast.error('Không tìm thấy link thanh toán trong phản hồi');
      }
    }
  }, [topupPayment, isTopupLoading]);

  // Handle topup payment error
  useEffect(() => {
    if (topupError) {
      const errorMessage = topupError.message || topupError || 'Có lỗi xảy ra khi tạo giao dịch';
      setError(errorMessage);
      toast.error(`Không thể tạo giao dịch: ${errorMessage}`);
    }
  }, [topupError]);

  // Remove handlePaymentComplete as it's no longer needed

  // Remove copyToClipboard as it's no longer needed

  const resetModal = () => {
    setAmount('');
    setError(null);
    setShowPaymentLink(false);
    clearTopupPayment();
    clearTopupError();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Remove handleSuccess as it's no longer needed

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode className="h-5 w-5 text-blue-600" />
            </div>
            <span>Nạp tiền vào ví</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
            <form onSubmit={handleAmountSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2 block">
                    Số tiền nạp (VND)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Nhập số tiền..."
                    className="text-lg"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số tiền tối thiểu: 10.000 VND
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Số tiền nhanh
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        type="button"
                        variant="outline"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="text-sm"
                      >
                        {formatCurrency(quickAmount)}
                      </Button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isTopupLoading || !amount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isTopupLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tiếp tục'
                    )}
                  </Button>
                </div>
              </form>

              {/* Payment Link Display (when popup is blocked) */}
              {showPaymentLink && (topupPayment?.data?.checkoutUrl || topupPayment?.checkoutUrl) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Popup bị chặn</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Trình duyệt đã chặn popup. Vui lòng click vào link bên dưới để thanh toán:
                  </p>
                  <div className="space-y-2">
                    <a 
                      href={topupPayment.data?.checkoutUrl || topupPayment.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      🔗 Thanh toán ngay
                    </a>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={topupPayment.data?.checkoutUrl || topupPayment.checkoutUrl}
                        readOnly
                        className="text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = topupPayment.data?.checkoutUrl || topupPayment.checkoutUrl;
                          navigator.clipboard.writeText(url);
                          toast.success('Đã sao chép link');
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopupModal;
