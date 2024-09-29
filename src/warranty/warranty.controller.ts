import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { WarrantyService } from './warranty.service';
import { Repository } from 'typeorm';
import { Warranty } from './warranty.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';

@Controller('api')
export class WarrantyController {
  constructor(
    @InjectRepository(Warranty)
    private warrantyRepository: Repository<Warranty>,
    private readonly warrantyService: WarrantyService,        
  ) {}

  @Post('generate')
  async generate(@Body() body: any) {
    return this.warrantyService.generateImage(body.text, body.positions, body.geo, body.manager_id, body.client_name);
  }

  @Post('confirm')
  async confirm(@Body('id') id: string) {
    await this.warrantyService.confirmImage(id);
  }

  @Post('save-image')
  async saveImage(@Body() body: any) {
    return this.warrantyService.saveImage(body.imageData, body.filename);
  }

  @Get('warranty/assets/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(__dirname, `/../../client/public/assets/${filename}.png`);
    res.sendFile(filePath)
  }

  @Get('warranty/:filename')
  async getWarranty(@Param('filename') filename: string, @Res() res: Response) {
    const result = (await this.warrantyRepository.findOneBy({id: filename}))
    
    if (!result) {
      res.render('404')
      return;
    }
    
    const confirmed = result.confirmed;
    res.render('index', { filename: filename, filePath: `${process.env.DOMAIN_URL}/api/warranty/assets/${filename}`, confirmed: confirmed   });
  }
}