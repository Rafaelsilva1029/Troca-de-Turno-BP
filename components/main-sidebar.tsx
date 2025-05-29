import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Calendar,
  ShoppingBag,
  PieChart,
  KanbanSquare,
  ListChecks,
  BarChart4,
  HelpCircle,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertTriangle,
  PackageCheck,
  type LucideIcon,
  Microscope,
  MapPin,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Analytics and reports overview",
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    description: "Manage user accounts and permissions",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Generate custom reports",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Schedule and manage events",
  },
  {
    title: "Products",
    href: "/products",
    icon: ShoppingBag,
    description: "Manage product inventory and sales",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: PieChart,
    description: "Track key performance indicators",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: KanbanSquare,
    description: "Manage project tasks and deadlines",
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListChecks,
    description: "Manage personal and team tasks",
  },
  {
    title: "Statistics",
    href: "/statistics",
    icon: BarChart4,
    description: "Visualize data with charts and graphs",
  },
  {
    title: "IA Ultra-Avançada",
    href: "/ia-ultra-avancada",
    icon: Microscope,
    badge: "ULTRA",
    description: "Sistema de Computer Vision + Deep Learning para extração perfeita",
  },
  {
    title: "Equipamentos Localização",
    href: "/dashboard/equipamentos-localizacao", // Caminho corrigido
    icon: MapPin,
    description: "Localização e status dos equipamentos em campo",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configure application settings",
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
    description: "Access documentation and support",
  },
  {
    title: "Login",
    href: "/login",
    icon: LogIn,
    description: "Access your account",
  },
  {
    title: "Register",
    href: "/register",
    icon: UserPlus,
    description: "Create a new account",
  },
  {
    title: "View",
    href: "/view",
    icon: Eye,
    description: "View content",
  },
  {
    title: "Hide",
    href: "/hide",
    icon: EyeOff,
    description: "Hide content",
  },
  {
    title: "Warning",
    href: "/warning",
    icon: AlertTriangle,
    description: "Warning message",
  },
  {
    title: "Packages",
    href: "/packages",
    icon: PackageCheck,
    description: "Packages",
  },
]
