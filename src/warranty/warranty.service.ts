import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCanvas, loadImage } from 'canvas';
import { Warranty } from './warranty.entity';
import { BotService } from '../bot/bot.service'
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WarrantyService {
  constructor(
    @InjectRepository(Warranty)
    public warrantyRepository: Repository<Warranty>,
    private readonly botService: BotService,
  ) {}

  async getRep() {
    return this.warrantyRepository
  }

  async generateImage(text: string[], positions: { x: number, y: number }[], geo: string, managerId: string, clientName: string) {
    try {
      if (!text || !positions || positions.length === 0) {
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      }

      const imagePath = path.join(__dirname, `/../../client/public/assets/dummy/${geo}.PNG`);
      const baseImage = await loadImage(imagePath);

      const width = baseImage.width;
      const height = baseImage.height;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(baseImage, 0, 0, width, height);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 34px "Times New Roman"';            

      positions.forEach((pos, index) => {
        if (index > 3) {
          ctx.font = 'italic 34px "Times New Roman"'; 
        }

        ctx.fillText(text[index] || '', pos.x, pos.y);
      });

      const id = Date.now();
      const outputPath = path.join(__dirname, `/../../client/public/assets/${id}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      
      await this.warrantyRepository.save({
        id: id.toString(),
        managerId: managerId,
        clientName: clientName,
        confirmed: 'false',
      });
    
      stream.pipe(out);
      return { url: id }
    } catch (error) {
      console.log(error)
      throw new HttpException('An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async confirmImage(id: string) {
    try {
      await this.warrantyRepository.update({ id }, { confirmed: 'true' });
    } catch (error) {
      throw new HttpException('An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async saveImage(imageData: string, filename: string) {
    try {
      const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
      const filePath = path.join(__dirname, `/../../client/public/assets/${filename}`);
      const warranty = await this.warrantyRepository.findOneBy({ id: filename.replace('.png', '') });

      fs.writeFileSync(filePath, base64Data, 'base64');

      if (warranty) {
        await this.botService.sendImageToManager(warranty.managerId, filePath, warranty.clientName);
      }

      return { message: 'Image saved successfully', filePath };
    } catch (error) {
      throw new HttpException('Failed to save image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
