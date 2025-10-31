import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import StorageKeys from '../../constants/StorageKeys';
import { UserService } from '../../api/services';
import { 
  fetchUserWallet, 
  fetchWalletTransactions,
  createTopupPayment,
  clearWalletError, 
  clearWallet,
  clearTransactionsError,
  clearTopupError,
  clearTopupPayment,
} from '../../redux/actions/Action';

const WalletScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    wallet, 
    transactions,
    topupPayment,
    isWalletLoading: isLoading, 
    isTransactionsLoading,
    isTopupLoading,
    walletError: error, 
    transactionsError,
    topupError
  } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('recent');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalInitialFilter, setHistoryModalInitialFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    getWallet();
  }, []);

  const getWallet = useCallback(() => {
    dispatch(fetchUserWallet());
  }, [dispatch]);
  
  const getTransactions = useCallback((walletId, params = {}) => {
    dispatch(fetchWalletTransactions({ walletId, params }));
  }, [dispatch]);
  
  const createTopup = useCallback((amount) => {
    dispatch(createTopupPayment(amount));
  }, [dispatch]);
  
  const clearError = useCallback(() => dispatch(clearWalletError()), [dispatch]);
  const clearWalletData = useCallback(() => dispatch(clearWallet()), [dispatch]);
  const clearTransactionsErrorCallback = useCallback(() => dispatch(clearTransactionsError()), [dispatch]);
  const clearTopupErrorCallback = useCallback(() => dispatch(clearTopupError()), [dispatch]);
  const clearTopupPaymentCallback = useCallback(() => dispatch(clearTopupPayment()), [dispatch]);

  const loadTransactions = useCallback(() => {
    if (wallet?.walletId) {
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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await getWallet();
    await loadTransactions();
    setIsRefreshing(false);
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
      return '📈';
    } else {
      return '📉';
    }
  };

  const getAmountColor = (direction) => {
    return direction === 'In' ? Colors.success : Colors.error;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return { text: 'Hoàn thành', color: Colors.success, bgColor: 'rgba(34, 197, 94, 0.1)' };
      case 'Pending':
        return { text: 'Đang xử lý', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
      case 'Failed':
        return { text: 'Thất bại', color: Colors.error, bgColor: 'rgba(239, 68, 68, 0.1)' };
      default:
        return { text: status, color: Colors.textLight, bgColor: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const getAmountDisplay = (direction, balance) => {
    const sign = direction === 'In' ? '+' : '-';
    return `${sign}${formatCurrency(balance)}`;
  };

  // Sort transactions by createdAt (newest first)
  const sortedTransactions = transactions?.items ? 
    [...transactions.items].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ) : [];
  
  const pendingTransactions = sortedTransactions.filter(t => t.status === 'Pending');
  const recentTransactions = sortedTransactions.filter(t => t.status === 'Success');

  const renderWalletHeader = () => (
    <View style={styles.walletHeaderCard}>
      <View style={styles.walletHeaderContent}>
        <View style={styles.walletInfo}>
          <View style={styles.walletIconContainer}>
            <CustomText variant="h2" color="white">💰</CustomText>
          </View>
          <View style={styles.walletDetails}>
            <CustomText variant="h3" color="white" style={styles.walletTitle}>
              Ví điện tử
            </CustomText>
            <CustomText variant="body" color="white" style={styles.walletSubtitle}>
              Quản lý tài chính
            </CustomText>
          </View>
        </View>
        
        <View style={styles.balanceSection}>
          <CustomText variant="body" color="white" style={styles.balanceLabel}>
            Số dư của bạn
          </CustomText>
          <CustomText variant="h1" color="white" style={styles.balanceAmount}>
            {formatCurrency(wallet?.balance || 0)}
          </CustomText>
          <View style={styles.lastUpdateContainer}>
            <CustomText variant="caption" color="white" style={styles.lastUpdateText}>
              {sortedTransactions.length > 0 ? (
                `Giao dịch gần nhất: ${formatDate(sortedTransactions[0].createdAt)}`
              ) : (
                `Cập nhật lần cuối: ${formatDate(wallet?.updatedAt)}`
              )}
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <View style={styles.quickActionsTitle}>
        <CustomText variant="h3" color="primary">
          Thao tác nhanh
        </CustomText>
      </View>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setShowTopupModal(true)}
        >
          <View style={styles.quickActionIcon}>
            <CustomText variant="h2" color="white">💳</CustomText>
          </View>
          <CustomText variant="body" color="primary" style={styles.quickActionTitle}>
            Nạp tiền
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.quickActionSubtitle}>
            QR Code
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard}>
          <View style={styles.quickActionIcon}>
            <CustomText variant="h2" color="white">💳</CustomText>
          </View>
          <CustomText variant="body" color="primary" style={styles.quickActionTitle}>
            Nạp bằng thẻ
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.quickActionSubtitle}>
            Thẻ tín dụng/ghi nợ
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setShowHistoryModal(true)}
        >
          <View style={styles.quickActionIcon}>
            <CustomText variant="h2" color="white">📊</CustomText>
          </View>
          <CustomText variant="body" color="primary" style={styles.quickActionTitle}>
            Lịch sử
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.quickActionSubtitle}>
            Xem giao dịch
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessingAlert = () => {
    if (pendingTransactions.length === 0) return null;

    return (
      <TouchableOpacity 
        style={styles.processingAlert}
        onPress={() => {
          setHistoryModalInitialFilter('Pending');
          setShowHistoryModal(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.alertIcon}>
          <CustomText variant="h3" color="white">⏳</CustomText>
        </View>
        <View style={styles.alertContent}>
          <CustomText variant="body" color="primary" style={styles.alertTitle}>
            Có {pendingTransactions.length} giao dịch đang xử lý
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.alertSubtitle}>
            Vui lòng kiểm tra và hoàn tất các giao dịch chưa hoàn thành
          </CustomText>
        </View>
        <View style={styles.alertBadge}>
          <CustomText variant="caption" color="white" style={styles.alertBadgeText}>
            {pendingTransactions.length} đang chờ
          </CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'recent' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('recent')}
        >
          <CustomText 
            variant="caption" 
            color={activeTab === 'recent' ? "white" : "primary"}
            style={[
              styles.tabButtonText,
              activeTab === 'recent' && styles.activeTabButtonText
            ]}
          >
            Gần đây
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'all' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('all')}
        >
          <CustomText 
            variant="caption" 
            color={activeTab === 'all' ? "white" : "primary"}
            style={[
              styles.tabButtonText,
              activeTab === 'all' && styles.activeTabButtonText
            ]}
          >
            Tất cả
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'processing' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('processing')}
        >
          <View style={styles.tabButtonContent}>
            <CustomText 
              variant="caption" 
              color={activeTab === 'processing' ? "white" : "primary"}
              style={[
                styles.tabButtonText,
                activeTab === 'processing' && styles.activeTabButtonText
              ]}
            >
              Đang xử lý
            </CustomText>
            {pendingTransactions.length > 0 && (
              <View style={styles.tabBadge}>
                <CustomText variant="caption" color="white" style={styles.tabBadgeText}>
                  {pendingTransactions.length}
                </CustomText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTransactionList = () => {
    let displayTransactions = [];
    
    switch (activeTab) {
      case 'recent':
        displayTransactions = recentTransactions;
        break;
      case 'all':
        displayTransactions = sortedTransactions;
        break;
      case 'processing':
        displayTransactions = pendingTransactions;
        break;
      default:
        displayTransactions = recentTransactions;
    }

    if (isTransactionsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <CustomText variant="body" color="secondary" style={styles.loadingText}>
            Đang tải giao dịch...
          </CustomText>
        </View>
      );
    }

    if (transactionsError) {
      return (
        <View style={styles.errorContainer}>
          <CustomText variant="h3" color="error">
            Không thể tải giao dịch
          </CustomText>
          <CustomText variant="body" color="secondary" style={styles.errorText}>
            {transactionsError.message || 'Có lỗi xảy ra khi tải dữ liệu giao dịch'}
          </CustomText>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => wallet?.walletId && getTransactions(wallet.walletId)}
          >
            <CustomText variant="body" color="white">
              Thử lại
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    if (displayTransactions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <CustomText variant="h3" color="primary" style={styles.emptyTitle}>
            Không có giao dịch nào
          </CustomText>
          <CustomText variant="body" color="secondary" style={styles.emptySubtitle}>
            Bắt đầu với giao dịch đầu tiên của bạn
          </CustomText>
        </View>
      );
    }

    return (
      <View>
        {displayTransactions.map((item, index) => (
          <View key={item.orderCode ? `${item.orderCode}-${item.createdAt}-${index}` : `transaction-${item.createdAt}-${index}`} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: item.direction === 'In' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
              ]}>
                <CustomText variant="h3" color={getAmountColor(item.direction)}>
                  {getTransactionIcon(item.type, item.direction)}
                </CustomText>
              </View>
              <View style={styles.transactionInfo}>
                <CustomText variant="body" color="primary" style={styles.transactionTitle}>
                  {item.description}
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.transactionDate}>
                  {formatDate(item.createdAt)}
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.transactionCode}>
                  {item.orderCode}
                </CustomText>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <CustomText 
                variant="h3" 
                color={getAmountColor(item.direction)} 
                style={styles.transactionAmount}
              >
                {getAmountDisplay(item.direction, item.balance)}
              </CustomText>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusBadge(item.status).bgColor }
              ]}>
                <CustomText 
                  variant="caption" 
                  color={getStatusBadge(item.status).color}
                  style={styles.statusText}
                >
                  {getStatusBadge(item.status).text}
                </CustomText>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText variant="body" color="secondary" style={styles.loadingText}>
          Đang tải thông tin ví...
        </CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <CustomText variant="h3" color="error">
          Có lỗi xảy ra
        </CustomText>
        <CustomText variant="body" color="secondary" style={styles.errorText}>
          {error.message}
        </CustomText>
        <TouchableOpacity style={styles.retryButton} onPress={getWallet}>
          <CustomText variant="body" color="white">
            Thử lại
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMainContent = () => (
    <>
      {renderWalletHeader()}
      {renderQuickActions()}
      {renderProcessingAlert()}
      {renderTabNavigation()}
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderMainContent()}
        <View style={styles.transactionContainer}>
          {renderTransactionList()}
        </View>
      </ScrollView>

      {/* Topup Modal */}
      <TopupModal
        isOpen={showTopupModal}
        onClose={() => {
          setShowTopupModal(false);
          clearTopupPaymentCallback();
          clearTopupErrorCallback();
        }}
        onSuccess={() => {
          setShowTopupModal(false);
          getWallet();
          loadTransactions();
        }}
        createTopup={createTopup}
        isTopupLoading={isTopupLoading}
        topupError={topupError}
        topupPayment={topupPayment}
        navigation={navigation}
        clearTopupPaymentCallback={clearTopupPaymentCallback}
        clearTopupErrorCallback={clearTopupErrorCallback}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryModalInitialFilter('All');
        }}
        initialFilter={historyModalInitialFilter}
        walletId={wallet?.walletId}
        transactions={transactions}
        isTransactionsLoading={isTransactionsLoading}
        transactionsError={transactionsError}
        getTransactions={getTransactions}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getTransactionIcon={getTransactionIcon}
        getAmountColor={getAmountColor}
        getStatusBadge={getStatusBadge}
        getAmountDisplay={getAmountDisplay}
        navigation={navigation}
      />
    </View>
  );
};

// Topup Modal Component
const TopupModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  createTopup, 
  isTopupLoading, 
  topupError, 
  topupPayment, 
  navigation,
  clearTopupPaymentCallback,
  clearTopupErrorCallback
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleAmountSubmit = async () => {
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

  const handleAmountChange = (value) => {
    setAmount(value);
    if (value && parseInt(value) >= 10000) {
      setError(null);
    }
  };

  // Handle topup payment success
  useEffect(() => {
    if (topupPayment && !isTopupLoading) {
      const paymentData = topupPayment;
      
      if (paymentData && Object.keys(paymentData).length > 0) {
        // Lưu paymentData vào AsyncStorage với key là orderCode
        if (paymentData.orderCode) {
          const storageKey = `${StorageKeys.PAYMENT_DATA_PREFIX}${paymentData.orderCode}`;
          AsyncStorage.setItem(storageKey, JSON.stringify(paymentData))
            .catch(error => {
              console.error('Error saving payment data to storage:', error);
            });
        }

        Alert.alert(
          'Tạo giao dịch thành công',
          'Bạn có muốn xem thông tin thanh toán?',
          [
            {
              text: 'Hủy',
              onPress: () => {
                onClose();
                clearTopupPaymentCallback();
                clearTopupErrorCallback();
              }
            },
            {
              text: 'Xem thông tin',
              onPress: () => {
                onClose();
                
                if (navigation) {
                  navigation.navigate('PaymentScreen', { paymentData });
                }
                
                clearTopupPaymentCallback();
                clearTopupErrorCallback();
              }
            }
          ]
        );
      }
    }
  }, [topupPayment, isTopupLoading, navigation, onClose, clearTopupPaymentCallback, clearTopupErrorCallback]);

  // Handle topup payment error
  useEffect(() => {
    if (topupError) {
      const errorMessage = topupError.message || topupError || 'Có lỗi xảy ra khi tạo giao dịch';
      setError(errorMessage);
    }
  }, [topupError]);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <CustomText variant="h3" color="primary">✕</CustomText>
          </TouchableOpacity>
          <CustomText variant="h3" color="primary">
            Nạp tiền vào ví
          </CustomText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalSection}>
            <CustomText variant="body" color="primary" style={styles.modalLabel}>
              Số tiền nạp (VND)
            </CustomText>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="Nhập số tiền..."
              keyboardType="numeric"
            />
            <CustomText variant="caption" color="secondary" style={styles.modalHint}>
              Số tiền tối thiểu: 10.000 VND
            </CustomText>
          </View>

          <View style={styles.modalSection}>
            <CustomText variant="body" color="primary" style={styles.modalLabel}>
              Số tiền nhanh
            </CustomText>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <CustomText variant="caption" color="primary">
                    {formatCurrency(quickAmount)}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error && (
            <View style={styles.errorAlert}>
              <CustomText variant="caption" color="error">
                {error}
              </CustomText>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <CustomText variant="body" color="primary">Hủy</CustomText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, (!amount || isTopupLoading) && styles.submitButtonDisabled]} 
              onPress={handleAmountSubmit}
              disabled={!amount || isTopupLoading}
            >
              {isTopupLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <CustomText variant="body" color="white" style={{ marginLeft: 8 }}>
                    Đang tạo...
                  </CustomText>
                </View>
              ) : (
                <CustomText variant="body" color="white">Tiếp tục</CustomText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// History Modal Component
const HistoryModal = ({ 
  isOpen, 
  onClose, 
  initialFilter = 'All',
  walletId, 
  transactions, 
  isTransactionsLoading, 
  transactionsError, 
  getTransactions,
  formatCurrency,
  formatDate,
  getTransactionIcon,
  getAmountColor,
  getStatusBadge,
  getAmountDisplay,
  navigation
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  // Update filter when initialFilter changes
  useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter, isOpen]);

  // Helper function to convert transaction to paymentData format
  const convertTransactionToPaymentData = (transaction) => {
    return {
      orderCode: transaction.orderCode,
      amount: transaction.balance || 0,
      status: transaction.status === 'Pending' ? 'PENDING' : transaction.status === 'Success' ? 'SUCCESS' : 'FAILED',
      description: transaction.description || '',
      currency: 'VND',
      // These fields might not be available in transaction, but PaymentScreen handles missing data
      checkoutUrl: transaction.checkoutUrl || null,
      qrCode: transaction.qrCode || null,
      accountNumber: transaction.accountNumber || null,
      bin: transaction.bin || null,
      expiredAt: transaction.expiredAt || null,
      paymentLinkId: transaction.paymentLinkId || transaction.orderCode || null,
    };
  };

  const handleTransactionPress = async (transaction) => {
    // Only handle Pending transactions
    if (transaction.status === 'Pending' && transaction.orderCode) {
      try {
        // Lấy paymentData từ AsyncStorage
        const storageKey = `${StorageKeys.PAYMENT_DATA_PREFIX}${transaction.orderCode}`;
        const storedPaymentData = await AsyncStorage.getItem(storageKey);
        
        let paymentData;
        
        if (storedPaymentData) {
          // Sử dụng paymentData từ storage (có đầy đủ thông tin như QR code, checkoutUrl, etc.)
          paymentData = JSON.parse(storedPaymentData);
        } else {
          // Fallback: nếu không tìm thấy trong storage, convert từ transaction data
          paymentData = convertTransactionToPaymentData(transaction);
        }
        
        // Luôn navigate đến PaymentScreen để hiển thị thông tin thanh toán với QR code
        if (navigation) {
          onClose();
          navigation.navigate('PaymentScreen', { paymentData });
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
        // Fallback: mở PaymentScreen với transaction data
        const paymentData = convertTransactionToPaymentData(transaction);
        if (navigation) {
          onClose();
          navigation.navigate('PaymentScreen', { paymentData });
        }
      }
    }
  };

  const loadTransactions = useCallback(() => {
    if (!walletId) return;
    
    const params = {
      pageNumber: currentPage,
      pageSize: 10
    };
    
    getTransactions(walletId, params);
  }, [walletId, currentPage, getTransactions]);

  useEffect(() => {
    if (isOpen && walletId) {
      loadTransactions();
    }
  }, [isOpen, walletId, loadTransactions]);

  const filteredTransactions = transactions?.items?.filter(transaction => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Success' && transaction.status !== 'Success') return false;
      if (statusFilter === 'Pending' && transaction.status !== 'Pending') return false;
      if (statusFilter === 'Failed' && transaction.status !== 'Failed') return false;
    }
    return true;
  }) || [];

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <CustomText variant="h3" color="primary">✕</CustomText>
          </TouchableOpacity>
          <CustomText variant="h3" color="primary">
            Lịch sử giao dịch
          </CustomText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'All' && styles.activeFilterButton
              ]}
              onPress={() => setStatusFilter('All')}
            >
              <CustomText 
                variant="caption" 
                color={statusFilter === 'All' ? "white" : "primary"}
              >
                Tất cả
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'Success' && styles.activeFilterButton
              ]}
              onPress={() => setStatusFilter('Success')}
            >
              <CustomText 
                variant="caption" 
                color={statusFilter === 'Success' ? "white" : "primary"}
              >
                Hoàn thành
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'Pending' && styles.activeFilterButton
              ]}
              onPress={() => setStatusFilter('Pending')}
            >
              <CustomText 
                variant="caption" 
                color={statusFilter === 'Pending' ? "white" : "primary"}
              >
                Đang xử lý
              </CustomText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {isTransactionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <CustomText variant="body" color="secondary" style={styles.loadingText}>
                Đang tải giao dịch...
              </CustomText>
            </View>
          ) : transactionsError ? (
            <View style={styles.errorContainer}>
              <CustomText variant="h3" color="error">
                Không thể tải giao dịch
              </CustomText>
              <CustomText variant="body" color="secondary" style={styles.errorText}>
                {transactionsError.message || 'Có lỗi xảy ra khi tải dữ liệu giao dịch'}
              </CustomText>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={loadTransactions}
              >
                <CustomText variant="body" color="white">
                  Thử lại
                </CustomText>
              </TouchableOpacity>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CustomText variant="h3" color="primary" style={styles.emptyTitle}>
                Không có giao dịch nào
              </CustomText>
              <CustomText variant="body" color="secondary" style={styles.emptySubtitle}>
                Bắt đầu với giao dịch đầu tiên của bạn
              </CustomText>
            </View>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <TouchableOpacity 
                key={transaction.orderCode ? `${transaction.orderCode}-${transaction.createdAt}-${index}` : `transaction-${transaction.createdAt}-${index}`} 
                style={styles.historyTransactionCard}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={transaction.status === 'Pending' ? 0.7 : 1}
                disabled={transaction.status !== 'Pending'}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.direction === 'In' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                  ]}>
                    <CustomText variant="h3" color={getAmountColor(transaction.direction)}>
                      {getTransactionIcon(transaction.type, transaction.direction)}
                    </CustomText>
                  </View>
                  <View style={styles.transactionInfo}>
                    <CustomText variant="body" color="primary" style={styles.transactionTitle}>
                      {transaction.description}
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.transactionCode}>
                      {transaction.orderCode}
                    </CustomText>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <CustomText 
                    variant="h3" 
                    color={getAmountColor(transaction.direction)} 
                    style={styles.transactionAmount}
                  >
                    {getAmountDisplay(transaction.direction, transaction.balance)}
                  </CustomText>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBadge(transaction.status).bgColor }
                  ]}>
                    <CustomText 
                      variant="caption" 
                      color={getStatusBadge(transaction.status).color}
                      style={styles.statusText}
                    >
                      {getStatusBadge(transaction.status).text}
                    </CustomText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default WalletScreen;
