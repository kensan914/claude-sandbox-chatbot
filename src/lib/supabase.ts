import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

// サーバーサイド用クライアント（service_role キーで RLS をバイパス）
export const supabase = createClient(supabaseUrl, supabaseSecretKey);
