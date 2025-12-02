import en from "@/locales/en.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

const dictionaries = {
  en,
  es,
  pt,
};

export const getDictionary = (lang: string) => {
  return dictionaries[lang as keyof typeof dictionaries] ?? dictionaries.es;
};