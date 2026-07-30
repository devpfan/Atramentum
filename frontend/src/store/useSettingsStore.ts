import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light' | 'sepia' | 'ocean' | 'forest' | 'rose' | 'lavender';

interface SettingsState {
  theme: ThemeType;
  editorFontFamily: string;
  editorFontSize: number;
  editorLineHeight: number;
  
  setTheme: (theme: ThemeType) => void;
  setEditorFontFamily: (font: string) => void;
  setEditorFontSize: (size: number) => void;
  setEditorLineHeight: (height: number) => void;
  resetToDefault: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      editorFontFamily: 'Merriweather, serif',
      editorFontSize: 16,
      editorLineHeight: 1.6,

      setTheme: (theme) => set({ theme }),
      setEditorFontFamily: (font) => set({ editorFontFamily: font }),
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setEditorLineHeight: (height) => set({ editorLineHeight: height }),
      resetToDefault: () => set({
        theme: 'dark',
        editorFontFamily: 'Merriweather, serif',
        editorFontSize: 16,
        editorLineHeight: 1.6,
      }),
    }),
    {
      name: 'atramentum-settings',
    }
  )
);
