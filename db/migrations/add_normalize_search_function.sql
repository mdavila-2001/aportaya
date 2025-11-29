-- Migración: Agregar función de normalización de búsqueda
-- Ejecutar este script en la base de datos para habilitar búsquedas insensibles a acentos

-- Función para normalizar texto removiendo acentos y caracteres especiales
CREATE OR REPLACE FUNCTION public.normalize_search_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        TRANSLATE(
            text_input,
            'áéíóúàèìòùâêîôûäëïöüãõñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÃÕÑÇ',
            'aeiouaeiouaeiouaeiouaonc AEIOUAEIOUAEIOUAEIOUAONC'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentario
COMMENT ON FUNCTION public.normalize_search_text(TEXT) IS 
'Normaliza texto removiendo acentos y convirtiendo a minúsculas para búsquedas insensibles a acentos.';

-- Prueba de la función
DO $$
BEGIN
    RAISE NOTICE 'Prueba: normalize_search_text(''Ecología'') = %', public.normalize_search_text('Ecología');
    RAISE NOTICE 'Prueba: normalize_search_text(''José María'') = %', public.normalize_search_text('José María');
    RAISE NOTICE 'Función normalize_search_text creada exitosamente';
END $$;
