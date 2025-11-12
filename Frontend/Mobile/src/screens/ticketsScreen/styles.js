import {StyleSheet} from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },

  /** Header Gradient */
  header: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },

  /** Scroll content */
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /** Card sự kiện (Cấp 1) */

  card: {
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  eventImage: {
    width: '100%',
    height: 190, // cao hơn 1 chút để ảnh có không gian
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },

  eventTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },

  eventSubtitle: {
    fontFamily: Fonts.regular,
    color: '#f1f1f1',
    fontSize: 13,
    lineHeight: 18,
  },

  /** Quay lại */

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  backGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: {
    color: '#fff',
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginLeft: 6,
  },

  /** Section title */
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 12,
  },

  /** Card loại vé (Cấp 2) */
  ticketTypeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketTypeTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.primary,
    marginBottom: 6,
  },
  ticketTypeSub: {
    fontFamily: Fonts.regular,
    color: '#6B7280',
    fontSize: 14,
  },

  /** Card vé cụ thể (Cấp 3) */
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  qrButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    elevation: 5,
  },

  /** Modal QR */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalBox: {
    width: '80%',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 6,
    borderRadius: 20,
  },
  qrBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4,
  },

  /** Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
