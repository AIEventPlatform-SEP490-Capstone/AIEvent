import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px margin on each side

export const styles = StyleSheet.create({
    // Main Card Container
    eventCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
        }),
    },

    // Image Section
    imageContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
        backgroundColor: '#F5F5F5',
    },

    eventImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },

    // Top Badges Row
    topBadgesRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    // AI Recommendation Badge
    aiRecommendationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(113, 113, 113, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },

    aiIconContainer: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    aiIcon: {
        fontSize: 12,
        lineHeight: 16,
    },

    aiRecommendationText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    // Sale Status
    saleStatusContainer: {
        flex: 1,
    },

    // Favorite Button
    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },

    favoriteIcon: {
        width: 22,
        height: 22,
        tintColor: '#FF4757',
    },

    // Date Badge on Image
    dateBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 60,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },

    dateBadgeDay: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        lineHeight: 24,
    },

    dateBadgeMonth: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666666',
        textTransform: 'uppercase',
        marginTop: -2,
    },

    // Content Container
    contentContainer: {
        padding: 16,
    },

    // Category Badge
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#ddf4f8ff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        marginBottom: 10,
    },

    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000000ff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Title
    eventTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
        lineHeight: 24,
        marginBottom: 6,
    },

    // Description
    eventDescription: {
        fontSize: 13,
        color: '#666666',
        lineHeight: 20,
        marginBottom: 12,
    },

    // AI Recommendation Reason
    reasonContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF9E6',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },

    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B7500',
    },

    reasonText: {
        flex: 1,
        fontSize: 12,
        color: '#666666',
        lineHeight: 18,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },

    // Details Grid
    detailsGrid: {
        gap: 10,
        marginBottom: 12,
    },

    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    detailIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',

    },

    detailIcon: {
        width: 16,
        height: 16,
        tintColor: '#514e4eff',
        resizeMode: 'contain',

    },

    detailText: {
        flex: 1,
        fontSize: 13,
        color: '#333333',
        fontWeight: '500',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },

    // Rating
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    starIcon: {
        width: 14,
        height: 14,
        tintColor: '#FFC107',
        marginRight: 4,
    },

    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },

    attendeesText: {
        fontSize: 12,
        color: '#999999',
        marginLeft: 2,
    },

    // Price Tag
    priceTag: {
        backgroundColor: Colors.primary || '#673AB7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 12,
    },

    priceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
});