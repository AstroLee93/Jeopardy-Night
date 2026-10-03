import { JeopardyGameData } from './animeJeopardyData';

export const CURATED_BOARDS: Record<string, JeopardyGameData> = {
  'all-stars': {
    title: 'Anime All-Stars Jeopardy',
    subtitle: 'Shonen Legends Edition',
    categories: [
      {
        id: 'pirates-sea',
        title: 'STRAW HAT PIRATES',
        description: 'Luffy and his legendary crew',
        clues: [
          {
            id: 'sh-200',
            value: 200,
            clue: 'This elastic captain set out to sea in a barrel and ate the Gum-Gum Fruit.',
            answer: 'Who is Monkey D. Luffy?',
            isDailyDouble: false,
            image: '/images/luffy.jpg'
          },
          {
            id: 'sh-400',
            value: 400,
            clue: 'The culinary prince of the Straw Hats who fights exclusively with kicks to protect his chef hands.',
            answer: 'Who is Sanji (Black Leg Sanji)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'sh-600',
            value: 600,
            clue: 'This Straw Hat archaeologist can sprout body parts like flowers anywhere after eating the Hana Hana no Mi.',
            answer: 'Who is Nico Robin?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'sh-800',
            value: 800,
            clue: 'The cyborg shipwright who runs on cola and built the Thousand Sunny ship.',
            answer: 'Who is Franky (Cutty Flam)?',
            isDailyDouble: true,
            image: null
          },
          {
            id: 'sh-1000',
            value: 1000,
            clue: 'The original pirate captain of the Red Hair Pirates who gave Luffy his iconic straw hat.',
            answer: 'Who is Shanks?',
            isDailyDouble: false,
            image: null
          }
        ]
      },
      {
        id: 'ninja-world',
        title: 'HIDDEN LEAF JUTSU',
        description: 'Shinobi powers and clan secrets',
        clues: [
          {
            id: 'nj-200',
            value: 200,
            clue: 'Naruto’s trademark forbidden jutsu that produces hundreds of physical copies of himself.',
            answer: 'What is the Shadow Clone Jutsu (Kage Bunshin no Jutsu)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'nj-400',
            value: 400,
            clue: 'Sasuke Uchiha’s signature lightning jutsu taught to him by Kakashi Hatake.',
            answer: 'What is the Chidori (Lightning Blade)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'nj-600',
            value: 600,
            clue: 'The dōjutsu eye technique possessed by the Hyūga Clan granting 360-degree X-ray chakra vision.',
            answer: 'What is the Byakugan?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'nj-800',
            value: 800,
            clue: 'This toad sage known as the Pervy Sage taught Naruto the Rasengan and Summoning Jutsu.',
            answer: 'Who is Jiraiya?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'nj-1000',
            value: 1000,
            clue: 'The legendary Wood Release secret technique was wielded by this founder and First Hokage of Konoha.',
            answer: 'Who is Hashirama Senju?',
            isDailyDouble: false,
            image: null
          }
        ]
      },
      {
        id: 'dragon-energy',
        title: 'DRAGON BALL KI',
        description: 'Saiyan transformations and martial arts',
        clues: [
          {
            id: 'db-200',
            value: 200,
            clue: 'The number of wish-granting orange crystal Dragon Balls required to summon Shenron.',
            answer: 'What is 7?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'db-400',
            value: 400,
            clue: 'Goku gathers energy from all living beings across the universe to form this devastating sphere.',
            answer: 'What is the Spirit Bomb (Genki Dama)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'db-600',
            value: 600,
            clue: 'The proud Prince of all Saiyans and rival of Goku who married Bulma Briefs.',
            answer: 'Who is Vegeta?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'db-800',
            value: 800,
            clue: 'Goku’s son who first surpassed Super Saiyan 2 during the climax of the Cell Games.',
            answer: 'Who is Son Gohan?',
            isDailyDouble: true,
            image: null
          },
          {
            id: 'db-1000',
            value: 1000,
            clue: 'The divine god technique Goku unlocks during the Tournament of Power allowing his body to react without conscious thought.',
            answer: 'What is Ultra Instinct (Migatte no Gokui)?',
            isDailyDouble: false,
            image: null
          }
        ]
      },
      {
        id: 'demon-blades',
        title: 'DEMON SLAYER CORPS',
        description: 'Breathing styles and Twelve Kizuki',
        clues: [
          {
            id: 'ds-200',
            value: 200,
            clue: 'Tanjiro Kamado’s initial sword style taught by Sakonji Urokodaki before unlocking Hinokami Kagura.',
            answer: 'What is Water Breathing (Mizu no Kokyū)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'ds-400',
            value: 400,
            clue: 'The coward-turned-lightning swordsman who fights with deadly precision only when unconscious or asleep.',
            answer: 'Who is Zenitsu Agatsuma?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'ds-600',
            value: 600,
            clue: 'The wild boar-masked swordsman who invented Beast Breathing and dual-wields chipped katanas.',
            answer: 'Who is Inosuke Hashibira?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'ds-800',
            value: 800,
            clue: 'The Insect Hashira who uses lethal wisteria flower poisons because she lacks physical strength to decapitate demons.',
            answer: 'Who is Shinobu Kocho?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'ds-1000',
            value: 1000,
            clue: 'The Upper Rank Three demon who fought Kyojuro Rengoku and respects only martial strength.',
            answer: 'Who is Akaza (Hakuji)?',
            isDailyDouble: false,
            image: null
          }
        ]
      },
      {
        id: 'alchemy-taboos',
        title: 'FULLMETAL ALCHEMY',
        description: 'Equivalent Exchange and philosopher stones',
        clues: [
          {
            id: 'fma-200',
            value: 200,
            clue: 'Edward Elric’s younger brother whose soul was bonded into a giant suit of medieval armor.',
            answer: 'Who is Alphonse Elric?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'fma-400',
            value: 400,
            clue: 'The central scientific law of alchemy stating that to obtain something, something of equal value must be lost.',
            answer: 'What is Equivalent Exchange?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'fma-600',
            value: 600,
            clue: 'The Flame Alchemist who sparks fire using special ignition-cloth gloves and dreams of becoming Führer.',
            answer: 'Who is Roy Mustang?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'fma-800',
            value: 800,
            clue: 'The mysterious homunculi are each named after one of these seven cardinal religious vices.',
            answer: 'What are the Seven Deadly Sins?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'fma-1000',
            value: 1000,
            clue: 'The tragic chimera created by State Alchemist Shou Tucker combining his daughter Nina with this animal.',
            answer: 'What is Alexander the dog?',
            isDailyDouble: false,
            image: null
          }
        ]
      },
      {
        id: 'titan-walls',
        title: 'SURVEY CORPS RECON',
        description: 'Attack on Titan secrets and ODM gear',
        clues: [
          {
            id: 'aot-200',
            value: 200,
            clue: 'The mechanical harness utilizing gas cylinders and grappling wires that allows humans to battle Titans.',
            answer: 'What is Omni-Directional Mobility Gear (ODM Gear)?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'aot-400',
            value: 400,
            clue: 'Eren Jaeger’s fiercely protective adoptive sister who wears a red scarf and possesses unmatched combat instincts.',
            answer: 'Who is Mikasa Ackerman?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'aot-600',
            value: 600,
            clue: 'The Colossal Titan who kicked through Wall Maria’s gate in the very first episode was secretly this warrior.',
            answer: 'Who is Bertholdt Hoover?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'aot-800',
            value: 800,
            clue: 'The brilliant tactician of the 104th Training Corps who later inherited the Colossal Titan from Bertholdt.',
            answer: 'Who is Armin Arlert?',
            isDailyDouble: false,
            image: null
          },
          {
            id: 'aot-1000',
            value: 1000,
            clue: 'The mythical founding ancestor who made a pact with the source of all living matter to become the first Titan 2,000 years ago.',
            answer: 'Who is Ymir Fritz?',
            isDailyDouble: false,
            image: null
          }
        ]
      }
    ],
    finalJeopardy: {
      category: 'HISTORIC MANGA MILESTONES',
      clue: 'In 1997, Eiichiro Oda began serializing this pirate epic in Weekly Shonen Jump, which has since sold over 500 million copies worldwide.',
      answer: 'What is One Piece?',
      image: '/images/luffy.jpg'
    }
  },

  'ghibli': {
    title: 'Studio Ghibli Masterpieces',
    subtitle: 'Hayao Miyazaki & Classic Animation Edition',
    categories: [
      {
        id: 'totoro-wood',
        title: 'MY NEIGHBOR TOTORO',
        description: 'Forest spirits and rainy bus stops',
        clues: [
          { id: 'g1', value: 200, clue: 'The two young sisters who move to the countryside and meet Totoro are Mei and this older sister.', answer: 'Who is Satsuki?', isDailyDouble: false },
          { id: 'g2', value: 400, clue: 'The bizarre multi-legged feline vehicle with glowing eyes that takes Mei and Satsuki to visit their mother.', answer: 'What is the Catbus (Nekobasu)?', isDailyDouble: false },
          { id: 'g3', value: 600, clue: 'The small black fuzzy soot sprites that inhabit empty rooms in the sisters’ old home.', answer: 'What are Susuwatari (Soot Sprites)?', isDailyDouble: false },
          { id: 'g4', value: 800, clue: 'Satsuki gives Totoro this household item when it starts raining heavily at the bus stop.', answer: 'What is an umbrella?', isDailyDouble: false },
          { id: 'g5', value: 1000, clue: 'Mei gets lost trying to deliver this garden vegetable to her hospitalized mother.', answer: 'What is an ear of corn?', isDailyDouble: false }
        ]
      },
      {
        id: 'spirited-bath',
        title: 'SPIRITED AWAY',
        description: 'The spirit realm and Yubaba’s bathhouse',
        clues: [
          { id: 'g6', value: 200, clue: 'Chihiro’s greedy parents are cursed and transformed into these farm animals after eating food meant for spirits.', answer: 'What are pigs?', isDailyDouble: false },
          { id: 'g7', value: 400, clue: 'Yubaba steals Chihiro’s name and renames her this single Japanese character meaning "ten".', answer: 'What is Sen?', isDailyDouble: false },
          { id: 'g8', value: 600, clue: 'The mysterious masked spirit who offers gold nuggets and swallows bathhouse staff when rejected.', answer: 'Who is No-Face (Kaonashi)?', isDailyDouble: false },
          { id: 'g9', value: 800, clue: 'Chihiro discovers Haku’s true identity is this river spirit who once saved her from drowning.', answer: 'What is the Kohaku River (Nigihayami Kohakunushi)?', isDailyDouble: true },
          { id: 'g10', value: 1000, clue: 'Yubaba’s kind identical twin sister who lives in Swamp Bottom with her hopping lantern.', answer: 'Who is Zeniba?', isDailyDouble: false }
        ]
      },
      {
        id: 'princess-forest',
        title: 'PRINCESS MONONOKE',
        description: 'Iron Town and ancient wolf gods',
        clues: [
          { id: 'g11', value: 200, clue: 'The wolf goddess Moro raised this human girl who hates humankind and fights with white warpaint.', answer: 'Who is San (Princess Mononoke)?', isDailyDouble: false },
          { id: 'g12', value: 400, clue: 'Prince Ashitaka’s loyal red elk mount who accompanies him on his journey from the Emishi village.', answer: 'Who is Yakul?', isDailyDouble: false },
          { id: 'g13', value: 600, clue: 'The formidable female ruler of Irontown who builds rifles to protect her outcast workers.', answer: 'Who is Lady Eboshi?', isDailyDouble: false },
          { id: 'g14', value: 800, clue: 'The tiny, bobble-headed tree spirits whose rattling heads indicate a healthy, thriving forest.', answer: 'What are Kodama?', isDailyDouble: false },
          { id: 'g15', value: 1000, clue: 'By night, the deer-like Great Forest Spirit transforms into this translucent towering night-walker.', answer: 'What is the Night-Walker (Daidarabotchi)?', isDailyDouble: false }
        ]
      },
      {
        id: 'howl-sorcery',
        title: 'HOWL’S MOVING CASTLE',
        description: 'Witches, curses, and walking structures',
        clues: [
          { id: 'g16', value: 200, clue: 'Sophie Hatter is transformed into this by the jealous Witch of the Waste.', answer: 'What is an elderly 90-year-old woman?', isDailyDouble: false },
          { id: 'g17', value: 400, clue: 'The sassy fire demon bound by a secret contract to power Howl’s walking castle.', answer: 'Who is Calcifer?', isDailyDouble: false },
          { id: 'g18', value: 600, clue: 'The enchanted scarecrow with a vegetable head who repeatedly helps Sophie throughout the wastes.', answer: 'Who is Turnip Head (Prince Justin)?', isDailyDouble: false },
          { id: 'g19', value: 800, clue: 'Howl dramatically melts into green slime after Sophie accidentally rearranges his hair potions and turns his hair this color.', answer: 'What is orange / ginger?', isDailyDouble: false },
          { id: 'g20', value: 1000, clue: 'The chief sorceress to the king and Howl’s former magical mentor who directs the war.', answer: 'Who is Madame Suliman?', isDailyDouble: false }
        ]
      },
      {
        id: 'kiki-delivery',
        title: 'KIKI’S DELIVERY SERVICE',
        description: 'Witches in training and coastal towns',
        clues: [
          { id: 'g21', value: 200, clue: 'Kiki’s sarcastic talking black cat companion who loses his ability to speak to her.', answer: 'Who is Jiji?', isDailyDouble: false },
          { id: 'g22', value: 400, clue: 'The bakery owner who provides Kiki with a room in exchange for delivery deliveries.', answer: 'Who is Osono?', isDailyDouble: false },
          { id: 'g23', value: 600, clue: 'The aviation-obsessed boy who builds a propeller bicycle and befriends Kiki.', answer: 'Who is Tombo?', isDailyDouble: false },
          { id: 'g24', value: 800, clue: 'The young artist who lives in a forest cabin and helps Kiki overcome her creative burnout.', answer: 'Who is Ursula?', isDailyDouble: false },
          { id: 'g25', value: 1000, clue: 'According to witch tradition, young witches must leave home for a year of training at this exact age.', answer: 'What is 13 years old?', isDailyDouble: false }
        ]
      },
      {
        id: 'skies-oceans',
        title: 'PONYO & LAPUTA',
        description: 'Floating kingdoms and ocean magic',
        clues: [
          { id: 'g26', value: 200, clue: 'Ponyo is a magical goldfish who longs to become human after falling in love with this 5-year-old boy.', answer: 'Who is Sosuke?', isDailyDouble: false },
          { id: 'g27', value: 400, clue: 'Ponyo loves eating this sliced breakfast meat placed atop hot ramen soup.', answer: 'What is ham?', isDailyDouble: false },
          { id: 'g28', value: 600, clue: 'The legendary floating island city in Miyazaki’s 1986 steampunk film.', answer: 'What is Laputa (Castle in the Sky)?', isDailyDouble: false },
          { id: 'g29', value: 800, clue: 'Sheeta wears a glowing blue necklace made of this mysterious ancient crystal element.', answer: 'What is Aetherium (Volucite / Levitation Stone)?', isDailyDouble: true },
          { id: 'g30', value: 1000, clue: 'The boisterous air pirate matriarch who commands the Tiger Moth airship and adopts Pazu and Sheeta.', answer: 'Who is Captain Dola?', isDailyDouble: false }
        ]
      }
    ],
    finalJeopardy: {
      category: 'STUDIO GHIBLI HISTORY',
      clue: 'In 2003, this Hayao Miyazaki film became the first non-English animated feature to win the Academy Award for Best Animated Feature.',
      answer: 'What is Spirited Away (Sen to Chihiro no Kamikakushi)?',
      image: '/images/ghibli.jpg'
    }
  }
};
