import type { ComponentType, SVGProps } from "react";

import {
  InstagramIcon,
  LinkIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/social-icons";

export type SocialLink = {
  id: "whatsapp" | "instagram" | "tiktok";
  label: string;
  /** O que aparece na coluna de contato — número formatado ou @. */
  handle: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Telefone em E.164, sem máscara — usado no link do WhatsApp. */
const WHATSAPP_E164 = "5521964927702";

export const WHATSAPP_DISPLAY = "(21) 96492-7702";

export const socialLinks: SocialLink[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    handle: WHATSAPP_DISPLAY,
    href: `https://wa.me/${WHATSAPP_E164}`,
    Icon: WhatsAppIcon,
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@eumajal",
    href: "https://instagram.com/eumajal",
    Icon: InstagramIcon,
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@eumajal",
    href: "https://tiktok.com/@eumajal",
    Icon: TikTokIcon,
  },
];

/**
 * Página de links do Jamal (Banlek) — reúne tudo num lugar só.
 * Fica fora de `socialLinks` porque não é uma rede: não entra na coluna de
 * contato nem no FAB, só no atalho abaixo dos ícones de rede.
 */
export const linkHub = {
  label: "Todos os links",
  handle: "banlek.com/jamal",
  href: "https://banlek.com/jamal",
  Icon: LinkIcon,
};
