import React from "react";
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/webp" | "image/jpeg";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  outputFormat: "image/webp",
};

/**
 * Compresses an image file using canvas
 * Reduces file size by 50-90% with minimal quality loss
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxW = opts.maxWidth!;
      const maxH = opts.maxHeight!;

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Use better image smoothing for quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG if not supported
      let outputFormat = opts.outputFormat!;
      let base64 = canvas.toDataURL(outputFormat, opts.quality);

      // Check if WebP is actually supported (some browsers return PNG)
      if (
        outputFormat === "image/webp" &&
        !base64.startsWith("data:image/webp")
      ) {
        outputFormat = "image/jpeg";
        base64 = canvas.toDataURL(outputFormat, opts.quality);
      }

      // Cleanup
      URL.revokeObjectURL(img.src);

      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };

    // Create object URL for faster loading than FileReader
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresses multiple images in parallel
 * Much faster than sequential processing
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Handles single file input and returns compressed base64
 */
export async function handleFileToBase64Compressed(
  event: React.ChangeEvent<HTMLInputElement>,
  callback: (base64: string) => void,
  options: CompressionOptions = {}
): Promise<void> {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const compressedBase64 = await compressImage(file, options);
    callback(compressedBase64);
  } catch (error) {
    console.error("Image compression failed:", error);
    // Fallback to original file if compression fails
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Handles multiple file input and returns compressed base64 array
 * Processes all images in parallel for maximum speed
 */
export async function handleMultipleFilesToBase64Compressed(
  event: React.ChangeEvent<HTMLInputElement>,
  callback: (base64Images: string[]) => void,
  options: CompressionOptions = {}
): Promise<void> {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    const fileArray = Array.from(files);
    const compressedImages = await compressImages(fileArray, options);
    callback(compressedImages);
  } catch (error) {
    console.error("Image compression failed:", error);
    // Fallback to original files if compression fails
    const fileArray = Array.from(files);
    const readPromises = fileArray.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    const results = await Promise.all(readPromises);
    callback(results);
  }
}
