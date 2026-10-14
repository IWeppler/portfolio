import { getDictionary } from "@/lib/get-dictionary";
import { ScrollRevealText } from "./ui/ScrollRevealText";
import { Reveal } from "./ui/Reveal";

type Metric = { value: string; label: string };

export const About = ({ lang }: { lang: string }) => {
  const { aboutme } = getDictionary(lang);
  const metrics = aboutme.metrics as Metric[];

  return (
    <section id="sobremi" className="w-full py-24 text-foreground md:py-40">
      <p className="label mb-8 text-orange md:mb-10">({aboutme.label})</p>

      <ScrollRevealText
        text={aboutme.statement}
        accent={aboutme.accent}
        className="font-semibold text-manifesto md:max-w-[28ch]"
      />

      <dl className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 md:mt-28 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <Reveal key={metric.label} delay={index * 70} className="flex flex-col-reverse gap-2">
            <dt className="label text-paragraph">{metric.label}</dt>
            <dd className="text-title font-medium tabular-nums">{metric.value}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
};
