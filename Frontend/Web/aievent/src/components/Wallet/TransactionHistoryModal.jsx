import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import TransactionDetailModal from './TransactionDetailModal';
import { 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Eye
} from 'lucide-react';

const TransactionHistoryModal = ({ isOpen, onClose, walletId }) => {
  const { 
    transactions,
    isTransactionsLoading,
    transactionsError,
    getTransactions,
    clearTransactionsError
  } = useWallet();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadTransactions = useCallback(() => {
    if (!walletId) {
      return;
    }
    
    // Always fetch all transactions from API, no status filter
    const params = {
      pageNumber: currentPage,
      pageSize: pageSize
    };
    
    getTransactions(walletId, params);
  }, [walletId, currentPage, pageSize, getTransactions]);

  useEffect(() => {
    if (isOpen && walletId) {
      loadTransactions();
    }
  }, [isOpen, walletId, loadTransactions]);

  useEffect(() => {
    if (isOpen) {
      clearTransactionsError();
    }
  }, [isOpen, clearTransactionsError]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    // No need to call loadTransactions as filtering is done on frontend
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

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
      return <ArrowUpRight className="h-5 w-5 text-green-600" />;
    } else {
      return <ArrowDownLeft className="h-5 w-5 text-red-600" />;
    }
  };

  const getAmountColor = (direction) => {
    return direction === 'In' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hoàn thành</Badge>;
      case 'Pending':
      case 'Processing':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Đang xử lý</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Thất bại</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  const getAmountDisplay = (direction, balance) => {
    const sign = direction === 'In' ? '+' : '-';
    return `${sign}${formatCurrency(balance)}`;
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

  const filteredTransactions = transactions.items?.filter(transaction => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.orderCode.includes(searchTerm);
      if (!matchesSearch) return false;
    }
    
    // Status filter (frontend filtering)
    if (statusFilter !== 'All') {
      if (statusFilter === 'Success' && transaction.status !== 'Success') return false;
      if (statusFilter === 'Pending' && transaction.status !== 'Pending') return false;
      if (statusFilter === 'Failed' && transaction.status !== 'Failed') return false;
    }
    
    // Date filter
    if (dateFrom || dateTo) {
      const transactionDate = new Date(transaction.createdAt);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (transactionDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (transactionDate > toDate) return false;
      }
    }
    
    return true;
  }) || [];

  // Frontend pagination for filtered results
  const totalFilteredItems = filteredTransactions.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Lịch sử giao dịch
              </h2>
              <p className="text-gray-600 text-sm">Xem và quản lý tất cả giao dịch của bạn</p>
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

        {/* Filters */}
        <div className="p-8 border-b bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Bộ lọc và tìm kiếm</h3>
            </div>
            
            {/* Row 1: Search and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm theo mô tả hoặc mã giao dịch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base"
                />
              </div>

              {/* Status Filter */}
              <div className="flex space-x-3">
                <Button
                  variant={statusFilter === 'All' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('All')}
                  className={`px-4 py-2 ${
                    statusFilter === 'All' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  Tất cả
                </Button>
                <Button
                  variant={statusFilter === 'Success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('Success')}
                  className={`px-4 py-2 ${
                    statusFilter === 'Success' 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  Hoàn thành
                </Button>
                <Button
                  variant={statusFilter === 'Pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('Pending')}
                  className={`px-4 py-2 ${
                    statusFilter === 'Pending' 
                      ? 'bg-amber-600 text-white shadow-lg' 
                      : 'border-gray-300 hover:border-amber-300'
                  }`}
                >
                  Đang xử lý
                </Button>
              </div>
            </div>

            {/* Row 2: Date Range and Search Button */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Date Range */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-end items-end">
                <Button 
                  onClick={handleSearch} 
                  className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-5 w-5" />
                  <span className="font-semibold">Tìm kiếm</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {isTransactionsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              </div>
              <p className="mt-6 text-gray-700 font-semibold text-lg">Đang tải giao dịch...</p>
              <p className="text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
            </div>
          ) : transactionsError ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Không thể tải giao dịch</h3>
              <p className="text-red-600 mb-8 text-center max-w-md text-lg">
                {transactionsError.message || 'Có lỗi xảy ra khi tải dữ liệu giao dịch'}
              </p>
              <div className="flex space-x-4">
                <Button onClick={loadTransactions} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-3">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Thử lại
                </Button>
                <Button onClick={onClose} variant="ghost" className="px-6 py-3">
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedTransactions.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Không có giao dịch nào</h3>
                  <p className="text-gray-500 text-lg">Bắt đầu với giao dịch đầu tiên của bạn</p>
                </div>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <Card key={transaction.orderCode} className="p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className={`p-4 rounded-2xl ${
                          transaction.direction === 'In' 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100' 
                            : 'bg-gradient-to-r from-red-100 to-pink-100'
                        }`}>
                          {getTransactionIcon(transaction.type, transaction.direction)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="font-bold text-gray-900 text-xl">
                              {transaction.description}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`text-sm px-3 py-1 ${
                                transaction.type === 'Topup' 
                                  ? 'border-green-300 text-green-700 bg-green-50'
                                  : transaction.type === 'Payment'
                                  ? 'border-red-300 text-red-700 bg-red-50'
                                  : 'border-blue-300 text-blue-700 bg-blue-50'
                              }`}
                            >
                              {getTypeDisplay(transaction.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
                              {transaction.orderCode}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getAmountColor(transaction.direction)} mb-2`}>
                            {getAmountDisplay(transaction.direction, transaction.balance)}
                          </p>
                          <div>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(transaction)}
                          className="flex items-center space-x-3 border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Eye className="h-5 w-5" />
                          <span className="font-semibold">Chi tiết</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <div className="border-t border-gray-200 p-8 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="text-base text-gray-700">
                <span className="font-semibold text-gray-900">
                  Hiển thị {startIndex + 1} - {Math.min(endIndex, totalFilteredItems)}
                </span>
                <span className="text-gray-600"> trong tổng số </span>
                <span className="font-bold text-blue-600 text-lg">{totalFilteredItems}</span>
                <span className="text-gray-600"> giao dịch</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Trước
                </Button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 p-0 rounded-lg transition-all duration-200 ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalFilteredPages}
                  className="border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          transaction={selectedTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
