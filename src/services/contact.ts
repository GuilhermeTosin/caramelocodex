import { supabase } from "@/lib/supabase";

export async function submitContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  };

  const { error } = await supabase.functions.invoke("send-contact-email", {
    body: payload,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
