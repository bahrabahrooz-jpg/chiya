import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/layout";
import { Hero } from "./_home/hero";
import { FeaturedSection } from "./_home/featured-section";
import { Categories } from "./_home/categories";
import { Locations } from "./_home/locations";
import { WhyChiya } from "./_home/why-chiya";
import { FeaturedAgents } from "./_home/featured-agents";
import { Testimonials } from "./_home/testimonials";
import { PremiumCta } from "./_home/premium-cta";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <div className="cxk-container" id="properties">
          <FeaturedSection />
        </div>
        <div className="cxk-container">
          <Categories />
        </div>
        <div className="cxk-container">
          <Locations />
        </div>
        <WhyChiya />
        <div className="cxk-container" id="agents">
          <FeaturedAgents />
        </div>
        <Testimonials />
        <PremiumCta />
      </main>
      <Footer />
    </>
  );
}
