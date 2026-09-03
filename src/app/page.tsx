import About from "@/components/about/about";
import Footer from "@/components/footer/footer";
import Hero from "@/components/hero/hero";

export default function Home() {
  return (
    <main className="w-full bg-ink-900">
      <Hero />
      <About />
      <Footer />
    </main>
  );
}
