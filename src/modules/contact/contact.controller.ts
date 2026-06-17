import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import type { Response } from 'express';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContact(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.contactService.submitContact(body);
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }
}
