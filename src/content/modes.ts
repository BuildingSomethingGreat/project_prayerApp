import type { Mode } from "../lib/types";

/** How each kind of moment is offered on the first screen. */
export const MODES: { id: Mode; label: string; lead: string; rest: string; lede: string; placeholder: string; cta: string }[] = [
  {
    id: "prayer",
    label: "Pray with me",
    lead: "What's on",
    rest: "your heart?",
    lede: "Write as much or as little as you like. Liora will sit with you and pray about it.",
    placeholder: "A worry, a dream, a name, a thank-you…",
    cta: "Create my moment",
  },
  {
    id: "warfare",
    label: "Stand and fight",
    lead: "What are you",
    rest: "up against?",
    lede: "Name the battle. Liora will pray a bold prayer of spiritual warfare over it, standing in what Jesus has already won.",
    placeholder: "Fear that won't lift, a heaviness over my home, an attack on my mind, my family, my calling…",
    cta: "Create my battle prayer",
  },
  {
    id: "vision",
    label: "See it in faith",
    lead: "What life are you",
    rest: "praying for?",
    lede: "Describe it in as much detail as you can: who is there, where you are, what a day looks like. Liora will tell it back to you as a story you can step inside.",
    placeholder: "The home, the marriage, the work, the healing, the family table, the morning you wake up in it…",
    cta: "Create my vision",
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<Mode, (typeof MODES)[number]>;

/**
 * Hand-written fallbacks for the two newer modes, used only when no writing
 * model is reachable. They cannot respond to what she wrote the way the model
 * does, so they stay general and true.
 */
export const WARFARE = {
  title: "Stand Firm",
  subtitle: "For the battle you're in",
  arrive: [
    "Okay. Stand up on the inside with me.",
    "You are not coming into this as someone who might lose.",
    "You belong to Jesus, and He has already won.",
    "So we are not fighting for victory today. We are standing in it.",
  ],
  reflect: [
    "Notice who this fight is with. It is not with people.",
    "It is with what you cannot see, and God is not intimidated by any of it.",
    "Every power that comes against you was disarmed at the cross.",
    "So you don't have to be loud to have authority. You only have to stand.",
  ],
  pray: [
    "Father, I come to You in the name of Jesus, and in no other name.",
    "I thank You that the battle belongs to You, and that You have never lost one.",
    "Right now I take my place in Christ, covered by His blood and hidden in Him.",
    "I put on the whole armour of God, truth and righteousness and peace.",
    "I lift up the shield of faith, and I take up the sword of the Spirit, which is Your word.",
    "In the name of Jesus, I resist the enemy, and Your word says he must flee.",
    "Every lie that has been spoken over my mind, I pull it down and make it bow to Christ.",
    "Every scheme set against my home, my family and my calling, I declare it will not prosper.",
    "Fear, you have no authority here. Heaviness, you have no place here.",
    "Greater is He who is in me than anything that is in this world.",
    "Lord, fill every place the enemy has tried to occupy with Your presence and Your peace.",
    "Set Your angels around me and around everyone I love.",
    "I will not be moved, because You are my rock, my fortress and my deliverer.",
    "In Jesus' mighty name. Amen.",
  ],
  declare: [
    "Say these out loud with me, like you mean them.",
    "No weapon formed against me will prevail.",
    "I am more than a conqueror through Him who loved me.",
    "God has not given me a spirit of fear, but of power, love and self-control.",
    "The Lord fights for me, and I will stand.",
  ],
  bless: ["Now walk out of here like someone who is covered.", "The One who is for you is greater than anything against you."],
};

export const VISION = {
  title: "Come and See",
  subtitle: "For the life you're praying for",
  arrive: [
    "Close your eyes with me for a minute.",
    "We're going to look at the thing you've been asking God for, and we're going to look at it in faith.",
    "Not to demand it. To see it, and to hold it up to Him.",
    "Take one slow breath, and let's go there together.",
  ],
  scenes: [
    {
      title: "Morning",
      lines: [
        "It's morning, and the light is coming in soft and gold.",
        "You wake up slowly, and the first thing you notice is that the weight is gone.",
        "The thing you used to carry into every day is simply not there any more.",
        "You lie still for a second, and you say, thank You, before your feet touch the floor.",
        "And it doesn't feel like a wish. It feels like home.",
      ],
    },
    {
      title: "The day",
      lines: [
        "You move through the day you used to only pray about.",
        "The people you love are close, and there is laughter in the room.",
        "Your hands are busy with good work, the kind that fits you.",
        "And every so often you stop, because you remember when this was only words in a prayer.",
        "You know exactly who brought you here.",
      ],
    },
    {
      title: "Evening",
      lines: [
        "Now it's evening, and the house is quiet and full at the same time.",
        "You sit down, and you look around at what God has done.",
        "Nothing here was forced. All of it was given.",
        "And you hear yourself say it out loud. Lord, You were faithful.",
      ],
    },
  ],
  pray: [
    "Father, You see everything we just saw, and You saw it first.",
    "I put this whole picture in Your hands, every room and every face in it.",
    "Where my vision is too small, make it bigger. Where it isn't Yours, change it gently.",
    "Give me faith to keep seeing it, and patience for Your timing.",
    "And whatever You do, let it bring You glory.",
    "In Jesus' name. Amen.",
  ],
  declare: [
    "Say these with me.",
    "God is able to do far more than all I ask or imagine.",
    "He who began a good work in me will carry it to completion.",
    "I will see the goodness of the Lord in the land of the living.",
  ],
  bless: ["Carry that picture with you today, and keep thanking Him for it.", "He is faithful, and He has not forgotten you."],
};
