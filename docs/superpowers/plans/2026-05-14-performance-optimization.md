# Performance Optimization — cofa.com.ar

> **Para agentes:** Requerido usar superpowers:subagent-driven-development o superpowers:executing-plans. Pasos con sintaxis checkbox (`- [ ]`) para tracking.

**Goal:** Improve Core Web Vitals (LCP < 2.5s, INP < 200ms) through code splitting, font optimization, lazy loading, and React performance improvements.

**Architecture:** Route-level code splitting via React.lazy + Suspense, vendor chunk separation in Vite, font-display swap, image lazy loading. LoanSim isolated into its own chunk.

**Tech Stack:** Vite 4.5, React 18, React Router DOM 6

---

## File Map

| File | Responsibility |
|---|---|
| `src/RouterScreens.jsx` | All route definitions — add lazy loading here |
| `vite.config.js` | Build config — add splitChunks and compression |
| `index.html` | Font URL, canonical, preconnects, video preload |
| `src/Components/ImageCarousel/ImageCarousel.jsx` | Add `loading="lazy"`, `decoding="async"` to images |
| `src/Components/Footer/Footer.jsx` | Add `loading="lazy"` to footer images + fix width/height |
| `src/Components/Carrusel/Carrusel.jsx` | Change video preload strategy |
| `src/Components/Seo/StructuredData.jsx` | Add FinancialService schema |
| `src/**/*.jsx` | 14 images need explicit width/height (Task 7) |

**Nota:** Las tareas del simulador de préstamos están en el archivo separado `docs/superpowers/plans/2026-05-14-optimizacion-simulador.md`.

---

## Task 1: Route-Level Code Splitting

**Files:**
- Modify: `src/RouterScreens.jsx:1-129`

- [ ] **Step 1: Add lazy imports and Suspense wrapper**

Replace the imports section (lines 1-21) with:

```jsx
import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy-loaded screens — each becomes a separate chunk
const HomeScreen = lazy(() => import("./screens/HomeScreen/HomeScreen"));
const LoanSimScreen = lazy(() => import("./screens/LoanSim/LoanSimScreen"));
const CofaTipsScreen = lazy(() => import("./screens/CofaTipsScreen/CofaTipsScreen"));
const ComplaintsScreen = lazy(() => import("./screens/ComplaintsScreen/ComplaintsScreen"));
const DischargeScreen = lazy(() => import("./screens/DischargeScreen/DischargeScreen"));
const ElMejorTratoScreen = lazy(() => import("./screens/ElMejorTratoScreen/ElMejorTratoScreen"));
const PrivacyPoliciesScreen = lazy(() => import("./screens/PrivacyPoliciesScreen/PrivacyPoliciesScreen"));
const QuejasScreen = lazy(() => import("./screens/QuejasScreen/QuejasScreen"));
const RegretOrDischargeScreen = lazy(() => import("./screens/RegretOrDischargeScreen/RegretOrDischargeScreen"));
const SuggestionsScreen = lazy(() => import("./screens/SuggestionsScreen/SuggestionsScreen"));
const TermsScreen = lazy(() => import("./screens/TermsScreen/TermsScreen"));
const TermsPointsScreen = lazy(() => import("./screens/TermsPointsScreen/TermsPointsScreen"));
const FrecuentQuestionScreen = lazy(() => import("./screens/FrecuentQuestionScreen/FrecuentQuestionScreen"));
const SacarPrestamoScreen = lazy(() => import("./screens/SacarPrestamoScreen/SacarPrestamoScreen"));
const BlogDetailScreen = lazy(() => import("./screens/blogDetailScreen/BlogDetailScreen"));
const IaPoliciesScreen = lazy(() => import("./screens/IaPoliciesScreen.jsx/IaPoliciesScreen"));
const FormWorkWithUs = lazy(() => import("./Sections/FormWorkWithUs/FormWorkWithUs"));
const ErrorScreen = lazy(() => import("./screens/ErrorScreen/ErrorScreen"));
```

- [ ] **Step 2: Wrap Routes in Suspense**

Replace the `Routes` block (lines 25-126) with:

```jsx
const RouterScreens = () => {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <Routes>
        <Route path='/' element={<HomeScreen />} />
        <Route path='/prestamos' element={<HomeScreen />} />
        <Route path='/simulador' element={<LoanSimScreen />} />
        <Route path='/preguntas-frecuentes' element={<FrecuentQuestionScreen />} />
        <Route path='/terminos-y-condiciones' element={<TermsScreen />} />
        <Route path='/politicas-de-privacidad' element={<PrivacyPoliciesScreen />} />
        <Route path='/politicas-de-uso-ia' element={<IaPoliciesScreen />} />
        <Route path='/sugerencias' element={<SuggestionsScreen />} />
        <Route path='/baja' element={<DischargeScreen />} />
        <Route path='/arrepentimiento' element={<RegretOrDischargeScreen />} />
        <Route path='/reclamos' element={<ComplaintsScreen />} />
        <Route path='/quejas' element={<QuejasScreen />} />
        <Route path='/terminos-y-condiciones-puntos-cofa' element={<TermsPointsScreen />} />
        <Route path='/trabaja-con-nosotros' element={<FormWorkWithUs />} />
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />} />
        <Route path='/sacar-prestamo' element={<SacarPrestamoScreen />} />
        <Route path='/cofa-tips' element={<CofaTipsScreen />} />
        <Route path='/blog/:slug' element={<BlogDetailScreen />} />
        <Route path='*' element={<ErrorScreen />} />
      </Routes>
    </Suspense>
  );
};
```

- [ ] **Step 3: Verify builds correctly**

Run: `npm run build`
Expected: Output includes multiple `assets/chunk-*.js` files (separate from `assets/index-*.js`)

---

## Task 2: Vite Vendor Chunk Separation

**Files:**
- Modify: `vite.config.js:1-7`

- [ ] **Step 1: Add splitChunks configuration**

Replace the entire `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-forms': ['formik', 'jose'],
          'vendor-pdf': ['jspdf'],
          'vendor-ai': ['@google/generative-ai'],
          'vendor-ui': ['react-icons', 'react-dropzone'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
})
```

- [ ] **Step 2: Run build and verify chunks**

Run: `npm run build`
Expected: `dist/assets/` contains `vendor-react-*.js`, `vendor-pdf-*.js`, etc.

---

## Task 3: Font Optimization

**Files:**
- Modify: `index.html:64-72`

- [ ] **Step 1: Add display=swap and reduce weights**

Replace lines 64-72:

```html
<!-- ANTES -->
<link rel="preload"
  href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
  as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" />
</noscript>

<!-- DESPUÉS -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
  as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" />
</noscript>
```

- [ ] **Step 2: Run build and verify font URL**

Run: `npm run build` → open `dist/index.html` → verify the font URL contains `&display=swap`

---

## Task 4: Image Lazy Loading

**Files:**
- Modify: `src/Components/ImageCarousel/ImageCarousel.jsx:72-76`
- Modify: `src/Components/Footer/Footer.jsx:65-123`

- [ ] **Step 1: Add lazy + async decoding to ImageCarousel**

In `ImageCarousel.jsx`, update the `<img>` tag:

```jsx
// ANTES
<img src={image.src} alt={`Slide ${index + 1}`} className={styles.carouselImage} />

// DESPUÉS
<img src={image.src} alt={`Slide ${index + 1}`} className={styles.carouselImage} loading="lazy" decoding="async" />
```

- [ ] **Step 2: Add lazy + async decoding to Footer images**

Add `loading="lazy" decoding="async"` to all 6 `<img>` tags in `Footer.jsx`.

- [ ] **Step 3: Verify**

Open DevTools → Network → reload page → verify carousel and footer images show `lazy` load and don't block initial paint.

---

## Task 5: Video Preload Strategy

**Files:**
- Modify: `src/Components/Carrusel/Carrusel.jsx:28-42`
- Modify: `index.html:108-110`

- [ ] **Step 1: Add preload="metadata" to video element**

In `Carrusel.jsx`:

```jsx
// ANTES
<video key={currentIndex} ref={videoRef} autoPlay muted playsInline className={style.image}>
  <source type='video/mp4' src={images[currentIndex]} />
</video>

// DESPUÉS
<video key={currentIndex} ref={videoRef} autoPlay muted playsInline preload="metadata" className={style.image}>
  <source type='video/mp4' src={images[currentIndex]} />
</video>
```

- [ ] **Step 2: Change preload to prefetch in index.html**

```html
<!-- ANTES -->
<link rel="preload" href="/img/videos-cofa-2-dinero-contando.mp4" as="video" type="video/mp4" />
<link rel="preload" href="/img/videos-cofa-3-dinero-contando.mp4" as="video" type="video/mp4" />
<link rel="preload" href="/img/videos-cofa-4-dinero-contando.mp4" as="video" type="video/mp4" />

<!-- DESPUÉS -->
<link rel="prefetch" href="/img/videos-cofa-2-dinero-contando.mp4" as="video" type="video/mp4" />
<link rel="prefetch" href="/img/videos-cofa-3-dinero-contando.mp4" as="video" type="video/mp4" />
<link rel="prefetch" href="/img/videos-cofa-4-dinero-contando.mp4" as="video" type="video/mp4" />
```

---

## Task 6: SEO — Canonical Tag + FinancialService Schema

**Files:**
- Modify: `index.html`
- Modify: `src/Components/Seo/StructuredData.jsx`

- [ ] **Step 1: Add canonical URL and third-party preconnects**

After `<meta name="robots" content="index, follow" />` (line 76), add:

```html
<link rel="canonical" href="https://cofa.com.ar/" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="preconnect" href="https://connect.facebook.net" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://connect.facebook.net" />
```

- [ ] **Step 2: Add FinancialService JSON-LD schema**

After the existing WebSite schema (line 107), add:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "name": "COFA Préstamos",
  "description": "Préstamos digitales rápidos con aprobación en el día, mínimos requisitos y total seguridad.",
  "url": "https://cofa.com.ar",
  "areaServed": "AR",
  "serviceType": "Personal Loans",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Planes de Préstamo COFA",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "Préstamo Personal",
        "description": "Desde $50.000 hasta $500.000 en 2 a 18 meses"
      }
    ]
  }
}
</script>
```

- [ ] **Step 3: Verify structured data**

Run: `npm run build` → open `dist/index.html` → confirm all three JSON-LD scripts (Organization, WebSite, FinancialService) are present.

---

## Task 7: Image Dimensions — Fix CLS (14 images)

**Files:**
- Modify: `src/Components/ImageCarousel/ImageCarousel.jsx`
- Modify: `src/Components/Footer/Footer.jsx`
- Modify: Various screen components (HomeScreen, CofaTipsScreen, FAQ, etc.)

**Source:** PageSpeed detected 14 images without explicit width/height attributes — these cause CLS (Cumulative Layout Shift). Every `<img>` needs `width` and `height` attributes (or aspect-ratio CSS) to prevent layout shift while loading.

- [ ] **Step 1: Audit all images without dimensions**

Run a search to find all `<img>` tags missing width/height. Based on PageSpeed report, these need fixing:

```
/img/faq.svg          → HomeScreen or FAQ page
/img/logo_cofa_tips.svg → CofaTips screen
/img/cvs.svg          → CVS folder or HomeScreen
/img/ssn-logo.svg     → Footer (99.5 KiB — also oversized)
/Logo.svg             → Multiple pages (header/logo)
/img/footer-fintech.webp → Footer
/img/Transparencia.webp  → Footer
/img/footer-datafiscal.webp → Footer
/img/footer-financieros.webp → Footer
/img/footer-aaip.webp   → Footer
```

- [ ] **Step 2: Add explicit width/height to each img**

For each `<img>` tag, add the native width and height attributes:

```jsx
// ANTES
<img src="/img/faq.svg" alt="preguntas-frecuentes">

// DESPUÉS — dimensions from actual image file metadata
<img src="/img/faq.svg" alt="preguntas-frecuentes" width="64" height="64">
```

For the Footer images (all .webp files), check actual dimensions and add accordingly. For SVG files, open the file and read the `viewBox` or `width/height` attributes.

> **Note:** Adding `aspect-ratio` CSS is an alternative for responsive images:
> ```css
> img { aspect-ratio: attr(width) / attr(height); }
> ```
> But native `width`/`height` attributes have better browser support for preventing CLS.

- [ ] **Step 3: Special case — ssn-logo.svg (99.5 KiB)**

This SVG file is 99.5 KiB — extremely large for a logo. Check if it can be:
- Compressed with SVGO or similar
- Replaced with a smaller version
- Loaded lazily since it's below-the-fold

```jsx
<img src="/img/ssn-logo.svg" alt="logo ssn" width="120" height="40" loading="lazy" decoding="async">
```

- [ ] **Step 4: Verify CLS improvement**

Run PageSpeed Insights after fixing — CLS score should improve from "Sin puntuación" to a passing grade.

---

## Task 8: Unused CSS Audit (11 KiB savings)

**Files:**
- Modify: `src/` (styles files)
- Note: This task may require adding a CSS purge tool or manual cleanup

**Source:** PageSpeed reports 11.3 KiB of unused CSS in `index-d8655443.css`. This could be:
- Utility classes from a CSS framework (Tailwind, Bootstrap) that aren't used
- Old component styles from removed features
- Third-party library CSS not fully utilized

- [ ] **Step 1: Analyze what CSS is unused**

Use a tool like:
- **CSS Coverage** in Chrome DevTools (F12 → ... → More Tools → Coverage)
- `npx purgecss` with glob pattern of your JSX/CSS files

```bash
# Example with purgecss
npx purgecss --css src/**/*.css --js src/**/*.{js,jsx} --output dist/purged/
```

- [ ] **Step 2: Identify the source of unused CSS**

Check `vite.config.js` — are you importing a CSS framework like Tailwind or a component library? If so, check the import in `index.html` or `main.jsx` for unused modules.

If using Tailwind CSS, ensure `content` array in `tailwind.config.js` covers all your source files:

```js
content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
```

- [ ] **Step 3: Manual cleanup (if no purge tool)**

If the unused CSS is from a known source (e.g., old component styles), manually remove:
- Unused CSS files from imports
- Orphaned class names from component files
- Old screen/component styles no longer imported

## Verification

1. **`npm run build`** — compiles without errors, multiple JS chunks in `dist/assets/`
2. **`npm run dev`** — all routes load without errors
3. Chrome DevTools Network — verify:
   - Initial bundle < 200KB (vendor chunks load on demand)
   - Images have `loading=lazy` and explicit `width`/`height` attributes
   - Fonts load with `display=swap`
   - Videos use `preload=metadata`
4. Chrome DevTools Coverage — verify CSS usage > 90% after Task 8
5. PageSpeed Insights mobile — target LCP < 2.5s, INP < 200ms, CLS < 0.1
6. Structured data — use Google Rich Results Test on built `dist/index.html`

---

## Notes

- **Orden:** Tasks 1-5 dan el mayor impacto con menor riesgo. Hacerlos en orden.
- **PageSpeed data** fue truncado. Ejecutar PageSpeed nuevamente después de Tasks 1-4 para obtener métricas actualizadas.
- **Simulator tasks** (React.memo, jspdf lazy-load, state refactor) están en `docs/superpowers/plans/2026-05-14-optimizacion-simulador.md`.
- **Task 7 (Image Dimensions)** es crítica para CLS — las 14 imágenes sin width/height son el problema principal de CLS.
- **Task 8 (CSS Audit)** es de menor prioridad — solo 11 KiB, hacer después de Tasks 1-7.
- **robots.txt** ya fue fixado (faltaba el archivo en Hostinger).