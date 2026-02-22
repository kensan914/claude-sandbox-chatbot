import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// MIMEタイプから拡張子へのマッピング
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const threadId = formData.get("threadId");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "ファイルが指定されていません" },
      { status: 400 }
    );
  }

  if (!threadId || typeof threadId !== "string") {
    return NextResponse.json(
      { error: "threadId が指定されていません" },
      { status: 400 }
    );
  }

  // ファイル形式チェック
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "対応していないファイル形式です（JPEG / PNG / GIF / WebP のみ）" },
      { status: 400 }
    );
  }

  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "ファイルサイズは 5MB 以下にしてください" },
      { status: 400 }
    );
  }

  // threadId の存在チェック
  const { error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .single();

  if (threadError) {
    return NextResponse.json(
      { error: "指定されたスレッドが存在しません" },
      { status: 400 }
    );
  }

  // Supabase Storage へアップロード
  const ext = MIME_TO_EXT[file.type];
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${threadId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("chat-images")
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("chat-images")
    .getPublicUrl(storagePath);

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
}
