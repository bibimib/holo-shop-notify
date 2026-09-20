# holo-shop-notify — ホロライブ公式ショップの新商品通知

`shop.hololivepro.com` を定期的に見て、新商品が出たらDiscordに通知する。
GitHub Actions上で動くので、**PCの電源が入っていなくても止まらない**。

## ステータス

- **現在**: 稼働中（5分ごと）
- **検証方法**: `gh run list --repo bibimib/holo-shop-notify` で直近の成功を確認
- 死活監視: `bot-health` が毎朝9時に見ている（12時間止まったらアラート）

## 仕組み

| ワークフロー | cron | 役割 |
|---|---|---|
| `check.yml` | `*/5 * * * *`（5分ごと） | 新商品チェック→Discord通知→`oshi-timeline` へ書き込み |
| `keepalive.yml` | `0 3 1 * *`（毎月1日） | GitHubが60日無活動でワークフローを止めるのを防ぐ |
| `test-notify.yml` | 手動 | 通知の見た目を確認する |

**keepaliveの日付は4兄弟でずらしてある**（holo=1日 / suisei=2日 / merch=3日 / vspo=4日）。

## 必要なSecret

| Secret | 用途 |
|---|---|
| `DISCORD_WEBHOOK_URL` | 通知先 |
| `GITHUB_TOKEN` | 自リポへの状態保存（自動で入る） |
| `TIMELINE_GITHUB_TOKEN` | `oshi-timeline` の `feed.json` へ書き込む |

## 兄弟プロジェクト

同じ作りの通知ツールが4つある。**片方を直したら他も見ること。**

| プロジェクト | 監視先 | 間隔 |
|---|---|---|
| `holo-shop-notify`（これ） | ホロライブ公式ショップ | 5分 |
| `suisei-shop-notify` | 星街すいせいFC | 5分（ニュースは1時間） |
| `vspo-shop-notify` | ぶいすぽストア | 1時間 |
| `merch-notify` | merch-matome.com | 1時間（30分ずらし） |

`ui-shigure-notify` も同系統だが、BOOTHが相手で `oshi-timeline` 連携は無い。

## 未実装候補

1. `docs/known-issues.md` を作る（他の兄弟にもまだ無い）
2. スクレイピング先のHTML構造が変わったときに**静かに0件になる**問題への検知
   （「新商品ゼロが何日続いたら怪しい」という判定）
