import type { TheoryQuestion } from './theory-questions';

/**
 * Vehicle-safety ("show me, tell me") practice questions, written for this
 * app in original wording. They cover the standard checks asked at the start
 * of the practical test: "tell me" knowledge before driving, and "show me"
 * controls used on the move. The official current list lives on gov.uk.
 */

let nextId = 500;
const q = (
  category: 'Tell me' | 'Show me',
  question: string,
  options: [string, string, string, string],
  explanation: string
): TheoryQuestion => ({ id: nextId++, category, question, options, answer: 0, explanation });

export const SAFETY_QUESTIONS: TheoryQuestion[] = [
  // ============ Tell me (before driving) ============
  q(
    'Tell me',
    'Before setting off, how can you tell the brakes are working properly?',
    [
      'The pedal should feel firm, not spongy, and the car shouldn’t pull to one side when you test them moving off',
      'The brake warning light stays on while driving',
      'The handbrake clicks at least ten times',
      'The pedal sinks slowly to the floor when held',
    ],
    'Spongy or slack brakes, or pulling to one side, mean the brakes need checking before you drive.'
  ),
  q(
    'Tell me',
    'How would you make sure your tyre pressures are correct?',
    [
      'Check them against the handbook figures with a reliable gauge, when the tyres are cold',
      'Press each tyre with your thumb before driving',
      'Check them straight after a motorway run',
      'Look at the tyres — correct pressure is visible',
    ],
    'Use the manufacturer’s figures, a proper gauge, cold tyres — and remember the valve caps after.'
  ),
  q(
    'Tell me',
    'How should a head restraint be adjusted?',
    [
      'So its rigid part is at least level with your eyes or the top of your ears, and as close to your head as comfortable',
      'As low as it will go, touching your shoulders',
      'So you can rest your head back on it while driving',
      'It makes no difference — it’s only a comfort feature',
    ],
    'A correctly set head restraint protects your neck in a collision — it’s a restraint, not a rest.'
  ),
  q(
    'Tell me',
    'How would you know your tyres have enough tread and are safe to use?',
    [
      'At least 1.6 mm of tread across the central three-quarters, with no cuts or bulges',
      'At least 1 mm of tread anywhere on the tyre',
      'The tyres look roughly round and hold air',
      'Tread only matters on the front tyres',
    ],
    'Check depth across the central three-quarters and all the way round — and look for damage.'
  ),
  q(
    'Tell me',
    'How would you check the headlights and tail lights are working?',
    [
      'Switch them on (ignition on if needed) and walk round the car to check',
      'Flash other drivers and see if they flash back',
      'They’re checked automatically at every MOT, so no check is needed',
      'Turn them on and listen for the relay click',
    ],
    'A simple walk-round with the lights switched on confirms they all work.'
  ),
  q(
    'Tell me',
    'How would you know if there was a problem with the anti-lock braking system?',
    [
      'The ABS warning light would show on the dashboard',
      'The brake pedal would feel lighter than usual',
      'The car would pull to the left when accelerating',
      'A buzzer sounds every time you brake',
    ],
    'ABS faults are shown by a dashboard warning light — get it checked if it stays on.'
  ),
  q(
    'Tell me',
    'How would you check the direction indicators are working?',
    [
      'Switch on the hazard lights and walk round the car checking each indicator',
      'Watch the dashboard arrows only',
      'Ask another driver to signal back',
      'Indicators can only be checked by a garage',
    ],
    'Hazard lights flash every indicator at once, so one walk-round covers them all.'
  ),
  q(
    'Tell me',
    'How would you check the brake lights are working?',
    [
      'Press the brake pedal and check reflections in a window or door, or ask someone to look',
      'They come on with the headlights, so check those instead',
      'Pump the pedal and listen',
      'Brake lights cannot be checked by one person',
    ],
    'Reflections in windows, garage doors, or a helper let you check them alone.'
  ),
  q(
    'Tell me',
    'How would you check the power-assisted steering is working before a journey?',
    [
      'The steering should feel heavy with the engine off and become lighter as you start the engine or move off',
      'The wheel should spin freely with the engine off',
      'A green steering light shows on the dash when it works',
      'Power steering can’t be checked by the driver',
    ],
    'Gentle pressure on the wheel while starting up, or just moving off, shows the assistance working.'
  ),
  q(
    'Tell me',
    'When would you use rear fog lights, and how do you know they’re on?',
    [
      'When visibility drops below about 100 metres — a warning light shows on the dashboard',
      'Whenever it rains — they come on with the wipers',
      'At night on unlit roads — no warning light shows',
      'Any time you like, for better visibility',
    ],
    'Fog lights are for seriously reduced visibility only, and the dash light confirms they’re on.'
  ),
  q(
    'Tell me',
    'How do you switch from dipped to main beam, and how do you know main beam is on?',
    [
      'Use the light stalk/switch — a blue warning light shows on the dashboard',
      'Main beam comes on automatically above 40 mph',
      'A green light on the dash shows main beam',
      'Both beams are the same brightness, so there’s nothing to check',
    ],
    'The blue dashboard symbol means main beam — dip it for oncoming traffic.'
  ),
  q(
    'Tell me',
    'How would you check the engine has enough oil?',
    [
      'Use the dipstick or oil gauge and check the level is between the minimum and maximum marks',
      'Listen for engine rattle when starting',
      'Check the oil light comes on while driving',
      'Oil never needs checking between services',
    ],
    'Pull the dipstick, wipe, re-dip, and read the level against the min/max marks.'
  ),
  q(
    'Tell me',
    'How would you check the engine has enough coolant?',
    [
      'Look at the markings on the coolant reservoir and top up to the correct level if low',
      'Open the radiator cap while the engine is hot',
      'Coolant is sealed for life and never checked',
      'Check the temperature gauge before starting',
    ],
    'Use the reservoir’s min/max marks — and never open the system while it’s hot.'
  ),
  q(
    'Tell me',
    'How would you check you have enough brake fluid?',
    [
      'Check the level against the markings on the brake fluid reservoir',
      'Press the brake pedal fifty times and see if it fades',
      'Brake fluid is only checked at the MOT',
      'Look for fluid on the ground under the engine',
    ],
    'The translucent reservoir under the bonnet has min/max marks — low fluid needs investigating.'
  ),

  // ============ Show me (while driving) ============
  q(
    'Show me',
    'When it’s safe, how would you wash and clean the front windscreen?',
    [
      'Operate the washer control so the washers spray and the wipers clear the screen',
      'Turn the wipers on dry, without washer fluid',
      'Open the window and wipe it by hand',
      'Switch on the demister',
    ],
    'Washers and wipers together — and keep the washer bottle topped up so this always works.'
  ),
  q(
    'Show me',
    'When it’s safe, how would you wash and clean the rear windscreen?',
    [
      'Operate the rear washer and wiper control',
      'Switch on the heated rear screen',
      'Open the boot and wipe it at the next stop',
      'Use the front washer control twice',
    ],
    'Most cars put the rear washer on a twist or push of the wiper stalk — know where it is.'
  ),
  q(
    'Show me',
    'How would you demist the front windscreen?',
    [
      'Direct warm air at the screen (or use the screen setting) and adjust the fan and heat',
      'Switch on the heated rear screen',
      'Open all the windows fully',
      'Wipe the inside of the glass while driving',
    ],
    'The windscreen airflow setting, warm air, and higher fan speed clear mist fastest.'
  ),
  q(
    'Show me',
    'How would you demist the rear windscreen?',
    [
      'Switch on the heated rear screen and check its warning light comes on',
      'Point the front vents backwards',
      'Use the rear washer to rinse the mist off',
      'It clears on its own within a minute',
    ],
    'The heated rear screen has its own switch and indicator light — usually a rectangle with wavy arrows.'
  ),
  q(
    'Show me',
    'When it’s safe, how would you switch on your dipped headlights?',
    [
      'Use the light switch or stalk and check the dipped-beam symbol shows on the dash',
      'Flash the main beam twice',
      'Turn on the hazard lights',
      'Headlights only work when it’s dark outside',
    ],
    'Know your own car’s switch — this one is usually asked while driving.'
  ),
  q(
    'Show me',
    'If you had to drive in fog, how would you switch on the rear fog light?',
    [
      'Use its switch (dipped headlights on first) and check the fog-light symbol on the dash',
      'Pull the main-beam stalk twice',
      'It comes on automatically in fog',
      'Turn the light switch to sidelights',
    ],
    'Rear fog lights need dipped beam on first, and the amber dash symbol confirms them.'
  ),
  q(
    'Show me',
    'When it’s safe, how would you show the horn works?',
    [
      'Press the horn control, usually the centre of the steering wheel',
      'Flash the headlights instead — it means the same',
      'The horn can only be tested when stationary off the road',
      'Press the hazard light switch',
    ],
    'A quick press is all that’s asked — know exactly where it is on your car.'
  ),
];
