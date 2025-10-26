import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import TransactionHistoryModal from '../../components/Wallet/TransactionHistoryModal';
import TopupModal from '../../components/Wallet/TopupModal';
import { 
  Wallet, 
  CreditCard, 
  History, 
  RefreshCw,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Sparkles,
  X
} from 'lucide-react';

const WalletDashboard = () => {
  const { 
    wallet, 
    transactions,
    topupPayment,
    isLoading, 
    isTransactionsLoading,
    isTopupLoading,
    error, 
    transactionsError,
    topupError,
    getWallet,
    getTransactions,
    createTopup,
    clearError,
    clearTransactionsError,
    clearTopupError,
    clearTopupPayment
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState('recent');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  useEffect(() => {
    getWallet();
  }, [getWallet]);

  const loadTransactions = useCallback(() => {
    if (wallet?.walletId) {
      // Always fetch all transactions, no status filter
      const params = {
        pageNumber: 1,
        pageSize: 10
      };
      
      getTransactions(wallet.walletId, params);
    }
  }, [wallet?.walletId, getTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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

  const getTransactionIcon = (type, direction) => {
    if (direction === 'In') {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  const getAmountColor = (direction) => {
    return direction === 'In' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800">Thất bại</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getAmountDisplay = (direction, balance) => {
    const sign = direction === 'In' ? '+' : '-';
    return `${sign}${formatCurrency(balance)}`;
  };

  // Sort transactions by createdAt (newest first)
  // Create a new array to avoid mutating the original
  const sortedTransactions = transactions.items ? 
    [...transactions.items].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ) : [];
  
  const pendingTransactions = sortedTransactions.filter(t => t.status === 'Pending');
  const recentTransactions = sortedTransactions.filter(t => t.status === 'Success');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Đang tải thông tin ví...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Có lỗi xảy ra: {error.message}</p>
          <Button onClick={getWallet} variant="outline">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Ví điện tử
              </h1>
              <p className="text-gray-600 text-sm">Quản lý tài chính</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={getWallet}
            className="flex items-center space-x-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Làm mới</span>
          </Button>
        </div>

        {/* Wallet Balance Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 shadow-2xl border-0 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">Số dư của bạn</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-5xl font-bold mb-2 tracking-tight">
                      {formatCurrency(wallet?.balance || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-white/90 text-sm mb-1">
                      {sortedTransactions.length > 0 ? (
                        <>
                          <span className="font-medium">Giao dịch gần nhất:</span> {formatDate(sortedTransactions[0].createdAt)}
                        </>
                      ) : (
                        `Cập nhật lần cuối: ${formatDate(wallet?.updatedAt)}`
                      )}
                    </p>
                    {sortedTransactions.length > 0 && (
                      <p className="text-xs text-white/70 truncate">
                        {sortedTransactions[0].description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-white/90 text-sm font-medium">AIEvent - Ví điện tử</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200"
            onClick={() => setShowTopupModal(true)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Nạp tiền QR</h3>
              <p className="text-sm text-gray-600">Quét mã QR để nạp tiền nhanh chóng và an toàn</p>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Nạp bằng thẻ</h3>
              <p className="text-sm text-gray-600">Thẻ tín dụng/ghi nợ được hỗ trợ</p>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200"
            onClick={() => setShowHistoryModal(true)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <History className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Lịch sử</h3>
              <p className="text-sm text-gray-600">Xem và quản lý tất cả giao dịch</p>
            </div>
          </Card>
        </div>

        {/* Processing Alert */}
        {pendingTransactions.length > 0 && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <RefreshCw className="h-6 w-6 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-lg">
                    Có {pendingTransactions.length} giao dịch đang xử lý
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Vui lòng kiểm tra và hoàn tất các giao dịch chưa hoàn thành
                  </p>
                </div>
                <div className="bg-amber-100 px-3 py-1 rounded-full">
                  <span className="text-amber-800 font-semibold text-sm">
                    {pendingTransactions.length} đang chờ
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Transaction Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-gray-100 p-2 rounded-xl">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'recent'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Gần đây
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'processing'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Đang xử lý</span>
                {pendingTransactions.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingTransactions.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Transaction Content */}
        <Card className="shadow-xl border-0">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {activeTab === 'recent' && 'Giao dịch gần đây'}
                {activeTab === 'all' && 'Tất cả giao dịch'}
                {activeTab === 'processing' && 'Giao dịch đang xử lý'}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Cập nhật thời gian thực</span>
              </div>
            </div>

            {isTransactionsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Đang tải giao dịch...</p>
                <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </div>
            ) : transactionsError ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải giao dịch</h3>
                <p className="text-red-600 mb-6 text-center max-w-md">
                  {transactionsError.message || 'Có lỗi xảy ra khi tải dữ liệu giao dịch'}
                </p>
                <Button onClick={() => wallet?.walletId && getTransactions(wallet.walletId)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTransactions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có giao dịch nào</h3>
                    <p className="text-gray-500">Bắt đầu với giao dịch đầu tiên của bạn</p>
                  </div>
                ) : (
                  sortedTransactions.map((transaction) => (
                    <div key={transaction.orderCode} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${
                            transaction.direction === 'In' 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}>
                            {getTransactionIcon(transaction.type, transaction.direction)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">
                              {transaction.description}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(transaction.createdAt)}</span>
                              </span>
                              <span>•</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {transaction.orderCode}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getAmountColor(transaction.direction)} mb-2`}>
                            {getAmountDisplay(transaction.direction, transaction.balance)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Transaction History Modal */}
        <TransactionHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          walletId={wallet?.walletId}
        />

        {/* Topup Modal */}
        {showTopupModal && (
          <TopupModal
            isOpen={showTopupModal}
            onClose={() => {
              setShowTopupModal(false);
              clearTopupPayment();
              clearTopupError();
            }}
            onSuccess={() => {
              setShowTopupModal(false);
              getWallet(); // Refresh wallet data
              loadTransactions(); // Refresh transactions
              clearTopupPayment();
              clearTopupError();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;