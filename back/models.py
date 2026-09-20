# models.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class CategoriaModel(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[Optional[str]] = mapped_column(Text)

    # Inversa (uno→muchos). "raise": si algo la accede sin cargarla, error claro.
    # Se consulta explícitamente en su resolver (ver schema.py).
    productos: Mapped[list["ProductoModel"]] = relationship(
        back_populates="categoria", lazy="raise"
    )


class ProductoModel(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))  # ajusta precisión a tu db.sql
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
    rol: Mapped[str] = mapped_column(String(20))  # 'CLIENTE' | 'ADMIN' tal cual la BD
    # (si en db.sql es un ENUM de Postgres, usa sqlalchemy.Enum con el nombre exacto del tipo)


class DetallePedidoModel(Base):
    __tablename__ = "pedido_detalles"  # antes decía "detalles_pedido" # ⚠️ ÚNICO lugar donde vive el nombre — ajústalo a tu db.sql

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