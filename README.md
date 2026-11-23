# DEMON.EXE — A Neon Demon Duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Eizdy-ez/demon-exe/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Eizdy-ez/demon-exe/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original 1v1 card duel for the make.fun "Make the best card game" bounty, set on a neon grid where demons are summoned as code. You are Vex, the Neon Summoner; across the burning core sits Voidreaper, the Demon Core. Both start at 30 life. Play demon cards with Energy, and take the grid before he takes it from you.

## The Echo Rule — the original mechanic

Play a card whose strain matches the last card played — by either summoner — and the core answers: its effect strikes **twice** (ECHO x2). A 5-damage Volt Surge becomes 10. A 7-ward Venom Ward becomes 14. The Echo Row in the middle of the table always shows the last three cards, so the echo is never a guess.

## The Core — the Demon Core

Every **third echo** overloads the Demon Core. The duellist who woke it gains **+4 life and draws 2 cards**. Echoes are no longer just doubled cards — they are a race to surge the core first. The Core meter on the table counts the charge: 1, 2, surge.

## How to play

- **Click a card** (or press **1–7**) to play it — cards cost Energy
- **Space / E** — end your turn; Voidreaper plays, then your Energy refills (+1 max Energy each turn, up to 10)
- **Four demon strains, each with its own colour across the whole UI:** Inferno (hellfire, crimson), Volt (storm, gold), Venom (plague, jade), Void (shadow, violet)
- **20 original cards** in a 30-card deck — Volt Spark, Hellstrike, Blood Tithe, Void Bolt, Soul Draw and more: Strikes, Wards, Mends and Draws, each with a readable cost, power and strain
- **Voidreaper shows his intent** before his turn, so you can plan your ward, your heal — or your echo
- **R** restart, **M** sound on/off, **Enter** start the duel
- Win by bringing Voidreaper to 0 life; lose if your life reaches 0. An empty deck costs you 2 life per empty draw.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Static files only — no build step, no network requests, procedural WebAudio sound (synthwave-style plucks). Built with Node 22 and a desktop browser. Entry for the make.fun bounty at https://make.fun/bounty/best-card-game-20261122-1826
