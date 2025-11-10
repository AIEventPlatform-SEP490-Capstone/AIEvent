import React from 'react';
import {LinearGradient} from 'expo-linear-gradient';

const GradientView = ({colors, style, children}) => {
  return (
    <LinearGradient colors={colors} style={style}>
      {children}
    </LinearGradient>
  );
};

export default GradientView;
