import { Injectable, UploadedFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Service } from 'src/common/utils/s3.service';
import { Image, ImageDocument } from './image.schema';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(Image.name)
    private readonly imageModel: Model<ImageDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const uploaded = await this.s3Service.uploadFile(file);

    const image = new this.imageModel({
      originalName: file.originalname,
      filename: uploaded.key,
      path: uploaded.key,
      url: uploaded.url,
      mimetype: file.mimetype,
      size: file.size,
    });

    const saved = await image.save();

    return {
      id: saved.id,
      url: saved.url,
      filename: saved.filename,
      size: saved.size,
      message: 'Upload to Cloudflare R2 Success!',
    };
  }

  async findAll(): Promise<Image[]> {
    return this.imageModel.find().sort({ createdAt: -1 }).exec();
  }
}
