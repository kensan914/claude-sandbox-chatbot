# CLAUDE.md - 悩み相談チャットボット 仕様書

## プロジェクト概要

個人利用向けの悩み相談AIチャットボット。優しく寄り添うカウンセラー風のAIが、ユーザーの悩みに対して共感的に応答する。

## 技術スタック

- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **AIモデル**: Claude API (Anthropic)
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel
- **テスト**: Jest + React Testing Library
- **スタイリング**: Tailwind CSS

## 機能要件

### チャット機能
- チャットバブル形式のUI（ユーザー: 右寄せ、AI: 左寄せ）
- ストリーミング応答（リアルタイムで文字が流れる）
- AIの応答をMarkdownとしてレンダリング（太字・箇条書き・コードブロックなど）
- 会話履歴のDB保存（Supabase）
- メッセージ送信: Enterキーで送信、Shift+Enterで改行
- AI応答中は入力欄を無効化（送信不可）
- AI応答中はタイピングインジケーターを表示
- Anthropic APIエラー時はメッセージバブル内にエラーを表示

### スレッド管理
- トップページ (`/`) にアクセスすると新規スレッドを作成し `/threads/[threadId]` にリダイレクト
- スレッドIDを知っていれば `/threads/[threadId]` で過去スレッドに直接アクセス可能
- 初期リリースはスレッド一覧・切り替えUIなし（将来的に追加予定）

### AIキャラクター設定
- 口調: 優しく寄り添うカウンセラー風
- ユーザーの悩みに共感し、否定せず受け止める
- 必要に応じて具体的なアドバイスも提供する
- 危機的状況（自殺念慮など）を検知した場合は専門機関への相談を案内する
- 使用モデル: `claude-3-5-sonnet`（固定）

### 認証
- 認証なし（個人利用・開発環境のみで運用）
- 将来的に公開する際にはSupabase Authで認証を追加予定

## 非機能要件

| 項目 | 内容 |
|------|------|
| **対応環境** | Webブラウザ（PC優先、レスポンシブは最低限） |
| **テーマ** | ライトモードのみ |
| **デプロイ先** | Vercel（外部公開なし・開発環境のみ） |
| **レートリミット** | なし |
| **セキュリティ** | 認証なし、個人利用のみのため最低限 |
| **エラーハンドリング** | APIエラーはUIに表示、DBエラーはコンソールログのみ |

## UIデザイン

- ライトモードのみ
- チャットバブル形式（ユーザー: 右寄せ、AI: 左寄せ）
- 下部に入力欄（テキストエリア）+ 送信ボタン
- AI応答中: 入力欄を無効化 + タイピングインジケーター表示
- AIメッセージはMarkdownレンダリング

## アーキテクチャ

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # トップページ（スレッド新規作成 → リダイレクト）
│   ├── threads/
│   │   └── [threadId]/
│   │       └── page.tsx    # スレッド詳細（チャット）ページ
│   └── api/
│       ├── threads/
│       │   └── route.ts    # POST /api/threads: スレッド新規作成
│       └── chat/
│           └── route.ts    # POST /api/chat: Claude API呼び出し (ストリーミング)
├── components/
│   ├── ChatContainer.tsx   # チャット全体のコンテナ
│   ├── MessageBubble.tsx   # メッセージバブル
│   ├── MessageInput.tsx    # 入力フォーム
│   └── TypingIndicator.tsx # タイピング中の表示
├── lib/
│   ├── anthropic.ts        # Anthropic SDK クライアント
│   ├── supabase.ts         # Supabase クライアント
│   └── systemPrompt.ts    # システムプロンプト定義
├── types/
│   └── chat.ts             # 型定義
└── __tests__/              # テストファイル
```

## データベース設計 (Supabase)

### threads テーブル
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | スレッドID |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### messages テーブル
| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | メッセージID |
| thread_id | uuid (FK) | スレッドID |
| role | text | "user" or "assistant" |
| content | text | メッセージ本文 |
| created_at | timestamp | 作成日時 |

## API設計

### POST /api/threads
- リクエスト: なし
- レスポンス: `{ threadId: string }`
- 処理: threads テーブルに新規レコードを INSERT し、threadId を返す

### POST /api/chat
- リクエスト: `{ threadId: string, message: string }`
- レスポンス: Server-Sent Events (ストリーミング)
- 処理: ユーザーメッセージをDBに保存 → Claude APIにストリーミングリクエスト → レスポンスをストリーミングしつつDBに保存

## ページ設計

### `/` (トップページ)
- アクセス時に `POST /api/threads` を叩いてスレッドを新規作成
- 作成後、`/threads/[threadId]` にリダイレクト

### `/threads/[threadId]` (スレッド詳細ページ)
- チャットUI本体
- URLの `threadId` をキーに会話履歴を取得・表示

## 環境変数

```
ANTHROPIC_API_KEY=        # Anthropic API キー
NEXT_PUBLIC_SUPABASE_URL= # Supabase プロジェクトURL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= # Supabase Publishable キー（旧 anon key）
SUPABASE_SECRET_KEY=      # Supabase Secret キー（旧 service_role key、サーバーサイド用）
```

## 開発コマンド

```bash
bun dev      # 開発サーバー起動
bun run build    # ビルド
bun test     # テスト実行
bun run lint     # リント
```

## システムプロンプト

```
あなたは優しく寄り添うカウンセラーです。以下のガイドラインに従って応答してください：

1. ユーザーの悩みや感情を否定せず、まず共感し受け止める
2. 「つらかったですね」「それは大変でしたね」など、寄り添う言葉を使う
3. 必要に応じて、具体的で実践的なアドバイスを提供する
4. 押し付けがましくならず、ユーザー自身が答えを見つけられるよう導く
5. 深刻な状況（自殺念慮、自傷行為など）を検知した場合は、
   専門機関（いのちの電話: 0570-783-556 など）への相談を丁寧に案内する
6. 医療的な診断や処方は行わず、必要に応じて専門家への相談を勧める
7. 敬語を使いつつも、温かみのある口調で話す
```

## 機能別仕様書

機能ごとの詳細仕様は `docs/specs/` に格納している。CLAUDE.md の肥大化を防ぐため、新機能の仕様は個別ファイルに記載すること。

| 機能 | 仕様書 |
|------|--------|
| 画像アップロード | [docs/specs/image-upload.md](docs/specs/image-upload.md) |

## 将来的な拡張予定

- Supabase Authによるユーザー認証
- 複数会話スレッド対応
- 会話履歴のエクスポート機能
- ダークモード対応
