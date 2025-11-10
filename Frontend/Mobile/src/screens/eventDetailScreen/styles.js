import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  
  // Premium Image section
  imageContainer: {
    position: 'relative',
    height: height * 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
  },
  
  // Premium Content
  content: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: height * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  
  // Title section
  titleSection: {
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  starIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.warning,
    marginRight: 8,
  },
  
  // Premium Price badge
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Premium Details section
  detailsSection: {
    marginBottom: 28,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 22,
    fontFamily: Fonts.bold,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  detailIcon: {
    width: 28,
    height: 28,
    tintColor: Colors.primary,
    marginRight: 16,
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
  },
  
  // Ticket information styles
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F3F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketRowUnavailable: {
    backgroundColor: '#F8F9FA',
    opacity: 0.7,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  ticketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketStat: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  ticketPriceContainer: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.primary,
  },
  
  // Description section
  descriptionSection: {
    marginBottom: 32,
    backgroundColor: '#FAFBFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  
  // Premium Actions section
  actionsSection: {
    marginBottom: 24,
  },
  joinButton: {
    marginBottom: 16,
    borderRadius: 20,
    paddingVertical: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  // New modern UI elements based on web version
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButtonWeb: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonWebPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textSecondary,
    marginRight: 8,
  },
  actionIconPrimary: {
    tintColor: Colors.white,
  },
  actionText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  actionTextPrimary: {
    color: Colors.white,
    fontWeight: '600',
  },
  
  // Organizer section
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  organizerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  organizerAvatarText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  organizerEvents: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  
  // Tags section
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  
  // Stats section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  
  // Share button
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  shareButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginLeft: 8,
  },
  
  // Program schedule section
  programSection: {
    marginBottom: 28,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  programTime: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 16,
  },
  programTimeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  programContent: {
    flex: 1,
  },
  programTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  
  // Benefits section
  benefitsSection: {
    marginBottom: 28,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  benefitsTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
    fontWeight: '800',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 16,
    height: 16,
    tintColor: '#3B82F6',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1E40AF',
  },
  
  // Location section
  locationSection: {
    marginBottom: 28,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  locationMap: {
    height: 150,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationMapPlaceholder: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  
  // Related events section
  relatedEventsSection: {
    marginBottom: 28,
  },
  relatedEventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  relatedEventImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  relatedEventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedEventTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  relatedEventDate: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  relatedEventPrice: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
});

export { styles };