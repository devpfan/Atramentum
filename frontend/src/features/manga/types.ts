export type MangaBubbleType = 'speech' | 'thought' | 'scream' | 'narrative' | 'sfx';

export interface MangaBubble {
  id: string;
  type: MangaBubbleType;
  text: string;
  x: number; // Porcentaje relativo al ancho del lienzo (0-100)
  y: number; // Porcentaje relativo al alto del lienzo (0-100)
  width: number; // Ancho en píxeles
  height?: number; // Alto automático o mínimo
  fontSize: number; // Tamaño de fuente en px
  characterName?: string;
}

export interface MangaImageItem {
  id: string;
  url: string;
  x: number; // Porcentaje relativo al ancho del lienzo (0-100)
  y: number; // Porcentaje relativo al alto del lienzo (0-100)
  width: number; // Ancho en píxeles
  height?: number; // Alto en píxeles (opcional)
  zIndex: number; // Capa de profundidad
}

export type MangaPanelLayout = 
  | 'none' 
  | 'splash' 
  | '4koma' 
  | 'classic-6' 
  | 'dynamic-3' 
  | 'action-5' 
  | 'webtoon-strip';

export interface MangaPageCanvasData {
  type: 'manga_canvas';
  layout?: MangaPanelLayout; // Plantilla de viñetas
  images?: MangaImageItem[]; // Lista de imágenes individuales posicionables
  image_url?: string | null; // Retrocompatibilidad
  page_width?: number; // Ancho del lienzo en píxeles (default 680)
  bubbles: MangaBubble[];
}
