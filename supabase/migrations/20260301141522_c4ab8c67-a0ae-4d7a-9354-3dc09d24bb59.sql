
-- Allow authenticated users to read other users in the same institution (needed for user listings in the app)
CREATE POLICY "Users can read users in same institution"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    instituicao_id IN (
      SELECT instituicao_id FROM public.usuarios WHERE auth_user_id = auth.uid()
    )
  );
