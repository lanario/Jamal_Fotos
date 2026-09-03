export type NavItem = {
  /** Id da seção observada na home (sem `#`); rotas não têm. */
  section?: string;
  label: string;
  /** Versão curta para as abas do desktop, onde o espaço é apertado. */
  short?: string;
  href: string;
};

/**
 * Fonte única da navegação — usada pela navbar (desktop e mobile) e pelo
 * rodapé. Âncoras vão prefixadas com `/` para funcionarem também a partir
 * de /portfolio.
 */
export const navItems: NavItem[] = [
  { label: "Início", href: "/#topo", section: "topo" },
  { label: "Sobre", href: "/#sobre", section: "sobre" },
  { label: "Portfólio", href: "/portfolio" },
  { label: "Redes sociais", short: "Redes", href: "/#contato", section: "contato" },
];
