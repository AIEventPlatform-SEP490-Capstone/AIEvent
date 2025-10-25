import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  X, 
  Calendar, 
  Hash, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hoàn thành</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Đang xử lý</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Thất bại</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'Topup':
        return 'Nạp tiền';
      case 'Payment':
        return 'Thanh toán';
      case 'Refund':
        return 'Hoàn tiền';
      case 'Withdraw':
        return 'Rút tiền';
      default:
        return type;
    }
  };

  const getAmountDisplay = (direction, balance) => {
    const sign = direction === 'In' ? '+' : '-';
    return `${sign}${formatCurrency(balance)}`;
  };

  const getAmountColor = (direction) => {
    return direction === 'In' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${
              transaction.direction === 'In' 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              {transaction.direction === 'In' ? (
                <ArrowUpRight className="h-7 w-7 text-green-600" />
              ) : (
                <ArrowDownLeft className="h-7 w-7 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Chi tiết giao dịch
              </h2>
              <p className="text-gray-600 text-sm">Thông tin chi tiết về giao dịch</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Transaction Info */}
            <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {transaction.description}
                </h3>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Loại giao dịch</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTypeDisplay(transaction.type)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Số tiền</label>
                  <p className={`text-3xl font-bold ${getAmountColor(transaction.direction)}`}>
                    {getAmountDisplay(transaction.direction, transaction.balance)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Transaction Details */}
            <Card className="p-8 shadow-lg border-0">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="h-5 w-5 text-blue-600" />
                </div>
                <span>Thông tin chi tiết</span>
              </h4>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Hash className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Mã giao dịch</label>
                    <p className="text-lg font-mono text-gray-900 break-all mt-1">
                      {transaction.orderCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Thời gian</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`p-3 rounded-xl ${
                    transaction.direction === 'In' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {transaction.direction === 'In' ? (
                      <ArrowUpRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Hướng giao dịch</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {transaction.direction === 'In' ? 'Tiền vào' : 'Tiền ra'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">ID</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Wallet ID</label>
                    <p className="text-lg font-mono text-gray-900 break-all mt-1">
                      {transaction.walletId}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Information */}
            {transaction.status === 'Pending' && (
              <Card className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-amber-800">Giao dịch đang xử lý</h4>
                    <p className="text-amber-700 mt-2">
                      Giao dịch của bạn đang được xử lý. Vui lòng chờ trong giây lát.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {transaction.status === 'Failed' && (
              <Card className="p-8 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-red-800">Giao dịch thất bại</h4>
                    <p className="text-red-700 mt-2">
                      Giao dịch không thể hoàn thành. Vui lòng thử lại hoặc liên hệ hỗ trợ.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-8 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-3 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Đóng
            </Button>
            {transaction.status === 'Failed' && (
              <Button className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Thử lại
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
