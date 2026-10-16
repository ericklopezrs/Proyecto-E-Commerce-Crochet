-- Ejecutar una sola vez:  psql -U postgres -d ecommerce_p26 -f migracion_auth.sql
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id         SERIAL PRIMARY KEY,
    usuario_id integer NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    jti        uuid NOT NULL UNIQUE,
    usado      boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON public.refresh_tokens(usuario_id);

-- El usuario semilla tiene el password en texto plano ("password123"), por lo
-- que ya no puede iniciar sesión (ahora se compara contra un hash Argon2).
-- Bórralo y regístrate desde /registro:
-- DELETE FROM public.usuarios WHERE email = 'erick@cetis.edu.mx';

-- Para volver admin a alguien (los registros nuevos siempre son CLIENTE):
-- UPDATE public.usuarios SET rol = 'ADMIN' WHERE email = 'tu@correo.com';
