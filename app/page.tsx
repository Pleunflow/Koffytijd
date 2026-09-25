import { getDb } from "@/db";
import { KoffyApp } from "@/components/koffy/koffy-app";
import { Onboarding } from "@/components/koffy/onboarding";
import { getCurrentUser } from "@/lib/auth";
import { listOffices } from "@/lib/koffy";

// Altijd per verzoek renderen: de pagina hangt af van je login-cookie.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [me, offices] = await Promise.all([getCurrentUser(), listOffices(getDb())]);
  const options = offices.map(({ id, name, heartEmoji }) => ({ id, name, heartEmoji }));

  if (!me) return <Onboarding offices={options} />;
  return <KoffyApp offices={options} initialOfficeId={me.officeId} />;
}
