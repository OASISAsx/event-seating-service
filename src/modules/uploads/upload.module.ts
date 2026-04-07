import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Service } from 'src/common/utils/s3.service';
import { Image, ImageSchema } from './image.schema';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowed = /image\/(jpeg|jpg|png|webp|gif)/;
        if (allowed.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, S3Service],
})
export class UploadModule {}
