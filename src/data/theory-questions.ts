/**
 * Original practice questions written in the style of the UK theory test,
 * based on Highway Code rules. Not the licensed DVSA question bank.
 * The correct option is always index `answer`; options are shuffled at quiz time.
 */

export interface TheoryQuestion {
  id: number;
  category: string;
  question: string;
  options: [string, string, string, string];
  answer: number; // index into options
  explanation: string;
}

export const THEORY_QUESTIONS: TheoryQuestion[] = [
  // --- Alertness ---
  {
    id: 1,
    category: 'Alertness',
    question: 'You feel tired during a long motorway journey. What should you do?',
    options: [
      'Leave at the next exit and take a break',
      'Open the window and carry on',
      'Turn the radio up',
      'Speed up to finish the journey sooner',
    ],
    answer: 0,
    explanation: 'Fresh air and music only mask tiredness briefly. Stop somewhere safe and rest.',
  },
  {
    id: 2,
    category: 'Alertness',
    question: 'Before making a U-turn in the road, what should you do?',
    options: [
      'Check mirrors and look around for a final check',
      'Sound your horn to warn others',
      'Signal and turn immediately',
      'Flash your headlights',
    ],
    answer: 0,
    explanation: 'Mirrors have blind spots — always look round over your shoulder before a U-turn.',
  },
  {
    id: 3,
    category: 'Alertness',
    question: 'Why should you switch your phone to silent or voicemail before driving?',
    options: [
      'So you are not distracted while driving',
      'To save the battery',
      'Because calls are more expensive while moving',
      'So passengers cannot hear it',
    ],
    answer: 0,
    explanation: 'Even hands-free calls reduce concentration; deal with messages after you park.',
  },

  // --- Attitude ---
  {
    id: 4,
    category: 'Attitude',
    question: 'A vehicle is following you too closely. What should you do?',
    options: [
      'Gradually increase the gap between you and the vehicle ahead',
      'Brake sharply to warn the driver',
      'Speed up to pull away',
      'Move to the middle of the road',
    ],
    answer: 0,
    explanation: 'A bigger gap ahead lets you brake gently, giving the tailgater time to react.',
  },
  {
    id: 5,
    category: 'Attitude',
    question: 'When should you flash your headlights at other road users?',
    options: [
      'Only to let them know you are there',
      'To show you are giving way',
      'To tell them to go first',
      'To greet other drivers you know',
    ],
    answer: 0,
    explanation: 'The Highway Code gives flashing headlights one meaning: letting others know you are there.',
  },
  {
    id: 6,
    category: 'Attitude',
    question: 'A bus is signalling to pull out from a bus stop ahead. What should you do?',
    options: [
      'Give way to it if you can do so safely',
      'Accelerate past before it moves',
      'Sound your horn',
      'Flash your headlights and keep your speed',
    ],
    answer: 0,
    explanation: 'Give buses priority when safe — they are carrying many people and block less traffic moving.',
  },

  // --- Safety margins ---
  {
    id: 7,
    category: 'Safety margins',
    question: 'What is the typical overall stopping distance at 50 mph on a dry road?',
    options: ['53 metres', '36 metres', '73 metres', '96 metres'],
    answer: 0,
    explanation: 'At 50 mph: 15 m thinking distance + 38 m braking distance = 53 m.',
  },
  {
    id: 8,
    category: 'Safety margins',
    question: 'In heavy rain, what time gap should you leave to the vehicle in front?',
    options: ['At least four seconds', 'Two seconds', 'One second', 'No gap is needed below 30 mph'],
    answer: 0,
    explanation: 'Stopping distances at least double in the wet — double the two-second rule.',
  },
  {
    id: 9,
    category: 'Safety margins',
    question: 'Braking distances on ice can be how much further than on a dry road?',
    options: ['Ten times as far', 'Twice as far', 'Four times as far', 'The same if you brake gently'],
    answer: 0,
    explanation: 'On ice, tyres have very little grip — allow up to ten times the normal distance.',
  },

  // --- Hazard awareness ---
  {
    id: 10,
    category: 'Hazard awareness',
    question: 'A ball bounces out from between parked cars ahead. What should you do?',
    options: [
      'Slow down and be ready to stop',
      'Maintain your speed and sound your horn',
      'Swerve around it without slowing',
      'Flash your headlights',
    ],
    answer: 0,
    explanation: 'A child may run out after the ball — slow down and prepare to stop.',
  },
  {
    id: 11,
    category: 'Hazard awareness',
    question: 'What does a flashing amber beacon on a vehicle usually mean?',
    options: [
      'It is a slow-moving vehicle',
      'It is a doctor answering an emergency call',
      'It is carrying dangerous goods',
      'It has broken down',
    ],
    answer: 0,
    explanation: 'Amber beacons warn of slow-moving or stationary works vehicles — give them room.',
  },
  {
    id: 12,
    category: 'Hazard awareness',
    question: 'A school crossing patrol shows a stop sign. What must you do?',
    options: [
      'Stop and wait until the road is clear',
      'Stop only if children are on the crossing',
      'Drive past slowly',
      'Sound your horn and continue',
    ],
    answer: 0,
    explanation: 'You must obey a school crossing patrol’s signal — it is legally enforceable.',
  },

  // --- Vulnerable road users ---
  {
    id: 13,
    category: 'Vulnerable road users',
    question: 'You are turning left into a side road and pedestrians are crossing it. What should you do?',
    options: [
      'Give way to them',
      'Sound your horn so they hurry',
      'Turn behind them quickly',
      'Wave them back onto the pavement',
    ],
    answer: 0,
    explanation: 'Pedestrians crossing or waiting to cross a road you are turning into have priority.',
  },
  {
    id: 14,
    category: 'Vulnerable road users',
    question: 'You want to turn left just ahead, and a cyclist is in front of you. What should you do?',
    options: [
      'Hold back until the cyclist has passed the junction',
      'Overtake and turn in front of them',
      'Drive alongside and turn together',
      'Sound your horn and turn',
    ],
    answer: 0,
    explanation: 'Never cut across a cyclist — wait behind until they are clear of the junction.',
  },
  {
    id: 15,
    category: 'Vulnerable road users',
    question: 'How much space should you leave when overtaking a cyclist at up to 30 mph?',
    options: ['At least 1.5 metres', 'Half a metre', 'One car door width', 'No set distance'],
    answer: 0,
    explanation: 'Leave at least 1.5 m at up to 30 mph, and more at higher speeds.',
  },

  // --- Motorway driving ---
  {
    id: 16,
    category: 'Motorway driving',
    question: 'What is the national speed limit for cars on a motorway?',
    options: ['70 mph', '60 mph', '80 mph', '50 mph'],
    answer: 0,
    explanation: 'Cars and motorcycles are limited to 70 mph on motorways unless signs show otherwise.',
  },
  {
    id: 17,
    category: 'Motorway driving',
    question: 'When may you normally use the hard shoulder?',
    options: [
      'In an emergency or breakdown',
      'To overtake slow traffic',
      'For a short rest',
      'To answer your phone',
    ],
    answer: 0,
    explanation: 'The hard shoulder is for emergencies only (or when signs open it as a lane).',
  },
  {
    id: 18,
    category: 'Motorway driving',
    question: 'A red X is displayed above your motorway lane. What does it mean?',
    options: [
      'The lane is closed — move out of it',
      'Traffic is slow ahead',
      'The lane is for emergency vehicles only',
      'A speed limit applies',
    ],
    answer: 0,
    explanation: 'A red X means the lane is closed; driving in it is dangerous and illegal.',
  },

  // --- Road signs ---
  {
    id: 19,
    category: 'Road signs',
    question: 'What shape and colour are most signs that give orders?',
    options: [
      'Circular with a red border',
      'Triangular with a red border',
      'Rectangular and blue',
      'Diamond-shaped and yellow',
    ],
    answer: 0,
    explanation: 'Circles give orders: red-bordered circles mostly tell you what you must not do.',
  },
  {
    id: 20,
    category: 'Road signs',
    question: 'What do triangular road signs do?',
    options: ['Warn you of hazards ahead', 'Give orders', 'Give directions', 'Mark parking zones'],
    answer: 0,
    explanation: 'Triangles warn — for example of bends, junctions, or crossings ahead.',
  },
  {
    id: 21,
    category: 'Road signs',
    question: 'What does a blue circular sign generally mean?',
    options: [
      'A positive instruction, such as turn left ahead',
      'A warning of a hazard',
      'A route for heavy vehicles only',
      'The end of a restriction',
    ],
    answer: 0,
    explanation: 'Blue circles give positive (mandatory) instructions, like minimum speeds or turn directions.',
  },

  // --- Rules of the road ---
  {
    id: 22,
    category: 'Rules of the road',
    question: 'At a pelican crossing, what does a flashing amber light mean?',
    options: [
      'Give way to pedestrians on the crossing, then go if it is clear',
      'Stop and wait for green',
      'Pedestrians must not start to cross',
      'The lights are out of order',
    ],
    answer: 0,
    explanation: 'Flashing amber at a pelican crossing means give way to anyone still crossing.',
  },
  {
    id: 23,
    category: 'Rules of the road',
    question: 'What is the national speed limit for cars on a single carriageway?',
    options: ['60 mph', '70 mph', '50 mph', '40 mph'],
    answer: 0,
    explanation: 'Unless signed otherwise, cars may do 60 mph on single carriageways.',
  },
  {
    id: 24,
    category: 'Rules of the road',
    question: 'Who has priority at an unmarked crossroads?',
    options: ['No one', 'Traffic going straight ahead', 'Traffic turning left', 'The larger vehicle'],
    answer: 0,
    explanation: 'No one has priority at an unmarked crossroads — approach slowly and be ready to stop.',
  },

  // --- Safety and your vehicle ---
  {
    id: 25,
    category: 'Safety and your vehicle',
    question: 'What is the legal minimum tread depth for car tyres?',
    options: [
      '1.6 mm across the central three-quarters of the tyre',
      '1 mm across the whole tyre',
      '2.5 mm on the edges',
      'There is no legal minimum',
    ],
    answer: 0,
    explanation: '1.6 mm across the central three-quarters, around the entire circumference.',
  },
  {
    id: 26,
    category: 'Safety and your vehicle',
    question: 'You must use headlights when visibility is seriously reduced. What does that generally mean?',
    options: [
      'When you cannot see for more than 100 metres',
      'When you cannot see for more than 500 metres',
      'Only after sunset',
      'Only in fog',
    ],
    answer: 0,
    explanation: 'Seriously reduced visibility generally means less than 100 m — use headlights.',
  },
  {
    id: 27,
    category: 'Safety and your vehicle',
    question: 'How can you drive more fuel-efficiently?',
    options: [
      'Accelerate smoothly and gently',
      'Keep the engine revs high',
      'Brake late and hard',
      'Carry a loaded roof rack',
    ],
    answer: 0,
    explanation: 'Smooth acceleration, gentle braking, and shedding drag or weight all save fuel.',
  },

  // --- Road and weather conditions ---
  {
    id: 28,
    category: 'Road conditions',
    question: 'Your steering suddenly feels light while driving in heavy rain. What does this mean?',
    options: [
      'Your tyres are aquaplaning on surface water',
      'Your tyres are over-inflated',
      'The road is icy',
      'The power steering has failed',
    ],
    answer: 0,
    explanation: 'Light steering in rain means aquaplaning — ease off the accelerator; do not brake hard.',
  },
  {
    id: 29,
    category: 'Road conditions',
    question: 'When may you use front fog lights?',
    options: [
      'When visibility falls below 100 metres',
      'Whenever it rains',
      'At night on unlit roads',
      'In slow-moving traffic',
    ],
    answer: 0,
    explanation: 'Fog lights are for visibility under 100 m — switch them off when it improves.',
  },
  {
    id: 30,
    category: 'Road conditions',
    question: 'When is a road likely to be most slippery after dry weather?',
    options: [
      'When rain first begins to fall',
      'After several hours of rain',
      'Only when temperatures are below zero',
      'Immediately after gritting',
    ],
    answer: 0,
    explanation: 'The first rain lifts oil and rubber off the surface, making it unusually slippery.',
  },

  // --- Other types of vehicle ---
  {
    id: 31,
    category: 'Other types of vehicle',
    question: 'Why should you keep well back from a long vehicle turning left at a junction?',
    options: [
      'It may swing out to the right before turning',
      'It will accelerate quickly',
      'Its brake lights may not work',
      'It has priority over cars',
    ],
    answer: 0,
    explanation: 'Long vehicles often need to swing wide — never move into the gap beside them.',
  },
  {
    id: 32,
    category: 'Other types of vehicle',
    question: 'You are overtaking a motorcyclist in strong crosswinds. What should you do?',
    options: [
      'Allow extra room in case they are blown off course',
      'Pass as closely as possible',
      'Sound your horn while passing',
      'Match their speed alongside them',
    ],
    answer: 0,
    explanation: 'Wind gusts can push riders sideways — give them plenty of space.',
  },

  // --- Documents and incidents ---
  {
    id: 33,
    category: 'Documents & incidents',
    question: 'Your licence is revoked if you get six penalty points within how long of passing your test?',
    options: ['Two years', 'One year', 'Five years', 'Six months'],
    answer: 0,
    explanation: 'New drivers who reach six points within two years must retake both theory and practical tests.',
  },
  {
    id: 34,
    category: 'Documents & incidents',
    question: 'An injured motorcyclist is lying in the road. When should their helmet be removed?',
    options: [
      'Only if it is essential — for example to restore breathing',
      'Immediately, to help them breathe',
      'As soon as the engine is off',
      'Once they are sitting up',
    ],
    answer: 0,
    explanation: 'Removing a helmet can worsen neck injuries — leave it on unless absolutely necessary.',
  },
  {
    id: 35,
    category: 'Documents & incidents',
    question: 'A new car needs its first MOT test after how many years?',
    options: ['Three years', 'One year', 'Five years', 'Ten years'],
    answer: 0,
    explanation: 'Cars need an MOT once they are three years old, then every year.',
  },
  {
    id: 36,
    category: 'Documents & incidents',
    question: 'What is the minimum insurance cover you must have to drive on public roads?',
    options: ['Third party', 'Comprehensive', 'Third party, fire and theft', 'None if the car is taxed'],
    answer: 0,
    explanation: 'Third-party cover is the legal minimum — it protects other people, not your own car.',
  },
];
