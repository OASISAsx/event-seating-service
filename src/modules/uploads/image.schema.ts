// upload/image.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema({ timestamps: true })
export class Image {
  id: string;
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
