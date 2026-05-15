-- Adicionar política de inserção para perfis
-- Isso permite que o frontend crie o perfil caso o trigger falhe
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
