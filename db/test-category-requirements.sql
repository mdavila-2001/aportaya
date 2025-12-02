-- =====================================================
-- SCRIPT DE PRUEBA: Category Requirements Functions
-- =====================================================

-- Limpiar datos de prueba previos
DO $$ 
BEGIN
    DELETE FROM projects.category_requirements WHERE category_id IN (
        SELECT id FROM projects.category WHERE slug LIKE 'test-%'
    );
    DELETE FROM projects.category WHERE slug LIKE 'test-%';
END $$;

-- =====================================================
-- PRUEBA 1: Crear categoría de prueba
-- =====================================================
SELECT projects.create_category(
    'Tecnología Test',
    'test-tecnologia',
    'Categoría de prueba para tecnología'
) AS category_id \gset

\echo '\n✅ PRUEBA 1: Categoría creada con ID:' :category_id

-- =====================================================
-- PRUEBA 2: Agregar requisito individual
-- =====================================================
SELECT projects.add_category_requirement(
    :category_id,
    'Video Demostrativo',
    'Se requiere un video de al menos 2 minutos mostrando el prototipo'
);

\echo '✅ PRUEBA 2: Requisito individual agregado'

-- =====================================================
-- PRUEBA 3: Agregar múltiples requisitos con JSONB
-- =====================================================
SELECT projects.add_category_requirements(
    :category_id,
    '[
        {"name": "Documento Técnico", "value": "PDF con especificaciones técnicas del proyecto"},
        {"name": "Presupuesto Detallado", "value": "Excel con desglose de costos por rubro"},
        {"name": "Cronograma", "value": "Plan de trabajo con hitos y fechas"}
    ]'::jsonb
) AS requirements_added;

\echo '✅ PRUEBA 3: Múltiples requisitos agregados'

-- =====================================================
-- PRUEBA 4: Consultar requisitos de la categoría
-- =====================================================
\echo '\n📋 PRUEBA 4: Requisitos de la categoría:'
SELECT * FROM projects.get_category_requirements(:category_id);

-- =====================================================
-- PRUEBA 5: Actualizar un requisito existente
-- =====================================================
SELECT projects.add_category_requirement(
    :category_id,
    'Video Demostrativo',
    'Se requiere un video de 3-5 minutos mostrando el prototipo y explicando la innovación'
) AS updated;

\echo '\n✅ PRUEBA 5: Requisito actualizado (Video Demostrativo)'

-- =====================================================
-- PRUEBA 6: Ver categorías con sus requisitos (JSONB)
-- =====================================================
\echo '\n📊 PRUEBA 6: Categoría con requisitos en formato JSON:'
SELECT 
    category_name,
    category_slug,
    jsonb_pretty(requirements) as requirements_json
FROM projects.get_categories_with_requirements()
WHERE category_slug = 'test-tecnologia';

-- =====================================================
-- PRUEBA 7: Eliminar un requisito específico
-- =====================================================
SELECT projects.remove_category_requirement(
    :category_id,
    'Cronograma'
) AS removed;

\echo '\n✅ PRUEBA 7: Requisito "Cronograma" eliminado'

-- Verificar eliminación
\echo '\n📋 Requisitos después de eliminar:'
SELECT requirement_name FROM projects.get_category_requirements(:category_id);

-- =====================================================
-- PRUEBA 8: Contar requisitos restantes
-- =====================================================
SELECT COUNT(*) as total_requirements
FROM projects.category_requirements
WHERE category_id = :category_id;

-- =====================================================
-- PRUEBA 9: Crear proyecto de prueba sin requisitos cumplidos
-- =====================================================
DO $$ 
DECLARE
    v_user_id UUID;
    v_project_id UUID;
    v_category_id INT := :category_id;
BEGIN
    -- Obtener un usuario existente
    SELECT id INTO v_user_id FROM users.user WHERE email = 'marcelo@gmail.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No hay usuarios en la BD. Ejecuta el seed primero.';
        RETURN;
    END IF;

    -- Crear proyecto sin cumplir requisitos
    INSERT INTO projects.project (
        creator_id, category_id, title, slug, description, summary,
        financial_goal, start_date, end_date, approval_status
    ) VALUES (
        v_user_id, v_category_id,
        'Proyecto Test Sin Requisitos',
        'test-proyecto-sin-req',
        'Descripción corta',  -- Menos de 200 caracteres (no cumple)
        'Resumen del proyecto',
        5000.00,
        NOW(),
        NOW() + INTERVAL '60 days',
        'draft'
    ) RETURNING id INTO v_project_id;

    RAISE NOTICE 'Proyecto creado: %', v_project_id;

    -- Validar requisitos
    RAISE NOTICE E'\n📋 Validación de Requisitos del Proyecto:';
    
    PERFORM * FROM projects.validate_project_requirements(v_project_id);
    
    -- Mostrar resultados
    RAISE NOTICE 'Ver resultados con: SELECT * FROM projects.validate_project_requirements(''%'');', v_project_id;
END $$;

-- =====================================================
-- PRUEBA 10: Limpiar todos los requisitos
-- =====================================================
SELECT projects.clear_category_requirements(:category_id) AS deleted_count;

\echo '\n✅ PRUEBA 10: Todos los requisitos eliminados'

-- Verificar
SELECT COUNT(*) as remaining_requirements
FROM projects.category_requirements
WHERE category_id = :category_id;

-- =====================================================
-- LIMPIEZA FINAL
-- =====================================================
\echo '\n🧹 Limpiando datos de prueba...'

DO $$ 
BEGIN
    DELETE FROM projects.project WHERE slug = 'test-proyecto-sin-req';
    DELETE FROM projects.category WHERE slug = 'test-tecnologia';
    RAISE NOTICE 'Datos de prueba eliminados';
END $$;

\echo '\n✅ TODAS LAS PRUEBAS COMPLETADAS'
