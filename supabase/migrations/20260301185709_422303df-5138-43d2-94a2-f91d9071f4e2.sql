
-- Adicionar coluna avatar_path na tabela usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS avatar_path text DEFAULT NULL;

-- Criar bucket privado para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Usuário autenticado pode fazer upload na sua própria pasta
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Usuário pode ver seu próprio avatar
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Usuário pode atualizar seu próprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Usuário pode deletar seu próprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Service role pode acessar todos avatares (para admin e edge functions)
CREATE POLICY "Service role full access avatars"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- RLS: Usuários da mesma instituição podem VER avatares uns dos outros (para exibir na UI)
CREATE POLICY "Same institution can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.usuarios u1
    JOIN public.usuarios u2 ON u1.instituicao_id = u2.instituicao_id
    WHERE u1.auth_user_id = auth.uid()
    AND u2.auth_user_id::text = (storage.foldername(name))[1]
  )
);
