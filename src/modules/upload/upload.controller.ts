import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import type { Response } from 'express';

@Controller('api/upload-image')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async uploadImage(@Body() body: { filename: string; base64: string }, @Res() res: Response) {
    try {
      if (!body.filename || !body.base64) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'filename and base64 are required' });
      }
      const imagePath = await this.uploadService.saveBase64Image(body.filename, body.base64);
      return res.status(HttpStatus.OK).json({ success: true, path: imagePath });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}
