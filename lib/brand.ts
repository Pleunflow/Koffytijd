// Het merk is configuratie, geen hardcoded waarde. Kies met BRAND=toppy|heuts.
// Kleuren komen uit de tokens in app/globals.css; een merk kan ze later overschrijven.

export type BrandId = "toppy" | "heuts";

export type Brand = {
  id: BrandId;
  /** Naam van het bedrijf, bv. in de paginatitel en meta-omschrijving. */
  companyName: string;
  appName: string;
};

const BRANDS: Record<BrandId, Brand> = {
  toppy: { id: "toppy", companyName: "Toppy", appName: "Koffytijd" },
  heuts: { id: "heuts", companyName: "Heuts", appName: "Koffytijd" },
};

export function getBrand(): Brand {
  const id = (process.env.BRAND ?? "toppy") as BrandId;
  return BRANDS[id] ?? BRANDS.toppy;
}
