import React from 'react';
import { Text } from 'react-native';
import { styles } from './styles';
import Fonts from '../../../constants/Fonts';

const CustomText = ({
  children,
  style,
  variant = 'body', // h1, h2, h3, body, caption, button
  color = 'primary',
  align = 'left',
  numberOfLines,
}) => {
  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${variant}Text`], styles[`${color}Text`], styles[`${align}Text`]];
    if (style) baseStyle.push(style);
    return baseStyle;
  };

  return (
    <Text style={getTextStyle()} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

export default CustomText;
