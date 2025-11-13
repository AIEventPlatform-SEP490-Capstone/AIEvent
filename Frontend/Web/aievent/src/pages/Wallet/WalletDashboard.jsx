import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { walletAPI } from '../../api/walletAPI';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
  X,
  Plus,
  Building2,
  User,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
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

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recent');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);
  const [paymentPagination, setPaymentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

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

  const handleCopyToClipboard = async (text, accountNumber) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccountNumber(accountNumber);
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fetchPaymentInformations = useCallback(async (pageNumber = 1) => {
    setIsLoadingPaymentInfo(true);

    try {
      const response = await walletAPI.getPaymentInformations({ pageNumber, pageSize: 10 });
      if (response.data) {
        setPaymentInformations(response.data.items || []);
        setPaymentPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
      }
    } catch (error) {
      console.error('Error fetching payment informations:', error);
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  }, []);

  const handleOpenWithdrawModal = async () => {
    setShowWithdrawModal(true);
    setSelectedPaymentInfo(null);
    setWithdrawAmount('');
    setWithdrawDescription('');
    setWithdrawError(null);
    setWithdrawSuccess(false);
    await fetchPaymentInformations(1);
  };

  const handleSelectPaymentInfo = (paymentInfo) => {
    setSelectedPaymentInfo(paymentInfo);
    setWithdrawError(null);
    setWithdrawSuccess(false);
  };

  const handleWithdraw = async () => {
    if (!selectedPaymentInfo) {
      setWithdrawError('Vui lòng chọn thông tin thanh toán');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount < 10000) {
      setWithdrawError('Số tiền rút ít nhất phải là: 10.000 VNĐ');
      return;
    }

    // Phí trừ từ số tiền rút, không trừ từ ví
    if (amount <= 4000) {
      setWithdrawError(`Số tiền rút phải lớn hơn phí ${formatCurrency(4000)}. Số tiền thực tế nhận được sẽ là ${formatCurrency(amount - 4000)}`);
      return;
    }
    
    if (amount > (wallet?.balance || 0)) {
      setWithdrawError(`Số dư không đủ. Bạn cần ${formatCurrency(amount)}, nhưng số dư hiện tại chỉ có ${formatCurrency(wallet?.balance || 0)}`);
      return;
    }

    if (!withdrawDescription || withdrawDescription.trim().length === 0) {
      setWithdrawError('Vui lòng nhập mô tả cho giao dịch rút tiền');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    try {
      await walletAPI.withdraw({
        paymentInfoId: selectedPaymentInfo.paymentInformationId,
        amount: amount,
        description: withdrawDescription.trim()
      });

      await getWallet();
      await loadTransactions();

      // Show success notification
      setWithdrawSuccess(true);

      // Auto close modal after 2 seconds
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSelectedPaymentInfo(null);
        setWithdrawAmount('');
        setWithdrawDescription('');
        setWithdrawError(null);
        setWithdrawSuccess(false);
      }, 2500);
    } catch (error) {
      console.error('Error withdrawing:', error);

      if (error.response && error.response.status === 500) {
        setWithdrawError('Lỗi server. Hệ thống đang gặp sự cố, vui lòng thử lại sau vài phút.');
      } else {
        setWithdrawError('Đã có lỗi xảy ra, vui lòng kiểm tra thông tin thanh toán và thử lại!');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

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
                Ví của tôi
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
                  <p className="text-white/90 text-sm font-medium">AIEvent - Ví của tôi</p>
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

          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200"
            onClick={handleOpenWithdrawModal}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Rút tiền</h3>
              <p className="text-sm text-gray-600">Số tài khoản ngân hàng được hỗ trợ</p>
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
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'recent'
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              Gần đây
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'processing'
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
                  sortedTransactions.map((transaction, idx) => (
                    <div key={transaction.orderCode || `transaction-${transaction.createdAt}-${idx}`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${transaction.direction === 'In'
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

        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header - Gradient Background */}
              <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-8 py-6">
                <div className="absolute inset-0 bg-white/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Rút tiền về tài khoản</h2>
                      <p className="text-white/90 text-sm mt-1">Chuyển tiền nhanh chóng và an toàn</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                  >
                    <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
                {isLoadingPaymentInfo ? (
                  <div className="text-center py-20">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                    </div>
                    <p className="text-gray-700 mt-6 font-semibold text-lg">Đang tải thông tin thanh toán</p>
                    <p className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát...</p>
                  </div>
                ) : paymentInformations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center transform rotate-6">
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <X className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Chưa có thông tin thanh toán</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Bạn cần thêm ít nhất một tài khoản ngân hàng để thực hiện rút tiền
                    </p>
                    <Button
                      onClick={() => {
                        setShowWithdrawModal(false);
                        navigate('/profile?tab=card');
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-base rounded-2xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Thêm tài khoản ngân hàng
                    </Button>
                  </div>
                ) : selectedPaymentInfo ? (
                  <>
                    {/* Success State */}
                    {withdrawSuccess ? (
                      <div className="text-center py-16">
                        <div className="relative inline-block mb-8">
                          <div className="w-28 h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                            <CheckCircle2 className="w-16 h-16 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-400 rounded-full animate-ping"></div>
                          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-teal-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Yêu cầu rút tiền thành công!</h3>
                        <p className="text-gray-600 text-lg mb-8">Giao dịch của bạn đang được xử lý</p>
                        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-green-200 max-w-lg mx-auto shadow-lg">
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-200">
                            <span className="text-gray-600 font-medium">Số tiền rút</span>
                            <span className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(withdrawAmount))}</span>
                          </div>
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-200">
                            <span className="text-gray-600 font-medium">Ngân hàng</span>
                            <span className="font-bold text-gray-900">{selectedPaymentInfo.bankShortName || selectedPaymentInfo.bankName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">Số tài khoản</span>
                            <span className="font-mono font-bold text-gray-900">{selectedPaymentInfo.accountNumber}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Withdraw Form */}
                        <div className="space-y-6">
                          {/* Selected Payment Card - White-gray gradient style */}
                          <div className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-[#D1D5DB]">
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
                                  {selectedPaymentInfo.bankLogo ? (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                      <img
                                        src={selectedPaymentInfo.bankLogo}
                                        alt={selectedPaymentInfo.bankName}
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
                                      {selectedPaymentInfo.bankShortName || selectedPaymentInfo.bankName}
                                    </Badge>
                                    {selectedPaymentInfo.branchName && (
                                      <p className="text-gray-600 text-xs mt-1">{selectedPaymentInfo.branchName}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                                    <CreditCard className="w-4 h-4 text-gray-700" />
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedPaymentInfo(null);
                                      setWithdrawAmount('');
                                      setWithdrawDescription('');
                                      setWithdrawError(null);
                                      setWithdrawSuccess(false);
                                    }}
                                    disabled={isWithdrawing || withdrawSuccess}
                                    className="w-8 h-8 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 hover:border-gray-300 shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                    title="Thay đổi"
                                  >
                                    <X className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Account Number Section */}
                              <div className="mb-3">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xl font-bold text-gray-900 tracking-wider">
                                    {selectedPaymentInfo.accountNumber}
                                  </p>
                                  <button
                                    onClick={() => handleCopyToClipboard(selectedPaymentInfo.accountNumber, selectedPaymentInfo.accountNumber)}
                                    className="ml-3 p-2 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:scale-105 shadow-sm"
                                    title="Sao chép số tài khoản"
                                  >
                                    {copiedAccountNumber === selectedPaymentInfo.accountNumber ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-gray-700" />
                                    )}
                                  </button>
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
                                    {selectedPaymentInfo.accountHolderName}
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

                          {/* Balance Display */}
                          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-md">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-emerald-700 text-sm font-semibold mb-2 flex items-center">
                                  <Wallet className="w-5 h-5 mr-2" />
                                  Số dư khả dụng
                                </p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                  {formatCurrency(wallet?.balance || 0)}
                                </p>
                              </div>
                              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                                <DollarSign className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Amount Input */}
                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-800 flex items-center">
                              <ArrowDownLeft className="w-4 h-4 mr-2 text-emerald-600" />
                              Số tiền rút
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                  setWithdrawAmount(e.target.value.replace(/[^\d]/g, ''));
                                  setWithdrawError(null);
                                }}
                                placeholder="Nhập số tiền (tối thiểu 10.000 VNĐ)"
                                className="h-16 text-2xl font-bold pl-6 pr-24 border-2 border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl transition-all"
                                min="10000"
                                disabled={isWithdrawing}
                              />
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                                VNĐ
                              </div>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="mt-4">
                              <p className="text-xs text-gray-600 mb-2 font-medium">Chọn nhanh:</p>
                              <div className="flex flex-wrap gap-2">
                                {[50000, 100000, 200000, 500000, 1000000].map((amount) => {
                                  if (wallet?.balance && amount > wallet.balance) return null;
                                  const isSelected = withdrawAmount === amount.toString();
                                  return (
                                    <button
                                      key={amount}
                                      type="button"
                                      onClick={() => {
                                        setWithdrawAmount(amount.toString());
                                        setWithdrawError(null);
                                      }}
                                      disabled={isWithdrawing}
                                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg transform scale-105'
                                          : 'bg-white text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:shadow-md'
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      {amount >= 1000000 
                                        ? `${amount / 1000000}M` 
                                        : amount >= 1000 
                                          ? `${amount / 1000}k` 
                                          : amount}
                                    </button>
                                  );
                                })}
                                {wallet?.balance && wallet.balance >= 10000 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWithdrawAmount(wallet.balance.toString());
                                      setWithdrawError(null);
                                    }}
                                    disabled={isWithdrawing}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                                      withdrawAmount === wallet.balance.toString()
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg transform scale-105'
                                        : 'bg-white text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:shadow-md'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    Rút hết
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Số tiền sẽ rút - UI đẹp hơn */}
                            {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) >= 10000 && (
                              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 shadow-xl border-2 border-emerald-400">
                                {/* Background decoration */}
                                <div className="absolute inset-0 opacity-20">
                                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                                </div>
                                
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                        <ArrowDownLeft className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-white/90 text-xs font-medium uppercase tracking-wider">Số tiền sẽ rút</p>
                                        <p className="text-white text-lg font-semibold">Về tài khoản ngân hàng</p>
                                      </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                                      <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  
                                  {/* Chi tiết số tiền */}
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/20">
                                      <p className="text-white/90 text-sm font-medium">Số tiền bạn muốn rút</p>
                                      <p className="text-2xl font-bold text-white">
                                        {formatCurrency(parseFloat(withdrawAmount))}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <p className="text-white/90 text-sm font-medium">Phí rút tiền (trừ từ số tiền rút)</p>
                                      </div>
                                      <p className="text-lg font-semibold text-white/90">
                                        -{formatCurrency(4000)}
                                      </p>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-white/20">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-white/90 text-sm font-semibold">Số tiền thực tế nhận được</p>
                                        <p className="text-3xl font-bold text-white tracking-tight">
                                          {formatCurrency(parseFloat(withdrawAmount) - 4000)}
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                        <p className="text-white/90 text-xs font-medium">Số tiền trừ từ ví</p>
                                        <p className="text-xl font-bold text-white/90">
                                          {formatCurrency(parseFloat(withdrawAmount))}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {wallet?.balance && parseFloat(withdrawAmount) <= wallet.balance && (
                                    <div className="mt-3 flex items-center space-x-2 text-white/90 text-sm">
                                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-xs">✓</span>
                                      </div>
                                      <span>Số dư còn lại: <span className="font-bold">{formatCurrency(wallet.balance - parseFloat(withdrawAmount))}</span></span>
                                    </div>
                                  )}
                                  
                                  {wallet?.balance && parseFloat(withdrawAmount) > wallet.balance && (
                                    <div className="mt-3 flex items-center space-x-3 text-white text-sm bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-xl p-4 border-2 border-red-600 shadow-md">
                                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <X className="w-5 h-5 text-white" />
                                      </div>
                                      <span className="font-semibold">Số dư không đủ (cần thêm {formatCurrency(parseFloat(withdrawAmount) - wallet.balance)})</span>
                                    </div>
                                  )}
                                  
                                  {parseFloat(withdrawAmount) <= 4000 && (
                                    <div className="mt-3 flex items-center space-x-3 text-white text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-xl p-4 border-2 border-amber-600 shadow-md">
                                      <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <X className="w-5 h-5 text-white" />
                                      </div>
                                      <span className="font-semibold">Số tiền rút phải lớn hơn phí ({formatCurrency(4000)})</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 flex items-center">
                                <span className="font-semibold text-emerald-600 mr-1">💡</span>
                                Số tiền rút tối thiểu: <span className="font-bold text-gray-700 ml-1">10.000 VNĐ</span>
                              </p>
                            </div>
                          </div>

                          {/* Description Input */}
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-800 flex items-center">
                              Mô tả giao dịch
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Textarea
                              value={withdrawDescription}
                              onChange={(e) => {
                                setWithdrawDescription(e.target.value.slice(0, 200));
                                setWithdrawError(null);
                              }}
                              placeholder="Ví dụ: Rút tiền để thanh toán hóa đơn, chi tiêu cá nhân..."
                              rows={3}
                              className="resize-none border-2 border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl transition-all"
                              disabled={isWithdrawing}
                              maxLength={200}
                            />
                            <div className="flex items-center justify-between text-xs">
                              <p className="text-gray-500">Mô tả giúp bạn quản lý giao dịch dễ dàng hơn</p>
                              <span className={`font-semibold ${withdrawDescription.length > 180 ? 'text-orange-600' : withdrawDescription.length > 150 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {withdrawDescription.length}/200
                              </span>
                            </div>
                          </div>

                          {/* Error Message */}
                          {withdrawError && (
                            <div className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-xl p-5 border-2 border-red-600 shadow-lg">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-md">
                                  <X className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-base mb-1">Có lỗi xảy ra</p>
                                  <p className="text-white/95 text-sm leading-relaxed">{withdrawError}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Payment Cards List - Giống style trong UserProfilePage */}
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm mb-4">Chọn thông tin thanh toán để rút tiền</p>
                      <div className="grid gap-4">
                        {paymentInformations.map((paymentInfo, idx) => (
                          <div
                            key={paymentInfo.paymentInformationId || `payment-${idx}`}
                            onClick={() => handleSelectPaymentInfo(paymentInfo)}
                            className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#D1D5DB] cursor-pointer"
                          >
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
                                  {paymentInfo.bankLogo ? (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                      <img
                                        src={paymentInfo.bankLogo}
                                        alt={paymentInfo.bankName}
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
                                      {paymentInfo.bankShortName || paymentInfo.bankName}
                                    </Badge>
                                    {paymentInfo.branchName && (
                                      <p className="text-gray-600 text-xs mt-1">{paymentInfo.branchName}</p>
                                    )}
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
                                    {paymentInfo.accountNumber}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToClipboard(paymentInfo.accountNumber, paymentInfo.accountNumber);
                                    }}
                                    className="ml-3 p-2 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:scale-105 shadow-sm"
                                    title="Sao chép số tài khoản"
                                  >
                                    {copiedAccountNumber === paymentInfo.accountNumber ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-gray-700" />
                                    )}
                                  </button>
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
                                    {paymentInfo.accountHolderName}
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
                        ))}
                      </div>
                    </div>

                    {/* Pagination */}
                    {paymentPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Trang <span className="font-semibold">{paymentPagination.currentPage}</span> / <span className="font-semibold">{paymentPagination.totalPages}</span>
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchPaymentInformations(paymentPagination.currentPage - 1)}
                            disabled={paymentPagination.currentPage === 1 || isLoadingPaymentInfo}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => fetchPaymentInformations(paymentPagination.currentPage + 1)}
                            disabled={paymentPagination.currentPage === paymentPagination.totalPages || isLoadingPaymentInfo}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer - Sticky Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedPaymentInfo && !withdrawSuccess && (
                      <Button
                        onClick={() => {
                          setSelectedPaymentInfo(null);
                          setWithdrawAmount('');
                          setWithdrawDescription('');
                          setWithdrawError(null);
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium"
                        disabled={isWithdrawing}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1.5" />
                        Quay lại
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    {!withdrawSuccess && (
                      <Button
                        onClick={() => {
                          setShowWithdrawModal(false);
                          setSelectedPaymentInfo(null);
                          setWithdrawAmount('');
                          setWithdrawDescription('');
                          setWithdrawError(null);
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium"
                        disabled={isWithdrawing}
                      >
                        Đóng
                      </Button>
                    )}
                    {selectedPaymentInfo && !withdrawSuccess && (
                      <Button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 10000 || !withdrawDescription?.trim()}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isWithdrawing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Xác nhận rút tiền
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;