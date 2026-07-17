/**
 * Original help-guide content for common lesson topics, written for this
 * app. Each guide pairs short teaching points with an optional diagram.
 */

export interface GuideSection {
  heading: string;
  points: string[];
}

export type GuideGroup = 'Manoeuvres' | 'On the road' | 'Test prep';

export interface DrivingGuide {
  id: string;
  title: string;
  emoji: string;
  group: GuideGroup;
  summary: string;
  intro: string;
  diagram?: 'mirrors' | 'parallel' | 'bay' | 'roundabout' | 'pullUpRight' | 'emergencyStop' | 'hillStart';
  sections: GuideSection[];
}

export const GUIDE_GROUPS: GuideGroup[] = ['On the road', 'Manoeuvres', 'Test prep'];

export const DRIVING_GUIDES: DrivingGuide[] = [
  // ============ On the road ============
  {
    id: 'mirrors',
    title: 'Mirror checks',
    emoji: '🪞',
    group: 'On the road',
    summary: 'The MSM routine, which mirror when, and the blind spots that catch people out.',
    intro:
      'Most faults on test are missed checks, not bad steering. Make every check deliberate — examiners watch your eyes, so let a small head movement show your work.',
    diagram: 'mirrors',
    sections: [
      {
        heading: 'The routine — Mirror, Signal, Manoeuvre',
        points: [
          'Mirrors first, then signal, then act — in that order, every time.',
          'Check well before you signal, so what you see can still change your plan.',
          'Build the rhythm early: it should feel wrong to touch the indicator without a mirror check first.',
        ],
      },
      {
        heading: 'Which mirrors, when',
        points: [
          'Moving off: interior → right door mirror → right shoulder (blind spot).',
          'Turning left: interior → left door mirror — watch for cyclists coming up your inside.',
          'Turning right or overtaking: interior → right door mirror before you move out.',
          'Slowing or stopping: interior mirror early, so drivers behind get warning.',
          'Changing lanes: interior → door mirror on that side → quick blind-spot glance.',
        ],
      },
      {
        heading: 'Know the blind spots',
        points: [
          'Door mirrors are convex — traffic is closer and faster than it looks.',
          'The shaded zones in the diagram are invisible to all three mirrors: only a shoulder check covers them.',
          'Never move off or change lanes on mirrors alone.',
        ],
      },
    ],
  },
  {
    id: 'roundabouts',
    title: 'Roundabouts',
    emoji: '🔄',
    group: 'On the road',
    summary: 'Approach, lane choice, and the signal timing that examiners look for.',
    intro:
      'Give way to traffic from the right, but keep the car rolling when it’s clear — hesitation causes as many faults as pushing in. Plan lane and signal before you arrive, not on the line.',
    diagram: 'roundabout',
    sections: [
      {
        heading: 'Approach',
        points: [
          'Mirror–signal–position early; get your speed down while you can still see the whole junction.',
          'Left lane for turning left or going straight ahead, unless signs or road markings say otherwise.',
          'Right lane for turning right or going all the way round.',
          'Time your arrival: a slow, rolling approach into a clear gap beats a dead stop.',
        ],
      },
      {
        heading: 'Signals',
        points: [
          'Turning left (first exit): signal left on approach and keep it on.',
          'Straight ahead: no signal on approach — signal left once you pass the exit before yours.',
          'Turning right: signal right on approach, keep to the right, then switch to a left signal after the exit before yours.',
          'The diagram shows the full right-turn pattern — it’s the one that catches most learners.',
        ],
      },
      {
        heading: 'Watch out for',
        points: [
          'Cyclists and horse riders may stay left even when turning right — give them the whole lane.',
          'Long vehicles straddle lanes to get round; never ride alongside one on the roundabout.',
          'Mini-roundabouts follow all the same rules with a fraction of the space — avoid driving over the centre.',
        ],
      },
    ],
  },
  {
    id: 'emergencyStop',
    title: 'The emergency stop',
    emoji: '🛑',
    group: 'On the road',
    summary: 'Stopping promptly under full control — and what to do straight after.',
    intro:
      'Around one test in three includes it. The examiner will pull you over first, explain the signal, and give you a clear stretch of road — so the skill being marked is control, not surprise.',
    diagram: 'emergencyStop',
    sections: [
      {
        heading: 'The stop itself',
        points: [
          'React promptly but don’t snatch: squeeze the brake firmly and progressively.',
          'Both hands stay on the wheel — the car will want to wander under hard braking.',
          'Clutch down just before you stop, not before you brake — engine braking helps.',
          'This is the one exception to mirrors-first: in a real emergency, the brake comes before the glance.',
        ],
      },
      {
        heading: 'If the car has ABS',
        points: [
          'Press hard and keep pressing — the pedal pulsing under your foot is the system working.',
          'ABS lets you steer while braking; it doesn’t shorten the stop on its own.',
        ],
      },
      {
        heading: 'Afterwards — where marks are lost',
        points: [
          'Secure the car: handbrake on, neutral.',
          'Moving off again needs FULL all-round observation — both blind spots. Traffic may already be passing you.',
          'A calm ten seconds here finishes the exercise; rushing it throws the marks away.',
        ],
      },
    ],
  },
  {
    id: 'hillStarts',
    title: 'Hill starts & clutch control',
    emoji: '⛰️',
    group: 'On the road',
    summary: 'Finding the bite, moving off uphill without rolling, and downhill starts.',
    intro:
      'Clutch control is confidence in disguise. Once a pupil can hold the car on the bite, hills, queues, and tight manoeuvres all get easier at once.',
    diagram: 'hillStart',
    sections: [
      {
        heading: 'Finding the biting point',
        points: [
          'Handbrake on. Gentle gas — a steady hum, not a rev.',
          'Bring the clutch up slowly until the note drops and the nose lifts slightly: that’s the bite.',
          'Practise holding it there for a few seconds — foot still, car straining but held.',
        ],
      },
      {
        heading: 'Moving off uphill',
        points: [
          'More gas than a flat start — the hill eats power.',
          'Full checks (mirrors and blind spot), then release the handbrake as the bite takes the car’s weight.',
          'Done right, the car should not roll back at all — it pulls away the moment the brake releases.',
        ],
      },
      {
        heading: 'Downhill, and when it goes wrong',
        points: [
          'Downhill: hold the footbrake, clutch fully up sooner — or start in second and let the slope help.',
          'If you roll back: both feet down, handbrake on, breathe, reset. A small roll isn’t a fail; panic is.',
        ],
      },
    ],
  },

  // ============ Manoeuvres ============
  {
    id: 'parallel',
    title: 'Parallel parking',
    emoji: '🅿️',
    group: 'Manoeuvres',
    summary: 'The three-stage reference method: level up, swing to 45°, straighten at the kerb.',
    intro:
      'The examiner is marking control, observation, and accuracy — not speed. Wheels slow, eyes busy: pause for anything passing before and during the reverse.',
    diagram: 'parallel',
    sections: [
      {
        heading: '1 — Set up',
        points: [
          'Pull up level with the car you will park behind, about a metre out from it.',
          'All-round check, then reverse until your rear wheels are level with its rear bumper.',
        ],
      },
      {
        heading: '2 — The swing',
        points: [
          'Full left lock and creep back until the car sits at roughly 45° to the kerb.',
          'When the kerb disappears from your left door mirror, straighten the wheel.',
          'As your front clears the parked car, full right lock to bring the nose in.',
        ],
      },
      {
        heading: '3 — Finish',
        points: [
          'Straighten as the car comes parallel — aim to finish close to the kerb and within about two car lengths.',
          'Not happy? Pull forward and straighten up. Fixing it calmly beats finishing crooked.',
          'Keep the observation going the whole way: both mirrors, back window, and pause for passers-by.',
        ],
      },
    ],
  },
  {
    id: 'bay',
    title: 'Bay parking',
    emoji: '🚙',
    group: 'Manoeuvres',
    summary: 'Reversing in by counting three white lines, plus the forward-bay alternative.',
    intro:
      'Reversing in is the tidier habit — you drive out forwards with full visibility. Walking pace is the whole trick: speed is the enemy of accuracy.',
    diagram: 'bay',
    sections: [
      {
        heading: 'Reverse bay parking — the three-lines method',
        points: [
          'Line up about a bay-and-a-half out from the bays and creep along at walking pace.',
          'Count the white lines past your shoulder: 1 is your bay’s near line, 2 its far line, 3 is the next bay’s far line.',
          'Stop when line 3 is level with your shoulder — that gap gives the car room to swing round.',
          'All-round check, then full lock towards the bay and reverse slowly; the bay comes to you.',
          'Watch both door mirrors: when the bay lines run parallel either side, straighten up and roll back.',
          'Stop before the kerb or the line behind — a quick look over each shoulder as the boot swings in.',
        ],
      },
      {
        heading: 'Forward bay parking',
        points: [
          'Approach wide so the car can turn in straight — a tight approach guarantees a crooked finish.',
          'Remember you must reverse out afterwards: all-round observation before the rear swings across the lane.',
        ],
      },
      {
        heading: 'Test-day tips',
        points: [
          'Adjustments are allowed — pulling forward to re-straighten shows control, not weakness.',
          'Finish inside the lines; open a window if glare hides your mirror view of them.',
        ],
      },
    ],
  },
  {
    id: 'pullUpRight',
    title: 'Pull up on the right',
    emoji: '➡️',
    group: 'Manoeuvres',
    summary: 'Crossing to the right kerb, reversing two car lengths, and rejoining safely.',
    intro:
      'The manoeuvre pupils practise least and meet on test most. The driving is easy — the marks are all in the observation, because you spend the whole exercise facing oncoming traffic.',
    diagram: 'pullUpRight',
    sections: [
      {
        heading: '1 — Crossing over',
        points: [
          'Mirror–signal right–position: let oncoming traffic clear before you commit.',
          'Cross briskly when the gap is real, and stop close and parallel to the right-hand kerb.',
        ],
      },
      {
        heading: '2 — The reverse',
        points: [
          'About two car lengths, keeping straight — main view through the back window, not the mirrors alone.',
          'Pause for anything passing; reversing towards traffic is where examiners want to see patience.',
        ],
      },
      {
        heading: '3 — Rejoining',
        points: [
          'You are on the wrong side of the road, so check BOTH directions and both blind spots.',
          'Wait for a gap big enough to cross back without hurrying anyone — then go without dawdling.',
        ],
      },
    ],
  },

  // ============ Test prep ============
  {
    id: 'showMeTellMe',
    title: 'Vehicle safety questions',
    emoji: '🔧',
    group: 'Test prep',
    summary: 'The “tell me” and “show me” checks — what they cover and how to prepare.',
    intro:
      'Every test opens with a “tell me” question before you drive and adds a “show me” while driving. A wrong answer costs one driving fault — easy marks if the pupil has rehearsed in the car they’ll take to test.',
    sections: [
      {
        heading: '“Tell me” topics to rehearse (before driving)',
        points: [
          'How you’d check the brakes are working before a journey — they shouldn’t feel spongy, and the car shouldn’t pull to one side.',
          'How you’d check tyres: pressures from the handbook when cold, and tread at least 1.6 mm with no cuts or bulges.',
          'How you’d check lights, brake lights, and reflectors are clean and working — walk round, or use reflections and a helper.',
          'How you’d check the headrest position, wash the windscreen, and know the vehicle has enough oil, coolant, and washer fluid.',
        ],
      },
      {
        heading: '“Show me” topics to rehearse (while driving)',
        points: [
          'Operating the washers and wipers, demisting the front and rear screens.',
          'Switching on dipped headlights or the rear heated screen, and sounding the horn.',
          'These are done on the move — the real skill is doing them without losing steering or road position.',
        ],
      },
      {
        heading: 'How to prepare',
        points: [
          'Practise in the exact car the pupil will take to test — switch positions differ between cars.',
          'Make it a two-minute warm-up ritual at the start of lessons in test season.',
          'The current official list is on gov.uk — worth a read-through together the week before test.',
        ],
      },
    ],
  },
];
