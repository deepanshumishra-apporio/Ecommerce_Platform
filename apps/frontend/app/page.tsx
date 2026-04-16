import AnnouncementBar from "../components/AnnouncementBar";
import Hero from "../components/Hero";
import CategoryScroller from "../components/CategoryScroller";
import ProductSection from "../components/ProductSection";
import PromoBanner from "../components/PromoBanner";
import CelebritySection from "../components/CelebritySection";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Hero />
      <CategoryScroller />
      <ProductSection />
      <PromoBanner />
      <CelebritySection />
      <Newsletter />
      <Footer />
    </>
  );
}
