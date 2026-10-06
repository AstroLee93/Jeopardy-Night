import { FeudGameData } from './familyFeudData';

export const CURATED_FEUD_GAMES: Record<string, FeudGameData> = {
  'anime-all-stars': {
    id: 'anime-all-stars',
    title: 'Anime Family Feud',
    subtitle: '100 Otaku Surveyed Edition',
    theme: 'Anime & Manga Culture',
    rounds: [
      {
        id: 'r1',
        question: 'We asked 100 anime fans: Name an anime character who eats an absurd amount of food.',
        multiplier: 1,
        answers: [
          { id: 'a1', text: 'Goku (Dragon Ball)', points: 38 },
          { id: 'a2', text: 'Monkey D. Luffy (One Piece)', points: 29 },
          { id: 'a3', text: 'Naruto Uzumaki (Ramen)', points: 15 },
          { id: 'a4', text: 'Sasha Braus (Attack on Titan)', points: 9 },
          { id: 'a5', text: 'Toriko / Gluttony', points: 5 },
          { id: 'a6', text: 'Choji Akimichi', points: 4 }
        ]
      },
      {
        id: 'r2',
        question: 'We asked 100 fans: Name a signature special move or power that EVERY anime fan knows.',
        multiplier: 1,
        answers: [
          { id: 'a1', text: 'Kamehameha', points: 44 },
          { id: 'a2', text: 'Rasengan', points: 23 },
          { id: 'a3', text: 'Gum-Gum Pistol / Gatling', points: 14 },
          { id: 'a4', text: 'Spirit Bomb / Genki Dama', points: 9 },
          { id: 'a5', text: 'Getsuga Tensho', points: 6 },
          { id: 'a6', text: 'Detroit Smash', points: 4 }
        ]
      },
      {
        id: 'r3',
        question: 'DOUBLE POINTS: Name a common cliché or trope that happens in almost every anime series.',
        multiplier: 2,
        answers: [
          { id: 'a1', text: 'The Beach / Hot Springs Episode', points: 36 },
          { id: 'a2', text: 'Tournament Arc', points: 26 },
          { id: 'a3', text: 'Running Late with Toast in Mouth', points: 16 },
          { id: 'a4', text: 'Nosebleeds from Excitement', points: 12 },
          { id: 'a5', text: 'Window Seat Next to the Back', points: 6 },
          { id: 'a6', text: 'Power of Friendship Comeback', points: 4 }
        ]
      },
      {
        id: 'r4',
        question: 'DOUBLE POINTS: Name a legendary anime mentor or teacher who everyone respects.',
        multiplier: 2,
        answers: [
          { id: 'a1', text: 'Master Roshi (Dragon Ball)', points: 33 },
          { id: 'a2', text: 'Kakashi Hatake (Naruto)', points: 28 },
          { id: 'a3', text: 'Jiraiya (Naruto)', points: 19 },
          { id: 'a4', text: 'All Might (My Hero Academia)', points: 11 },
          { id: 'a5', text: 'Satoru Gojo (Jujutsu Kaisen)', points: 5 },
          { id: 'a6', text: 'Silvers Rayleigh (One Piece)', points: 4 }
        ]
      },
      {
        id: 'r5',
        question: 'TRIPLE POINTS: Name an anime series you could rewatch 100 times without ever getting bored.',
        multiplier: 3,
        answers: [
          { id: 'a1', text: 'Cowboy Bebop', points: 32 },
          { id: 'a2', text: 'Fullmetal Alchemist: Brotherhood', points: 28 },
          { id: 'a3', text: 'Hunter x Hunter', points: 17 },
          { id: 'a4', text: 'Death Note', points: 11 },
          { id: 'a5', text: 'One Piece', points: 7 },
          { id: 'a6', text: 'Spirited Away', points: 5 }
        ]
      }
    ],
    fastMoney: [
      {
        id: 'fm1',
        question: 'Name an anime with the most filler episodes.',
        answers: [
          { text: 'Naruto / Shippuden', points: 45 },
          { text: 'Bleach', points: 27 },
          { text: 'One Piece', points: 14 },
          { text: 'Dragon Ball Z', points: 9 },
          { text: 'Detective Conan', points: 5 }
        ]
      },
      {
        id: 'fm2',
        question: 'Name an iconic animal companion or mascot in anime.',
        answers: [
          { text: 'Pikachu', points: 52 },
          { text: 'Chopper', points: 21 },
          { text: 'Happy (Fairy Tail)', points: 12 },
          { text: 'Luna (Sailor Moon)', points: 9 },
          { text: 'Ein (Cowboy Bebop)', points: 6 }
        ]
      },
      {
        id: 'fm3',
        question: 'Name a color of hair you rarely see on a normal real person, but is common in anime.',
        answers: [
          { text: 'Blue', points: 38 },
          { text: 'Pink', points: 31 },
          { text: 'Green', points: 16 },
          { text: 'Purple', points: 10 },
          { text: 'Silver / White', points: 5 }
        ]
      },
      {
        id: 'fm4',
        question: 'Name an iconic weapon used by anime protagonists.',
        answers: [
          { text: 'Katana / Giant Sword', points: 54 },
          { text: 'Kunai / Shuriken', points: 21 },
          { text: 'Death Note Notebook', points: 11 },
          { text: 'Scythe', points: 8 },
          { text: 'Gun / Dual Pistols', points: 6 }
        ]
      },
      {
        id: 'fm5',
        question: 'Name a Studio Ghibli film that makes you feel nostalgic.',
        answers: [
          { text: 'My Neighbor Totoro', points: 42 },
          { text: 'Spirited Away', points: 34 },
          { text: 'Kiki\'s Delivery Service', points: 12 },
          { text: 'Howl\'s Moving Castle', points: 8 },
          { text: 'Princess Mononoke', points: 4 }
        ]
      }
    ]
  },
  'classic-family': {
    id: 'classic-family',
    title: 'Family Game Night Feud',
    subtitle: 'Classic Living Room Edition',
    theme: 'Everyday Life & Family Fun',
    rounds: [
      {
        id: 'r1',
        question: 'We asked 100 people: Name something people are always misplacing around the house.',
        multiplier: 1,
        answers: [
          { id: 'a1', text: 'TV Remote', points: 39 },
          { id: 'a2', text: 'Car / House Keys', points: 28 },
          { id: 'a3', text: 'Cell Phone', points: 18 },
          { id: 'a4', text: 'Reading Glasses', points: 8 },
          { id: 'a5', text: 'Shoes / Slippers', points: 4 },
          { id: 'a6', text: 'Wallet / Purse', points: 3 }
        ]
      },
      {
        id: 'r2',
        question: 'We asked 100 people: Name a chore kids try their hardest to avoid doing.',
        multiplier: 1,
        answers: [
          { id: 'a1', text: 'Cleaning their bedroom', points: 42 },
          { id: 'a2', text: 'Washing the dishes', points: 24 },
          { id: 'a3', text: 'Taking out the trash', points: 16 },
          { id: 'a4', text: 'Doing homework / reading', points: 9 },
          { id: 'a5', text: 'Folding laundry', points: 5 },
          { id: 'a6', text: 'Feeding / walking the pet', points: 4 }
        ]
      },
      {
        id: 'r3',
        question: 'DOUBLE POINTS: Name a reason someone might wake up in the middle of the night.',
        multiplier: 2,
        answers: [
          { id: 'a1', text: 'Need to use the bathroom', points: 48 },
          { id: 'a2', text: 'Thirsty for water', points: 21 },
          { id: 'a3', text: 'Heard a strange noise', points: 14 },
          { id: 'a4', text: 'Bad dream / nightmare', points: 9 },
          { id: 'a5', text: 'Too hot or too cold', points: 5 },
          { id: 'a6', text: 'Phone ringing / notification', points: 3 }
        ]
      },
      {
        id: 'r4',
        question: 'DOUBLE POINTS: Name something you pack for a vacation that you usually never end up using.',
        multiplier: 2,
        answers: [
          { id: 'a1', text: 'Extra clothes / outfits', points: 41 },
          { id: 'a2', text: 'Books / magazines', points: 26 },
          { id: 'a3', text: 'Workout / running gear', points: 15 },
          { id: 'a4', text: 'Rain umbrella / poncho', points: 9 },
          { id: 'a5', text: 'Fancy dress shoes', points: 5 },
          { id: 'a6', text: 'Swimsuit', points: 4 }
        ]
      },
      {
        id: 'r5',
        question: 'TRIPLE POINTS: Name a food that everyone agrees tastes better the next day as leftovers.',
        multiplier: 3,
        answers: [
          { id: 'a1', text: 'Pizza', points: 45 },
          { id: 'a2', text: 'Chili / Stew', points: 23 },
          { id: 'a3', text: 'Lasagna / Pasta', points: 17 },
          { id: 'a4', text: 'Chinese takeout / Fried rice', points: 9 },
          { id: 'a5', text: 'Thanksgiving Turkey / stuffing', points: 6 }
        ]
      }
    ],
    fastMoney: [
      {
        id: 'fm1',
        question: 'Name a day of the week people look forward to most.',
        answers: [
          { text: 'Friday', points: 58 },
          { text: 'Saturday', points: 34 },
          { text: 'Sunday', points: 8 }
        ]
      },
      {
        id: 'fm2',
        question: 'Name something you put in your morning coffee or tea.',
        answers: [
          { text: 'Milk / Creamer', points: 47 },
          { text: 'Sugar / Sweetener', points: 38 },
          { text: 'Honey', points: 10 },
          { text: 'Cinnamon', points: 5 }
        ]
      },
      {
        id: 'fm3',
        question: 'Name a popular pet besides a dog or cat.',
        answers: [
          { text: 'Fish / Goldfish', points: 46 },
          { text: 'Hamster / Guinea pig', points: 28 },
          { text: 'Bird / Parrot', points: 15 },
          { text: 'Turtle / Reptile', points: 11 }
        ]
      },
      {
        id: 'fm4',
        question: 'Name something people do when they are stuck in traffic.',
        answers: [
          { text: 'Listen to music / podcasts', points: 55 },
          { text: 'Check their phone / GPS', points: 22 },
          { text: 'Sing out loud', points: 14 },
          { text: 'Honk the horn / complain', points: 9 }
        ]
      },
      {
        id: 'fm5',
        question: 'Name an excuse people give for being late to work or school.',
        answers: [
          { text: 'Heavy traffic', points: 51 },
          { text: 'Overslept / alarm didn\'t go off', points: 32 },
          { text: 'Car trouble / flat tire', points: 11 },
          { text: 'Spilled coffee / wardrobe malfunction', points: 6 }
        ]
      }
    ]
  }
};
