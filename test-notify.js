// Discord通知テストスクリプト
// ダミーデータで通知が届くかを確認する

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// バリアントの中に数量限定があるか確認する
function hasLimitedVariant(product) {
  return product.variants?.some((v) =>
    v.title?.includes("数量限定") || v.title?.includes("限定ver")
  ) ?? false;
}

// 数量限定バリアントのタイトルを取得する
function getLimitedVariantTitles(product) {
  return product.variants
    ?.filter((v) => v.title?.includes("数量限定") || v.title?.includes("限定ver"))
    .map((v) => v.title) ?? [];
}

async function sendTestNotification() {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL が設定されていません");
    process.exit(1);
  }

  // ← "limited" を "normal" に変えると通常通知のテストになる
  const testMode = "limited";

  const dummyProduct = testMode === "limited"
    ? {
        title: "[テスト] ぺこら 誕生日記念2026",
        handle: "test-product",
        variants: [
          { title: "セット / 誕生日記念フルセット 数量限定ver.", price: "15000" },
          { title: "セット / 誕生日記念フルセット", price: "12000" },
          { title: "グッズ / アクリルスタンド", price: "2000" },
        ],
        images: [],
      }
    : {
        title: "[テスト] ぺこらグッズ 通知テスト",
        handle: "test-product",
        variants: [{ title: "Default Title", price: "1000" }],
        images: [],
      };

  const url = `https://shop.hololivepro.com/products/${dummyProduct.handle}`;
  const price = `¥${Number(dummyProduct.variants[0].price).toLocaleString()}`;
  const isLimited = hasLimitedVariant(dummyProduct);
  const limitedTitles = getLimitedVariantTitles(dummyProduct);

  const fields = [
    { name: "価格", value: price, inline: true },
    { name: "購入はこちら", value: `[ショップを開く](${url})`, inline: true },
  ];

  if (isLimited) {
    fields.push({
      name: "⚠️ 数量限定あり",
      value: limitedTitles.join("\n"),
      inline: false,
    });
  }

  const payload = {
    embeds: [
      {
        title: isLimited
          ? `🚨 数量限定あり！新商品が追加されました！`
          : `🛍️ 新商品が追加されました！`,
        description: `**${dummyProduct.title}**`,
        url,
        color: isLimited ? 0xff0000 : 0x57f287, // 限定は赤・通常は緑
        fields,
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
