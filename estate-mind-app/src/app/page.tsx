import HomeHero from "@/components/home/HomeHero";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import AboutEstateMind from "@/components/home/AboutEstateMind";
import LatestInsights from "@/components/home/LatestInsights";

import { propertyService } from "@/services/propertyService";
import { Property } from "@/types/property";

export default async function Home() {
  let featuredProperties: Property[] = [];
  let totalProperties: number | undefined;

  try {
    const data = await propertyService.getProperties({
      page: 1,
      size: 3,
    });

    featuredProperties = data.items;
    totalProperties = data.totalElements;
  } catch {
    featuredProperties = [];
  }

  return (
    <>
      <HomeHero />
      <FeaturedProjects properties={featuredProperties} />
      <AboutEstateMind propertyCount={totalProperties} />
      <LatestInsights />
    </>
  );
}
