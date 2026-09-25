"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MegaphoneIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { Header } from "./header";
import type { OfficeOption } from "./home-screen";
import { Card, FieldLabel, PillChip } from "./parts";

/**
 * AUTH_MODE=local: bij het eerste bezoek kies je je kantoor en vul je je naam in.
 * (Later komt de naam uit Google SSO en blijft alleen de kantoorkiezer over.)
 */
export function Onboarding({ offices }: { offices: OfficeOption[] }) {
  const router = useRouter();
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = !!officeId && name.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      await api.signIn(name.trim(), officeId);
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onHome={() => {}} round={null} />
      <main className="mx-auto w-full max-w-[1060px] flex-1 px-7 pt-10 pb-16">
        <div className="mx-auto mt-6 max-w-[620px] animate-kt-rise text-center">
          <div className="mb-[22px] inline-flex size-[76px] -rotate-3 items-center justify-center rounded-hero bg-toppy-yellow text-toppy-ink shadow-yellow-icon">
            <MegaphoneIcon size={38} />
          </div>
          <h1 className="mb-3.5 text-[52px] leading-[1.05] font-bold text-balance">
            Welkom bij
            <br />
            <span className="mt-1.5 inline-block -rotate-2 rounded-[5px] bg-toppy-yellow px-4 py-0.5 text-toppy-ink">
              Koffytijd
            </span>
          </h1>
          <p className="mx-auto mb-[30px] max-w-[440px] text-[17px] leading-[1.55] text-toppy-grey-darker">
            Kies je kantoor en vul je naam in. Dan kun je Koffytijd roepen of meedoen als een
            collega roept.
          </p>

          <form onSubmit={submit}>
            <Card className="px-6 py-[26px] text-left">
              <FieldLabel>Voor welk kantoor?</FieldLabel>
              <div className="mb-[18px] flex flex-wrap gap-2.5">
                {offices.map((o) => (
                  <PillChip
                    key={o.id}
                    selected={o.id === officeId}
                    onClick={() => setOfficeId(o.id)}
                  >
                    {o.heartEmoji} {o.name}
                  </PillChip>
                ))}
              </div>
              <label>
                <FieldLabel>Jouw naam</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Sanne"
                  maxLength={40}
                  autoComplete="given-name"
                  className="mb-[18px] w-full rounded-md border-2 border-toppy-grey-light px-4 py-3.5 text-[17px] focus:border-toppy-ink focus:shadow-focus focus:outline-none"
                />
              </label>
              <Button type="submit" size="lg" fullWidth disabled={!ready || busy}>
                Aan de slag
              </Button>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}
