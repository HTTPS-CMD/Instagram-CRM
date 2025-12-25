// src/themeContext.js
import { createContext } from 'react';

export const ColorModeContext = createContext({
  toggleColorMode: () => {}, // تابع خالی پیش‌فرض
  mode: 'dark', // حالت پیش‌فرض
});