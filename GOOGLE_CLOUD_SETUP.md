# Configuración de Google Drive Backup

Para que el sistema de copias de seguridad automáticas funcione, necesitas configurar un proyecto en Google Cloud y obtener credenciales.

## Paso 1: Crear Proyecto y Habilitar API

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuevo proyecto (ej. `citaplanner-backup`).
3.  En el menú lateral, ve a **APIs & Services > Library**.
4.  Busca **Google Drive API** y habilítala.

## Paso 2: Crear Service Account

1.  Ve a **APIs & Services > Credentials**.
2.  Haz clic en **+ CREATE CREDENTIALS** y selecciona **Service Account**.
3.  Dale un nombre (ej. `backup-bot`).
4.  Haz clic en **Create and Continue**.
5.  (Opcional) En "Grant this service account access to project", puedes darle el rol **Editor** o dejarlo vacío (solo necesitamos que exista).
6.  Haz clic en **Done**.

## Paso 3: Obtener Clave JSON

1.  En la lista de Service Accounts, haz clic en el email de la cuenta que acabas de crear (ej. `backup-bot@...`).
2.  Ve a la pestaña **KEYS**.
3.  Haz clic en **ADD KEY > Create new key**.
4.  Selecciona **JSON** y descarga el archivo.
5.  **IMPORTANTE:** Guarda este archivo o su contenido. Lo necesitarás para la variable de entorno.

## Paso 4: Compartir Carpeta de Drive

1.  Ve a tu Google Drive personal o corporativo.
2.  Crea una carpeta donde quieras guardar los backups (ej. `CitaPlanner Backups`).
3.  Haz clic derecho en la carpeta > **Compartir**.
4.  En el campo de "Agregar personas", pega el **email de la Service Account** (ej. `backup-bot@citaplanner-backup.iam.gserviceaccount.com`).
5.  Dale permisos de **Editor**.
6.  Copia el **ID de la carpeta** de la URL del navegador.
    *   Ejemplo URL: `drive.google.com/drive/u/0/folders/1a2b3c4d5e6f...`
    *   ID: `1a2b3c4d5e6f...`

## Paso 5: Configurar Variables de Entorno

En tu panel de despliegue (Easypanel, Docker, .env), agrega:

```bash
# ID de la carpeta de Drive (Paso 4)
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id

# Contenido del JSON descargado (Paso 3)
# Puedes pegar todo el JSON como string en una sola línea
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'
```

## Funcionamiento

El sistema ejecutará automáticamente el backup todos los días a las **3:00 AM**.
1.  Extrae la base de datos PostgreSQL (`pg_dump`).
2.  Extrae la base de datos MongoDB (`mongodump`).
3.  Comprime todo en un `.zip` con fecha.
4.  Sube el archivo a la carpeta compartida.
5.  Limpia los archivos locales.
