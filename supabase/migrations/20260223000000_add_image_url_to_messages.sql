-- messages テーブルに画像URLカラムを追加
-- 画像なしの場合は NULL（既存メッセージへの影響なし）
ALTER TABLE messages ADD COLUMN image_url text;
