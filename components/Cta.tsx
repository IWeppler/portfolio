import { ButtonPrimary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";

export const Cta = ({ lang }: { lang: string }) => {
  const { cta } = getDictionary(lang);

  const whatsappUrl = "https://wa.me/5491154702118?text=Hola%20Ignacio,%20vengo%20de%20tu%20portfolio%20y%20me%20gustar%C3%ADa%20hablar%20sobre%20un%20proyecto.";

  return (
    <>
      <section id="contacto" className="w-full bg-background text-white md:px-20 py-32 border-t border-white/10 text-center">
        <p className="font-medium tracking-widest text-paragraph mb-2 uppercase">
          {cta.subtitle}
        </p>

        <h2 className="text-4xl md:text-7xl font-medium tracking-tight mb-10 uppercase">
          {cta.title}
        </h2>

        <ButtonPrimary href={whatsappUrl} target="_blank">
            {cta.cta}
        </ButtonPrimary>
      </section>
    </>
  );
};