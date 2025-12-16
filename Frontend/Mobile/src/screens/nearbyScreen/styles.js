import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    // Main Container
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Map - Full Screen
    map: {
        width: width,
        height: height,
    },

    // Custom Markers
    customMarker: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 3,
        borderColor: '#ffee00ff',
    },

    customMarkerSelected: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        borderColor: '#EF4444',
        transform: [{ scale: 1.1 }],
    },

    markerText: {
        fontSize: 20,
    },

    // Top Overlay Controls
    topOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },

    overlayButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },

    locationOverlayButton: {
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },

    overlayButtonIcon: {
        fontSize: 24,
        color: '#1E293B',
    },

    locationButtonIcon: {
        fontSize: 24,
    },

    // Bottom Controls
    bottomControls: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
    },

    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        gap: 8,
    },

    filterButtonIcon: {
        fontSize: 18,
    },

    filterButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },

    filterBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginLeft: 4,
    },

    eventsListButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 28,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },

    eventsListButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    eventsListButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    eventsListButtonIcon: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // Selected Event Card
    selectedEventCard: {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
        zIndex: 10,
    },

    selectedEventContent: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },

    selectedEventIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    selectedEventEmoji: {
        fontSize: 32,
    },

    selectedEventInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },

    selectedEventTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },

    selectedEventLocation: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
    },

    selectedEventFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    selectedEventPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },

    selectedEventDistance: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },

    selectedEventCloseButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    selectedEventCloseIcon: {
        fontSize: 20,
        color: '#64748B',
        fontWeight: 'bold',
    },

    // Permission Screen
    permissionContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },

    permissionContent: {
        alignItems: 'center',
        maxWidth: 320,
    },

    permissionIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },

    permissionIconText: {
        fontSize: 48,
    },

    permissionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
    },

    permissionDescription: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },

    permissionButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 28,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    permissionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Bottom Sheet Common Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },

    bottomSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.75,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },

    eventsBottomSheet: {
        height: height * 0.85,                    
    },

    handleBar: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },

    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },

    resetButton: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3B82F6',
    },

    closeButton: {
        fontSize: 32,
        fontWeight: '300',
        color: '#94A3B8',
    },

    sheetContent: {
        flex: 1,
        paddingHorizontal: 24,
    },

    // Filter Section
    filterSection: {
        marginTop: 24,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },

    radiusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    radiusOption: {
        flex: 1,
        minWidth: '30%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },

    radiusOptionActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },

    radiusOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },

    radiusOptionTextActive: {
        color: '#3B82F6',
        fontWeight: '700',
    },

    // Category List
    categoryList: {
        gap: 12,
    },

    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },

    categoryItemActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },

    categoryRadio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    categoryRadioActive: {
        borderColor: '#3B82F6',
    },

    categoryRadioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3B82F6',
    },

    categoryItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748B',
        flex: 1,
    },

    categoryItemTextActive: {
        color: '#1E293B',
        fontWeight: '600',
    },

    // Sheet Footer
    sheetFooter: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 28,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },

    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },

    applyButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    applyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Events Count
    eventsCount: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    eventsCountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },

    // Events List in Bottom Sheet
    eventsList: {
        flex: 1,
    },

    eventListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 24,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    eventListIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    eventListEmoji: {
        fontSize: 28,
    },

    eventListContent: {
        flex: 1,
    },

    eventListTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
        lineHeight: 20,
    },

    eventListMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },

    eventListLocation: {
        fontSize: 12,
        color: '#64748B',
        flex: 1,
    },

    eventListCategory: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },

    eventListCategoryText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400E',
    },

    eventListFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    eventListPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10B981',
    },

    eventListDistance: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    eventListDistanceText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3B82F6',
    },

    eventListArrow: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    eventListArrowIcon: {
        fontSize: 28,
        color: '#CBD5E1',
        fontWeight: '300',
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },

    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748B',
    },

    // Empty List State
    emptyListState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },

    emptyListEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },

    emptyListTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },

    emptyListText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default styles;