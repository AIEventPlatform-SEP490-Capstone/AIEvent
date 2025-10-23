import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Hiển thị splash screen trong 2 giây
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={require('../../../assets/images/loginpanel.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* White Overlay with 50% opacity */}
      <View style={styles.overlay} />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/AIEventLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.69)', 
    top: 0,
    left: 0,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: width * 1, 
    height: width * 1 * 0.5, 
  },
});

export default SplashScreen;
