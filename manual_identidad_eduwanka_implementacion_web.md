# Manual de Identidad Visual e Implementación Web  
# EduWanka

## 1. Propósito del documento

Este documento define las reglas visuales y técnicas para implementar la identidad de **EduWanka** dentro de una aplicación web desarrollada con **HTML, CSS y JavaScript**, o cualquier framework moderno como Angular, React, Vue o similares.

EduWanka es una plataforma educativa digital enfocada en cursos, formación virtual y certificación. Su identidad combina:

- Educación digital
- Innovación
- Confianza
- Prestigio institucional
- Raíces culturales huanca-peruanas
- Proyección tecnológica

La marca debe sentirse moderna, sobria, profesional y culturalmente auténtica.

---

## 2. Concepto visual de la marca

EduWanka debe representarse principalmente como un **wordmark**, es decir, un logotipo tipográfico donde el nombre de la marca es el elemento principal.

La identidad visual se inspira en la cultura huanca y andina de la sierra central del Perú, pero reinterpretada con una estética:

- Minimalista
- Institucional
- Tecnológica
- Elegante
- Escalable
- Profesional

Los elementos culturales deben aparecer como detalles sutiles, especialmente mediante formas geométricas, líneas, rombos, patrones o acentos integrados en la interfaz.

No se debe usar una estética folclórica recargada, artesanal en exceso o infantil.

---

## 3. Logotipo principal

### 3.1. Nombre oficial

```txt
EduWanka
```

La escritura correcta de la marca es:

```txt
EduWanka
```

Debe respetarse la mayúscula inicial en **Edu** y **Wanka**.

---

### 3.2. Estructura recomendada del logotipo en HTML

```html
<a href="index.html" class="brand-logo" aria-label="EduWanka">
  <span class="brand-logo__edu">Edu</span>
  <span class="brand-logo__accent"></span>
  <span class="brand-logo__wanka">Wanka</span>
</a>
```

---

### 3.3. CSS del logotipo

```css
.brand-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.brand-logo__edu {
  color: var(--color-primary);
}

.brand-logo__wanka {
  color: var(--color-secondary);
}

.brand-logo__accent {
  width: 9px;
  height: 9px;
  margin: 0 7px;
  background-color: var(--color-accent);
  transform: rotate(45deg);
  display: inline-block;
}

.brand-logo:hover {
  opacity: 0.9;
}
```

---

## 4. Paleta de colores

La paleta evita completamente los colores azul y naranja. Está inspirada en tonos andinos, tierra, textiles y estética institucional.

### 4.1. Colores principales

| Nombre | Código HEX | Uso recomendado |
|---|---:|---|
| Granate andino | `#7A0F1F` | Color principal de marca, botones primarios, títulos destacados |
| Dorado suave | `#C8A14A` | Color secundario, resaltados, botones de alta acción, títulos secundarios |
| Verde olivo oscuro | `#3E3D2A` | Acentos, detalles sutiles, contraste institucional, navegación |
| Crema andino | `#E7E1D6` | Fondos suaves, tarjetas, secciones secundarias |
| Marrón tierra | `#5A4636` | Elementos institucionales, textos cálidos, fondos secundarios |
| Grafito | `#222222` | Texto principal |
| Blanco | `#FFFFFF` | Fondo base |

---

## 5. Variables CSS globales

Agregar estas variables al archivo principal de estilos.

Por ejemplo:

```txt
styles.css
global.css
app.css
src/styles.css
```

```css
:root {
  --color-primary: #7A0F1F;
  --color-primary-dark: #64101C;

  --color-secondary: #C8A14A; /* Dorado suave como resaltado principal */
  --color-accent: #3E3D2A; /* Verde olivo oscuro como acento */

  --color-bg: #FFFFFF;
  --color-bg-soft: #E7E1D6;
  --color-earth: #5A4636;

  --color-text: #222222;
  --color-text-muted: #5F5F5F;
  --color-border: rgba(0, 0, 0, 0.08);

  --font-title: "Playfair Display", Georgia, serif;
  --font-body: "Inter", "Segoe UI", Arial, sans-serif;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 999px;

  --shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 12px 32px rgba(34, 34, 34, 0.08);

  --container-width: 1200px;
}
```

---

## 6. Tipografías recomendadas

### 6.1. Para logotipo y títulos

Usar tipografías elegantes, con presencia institucional.

Opciones recomendadas:

```txt
Playfair Display
Cinzel
Cormorant Garamond
Merriweather
Libre Baskerville
```

Recomendación principal:

```txt
Playfair Display
```

---

### 6.2. Para interfaz web

Usar tipografías modernas, limpias y muy legibles.

Opciones recomendadas:

```txt
Inter
Poppins
Montserrat
Roboto
Segoe UI
```

Recomendación principal:

```txt
Inter
```

---

### 6.3. Importación sugerida desde Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" 
  rel="stylesheet">
```

---

## 7. Estilos base del proyecto

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-text);
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
}

h1,
h2,
h3,
h4 {
  font-family: var(--font-title);
  color: var(--color-secondary);
  margin-top: 0;
}

p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.container {
  width: min(100% - 2rem, var(--container-width));
  margin-inline: auto;
}

.section {
  padding: 5rem 0;
}

.text-primary {
  color: var(--color-primary);
}

.text-accent {
  color: var(--color-accent);
}

.bg-soft {
  background-color: var(--color-bg-soft);
}
```

---

## 8. Encabezado principal

### 8.1. HTML

```html
<header class="main-header">
  <nav class="navbar container">
    <a href="index.html" class="brand-logo" aria-label="EduWanka">
      <span class="brand-logo__edu">Edu</span>
      <span class="brand-logo__accent"></span>
      <span class="brand-logo__wanka">Wanka</span>
    </a>

    <ul class="nav-menu">
      <li><a href="#">Inicio</a></li>
      <li><a href="#">Cursos</a></li>
      <li><a href="#">Certificados</a></li>
      <li><a href="#">Nosotros</a></li>
    </ul>

    <a href="#" class="btn btn-primary">Ingresar</a>
  </nav>
</header>
```

---

### 8.2. CSS

```css
.main-header {
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-menu a {
  text-decoration: none;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.nav-menu a:hover {
  color: var(--color-primary);
}
```

---

## 9. Botones

### 9.1. Botón base

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.85rem 1.35rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
}
```

---

### 9.2. Botón principal

```html
<a href="#" class="btn btn-primary">Empezar ahora</a>
```

```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-bg);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}
```

---

### 9.3. Botón secundario

```html
<a href="#" class="btn btn-secondary">Ver cursos</a>
```

```css
.btn-secondary {
  background-color: var(--color-bg-soft);
  color: var(--color-secondary);
  border: 1px solid rgba(62, 61, 42, 0.18);
}

.btn-secondary:hover {
  background-color: var(--color-accent);
  color: var(--color-bg);
}
```

---

## 10. Hero principal

### 10.1. HTML

```html
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__content">
      <span class="eyebrow">Educación digital con identidad andina</span>

      <h1>
        Aprende, certifícate y proyecta tu futuro con 
        <span>EduWanka</span>
      </h1>

      <p>
        Plataforma educativa para cursos digitales, formación profesional 
        y certificación institucional con una experiencia moderna y confiable.
      </p>

      <div class="hero__actions">
        <a href="#" class="btn btn-primary">Explorar cursos</a>
        <a href="#" class="btn btn-secondary">Validar certificado</a>
      </div>
    </div>

    <div class="hero__panel">
      <div class="hero-card">
        <span>Certificación digital</span>
        <strong>EduWanka</strong>
        <p>Formación moderna con respaldo institucional.</p>
      </div>
    </div>
  </div>
</section>
```

---

### 10.2. CSS

```css
.hero {
  padding: 6rem 0;
  background:
    radial-gradient(circle at top right, rgba(200, 161, 74, 0.16), transparent 32%),
    linear-gradient(180deg, #FFFFFF 0%, #F8F5EF 100%);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 4rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 1.2rem;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-full);
  background-color: rgba(122, 15, 31, 0.08);
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero h1 {
  font-size: clamp(2.7rem, 5vw, 5rem);
  line-height: 1.02;
  margin-bottom: 1.5rem;
}

.hero h1 span {
  color: var(--color-primary);
}

.hero p {
  max-width: 620px;
  font-size: 1.1rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.hero__panel {
  min-height: 420px;
  border-radius: 2rem;
  background:
    linear-gradient(135deg, rgba(122, 15, 31, 0.95), rgba(62, 61, 42, 0.95)),
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.06) 0 2px,
      transparent 2px 16px
    );
  display: grid;
  place-items: center;
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

.hero-card {
  width: min(100%, 340px);
  padding: 2rem;
  border-radius: var(--radius-lg);
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-soft);
}

.hero-card span {
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.hero-card strong {
  display: block;
  margin: 0.7rem 0;
  font-family: var(--font-title);
  font-size: 2rem;
  color: var(--color-secondary);
}
```

---

## 11. Tarjetas de cursos

### 11.1. HTML

```html
<article class="course-card">
  <span class="course-card__tag">Certificación</span>

  <h3>Diseño de Plataformas Digitales</h3>

  <p>
    Aprende a crear experiencias educativas modernas con enfoque profesional.
  </p>

  <a href="#" class="course-card__link">Ver curso</a>
</article>
```

---

### 11.2. CSS

```css
.course-card {
  background-color: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--color-border);
  transition: all 0.25s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.course-card__tag {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 800;
}

.course-card h3 {
  margin-bottom: 0.7rem;
}

.course-card__link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-primary);
  font-weight: 800;
  text-decoration: none;
}

.course-card__link:hover {
  color: var(--color-secondary);
}
```

---

## 12. Formularios

Los formularios deben comunicar confianza y claridad.

### 12.1. HTML

```html
<form class="form-card">
  <div class="form-group">
    <label for="email">Correo electrónico</label>
    <input id="email" type="email" placeholder="correo@ejemplo.com">
  </div>

  <div class="form-group">
    <label for="password">Contraseña</label>
    <input id="password" type="password" placeholder="Ingresa tu contraseña">
  </div>

  <button class="btn btn-primary" type="submit">Ingresar</button>
</form>
```

---

### 12.2. CSS

```css
.form-card {
  width: min(100%, 420px);
  padding: 2rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.form-group {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 1rem;
}

.form-group label {
  color: var(--color-secondary);
  font-size: 0.9rem;
  font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  font-family: var(--font-body);
  font-size: 1rem;
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(122, 15, 31, 0.08);
}
```

---

## 13. Certificados digitales

Los certificados deben verse institucionales, sobrios y confiables.

### 13.1. Reglas visuales

Usar:

- Fondo blanco o crema.
- Logotipo EduWanka en la parte superior.
- Línea decorativa dorada o granate.
- Patrón andino muy tenue en bordes.
- Nombre del estudiante como elemento principal.
- Código de validación visible.
- Fecha de emisión.
- Firma o sello institucional.

Evitar:

- Fondos saturados.
- Exceso de ornamentos.
- Colores azules o naranjas.
- Iconografía genérica.

---

### 13.2. CSS base para certificado

```css
.certificate {
  width: min(100%, 1000px);
  margin: auto;
  padding: 4rem;
  background-color: var(--color-bg);
  border: 2px solid var(--color-accent);
  color: var(--color-text);
  position: relative;
}

.certificate::before {
  content: "";
  position: absolute;
  inset: 1rem;
  border: 1px solid rgba(122, 15, 31, 0.18);
  pointer-events: none;
}

.certificate-title {
  color: var(--color-primary);
  font-family: var(--font-title);
  font-size: 3rem;
  text-align: center;
}

.certificate-student {
  font-family: var(--font-title);
  color: var(--color-secondary);
  font-size: 2.4rem;
  text-align: center;
}

.certificate-code {
  margin-top: 2rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}
```

---

## 14. Patrones andinos sutiles

Los patrones deben funcionar como acento visual secundario, nunca como protagonista.

### 14.1. Patrón recomendado con CSS

```css
.pattern-soft {
  background-color: var(--color-bg-soft);
  background-image:
    linear-gradient(45deg, rgba(200, 161, 74, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(200, 161, 74, 0.08) 25%, transparent 25%);
  background-size: 24px 24px;
}
```

---

### 14.2. Uso recomendado

Aplicar en:

- Secciones secundarias.
- Bordes inferiores.
- Certificados.
- Fondos de tarjetas destacadas.
- Separadores visuales.

No aplicar en:

- Toda la página.
- Fondos de lectura extensa.
- Formularios principales.
- Tablas con mucha información.

---

## 15. Iconografía

La iconografía debe ser:

- Lineal
- Simple
- Institucional
- De bajo peso visual
- Compatible con interfaz web

Evitar como ícono principal de marca:

- Birrete
- Libro
- Foco
- Laptop genérica
- Escudo recargado

Los íconos pueden usarse dentro de la interfaz, pero no deben reemplazar el wordmark.

---

## 16. Estilo de componentes

### 16.1. Tarjetas

```css
.card {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-soft);
}
```

---

### 16.2. Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  padding: 0.35rem 0.7rem;
  background-color: rgba(122, 15, 31, 0.08);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 800;
}
```

---

### 16.3. Separadores

```css
.divider-accent {
  width: 56px;
  height: 3px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
}
```

---

## 17. Diseño responsive

Agregar las siguientes reglas para mejorar la adaptación móvil.

```css
@media (max-width: 900px) {
  .hero__grid {
    grid-template-columns: 1fr;
  }

  .nav-menu {
    display: none;
  }

  .hero {
    padding: 4rem 0;
  }

  .hero__panel {
    min-height: 320px;
  }
}

@media (max-width: 600px) {
  .brand-logo {
    font-size: 1.6rem;
  }

  .section {
    padding: 3.5rem 0;
  }

  .hero h1 {
    font-size: 2.6rem;
  }

  .hero__actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
```

---

## 18. Reglas de uso correcto

La identidad EduWanka debe cumplir estas reglas:

1. Mantener el logotipo como elemento tipográfico principal.
2. Usar siempre la paleta definida.
3. Evitar completamente azul y naranja.
4. Usar el granate andino como color principal.
5. Usar el dorado solo como acento.
6. Mantener fondos claros y limpios.
7. Usar patrones andinos de forma sutil.
8. Priorizar legibilidad y accesibilidad.
9. Evitar ornamentos excesivos.
10. Mantener una apariencia institucional y tecnológica.

---

## 19. Reglas de uso incorrecto

No se debe:

- Cambiar los colores por azul o naranja.
- Usar el logo sobre fondos que reduzcan su legibilidad.
- Deformar, estirar o comprimir el logotipo.
- Añadir sombras fuertes al logotipo.
- Usar íconos educativos genéricos como elemento principal.
- Usar patrones culturales demasiado saturados.
- Usar fuentes infantiles.
- Mezclar demasiados estilos gráficos.
- Convertir la identidad en una estética folclórica recargada.

---

## 20. Prompt para IA generadora de código

Usar este prompt para implementar la identidad visual en un proyecto web:

```txt
Implementa la identidad visual de EduWanka en esta aplicación web. EduWanka es una plataforma educativa digital enfocada en cursos y certificación. Usa una estética moderna, institucional, premium y minimalista, inspirada sutilmente en la cultura huanca-andina de Huancayo, Perú.

Respeta estrictamente esta paleta:
- Granate andino: #7A0F1F
- Verde olivo oscuro: #3E3D2A
- Dorado suave: #C8A14A
- Crema andino: #E7E1D6
- Marrón tierra: #5A4636
- Grafito: #222222
- Blanco: #FFFFFF

No uses azul ni naranja.

El logotipo debe ser principalmente tipográfico:
EduWanka

Implementa el logo como wordmark horizontal usando HTML y CSS:
- Edu en granate andino
- Wanka en verde olivo oscuro
- Un pequeño rombo dorado como acento geométrico andino entre ambas partes

Usa tipografías recomendadas:
- Playfair Display para logo y títulos
- Inter para interfaz, textos, botones y formularios

La interfaz debe tener:
- Fondo claro
- Espaciado amplio
- Tarjetas limpias con bordes redondeados
- Botones sobrios
- Acentos dorados discretos
- Patrones andinos muy sutiles solo en secciones secundarias o certificados
- Apariencia seria, escalable, confiable y tecnológica

Evita:
- Íconos genéricos como birrete, libro o foco como elemento principal
- Estilo infantil
- Ornamentos excesivos
- Colores saturados
- Diseños folclóricos recargados

Aplica esta identidad en:
- Header
- Logo
- Botones
- Hero
- Tarjetas de cursos
- Formularios
- Certificados
- Footer
- Diseño responsive
```

---

## 21. Ejemplo mínimo de archivo HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>EduWanka</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link 
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" 
    rel="stylesheet">

  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <header class="main-header">
    <nav class="navbar container">
      <a href="index.html" class="brand-logo" aria-label="EduWanka">
        <span class="brand-logo__edu">Edu</span>
        <span class="brand-logo__accent"></span>
        <span class="brand-logo__wanka">Wanka</span>
      </a>

      <ul class="nav-menu">
        <li><a href="#">Inicio</a></li>
        <li><a href="#">Cursos</a></li>
        <li><a href="#">Certificados</a></li>
        <li><a href="#">Nosotros</a></li>
      </ul>

      <a href="#" class="btn btn-primary">Ingresar</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__content">
          <span class="eyebrow">Educación digital con identidad andina</span>

          <h1>
            Aprende, certifícate y proyecta tu futuro con
            <span>EduWanka</span>
          </h1>

          <p>
            Plataforma educativa para cursos digitales, formación profesional
            y certificación institucional con una experiencia moderna y confiable.
          </p>

          <div class="hero__actions">
            <a href="#" class="btn btn-primary">Explorar cursos</a>
            <a href="#" class="btn btn-secondary">Validar certificado</a>
          </div>
        </div>

        <div class="hero__panel">
          <div class="hero-card">
            <span>Certificación digital</span>
            <strong>EduWanka</strong>
            <p>Formación moderna con respaldo institucional.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

</body>
</html>
```

---

## 22. Checklist de implementación

Antes de finalizar la interfaz, verificar:

- [ ] El logo EduWanka es legible.
- [ ] No se usó azul.
- [ ] No se usó naranja.
- [ ] El color principal es granate andino.
- [ ] El dorado se usa solo como acento.
- [ ] Los patrones andinos son sutiles.
- [ ] La interfaz se ve profesional.
- [ ] Los botones tienen buen contraste.
- [ ] Las tarjetas tienen buen espaciado.
- [ ] La web funciona en móvil.
- [ ] Los certificados mantienen estilo institucional.
- [ ] El diseño no parece infantil ni recargado.
