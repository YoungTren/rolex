import { CraftsmanshipSection } from "@/components/craftsmanship-section";
import { ComponentsSection } from "@/components/components-section";
import { RolexScrollHero } from "@/components/rolex-scroll-hero";

export default function Home() {
  return (
    <main className="min-h-0 bg-black">
      <RolexScrollHero />
      <ComponentsSection />
      <CraftsmanshipSection />
    </main>
  );
}
