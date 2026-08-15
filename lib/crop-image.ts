export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_OUTPUT = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/webp",
      0.9
    );
  });
}

export async function cropImageToBlob(
  src: string,
  pixelCrop: CropArea,
  maxOutput = MAX_OUTPUT
): Promise<Blob | null> {
  const image = await loadImage(src);
  const outputSize = Math.min(
    maxOutput,
    Math.round(Math.min(pixelCrop.width, pixelCrop.height))
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvasToBlob(canvas);
}

export async function boundImageToBlob(
  src: string,
  maxSize = MAX_OUTPUT
): Promise<Blob | null> {
  const image = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, width, height);

  return canvasToBlob(canvas);
}
