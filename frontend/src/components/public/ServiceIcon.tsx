import {
  BarChart3,
  Camera,
  Code2,
  Cpu,
  Globe2,
  Layers,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Palette,
  PenTool,
  Rocket,
  Search,
  Share2,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Video,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** iconKey values the backend stores on services, mapped to lucide icons. */
const ICONS: Record<string, LucideIcon> = {
  code: Code2,
  megaphone: Megaphone,
  palette: Palette,
  camera: Camera,
  video: Video,
  globe: Globe2,
  smartphone: Smartphone,
  shopping: ShoppingCart,
  search: Search,
  "pen-tool": PenTool,
  "bar-chart": BarChart3,
  zap: Zap,
  layers: Layers,
  rocket: Rocket,
  lightbulb: Lightbulb,
  cpu: Cpu,
  share: Share2,
  message: MessageCircle,
  volume: Volume2,
};

export const SERVICE_ICON_KEYS = Object.keys(ICONS);

export function ServiceIcon({ iconKey, size = 24 }: { iconKey: string | null; size?: number }) {
  const Icon = (iconKey !== null ? ICONS[iconKey] : undefined) ?? Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}
