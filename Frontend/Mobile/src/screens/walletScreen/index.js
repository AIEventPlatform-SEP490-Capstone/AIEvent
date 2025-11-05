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
  Clipboard,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import { LinearGradient } from 'expo-linear-gradient';
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
import { walletAPI } from '../../api/services';

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => setShowWithdrawModal(true)}
        >
          <View style={styles.quickActionIcon}>
            <CustomText variant="h2" color="white">💸</CustomText>
          </View>
          <CustomText variant="body" color="primary" style={styles.quickActionTitle}>
            Rút tiền
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.quickActionSubtitle}>
            Rút tiền từ ví
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
      {/* Header with Gradient */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <CustomText variant="h2" color="white" style={styles.headerTitle}>
          Ví điện tử
        </CustomText>
        <CustomText variant="body" color="white" style={styles.headerSubtitle}>
          Quản lý tài chính của bạn
        </CustomText>
      </LinearGradient>
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

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={() => {
          setShowWithdrawModal(false);
          getWallet();
          loadTransactions();
        }}
        wallet={wallet}
        formatCurrency={formatCurrency}
        navigation={navigation}
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

// Withdraw Modal Component
const WithdrawModal = ({ isOpen, onClose, onSuccess, wallet, formatCurrency, navigation }) => {
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState(null);
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [paymentPagination, setPaymentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);

  const fetchPaymentInformations = useCallback(async (pageNumber = 1) => {
    try {
      setIsLoadingPaymentInfo(true);
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

  useEffect(() => {
    if (isOpen) {
      fetchPaymentInformations(1);
      setSelectedPaymentInfo(null);
      setWithdrawAmount('');
      setWithdrawDescription('');
      setWithdrawError(null);
      setWithdrawSuccess(false);
    }
  }, [isOpen, fetchPaymentInformations]);

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

    // Phí trừ từ số tiền rút
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

      setWithdrawSuccess(true);

      // Auto close modal after 2.5 seconds
      setTimeout(() => {
        onSuccess();
        setSelectedPaymentInfo(null);
        setWithdrawAmount('');
        setWithdrawDescription('');
        setWithdrawError(null);
        setWithdrawSuccess(false);
      }, 2500);
    } catch (error) {
      console.error('Error withdrawing:', error);

      if (error.message && error.message.includes('500')) {
        setWithdrawError('Lỗi server. Hệ thống đang gặp sự cố, vui lòng thử lại sau vài phút.');
      } else {
        setWithdrawError(error.message || 'Đã có lỗi xảy ra, vui lòng kiểm tra thông tin thanh toán và thử lại!');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleCopyToClipboard = (text, accountNumber) => {
    try {
      Clipboard.setString(text);
      setCopiedAccountNumber(accountNumber);
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
      Alert.alert('Thành công', 'Đã sao chép số tài khoản');
    } catch (err) {
      console.error('Failed to copy:', err);
      Alert.alert('Lỗi', 'Không thể sao chép');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.withdrawModalHeader}
        >
          <CustomText variant="h2" color="white" style={styles.withdrawModalTitle}>
            Rút tiền về tài khoản
          </CustomText>
        </LinearGradient>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {!selectedPaymentInfo ? (
            // Payment Info Selection
            <View>
              <CustomText variant="body" color="primary" style={styles.modalLabel}>
                Chọn thông tin thanh toán
              </CustomText>
              <CustomText variant="caption" color="secondary" style={styles.modalHint}>
                Bạn cần thêm ít nhất một tài khoản ngân hàng để thực hiện rút tiền
              </CustomText>

              {isLoadingPaymentInfo ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <CustomText variant="body" color="secondary" style={styles.loadingText}>
                    Đang tải thông tin thẻ...
                  </CustomText>
                </View>
              ) : paymentInformations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CustomText variant="h3" color="secondary" style={styles.emptyTitle}>
                    🏦
                  </CustomText>
                  <CustomText variant="body" color="secondary" style={styles.emptySubtitle}>
                    Chưa có thông tin thẻ nào
                  </CustomText>
                  <TouchableOpacity
                    style={styles.addCardButton}
                    onPress={() => {
                      onClose();
                      if (navigation) {
                        navigation.navigate('PaymentInformationScreen');
                      }
                    }}
                  >
                    <LinearGradient
                      colors={Colors.gradientHeaderTitle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.addCardButtonGradient}
                    >
                      <CustomText variant="body" color="white" style={{ fontFamily: Fonts.bold }}>
                        ➕ Thêm thẻ mới
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.withdrawPaymentListContainer}>
                    {paymentInformations.map((paymentInfo) => (
                      <TouchableOpacity
                        key={paymentInfo.paymentInformationId}
                        style={[
                          styles.withdrawPaymentCard,
                          selectedPaymentInfo?.paymentInformationId === paymentInfo.paymentInformationId && styles.withdrawPaymentCardSelected
                        ]}
                        onPress={() => handleSelectPaymentInfo(paymentInfo)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={selectedPaymentInfo?.paymentInformationId === paymentInfo.paymentInformationId 
                            ? ['#F0F0F0', '#E0E0E0'] 
                            : ['#F8F8F8', '#E8E8E8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.withdrawPaymentCardGradient}
                        >
                          <View style={styles.withdrawPaymentCardContent}>
                            <View style={styles.withdrawPaymentCardHeader}>
                              {paymentInfo.bankLogo ? (
                                <View style={styles.withdrawBankLogoContainer}>
                                  <Image
                                    source={{ uri: paymentInfo.bankLogo }}
                                    style={styles.withdrawBankLogo}
                                    resizeMode="contain"
                                  />
                                </View>
                              ) : (
                                <View style={styles.withdrawBankLogoPlaceholder}>
                                  <CustomText variant="h2" color="primary">🏦</CustomText>
                                </View>
                              )}
                              <View style={styles.withdrawBankDetails}>
                                <View style={styles.withdrawBankBadge}>
                                  <CustomText variant="body" color="textPrimary" style={styles.withdrawBankName}>
                                    {paymentInfo.bankShortName || paymentInfo.bankName}
                                  </CustomText>
                                </View>
                                {paymentInfo.branchName && (
                                  <CustomText variant="caption" color="secondary" style={styles.branchText}>
                                    {paymentInfo.branchName}
                                  </CustomText>
                                )}
                              </View>
                              {selectedPaymentInfo?.paymentInformationId === paymentInfo.paymentInformationId && (
                                <View style={styles.selectedCheckmark}>
                                  <CustomText variant="h3" color="white">✓</CustomText>
                                </View>
                              )}
                            </View>

                            <View style={styles.withdrawAccountSection}>
                              <View style={styles.accountRow}>
                                <CustomText variant="caption" color="secondary" style={styles.accountLabel}>
                                  Số tài khoản
                                </CustomText>
                                <CustomText variant="body" color="textPrimary" style={styles.accountNumber}>
                                  {paymentInfo.accountNumber}
                                </CustomText>
                              </View>
                              <View style={styles.accountRow}>
                                <CustomText variant="caption" color="secondary" style={styles.accountLabel}>
                                  Chủ tài khoản
                                </CustomText>
                                <CustomText variant="body" color="textPrimary" style={styles.accountHolder}>
                                  {paymentInfo.accountHolderName}
                                </CustomText>
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Pagination */}
                  {paymentPagination.totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          paymentPagination.currentPage === 1 && styles.paginationButtonDisabled
                        ]}
                        onPress={() => fetchPaymentInformations(paymentPagination.currentPage - 1)}
                        disabled={paymentPagination.currentPage === 1 || isLoadingPaymentInfo}
                      >
                        <CustomText variant="body" color={paymentPagination.currentPage === 1 ? "secondary" : "primary"}>
                          ← Trước
                        </CustomText>
                      </TouchableOpacity>
                      <CustomText variant="caption" color="secondary" style={styles.paginationInfo}>
                        Trang {paymentPagination.currentPage} / {paymentPagination.totalPages}
                      </CustomText>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          paymentPagination.currentPage === paymentPagination.totalPages && styles.paginationButtonDisabled
                        ]}
                        onPress={() => fetchPaymentInformations(paymentPagination.currentPage + 1)}
                        disabled={paymentPagination.currentPage === paymentPagination.totalPages || isLoadingPaymentInfo}
                      >
                        <CustomText variant="body" color={paymentPagination.currentPage === paymentPagination.totalPages ? "secondary" : "primary"}>
                          Sau →
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          ) : (
            // Withdraw Form
            <>
              {withdrawSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <CustomText variant="h1" style={styles.successIcon}>✓</CustomText>
                  </View>
                  <CustomText variant="h2" color="primary" style={styles.successTitle}>
                    Yêu cầu rút tiền thành công!
                  </CustomText>
                  <View style={styles.successAmountCard}>
                    <CustomText variant="caption" color="secondary" style={styles.successLabel}>
                      Số tiền rút
                    </CustomText>
                    <CustomText variant="h2" color="success" style={styles.successAmount}>
                      {formatCurrency(parseFloat(withdrawAmount))}
                    </CustomText>
                  </View>
                  <CustomText variant="body" color="secondary" style={styles.successMessage}>
                    Yêu cầu của bạn đang được xử lý. Vui lòng đợi trong giây lát...
                  </CustomText>
                  <View style={styles.successProgressBar}>
                    <View style={styles.successProgressFill} />
                  </View>
                </View>
              ) : (
                <>
                  {/* Selected Payment Info - Card Design */}
                  <View style={styles.selectedPaymentSection}>
                    <View style={styles.sectionHeader}>
                      <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
                        💳 Tài khoản nhận tiền
                      </CustomText>
                    </View>
                    <View style={styles.selectedPaymentInfoCard}>
                      <LinearGradient
                        colors={['#F8F8F8', '#E8E8E8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.paymentCardGradient}
                      >
                        <View style={styles.paymentCardChip}>
                          <View style={styles.chipDesign} />
                        </View>

                        {selectedPaymentInfo.bankLogo ? (
                          <View style={styles.paymentCardBankLogo}>
                            <Image
                              source={{ uri: selectedPaymentInfo.bankLogo }}
                              style={styles.cardBankLogoImage}
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <CustomText variant="h2" color="textPrimary" style={styles.cardBankName}>
                            {selectedPaymentInfo.bankShortName || selectedPaymentInfo.bankName}
                          </CustomText>
                        )}

                        <View style={styles.paymentCardInfo}>
                          <View style={styles.cardField}>
                            <CustomText variant="caption" color="secondary" style={styles.cardLabel}>
                              SỐ TÀI KHOẢN
                            </CustomText>
                            <CustomText variant="h3" color="textPrimary" style={styles.cardNumber}>
                              {selectedPaymentInfo.accountNumber}
                            </CustomText>
                          </View>

                          <View style={styles.cardField}>
                            <CustomText variant="caption" color="secondary" style={styles.cardLabel}>
                              CHỦ TÀI KHOẢN
                            </CustomText>
                            <CustomText variant="body" color="textPrimary" style={styles.cardHolder}>
                              {selectedPaymentInfo.accountHolderName}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.cardPattern}>
                          <View style={styles.cardCircle1} />
                          <View style={styles.cardCircle2} />
                        </View>
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Amount Input Section */}
                  <View style={styles.inputSection}>
                    <View style={styles.sectionHeader}>
                      <CustomText variant="h3" color="black" style={styles.sectionTitle}>
                        Số tiền rút
                      </CustomText>
                    </View>

                    <View style={styles.amountInputCard}>
                      <View style={styles.currencySymbol}>
                        <CustomText variant="h3" color="primary">₫</CustomText>
                      </View>
                      <TextInput
                        style={styles.modernAmountInput}
                        value={withdrawAmount}
                        onChangeText={(value) => {
                          setWithdrawAmount(value.replace(/[^\d]/g, ''));
                          setWithdrawError(null);
                        }}
                        placeholder="0"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="numeric"
                        disabled={isWithdrawing}
                      />
                    </View>

                    {/* Quick Amount Buttons */}
                    <View style={styles.quickAmountContainer}>
                      <CustomText variant="caption" color="secondary" style={styles.quickAmountLabel}>
                        Chọn nhanh:
                      </CustomText>
                      <View style={styles.quickAmountGrid}>
                        {[50000, 100000, 200000, 500000, 1000000].map((amount) => {
                          if (amount < 10000 || (wallet?.balance && amount > wallet.balance)) return null;
                          const isSelected = withdrawAmount === amount.toString();
                          return (
                            <TouchableOpacity
                              key={amount}
                              style={[
                                styles.quickAmountButton,
                                isSelected && styles.quickAmountButtonSelected,
                              ]}
                              onPress={() => {
                                setWithdrawAmount(amount.toString());
                                setWithdrawError(null);
                              }}
                              disabled={isWithdrawing}
                              activeOpacity={0.7}
                            >
                              <CustomText
                                variant="caption"
                                color={isSelected ? "white" : "primary"}
                                style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}
                              >
                                {amount >= 1000000 
                                  ? `${amount / 1000000}M` 
                                  : amount >= 1000 
                                    ? `${amount / 1000}k` 
                                    : amount}
                              </CustomText>
                            </TouchableOpacity>
                          );
                        })}
                        {wallet?.balance && wallet.balance >= 10000 && (
                          <TouchableOpacity
                            style={[
                              styles.quickAmountButton,
                              styles.quickAmountButtonAll,
                              withdrawAmount === wallet.balance.toString() && styles.quickAmountButtonSelected,
                            ]}
                            onPress={() => {
                              setWithdrawAmount(wallet.balance.toString());
                              setWithdrawError(null);
                            }}
                            disabled={isWithdrawing}
                            activeOpacity={0.7}
                          >
                            <CustomText
                              variant="caption"
                              color={withdrawAmount === wallet.balance.toString() ? "white" : "primary"}
                              style={[styles.quickAmountText, withdrawAmount === wallet.balance.toString() && styles.quickAmountTextSelected]}
                            >
                              Rút hết
                            </CustomText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > 0 && (
                      <View style={styles.amountPreview}>
                        <CustomText variant="h2" color="primary" style={styles.amountPreviewText}>
                          {formatCurrency(parseFloat(withdrawAmount))}
                        </CustomText>
                      </View>
                    )}

                    <CustomText variant="caption" color="secondary" style={styles.inputHint}>
                      💡 Số tiền tối thiểu: 10.000 VNĐ
                    </CustomText>

                    {/* Calculation Card */}
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) >= 10000 && (
                      <View style={styles.calculationCard}>
                        {/* Withdrawal Amount */}
                        <View style={styles.calculationRow}>
                          <CustomText variant="body" color="secondary" style={styles.calculationLabel}>
                            Số tiền rút
                          </CustomText>
                          <CustomText variant="h3" color="primary" style={styles.calculationValue}>
                            {formatCurrency(parseFloat(withdrawAmount))}
                          </CustomText>
                        </View>

                        <View style={styles.calculationDivider} />

                        {/* Transaction Fee */}
                        <View style={styles.calculationRow}>
                          <CustomText variant="body" color="secondary" style={styles.calculationLabel}>
                            Phí giao dịch
                          </CustomText>
                          <CustomText variant="body" color="error" style={styles.calculationValue}>
                            - {formatCurrency(4000)}
                          </CustomText>
                        </View>

                        <View style={styles.calculationDivider} />

                        {/* Amount Received - Highlighted */}
                        <View style={styles.calculationTotalRow}>
                          <View style={styles.calculationTotalContent}>
                            <CustomText variant="h3" color="primary" style={styles.receivedLabel}>
                              Số tiền nhận
                            </CustomText>
                            <CustomText variant="h2" color="success" style={styles.receivedAmount}>
                              {formatCurrency(parseFloat(withdrawAmount) - 4000)}
                            </CustomText>
                          </View>
                        </View>

                        {/* Balance Info */}
                        {wallet?.balance && parseFloat(withdrawAmount) <= wallet.balance && (
                          <View style={styles.balanceInfoCard}>
                            <CustomText variant="caption" color="secondary" style={styles.balanceLabel}>
                              Số dư sau khi rút
                            </CustomText>
                            <CustomText variant="h3" color="success" style={styles.balanceAmount}>
                              {formatCurrency(wallet.balance - parseFloat(withdrawAmount))}
                            </CustomText>
                          </View>
                        )}

                        {wallet?.balance && parseFloat(withdrawAmount) > wallet.balance && (
                          <View style={styles.balanceInfoDanger}>
                            <CustomText variant="body" color="error">
                              Số dư không đủ
                            </CustomText>
                            <CustomText variant="caption" color="error" style={styles.balanceShortage}>
                              Thiếu {formatCurrency(parseFloat(withdrawAmount) - wallet.balance)}
                            </CustomText>
                          </View>
                        )}

                        {parseFloat(withdrawAmount) <= 4000 && (
                          <View style={styles.balanceInfoDanger}>
                            <CustomText variant="body" color="error">
                              Số tiền rút phải lớn hơn phí 4.000 VNĐ
                            </CustomText>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Description Input Section */}
                  <View style={styles.inputSection}>
                    <View style={styles.sectionHeader}>
                      <CustomText variant="h3" color="black" style={styles.sectionTitle}>
                        Nội dung chuyển tiền
                      </CustomText>
                    </View>

                    <View style={styles.descriptionCard}>
                      <TextInput
                        style={styles.modernDescriptionInput}
                        value={withdrawDescription}
                        onChangeText={(value) => {
                          setWithdrawDescription(value.slice(0, 200));
                          setWithdrawError(null);
                        }}
                        placeholder="Nhập lý do rút tiền (vd: Chi tiêu cá nhân, thanh toán hóa đơn...)"
                        placeholderTextColor="#CBD5E1"
                        multiline
                        maxLength={200}
                        disabled={isWithdrawing}
                      />
                    </View>
                  </View>

                  {withdrawError && (
                    <View style={styles.modernErrorAlert}>
                      <View style={styles.errorIcon}>
                        <CustomText variant="body" color="white">⚠️</CustomText>
                      </View>
                      <CustomText variant="body" color="error" style={styles.errorText}>
                        {withdrawError}
                      </CustomText>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        {!withdrawSuccess && (
          <View style={styles.modalFooter}>
            {selectedPaymentInfo ? (
              <>
                <TouchableOpacity
                  style={styles.withdrawCancelButton}
                  onPress={() => {
                    setSelectedPaymentInfo(null);
                    setWithdrawAmount('');
                    setWithdrawDescription('');
                    setWithdrawError(null);
                  }}
                  disabled={isWithdrawing}
                  activeOpacity={0.7}
                >
                  <CustomText variant="caption" color="primary" style={{ fontFamily: Fonts.medium }}>Hủy</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.withdrawSubmitButton,
                    (!withdrawAmount || parseFloat(withdrawAmount) < 10000 || !withdrawDescription?.trim() || isWithdrawing) && styles.submitButtonDisabled
                  ]}
                  onPress={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) < 10000 || !withdrawDescription?.trim() || isWithdrawing}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={(!withdrawAmount || parseFloat(withdrawAmount) < 10000 || !withdrawDescription?.trim() || isWithdrawing)
                      ? ['#9E9E9E', '#757575']
                      : Colors.gradientHeaderTitle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.withdrawSubmitButtonGradient}
                  >
                    {isWithdrawing ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <CustomText variant="caption" color="white" style={{ fontFamily: Fonts.bold }}>
                        Xác nhận
                      </CustomText>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.withdrawCloseButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <CustomText variant="caption" color="white" style={{ fontFamily: Fonts.medium }}>Đóng</CustomText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

export default WalletScreen;
