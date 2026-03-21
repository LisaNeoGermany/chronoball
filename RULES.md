# Chronoball

*A Rulebook for the Arcane Sport of the Dimensions*

---

> *In the forgotten halls of the chronomancers, where time itself became a plaything, a sport was born that challenges body and mind in equal measure. Two teams face off on an enchanted field to carry a ball infused with chronomantic energy into the opposing end zone. The rules are simple — mastery is not.*
>
> *These are the rules of Chronoball, written down for those brave enough to step onto the field.*

---

## The Teams

> *Before the first throw is made, the participants divide into two teams. Each side chooses its champions with care — for in Chronoball, it is not strength alone that matters, but teamwork.*

Two **teams** compete against each other. Each team consists of up to **3 players**. Each team has a **home end zone** at its end of the playing field.

At the start of the game, it is determined which team begins as the **attacking team** and which starts as the **defending team**. These roles alternate throughout the game.

---

## Gameplay

> *The game unfolds in phases, like the tides of battle. Attack and defense alternate like ebb and flow — and with each shift, the balance of power changes.*

### Phases

A game consists of consecutive **phases**. In each phase, one team attacks while the other defends. When a point is scored or the ball is seized by the defending team, the phase ends and the roles switch.

### Ball Position

At the start of each phase, the ball appears in the **home end zone of the attacking team**. The attack begins from there.

### Turn Order

Players act in alternation: first a member of the attacking team, then a member of the defending team, then an attacker again, and so on. The order within a team rotates among its members.

---

## Actions

> *On the field of Chronoball, each player has a choice of several actions on their turn. The art lies in recognizing the right moment for the right action.*

### Pick Up the Ball

A character who is **within 5 feet** of the ball can pick it up as part of their turn. They become the **ball carrier**.

The ball carrier immediately receives **1,000 temporary hit points**, reflecting the chronomantic protection of the ball. These temporary hit points are lost as soon as the character gives up or loses the ball.

### Move

The ball carrier can move up to **60 feet** on their turn.

**Special Rule — Free Movement in the Home Zone.** When the ball carrier moves within their own end zone, this movement is *not* deducted from their turn's movement distance. This allows a player to freely position themselves in the home zone before making their advance.

### Throw

The ball carrier can throw the ball to a point on the playing field. The ball can be thrown up to **60 feet** in a single turn. To do so, they choose one of the following **skills**:

- **Athletics**
- **Sleight of Hand**

They make a **skill check** (d20 + skill modifier) against a **Difficulty Class (DC)** that depends on the distance to the target (see *Skill Checks*).

- **Success:** The ball reaches the chosen target point. If it lands in the opposing end zone, a point is scored!
- **Failure:** The ball lands partway between the thrower and the target. The higher the check result, the closer the ball gets to the target.

The ball carrier can throw up to **45 feet** on their turn.

### Pass

The ball carrier can pass the ball to a **teammate**. The mechanics are the same as throwing — the same skill check, the same DC based on distance.

However, opposing players near the thrower or receiver can attempt to **intercept** the pass (see *Interception*).

**Zone Pass.** If a pass is successfully completed to a teammate who is *in the opposing end zone*, the attacking team scores **2 points** — an especially valuable play!

### Drop the Ball

The ball carrier can voluntarily **drop** the ball at any time. The ball lands within 5 feet of the character.

---

## Skill Checks

> *The magic of Chronoball demands more than brute strength. A skillful throw, an acrobatic spin, a nimble wrist — any of these arts can bring the ball to its target. But the farther the target, the greater the challenge.*

When a character **throws** or **passes** the ball, they make a skill check. They choose one of the three permitted skills — **Athletics**, **Acrobatics**, or **Sleight of Hand** — and roll:

**d20 + skill modifier** against the **Difficulty Class (DC)**

### DC Calculation

The Difficulty Class increases with the distance to the target:

$$DC = 10 + \left(\left\lfloor \frac{Distance}{10} \right\rfloor \times 2\right)$$

| Distance | DC |
|:--------:|:--:|
| 10 feet  | 10 |
| 20 feet  | 12 |
| 30 feet  | 14 |
| 40 feet  | 16 |
| 50 feet  | 18 |
| 60 feet  | 20 |

### Partial Success on Failure

If the check misses the DC, the ball doesn't simply land at the thrower's feet. Instead, it travels a **partial distance** that depends on how narrowly the check was missed. A result just under the DC still carries the ball far — while a catastrophic miss barely moves it at all (but at least 5 feet).

The Game Master may, at their discretion, grant **advantage**, **disadvantage**, or **bonuses** to the check, such as from favorable positioning or adverse circumstances.

---

## Interception

> *No throw is safe as long as a watchful defender lurks nearby. In the blink of an eye, a skillful interception attempt can turn the tide — transforming a sure point into a bitter defeat.*

A defender can make an **interception attempt** when they are **within 10 feet** of the thrower or receiver of a pass. Interception attempts can occur at both the thrower's and the receiver's end.

### Procedure

1. The defender is asked whether they wish to intercept. They have **10 seconds** to decide — if the time elapses, the attempt is considered declined.

2. If the defender chooses to attempt the interception, the thrower (or receiver) must succeed on a **saving throw**: either **Strength** or **Dexterity** (chosen by the affected character).

3. The **saving throw DC** is calculated as follows:

$$DC = 8 + \text{higher modifier (STR or DEX) of the interceptor} + \text{proficiency bonus}$$

4. **Saving throw failure:** The ball is intercepted! Possession changes — **Turnover!** The phase ends immediately.

5. **Saving throw success:** The interception attempt fails, and the action (throw or pass) continues as planned.

---

## Fumble — Losing the Ball Through Damage

> *The chronomantic protection of the ball is powerful, yet not insurmountable. A hard hit at the right moment can make even the most determined ball carrier stumble.*

When the ball carrier takes **damage**, they risk losing the ball. For every **10 points of damage** taken in a single round, they must make a **Constitution saving throw**.

### DC Calculation

The DC increases with each additional threshold crossed in the same round:

| Damage Taken | Number of Saves | Save DCs         |
|:------------:|:---------------:|:----------------:|
| 10           | 1               | 10               |
| 20           | 2               | 10, then 12      |
| 30           | 3               | 10, 12, then 14  |
| 40           | 4               | 10, 12, 14, then 16 |

- **Failure:** The ball drops to the ground — **Fumble!** The ball carrier loses the ball, and any character nearby can pick it up.
- **Success:** The ball carrier maintains control of the ball despite the damage.

---

## Scoring

> *In Chronoball, there are three paths to glory. Whether through a daring rush, a precise long throw, or a masterfully coordinated zone pass — every point brings the team closer to victory.*

| Scoring Method | Description | Points |
|:--------------:|:------------|:------:|
| **Rush**       | Carry the ball as the ball carrier into the opposing end zone | **2** |
| **Throw-in**   | Successfully throw the ball into the opposing end zone | **1** |
| **Zone Pass**  | Successfully complete a pass to a teammate in the opposing end zone | **2** |

After every point scored, the following occurs:
- **Roles switch**: The previously defending team becomes the attacking team.
- **The ball respawns** in the home end zone of the new attacking team.
- A new phase begins.

---

## Victory

> *The crowd's cheers pierce the arcane barriers of the playing field as the decisive points are scored. A winner is determined — until the next game.*

The team that first reaches the **point total set by the Game Master** wins the game.

---

> ### Tactics & Strategies
>
> *The most experienced Chronoball players know: it is not the strongest arm that wins, but the cleverest mind. Here are some words of wisdom that have proven themselves on the field:*
>
> - **Coordinated zone passes** are the ultimate discipline. A teammate in the opposing end zone and a precise pass yield a full 2 points — as much as a risky rush.
>
> - **Protect your ball carrier.** Position yourselves to make opposing interception attempts more difficult. A free throwing arm is worth its weight in gold.
>
> - **Use the free movement** in your home zone. The ball carrier can position themselves without restriction there — perfect for finding the ideal throwing angle.
>
> - **Choose your skill wisely.** A character with high Acrobatics shouldn't rely on Athletics just because it sounds more heroic. Play to your strengths.
>
> - **Force interception attempts** through clever positioning of your defenders. Make sure at least one teammate is within 10 feet of the opposing thrower or receiver.
>
> - **Short passes are safer.** The DC increases with distance — a pass over 20 feet (DC 12) is far more reliable than a Hail Mary over 50 feet (DC 18).
>
> - **Don't carry the ball blindly.** A rush may be worth 2 points, but the path through the opposing defense is long and fraught with danger. Sometimes a throw-in for 1 point is the wiser choice.
