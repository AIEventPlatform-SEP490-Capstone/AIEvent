import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import Images from '../../../../constants/Images';
import Colors from '../../../../constants/Colors';

const StaffQRButton = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={styles.qrButton}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Image source={Images.qrCode} style={styles.qrIcon} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    qrButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 44,
        right: 20,
        zIndex: 10,
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    qrIcon: {
        width: 24,
        height: 24,
        tintColor: Colors.primary,
    },
});

export default StaffQRButton;