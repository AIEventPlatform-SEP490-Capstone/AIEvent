import {StyleSheet, Dimensions} from 'react-native';
import Colors from '../../constants/Colors';

const {width} = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  headerContent: {
    gap: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  eventInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  stepText: {
    fontSize: 12,
    color: Colors.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    width: '0%',
  },

  // Tickets Section
  ticketsContainer: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketCardSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ticketInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDetails: {
    flex: 1,
    gap: 4,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
  },
  ticketRemaining: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  quantityInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    color: '#1F2937',
  },
  quantityInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookButton: {
    width: 160,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Success Screen
  successContainer: {
    flex: 1,
  },
  successGradient: {
    flex: 1,
    padding: 24,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginHorizontal: 24,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 24,
  },
  qrCode: {
    width: 176,
    height: 176,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  mainButton: {
    height: 48,
  },
  secondaryButton: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
