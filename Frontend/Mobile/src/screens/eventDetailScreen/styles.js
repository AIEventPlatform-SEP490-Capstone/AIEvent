import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Reduced opacity from 0.8 to 0.3
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.white,
  },
  qrButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  qrIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.white,
  },
  content: {
    padding: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    zIndex: 5,
  },
  titleSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: Colors.warning,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  // Organizer section
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerAvatarText: {
    fontSize: Fonts.md,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  organizerEvents: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: Colors.tagBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.medium,
  },
  programSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  programItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  programTime: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  programTimeText: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  programContent: {
    flex: 1,
  },
  programTitle: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  programDescription: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: Colors.primary,
  },
  benefitText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: Colors.primary,
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticketRowUnavailable: {
    opacity: 0.6,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  ticketStats: {
    flexDirection: 'row',
  },
  ticketStat: {
    fontSize: Fonts.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    marginRight: 12,
  },
  ticketPriceContainer: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: Fonts.md,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  relatedEventsSection: {
    marginBottom: 24,
  },
  relatedEventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  relatedEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  relatedEventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedEventTitle: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  relatedEventDate: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  relatedEventPrice: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  shareButtonText: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginLeft: 8,
  },
  actionsSection: {
    marginBottom: 24,
  },
  joinButton: {
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});