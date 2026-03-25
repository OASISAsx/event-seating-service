import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image, ImageDocument } from './image.schema';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(Image.name)
    private imageModel: Model<ImageDocument>,
  ) {}

  async saveImage(file: Express.Multer.File, baseUrl: string): Promise<Image> {
    const url = `${baseUrl}/uploads/${file.filename}`;

    const image = new this.imageModel({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      url,
      mimetype: file.mimetype,
      size: file.size,
    });

    return image.save();
  }

  async findAll(): Promise<Image[]> {
    return this.imageModel.find().sort({ createdAt: -1 }).exec();
  }
}
