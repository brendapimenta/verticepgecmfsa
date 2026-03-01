
-- Add RLS policies for sistema_config table
-- Authenticated users can read config (e.g. VAPID public key)
CREATE POLICY "config_select_authenticated" ON public.sistema_config
  FOR SELECT TO authenticated
  USING (true);

-- Only service_role can insert/update/delete config
CREATE POLICY "config_service_role" ON public.sistema_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
