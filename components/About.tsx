import { getDictionary } from "@/lib/get-dictionary";
import { ScrollRevealText } from "./ui/ScrollRevealText";

export const About = ({ lang }: { lang: string }) => {
  const { aboutme } = getDictionary(lang);

  return (
    <section id="sobremi" className="w-full py-24 text-foreground md:py-40">
      <p className="label mb-8 text-orange md:mb-10">({aboutme.label})</p>

      <ScrollRevealText
        text={aboutme.statement}
        accent={aboutme.accent}
        className="font-semibold text-manifesto md:max-w-[28ch]"
      />
    </section>
  );
};
