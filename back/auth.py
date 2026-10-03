import strawberry


def requerir_usuario(info: strawberry.Info) -> dict:
    """Candado nivel 1: exige sesión. Devuelve el payload del token."""
    usuario = info.context.get("usuario")
    if usuario is None:
        if info.context.get("token_expirado"):
            raise Exception("TOKEN_EXPIRADO")
        raise Exception("No autenticado")
    return usuario


def requerir_admin(info: strawberry.Info) -> dict:
    """Candado nivel 2: exige sesión + rol ADMIN."""
    usuario = requerir_usuario(info)
    if usuario["rol"] != "ADMIN":
        raise Exception("No autorizado")
    return usuario