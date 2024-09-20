import { Injectable } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import * as LocalSession from 'telegraf-session-local';
import axios from 'axios';

@Injectable()
export class BotService {
  private bot: Telegraf;
  private readonly CFG = {
    GEO_OPTS: [
      { flag: '🇬🇷', code: 'GR' },
    ],
  };

  constructor() {
    this.bot = new Telegraf(process.env.BOT_TOKEN);

    const localSession = new LocalSession({ database: 'session_db.json' });
    this.bot.use(localSession.middleware());

    this.bot.start((ctx) => this.handleStart(ctx));
    this.bot.on('text', (ctx) => this.handleText(ctx));
    
    this.bot.launch();
  }
  
  async sendImageToManager(managerId: string, filePath: string, clientName: string) {
    await this.bot.telegram.sendPhoto(managerId, { source: filePath }, { caption: clientName });
  }

  private generateGeoKeyboard() {
    return this.CFG.GEO_OPTS.map((geo) => [Markup.button.text(`${geo.flag} ${geo.code}`)]);
  }

  private async handleStart(ctx: any) {
    ctx.session.formActive = false;
    ctx.session.geo = null;
    await ctx.reply('Выбери гео 👇', Markup.keyboard(this.generateGeoKeyboard()).resize().oneTime());
  }

  private async handleText(ctx: any) {
    const text = ctx.message.text;
    const selectedGeo = this.CFG.GEO_OPTS.find(geo => text === `${geo.flag} ${geo.code}`);
    
    if (selectedGeo) {
      ctx.session.geo = selectedGeo.code;
      ctx.session.formActive = true;

      await ctx.replyWithPhoto('https://i.imgur.com/pPyHtGO.png', {
        caption: `
💡 Введите эти параметры по очереди в ОДНОМ сообщении. Каждый параметр на новой строчке:

1. Имя Героя (пример: Johny Silverhand)
2. Дата создания договора (пример: 18.12.2023)
3. Действует до (пример: 18.12.2023)
4. Имя Героя (пример: Johny Silverhand)
5. Сумма оплаты (пример: 1120 eur)
6. Сумма заработка (пример: 1120 eur)
7. Имя Лида (пример: Adam Smasher)
8. Действует до (пример: 18.12.2023)
9. Имя Лида (пример: Adam Smasher)
        `,
      });
    } else if (ctx.session.formActive) {
      const data = ctx.message.text.split('\n');
      if (data.length >= 9) {
        const [
          created_on, exists_in, exists_in_2, hero_1, 
          hero_2, hero_3, client_name, to_pay, salary
        ] = data;

        try {
          const response = await axios.post(`${process.env.API_URL}/api/generate`, {
            manager_id: ctx.message.from.id,
            client_name: salary,
            text: [
              '40012121988',
              created_on, 
              exists_in, 
              exists_in_2,
              hero_1,
              hero_2,
              hero_3,
              client_name,
              to_pay,
              salary,
            ],
            positions: [
              { x: 737, y: 840 },
              { x: 737, y: 900 },
              { x: 737, y: 960 },
              { x: 737, y: 1020 },                        
              { x: 420, y: 1455 },
              { x: 360, y: 1570 },
              { x: 785, y: 1630 },
              { x: 880, y: 1515 },
              { x: 1025, y: 1690 },
              { x: 370, y: 2035 },
            ],
            geo: ctx.session.geo,
          });

          await ctx.reply('Ссылка готова 👇');
          await ctx.reply(`${process.env.DOMAIN_URL}/api/warranty/${response.data.url}`, Markup.keyboard(this.generateGeoKeyboard()).resize().oneTime());
        } catch (error) {
          await ctx.reply(`Ошибка: ${error.message}`);
        }

        ctx.session.formActive = false;
      } else {
        await ctx.reply('Минимум 9 строк данных.');
      }
    } else {
      await ctx.reply('Сначала выбери ГЕО');
    }
  }
}
