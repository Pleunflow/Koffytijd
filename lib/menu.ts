import { z } from "zod";

// Alle drankjes en opties, letterlijk uit de handoff. Gedeeld door client en server.

export const COFFEES = [
  { name: "'n Gewone", emoji: "☕" },
  { name: "Espresso", emoji: "⚡" },
  { name: "Cappuccino", emoji: "☕" },
  { name: "Latte macchiato", emoji: "🥛" },
  { name: "Warme choco", emoji: "🍫" },
  { name: "Thee", emoji: "🍵" },
] as const;

export const COFFEE_STRENGTHS = [
  { name: "Mild", emoji: "😌" },
  { name: "Normaal", emoji: "🙂" },
  { name: "Sterk", emoji: "💪" },
] as const;

export const TEA_FLAVORS = [
  { name: "Earl Grey", emoji: "🫖" },
  { name: "Iets fruitigs", emoji: "🍓" },
  { name: "Iets groenigs", emoji: "🌿" },
] as const;

export const WATER_FLAVORS = [
  { name: "Bosbes", emoji: "🫐" },
  { name: "IJsthee perzik", emoji: "🍑" },
  { name: "Ananas", emoji: "🍍" },
  { name: "Limoen", emoji: "🍋" },
  { name: "Groene thee", emoji: "🍵" },
  { name: "Mango passievrucht", emoji: "🥭" },
] as const;

export const WATER_STRENGTHS = [
  { name: "Subtiel", emoji: "💧" },
  { name: "Normaal", emoji: "🙂" },
  { name: "Sterk", emoji: "💪" },
] as const;

/** Gewoon water: een water-bestelling zonder smaakje en zonder sterkte. */
export const PLAIN_WATER = "Gewoon water";
export const PLAIN_WATER_EMOJI = "🚰";

export function isPlainWater(o: { drinkType: string; drink: string }) {
  return o.drinkType === "water" && o.drink === PLAIN_WATER;
}

export const DEFAULT_COFFEE_STRENGTH = "Normaal";
export const DEFAULT_TEA_FLAVOR = "Earl Grey";
export const DEFAULT_WATER_STRENGTH = "Normaal";

type Named = readonly { name: string; emoji: string }[];
const names = (list: Named) => list.map((i) => i.name);
const emojiOf = (list: Named, name: string) => list.find((i) => i.name === name)?.emoji ?? "";

/** Welke vervolgvraag hoort bij een koffie-drankje. */
export function coffeeFollowUp(drink: string): "strength" | "tea" | "none" {
  if (drink === "Thee") return "tea";
  if (drink === "Warme choco") return "none";
  return "strength";
}

export type DrinkChoice =
  | { drinkType: "koffie"; drink: string; option: string }
  | { drinkType: "water"; drink: string; option: string }
  | { drinkType: "skip"; drink: ""; option: "" };

/**
 * `option` hangt af van het drankje: de sterkte (koffie), het smaakje (thee)
 * of de sterkte (water). Het smaakje van water staat in `drink`.
 * Gewoon water: drink = "Gewoon water", option = "".
 */
export const DrinkChoiceSchema = z
  .discriminatedUnion("drinkType", [
    z.object({
      drinkType: z.literal("koffie"),
      drink: z.enum(names(COFFEES) as [string, ...string[]]),
      option: z.string(),
    }),
    z.object({
      drinkType: z.literal("water"),
      drink: z.enum([PLAIN_WATER, ...names(WATER_FLAVORS)] as [string, ...string[]]),
      option: z.string(),
    }),
    z.object({
      drinkType: z.literal("skip"),
      drink: z.literal("").default(""),
      option: z.literal("").default(""),
    }),
  ])
  .superRefine((v, ctx) => {
    if (v.drinkType === "skip") return;
    let allowed: string[];
    if (v.drinkType === "water") {
      allowed = v.drink === PLAIN_WATER ? [""] : names(WATER_STRENGTHS);
    } else {
      const follow = coffeeFollowUp(v.drink);
      allowed =
        follow === "strength"
          ? names(COFFEE_STRENGTHS)
          : follow === "tea"
            ? names(TEA_FLAVORS)
            : [""];
    }
    if (!allowed.includes(v.option)) {
      ctx.addIssue({
        code: "custom",
        path: ["option"],
        message: "Ongeldige optie voor dit drankje",
      });
    }
  }) as unknown as z.ZodType<DrinkChoice>;

export type OrderLike = { drinkType: "koffie" | "water" | "skip"; drink: string; option: string };

/** Titel van een bestelling, bv. "☕ Cappuccino" of "💧 Water met smaakje". */
export function orderTitle(o: OrderLike): { emoji: string; title: string } {
  if (o.drinkType === "skip") return { emoji: "🙅", title: "Slaat 'n beurtje over" };
  if (o.drinkType === "koffie") return { emoji: emojiOf(COFFEES, o.drink) || "☕", title: o.drink };
  if (isPlainWater(o)) return { emoji: PLAIN_WATER_EMOJI, title: PLAIN_WATER };
  return { emoji: "💧", title: "Water met smaakje" };
}

/** Label-pills onder de titel. */
export function orderTags(o: OrderLike): string[] {
  if (o.drinkType === "skip") return [];
  if (o.drinkType === "koffie") {
    if (!o.option) return [];
    const list = coffeeFollowUp(o.drink) === "tea" ? TEA_FLAVORS : COFFEE_STRENGTHS;
    return [`${emojiOf(list, o.option)} ${o.option}`.trim()];
  }
  if (isPlainWater(o)) return [];
  return [
    `${emojiOf(WATER_FLAVORS, o.drink)} ${o.drink}`.trim(),
    `${emojiOf(WATER_STRENGTHS, o.option)} ${o.option}`.trim(),
  ];
}

/** Regel op het boodschappenlijstje, bv. "☕ Cappuccino" of "💧 Water — Limoen". */
export function shoppingLabel(o: OrderLike): string | null {
  if (o.drinkType === "skip") return null;
  if (o.drinkType === "koffie") return `${emojiOf(COFFEES, o.drink) || "☕"} ${o.drink}`;
  if (isPlainWater(o)) return `${PLAIN_WATER_EMOJI} ${PLAIN_WATER}`;
  return `💧 Water — ${o.drink}`;
}

export function shoppingList(orders: OrderLike[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const label = shoppingLabel(o);
    if (label) map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count }));
}

/** Label van de vaste bestelling, bv. "Cappuccino · Normaal" of "Water — Limoen". */
export function usualLabel(o: OrderLike): string {
  if (isPlainWater(o)) return PLAIN_WATER;
  if (o.drinkType === "water") return `Water — ${o.drink}`;
  return o.option ? `${o.drink} · ${o.option}` : o.drink;
}

/** Voor "{haler} neemt je {drankje} mee." */
export function drinkPhrase(o: OrderLike): string {
  if (isPlainWater(o)) return "water";
  if (o.drinkType === "water") return `water met ${o.drink.toLowerCase()}`;
  return o.drink;
}
