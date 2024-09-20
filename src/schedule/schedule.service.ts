import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);

  @Cron('* * * * *')
  handleCron() {
    const assetsDir = path.join(__dirname, '..', '..', '/client/public/assets');
    fs.readdir(assetsDir, (err, files) => {
      if (err) {
        this.logger.error(`Ошибка при чтении директории: ${err.message}`);
        return;
      }

      files.forEach(file => {
        const filePath = path.join(assetsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            this.logger.error(`Ошибка при получении информации о файле: ${err.message}`);
            return;
          } else if (file == 'dummy') {
            return;
          }

          const now = Date.now();
          const fileTime = new Date(stats.mtime).getTime();
          const age = (now - fileTime) / (1000 * 60 * 60 * 24); // возраст файла в днях
          
          this.logger.log(`Файл ${file} имеет возраст: ${age.toFixed(2)} дней`);
          
          if (age > 0.6) { // старше одного дня
            fs.unlink(filePath, err => {
              if (err) {
                this.logger.error(`Ошибка при удалении файла ${filePath}: ${err.message}`);
              } else {
                this.logger.log(`Файл удалён: ${filePath}`);
              }
            });
          }
        });
      });
    });
  }
}
