import { Injectable } from '@nestjs/common';
import { Markup, Context } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../warranty/warranty.entity';
import { InjectBot, Start, Update, On, Ctx } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as LocalSession from 'telegraf-session-local';
import axios from 'axios';

@Update()
@Injectable()
export class BotService {

  private readonly CFG = {
    GEO_OPTS: [
      { flag: '🇬🇷', code: 'GR' },
    ],
  };

  constructor (
    @InjectRepository(Users) private warrantyRepository: Repository<Users>,
    @InjectBot() private readonly bot: Telegraf<Context>,
  )
  
  {
    const localSession = new LocalSession({ database: 'session_db.json' });
    this.bot.use(localSession.middleware());
  }

  async sendImageToManager(managerId: string, filePath: string, clientName: string) {
    await this.bot.telegram.sendPhoto(managerId, { source: filePath }, { caption: clientName });
  }

  private generateGeoKeyboard() {
    return this.CFG.GEO_OPTS.map((geo) => [Markup.button.text(`${geo.flag} ${geo.code}`)]);
  }

  private async handleAdminCommands(ctx: any) {
    const text = ctx.message.text.split(' ');

    // Проверка на наличие прав
    const user = await this.warrantyRepository.findOneBy({ id: ctx.message.from.id });
    if (!user || !user.isAdmin) {
      return ctx.reply('Нет прав администратора');
    }

    const command = text[0].toLowerCase();

    if (command === '/adduser') {
      if (text.length < 2) {
        return ctx.reply('Укажи ID');
      }

      const newUserId = text[1];

      await this.warrantyRepository.save({ id: newUserId, hasAccess: true });
      return ctx.reply(`Пользователь ${newUserId} добавлен.`);
    } else if (command === '/setaccess') {
      if (text.length < 2) {
        return ctx.reply('Укажи ID');
      }

      try {
        const userId = text[1];
        const setAccessTo = text[2];

        // Обновление записи пользователя
        const userToBan = await this.warrantyRepository.findOneBy({ id: userId });
        if (!userToBan) {
          return ctx.reply('Пользователь не найден');
        }

        userToBan.hasAccess = setAccessTo;
        await this.warrantyRepository.save(userToBan);
        return ctx.reply('Готово');
      } catch (err) {
        ctx.reply('Разрешить - 1, запретить - 0');
      }
    } else {
      return ctx.reply('Неизвестная команда');
    }
  }

  @Start()
  async handleStart(@Ctx() ctx: any) {
    ctx.session.formActive = false;
    ctx.session.geo = null;
    await ctx.reply('Выбери гео 👇', Markup.keyboard(this.generateGeoKeyboard()).resize().oneTime());
  }

  @On('text')
  async handleText(@Ctx() ctx: any) {
    if (ctx.message.text.startsWith('/')) {
      await this.handleAdminCommands(ctx);
      return;
    }

    const text = ctx.message.text;
    const selectedGeo = this.CFG.GEO_OPTS.find((geo) => text === `${geo.flag} ${geo.code}`);

    const user = await this.warrantyRepository.findOneBy({ id: ctx.message.from.id });
    if (!user || !user.hasAccess) {
      ctx.reply('Отказано.');
      return;
    }

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
        const [created_on, exists_in, exists_in_2, hero_1, hero_2, hero_3, client_name, to_pay, salary] = data;

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
