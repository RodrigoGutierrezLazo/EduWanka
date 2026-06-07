# Sistema de Diseño - EduWanka

## 1. Contexto Institucional
**EduWanka** es una plataforma orientada a la educación online, especializada en la formación y actualización profesional. Esta guía técnica establece las directrices visuales para asegurar que los sistemas internos y los entornos virtuales de aprendizaje proyecten una imagen de excelencia, formalidad e innovación.

## 2. Tokens de Diseño (Paleta de Colores)
La identidad gráfica se sostiene en un esquema principal de dos colores que equilibra la sobriedad académica con el dinamismo.

```css
/* CSS Variables - Global Theme */
:root {
  /* Brand Colors */
  --eduwanka-primary: #072146;   /* Azul Marino - Para fondos, barras de navegación y textos primarios */
  --eduwanka-secondary: #b78e24; /* Dorado - Para acentos, isotipos, botones y llamadas a la acción */
  
  /* Neutrals */
  --eduwanka-white: #ffffff;
}
```

## 3. Tipografía
Se establece una jerarquía clara para garantizar la legibilidad en interfaces digitales de uso prolongado.

* **Títulos y Encabezados (H1, H2, H3):** PP Neue Montreal (Regular)
* **Subtítulos:** PP Neue Montreal Book
* **Cuerpo de Texto y UI:** Poppins Medium

*Nota de implementación:* Poppins es fundamental para el renderizado de la interfaz y botones. Según las directrices del manual, si PP Neue Montreal no se encuentra disponible como web font, se puede recurrir a tipografías de la misma familia o geometría para mantener la integridad visual del sistema.

## 4. Reglas de Aplicación del Logotipo
La maquetación del logotipo en las plataformas web debe ajustarse a las siguientes restricciones y variantes:

* **Versión Principal (Apilada):** Texto "EduWanka" en `--eduwanka-primary` y trazo curvo en `--eduwanka-secondary` sobre fondos claros. El descriptor "CAPACITACIÓN PROFESIONAL" debe ir justificado a la derecha debajo de la marca.
* **Versión Horizontal:** Optimizada para el Navbar o áreas con espacio vertical limitado. Se incluye una fina línea divisoria entre el logotipo principal y el descriptor.
* **Alto Contraste (Negativo):** Logo completamente en `--eduwanka-white`. Uso exclusivo para superposiciones sobre la variante de fondo `--eduwanka-primary`.
* **Monocromático:** Versiones disponibles en azul marino (#072146) o negro sólido para impresiones a una tinta o interfaces minimalistas que no requieran acento dorado.

## 5. UI y Recursos Gráficos
Los componentes de la interfaz deben heredar las siguientes geometrías y comportamientos base:

* **Botones (Buttons):**
  * Radios de borde tipo pill (completamente redondeados).
  * Geometrías de pestaña (con bordes asimétricos, dejando una o dos esquinas rectas).
  * *Estilo Solid:* Fondo en `--eduwanka-secondary` con el texto en blanco.
  * *Estilo Outline:* Borde fino en `--eduwanka-secondary` con fondo transparente.
* **Iconografía y Viñetas:** Los flujos de procesos o indicadores utilizan hexágonos u óvalos. Las flechas direccionales o de "siguiente" se caracterizan por emplear un patrón de chevron múltiple (>> o >>>).
* **Profundidad:** Las tarjetas de alto contraste y los botones principales flotantes utilizan un suave drop-shadow proyectado hacia la parte inferior, aportando un efecto de elevación en la interfaz visual.

---

[Etapa intermedia y control de acusación](https://www.youtube.com/watch?v=KQXUk4xqY0g)
Este video es un ejemplo representativo del contenido sobre derecho procesal y penal que instituciones como EduWanka fomentan en sus diplomados y programas de especialización.

http://googleusercontent.com/youtube_content/0