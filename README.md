# holo-shop-notify

ホロライブ公式ショップに新商品が追加されたとき、Discordに自動で通知するツール。
GitHub Actionsで5分ごとに自動チェック。PCの電源を切っていても動き続ける。

---

## 必要な準備

GitHubリポジトリの Settings → Secrets and variables → Actions に以下を登録する。

| Secret名 | 内容 |
|----------|------|
| `DISCORD_WEBHOOK_URL` | DiscordのWebhook URL |

---

## 使い方

### 自動実行
設定済み。5分ごとに自動でチェックが走る。何もしなくてOK。

### 手動でテスト通知を送る
Actions タブ →「Discord通知テスト」→「Run workflow」

### 手動でチェックを実行する
Actions タブ →「ホロライブショップ 新商品チェック」→「Run workflow」

---

## 止め方・再開の仕方

### 一時停止
Actions タブ →「ホロライブショップ 新商品チェック」→ 右上「...」→「Disable workflow」

### 再開
同じ画面で「Enable workflow」をクリック

### 完全に削除
Settings → 一番下までスクロール →「Delete this repository」

---

## ファイル構成

```
holo-shop-notify/
├── check.js                         # 監視スクリプト本体
├── test-notify.js                   # Discord通知テスト用
├── .gitignore
└── .github/
    └── workflows/
        ├── check.yml                # 5分ごと自動実行
        └── test-notify.yml          # 手動テスト用
```

---

## 注意事項

- `DISCORD_WEBHOOK_URL` は絶対にコードに直接書かない。必ずSecretsに登録する。
- Webhook URLが漏れた場合はDiscordの設定画面でURLを削除・再発行して、Secretsを更新する。
- 初回実行時は既存商品を記録するだけで通知は来ない（2回目以降から通知が届く）。
