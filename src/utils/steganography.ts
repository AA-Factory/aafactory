/**
 * Simple steganography utility for encoding form data into images
 */

interface FormData {
  [key: string]: string;
}

interface EncodedResult {
  blob: Blob;
  downloadUrl: string;
}

/**
 * Encodes form data into an image using LSB steganography
 * @param formData - The form data to encode
 * @param imageFile - The image file to encode into
 * @returns Promise with encoded image blob and download URL
 */
export async function encodeFormDataIntoImage(
  formData: FormData,
  imageFile: File
): Promise<EncodedResult> {

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Load image
  const img = await loadImage(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Convert form data to JSON string
  const jsonString = JSON.stringify(formData);

  // Encode data
  const encodedImageData = encodeTextInImageData(imageData, jsonString);

  // Put back encoded data
  ctx.putImageData(encodedImageData, 0, 0);

  // Convert to blob
  const blob = await canvasToBlob(canvas);
  const downloadUrl = URL.createObjectURL(blob);

  return { blob, downloadUrl };
}

/**
 * Decodes form data from an encoded image
 * @param imageFile - The encoded image file
 * @returns Promise with decoded form data or null if no data found
 */
export async function decodeFormDataFromImage(imageFile: File): Promise<FormData | null> {

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Load image
  const img = await loadImage(imageFile);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Decode text
  const decodedText = decodeTextFromImageData(imageData);

  if (!decodedText) return null;

  try {
    return JSON.parse(decodedText);
  } catch {
    return null;
  }
}

// Helper functions
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

function encodeTextInImageData(imageData: ImageData, text: string): ImageData {
  const data = imageData.data;
  const endMarker = '1111111111111110';

  // Convert text to binary
  const textBinary = text
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('') + endMarker;

  // Check capacity
  const maxCapacity = Math.floor(data.length / 4);
  if (textBinary.length > maxCapacity) {
    throw new Error(`Text too long. Max ${Math.floor(maxCapacity / 8)} characters, got ${text.length}`);
  }

  // Encode in red channel LSB
  for (let i = 0; i < textBinary.length; i++) {
    const pixelIndex = i * 4; // Red channel
    data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(textBinary[i]);
  }

  return imageData;
}

function decodeTextFromImageData(imageData: ImageData): string | null {
  const data = imageData.data;
  const endMarker = '1111111111111110';
  let binaryString = '';

  // Extract bits from red channel
  for (let i = 0; i < data.length; i += 4) {
    binaryString += (data[i] & 1).toString();
  }

  // Find end marker
  const endIndex = binaryString.indexOf(endMarker);
  if (endIndex === -1) return null;

  const textBinary = binaryString.substring(0, endIndex);
  let text = '';

  // Convert binary to text
  for (let i = 0; i < textBinary.length; i += 8) {
    const byte = textBinary.substr(i, 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }

  return text;
}

export const loadImageToCanvas = (file, canvasRef) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.src = URL.createObjectURL(file);
  });
};

export const decodeDataFromImage = (imageData) => {
  const data = imageData.data;
  let binaryString = '';

  for (let i = 0; i < data.length; i += 4) {
    binaryString += (data[i] & 1).toString();
  }

  // Find end marker
  const endMarker = '1111111111111110';
  const endIndex = binaryString.indexOf(endMarker);

  if (endIndex === -1) return null;

  const textBinary = binaryString.substring(0, endIndex);
  let text = '';

  for (let i = 0; i < textBinary.length; i += 8) {
    const byte = textBinary.substr(i, 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }

  return text;
};