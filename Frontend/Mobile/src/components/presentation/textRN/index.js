import React from 'react';
import { Text } from 'react-native';

// Simple text component for presentation layer
const TextRN = ({ children, style, ...props }) => {
  return (
    <Text style={style} {...props}>
      {children}
    </Text>
  );
};

export default TextRN;
