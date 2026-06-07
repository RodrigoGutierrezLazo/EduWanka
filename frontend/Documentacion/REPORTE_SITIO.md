# Auditoría y Resumen de la Plataforma INAPROF

Este documento proporciona una visión general técnica y estética de la plataforma web de INAPROF (Excelencia Académica), identificando su stack tecnológico y áreas de mejora en diseño y diagramación.

---

## 1. Resumen General
**INAPROF** es una plataforma web para una institución de alta especialización académica. El sitio está diseñado como una landing page robusta que incluye secciones de:
- **Programas Académicos**: Gestión, Tecnología y Leyes.
- **Especialidades**: Formación de Árbitros, Peritos, Conciliadores, etc.
- **Cuerpo Docente**: Presentación de instructores destacados.
- **Eventos y Webinars**: Agenda académica próxima.
- **Aula Virtual**: Portal de acceso para estudiantes.

El diseño sigue una estética **premium e institucional**, utilizando una paleta de colores azul profundo (`primary: #072146`) y dorado/ocre (`secondary: #B78E24`), con tipografías que mezclan lo moderno (Sans) y lo académico (Serif).

---

## 2. Stack Tecnológico
La aplicación está construida con tecnologías modernas de alto rendimiento:

| Tecnología | Propósito |
| :--- | :--- |
| **React 19** | Biblioteca base para la interfaz de usuario. |
| **Vite** | Herramienta de construcción (bundler) ultra rápida. |
| **TypeScript** | Tipado estático para mayor robustez del código. |
| **Tailwind CSS 4** | Framework de estilos utilitarios (versión más reciente). |
| **Motion (Framer)** | Biblioteca para animaciones y transiciones fluidas. |
| **Lucide React** | Set de iconos vectoriales consistentes. |
| **React Router 7** | Manejo de navegación y rutas de la aplicación. |

---

## 3. Análisis de Diseño y Errores Identificados

### A. Espacios Vacíos (Layout & Spacing)
1. **Menú Móvil Desproporcionado**: El overlay del menú móvil (`Navbar.tsx`) utiliza un alto de pantalla completo (`min-h-screen`) y un padding superior de `pt-32`. Para solo 4 ítems de navegación, esto genera un **espacio vacío masivo** en la parte inferior de los dispositivos móviles, haciendo que la interfaz se sienta incompleta.
2. **Padding Excesivo en Secciones**: Varias secciones en `Home.tsx` utilizan `py-32` (128px de espacio vertical). Si bien esto busca "airear" el diseño, en pantallas medianas puede causar que el usuario tenga que hacer demasiado scroll para encontrar contenido relevante, creando una sensación de desconexión entre secciones.
3. **Hero Container Margin**: El contenedor de texto del Hero tiene un `mt-20`. En pantallas pequeñas o con resoluciones bajas, esto puede empujar el contenido hacia abajo de forma que el Call to Action (CTA) quede fuera del primer "fold" (la vista inicial sin scroll).

### B. Errores de Diseño y UX
1. **Conflicto de Elementos Sticky**: En la página de cursos (`Courses.tsx`), los filtros tienen un `sticky top-16`. Sin embargo, el Navbar también es fijo y tiene un alto dinámico. Existe un riesgo alto de que los filtros queden **ocultos bajo el Navbar** o que el espacio entre ellos sea inconsistente (overlap).
2. **Imágenes en Grayscale**: En la sección de docentes (`Faculty`), las imágenes son escala de grises por defecto y solo cobran color al pasar el cursor (hover). Esto puede hacer que la sección se vea "apagada" o con falta de vida en la primera impresión, especialmente si el usuario no interactúa con cada foto.
3. **Inconsistencia en Datos de Contacto**: El footer muestra un correo `.edu` y un teléfono de Estados Unidos, mientras que el login hace referencia a `.edu.pe`. Estos **placeholders** restan credibilidad al diseño final.
4. **Estado Vacío de Búsqueda**: Cuando no hay resultados en el buscador de cursos, la interfaz muestra un texto simple. Falta un diseño de "Empty State" que mantenga la estética premium (un icono, un botón de reset, etc.).
5. **Legibilidad en Hero**: El fondo del Hero tiene una opacidad del 25% sobre un fondo oscuro. Dependiendo de la calibración del monitor del usuario, la imagen de fondo puede parecer una "mancha" oscura en lugar de una fotografía arquitectónica.

### C. Sugerencias de Mejora
- **Reducir Paddings**: Ajustar los `py-32` a `py-20` en dispositivos móviles para mejorar el ritmo de lectura.
- **Interacción de Navbar**: Implementar un cambio de color más marcado en el Navbar cuando se hace scroll para evitar que el texto blanco se pierda sobre fondos claros.
- **Refinar Menú Móvil**: Centrar verticalmente los ítems del menú móvil o añadir elementos visuales (como una imagen decorativa o redes sociales más prominentes) para llenar el espacio vacío.
- **Añadir Micro-interacciones**: Las tarjetas de cursos en `Courses.tsx` podrían beneficiarse de una elevación de sombra (`shadow-hover`) más pronunciada para indicar interactividad.

---
*Documento generado para el análisis de mejora continua de la plataforma INAPROF.*
