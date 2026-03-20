// ホロライブショップ 新商品通知スクリプト
// 定期的に商品一覧をチェックして、新商品をDiscordに通知する

const SHOP_URL = "https://shop.hololivepro.com/products.json?limit=50&page=1&currency=JPY";
const KNOWN_IDS_KEY = "known_ids.json";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const fs = require("fs");

// 既知の商品IDを読み込む
function loadKnownIds() {
  if (fs.existsSync(KNOWN_IDS_KEY)) {
    return new Set(JSON.parse(fs.readFileSync(KNOWN_IDS_KEY, "utf-8")));
  }
  return new Set();
}

// 既知の商品IDを保存する
function saveKnownIds(ids) {
  fs.writeFileSync(KNOWN_IDS_KEY, JSON.stringify([...ids]));
}

// ショップから商品一覧を取得する
async function fetchProducts() {
  const res = await fetch(SHOP_URL);
  if (!res.ok) throw new Error(`ショップ取得失敗: ${res.status}`);
  const data = await res.json();
  return data.products;
}

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

// Discordに通知を送る
async function sendDiscordNotification(product) {
  const url = `https://shop.hololivepro.com/products/${product.handle}`;
  const price = product.variants?.[0]?.price
    ? `¥${Number(product.variants[0].price).toLocaleString()}`
    : "価格未定";
  const image = product.images?.[0]?.src ?? null;
  const isLimited = hasLimitedVariant(product);
  const limitedTitles = getLimitedVariantTitles(product);

  const fields = [
    { name: "価格", value: price, inline: true },
    { name: "購入はこちら", value: `[ショップを開く](${url})`, inline: true },
  ];

  // 数量限定バリアントがある場合は専用フィールドを追加
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
        description: `**${product.title}**`,
        url,
        color: isLimited ? 0xff0000 : 0x57f287, // 限定は赤・通常は緑
        fields,
        image: image ? { url: image } : undefined,
        footer: { text: "ホロライブショップ速報" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Discord通知失敗: ${res.status}`);
}

// メイン処理
async function main() {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL が設定されていません");
    process.exit(1);
  }

  console.log("ホロライブショップをチェック中...");

  const products = await fetchProducts();
  const knownIds = loadKnownIds();

  // 初回実行時はIDを記録するだけ（全商品を通知しない）
  if (knownIds.size === 0) {
    console.log(`初回実行: ${products.length}件の商品IDを記録しました`);
    const allIds = new Set(products.map((p) => String(p.id)));
    saveKnownIds(allIds);
    return;
  }

  // 新商品を検出
  const newProducts = products.filter((p) => !knownIds.has(String(p.id)));

  if (newProducts.length === 0) {
    console.log("新商品なし");
    return;
  }

  console.log(`新商品 ${newProducts.length}件 を検出！`);

  // 新商品を通知
  for (const product of newProducts) {
    await sendDiscordNotification(product);
    console.log(`通知送信: ${product.title}`);
    knownIds.add(String(product.id));
  }

  saveKnownIds(knownIds);
  console.log("完了！");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
