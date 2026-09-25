// De vier kantoren. `pnpm db:seed` zet ze in de database; de app leest ze daarna uit de db.
export const OFFICES = [
  { id: "rookhok", name: "Met uitzicht op het rookhok", heartEmoji: "❤️", sort: 1 },
  { id: "beneeeje", name: "Beneeeje", heartEmoji: "💛", sort: 2 },
  { id: "grote-ruimte", name: "De grooooote ruimte", heartEmoji: "💙", sort: 3 },
  { id: "heuts-enzo", name: "Heuts enzo", heartEmoji: "💚", sort: 4 },
] as const;
