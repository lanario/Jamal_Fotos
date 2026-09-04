import About from "@/components/about/about";
import Footer from "@/components/footer/footer";
import Hero from "@/components/hero/hero";
import EventsPreview from "@/components/portfolio/events-preview";

export default function Home() {
  return (
    <main className="w-full bg-ink-900">
      <Hero />
      <About />
      <EventsPreview />
      <Footer />
    </main>
  );
}
