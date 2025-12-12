import { StaticImageData } from "next/image";

import atleticotostado from "@/public/atleticotostado.webp";
import atleticotostado2 from "@/public/atleticotostado2.webp";
import atleticotostado3 from "@/public/atleticotostado3.webp";
import workmanantial1 from "@/public/workmanantial1.png";
import inmobiliaria1 from "@/public/inmobiliaria1.webp";
import inmobiliaria2 from "@/public/inmobiliaria2.png";
import mockupnivo1 from "@/public/mockupnivo1.png";
import mockupnivo2 from "@/public/mockupnivo2.png";
import figmanivo from "@/public/figmanivo.webp";
import checanchab from "@/public/checanchab.webp";
import checanchac from "@/public/checanchac.webp";
import bikecomerce from "@/public/bikecomerce.png";
import bikecomerceb from "@/public/bikecomerceb.png";
import bikecomercec from "@/public/bikecomercec.png";
import mockupreddittobooks from "@/public/mockupreddittobooks.jpg";
import reddittobooksbanner from "@/public/reddittobooksbanner.webp";
import mockupinaqui from "@/public/mockupinaqui.png";
import maininaqui from "@/public/maininaqui.jpg";
import mockinaqui2 from "@/public/mockinaqui2.jpg";

export interface ProjectImages {
  img1: StaticImageData;
  img2?: StaticImageData;
  img3?: StaticImageData;
  cover?: StaticImageData;
}

export const imageMap: Record<string, ProjectImages> = {
  proyecto1: { img1: workmanantial1, cover: workmanantial1 },
  proyecto2: { img1: inmobiliaria1, img2: inmobiliaria2, cover: inmobiliaria1 },
  proyecto3: { img1: checanchab, img2: checanchac, cover: checanchab },
  proyecto4: {
    img1: atleticotostado2,
    img2: atleticotostado3,
    cover: atleticotostado,
  },
  proyecto5: { img1: bikecomerce, img2: bikecomerceb, img3: bikecomercec, cover: bikecomerce },
  proyecto6: {
    img1: mockupnivo1,
    img2: mockupnivo2,
    img3: figmanivo,
    cover: mockupnivo1,
  },
  proyecto7: {
    img1: reddittobooksbanner,
    img2: mockupreddittobooks,
    cover: mockupreddittobooks,
  },
  proyecto8: { img1: maininaqui, img2: mockinaqui2, cover: mockupinaqui },
};
