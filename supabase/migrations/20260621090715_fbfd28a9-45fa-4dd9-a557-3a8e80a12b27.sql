DROP POLICY IF EXISTS "anyone authenticated may write" ON public.revealed_test_centers;
DROP POLICY IF EXISTS "anyone authenticated may update" ON public.revealed_test_centers;

CREATE POLICY "Deny anon insert on revealed_test_centers" ON public.revealed_test_centers FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on revealed_test_centers" ON public.revealed_test_centers FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon delete on revealed_test_centers" ON public.revealed_test_centers FOR DELETE TO anon USING (false);
CREATE POLICY "Deny authenticated insert on revealed_test_centers" ON public.revealed_test_centers FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Deny authenticated update on revealed_test_centers" ON public.revealed_test_centers FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated delete on revealed_test_centers" ON public.revealed_test_centers FOR DELETE TO authenticated USING (false);