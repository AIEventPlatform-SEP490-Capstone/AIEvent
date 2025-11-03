import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollView: {
    flex: 1,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  errorText: {
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    textAlign: 'center',
  },

  // Header Gradient
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    marginBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    opacity: 0.9,
  },
  // Wallet Header
  walletHeaderCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  walletHeaderContent: {
    padding: 20,
  },

  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  walletIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  walletDetails: {
    flex: 1,
  },

  walletTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },

  walletSubtitle: {
    fontFamily: Fonts.regular,
    opacity: 0.9,
  },

  balanceSection: {
    alignItems: 'center',
  },

  balanceLabel: {
    fontFamily: Fonts.regular,
    opacity: 0.9,
    marginBottom: 8,
  },

  balanceAmount: {
    fontFamily: Fonts.bold,
    marginBottom: 12,
    textAlign: 'center',
  },

  lastUpdateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  lastUpdateText: {
    fontFamily: Fonts.regular,
    opacity: 0.8,
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  quickActionsTitle: {
    marginBottom: 16,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },

  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  quickActionTitle: {
    fontFamily: Fonts.medium,
    marginBottom: 4,
    textAlign: 'center',
  },

  quickActionSubtitle: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    fontSize: 10,
  },

  // Processing Alert
  processingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },

  alertSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },

  alertBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  alertBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },

  activeTabButton: {
    backgroundColor: Colors.primary,
  },

  tabButtonText: {
    fontFamily: Fonts.medium,
  },

  activeTabButtonText: {
    fontFamily: Fonts.bold,
  },

  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },

  tabBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },

  // Transaction Container
  transactionContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Transaction Cards
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionTitle: {
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },

  transactionDate: {
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },

  transactionCode: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },

  transactionRight: {
    alignItems: 'flex-end',
  },

  transactionAmount: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  modalContent: {
    flex: 1,
    padding: 16,
  },

  modalSection: {
    marginBottom: 24,
  },

  modalLabel: {
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.white,
    fontSize: 16,
  },

  modalHint: {
    fontFamily: Fonts.regular,
    marginTop: 4,
  },

  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  quickAmountButton: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },

  errorAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    marginRight: 8,
  },

  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },

  // Filter Container
  filterContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // History Transaction Card
  historyTransactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // Withdraw Modal Styles
  withdrawModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  withdrawModalTitle: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginTop: 8,
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  withdrawPaymentListContainer: {
    marginTop: 20,
  },

  withdrawPaymentCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  withdrawPaymentCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },

  withdrawPaymentCardGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },

  withdrawPaymentCardContent: {
    padding: 18,
  },

  withdrawPaymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  withdrawBankLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 6,
  },

  withdrawBankLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  withdrawBankLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  withdrawBankDetails: {
    flex: 1,
    marginRight: 8,
  },

  withdrawBankBadge: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },

  withdrawBankName: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  branchText: {
    marginTop: 4,
    fontFamily: Fonts.regular,
  },

  selectedCheckmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  withdrawAccountSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  accountNumber: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: 1,
  },

  accountHolder: {
    fontFamily: Fonts.medium,
    fontSize: 15,
  },

  selectedPaymentInfoCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  selectedPaymentInfoGradient: {
    borderRadius: 16,
    padding: 2,
  },

  selectedPaymentInfoContent: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
  },

  withdrawCalculationCard: {
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  calculationGradient: {
    padding: 18,
  },

  withdrawCalculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  calculationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  withdrawCalculationTotal: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.borderLight,
  },

  balanceInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 8,
    padding: 10,
  },

  balanceInfoError: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 8,
    padding: 10,
  },

  amountInputWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },

  amountInputContainer: {
    marginBottom: 12,
  },

  amountDisplayBox: {
    backgroundColor: 'rgba(0, 123, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 123, 255, 0.2)',
  },

  amountDisplayLabel: {
    fontFamily: Fonts.regular,
  },

  amountDisplayValue: {
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },

  withdrawAmountInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  descriptionInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },

  withdrawDescriptionInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  descriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  withdrawCancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  withdrawSubmitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  withdrawSubmitButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  withdrawCloseButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  addCardButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addCardButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  successIcon: {
    fontSize: 60,
    color: Colors.success,
  },

  successTitle: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 24,
  },

  successAmountCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },

  successLabel: {
    marginBottom: 8,
  },

  successAmount: {
    fontFamily: Fonts.bold,
    fontSize: 28,
  },

  successMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },

  successProgressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },

  successProgressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },

  // Section Styles
  selectedPaymentSection: {
    marginBottom: 16,
  },

  inputSection: {
    marginBottom: 16,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },

  // Payment Card Design
  paymentCardGradient: {
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden',
  },

  paymentCardChip: {
    width: 50,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.4)',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipDesign: {
    width: 30,
    height: 25,
    borderRadius: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.5)',
  },

  paymentCardBankLogo: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 80,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    padding: 6,
  },

  cardBankLogoImage: {
    width: '100%',
    height: '100%',
  },

  cardBankName: {
    position: 'absolute',
    top: 30,
    right: 24,
    fontFamily: Fonts.bold,
    opacity: 0.9,
  },

  paymentCardInfo: {
    marginTop: 'auto',
  },

  cardField: {
    marginBottom: 12,
  },

  cardLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 4,
  },

  cardNumber: {
    fontFamily: Fonts.bold,
    letterSpacing: 2,
  },

  cardHolder: {
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
  },

  cardPattern: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 150,
    height: 150,
  },

  cardCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(200, 200, 200, 0.15)',
    top: 0,
    left: 0,
  },

  cardCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(200, 200, 200, 0.15)',
    bottom: 0,
    right: 0,
  },

  // Modern Amount Input
  amountInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  currencySymbol: {
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },

  modernAmountInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    padding: 0,
  },

  amountPreview: {
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },

  amountPreviewText: {
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },

  inputHint: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: 12,
  },

  // Quick Amount Buttons
  quickAmountContainer: {
    marginTop: 12,
  },

  quickAmountLabel: {
    marginBottom: 8,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },

  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  quickAmountButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    marginRight: 6,
    marginBottom: 6,
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickAmountButtonAll: {
    minWidth: 75,
  },

  quickAmountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  quickAmountText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },

  quickAmountTextSelected: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Calculation Card Redesign
  calculationCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  calculationLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  calculationValue: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },

  calculationDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },

  calculationTotalRow: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },

  calculationTotalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  receivedLabel: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },

  receivedAmount: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    letterSpacing: 0.3,
  },

  balanceInfoCard: {
    marginTop: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },

  balanceLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginBottom: 4,
  },

  balanceAmount: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: 0.2,
  },

  balanceInfoSuccess: {
    marginTop: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },

  balanceInfoDanger: {
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    alignItems: 'flex-start',
  },

  balanceShortage: {
    marginTop: 4,
    fontFamily: Fonts.medium,
  },

  // Modern Description Input
  descriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  modernDescriptionInput: {
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  characterCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  // Modern Error Alert
  modernErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },

  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  errorText: {
    flex: 1,
    fontFamily: Fonts.medium,
  },
});

export { styles };
