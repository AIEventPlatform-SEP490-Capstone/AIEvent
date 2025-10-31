import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    marginRight: 8,
  },
  
  icon: {
    width: 18,
    height: 18,
    tintColor: Colors.primary,
  },
  
  text: {
    flex: 1,
    textAlign: 'right',
  },
});

export { styles };

