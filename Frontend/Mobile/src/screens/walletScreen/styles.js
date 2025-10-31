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

  // Wallet Header
  walletHeaderCard: {
    backgroundColor: Colors.primary,
    margin: 12,
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
    backgroundColor: Colors.gray,
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
});

export { styles };
