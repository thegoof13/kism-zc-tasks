import { User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart, DivideIcon as LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  User,
  Briefcase,
  Heart,
  Home,
  Book,
  Car,
  Coffee,
  Dumbbell,
  Music,
  ShoppingCart,
};

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || User;
}

export function getAvailableIcons(): { name: string; component: LucideIcon }[] {
  return Object.entries(iconMap).map(([name, component]) => ({
    name,
    component,
  }));
}