import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import CustomText from '../../common/customTextRN';
import CustomButton from '../../common/customButtonRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import Strings from '../../../constants/Strings';

const EventActionsSection = ({
  canBuyTicket,
  ticketMessage,
  onBuyTicket,
  onOpenInviteModal,
  onOpenShareModal,
  onViewMap,
}) => {
  return (
    <View style={{ marginTop: 20 }}>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          !canBuyTicket && styles.primaryButtonDisabled,
        ]}
        onPress={onBuyTicket}
        disabled={!canBuyTicket}
        activeOpacity={0.8}>
        <CustomText variant="button" color="white" style={styles.primaryButtonText}>
          {ticketMessage}
        </CustomText>
      </TouchableOpacity>

      <View style={styles.secondaryActions}>
        <CustomButton title="Mời bạn bè" onPress={onOpenInviteModal} variant="outline" style={styles.actionButton} />
        <CustomButton title={Strings.SHARE_EVENT} onPress={onOpenShareModal} variant="outline" style={styles.actionButton} />
        <CustomButton title={Strings.EVENT_LOCATION_MAP} onPress={onViewMap} variant="outline" style={styles.actionButton} />
      </View>
    </View>
  );
};

const styles = {
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonDisabled: { backgroundColor: '#94a3b8' },
  primaryButtonText: { fontWeight: '700', fontSize: 18 },
  secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { flexBasis: '48%', marginBottom: 12 },
};

export default EventActionsSection;