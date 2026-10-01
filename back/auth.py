# auth.py
import strawberry


def requerir_usuario(info: strawberry.Info) -> dict:
    usuario = info.context.get("usuario")
    if usuario is None:
        if info.context.get("token_expirado"):
            raise Exception("TOKEN_EXPIRADO")   # el front lo usa para hacer refresh
        raise Exception("No autenticado")
    return usuario


def requerir_admin(info: strawberry.Info) -> dict:
    usuario = requerir_usuario(info)
    if usuario["rol"] != "ADMIN":
        raise Exception("No autorizado")
    return usuario
