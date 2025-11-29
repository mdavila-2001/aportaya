-- Función para normalizar texto removiendo acentos y caracteres especiales
-- Esta función puede ser reutilizada en todas las búsquedas del sistema

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

-- Comentario explicativo
COMMENT ON FUNCTION public.normalize_search_text(TEXT) IS 
'Función para normalizar texto removiendo acentos, ñ->n, y convirtiendo a minúsculas. 
Útil para búsquedas insensibles a acentos y caracteres especiales.
Ejemplo: normalize_search_text(''Ecología'') = ''ecologia''';
