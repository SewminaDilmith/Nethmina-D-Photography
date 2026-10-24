export type Category = "Weddings" | "Birthdays" | "Graduations" | "Portraits" | "Pre-shoots";
export const categories: Category[] = [
  "Weddings",
  "Birthdays",
  "Graduations",
  "Portraits",
  "Pre-shoots",
];
export interface Photo {
  id: string;
  url: string;
  alt: string;
}
export interface Album {
  id: string;
  title: string;
  category: Category;
  location: string;
  description: string;
  published: boolean;
  photos: Photo[];
}
export interface Service {
  name: Category;
  number: string;
  line: string;
  detail: string;
}
export interface SiteContent {
  name: string;
  tagline: string;
  intro: string;
  about: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  hero: string;
  aboutImage: string;
  services: Service[];
  albums: Album[];
}
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  type: string;
  date: string;
  location: string;
  message: string;
  createdAt: string;
  read: boolean;
}
