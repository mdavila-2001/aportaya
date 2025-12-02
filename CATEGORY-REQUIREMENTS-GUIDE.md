# 📋 Guía de Gestión de Requisitos de Categorías

## Descripción

El sistema de **requisitos de categorías** permite definir condiciones específicas que deben cumplir los proyectos según su categoría. Esto ayuda a garantizar la calidad y completitud de los proyectos antes de ser aprobados.

---

## 🗂️ Estructura de Datos

### Tabla: `projects.category_requirements`

```sql
CREATE TABLE projects.category_requirements (
  category_id INT NOT NULL,              -- FK a projects.category
  requirement_name VARCHAR(255) NOT NULL, -- Nombre del requisito
  requirement_value TEXT NOT NULL,        -- Descripción/valor del requisito
  PRIMARY KEY (category_id, requirement_name)
);
```

**Llave Primaria Compuesta:** Una categoría puede tener múltiples requisitos, identificados por su nombre único dentro de esa categoría.

---

## 🛠️ Funciones Disponibles

### 1. Agregar un Requisito Individual

```sql
SELECT projects.add_category_requirement(
  p_category_id := 1,
  p_requirement_name := 'Prototipo Funcional',
  p_requirement_value := 'Se requiere video demostrativo del prototipo funcionando.'
);
```

**Características:**
- Si el requisito ya existe (mismo `category_id` + `requirement_name`), se actualiza el valor
- Valida que la categoría exista antes de insertar

---

### 2. Agregar Múltiples Requisitos (JSONB)

```sql
SELECT projects.add_category_requirements(
  p_category_id := 1,
  p_requirements := '[
    {
      "name": "Prototipo Funcional",
      "value": "Se requiere video demostrativo del prototipo."
    },
    {
      "name": "Plan Técnico",
      "value": "Documento PDF con arquitectura técnica del proyecto."
    },
    {
      "name": "Presupuesto Desglosado",
      "value": "Excel o documento con costos detallados."
    }
  ]'::jsonb
);
-- Retorna: 3 (cantidad de requisitos agregados)
```

---

### 3. Eliminar un Requisito Específico

```sql
SELECT projects.remove_category_requirement(
  p_category_id := 1,
  p_requirement_name := 'Presupuesto Desglosado'
);
-- Retorna: TRUE si se eliminó, FALSE si no existía
```

---

### 4. Eliminar TODOS los Requisitos de una Categoría

```sql
SELECT projects.clear_category_requirements(p_category_id := 1);
-- Retorna: cantidad de requisitos eliminados (ej: 2)
```

---

### 5. Obtener Requisitos de una Categoría

```sql
SELECT * FROM projects.get_category_requirements(p_category_id := 1);
```

**Retorna:**
```
requirement_name         | requirement_value
-------------------------|--------------------------------------------------
Plan Técnico             | Documento PDF con arquitectura técnica.
Prototipo Funcional      | Se requiere video demostrativo del prototipo.
```

---

### 6. Obtener TODAS las Categorías con sus Requisitos

```sql
SELECT * FROM projects.get_categories_with_requirements();
```

**Retorna:**
```json
{
  "category_id": 1,
  "category_name": "Tecnología",
  "category_slug": "tecnologia",
  "category_description": "Innovación y desarrollo",
  "requirements": [
    {
      "name": "Plan Técnico",
      "value": "Documento PDF con arquitectura técnica."
    },
    {
      "name": "Prototipo Funcional",
      "value": "Se requiere video demostrativo."
    }
  ]
}
```

---

### 7. Validar Requisitos de un Proyecto

```sql
SELECT * FROM projects.validate_project_requirements(
  p_project_id := 'uuid-del-proyecto'
);
```

**Retorna:**
```
requirement_name     | requirement_value              | is_fulfilled | validation_message
---------------------|--------------------------------|--------------|-----------------------------
Prototipo Funcional  | Se requiere video...           | true         | Video proporcionado
Plan Técnico         | Documento PDF...               | false        | Falta documento requerido
```

---

### 8. Verificar si un Proyecto Cumple Requisitos (Booleano)

```sql
SELECT projects.check_category_requirements(
  p_project_id := 'uuid-del-proyecto'
);
-- Retorna: TRUE o FALSE
```

---

## 📚 Ejemplos Prácticos

### Configurar Requisitos para Categoría "Tecnología"

```sql
-- Opción 1: Individual
SELECT projects.add_category_requirement(1, 'Prototipo Funcional', 'Video demo requerido');
SELECT projects.add_category_requirement(1, 'Plan Técnico', 'Documento de arquitectura');
SELECT projects.add_category_requirement(1, 'Código Fuente', 'Repositorio GitHub público');

-- Opción 2: Múltiple (más eficiente)
SELECT projects.add_category_requirements(
  1,
  '[
    {"name": "Prototipo Funcional", "value": "Video demo requerido"},
    {"name": "Plan Técnico", "value": "Documento de arquitectura"},
    {"name": "Código Fuente", "value": "Repositorio GitHub público"}
  ]'::jsonb
);
```

---

### Configurar Requisitos para Categoría "Salud"

```sql
SELECT projects.add_category_requirements(
  2, -- ID de categoría Salud
  '[
    {"name": "Certificación Profesional", "value": "Aval de institución médica reconocida"},
    {"name": "Presupuesto Médico", "value": "Desglose de costos médicos y equipamiento"},
    {"name": "Plan de Implementación", "value": "Cronograma de actividades médicas"}
  ]'::jsonb
);
```

---

### Consultar Requisitos antes de Crear un Proyecto

```sql
-- Usuario quiere crear un proyecto de Tecnología (category_id = 1)
-- Primero consulta qué necesita:
SELECT * FROM projects.get_category_requirements(1);

-- Resultado muestra:
-- - Prototipo Funcional: Video demo requerido
-- - Plan Técnico: Documento de arquitectura
-- - Código Fuente: Repositorio GitHub público
```

---

### Validar un Proyecto antes de Enviarlo a Revisión

```sql
-- El creador verifica su proyecto antes de enviarlo
SELECT * FROM projects.validate_project_requirements('abc-123-def-456');

-- Si todos is_fulfilled = true, puede enviarlo
-- Si hay false, sabe qué falta completar
```

---

## 🔍 Validaciones Automáticas

La función `validate_project_requirements` realiza validaciones automáticas basadas en el nombre del requisito:

| Palabra Clave en Requisito | Validación                          |
|----------------------------|-------------------------------------|
| `video`                    | Verifica que `video_url` no sea NULL |
| `documento`, `certificación` | Verifica que `proof_document_id` exista |
| `plan`, `detalle`          | Verifica descripción > 200 caracteres |
| `ubicación`, `población`   | Verifica que `location` tenga valor |
| Otros                      | Requiere revisión manual            |

---

## 🎯 Flujo de Trabajo Recomendado

### Para Administradores:

1. **Crear/Editar Categoría**
   ```sql
   SELECT projects.create_category('Tecnología', 'tecnologia', 'Innovación y desarrollo');
   ```

2. **Definir Requisitos**
   ```sql
   SELECT projects.add_category_requirements(1, '[
     {"name": "Prototipo Funcional", "value": "..."},
     {"name": "Plan Técnico", "value": "..."}
   ]'::jsonb);
   ```

3. **Revisar Proyectos**
   ```sql
   -- Validar si cumple requisitos antes de aprobar
   SELECT * FROM projects.validate_project_requirements('project-uuid');
   ```

---

### Para Creadores de Proyectos:

1. **Consultar Requisitos de la Categoría**
   ```sql
   SELECT * FROM projects.get_category_requirements(1);
   ```

2. **Crear Proyecto** (asegurándose de cumplir requisitos)

3. **Auto-validar antes de Enviar**
   ```sql
   SELECT * FROM projects.validate_project_requirements('mi-proyecto-uuid');
   ```

4. **Enviar a Revisión** (solo si cumple requisitos)

---

## 📊 Ejemplo en el Seeder

```sql
-- En db/seed.sql
DO $$ 
DECLARE
  v_cat_tech_id INT;
BEGIN
  -- Crear categoría
  SELECT projects.create_category('Tecnología', 'tecnologia', 'Innovación') 
  INTO v_cat_tech_id;

  -- Agregar requisitos
  PERFORM projects.add_category_requirements(
    v_cat_tech_id,
    '[
      {"name": "Prototipo Funcional", "value": "Video demostrativo obligatorio"},
      {"name": "Plan Técnico", "value": "Documento de arquitectura en PDF"}
    ]'::jsonb
  );
END $$;
```

---

## ⚠️ Notas Importantes

1. **Upsert automático:** `add_category_requirement` actualiza si ya existe
2. **Validación extensible:** Puedes agregar más lógica en `validate_project_requirements`
3. **JSONB flexible:** Usa `add_category_requirements` para inserciones masivas
4. **No afecta proyectos existentes:** Los requisitos se validan solo en aprobación

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Sistema de validación por tipo de dato (URL, archivo, texto, número)
- [ ] Requisitos opcionales vs obligatorios
- [ ] Validación de formatos específicos (ej: URLs de YouTube)
- [ ] Historial de cambios en requisitos
- [ ] Notificaciones a creadores cuando cambien requisitos
