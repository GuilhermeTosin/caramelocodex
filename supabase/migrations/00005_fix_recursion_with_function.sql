-- 1. Criar função auxiliar para checar participação (SECURITY DEFINER ignora RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view fellows" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

-- 3. Aplicar novas políticas baseadas na função (sem recursão)
CREATE POLICY "View conversations" ON public.conversations 
  FOR SELECT USING (is_conversation_participant(id));

CREATE POLICY "View participants" ON public.conversation_participants 
  FOR SELECT USING (is_conversation_participant(conversation_id));

CREATE POLICY "View messages" ON public.messages 
  FOR SELECT USING (is_conversation_participant(conversation_id));

CREATE POLICY "Send messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_conversation_participant(conversation_id));

-- 4. Garantir que o perfil demo existe (ID do seed.sql)
INSERT INTO public.profiles (id, name)
VALUES ('97703682-5eff-4e79-b581-7f5db1067caf', 'Demo Proprietário')
ON CONFLICT (id) DO NOTHING;
