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
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import { GradientBackground } from '../../components/common';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { walletAPI } from '../../api/services';
import { Clipboard } from 'react-native';

const PaymentInformationScreen = ({ navigation }) => {
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentPagination, setPaymentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);

  useEffect(() => {
    fetchPaymentInformations(1);
  }, []);

  const fetchPaymentInformations = useCallback(async (pageNumber = 1) => {
    try {
      setIsLoading(pageNumber === 1);
      setError(null);
      
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
      setError(error.message || 'Không thể tải thông tin thẻ');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchPaymentInformations(paymentPagination.currentPage);
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

  const handleDeletePaymentInfo = async (id) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa thông tin thẻ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await walletAPI.deletePaymentInformation(id);
              
              if (result && result.success !== false) {
                Alert.alert('Thành công', 'Đã xóa thông tin thẻ thành công');
                await fetchPaymentInformations(1); 
              } else {
                Alert.alert('Lỗi', result?.message || 'Không thể xóa thông tin thẻ');
              }
            } catch (error) {
              console.error('Error deleting payment information:', error);
              
              if (error.message && error.message.includes('deleted successfully')) {
                Alert.alert('Thành công', 'Đã xóa thông tin thẻ thành công');
                await fetchPaymentInformations(1);
              } else {
                Alert.alert('Lỗi', error.message || 'Không thể xóa thông tin thẻ');
              }
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <GradientBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText variant="body" color="secondary" style={styles.loadingText}>
          Đang tải thông tin thẻ...
        </CustomText>
      </GradientBackground>
    );
  }

  if (error && paymentInformations.length === 0) {
    return (
      <GradientBackground style={styles.errorContainer}>
        <CustomText variant="h3" color="error">
          Lỗi khi tải thông tin
        </CustomText>
        <CustomText variant="body" color="secondary">
          {error}
        </CustomText>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchPaymentInformations(1)}>
          <CustomText variant="body" color="white">
            Thử lại
          </CustomText>
        </TouchableOpacity>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
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
        {/* Header with Gradient */}
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <CustomText 
                variant="h2" 
                color="white" 
                style={styles.headerTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Thông tin thẻ
              </CustomText>
              <CustomText 
                variant="caption" 
                color="white" 
                style={styles.headerSubtitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                Quản lý và xem thông tin tài khoản ngân hàng của bạn
              </CustomText>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.7}
            >
              <CustomText variant="body" color="white" style={styles.addButtonText}>
                + Thêm thẻ
              </CustomText>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Payment Information List */}
        {paymentInformations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText variant="h3" color="secondary" style={styles.emptyIcon}>
              🏦
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyText}>
              Chưa có thông tin thẻ nào được lưu
            </CustomText>
            <CustomText variant="caption" color="secondary" style={styles.emptySubtext}>
              Thêm thẻ để thanh toán nhanh chóng
            </CustomText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {paymentInformations.map((paymentInfo) => (
              <PaymentInfoCard
                key={paymentInfo.paymentInformationId}
                paymentInfo={paymentInfo}
                onCopy={handleCopyToClipboard}
                onDelete={handleDeletePaymentInfo}
                isDeleting={isDeleting}
                copiedAccountNumber={copiedAccountNumber}
              />
            ))}

            {/* Pagination */}
            {paymentPagination.totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    paymentPagination.currentPage === 1 && styles.paginationButtonDisabled
                  ]}
                  onPress={() => fetchPaymentInformations(paymentPagination.currentPage - 1)}
                  disabled={paymentPagination.currentPage === 1 || isLoading}
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
                  disabled={paymentPagination.currentPage === paymentPagination.totalPages || isLoading}
                >
                  <CustomText variant="body" color={paymentPagination.currentPage === paymentPagination.totalPages ? "secondary" : "primary"}>
                    Sau →
                  </CustomText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Payment Information Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <AddPaymentModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={async () => {
            setIsAddModalOpen(false);
            await fetchPaymentInformations(paymentPagination.currentPage);
          }}
        />
      </Modal>
    </GradientBackground>
  );
};

// Payment Info Card Component
const PaymentInfoCard = ({ paymentInfo, onCopy, onDelete, isDeleting, copiedAccountNumber }) => {
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#F8F8F8', '#E8E8E8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
        {/* Bank Logo and Info */}
        <View style={styles.cardHeader}>
          <View style={styles.bankInfo}>
            {paymentInfo.bankLogo ? (
              <Image
                source={{ uri: paymentInfo.bankLogo }}
                style={styles.bankLogo}
                resizeMode="contain"
                onError={() => {}}
              />
            ) : (
              <View style={styles.bankLogoPlaceholder}>
                <CustomText variant="h2" color="primary">🏦</CustomText>
              </View>
            )}
            <View style={styles.bankDetails}>
              <CustomText variant="body" color="textPrimary" style={styles.bankName}>
                {paymentInfo.bankShortName || paymentInfo.bankName}
              </CustomText>
              {paymentInfo.branchName && (
                <CustomText variant="caption" color="secondary">
                  {paymentInfo.branchName}
                </CustomText>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(paymentInfo.paymentInformationId)}
            disabled={isDeleting}
          >
            <CustomText variant="h3" color="error">🗑️</CustomText>
          </TouchableOpacity>
        </View>

        {/* Account Number */}
        <View style={styles.accountSection}>
          <CustomText variant="caption" color="secondary" style={styles.accountLabel}>
            Số tài khoản
          </CustomText>
          <View style={styles.accountNumberRow}>
            <CustomText variant="h3" color="textPrimary" style={styles.accountNumber}>
              {paymentInfo.accountNumber}
            </CustomText>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => onCopy(paymentInfo.accountNumber, paymentInfo.accountNumber)}
            >
              <CustomText variant="h3" color="textPrimary">
                {copiedAccountNumber === paymentInfo.accountNumber ? '✓' : '📋'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Holder */}
        <View style={styles.accountHolderSection}>
          <CustomText variant="caption" color="secondary" style={styles.accountLabel}>
            Chủ tài khoản
          </CustomText>
          <View style={styles.accountHolderRow}>
            <CustomText variant="body" color="textPrimary" style={styles.accountHolderName}>
              {paymentInfo.accountHolderName}
            </CustomText>
          </View>
        </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// Add Payment Modal Component
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
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountHolderNameInput, setAccountHolderNameInput] = useState('');

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await fetch("https://api.vietqr.io/v2/banks");
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setBanks(data.data || []);
        }
      } else {
        throw new Error('Failed to fetch banks');
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      setError('Không thể tải danh sách ngân hàng');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleInputChange = (field, value, shouldUpperCase = false) => {
    const processedValue = shouldUpperCase ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
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
    // Sync accountHolderNameInput to formData before validation
    const finalFormData = {
      ...formData,
      accountHolderName: accountHolderNameInput.trim()
    };

    // Validation
    if (!finalFormData.accountHolderName) {
      setError('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    if (!finalFormData.accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (!finalFormData.bankName) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }
    if (!finalFormData.branchName.trim()) {
      setError('Vui lòng nhập tên chi nhánh');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await walletAPI.createPaymentInformation(finalFormData);
      Alert.alert('Thành công', 'Đã thêm thông tin thẻ thành công');
      onSuccess();
    } catch (error) {
      console.error('Error creating payment information:', error);
      setError(error.message || 'Không thể thêm thông tin thanh toán');
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
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <CustomText variant="h3" color="primary">✕</CustomText>
        </TouchableOpacity>
        <CustomText variant="h3" color="primary">
          Thêm thẻ ngân hàng mới
        </CustomText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Bank Selection */}
        <View style={styles.formGroup}>
          <CustomText variant="body" color="primary" style={styles.label}>
            Chọn ngân hàng *
          </CustomText>
          {isLoadingBanks ? (
            <View style={styles.loadingBanksContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <CustomText variant="caption" color="secondary" style={{ marginTop: 8 }}>
                Đang tải danh sách ngân hàng...
              </CustomText>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ngân hàng..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor={Colors.textLight}
              />
              {selectedBank && (
                <View style={styles.selectedBankContainer}>
                  <View style={styles.selectedBankInfo}>
                    {selectedBank.logo ? (
                      <Image
                        source={{ uri: selectedBank.logo }}
                        style={styles.selectedBankLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.selectedBankLogoPlaceholder}>
                        <CustomText variant="h3">🏦</CustomText>
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <CustomText 
                        variant="body" 
                        color="primary"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedBank.shortName}
                      </CustomText>
                      <CustomText 
                        variant="caption" 
                        color="secondary"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{ marginTop: 2 }}
                      >
                        {selectedBank.name}
                      </CustomText>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBank(null);
                      setFormData(prev => ({
                        ...prev,
                        bankName: '',
                        bankBin: '',
                        bankShortName: '',
                        bankLogo: ''
                      }));
                    }}
                  >
                    <CustomText variant="h3" color="error">✕</CustomText>
                  </TouchableOpacity>
                </View>
              )}
              {!selectedBank && (
                <ScrollView style={styles.bankListContainer} nestedScrollEnabled>
                  {filteredBanks.map((bank) => (
                    <TouchableOpacity
                      key={bank.id}
                      style={styles.bankItem}
                      onPress={() => handleBankSelect(bank)}
                    >
                      {bank.logo ? (
                        <Image
                          source={{ uri: bank.logo }}
                          style={styles.bankItemLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.bankItemLogoPlaceholder}>
                          <CustomText variant="h3">🏦</CustomText>
                        </View>
                      )}
                      <View style={styles.bankItemInfo}>
                        <CustomText 
                          variant="body" 
                          color="primary"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {bank.shortName}
                        </CustomText>
                        <CustomText 
                          variant="caption" 
                          color="secondary"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={{ marginTop: 2 }}
                        >
                          {bank.name}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* Account Holder Name */}
        <View style={styles.formGroup}>
          <CustomText variant="body" color="primary" style={styles.label}>
            Tên chủ tài khoản *
          </CustomText>
          <TextInput
            style={styles.input}
            value={accountHolderNameInput}
            onChangeText={(value) => {
              const upperValue = value.toUpperCase();
              setAccountHolderNameInput(upperValue);
            }}
            onBlur={() => {
              handleInputChange('accountHolderName', accountHolderNameInput);
            }}
            placeholder="NGUYEN VAN A"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <CustomText variant="caption" color="secondary" style={styles.helperText}>
            Nhập tên in hoa giống trên thẻ ngân hàng
          </CustomText>
        </View>

        {/* Account Number */}
        <View style={styles.formGroup}>
          <CustomText variant="body" color="primary" style={styles.label}>
            Số tài khoản *
          </CustomText>
          <TextInput
            style={styles.input}
            value={formData.accountNumber}
            onChangeText={(value) => {
              // Chỉ cho phép chữ, số, không cho khoảng trắng và ký tự đặc biệt
              const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, '');
              const finalValue = cleanedValue.slice(0, 200); // Max 200 ký tự
              handleInputChange('accountNumber', finalValue);
            }}
            placeholder="0337252208 hoặc ACB123456"
            placeholderTextColor={Colors.textLight}
            maxLength={200}
          />
          <CustomText variant="caption" color="secondary" style={styles.helperText}>
            Không được có khoảng trắng và ký tự đặc biệt
          </CustomText>
        </View>

        {/* Branch Name */}
        <View style={styles.formGroup}>
          <CustomText variant="body" color="primary" style={styles.label}>
            Chi nhánh *
          </CustomText>
          <TextInput
            style={styles.input}
            value={formData.branchName}
            onChangeText={(value) => handleInputChange('branchName', value)}
            placeholder="Ví dụ: Hồ Chí Minh, Hà Nội..."
            placeholderTextColor={Colors.textLight}
          />
          <CustomText variant="caption" color="secondary" style={styles.helperText}>
            Nhập tên chi nhánh hoặc thành phố
          </CustomText>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorMessage}>
            <CustomText variant="caption" color="error" style={{ textAlign: 'center' }}>
              {error}
            </CustomText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={isSubmitting}
        >
          <CustomText variant="body" color="primary">Hủy</CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <CustomText variant="body" color="white">Thêm thẻ</CustomText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentInformationScreen;

