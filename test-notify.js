// Discord通知テストスクリプト
// ダミーデータで通知が届くかを確認する

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendTestNotification() {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL が設定されていません");
    process.exit(1);
  }

  const dummyProduct = {
    title: "[テスト] ぺこらグッズ 通知テスト",
    handle: "test-product",
    variants: [{ price: "1000" }],
    images: [],
  };

  const url = `https://shop.hololivepro.com/products/${dummyProduct.handle}`;
  const price = `¥${Number(dummyProduct.variants[0].price).toLocaleString()}`;

  const payload = {
    embeds: [
      {
        title: `🛍️ 新商品が追加されました！`,
        description: `**${dummyProduct.title}**`,
        url,
        color: 0xff69b4,
        fields: [
          { name: "価格", value: price, inline: true },
          { name: "購入はこちら", value: `[ショップを開く](${url})`, inline: true },
        ],
        footer: { text: "ホロライブショップ速報（これはテスト通知です）" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log("✅ テスト通知を送信しました！Discordを確認してぺこ！");
  } else {
    console.error(`❌ 送信失敗: ${res.status}`);
  }
}

sendTestNotification();
