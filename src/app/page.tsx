import { CraftsmanshipSection } from "@/components/craftsmanship-section";
import { ComponentsSection } from "@/components/components-section";
import { RolexBoutiqueScrollSection } from "@/components/rolex-boutique-scroll-section";
import { RolexScrollHero } from "@/components/rolex-scroll-hero";
import { ScrollOrbitSection } from "@/components/scroll-orbit-section";

export default function Home() {
  return (
    <main className="min-h-0 bg-black">
      <RolexScrollHero />
      <ComponentsSection />
      <CraftsmanshipSection />
      <ScrollOrbitSection />
      <RolexBoutiqueScrollSection />
    </main>
  );
}
