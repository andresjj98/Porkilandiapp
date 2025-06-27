
# API de Tipos de Corte

El endpoint `/api/tipos_corte` permite administrar los tipos de corte.
Desde la versión actual se dispone además de `/api/tipos_corte/crear` para
registrar un corte y vincularlo inmediatamente con un tipo de carne.

## Crear

```
POST /api/tipos_corte
{
  "nombre_corte": "Lomo"
}
```
### Crear y vincular

```
POST /api/tipos_corte/crear
{
  "id_tipo_carne": 1,
  "nombre_corte": "Lomo"
}
```
Si la combinación ya existe se obtiene un error 400.

## Obtener

Se puede filtrar por producto o por tipo de carne usando parámetros de consulta.

- `?producto=1` – filtra por el ID de producto.
- `?carne=2` – filtra por el ID de tipo de carne.

Si no se envían parámetros se devuelven todos los cortes.

## Migración recomendada

Para que al eliminar un tipo de corte se borren también los productos
relacionados, la clave foránea de `productos.id_tipo_corte` debe usar
`ON DELETE CASCADE`:

```sql
ALTER TABLE productos DROP FOREIGN KEY fk_producto_tipo_corte;
ALTER TABLE productos ADD CONSTRAINT fk_producto_tipo_corte
  FOREIGN KEY (id_tipo_corte) REFERENCES tipos_corte(id_tipo_corte)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
```

Si no cuentas con esta configuración en la base de datos, la API se encargará
de borrar los registros de `productos` asociados antes de eliminar el tipo de
corte.