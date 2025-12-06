import {StyleSheet, Dimensions, Platform} from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const {width, height} = Dimensions.get('window');

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

  // Premium Image section
  imageContainer: {
    width: '100%',
    height: height * 0.4,
    position: 'relative',
    height: height * 0.45,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Reduced opacity from 0.8 to 0.3
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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

  // Premium Content
  content: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: height * 0.65,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },

  // Title section
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

  // Premium Price badge
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
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
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
    borderColor: Colors.accent, // Changed to light blue accent color for consistency
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
    borderBottomColor: Colors.accent, // Changed from Colors.border to Colors.accent for consistency
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

  // Ticket information styles
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white, // Changed from undefined Colors.cardBackground to Colors.white
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accent, // Changed to light blue accent color
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 32,
    backgroundColor: '#FAFBFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent, // Changed to light blue accent color for consistency
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

  // Description section
  descriptionSection: {
    marginBottom: 32,
    backgroundColor: '#FAFBFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent, // Changed to light blue accent color for consistency
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
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },

  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  shareBackdrop: {
    flex: 1,
  },

  shareContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },

  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  closeIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.secondary,
  },

  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  shareGridItem: {
    width: '30%',
    marginBottom: 20,
    alignItems: 'center',
  },

  shareGridIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },

  shareGridText: {
    textAlign: 'center',
    fontSize: 12,
  },

  // Invite Friends Modal Styles
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  inviteModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inviteModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  inviteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inviteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  inviteModalCloseButton: {
    padding: 4,
  },
  inviteModalCloseIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.secondary,
  },
  inviteModalBody: {
    maxHeight: height * 0.6,
    padding: 20,
  },
  inviteMessageContainer: {
    marginBottom: 24,
  },
  inviteMessageLabel: {
    fontSize: Fonts.md,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
  },
  inviteMessageInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    padding: 12,
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: Colors.background,
  },
  friendsListContainer: {
    marginBottom: 20,
  },
  friendsListTitle: {
    fontSize: Fonts.md,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: Fonts.semiBold,
  },
  loadingFriendsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFriendsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friendItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: Colors.primary,
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: Fonts.md,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  friendDistrict: {
    fontSize: Fonts.sm,
  },
  friendCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  inviteModalButton: {
    flex: 1,
  },
  inviteModalCancelButton: {
    marginRight: 0,
  },
  inviteModalSendButton: {
    marginLeft: 0,
  },
});

export default styles;
