import { describe, expect, it } from "vitest";
import {
  drinkPhrase,
  DrinkChoiceSchema,
  orderTags,
  orderTitle,
  shoppingList,
  usualLabel,
} from "@/lib/menu";

describe("DrinkChoiceSchema", () => {
  it("accepteert geldige keuzes", () => {
    for (const c of [
      { drinkType: "koffie", drink: "Cappuccino", option: "Sterk" },
      { drinkType: "koffie", drink: "Thee", option: "Iets fruitigs" },
      { drinkType: "koffie", drink: "Warme choco", option: "" },
      { drinkType: "water", drink: "Limoen", option: "Subtiel" },
      { drinkType: "water", drink: "Gewoon water", option: "" },
      { drinkType: "skip" },
    ]) {
      expect(DrinkChoiceSchema.safeParse(c).success, JSON.stringify(c)).toBe(true);
    }
  });

  it("weigert opties die niet bij het drankje horen", () => {
    for (const c of [
      { drinkType: "koffie", drink: "Cappuccino", option: "Earl Grey" },
      { drinkType: "koffie", drink: "Thee", option: "Sterk" },
      { drinkType: "koffie", drink: "Warme choco", option: "Sterk" },
      { drinkType: "koffie", drink: "Bier", option: "Normaal" },
      { drinkType: "water", drink: "Limoen", option: "Mild" },
      { drinkType: "water", drink: "Limoen", option: "" },
      { drinkType: "water", drink: "Gewoon water", option: "Sterk" },
    ]) {
      expect(DrinkChoiceSchema.safeParse(c).success, JSON.stringify(c)).toBe(false);
    }
  });
});

describe("labels", () => {
  it("toont titels en tags zoals het prototype", () => {
    expect(orderTitle({ drinkType: "koffie", drink: "Espresso", option: "Sterk" })).toEqual({
      emoji: "⚡",
      title: "Espresso",
    });
    expect(orderTags({ drinkType: "koffie", drink: "Thee", option: "Earl Grey" })).toEqual([
      "🫖 Earl Grey",
    ]);
    expect(orderTags({ drinkType: "water", drink: "Limoen", option: "Subtiel" })).toEqual([
      "🍋 Limoen",
      "💧 Subtiel",
    ]);
    expect(orderTitle({ drinkType: "skip", drink: "", option: "" }).title).toBe(
      "Slaat 'n beurtje over",
    );
  });

  it("groepeert het boodschappenlijstje per drankje en slaat overslaan over", () => {
    expect(
      shoppingList([
        { drinkType: "koffie", drink: "Cappuccino", option: "Mild" },
        { drinkType: "koffie", drink: "Cappuccino", option: "Sterk" },
        { drinkType: "water", drink: "Limoen", option: "Normaal" },
        { drinkType: "skip", drink: "", option: "" },
      ]),
    ).toEqual([
      { label: "☕ Cappuccino", count: 2 },
      { label: "💧 Water — Limoen", count: 1 },
    ]);
  });

  it("maakt het label van de vaste bestelling", () => {
    expect(usualLabel({ drinkType: "koffie", drink: "Cappuccino", option: "Normaal" })).toBe(
      "Cappuccino · Normaal",
    );
    expect(usualLabel({ drinkType: "water", drink: "Limoen", option: "Sterk" })).toBe(
      "Water — Limoen",
    );
  });
});

describe("gewoon water", () => {
  const plain = { drinkType: "water" as const, drink: "Gewoon water", option: "" };
  it("heeft een eigen titel, geen tags en een eigen regel op het boodschappenlijstje", () => {
    expect(orderTitle(plain)).toEqual({ emoji: "🚰", title: "Gewoon water" });
    expect(orderTags(plain)).toEqual([]);
    expect(shoppingList([plain, plain])).toEqual([{ label: "🚰 Gewoon water", count: 2 }]);
    expect(usualLabel(plain)).toBe("Gewoon water");
    expect(drinkPhrase(plain)).toBe("water");
  });
});
