import React from 'react';
import { Text, type TextProps } from '@chakra-ui/react';

const COLOR_CODES: Record<string, string> = {
  '0': '#000000', // Black
  '1': '#0000AA', // Dark Blue
  '2': '#00AA00', // Dark Green
  '3': '#00AAAA', // Dark Aqua
  '4': '#AA0000', // Dark Red
  '5': '#AA00AA', // Dark Purple
  '6': '#FFAA00', // Gold
  '7': '#AAAAAA', // Gray
  '8': '#555555', // Dark Gray
  '9': '#5555FF', // Blue
  'a': '#55FF55', // Green
  'b': '#55FFFF', // Aqua
  'c': '#FF5555', // Red
  'd': '#FF55FF', // Light Purple
  'e': '#FFFF55', // Yellow
  'f': '#FFFFFF', // White
  'g': '#DDD605', // Minecoin Gold
};

// Format codes (currently only obfuscated is tricky, others are standard CSS)
// k: Obfuscated (Magic) - Not implementing full animation for now
// l: Bold
// m: Strikethrough
// n: Underline
// o: Italic
// r: Reset

interface MinecraftTextProps extends TextProps {
  text: string;
}

export const MinecraftText: React.FC<MinecraftTextProps> = ({ text, ...props }) => {
  if (!text) return null;

  const parts = text.split(/(§[0-9a-gk-or])/g);
  
  const spans: React.ReactNode[] = [];
  let currentStyle: React.CSSProperties = {};

  // Default color based on theme mode could be handled by parent, but MC text usually has its own background context.
  // Assuming dark background context or standard text color if no code.

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith('§')) {
      const code = part.charAt(1).toLowerCase();
      
      if (COLOR_CODES[code]) {
        currentStyle = { ...currentStyle, color: COLOR_CODES[code] };
      } else {
        switch (code) {
          case 'l':
            currentStyle = { ...currentStyle, fontWeight: 'bold' };
            break;
          case 'm':
            currentStyle = { ...currentStyle, textDecoration: currentStyle.textDecoration ? `${currentStyle.textDecoration} line-through` : 'line-through' };
            break;
          case 'n':
            currentStyle = { ...currentStyle, textDecoration: currentStyle.textDecoration ? `${currentStyle.textDecoration} underline` : 'underline' };
            break;
          case 'o':
            currentStyle = { ...currentStyle, fontStyle: 'italic' };
            break;
          case 'r':
            currentStyle = {}; // Reset all styles
            break;
          // 'k' (obfuscated) is ignored for static rendering
        }
      }
    } else if (part) {
      spans.push(
        <span key={i} style={{ ...currentStyle }}>
          {part}
        </span>
      );
    }
  }

  return (
    <Text {...props}>
      {spans.length > 0 ? spans : text}
    </Text>
  );
};
