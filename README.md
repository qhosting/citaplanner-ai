# CitaPlanner AI 📅

Una aplicación moderna de gestión de agenda y clientes, optimizada para el idioma español y potenciada por inteligencia artificial.

## Características Principales

### 🧠 Agendador Inteligente (Smart Scheduler)
Integra **Google Gemini (Modelo 2.5 Flash)** para interpretar lenguaje natural.
*   **Funcionamiento:** Escribe comandos como *"Revisión con Carlos el viernes a las 4pm"* y la IA extraerá automáticamente la fecha, hora, título y cliente.
*   **Soporte de Idioma:** Las instrucciones del sistema ("System Instructions") están optimizadas para entender contextos y fechas relativas en español.

### 📊 Panel de Control (Dashboard)
Una vista centralizada de tu agenda con herramientas de productividad:
*   **Filtros Avanzados:**
    *   **Por Estado:** Visualiza citas Programadas, Completadas o Canceladas.
    *   **Por Fecha:** Filtra citas dentro de un rango de fechas específico (Desde/Hasta).
*   **Resumen Semanal:** Estadísticas rápidas sobre la carga de trabajo de la semana.
*   **Visualización:** Tarjetas de cita con indicadores de estado codificados por colores.

### 👥 Gestión de Clientes
*   Directorio de clientes con búsqueda en tiempo real.
*   Almacenamiento de datos de contacto (Email, Teléfono, Notas).
*   Asociación automática de citas a clientes existentes.

## Tecnologías Utilizadas

*   **Frontend:** React 19, TypeScript
*   **Estilos:** Tailwind CSS
*   **IA:** Google GenAI SDK (`@google/genai`)
*   **Iconos:** Lucide React
*   **Enrutamiento:** React Router DOM

## Configuración

Para que la funcionalidad de IA funcione, se requiere una API Key válida de Google Gemini configurada en el entorno como `API_KEY`.
