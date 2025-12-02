import Image from "next/image";
import profile from "@/public/profile.jpeg";
import argentina from "@/public/argentina.avif";
import { ButtonPrimary, ButtonSecondary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";

export default function HeroSection({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  return (
    <section className="w-full min-h-[90dvh] bg-background flex items-end text-white mb-20">
      <div className="max-w-4xl w-full mb-12 md:mb-20">
        <p className="text-2xl md:text-4xl font-general text-cream font-medium leading-snug tracking-tight">
          {t.hero.part1}
          <Image
            src={profile}
            alt="Ignacio Weppler"
            className="inline-block w-16 h-12 rotate-2 object-contain align-middle mx-2"
            placeholder="blur"
          />
          {t.hero.part2}
          <Image
            src={argentina}
            alt="Ignacio Weppler - Argentina"
            className="inline-block w-16 h-12 -rotate-2 object-cover align-middle mx-2"
            placeholder="blur"
          />
          {t.hero.part3}
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 mt-8">
          <ButtonPrimary href={`/${lang}#contacto`}>{t.hero.cta_write}</ButtonPrimary>

          <ButtonSecondary href="#proyectos">{t.hero.cta_works}</ButtonSecondary>
        </div>
      </div>
    </section>
  );
}
