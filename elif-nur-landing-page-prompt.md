**Build a premium, elegant single-page React + TypeScript landing website for Elif Nur Çiçekdağı Özcan using Vite, Tailwind CSS, Framer Motion, and Lucide React.**

**Project Name:** Elif Nur Çiçekdağı Özcan — Personal Website  
**Domain:** elifnurcicekdagi.com

### Overall Design Direction & Brand Identity
- **Tone:** Sophisticated, warm, worldly, feminine yet strong, adventurous, and cinematic.
- **Main Color Palette:**
  - Background: Deep warm dark (#0F0A05 or #11100F) with subtle terracotta accents.
  - Primary accent: Warm terracotta (#C25B3F), soft mustard (#D4A017), aviation midnight blue (#1E2A44), clean white/off-white (#F8F1E9), and soft sage green (#A8B5A2).
  - Text: Warm light (#F5EDE4) and deep warm gray (#8C7A6B).
- **Font:** Google Font **Kanit** (weights 300–900). Use for all headings and navigation. Pair with a clean sans-serif (Inter or system) for body text where needed.
- **Global Styles:**
  - `html, body, #root`: background #0F0A05, font-family 'Kanit', sans-serif.
  - Box-sizing: border-box, margin/padding reset.
  - Smooth scroll behavior.
  - Main wrapper: `overflow-x: clip`.

### Section Order
1. Hero Section  
2. Marquee / Travel Highlights  
3. About Section  
4. Experiences & Services  
5. Journey / Projects Gallery (Sticky Stacking Cards)  
6. Footer

### 1. HERO SECTION
- Full viewport height (`h-screen`), flex column, dark elegant atmosphere.
- **Navbar:** Transparent, fixed or sticky. Logo left: "Elif Nur" or full name in elegant Kanit. Right side links: About, Journeys, Experiences, Contact. Text color warm light, uppercase, tracking-wider, hover opacity-70 transition.
- **Hero Heading:** Massive "Hi, I’m Elif" (lowercase i, curly apostrophe). Use gradient text: `linear-gradient(180deg, #E8D5B8 0%, #F5EDE4 100%)` with `-webkit-background-clip: text`. Font-black, tracking-[-3px], leading-none. Sizes: `text-[13vw] sm:text-[14vw] md:text-[15vw] lg:text-[16.5vw]`.
- **Tagline:** "From cockpit views to city walks or the other way around." — elegant, warm light, font-light, tracking-wide, max-w-md.
- **Hero Portrait:** Centered, large magnetic photo of Elif (use the profile picture style from Instagram). Apply **Magnet** component (mouse-following effect, strength 3–4, padding 150).
- **Bottom Bar:** Left — short intro text. Right — elegant "Get in Touch" pill button with warm gradient.
- Use **FadeIn** animations with staggered delays for navbar, heading, tagline, portrait, and button.

### 2. MARQUEE SECTION (Travel Reel)
- Two horizontal scrolling marquees triggered by scroll position (like the Jack example).
- Use the 21 high-quality travel/lifestyle GIFs or images from her Instagram aesthetic (cockpit, Sardegna beaches, Vienna palaces, Greek islands, Costa, Hawaiian vibes, city walks, etc.).
- Row 1 scrolls right, Row 2 scrolls left.
- Image size: ~420×270px, rounded-3xl, heavy shadows, object-cover.
- Background: deep warm dark with subtle texture.

### 3. ABOUT SECTION
- `min-h-screen`, centered content.
- Decorative floating elements in corners (airplane silhouette, moon, camera/lens icon, suitcase or travel-related elegant 3D-style assets in soft terracotta/sage tones).
- Heading: "About Me" with the same gradient style as hero.
- Animated paragraph (character-by-character scroll reveal using **AnimatedText** component):
  > "With more than five years as a First Officer and a lifelong passion for exploration, I capture the world from 35,000 feet and on the ground. I believe in the beauty of contrast — discipline in the cockpit and freedom in discovery. Let’s create meaningful memories together."

- Below: Elegant "View My Journeys" or "Contact Me" button.

### 4. EXPERIENCES & SERVICES SECTION
- Light warm background (#F8F1E9) with rounded top corners.
- Heading "Experiences" in deep dark text.
- Vertical list of 5 items (01–05) with elegant dividers:
  01. Airline Pilot (First Officer)  
  02. Travel Content Creation & Photography  
  03. Destination Guides & City Walks  
  04. Lifestyle & Luxury Travel Consulting  
  05. Aviation & Adventure Storytelling

Each item: Large number (left), title + warm descriptive text (right).

### 5. JOURNEY / PROJECTS SECTION
- Dark background, rounded top, pulled up with negative margin.
- Heading: "Journeys" (gradient text).
- Three sticky-stacking project cards with scale-down effect on scroll (Framer Motion `useScroll` + `useTransform`).
- Each card represents a major travel chapter:
  - **Sardegna Escape** (Italy)
  - **Hellas & Aegean** (Greece)
  - **Vienna & Central Europe** / **Hawaii 2025** / **Andalusia** (choose the strongest visuals)

Card layout (same as Jack spec):
- Top: Number + Category + Project Name + "View Gallery" ghost button
- Bottom: Two-column image grid (left: 2 stacked images, right: 1 tall image)
- Use real high-quality images from her Instagram (cockpit, couple photos, architecture, nature, etc.). Provide placeholder CloudFront-style URLs or direct image links where possible.

### REUSABLE COMPONENTS (same quality as Jack spec)
- **ContactButton**: Warm elegant pill with terracotta-to-mustard gradient, soft shadow, white text.
- **LiveProjectButton** / **ViewGalleryButton**: Ghost outline style with warm borders.
- **FadeIn**: Framer Motion wrapper (delay, x, y, duration props).
- **Magnet**: Mouse magnetic hover effect.
- **AnimatedText**: Character-by-character scroll-driven opacity animation.

### Technical Requirements
- React 18 + TypeScript + Vite
- Tailwind CSS 3.4+
- Framer Motion ^12
- Lucide React icons
- Responsive: Mobile-first, heavy use of `clamp()` for fluid typography.
- Performance: `will-change`, lazy loading, passive scroll listeners.
- Dark/warm elegant aesthetic throughout with smooth transitions.

**Deliverables:**
- Complete, clean, well-commented codebase.
- All sections fully responsive and animated.
- Ready to deploy on Vercel/Netlify.

**Extra Tip for Cursor:** After generating the first version, you can follow up with specific refinement prompts like “Make the color palette warmer with more terracotta accents” or “Improve the sticky card stacking animation” or “Replace placeholder images with these specific URLs”.

Make this website feel luxurious, cinematic, and deeply personal — reflecting a confident female pilot who lives between the sky and the most beautiful places on Earth.
