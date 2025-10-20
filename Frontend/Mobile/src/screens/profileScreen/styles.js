import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  editIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.white,
  },

  userName: {
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },

  userEmail: {
    fontFamily: Fonts.regular,
  },

  // Actions Section
  actionsSection: {
    backgroundColor: Colors.white,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
    marginRight: 16,
  },

  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textLight,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },

  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
  },

  // App Info Section
  appInfoSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});

export { styles };
