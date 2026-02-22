Issue #$ARGUMENTS を PM として実装から完了処理まで一括で対応してください。

以下の手順で進めてください：

## 1. Issue 確認・分析
- GitHub Issue の内容・受け入れ条件・関連仕様書を確認する
- 作業を細かいサブタスクに分解し、TaskCreate でタスクリストを作成する
- ブロッカーや依存関係があれば事前に報告する

## 2. 実装（各サブタスクを順番に）
- TaskUpdate でタスクを in_progress にしてから着手する
- 実装前に関連ファイルを読み、既存パターンに倣う
- 外部サービス（Supabase など）への変更はその場で適用・確認する
- 各サブタスク完了後に TaskUpdate で completed にする

## 3. ビルド・lint 確認
- `bun run build` と `bun run lint` を実行し、エラーがないことを確認する
- テストファイルが存在する場合は `bun test` も実行する

## 4. コミット・プッシュ
- 変更ファイルをステージして、日本語のコミットメッセージ（Issue 番号付き）でコミットする
- `origin/main` にプッシュする

## 5. 受け入れ条件の検証
- Issue に記載された受け入れ条件を1つずつ明示的に検証する
- 検証結果を表形式（条件・結果・詳細）でまとめる

## 6. GitHub の完了処理
- 検証結果サマリーを Issue にコメントとして投稿する（`gh issue comment`）
- Issue を closed/completed でクローズする（`gh issue close --reason completed`）
- GitHub Projects のステータスを Done に更新する
  - Project に Issue が未登録の場合は追加してから更新する
