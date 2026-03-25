// upload/upload.controller.ts
import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import type { Request } from 'express'; // ✅ เพิ่ม type

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' ต้องตรงกับ key ที่ส่งมาจาก frontend
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    console.log(file, 'file');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const saved = await this.uploadService.saveImage(file, baseUrl);
    return {
      id: saved.id,
      url: saved.url,
      filename: saved.filename,
      size: saved.size,
    };
  }

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }
}
