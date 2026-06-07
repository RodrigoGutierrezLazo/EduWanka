# Guía Estructural y de Navegación - Plataforma Educativa INAPROF

Este documento detalla la estructura completa de la página web pública y los módulos del Aula Virtual (Dashboards) segmentados por roles (Administrador/Superadmin, Docente y Estudiante), basados en la arquitectura del backend y los requerimientos de un diseño moderno.

---

## 1. SITIO WEB PÚBLICO (FRONTEND)

El diseño del frontend debe mantener un enfoque moderno, limpio (UI/UX) y responsivo, estructurado para una carga rápida y optimización.

### 1.1. Página de Inicio (Landing Page)
* **Header/Navegación:** Logo, enlaces a Oferta Académica, Verificar Certificados, Contacto, y botón destacado "Aula Virtual".
* **Sección Hero:** Título principal ("Transforma tu carrera..."), subtítulo persuasivo, listado de beneficios clave y botones de Call to Action (CTA). Espacio para imagen o video promocional.
* **Cifras de Impacto (Estadísticas):** Contadores de estudiantes (+5,000), cursos (+50), docentes (+25) y tasa de satisfacción.
* **Especialidades Académicas:** Menú lateral o grid con las ramas del derecho (Derecho Constitucional, Penal, Civil, etc.) y descripción general.
* **Identidad Institucional:** Tarjetas modernas para Misión, Visión y Valores.
* **Propuesta de Valor (¿Por qué elegir INAPROF?):** Metodología probada, red de contactos, certificaciones, enfoque práctico.
* **Carrusel de Cursos Populares:** Tarjetas de cursos destacados con etiqueta de nivel, precio y botón de detalles.
* **Plantel Docente:** Perfiles resumidos de los profesionales destacados con sus credenciales.
* **Sección de Certificaciones:** Beneficios de la certificación oficial (validez nacional, firma digital, etc.).
* **Footer:** Enlaces rápidos, contacto, redes sociales y términos legales.

### 1.2. Oferta Académica (Catálogo de Cursos)
* **Buscador y Filtros:** Barra de búsqueda por texto, selectores desplegables para Categoría (rama del derecho), Instructor, y Ordenar por (popularidad, precio, etc.).
* **Grid de Cursos:** Tarjetas que incluyen:
    * Imagen de portada.
    * Etiqueta (Ej. Intermedio, Avanzado).
    * Título del curso.
    * Duración (horas), cantidad de estudiantes matriculados y calificación (estrellas).
    * Precio.
    * Botón "Ver Detalles ->".

### 1.3. Registro Oficial de Certificaciones (Validación)
* **Formulario de Consulta:** * Campo para ingresar el "Código de certificado".
    * Campo para el "DNI" del estudiante.
    * Botón de validación ("Buscar Certificado").
* **Resultados:** Vista que muestra el estado del certificado, curso, horas y validación de autenticidad.

### 1.4. Contacto
* **Tarjetas de Información:** Email, Teléfono, Oficina Principal y Horarios de atención.
* **Formulario de Contacto:** Campos para Nombre, Email, Teléfono, Asunto (selector) y Mensaje. Checkbox de políticas de privacidad.
* **Departamentos de Atención:** Listado de correos específicos.
* **Preguntas Frecuentes (FAQ):** Acordeón interactivo con dudas comunes.
* **Opciones directas:** Botones para "Agendar Llamada" o "Chat en Vivo".

### 1.5. Login (Acceso al Aula Virtual)
* **Formulario de Autenticación:**
    * Usuario: Validado por DNI (Estudiantes) o Email (Docentes/Admins).
    * Contraseña (con opción de visibilidad).
    * Check de "Recordarme" y enlace "¿Olvidaste tu contraseña?".
    * Botón "Iniciar Sesión".

---

## 2. AULA VIRTUAL - DASHBOARDS POR ROL (BACKEND)

El sistema interno debe presentar una interfaz limpia, tipo dashboard administrativo, con un menú lateral (Sidebar) colapsable y un área principal de trabajo. La visibilidad de los módulos depende estrictamente de los permisos del rol.

### 2.1. Rol: SUPERADMINISTRADOR / ADMINISTRADOR
Tiene acceso total a todos los módulos del sistema.

* **Principal**
    * **Dashboard:** Panel de resumen con accesos rápidos (Registrar Participante, Importar Datos, Generar Reportes). Tarjetas de métricas (Usuarios, Admins, Docentes, Estudiantes, Cursos Activos). Alertas de sistema. Tabla rápida de últimos usuarios registrados.
    * **Usuarios:** CRUD completo. Gestión de roles.
    * **Cursos:** Creador/Editor de cursos, módulos.
* **Finanzas**
    * **Validar Pagos:** Bandeja de revisión de vouchers o comprobantes subidos por estudiantes.
    * **Historial Pagos:** Registro auditable de todos los ingresos.
* **Académico**
    * **Asistencia:** Monitoreo global de asistencia.
    * **Materiales:** Repositorio central de recursos.
    * **Exámenes:** Banco de preguntas y gestión de evaluaciones globales.
    * **Intentos:** Registro de resoluciones de exámenes.
    * **Certificados:** Motor de generación y emisión.
* **Sistema**
    * **Claves:** Configuración de credenciales y accesos del sistema.

### 2.2. Rol: DOCENTE (PROFESOR)
Su interfaz está enfocada exclusivamente en la gestión de sus clases.

* **Principal**
    * **Dashboard:** Resumen de sus cursos activos y alumnos.
    * **Mis Cursos:** Vista detallada de las asignaturas que dicta.
* **Académico (Gestión de su clase)**
    * **Asistencia:** Módulo para registrar asistencia.
    * **Materiales:** Opción para subir/gestionar recursos para sus cursos.
    * **Exámenes:** Creación de cuestionarios para sus materias.
    * **Intentos:** Revisión y calificación de los exámenes de sus alumnos.

### 2.3. Rol: ESTUDIANTE (PARTICIPANTE)
Interfaz centrada en la experiencia de consumo del contenido y autogestión.

* **Principal**
    * **Dashboard:** Progreso de los cursos en los que está matriculado.
    * **Mis Cursos:** Acceso a las clases, módulos y videos.
* **Finanzas (Autogestión)**
    * **Mis Pagos:** Módulo para adjuntar el comprobante de pago de nuevos cursos.
    * **Historial de Pagos:** Lista de sus transacciones.
* **Académico (Material y Evaluaciones)**
    * **Materiales:** Descarga de recursos del curso.
    * **Exámenes:** Sala de evaluación.
    * **Mis Notas (Intentos):** Historial de los exámenes ya rendidos.
    * **Mis Certificados:** Panel para descargar en PDF los certificados obtenidos.

---
*Nota de Diseño Técnico:* Se recomienda usar un sistema de diseño basado en componentes para asegurar consistencia visual, utilizando tarjetas (cards) con bordes redondeados y una paleta de colores corporativa centrada en tonos azules y blancos, proporcionando un entorno profesional y confiable para la educación legal.
