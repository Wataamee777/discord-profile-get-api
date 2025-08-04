import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Discordクライアント設定（Presence Intent入れてる）
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,  // Presence Intent
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// /profile/:id でユーザー情報返すAPI
app.get('/profile/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // ユーザー情報（グローバル）
    const user = await client.users.fetch(userId);

    // ベース情報セット
    const profile = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      tag: `${user.username}#${user.discriminator}`,
      avatar: user.displayAvatarURL({ dynamic: true, size: 1024 }),
      banner: user.bannerURL({ dynamic: true, size: 1024 }) || null,
      accentColor: user.accentColor || null,
      createdAt: user.createdAt.toISOString(),
      bot: user.bot,
      system: user.system,
      flags: user.flags?.toArray() || [],
      status: 'offline',      // デフォルトoffline
      customStatus: null,
    };

    // サーバーにいる場合だけpresence取得
    // キャッシュ確認してなければfetch
    const guild = client.guilds.cache.find(g => g.members.cache.has(userId));
    if (guild) {
      try {
        const member = await guild.members.fetch(userId);
        if (member.presence) {
          profile.status = member.presence.status || 'offline';
          const custom = member.presence.activities.find(a => a.type === 4);
          profile.customStatus = custom ? custom.state : null;
        }
      } catch (e) {
        console.warn('Guild member presence fetch failed:', e.message);
      }
    }

    res.json(profile);

  } catch (err) {
    console.error('ユーザー情報取得失敗:', err);
    res.status(500).json({ error: 'ユーザー情報を取得できませんでした' });
  }
});

// Botログイン＆サーバー起動
client.login(process.env.DISCORD_TOKEN).then(() => {
  app.listen(port, () => {
    console.log(`🚀 API listening on port ${port}`);
  });
});
