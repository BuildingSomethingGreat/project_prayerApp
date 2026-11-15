import type { SceneId, ThemeId } from "../lib/types";

export interface Theme {
  id: ThemeId;
  /** Shown on the prompt chip. */
  label: string;
  /** Dropped into the text box when the chip is tapped. */
  starter: string;
  title: string;
  subtitle: string;
  scene: SceneId;
  keywords: string[];
  reflect: string[];
  pray: string[];
  declare: string[];
  bless: string[];
}

/**
 * The on-device library. It is used when no writing model is configured, and it
 * is also the tone reference handed to the model when one is.
 *
 * Voice: second person, present tense, short spoken phrases. Declarations are
 * always agreement with something God has already said — never a claim on an
 * outcome.
 */
export const THEMES: Theme[] = [
  {
    id: "peace",
    label: "Peace",
    starter: "My mind won't slow down, and I need peace about ",
    title: "Quiet Waters",
    subtitle: "For an anxious mind",
    scene: "dawn",
    keywords: ["anxious", "anxiety", "worry", "worried", "overwhelm", "stress", "panic", "racing", "peace", "calm", "overthink", "nervous", "restless", "mind"],
    reflect: [
      "Notice that peace is not described here as something you produce.",
      "It is something that stands guard over you.",
      "You are not asked to stop feeling. You are invited to hand it over.",
      "So name the thing that has been circling in your mind.",
      "And picture setting it down, into hands far steadier than yours.",
    ],
    pray: [
      "Father, You see every thought I have been turning over.",
      "I bring each one to You now, by name.",
      "Where my mind runs ahead, bring it home.",
      "Where I have been bracing for the worst, loosen my grip.",
      "Guard my heart, and guard my mind, with a peace I cannot explain.",
      "I trust You with what I cannot control.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "The peace of God is guarding my heart and my mind.",
      "I do not have to carry what I have already given to Him.",
      "I am held, I am heard, and I am not alone.",
    ],
    bless: [
      "Go gently into the rest of your day.",
      "The Lord of peace Himself is with you.",
    ],
  },
  {
    id: "rest",
    label: "Rest",
    starter: "I'm tired, and I need rest from ",
    title: "Come Away",
    subtitle: "For a weary soul",
    scene: "dusk",
    keywords: ["tired", "exhaust", "weary", "burn", "burnout", "sleep", "rest", "drained", "worn", "busy", "night", "insomnia", "depleted"],
    reflect: [
      "This is an invitation, not an instruction.",
      "He does not say, try harder. He says, come.",
      "Rest is not a reward for finishing. It is a gift for the unfinished.",
      "You are allowed to stop before everything is done.",
      "Let your body believe that, right now.",
    ],
    pray: [
      "Lord, I come to You tired.",
      "Tired in ways that sleep alone does not seem to reach.",
      "I lay down the weight of everything that depends on me.",
      "Teach me the unforced rhythm of Your grace.",
      "Restore what this season has taken out of me.",
      "And let me rest tonight as one who is safe.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "My worth is not measured by how much I get done.",
      "The Lord is my shepherd. I have everything I need.",
      "I can rest, because He does not.",
    ],
    bless: [
      "May your sleep be sweet, and your waking be gentle.",
      "He who watches over you will not slumber.",
    ],
  },
  {
    id: "purpose",
    label: "A dream I'm holding",
    starter: "There's a dream on my heart: ",
    title: "Held Dreams",
    subtitle: "For the vision you carry",
    scene: "honey",
    keywords: ["dream", "goal", "vision", "business", "career", "calling", "purpose", "build", "launch", "create", "future", "ambition", "manifest", "plan", "start", "job", "promotion", "opportunity", "write", "book"],
    reflect: [
      "The dream you carry did not arrive by accident.",
      "But notice the order in these words. God moves first.",
      "You are not asked to force a future into being.",
      "You are asked to place it in His hands, and then walk.",
      "A dream held open before God is safer than one held tight.",
    ],
    pray: [
      "Father, You know the dream I have been holding.",
      "You know how long I have carried it, and how much it matters.",
      "I place it in Your hands, with open fingers.",
      "Shape it where it needs shaping. Grow it where it honours You.",
      "Give me courage for the next small step, and patience for the timing.",
      "Let what I build be a blessing to more people than me.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "I am God's workmanship, created for good work prepared ahead of me.",
      "He who began a good work in me will carry it to completion.",
      "I commit my plans to the Lord, and I trust Him with the outcome.",
    ],
    bless: [
      "Walk forward with open hands today.",
      "The One who gave you the dream goes ahead of you.",
    ],
  },
  {
    id: "strength",
    label: "Strength",
    starter: "I need strength for ",
    title: "Renewed",
    subtitle: "For when you're running low",
    scene: "ember",
    keywords: ["strength", "strong", "weak", "hard", "difficult", "struggle", "can't", "endure", "keep going", "give up", "heavy", "capable", "enough"],
    reflect: [
      "Strength, in Scripture, is rarely about having more of your own.",
      "It is about what happens when yours runs out.",
      "You do not need to feel strong to be upheld.",
      "Weakness is not the end of the story here. It is where the help arrives.",
      "So you can be honest about how much you have left.",
    ],
    pray: [
      "God, I am running low, and You already know it.",
      "I stop pretending that I have this handled.",
      "Be strength in the exact place I feel weakest.",
      "Lift what I cannot lift. Carry what I cannot carry.",
      "Renew me, not only for today, but one day at a time.",
      "Let Your grace be enough for me, just as You promised.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "His grace is enough for me, and His power meets me in weakness.",
      "Those who wait for the Lord will renew their strength. That includes me.",
      "I am upheld by a hand stronger than mine.",
    ],
    bless: [
      "You have what you need for this day.",
      "Go in the strength that He supplies.",
    ],
  },
  {
    id: "worth",
    label: "Feeling loved",
    starter: "I've been struggling to feel like I'm enough, especially ",
    title: "Beloved",
    subtitle: "For remembering who you are",
    scene: "honey",
    keywords: ["worth", "enough", "love", "loved", "lonely", "alone", "insecure", "compare", "comparison", "ugly", "body", "confidence", "identity", "reject", "unwanted", "shame", "failure", "self"],
    reflect: [
      "Before you achieved anything, you were already wanted.",
      "This is not a compliment. It is a description of how you were made.",
      "The voice that compares and measures you is not His voice.",
      "His voice sounds like delight.",
      "Let yourself be looked at with love for a moment.",
    ],
    pray: [
      "Father, I have been listening to voices that are not Yours.",
      "The ones that tell me I am too much, or never enough.",
      "Quiet them now.",
      "Let me hear what You say over me instead.",
      "Root me so deeply in Your love that nothing shakes loose what You have spoken.",
      "Teach me to see myself the way You do.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "I am fearfully and wonderfully made.",
      "I am called a child of God, and that is what I am.",
      "Nothing in all creation can separate me from His love.",
    ],
    bless: [
      "Carry yourself today like someone who is deeply loved.",
      "Because you are.",
    ],
  },
  {
    id: "guidance",
    label: "Direction",
    starter: "I'm facing a decision about ",
    title: "The Next Step",
    subtitle: "For a decision in front of you",
    scene: "dawn",
    keywords: ["decision", "decide", "direction", "guidance", "confused", "choice", "choose", "should i", "path", "wisdom", "unsure", "uncertain", "next step", "which", "lost", "clarity", "discern"],
    reflect: [
      "You may be waiting for the whole map.",
      "What is promised here is quieter. A straightened path. A lamp for your feet.",
      "Enough light for the next step, and then the next.",
      "You do not need to see the end to take the step in front of you.",
      "Ask plainly. He is not reluctant to answer.",
    ],
    pray: [
      "Lord, I do not know which way to go, and I would rather admit it than pretend.",
      "You promise wisdom to anyone who asks. So I am asking.",
      "Quiet the opinions that are louder than Yours.",
      "Close the doors that are not for me, and give me peace about the ones that are.",
      "Make the next step clear, and give me the courage to take it.",
      "I trust You more than I trust my own understanding.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "I trust in the Lord with all my heart.",
      "He is making my path straight, one step at a time.",
      "I have asked for wisdom, and He gives it generously.",
    ],
    bless: [
      "You do not walk into this decision alone.",
      "His word is a lamp to your feet today.",
    ],
  },
  {
    id: "gratitude",
    label: "Gratitude",
    starter: "Today I'm thankful for ",
    title: "Every Good Gift",
    subtitle: "For a thankful heart",
    scene: "honey",
    keywords: ["grateful", "thankful", "thank", "gratitude", "blessed", "blessing", "joy", "happy", "celebrate", "praise", "good news", "answered"],
    reflect: [
      "Gratitude is a way of seeing.",
      "It does not deny what is hard. It refuses to let the hard thing be the only thing.",
      "Look back over the last day, slowly.",
      "A kindness. A small provision. A moment you almost missed.",
      "Each one was a gift, and each one had a Giver.",
    ],
    pray: [
      "Father, thank You.",
      "For breath this morning, and mercy that was new before I woke.",
      "For the people You have placed around me.",
      "For the prayers You have answered, and the ones You are still holding.",
      "Open my eyes to goodness I have been walking past.",
      "Let thankfulness be the first thing on my lips today.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "This is the day the Lord has made. I will rejoice and be glad in it.",
      "His mercies are new this morning, and they are for me.",
      "Every good gift in my life comes from my Father.",
    ],
    bless: [
      "May you notice one more gift before the day is over.",
      "And may your joy be full.",
    ],
  },
  {
    id: "provision",
    label: "Provision",
    starter: "I'm worried about having enough for ",
    title: "Daily Bread",
    subtitle: "For when you need provision",
    scene: "dawn",
    keywords: ["money", "finance", "financial", "bills", "rent", "debt", "provide", "provision", "afford", "income", "pay", "need", "lack", "broke", "budget", "house", "home"],
    reflect: [
      "The need in front of you is real, and God does not ask you to pretend otherwise.",
      "But these words reorder things.",
      "Seek Him first. The rest is added, not chased.",
      "You are asked to live in today, and leave tomorrow where it belongs.",
      "He has been faithful with every day so far.",
    ],
    pray: [
      "Father, You know exactly what I need, down to the number.",
      "I confess that fear has been doing the maths for me.",
      "I choose to seek You first.",
      "Open doors I could not open. Give me wisdom with what is already in my hands.",
      "Provide what is needed, right on time.",
      "And make me generous, even here.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "My God will supply every need of mine.",
      "The Lord is my shepherd. I shall lack nothing.",
      "I will not borrow trouble from tomorrow.",
    ],
    bless: [
      "You are cared for by a Father who notices sparrows.",
      "Today's bread will be there today.",
    ],
  },
  {
    id: "comfort",
    label: "Comfort",
    starter: "My heart is heavy because ",
    title: "Near",
    subtitle: "For a heavy heart",
    scene: "dusk",
    keywords: ["grief", "griev", "loss", "lost", "died", "death", "passed", "heartbreak", "heartbroken", "broken", "hurt", "pain", "sad", "cry", "crying", "miss", "divorce", "breakup", "miscarriage", "depress", "mourning"],
    reflect: [
      "There is no hurrying you here.",
      "God does not stand at a distance from sorrow, waiting for you to feel better.",
      "He comes close to it.",
      "You do not have to explain your pain, or make it smaller.",
      "Just let yourself be near Him, as you are.",
    ],
    pray: [
      "Lord, my heart is heavy, and I have no tidy words for it.",
      "So I bring You the ache itself.",
      "Sit with me in it.",
      "Hold together what feels like it is coming apart.",
      "Bind up what is broken, in Your time and in Your way.",
      "And when I cannot pray, pray for me.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "The Lord is near to me in this.",
      "He heals the broken in heart, and binds up their wounds.",
      "I will pass through these waters, and they will not overwhelm me.",
    ],
    bless: [
      "Be gentle with yourself today.",
      "The God of all comfort is holding you.",
    ],
  },
  {
    id: "loved-ones",
    label: "Someone I love",
    starter: "I want to pray for someone I love: ",
    title: "Over Them",
    subtitle: "For someone you love",
    scene: "ember",
    keywords: ["husband", "wife", "marriage", "child", "children", "kids", "son", "daughter", "mom", "mother", "dad", "father", "friend", "family", "sister", "brother", "baby", "pregnan", "parent", "relationship", "boyfriend", "partner"],
    reflect: [
      "To pray for someone is to love them in a place they cannot see.",
      "You cannot be everywhere they are.",
      "But the One you are speaking to already is.",
      "Bring their face to mind now.",
      "And imagine these words being spoken over them.",
    ],
    pray: [
      "Father, I bring to You the one I love.",
      "You know them better than I do, and You love them more.",
      "Keep them today, in their going out and their coming in.",
      "Where they are hurting, be near. Where they are wandering, lead them home.",
      "Give me patience to love them well, and wisdom to know how.",
      "Let Your face shine on them, and give them peace.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "The Lord watches over the ones I love.",
      "I can release them into hands more capable than mine.",
      "Love is patient, and love is kind. Let that be true of me.",
    ],
    bless: [
      "The Lord bless them and keep them.",
      "And the Lord bless you, for carrying them here.",
    ],
  },
  {
    id: "hope",
    label: "Waiting",
    starter: "I've been waiting a long time for ",
    title: "Something New",
    subtitle: "For the long wait",
    scene: "dawn",
    keywords: ["wait", "waiting", "hope", "hopeless", "delay", "still", "when", "long time", "single", "infertil", "stuck", "discourag", "disappoint", "unanswered", "season", "patient"],
    reflect: [
      "Waiting can feel like nothing is happening.",
      "But these words speak of something already springing up, before it can be seen.",
      "Delay is not denial, and silence is not absence.",
      "Hope, here, is not wishful thinking. It is leaning your weight on Someone faithful.",
      "You are allowed to hope again.",
    ],
    pray: [
      "God of hope, I have been waiting, and it has worn me thin.",
      "I bring You the longing, and the disappointment that has grown up around it.",
      "Do what only You can do.",
      "And while I wait, do not let my heart grow hard.",
      "Fill me with joy and peace in believing, even before I see.",
      "I choose to trust Your timing.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "I will see the goodness of the Lord in the land of the living.",
      "He is doing a new thing, even now.",
      "I wait for the Lord, and my heart takes courage.",
    ],
    bless: [
      "May the God of hope fill you with all joy and peace.",
      "Something is growing that you cannot see yet.",
    ],
  },
  {
    id: "courage",
    label: "Courage",
    starter: "I'm afraid of ",
    title: "Do Not Fear",
    subtitle: "For what you're facing",
    scene: "ember",
    keywords: ["afraid", "fear", "scared", "courage", "brave", "terrified", "dread", "interview", "surgery", "diagnosis", "confront", "risk", "doctor", "test", "results", "health", "sick", "illness"],
    reflect: [
      "Fear tells you that you will face this by yourself.",
      "Every one of these promises answers that same lie.",
      "He goes before you. He is with you. He will not leave.",
      "Courage is not the absence of fear.",
      "It is knowing who is standing next to you.",
    ],
    pray: [
      "Lord, I am afraid, and I will not hide that from You.",
      "You have not given me a spirit of fear.",
      "So I ask for what You do give. Power, and love, and a sound mind.",
      "Go ahead of me into what I am dreading.",
      "Stand beside me in the moment itself.",
      "And let me feel, unmistakably, that I am not alone.",
      "In Jesus' name. Amen.",
    ],
    declare: [
      "God has not given me a spirit of fear, but of power, love, and self-control.",
      "The Lord Himself goes before me. He will not fail me or forsake me.",
      "When I am afraid, I will put my trust in Him.",
    ],
    bless: [
      "Be strong, and take heart.",
      "The Lord your God is with you wherever you go.",
    ],
  },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;

/** Chips offered on the "What's on your heart?" screen, in display order. */
export const PROMPT_CHIPS: ThemeId[] = ["peace", "purpose", "loved-ones", "guidance", "rest", "gratitude", "courage", "hope"];

/** Best-fit theme for free text. Falls back to peace, which suits almost anything. */
export function detectTheme(text: string): ThemeId {
  const haystack = ` ${text.toLowerCase()} `;
  let best: ThemeId = "peace";
  let bestScore = 0;
  for (const theme of THEMES) {
    let score = 0;
    for (const word of theme.keywords) if (haystack.includes(word)) score += word.length > 5 ? 2 : 1;
    if (score > bestScore) {
      best = theme.id;
      bestScore = score;
    }
  }
  return best;
}
