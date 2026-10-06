export interface ClueItem {
  id: string;
  value: number;
  clue: string;
  answer: string;
  isDailyDouble?: boolean;
  image?: string | null;
  fallbackImage?: string;
  imageAlt?: string;
  image_search_query?: string | null;
  imageSource?: string | null;
}

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  clues: ClueItem[];
}

export interface FinalJeopardyItem {
  category: string;
  clue: string;
  answer: string;
  image?: string | null;
  fallbackImage?: string;
  imageAlt?: string;
  image_search_query?: string | null;
  imageSource?: string | null;
}

export interface JeopardyGameData {
  title: string;
  subtitle: string;
  categories: CategoryItem[];
  finalJeopardy: FinalJeopardyItem;
}

export const INITIAL_ANIME_DATA: JeopardyGameData = {
  title: "Family Jeopardy",
  subtitle: "Family Game Night Edition",
  categories: [
    {
      id: "pirates-ninjas",
      title: "PIRATES & NINJAS",
      description: "One Piece & Naruto universe lore",
      clues: [
        {
          id: "pn-200",
          value: 200,
          clue: "This stretchy captain of the Straw Hat Pirates ate the Gum-Gum Fruit and dreams of finding the ultimate treasure.",
          answer: "Who is Monkey D. Luffy?",
          image: "/images/luffy.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Straw Hat Captain Luffy"
        },
        {
          id: "pn-400",
          value: 400,
          clue: "Naruto Uzumaki's signature spinning sphere of concentrated chakra, originally invented by the Fourth Hokage.",
          answer: "What is the Rasengan?",
          image: "/images/rasengan.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Spinning chakra energy sphere"
        },
        {
          id: "pn-600",
          value: 600,
          clue: "This green-haired swordsman aims to be the greatest in the world and wields three swords at once, including one in his mouth.",
          answer: "Who is Roronoa Zoro?",
          image: "/images/zoro.jpg",
          imageAlt: "Master Swordsman Zoro"
        },
        {
          id: "pn-800",
          value: 800,
          clue: "The enigmatic Leaf Village jonin known as 'The Copy Ninja', famous for his Sharingan eye and fondness for romance novels.",
          answer: "Who is Kakashi Hatake?",
          image: "/images/kakashi.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Copy Ninja Kakashi"
        },
        {
          id: "pn-1000",
          value: 1000,
          clue: "The title given to the seven powerful pirate captains allied with the World Government to deter other outlaws.",
          answer: "What are the Warlords of the Sea (Shichibukai)?",
          image: null
        }
      ]
    },

    {
      id: "saiyans-titans",
      title: "SAIYANS & TITANS",
      description: "Dragon Ball & Attack on Titan battles",
      clues: [
        {
          id: "st-200",
          value: 200,
          clue: "Sent to Earth as an infant with the Saiyan birth name Kakarot, this legendary martial artist became Earth's fiercest protector.",
          answer: "Who is Son Goku?",
          image: "/images/goku.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Saiyan warrior Goku"
        },
        {
          id: "st-400",
          value: 400,
          clue: "Humanity within Paradis Island is sheltered behind three massive concentric stone barriers: Wall Maria, Wall Rose, and this innermost wall.",
          answer: "What is Wall Sina?",
          image: null
        },
        {
          id: "st-600",
          value: 600,
          clue: "The ancient martial arts master who lives on a tiny island with a talking turtle and created the Kamehameha wave.",
          answer: "Who is Master Roshi (Muten Roshi)?",
          image: "/images/roshi.jpg",
          imageAlt: "Master Roshi Turtle Hermit"
        },
        {
          id: "st-800",
          value: 800,
          isDailyDouble: true,
          clue: "DAILY DOUBLE: Known as 'Humanity's Strongest Soldier', this Survey Corps captain is famous for high-speed spinning strikes and extreme cleanliness.",
          answer: "Who is Levi Ackerman?",
          image: "/images/levi.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Captain Levi Ackerman"
        },
        {
          id: "st-1000",
          value: 1000,
          clue: "The green-sky alien world where Goku first awakened the golden Super Saiyan transformation during his duel with Frieza.",
          answer: "What is Planet Namek?",
          image: null
        }
      ]
    },

    {
      id: "slayers-heroes",
      title: "BREATHING & QUIRKS",
      description: "Demon Slayer & My Hero Academia powers",
      clues: [
        {
          id: "sh-200",
          value: 200,
          clue: "Tanjiro Kamado travels across Taisho-era Japan carrying this demon-transformed sister in a wooden backpack box.",
          answer: "Who is Nezuko Kamado?",
          image: "/images/nezuko.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Nezuko Kamado"
        },
        {
          id: "sh-400",
          value: 400,
          clue: "Deku's explosive childhood rival who wields the Quirk allowing him to secrete and ignite nitroglycerin-like sweat.",
          answer: "Who is Katsuki Bakugo (Great Explosion Murder God Dynamight)?",
          image: null
        },
        {
          id: "sh-600",
          value: 600,
          clue: "The fiery, passionate Hashira whose immortal motto to Tanjiro was 'Set your heart ablaze!' during the Mugen Train mission.",
          answer: "Who is Kyojuro Rengoku (The Flame Hashira)?",
          image: "/images/rengoku.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Flame Hashira Rengoku"
        },
        {
          id: "sh-800",
          value: 800,
          clue: "The stockpiling Quirk passed down across nine generations that All Might bestowed upon the Quirkless Izuku Midoriya.",
          answer: "What is One For All?",
          image: null
        },
        {
          id: "sh-1000",
          value: 1000,
          clue: "The millennia-old progenitor of all demons who can alter his appearance and created the Twelve Kizuki demons.",
          answer: "Who is Muzan Kibutsuji?",
          image: "/images/muzan.jpg",
          imageAlt: "Demon King Muzan"
        }
      ]
    },

    {
      id: "ghibli-fantasy",
      title: "GHIBLI MAGIC",
      description: "Beloved Studio Ghibli films & legendary creatures",
      clues: [
        {
          id: "gf-200",
          value: 200,
          clue: "This lovable, enormous woodland spirit with an umbrella waits at a rain-drenched bus stop with Satsuki and Mei.",
          answer: "Who is Totoro?",
          image: "/images/totoro.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          imageAlt: "My Neighbor Totoro"
        },
        {
          id: "gf-400",
          value: 400,
          clue: "In 'Spirited Away', Chihiro is trapped working in an enchanted bathhouse owned by this greedy, large-headed witch.",
          answer: "Who is Yubaba?",
          image: null
        },
        {
          id: "gf-600",
          value: 600,
          clue: "Sophie is transformed into an elderly woman and cleans this bizarre, clanking mobile home powered by Calcifer the fire demon.",
          answer: "What is Howl's Moving Castle?",
          image: "/images/howls-castle.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Howl's Moving Castle"
        },
        {
          id: "gf-800",
          value: 800,
          clue: "Prince Ashitaka seeks a cure for a demon's boar curse and meets San, a fierce warrior girl raised by giant white wolves in this 1997 film.",
          answer: "What is Princess Mononoke (Mononoke Hime)?",
          image: null
        },
        {
          id: "gf-1000",
          value: 1000,
          clue: "The mystical floating island kingdom from Hayao Miyazaki's 1986 steampunk masterpiece 'Castle in the Sky'.",
          answer: "What is Laputa?",
          image: "/images/laputa.jpg",
          imageAlt: "Floating City Laputa"
        }
      ]
    },

    {
      id: "pokemon-creatures",
      title: "CATCH 'EM ALL",
      description: "Pokémon partners, gym challenges, and lore",
      clues: [
        {
          id: "pk-200",
          value: 200,
          clue: "National Pokédex #025: This chubby yellow Electric-type mouse refuses to travel inside a Pokéball with Ash Ketchum.",
          answer: "Who is Pikachu?",
          image: "/images/pikachu.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Electric Pokémon Pikachu"
        },
        {
          id: "pk-400",
          value: 400,
          clue: "The bumbling Team Rocket trio consists of Jessie, James, and this rare Pokémon who taught himself human speech.",
          answer: "Who is Meowth?",
          image: null
        },
        {
          id: "pk-600",
          value: 600,
          clue: "Created by genetic scientists from the ancient DNA of Mew, this formidable Psychic-type escaped from Cinnabar Island.",
          answer: "Who is Mewtwo?",
          image: "/images/mewtwo.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Genetic Pokémon Mewtwo"
        },
        {
          id: "pk-800",
          value: 800,
          clue: "Ash's proud Fire/Flying lizard Pokémon who fell asleep during the Indigo Plateau match against Ritchie.",
          answer: "Who is Charizard?",
          image: null
        },
        {
          id: "pk-1000",
          value: 1000,
          clue: "According to Johto legend, Ho-Oh resurrected three beasts after the Brass Tower burned: Entei, Suicune, and this lightning beast.",
          answer: "Who is Raikou?",
          image: "/images/raikou.jpg",
          imageAlt: "Thunder Beast Raikou"
        }
      ]
    },

    {
      id: "artifacts-weapons",
      title: "ICONIC WEAPONS",
      description: "Cursed tools, notebooks, and legendary artifacts",
      clues: [
        {
          id: "iw-200",
          value: 200,
          clue: "High school genius Light Yagami uses this dropped supernatural notebook to execute criminals by writing their names.",
          answer: "What is the Death Note?",
          image: "/images/deathnote.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Death Note notebook"
        },
        {
          id: "iw-400",
          value: 400,
          clue: "Edward and Alphonse Elric lost their limbs and body after attempting this strictly forbidden taboo of alchemy.",
          answer: "What is Human Transmutation?",
          image: null
        },
        {
          id: "iw-600",
          value: 600,
          isDailyDouble: true,
          clue: "DAILY DOUBLE: In 'Jujutsu Kaisen', Satoru Gojo manipulates infinity to stop incoming attacks using this inherited clan technique.",
          answer: "What is Limitless (or the Infinity)?",
          image: "/images/gojo.jpg",
          fallbackImage: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
          imageAlt: "Satoru Gojo Limitless technique"
        },
        {
          id: "iw-800",
          value: 800,
          clue: "Spike Spiegel's sleek, ultra-fast red converted racing ship in 'Cowboy Bebop' is named after this ocean fish with a bladed nose.",
          answer: "What is the Swordfish II?",
          image: null
        },
        {
          id: "iw-1000",
          value: 1000,
          clue: "In 'Bleach', the ultimate released form of a Shinigami's Zanpakuto sword, usually achieved after years of intense training.",
          answer: "What is Bankai?",
          image: "/images/bankai.jpg",
          imageAlt: "Ichigo Bankai release"
        }
      ]
    }
  ],

  finalJeopardy: {
    category: "LEGENDARY ANIME CREATORS & STUDIOS",
    clue: "In 1985, Hayao Miyazaki, Isao Takahata, and Toshio Suzuki founded this historic Tokyo animation studio, naming it after an Italian reconnaissance aircraft.",
    answer: "What is Studio Ghibli?",
    image: "/images/ghibli.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    imageAlt: "Studio Ghibli Totoro silhouette"
  }
};
