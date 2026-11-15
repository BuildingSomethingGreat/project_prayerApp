# Vision

## The promise

One sentence: **Liora is the friend who prays with you.**

She is not a library of content, and she is not a habit tracker. She listens, opens the Bible to the right page, and prays with you about the thing you actually brought. Everything on the roadmap should make that more true. Anything that turns Liora into a feed, a scoreboard or a store should be turned down.

## Where it is today

A first, complete loop: a calm entrance, a three-screen introduction, "What's on your heart?", a choice of three voices, a personal session built on verified Scripture, and a player with synced words, segment navigation, an ambient sound bed, and the passage one tap away. It installs to the home screen and replays saved sessions offline.

## Before launch

These are the gaps between this build and something to put in front of real users.

1. **Run the live services.** Exercise the Claude and ElevenLabs paths with real keys, tune the writing prompt against a set of real intentions, and audition the three voices. The preview clips were generated with Higgsfield's voices; the ElevenLabs ids in `server/speech.ts` are stand-ins and will not sound the same.
2. **Theological review.** A pastor or trained reviewer reads the theme library and a broad sample of model-written sessions. See [CONTENT.md](CONTENT.md#review).
3. **License a translation.** WEBBE is accurate and free, but most of this audience reads NIV, ESV, NLT or CSB. Ideally she chooses her own.
4. **Settle the name.** Check trademarks and app-store availability for "Liora" or its replacement.
5. **Accounts and sync.** Sessions currently live on one device. Sign-in (Apple, Google, email link) with server-side storage.
6. **Abuse and cost controls.** Move rate limits to a shared store, add per-account quotas, and cache narration server-side.
7. **Privacy.** What she writes is intimate. Publish a plain-language policy, encrypt at rest, never train on it, and make deletion one tap.
8. **Real devices.** Test on iPhone Safari and Android Chrome: autoplay, lock-screen controls, backgrounded audio, and installed-PWA behaviour.

## Next

**Deeper personalisation.** Her name, spoken naturally. Memory across sessions, so Liora can say "last week you were waiting to hear about the interview." A gentle check-in: "How did it go?"

**Rhythms.** A morning and an evening moment. A quiet, optional reminder at a time she chooses, with no streaks and no guilt. If she misses a week, Liora says welcome back, and nothing else.

**Answered prayers.** A private record of what she has prayed, with a way to mark a prayer as answered and return to it in thanksgiving. This is the feature most likely to change someone's faith over a year.

**Praying for others.** Name a person once and have them woven into future sessions. Send a finished prayer to a friend as a link she can listen to.

**Journeys.** Multi-day paths through a theme or a book: seven days in the Psalms, Advent, Lent, a season of waiting, new motherhood, grief.

**Sleep.** Long, slow, low-voiced sessions that fade out, with a timer.

**Music.** Replace the generated pad with composed instrumental beds per scene. Later, licensed worship instrumentals.

**More voices and languages.** Spanish first. Voices with different ages and accents. Possibly her own recorded voice for declarations.

**Richer motion.** The current loops are built from four stills. With more image-to-video budget, generate true motion pieces per theme, and let the scene shift subtly with the session's arc: dimmer in prayer, brighter in blessing.

## Later

- **Native apps**, for reliable background audio, widgets ("Today's word") and Apple Watch breathing.
- **Small circles.** Three to eight women who share prayer requests and pray the same session. Private by design and never public or performative.
- **Churches.** A way for a church or ministry to offer its own journeys and voices.
- **Spoken input.** She talks; Liora listens and prays.

## Business model

Subscription, with a generous free tier: a daily verse and a few personal sessions a month free, unlimited sessions, voices, journeys and sleep on the paid plan. No ads, ever. A gifting option fits the audience well. Consider a give-one model for women who cannot pay.

## What we will not build

- A feed, likes, follower counts, or anything that can be scrolled without end.
- Streaks, badges, leaderboards, or shame for missing a day.
- Advertising, or selling or sharing what she writes.
- Generated Scripture, generated "words from God", or prophecy.
- Promises of outcomes in exchange for prayer or payment.

## How we will know it is working

Not time in app. The measures that matter are whether she comes back within a week, whether she finishes sessions, whether she marks prayers as answered, and whether she tells a friend.
