import type { SiteContent } from "./types";
export const defaultContent: SiteContent = {
  name: "Nethmina D Photography",
  tagline: "For the moments\nyou want to keep.",
  intro:
    "The big days. The quiet in-betweens. Photographs that feel like you, and take you right back.",
  about:
    "I’m drawn to the little things: hands held under the table, a laugh you couldn’t keep in, the way the light falls just before sunset. My approach is simple. Make room for you to be yourself, and let the story unfold.\n\nFrom wedding days to birthday afternoons, I photograph people and the moments they want to remember.",
  location: "Available for your next chapter",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  hero: "/images/wedding.jpg",
  aboutImage: "/images/photographer.jpg",
  services: [
    {
      name: "Weddings",
      number: "01",
      line: "Your day, exactly as it felt.",
      detail:
        "From the getting-ready nerves to the last dance. Thoughtful coverage of your celebration, with time for relaxed portraits and the people who made it yours.",
    },
    {
      name: "Pre-shoots",
      number: "02",
      line: "Your day, exactly as it felt.",
      detail:
        "From the getting-ready nerves to the last dance. Thoughtful coverage of your celebration, with time for relaxed portraits and the people who made it yours.",
    },
    {
      name: "Birthdays",
      number: "03",
      line: "Another year. A hundred little memories.",
      detail:
        "The surprise, the candles, the hugs, and everyone gathered around. Candid coverage of birthdays and family celebrations, big or small.",
    },
    {
      name: "Graduations",
      number: "04",
      line: "Here’s to everything that comes next.",
      detail:
        "Celebrate the work it took to get here. Individual or group portraits on campus or somewhere that means something to you.",
    },
    {
      name: "Portraits",
      number: "05",
      line: "A little time in your own light.",
      detail:
        "Easygoing portrait sessions for individuals, couples, and families. We’ll plan the location and feel together, then take our time.",
    },
  ],
  albums: [
    {
      id: "a-day-to-remember",
      title: "A day to remember",
      category: "Weddings",
      location: "An intimate celebration",
      description:
        "A little sunshine, a room full of favourite people, and a new beginning. A collection of the moments in between the big moments.",
      published: true,
      photos: [
        {
          id: "w1",
          url: "/images/wedding.jpg",
          alt: "A couple embracing on their wedding day",
        },
        {
          id: "w2",
          url: "/images/wedding-detail.jpg",
          alt: "Wedding flowers and celebration details",
        },
        {
          id: "w3",
          url: "/images/couple.jpg",
          alt: "A couple enjoying a quiet moment outdoors",
        },
      ],
    },
    {
      id: "pre-shoot-moments",
      title: "Before the big day",
      category: "Pre-shoots",
      location: "A story for two",
      description:
        "A relaxed pre-wedding session celebrating your story together.",
      published: true,
      photos: [
        {
          id: "pre-shoot-1",
          url: "/images/couple.jpg",
          alt: "A couple sharing a moment before their wedding",
        },
      ],
    },

    {
      id: "in-your-own-light",
      title: "In your own light",
      category: "Portraits",
      location: "An afternoon in the sun",
      description:
        "Unhurried portraits, natural light, and space to be yourself.",
      published: true,
      photos: [
        {
          id: "p1",
          url: "/images/portrait.jpg",
          alt: "A natural light outdoor portrait",
        },
        {
          id: "p2",
          url: "/images/portrait-2.jpg",
          alt: "A thoughtful portrait in warm light",
        },
      ],
    },
    {
      id: "the-next-chapter",
      title: "The next chapter",
      category: "Graduations",
      location: "A milestone worth remembering",
      description:
        "The end of one chapter, and everything that comes next. A celebration of getting here.",
      published: true,
      photos: [
        {
          id: "g1",
          url: "/images/graduation.jpg",
          alt: "A graduate celebrating a milestone",
        },
        {
          id: "g2",
          url: "/images/graduation-2.jpg",
          alt: "Graduation day with friends",
        },
      ],
    },
    {
      id: "another-trip-around",
      title: "Another trip around",
      category: "Birthdays",
      location: "With the people who matter",
      description: "Candles, wishes, and all the joy of another year together.",
      published: true,
      photos: [
        {
          id: "b1",
          url: "/images/birthday.jpg",
          alt: "A birthday celebration with candles and cake",
        },
        {
          id: "b2",
          url: "/images/birthday-2.jpg",
          alt: "A colourful birthday party",
        },
      ],
    },
    {
      id: "slow-afternoons",
      title: "Slow afternoons",
      category: "Portraits",
      location: "No occasion needed",
      description:
        "Sometimes an ordinary afternoon is all the occasion you need.",
      published: true,
      photos: [
        {
          id: "s1",
          url: "/images/portrait-2.jpg",
          alt: "An expressive portrait in soft natural light",
        },
        {
          id: "s2",
          url: "/images/portrait.jpg",
          alt: "Relaxed outdoor portrait",
        },
      ],
    },
  ],
};
