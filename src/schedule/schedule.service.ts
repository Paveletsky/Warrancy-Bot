import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Warranty } from '../warranty/warranty.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);

  constructor(
    @InjectRepository(Warranty)
    private warrantyRepository: Repository<Warranty>,
  ) {}

  @Cron('* * * * *')
  async handleCron() {
    const assetsDir = path.join(__dirname, '..', '..', '/client/public/assets');
    
    try {
      const files = await fs.readdir(assetsDir);

      for (const file of files) {
        const filePath = path.join(assetsDir, file);

        try {
          const stats = await fs.stat(filePath);
          
          if (file === 'dummy') {
            continue;
          }

          const now = Date.now();
          const fileTime = new Date(stats.mtime).getTime();
          const age = (now - fileTime) / (1000 * 60 * 60 * 24); // возраст файла в днях          

          this.logger.log(`Файл ${file} имеет возраст: ${age.toFixed(2)} дней`);

          if (age >= 0.0) { // старше одного дня
            await fs.unlink(filePath);

            let tmpPath = file.replace(".png", "")

            if ( await this.warrantyRepository.findOneBy({id: tmpPath}) ) {
              this.warrantyRepository.delete({id: tmpPath})
            }
            
            this.logger.log(`Файл удалён: ${tmpPath}`);
          }
        } catch (err) {
          this.logger.error(`Ошибка при обработке файла ${file}: ${err.message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Ошибка при чтении директории: ${err.message}`);
    }
  }
}
