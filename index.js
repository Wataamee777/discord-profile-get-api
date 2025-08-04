import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Discord.jsクライアント設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// APIエンドポイント: /profile/:id
app.get('/profile/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await client.users.fetch(userId);
    const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const profile = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      tag: `${user.username}#${user.discriminator}`,
      avatar,
      banner: user.bannerURL({ dynamic: true, size: 1024 }) || null,
      accentColor: user.accentColor || null,
      createdAt: user.createdAt,
    };

    // 追加: presence と guild member 情報（存在する場合）
    const guild = client.guilds.cache.first(); // 1つ目のサーバーでOK
    if (guild) {
      try {
        const member = await guild.members.fetch(user.id);
        profile.status = member.presence?.status || 'offline';
        profile.activities = member.presence?.activities || [];
        profile.nickname = member.nickname || null;
      } catch (e) {
        console.warn('Guild member not found:', e.message);
      }
    }

    res.json(profile);
  } catch (err) {
    console.error('取得失敗:', err);
    res.status(500).json({ error: 'ユーザー情報を取得できませんでした' });
  }
});

// Botログイン＆サーバー起動
client.login(process.env.DISCORD_TOKEN).then(() => {
  app.listen(port, () => {
    console.log(`🚀 API listening on port ${port}`);
  });
});
