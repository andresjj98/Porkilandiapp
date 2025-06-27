
# API de Tipos de Corte

El endpoint `/api/tipos_corte` permite administrar los tipos de corte.

## Crear

```
POST /api/tipos_corte
{
  "nombre_corte": "Lomo"
}
```

## Obtener

Se puede filtrar por producto o por tipo de carne usando parámetros de consulta.

- `?producto=1` – filtra por el ID de producto.
- `?carne=2` – filtra por el ID de tipo de carne.

Si no se envían parámetros se devuelven todos los cortes.