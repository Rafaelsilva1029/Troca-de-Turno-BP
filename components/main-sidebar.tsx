import { LayoutDashboard, Settings, User, Users, Package, ShoppingCart, MapPin } from "lucide-react"

export const MainSidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral do sistema",
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: Users,
    description: "Gerenciamento de usuários",
  },
  {
    title: "Perfil",
    href: "/perfil",
    icon: User,
    description: "Informações do seu perfil",
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
    description: "Gerenciamento de produtos",
  },
  {
    title: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    description: "Acompanhamento de pedidos",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    description: "Ajustes gerais do sistema",
  },
  {
    title: "Equipamentos Localização",
    href: "/equipamentos-localizacao",
    icon: MapPin,
    description: "Controle de localização dos equipamentos",
  },
]
