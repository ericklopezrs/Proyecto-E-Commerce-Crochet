# models.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid as uuid_mod  # arriba del archivo, junto a los demás imports
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, UUID as PG_UUID

from database import Base


class CategoriaModel(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[Optional[str]] = mapped_column(Text)

    productos: Mapped[list["ProductoModel"]] = relationship(
        back_populates="categoria", lazy="raise"
    )


class ProductoModel(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))  
    imagen: Mapped[Optional[str]] = mapped_column(Text)
    stock: Mapped[int]
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))

    categoria: Mapped[CategoriaModel] = relationship(
        back_populates="productos", lazy="selectin"
    )


class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    password: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(
        PG_ENUM("CLIENTE", "ADMIN", name="rol_usuario", create_type=False),
        server_default="CLIENTE",
    )     


class DetallePedidoModel(Base):
    __tablename__ = "pedido_detalles"  

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"))
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"))
    cantidad: Mapped[int]
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    pedido: Mapped["PedidoModel"] = relationship(back_populates="detalles")
    producto: Mapped["ProductoModel"] = relationship(lazy="selectin")


class PedidoModel(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20))

    usuario: Mapped[Optional["UsuarioModel"]] = relationship(lazy="selectin")
    detalles: Mapped[list["DetallePedidoModel"]] = relationship(
        back_populates="pedido", lazy="selectin"
    )
    

class RefreshTokenModel(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    jti: Mapped[uuid_mod.UUID] = mapped_column(PG_UUID(as_uuid=True), unique=True, index=True)
    usado: Mapped[bool] = mapped_column(default=False)
    creado_en: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
