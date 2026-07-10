"use client";

import { useReducer } from "react";

export type TipoProyecto =
  | "web_inmobiliaria"
  | "app_gestion"
  | "web_corporativa"
  | "agencia"
  | "otro";

export type EstadoIdea = "solo_idea" | "tengo_disenos" | "tengo_web";

export type Presupuesto =
  | "200_400"
  | "400_1000"
  | "1000_3000"
  | "3000_plus"
  | "a_conversar";

export type TipoTercerizado =
  | "landings"
  | "webs_completas"
  | "sistemas"
  | "varios";

export type FrecuenciaProyectos = "puntual" | "mensual" | "constante";

export type ContactFormStep = 1 | 2 | 3;

export type ContactFormState = {
  step: ContactFormStep;
  tipo_proyecto?: TipoProyecto;
  estado_idea?: EstadoIdea;
  presupuesto?: Presupuesto;
  tipo_tercerizado?: TipoTercerizado;
  frecuencia_proyectos?: FrecuenciaProyectos;
  nombre: string;
  email: string;
  whatsapp: string;
  mensaje: string;
  link_referencia: string;
  prefiere_whatsapp: boolean;
  honeypot: string;
};

const initialState: ContactFormState = {
  step: 1,
  nombre: "",
  email: "",
  whatsapp: "",
  mensaje: "",
  link_referencia: "",
  prefiere_whatsapp: false,
  honeypot: "",
};

type Action =
  | { type: "SELECT_TIPO_PROYECTO"; value: TipoProyecto }
  | { type: "SET_FIELDS"; payload: Partial<ContactFormState> }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESET" };

function reducer(state: ContactFormState, action: Action): ContactFormState {
  switch (action.type) {
    case "SELECT_TIPO_PROYECTO":
      return { ...state, tipo_proyecto: action.value, step: 2 };
    case "SET_FIELDS":
      return { ...state, ...action.payload };
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, 3) as ContactFormStep };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1) as ContactFormStep };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useContactForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    selectTipoProyecto: (value: TipoProyecto) =>
      dispatch({ type: "SELECT_TIPO_PROYECTO", value }),
    setFields: (payload: Partial<ContactFormState>) =>
      dispatch({ type: "SET_FIELDS", payload }),
    next: () => dispatch({ type: "NEXT" }),
    back: () => dispatch({ type: "BACK" }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
