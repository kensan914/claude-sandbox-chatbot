# 実装計画 - 悩み相談チャットボット

## アプローチ

CLAUDE.md の仕様に基づき、Next.js (App Router) + Supabase + Anthropic Claude API でチャットボットを構築する。
プロジェクト初期化から始め、バックエンド（DB・API）→ フロントエンド（UI）→ 結合の順で進める。

## TODOリスト

### Phase 1: プロジェクト初期化
- [x] 1. Next.js プロジェクト作成（bun create next-app）、TypeScript + Tailwind CSS + App Router 構成
- [x] 2. 依存パッケージのインストール（@anthropic-ai/sdk, @supabase/supabase-js, react-markdown, remark-gfm）
- [x] 3. 環境変数の設定（.env.local に ANTHROPIC_API_KEY, SUPABASE 関連キーのテンプレートを用意）

### Phase 2: データベース（Supabase）
- [x] 4. Supabase にて threads テーブル・messages テーブルのマイグレーション SQL を作成
- [x] 5. src/lib/supabase.ts — Supabase クライアント初期化

### Phase 3: 共通モジュール
- [x] 6. src/types/chat.ts — 型定義（Message, Thread など）
- [x] 7. src/lib/systemPrompt.ts — カウンセラー用システムプロンプト定義
- [x] 8. src/lib/anthropic.ts — Anthropic SDK クライアント初期化

### Phase 4: API ルート（バックエンド）
- [x] 9. POST /api/threads (src/app/api/threads/route.ts) — スレッド新規作成 → threadId を返す
- [x] 10. POST /api/chat (src/app/api/chat/route.ts) — ユーザーメッセージDB保存 → 会話履歴取得 → Claude ストリーミング呼び出し → AI応答DB保存

### Phase 5: UI コンポーネント（フロントエンド）
- [x] 11. src/components/MessageBubble.tsx — メッセージバブル（ユーザー右寄せ・AI左寄せ、Markdownレンダリング、エラー表示）
- [x] 12. src/components/TypingIndicator.tsx — AI応答中のタイピングインジケーター
- [x] 13. src/components/MessageInput.tsx — 入力フォーム（Enter送信・Shift+Enter改行・応答中無効化）
- [x] 14. src/components/ChatContainer.tsx — チャット全体のコンテナ（メッセージ一覧 + ストリーミング受信 + スクロール制御）

### Phase 6: ページ
- [x] 15. src/app/layout.tsx — ルートレイアウト（Tailwind CSS 適用、メタ情報）
- [x] 16. src/app/page.tsx — トップページ（POST /api/threads → /threads/[threadId] にリダイレクト）
- [ ] 17. src/app/threads/[threadId]/page.tsx — スレッド詳細ページ（DB から履歴取得 → ChatContainer 表示）

### Phase 7: 結合テスト・動作確認
- [ ] 18. ローカルで bun dev 起動し、E2E の手動動作確認（スレッド作成 → メッセージ送受信 → ストリーミング表示）
- [ ] 19. ビルド確認（bun run build が通ること）

## 依存関係

- Phase 2, 3 は Phase 1 の完了後に着手（並行可）
- Phase 4 は Phase 2, 3 の完了が前提
- Phase 5 は Phase 3（型定義）の完了が前提だが Phase 4 と並行可
- Phase 6 は Phase 4, 5 の完了が前提
- Phase 7 は Phase 6 の完了が前提

## 備考

- テスト（Jest + React Testing Library）は動作確認後に追加フェーズとして実施
- Vercel デプロイは開発環境のみのため、動作確認後に手動で設定
