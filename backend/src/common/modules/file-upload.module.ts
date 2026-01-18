import { Module, Global } from '@nestjs/common';
import { FileUploadService } from '../utils/file-upload.util';

@Global()
@Module({
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
