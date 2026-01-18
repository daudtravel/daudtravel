import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
  url: string;
  path: string;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir = join(process.cwd(), 'public', 'uploads');
  private readonly allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];
  private readonly maxFileSize = 10 * 1024 * 1024;

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadBase64Image(
    base64: string,
    folder: string,
  ): Promise<UploadedFile> {
    const { buffer, extension } = this.parseBase64(base64);
    return this.saveImage(buffer, folder, extension);
  }

  async uploadBase64Images(
    base64Images: string[],
    folder: string,
  ): Promise<UploadedFile[]> {
    return Promise.all(
      base64Images.map((base64) => this.uploadBase64Image(base64, folder)),
    );
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = filePath.startsWith('/uploads/')
        ? join(process.cwd(), 'public', filePath)
        : filePath;

      await fs.unlink(fullPath);
    } catch (error) {
      console.warn(`Failed to delete file: ${filePath}`, error);
    }
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((path) => this.deleteFile(path)));
  }

  private parseBase64(base64: string): { buffer: Buffer; extension: string } {
    const matches = base64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

    if (!matches) {
      throw new BadRequestException('Invalid base64 image format');
    }

    const [, mimeType, data] = matches;
    const fullMime = `image/${mimeType}`;

    if (!this.allowedMimes.includes(fullMime)) {
      throw new BadRequestException(
        `Unsupported image format. Allowed: ${this.allowedMimes.join(', ')}`,
      );
    }

    const buffer = Buffer.from(data, 'base64');

    if (buffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`,
      );
    }

    return { buffer, extension: mimeType };
  }

  private async saveImage(
    buffer: Buffer,
    folder: string,
    extension: string,
  ): Promise<UploadedFile> {
    const folderPath = join(this.uploadDir, folder);

    await fs.mkdir(folderPath, { recursive: true });

    const filename = `${uuidv4()}.avif`;
    const filePath = join(folderPath, filename);

    await sharp(buffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .avif({ quality: 80 })
      .toFile(filePath);

    return {
      url: `/uploads/${folder}/${filename}`,
      path: filePath,
    };
  }

  async generateThumbnail(
    originalPath: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    const parsedPath = originalPath.replace('/uploads/', '');
    const [folder, filename] = parsedPath.split('/');
    const thumbFilename = `thumb_${filename}`;
    const thumbPath = join(this.uploadDir, folder, thumbFilename);

    const sourcePath = join(this.uploadDir, parsedPath);

    await sharp(sourcePath)
      .resize(width, height, { fit: 'cover' })
      .avif({ quality: 70 })
      .toFile(thumbPath);

    return `/uploads/${folder}/${thumbFilename}`;
  }
}
