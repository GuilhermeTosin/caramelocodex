ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1.1 Habilitar Realtime de forma segura
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- 2. Limpar TODAS as políticas de conversas para evitar conflitos
DROP POLICY IF EXISTS "View conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;

DROP POLICY IF EXISTS "View participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON public.conversation_participants;

DROP POLICY IF EXISTS "View messages" ON public.messages;
DROP POLICY IF EXISTS "Send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

-- 3. Novas Políticas Simplificadas usando a função SECURITY DEFINER

-- CONVERSATIONS
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT USING (is_conversation_participant(id));

CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (true); 

-- CONVERSATION_PARTICIPANTS
CREATE POLICY "participants_select" ON public.conversation_participants
  FOR SELECT USING (is_conversation_participant(conversation_id));

CREATE POLICY "participants_insert" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    is_conversation_participant(conversation_id)
  );

-- MESSAGES
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    is_conversation_participant(conversation_id)
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (
    is_conversation_participant(conversation_id)
  );

-- 4. Função RPC para criar conversa e participantes de forma atômica (Ignora RLS no insert)
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  p_business_id UUID,
  p_business_name TEXT,
  p_participant_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  v_conv_id UUID;
  v_p_id UUID;
BEGIN
  -- Criar conversa
  INSERT INTO public.conversations (business_id, business_name)
  VALUES (p_business_id, p_business_name)
  RETURNING id INTO v_conv_id;

  -- Adicionar participantes
  FOREACH v_p_id IN ARRAY p_participant_ids
  LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conv_id, v_p_id);
  END LOOP;

  RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Garantir que o perfil do usuário atual existe
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);
