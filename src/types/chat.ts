export type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Thread = {
  id: string;
  created_at: string;
  updated_at: string;
};
