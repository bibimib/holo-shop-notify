// check.js のテスト（ネットにはつながない。fetch を偽物に差し替える）
// 実行: node --test

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

process.env.DISCORD_WEBHOOK_URL = "https://discord.test/webhook";
delete process.env.TIMELINE_GITHUB_TOKEN;
const { main } = require("./check.js");

// 作業用のフォルダに入って動かし、終わったら片付ける
async function inTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(__dirname, ".test-tmp-"));
  const prev = process.cwd();
  process.chdir(dir);
  try {
    await fn();
  } finally {
    process.chdir(prev);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const product = (id) => ({ id, title: `商品${id}`, handle: `item-${id}`, variants: [{ price: "1000" }], images: [] });

// ショップは products を返し、Discord は discordStatus(商品名, 何回目) の番号を返す
function fakeFetch(products, discordStatus = () => 204) {
  const posts = [];
  const counts = {};
  global.fetch = async (url, opts = {}) => {
    if (url.startsWith("https://shop.hololivepro.com/")) {
      return new Response(JSON.stringify({ products }), { status: 200 });
    }
    if (url === process.env.DISCORD_WEBHOOK_URL) {
      const desc = JSON.parse(opts.body).embeds?.[0]?.description ?? "";
      const title = desc.replace(/\*/g, "");
      counts[title] = (counts[title] ?? 0) + 1;
      posts.push(title);
      const status = discordStatus(title, counts[title]);
      if (status === 429) return new Response(JSON.stringify({ retry_after: 0.01 }), { status });
      return new Response(null, { status });
    }
    throw new Error(`想定外の通信: ${url}`);
  };
  return posts;
}

const known = () => JSON.parse(fs.readFileSync("known_ids.json", "utf-8")).sort();

test("初回は名簿に記録するだけで、通知しない", async () => {
  await inTempDir(async () => {
    const posts = fakeFetch([product(1), product(2)]);
    await main();
    assert.deepEqual(posts, []);
    assert.deepEqual(known(), ["1", "2"]);
  });
});

test("途中の1件が失敗しても、送れた分は名簿に残り、残りも送る", async () => {
  await inTempDir(async () => {
    fs.writeFileSync("known_ids.json", JSON.stringify(["1"]));
    const posts = fakeFetch([product(1), product(2), product(3), product(4)], (t) => (t === "商品3" ? 500 : 204));
    await assert.rejects(main(), /商品3/);
    assert.deepEqual(posts, ["商品2", "商品3", "商品4"]);
    assert.deepEqual(known(), ["1", "2", "4"]);
  });
});

test("次の回は、届かなかった分だけを送り直す", async () => {
  await inTempDir(async () => {
    fs.writeFileSync("known_ids.json", JSON.stringify(["1", "2", "4"]));
    const posts = fakeFetch([product(1), product(2), product(3), product(4)]);
    await main();
    assert.deepEqual(posts, ["商品3"]);
    assert.deepEqual(known(), ["1", "2", "3", "4"]);
  });
});

test("送りすぎ（429）と言われたら、待ってから送り直す", async () => {
  await inTempDir(async () => {
    fs.writeFileSync("known_ids.json", JSON.stringify(["1"]));
    const posts = fakeFetch([product(1), product(2)], (t, n) => (n === 1 ? 429 : 204));
    await main();
    assert.deepEqual(posts, ["商品2", "商品2"]);
    assert.deepEqual(known(), ["1", "2"]);
  });
});
