#!/bin/bash

# Script para inicializar la base de datos PostgreSQL
# Se ejecuta automáticamente cuando el contenedor de PostgreSQL se inicia

set -e

# Variables de entorno
DB_NAME=${POSTGRES_DB:-aportaya}
DB_USER=${POSTGRES_USER:-postgres}

echo "🚀 Inicializando base de datos PostgreSQL..."

# Esperar a que PostgreSQL esté listo
until pg_isready -U "$DB_USER"; do
  echo "⏳ Esperando a que PostgreSQL esté listo..."
  sleep 2
done

echo "✅ PostgreSQL está listo"

# Verificar si la base de datos ya existe
if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "📊 La base de datos '$DB_NAME' ya existe. Verificando tablas..."
  
  # Verificar si las tablas principales existen
  TABLE_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'users' OR table_schema = 'projects' OR table_schema = 'payments' OR table_schema = 'social' OR table_schema = 'messaging' OR table_schema = 'audit' OR table_schema = 'roles' OR table_schema = 'files';" | tr -d ' ')
  
  if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ La base de datos ya contiene $TABLE_COUNT tablas. Omitiendo inicialización."
    echo "🎯 Para reinicializar, elimine el volumen de datos: docker-compose down -v"
    exit 0
  else
    echo "📝 La base de datos existe pero está vacía. Procediendo con la inicialización..."
  fi
else
  echo "📝 Creando base de datos '$DB_NAME'..."
  createdb -U "$DB_USER" "$DB_NAME"
fi

echo "🔧 Ejecutando scripts de inicialización..."

# Ejecutar el script principal de inicialización
echo "📂 Ejecutando init.sql..."
psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/init.sql

# Verificar que las tablas se crearon correctamente
FINAL_TABLE_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('users', 'projects', 'payments', 'social', 'messaging', 'audit', 'roles', 'files');" | tr -d ' ')
echo "✅ Base de datos inicializada con $FINAL_TABLE_COUNT tablas"

# Ejecutar seeds si existen
if [ -f "/docker-entrypoint-initdb.d/seed.sql" ]; then
  echo "🌱 Ejecutando datos de ejemplo..."
  psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/seed.sql
  echo "✅ Datos de ejemplo cargados"
fi

echo "🎉 Base de datos '$DB_NAME' inicializada exitosamente!"
echo "📊 Esquemas creados: users, projects, payments, social, messaging, audit, roles, files"
echo "🔧 Funciones, triggers y vistas configurados"
echo "🌱 Datos de ejemplo cargados (si existen)"
