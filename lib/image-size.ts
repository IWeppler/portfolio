export type ImageSize = { width: number; height: number };

// Los primeros 64 KB alcanzan para el encabezado de PNG, WebP y casi todos los
// JPEG (el tamano esta en el marcador SOF, despues de los metadatos).
const HEAD_BYTES = 65536;

function readPng(b: Buffer): ImageSize | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function readWebp(b: Buffer): ImageSize | null {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return null;
}

function readJpeg(b: Buffer): ImageSize | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    // SOF0..SOF15 salvo DHT (C4), JPG (C8) y DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/**
 * Ancho y alto reales de una imagen remota, leyendo solo su encabezado. Las
 * subidas del panel tienen nombre unico y nunca cambian, asi que el resultado
 * se cachea para siempre: cada imagen se mide una sola vez.
 *
 * Sirve para mostrarla con su proporcion y sin agrandarla mas alla de su
 * tamano (agrandar una captura chica es lo que la pixela). Si el formato no se
 * reconoce o la descarga falla, devuelve null y el que llama usa un default.
 */
export async function getImageSize(url: string): Promise<ImageSize | null> {
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${HEAD_BYTES - 1}` },
      cache: "force-cache",
    });
    if (!response.ok) return null;
    const head = Buffer.from(await response.arrayBuffer());
    const size = readPng(head) ?? readWebp(head) ?? readJpeg(head);
    return size && size.width > 0 && size.height > 0 ? size : null;
  } catch {
    return null;
  }
}
