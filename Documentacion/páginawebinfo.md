# Guía Estructural y de Navegación - Plataforma Educativa EduWanka

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
* **Propuesta de Valor (¿Por qué elegir EduWanka?):** Metodología probada, red de contactos, certificaciones, enfoque práctico.
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
    * Check de "Recordarme" y enlace "¿Olvidaste tu contraseña?" (redirige a `/forgot-password`).
    * Botón "Iniciar Sesión".

### 1.6. Registro (Creación de Cuenta)
* **Formulario de Registro (`/registro`):**
    * Campos solicitados: Nombres, Apellidos, Correo Electrónico, DNI / Documento, Teléfono / Celular, Ciudad, Contraseña, Confirmar Contraseña.
    * Lógica de envío: Consume `/api/v1/auth/register`, almacena las credenciales de acceso de forma segura en `sessionStorage` y `localStorage` e inicia la sesión redirigiendo inmediatamente al Aula Virtual (`/aula`).

### 1.7. Recuperación y Restablecimiento de Contraseñas
* **Solicitud de Recuperación (`/forgot-password`):** Permite al usuario ingresar su correo registrado. El backend procesa la solicitud mediante `/api/v1/auth/forgot-password` enviando un correo electrónico con un token de restablecimiento.
* **Restablecimiento (`/reset-password`):** El usuario ingresa la nueva clave confirmada con el token recibido. La petición se procesa en `/api/v1/auth/reset-password` para actualizar la clave en el sistema.

### 1.8. Proceso de Checkout y Métodos de Pago
* **Inscripción y Compra (`/checkout`):**
    * **Pago Manual por Comprobante ("proof"):** Permite al estudiante subir una imagen del voucher bancario. Requiere revisión y validación manual por parte de la administración.
    * **Pago en Línea con Mercado Pago ("mercadopago"):** Integración directa que genera preferencias de pago personalizadas a través de `/api/v1/checkout/register_purchase`. Redirige al alumno a la pasarela oficial de Mercado Pago para procesar pagos con tarjetas o banca y regresa de forma segura al portal escolar indicando el estado del pago (`success`, `failure` o `pending`).

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
    * **Materiales (Implementado Dinámicamente):** Visualización interactiva y ordenada en acordeones de los cursos matriculados del alumno. Consume `/api/v1/aula/courses/{id}` para listar y descargar los archivos (`file` y `document`) publicados en cada sección y módulo de manera dinámica.
    * **Clases en Vivo (Implementado Dinámicamente):** Módulo central de clases en vivo estructurado en pestañas interactivas:
        * *Todas las clases:* Listado de todas las sesiones.
        * *En Vivo Ahora 🔴:* Clases en transmisión directa en el momento.
        * *Próximas Clases:* Sesiones agendadas con fecha, hora y plataforma.
        * *Grabaciones / Pasadas:* Acceso para ver la grabación de videoconferencias concluidas.
        * Filtrado por curso y plataforma (Meet, Zoom, etc.), con botones para unirse directamente.
    * **Exámenes:** Sala de evaluación y cuestionarios.
    * **Mis Notas (Intentos):** Historial de los exámenes ya rendidos y su respectiva calificación.
    * **Mis Certificados:** Panel para descargar en PDF los certificados oficiales obtenidos.

---

## 3. ARQUITECTURA GENERAL Y SISTEMA DE DATOS (BACKEND)

### 3.1. Restricción Estricta de Multi-tenancy
* **Obligatoriedad del Tenant:** Se configuró el campo `tenant_id` como obligatorio (`NOT NULL`) en las tablas de la base de datos. El middleware `TenantMiddleware` gestiona de manera transparente la resolución del tenant activo a partir del dominio o slug, con soporte adaptativo para bases de datos SQLite en entornos de prueba y MySQL en producción.

### 3.2. Logs de Auditoría (Audit Logs)
* **Trait `Auditable`:** Implementado en los modelos centrales de la aplicación (`User`, `Course`, `Purchase`, etc.) para registrar automáticamente eventos de creación (`created`), edición (`updated`) y eliminación (`deleted`).
* **Seguridad y Trazabilidad:** Almacena los valores antiguos (`old_values`) y nuevos (`new_values`) en formato JSON excluyendo campos sensibles como contraseñas (`password`) o tokens de sesión. Registra también el usuario ejecutor, dirección IP y user agent en la tabla `audit_logs`.

### 3.3. Webhook de Mercado Pago (Procesamiento Asíncrono)
* **IPN (Instant Payment Notification):** El endpoint `/api/v1/payments/mercadopago/webhook` recibe las notificaciones de estado de pago en tiempo real. 
* **Flujo Automático:** Resuelve el tenant asociado a la compra, valida la transacción mediante `PaymentGatewayService` y actualiza automáticamente el estado de la compra (`paid` para pagos aprobados, `rejected` para rechazados), registrando una auditoría del cambio y notificando los accesos del aula virtual al alumno por correo de manera instantánea.

---
*Nota de Diseño Técnico:* Se recomienda usar un sistema de diseño basado en componentes para asegurar consistencia visual, utilizando tarjetas (cards) con bordes redondeados y una paleta de colores corporativa centrada en tonos azules y blancos, proporcionando un entorno profesional y confiable para la educación legal.
