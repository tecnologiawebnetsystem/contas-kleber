-- Disable RLS on all tables to allow public access
ALTER TABLE public.contas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixinha DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contas;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.contas;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.contas;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.contas;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.pagamentos;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.saldo;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.saldo;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.saldo;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.saldo;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.transacoes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.transacoes;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.transacoes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.transacoes;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.caixinha;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.caixinha;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.caixinha;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.caixinha;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.configuracoes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.configuracoes;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.configuracoes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.configuracoes;
