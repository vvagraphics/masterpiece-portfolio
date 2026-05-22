# The Masterpiece Portfolio

An interactive, cinematic Single Page Application (SPA) built to serve as a digital museum of my evolution from early web customization to modern Full Stack Development and UI/UX Design.

## 🎯 The Vision

To move beyond the standard "corporate dashboard" portfolio and resurrect the era where a website was an interactive canvas. The application seamlessly fuses high-end graphic design, modern frontend architecture, and interactive physics simulations.

## 🏗️ Architecture & Tech Stack

- **Framework:** React + Vite
- **Language:** TypeScript
- **Animation & Physics:** GSAP (GreenSock Animation Platform) + HTML5 Canvas (`WebGL` / `2D`)
- **Structure:** Isolated Sandbox Architecture. The SPA acts as a wrapper, containing historic web projects within secure, isolated DOM environments to prevent code conflicts while maintaining a cinematic flow.

## 🚀 Execution Phases (Current Roadmap)

### Phase 1: The Liquid Preloader (In Progress)

- A custom 2D fluid simulation built directly on the HTML5 Canvas.
- **Mechanic:** Mouse movements generate sine-wave ripples using mathematical wave propagation.
- **The Transition:** A click triggers a kinetic "bucket splash" event—a massive velocity spike that displaces the pixel data of the canvas, physically washing the screen away to reveal the inner site.

### Phase 2: The Cinematic Timeline (Pending)

- A scroll-driven narrative timeline powered by GSAP.
- Maps the evolution of my design and coding journey (MySpace customization -> Graphic Design -> UI/UX -> Full Stack).
- Culminates in a high-performance, interactive reveal of the "EFANDERSON" masterpiece logo.

### Phase 3: The Interactive Museum & Sandbox (Pending)

- Mounting classic "ahead-of-their-time" interactive sites (e.g., sliding glass walls, digital graffiti) into isolated components.
- Users can create their own signatures/art within these sandboxes and save them to a global database, creating a curated "Inspiration Gallery" for future visitors.

## 🧠 Engineering Notes

- **Performance:** Canvas calculations are bound to `requestAnimationFrame` to ensure 60FPS fluid dynamics without blocking the React main thread.
- **State Management:** Global state machine handles the strict progression of `PRELOADER` -> `STORY` -> `PLAYGROUND`.
# masterpiece-portfolio
