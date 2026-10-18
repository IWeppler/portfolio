import type { FontKey, FontWeight } from "../fonts";

// Un kit de marca es la configuracion completa de una identidad: con esto
// Claude diseña, el render dibuja y el lint avisa cuando algo se sale.

export type ColorToken = { value: string; use: string };

/** Rol tipografico: valores por defecto de una capa de texto y su rango permitido. */
export type TypeRole = {
  font: FontKey;
  weight: FontWeight;
  size: number;
  min: number;
  max: number;
  lineHeight: number;
  /** Letter spacing en em. */
  tracking: number;
  uppercase?: boolean;
  color: string;
  use: string;
};

export type BrandAsset = {
  src: string;
  /** Ancho / alto, para que Claude arme la caja sin deformar. */
  ratio: number;
  use: string;
};

export type BrandKit = {
  id: string;
  name: string;
  description: string;
  colors: Record<string, ColorToken>;
  background: string;
  /** Color de texto cuando una capa no dice cual. */
  ink: string;
  /** Color de lo marcado con [[...]] en un texto. */
  highlight: string;
  type: Record<string, TypeRole>;
  layout: {
    /** Distancia minima de texto, imagenes y logos a los bordes del lienzo. */
    safeMargin: number;
    /** Fraccion del lienzo que ocupan las imagenes (sin contar logos). */
    imageShare: { min: number; max: number };
    radii: number[];
    notes: string[];
  };
  fontRules: string[];
  compositions: { name: string; description: string }[];
  decoration: string[];
  voice: string[];
  rules: string[];
  logos: BrandAsset[];
  /** Capturas propias de la marca (aparte de lo que traiga list_assets). */
  assets: BrandAsset[];
};
