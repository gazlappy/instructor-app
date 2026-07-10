/**
 * Original practice questions written in the style of the UK theory test,
 * based on Highway Code rules and organized by the official 14 test
 * categories. This is NOT the licensed DVSA question bank — all wording is
 * original. The correct option is always index `answer` (0); options are
 * shuffled at quiz time.
 */

export interface TheoryQuestion {
  id: number;
  category: string;
  question: string;
  options: [string, string, string, string];
  answer: number; // index into options
  explanation: string;
}

let nextId = 1;
const q = (
  category: string,
  question: string,
  options: [string, string, string, string],
  explanation: string
): TheoryQuestion => ({ id: nextId++, category, question, options, answer: 0, explanation });

export const THEORY_QUESTIONS: TheoryQuestion[] = [
  // ============ Alertness ============
  q(
    'Alertness',
    'You feel tired during a long motorway journey. What should you do?',
    [
      'Leave at the next exit and take a break',
      'Open the window and carry on',
      'Turn the radio up',
      'Speed up to finish the journey sooner',
    ],
    'Fresh air and music only mask tiredness briefly. Stop somewhere safe and rest.'
  ),
  q(
    'Alertness',
    'Before making a U-turn in the road, what should you do?',
    [
      'Check mirrors and look around for a final check',
      'Sound your horn to warn others',
      'Signal and turn immediately',
      'Flash your headlights',
    ],
    'Mirrors have blind spots — always look round over your shoulder before a U-turn.'
  ),
  q(
    'Alertness',
    'Why should you switch your phone to silent or voicemail before driving?',
    [
      'So you are not distracted while driving',
      'To save the battery',
      'Because calls are more expensive while moving',
      'So passengers cannot hear it',
    ],
    'Even hands-free calls reduce concentration; deal with messages after you park.'
  ),
  q(
    'Alertness',
    'What should you do just before moving away from the side of the road?',
    [
      'Check your blind spot over your shoulder',
      'Rely on your mirrors alone',
      'Signal and pull out straight away',
      'Rev the engine to warn others',
    ],
    'A cyclist or car can sit in the area your mirrors miss — a shoulder check catches them.'
  ),
  q(
    'Alertness',
    'You are dazzled at night by the headlights of a vehicle behind. What should you do?',
    [
      'Set your interior mirror to its anti-dazzle position',
      'Brake to make the driver drop back',
      'Close your eyes briefly',
      'Adjust your door mirrors outward',
    ],
    'The anti-dazzle position dims the reflection while still letting you see behind.'
  ),
  q(
    'Alertness',
    'When must you not sound your horn in a built-up area?',
    [
      'Between 11:30 pm and 7:00 am, unless another road user poses a danger',
      'At any time of day',
      'Between 8:00 pm and 8:00 am in all circumstances',
      'Only when passing a hospital',
    ],
    'The horn is banned in built-up areas at night except to avoid danger from a moving vehicle.'
  ),
  q(
    'Alertness',
    'You cannot see clearly behind while reversing. What should you do?',
    [
      'Ask someone to guide you',
      'Reverse quickly to get it over with',
      'Open the door and lean out while reversing',
      'Sound your horn and reverse slowly',
    ],
    'If you cannot see, get help — never reverse blind.'
  ),
  q(
    'Alertness',
    'Why should you avoid hanging objects from your interior mirror?',
    [
      'They can restrict your view and distract you',
      'They may damage the mirror glass',
      'They make the car look untidy',
      'They increase fuel consumption',
    ],
    'Anything swinging in your eyeline is both a blind spot and a distraction.'
  ),
  q(
    'Alertness',
    'On a long journey, how often is it recommended to take a break?',
    [
      'At least every two hours',
      'Every five hours',
      'Only when you feel sleepy',
      'Once, halfway through',
    ],
    'A 15-minute break every two hours keeps concentration up — don’t wait until you’re drowsy.'
  ),
  q(
    'Alertness',
    'You are following a large vehicle and cannot see the road ahead. What should you do?',
    [
      'Drop back to improve your view',
      'Move closer so you can nip past',
      'Flash your headlights until it pulls over',
      'Overtake immediately',
    ],
    'Staying back opens up your view past the vehicle and gives you time to react.'
  ),

  // ============ Attitude ============
  q(
    'Attitude',
    'A vehicle is following you too closely. What should you do?',
    [
      'Gradually increase the gap between you and the vehicle ahead',
      'Brake sharply to warn the driver',
      'Speed up to pull away',
      'Move to the middle of the road',
    ],
    'A bigger gap ahead lets you brake gently, giving the tailgater time to react.'
  ),
  q(
    'Attitude',
    'When should you flash your headlights at other road users?',
    [
      'Only to let them know you are there',
      'To show you are giving way',
      'To tell them to go first',
      'To greet other drivers you know',
    ],
    'The Highway Code gives flashing headlights one meaning: letting others know you are there.'
  ),
  q(
    'Attitude',
    'A bus is signalling to pull out from a bus stop ahead. What should you do?',
    [
      'Give way to it if you can do so safely',
      'Accelerate past before it moves',
      'Sound your horn',
      'Flash your headlights and keep your speed',
    ],
    'Give buses priority when safe — they carry many people and hold up less traffic once moving.'
  ),
  q(
    'Attitude',
    'Another driver begins to overtake you. What should you do?',
    [
      'Keep a steady course and speed',
      'Accelerate so they cannot pass',
      'Brake hard to let them in quickly',
      'Move closer to the centre line',
    ],
    'Making the overtake harder endangers everyone — stay predictable and let them pass.'
  ),
  q(
    'Attitude',
    'An ambulance with flashing blue lights is behind you. What should you do?',
    [
      'Pull over and let it pass when you can do so safely and legally',
      'Stop immediately wherever you are',
      'Speed up to stay ahead of it',
      'Ignore it until it uses its siren',
    ],
    'Help emergency vehicles through, but without stopping dangerously or breaking the law.'
  ),
  q(
    'Attitude',
    'A pedestrian is waiting at a zebra crossing. What should you do?',
    [
      'Slow down and be prepared to stop',
      'Wave them across',
      'Continue — they must wait for a gap',
      'Sound your horn to let them cross',
    ],
    'Give way at zebra crossings; never wave people across, as other traffic may not stop.'
  ),
  q(
    'Attitude',
    'When may you use hazard warning lights while moving?',
    [
      'On a motorway or unrestricted dual carriageway, to warn of a hazard ahead',
      'Whenever you slow down suddenly',
      'When you are being overtaken',
      'When parking on double yellow lines',
    ],
    'Briefly using hazards on fast roads warns traffic behind of an obstruction ahead.'
  ),
  q(
    'Attitude',
    'When should you dip your headlights?',
    [
      'When meeting oncoming traffic or following another vehicle',
      'Only in fog',
      'Only in built-up areas',
      'When driving above 40 mph',
    ],
    'Dipping prevents dazzling drivers ahead of you or coming towards you.'
  ),
  q(
    'Attitude',
    'You are driving slowly on a narrow road and a queue has built up behind you. What should you do?',
    [
      'Pull over somewhere safe and let the traffic pass',
      'Speed up beyond your comfort level',
      'Ignore the queue',
      'Wave vehicles past on a blind bend',
    ],
    'Letting the queue pass is courteous and prevents risky overtakes.'
  ),
  q(
    'Attitude',
    'What is the horn for?',
    [
      'Warning other road users of your presence',
      'Showing annoyance at other drivers',
      'Greeting pedestrians you know',
      'Telling slower traffic to move over',
    ],
    'The horn warns others you are there — it is not for rebuking or greeting.'
  ),

  // ============ Safety and your vehicle ============
  q(
    'Safety and your vehicle',
    'What is the legal minimum tread depth for car tyres?',
    [
      '1.6 mm across the central three-quarters of the tyre',
      '1 mm across the whole tyre',
      '2.5 mm on the edges',
      'There is no legal minimum',
    ],
    '1.6 mm across the central three-quarters, around the entire circumference.'
  ),
  q(
    'Safety and your vehicle',
    'You must use headlights when visibility is seriously reduced. What does that generally mean?',
    [
      'When you cannot see for more than 100 metres',
      'When you cannot see for more than 500 metres',
      'Only after sunset',
      'Only in fog',
    ],
    'Seriously reduced visibility generally means less than 100 m — use headlights.'
  ),
  q(
    'Safety and your vehicle',
    'How can you drive more fuel-efficiently?',
    [
      'Accelerate smoothly and gently',
      'Keep the engine revs high',
      'Brake late and hard',
      'Carry a loaded roof rack',
    ],
    'Smooth acceleration, gentle braking, and shedding drag or weight all save fuel.'
  ),
  q(
    'Safety and your vehicle',
    'What is a likely cause of heavy steering?',
    [
      'Under-inflated tyres',
      'Over-inflated tyres',
      'A worn gearbox',
      'New brake pads',
    ],
    'Soft tyres drag on the road, making the steering feel heavy — check pressures.'
  ),
  q(
    'Safety and your vehicle',
    'When should you check your tyre pressures?',
    [
      'When the tyres are cold',
      'Straight after a motorway journey',
      'Only at services',
      'When the tyres are warm',
    ],
    'Driving heats tyres and raises pressure, giving a false reading — check them cold.'
  ),
  q(
    'Safety and your vehicle',
    'The oil pressure warning light stays on while driving. What should you do?',
    [
      'Stop as soon as it is safe and investigate',
      'Carry on to your destination',
      'Drive faster to circulate the oil',
      'Ignore it if the engine sounds normal',
    ],
    'Low oil pressure can wreck an engine in minutes — stop safely and check.'
  ),
  q(
    'Safety and your vehicle',
    'You leave your car unattended for a few minutes. What must you do?',
    [
      'Stop the engine and apply the parking brake',
      'Leave the engine running to stay warm',
      'Leave the hazard lights on instead of the handbrake',
      'Leave it in neutral with the engine on',
    ],
    'Never leave a vehicle unattended with the engine running.'
  ),
  q(
    'Safety and your vehicle',
    'What can cause uneven tyre wear?',
    [
      'Incorrect wheel alignment',
      'Using the air conditioning',
      'Driving in low gears',
      'Frequent short journeys',
    ],
    'Misaligned wheels, faulty suspension, or wrong pressures all wear tyres unevenly.'
  ),
  q(
    'Safety and your vehicle',
    'How should you dispose of a used vehicle battery?',
    [
      'Take it to a recycling centre or garage',
      'Put it in your household bin',
      'Bury it',
      'Leave it beside a public bin',
    ],
    'Batteries contain acid and lead — they must be disposed of safely.'
  ),
  q(
    'Safety and your vehicle',
    'Who is responsible for making sure a 10-year-old passenger wears a seat belt?',
    [
      'The driver',
      'The child',
      'The front-seat passenger',
      'Nobody — belts are optional under 14',
    ],
    'The driver is legally responsible for passengers under 14 using belts or restraints.'
  ),

  // ============ Safety margins ============
  q(
    'Safety margins',
    'What is the typical overall stopping distance at 50 mph on a dry road?',
    ['53 metres', '36 metres', '73 metres', '96 metres'],
    'At 50 mph: 15 m thinking distance + 38 m braking distance = 53 m.'
  ),
  q(
    'Safety margins',
    'In heavy rain, what time gap should you leave to the vehicle in front?',
    ['At least four seconds', 'Two seconds', 'One second', 'No gap is needed below 30 mph'],
    'Stopping distances at least double in the wet — double the two-second rule.'
  ),
  q(
    'Safety margins',
    'Braking distances on ice can be how much further than on a dry road?',
    ['Ten times as far', 'Twice as far', 'Four times as far', 'The same if you brake gently'],
    'On ice, tyres have very little grip — allow up to ten times the normal distance.'
  ),
  q(
    'Safety margins',
    'In good, dry conditions, what time gap should you leave to the vehicle ahead?',
    ['At least two seconds', 'Half a second', 'Ten seconds', 'One car length at any speed'],
    'The two-second rule gives you time to react and stop in good conditions.'
  ),
  q(
    'Safety margins',
    'What is the typical overall stopping distance at 70 mph on a dry road?',
    ['96 metres', '53 metres', '73 metres', '120 metres'],
    'At 70 mph: 21 m thinking distance + 75 m braking distance = 96 m — about 24 car lengths.'
  ),
  q(
    'Safety margins',
    'What is the typical thinking distance at 70 mph?',
    ['21 metres', '9 metres', '38 metres', '53 metres'],
    'Thinking distance is roughly 3 m per 10 mph — 21 m at 70 mph, before you even brake.'
  ),
  q(
    'Safety margins',
    'You have just driven through a flooded stretch of road. What should you do?',
    [
      'Test your brakes gently as soon as it is safe',
      'Stop and open the bonnet',
      'Drive fast to dry the engine',
      'Nothing — water has no effect on brakes',
    ],
    'Wet brakes grip poorly — check them, and dry them with light braking if needed.'
  ),
  q(
    'Safety margins',
    'How should you brake in icy conditions?',
    [
      'Gently and in plenty of time',
      'Hard and late',
      'With the clutch down throughout',
      'Using the parking brake',
    ],
    'Harsh braking locks wheels on ice — brake early, gently, and in a straight line.'
  ),
  q(
    'Safety margins',
    'What is the most common cause of skidding?',
    ['The driver', 'The tyres', 'The weather', 'The road surface'],
    'Skids are almost always provoked by harsh steering, braking, or acceleration.'
  ),
  q(
    'Safety margins',
    'You are about to pass a high-sided vehicle on a windy day. What should you allow for?',
    [
      'Sudden gusts as you clear its shelter',
      'The vehicle braking suddenly',
      'Reduced engine power',
      'Your brakes being less effective',
    ],
    'Large vehicles block the wind — expect a gust as you pass and keep a firm grip.'
  ),

  // ============ Hazard awareness ============
  q(
    'Hazard awareness',
    'A ball bounces out from between parked cars ahead. What should you do?',
    [
      'Slow down and be ready to stop',
      'Maintain your speed and sound your horn',
      'Swerve around it without slowing',
      'Flash your headlights',
    ],
    'A child may run out after the ball — slow down and prepare to stop.'
  ),
  q(
    'Hazard awareness',
    'What does a flashing amber beacon on a vehicle usually mean?',
    [
      'It is a slow-moving vehicle',
      'It is a doctor answering an emergency call',
      'It is carrying dangerous goods',
      'It has broken down',
    ],
    'Amber beacons warn of slow-moving or stationary works vehicles — give them room.'
  ),
  q(
    'Hazard awareness',
    'A school crossing patrol shows a stop sign. What must you do?',
    [
      'Stop and wait until the road is clear',
      'Stop only if children are on the crossing',
      'Drive past slowly',
      'Sound your horn and continue',
    ],
    'You must obey a school crossing patrol’s signal — it is legally enforceable.'
  ),
  q(
    'Hazard awareness',
    'Why do you need extra care driving past shops and schools?',
    [
      'Pedestrians may step into the road unexpectedly',
      'The speed limit is always 20 mph',
      'Parking is not allowed there',
      'Road surfaces are usually worse',
    ],
    'Busy pedestrian areas mean people — especially children — can appear suddenly.'
  ),
  q(
    'Hazard awareness',
    'A car pulls out of a junction in front of you, forcing you to brake. What should you do?',
    [
      'Drop back and stay calm',
      'Overtake immediately to get past',
      'Flash your lights and sound the horn',
      'Drive close behind to make a point',
    ],
    'Retaliation causes crashes — restore your safety gap and let it go.'
  ),
  q(
    'Hazard awareness',
    'You are emerging from a junction with a restricted view. What should you do?',
    [
      'Edge forward slowly until you can see clearly',
      'Pull out quickly before traffic arrives',
      'Rely on the other traffic to avoid you',
      'Sound your horn and emerge',
    ],
    'Creep and peep: move forward gradually until you can see it is safe to go.'
  ),
  q(
    'Hazard awareness',
    'How does alcohol affect driving?',
    [
      'It slows reactions and gives false confidence',
      'It improves concentration',
      'It only affects you above the legal limit',
      'It sharpens your judgement of speed',
    ],
    'Any alcohol degrades judgement, reactions, and coordination — the safest amount is none.'
  ),
  q(
    'Hazard awareness',
    'You are prescribed medicine that may cause drowsiness. What should you do?',
    [
      'Ask your doctor or pharmacist whether it is safe to drive',
      'Drive only short distances',
      'Take it only after your journeys',
      'Drink coffee to counteract it',
    ],
    'Some medicines impair driving as much as alcohol — check before you drive.'
  ),
  q(
    'Hazard awareness',
    'Two elderly pedestrians are partway across the road ahead. What should you do?',
    [
      'Be patient and allow them time to cross',
      'Rev the engine so they hurry',
      'Steer closely around them',
      'Wave them back to the kerb',
    ],
    'Older pedestrians may need longer — wait without pressuring them.'
  ),
  q(
    'Hazard awareness',
    'Why are motorcyclists easy to miss at junctions?',
    [
      'They are small and easily hidden by other vehicles or pillars',
      'They always travel too fast',
      'Their headlights are usually off',
      'They ride in the gutter',
    ],
    'Look twice for bikes — their narrow profile hides in blind spots and behind obstructions.'
  ),

  // ============ Vulnerable road users ============
  q(
    'Vulnerable road users',
    'You are turning left into a side road and pedestrians are crossing it. What should you do?',
    [
      'Give way to them',
      'Sound your horn so they hurry',
      'Turn behind them quickly',
      'Wave them back onto the pavement',
    ],
    'Pedestrians crossing or waiting to cross a road you are turning into have priority.'
  ),
  q(
    'Vulnerable road users',
    'You want to turn left just ahead, and a cyclist is in front of you. What should you do?',
    [
      'Hold back until the cyclist has passed the junction',
      'Overtake and turn in front of them',
      'Drive alongside and turn together',
      'Sound your horn and turn',
    ],
    'Never cut across a cyclist — wait behind until they are clear of the junction.'
  ),
  q(
    'Vulnerable road users',
    'How much space should you leave when overtaking a cyclist at up to 30 mph?',
    ['At least 1.5 metres', 'Half a metre', 'One car door width', 'No set distance'],
    'Leave at least 1.5 m at up to 30 mph, and more at higher speeds.'
  ),
  q(
    'Vulnerable road users',
    'How should you pass a horse and rider?',
    [
      'Slowly (max 10 mph) and leaving at least 2 metres of space',
      'Quickly to minimise the disturbance',
      'Closely, so you stay on your side of the road',
      'With a warning blast of the horn',
    ],
    'Horses spook easily — the Highway Code asks for under 10 mph and at least 2 m clearance.'
  ),
  q(
    'Vulnerable road users',
    'A pedestrian carries a white cane with a red band. What does this mean?',
    [
      'They are deaf as well as blind',
      'They are a crossing warden',
      'They have a guide dog nearby',
      'They are partially sighted only',
    ],
    'A white cane means visual impairment; red banding means the person is also deaf.'
  ),
  q(
    'Vulnerable road users',
    'An ice cream van is stopped ahead with children around it. What should you do?',
    [
      'Slow right down and be ready to stop',
      'Maintain speed but sound your horn',
      'Pass quickly before children move',
      'Flash your lights as a warning',
    ],
    'Children near the van are thinking about ice cream, not traffic — expect them to run out.'
  ),
  q(
    'Vulnerable road users',
    'The vehicle ahead is being driven slowly and hesitantly by a learner. What should you do?',
    [
      'Be patient and keep a safe distance',
      'Overtake immediately, whatever the road',
      'Drive close behind to encourage them',
      'Sound your horn',
    ],
    'Everyone was a learner once — pressure from behind makes new drivers worse, not better.'
  ),
  q(
    'Vulnerable road users',
    'Why should you check carefully for motorcyclists before turning right?',
    [
      'One may be overtaking you',
      'They always have priority',
      'They are required to give way',
      'Their brakes are weaker than yours',
    ],
    'A bike may be passing you as you turn — check mirrors and blind spot first.'
  ),
  q(
    'Vulnerable road users',
    'On a country road without a pavement, where should you expect pedestrians?',
    [
      'On your side of the road, walking towards you',
      'Only on the grass verge',
      'Walking with their backs to traffic',
      'Never — pedestrians are not allowed',
    ],
    'Walkers are advised to face oncoming traffic — expect them on your side after bends.'
  ),
  q(
    'Vulnerable road users',
    'What should you do before opening your car door on the road side?',
    [
      'Check over your shoulder for cyclists and traffic',
      'Open it quickly to claim the space',
      'Rely on your door mirror alone',
      'Sound the horn first',
    ],
    'A shoulder check (the "Dutch reach" helps) prevents dooring passing cyclists.'
  ),

  // ============ Other types of vehicle ============
  q(
    'Other types of vehicle',
    'Why should you keep well back from a long vehicle turning left at a junction?',
    [
      'It may swing out to the right before turning',
      'It will accelerate quickly',
      'Its brake lights may not work',
      'It has priority over cars',
    ],
    'Long vehicles often need to swing wide — never move into the gap beside them.'
  ),
  q(
    'Other types of vehicle',
    'You are overtaking a motorcyclist in strong crosswinds. What should you do?',
    [
      'Allow extra room in case they are blown off course',
      'Pass as closely as possible',
      'Sound your horn while passing',
      'Match their speed alongside them',
    ],
    'Wind gusts can push riders sideways — give them plenty of space.'
  ),
  q(
    'Other types of vehicle',
    'Why do trams need particular care?',
    [
      'They cannot steer to avoid you',
      'They are slower than other traffic',
      'They always carry standing passengers',
      'They may reverse without warning',
    ],
    'Trams are fixed to their rails and quiet — stay out of their path and marked lanes.'
  ),
  q(
    'Other types of vehicle',
    'A lorry ahead is throwing up spray in heavy rain. What should you do?',
    [
      'Drop back until you can see better',
      'Follow closely in its wheel tracks',
      'Overtake straight away',
      'Use main-beam headlights',
    ],
    'Spray can blind you completely — drop back out of it before considering anything else.'
  ),
  q(
    'Other types of vehicle',
    'A bus has stopped at a bus stop ahead. What hazard should you anticipate?',
    [
      'Pedestrians crossing the road in front of the bus',
      'The bus reversing',
      'The bus turning around',
      'Its doors opening onto the road',
    ],
    'People leaving the bus often cross immediately, hidden by the bus itself.'
  ),
  q(
    'Other types of vehicle',
    'At a roundabout, why might a long vehicle approach in the left lane signalling right?',
    [
      'It may need to straddle lanes to make the turn',
      'The driver is lost',
      'Long vehicles must always use the left lane',
      'Its indicators are faulty',
    ],
    'Artics need extra width — do not squeeze alongside them on roundabouts.'
  ),
  q(
    'Other types of vehicle',
    'You are stuck behind a slow-moving tractor. What should you do?',
    [
      'Stay patient and overtake only when it is safe',
      'Follow within a metre to shorten the overtake',
      'Flash your lights until it pulls over',
      'Overtake on a blind bend while it is slow',
    ],
    'Most tractor drivers pull in when they can — a botched overtake is far worse than a delay.'
  ),
  q(
    'Other types of vehicle',
    'Which road user is most affected by strong crosswinds?',
    ['A motorcyclist', 'A car driver', 'A tram', 'A tracked excavator'],
    'Two-wheelers and high-sided vehicles suffer most — allow them extra space in wind.'
  ),
  q(
    'Other types of vehicle',
    'A school bus is stopped with its hazard lights on. What should you do?',
    [
      'Slow down — children may cross from in front or behind it',
      'Pass at normal speed',
      'Stop behind it and wait indefinitely',
      'Sound your horn as you pass',
    ],
    'Children near a school bus are unpredictable — pass slowly and be ready to stop.'
  ),
  q(
    'Other types of vehicle',
    'What is the maximum speed of a class 3 powered wheelchair or mobility scooter on the road?',
    ['8 mph', '4 mph', '15 mph', '20 mph'],
    'Class 3 vehicles are limited to 8 mph on the road (4 mph on pavements).'
  ),

  // ============ Vehicle handling ============
  q(
    'Vehicle handling',
    'Your steering suddenly feels light while driving in heavy rain. What does this mean?',
    [
      'Your tyres are aquaplaning on surface water',
      'Your tyres are over-inflated',
      'The road is icy',
      'The power steering has failed',
    ],
    'Light steering in rain means aquaplaning — ease off the accelerator; do not brake hard.'
  ),
  q(
    'Vehicle handling',
    'When may you use front fog lights?',
    [
      'When visibility falls below 100 metres',
      'Whenever it rains',
      'At night on unlit roads',
      'In slow-moving traffic',
    ],
    'Fog lights are for visibility under 100 m — switch them off when it improves.'
  ),
  q(
    'Vehicle handling',
    'When is a road likely to be most slippery after dry weather?',
    [
      'When rain first begins to fall',
      'After several hours of rain',
      'Only when temperatures are below zero',
      'Immediately after gritting',
    ],
    'The first rain lifts oil and rubber off the surface, making it unusually slippery.'
  ),
  q(
    'Vehicle handling',
    'How can you control your speed on a long, steep downhill stretch?',
    [
      'Select a lower gear and use engine braking',
      'Coast in neutral to save fuel',
      'Ride the brakes all the way down',
      'Keep the clutch pressed down',
    ],
    'Engine braking spares your brakes from overheating on long descents.'
  ),
  q(
    'Vehicle handling',
    'Why is coasting (rolling in neutral or with the clutch down) a bad idea?',
    [
      'It reduces your control of the vehicle',
      'It wears out the clutch',
      'It uses more fuel',
      'It damages the gearbox',
    ],
    'Without engine braking you have less control, especially downhill.'
  ),
  q(
    'Vehicle handling',
    'How should you drive in thick fog?',
    [
      'Slow down and leave a much bigger gap',
      'Follow the tail lights ahead closely',
      'Use main beam for better vision',
      'Straddle the centre line',
    ],
    'Tail-light chasing is a classic fog crash — slow down and keep well back.'
  ),
  q(
    'Vehicle handling',
    'How should you move off on snow?',
    [
      'Gently, in a higher gear such as second',
      'In first gear with high revs',
      'With the parking brake half on',
      'Quickly, before losing grip',
    ],
    'A higher gear and gentle throttle stop the wheels spinning on snow.'
  ),
  q(
    'Vehicle handling',
    'What are rumble strips across the road designed to do?',
    [
      'Alert you and encourage you to slow down',
      'Test your suspension',
      'Mark private roads',
      'Provide grip in icy weather',
    ],
    'The noise and vibration warn you of a hazard such as a roundabout or junction ahead.'
  ),
  q(
    'Vehicle handling',
    'The rear of your car skids to the right. What should you do?',
    [
      'Steer gently to the right, into the skid',
      'Steer hard to the left',
      'Brake firmly and steer straight',
      'Accelerate out of it',
    ],
    'Steer the same way the rear is sliding, easing off the pedals, to bring the car straight.'
  ),
  q(
    'Vehicle handling',
    'How can very hot weather affect the road?',
    [
      'The surface can soften, reducing grip',
      'Braking distances halve',
      'Tyre pressures drop sharply',
      'The camber reverses',
    ],
    'Melting tarmac affects braking and steering — and dazzle from bright sun adds to the risk.'
  ),

  // ============ Motorway driving ============
  q(
    'Motorway driving',
    'What is the national speed limit for cars on a motorway?',
    ['70 mph', '60 mph', '80 mph', '50 mph'],
    'Cars and motorcycles are limited to 70 mph on motorways unless signs show otherwise.'
  ),
  q(
    'Motorway driving',
    'When may you normally use the hard shoulder?',
    [
      'In an emergency or breakdown',
      'To overtake slow traffic',
      'For a short rest',
      'To answer your phone',
    ],
    'The hard shoulder is for emergencies only (or when signs open it as a lane).'
  ),
  q(
    'Motorway driving',
    'A red X is displayed above your motorway lane. What does it mean?',
    [
      'The lane is closed — move out of it',
      'Traffic is slow ahead',
      'The lane is for emergency vehicles only',
      'A speed limit applies',
    ],
    'A red X means the lane is closed; driving in it is dangerous and illegal.'
  ),
  q(
    'Motorway driving',
    'Which lane should you normally drive in on a motorway?',
    [
      'The left-hand lane',
      'The middle lane',
      'The right-hand lane',
      'Whichever is emptiest',
    ],
    'Keep left except when overtaking — return to the left lane when clear.'
  ),
  q(
    'Motorway driving',
    'How should you join a motorway from a slip road?',
    [
      'Build up speed to match the traffic and merge into a safe gap',
      'Stop at the end of the slip road and wait',
      'Join at 30 mph and accelerate afterwards',
      'Force your way in — joining traffic has priority',
    ],
    'Match the speed of traffic already on the motorway; they have priority.'
  ),
  q(
    'Motorway driving',
    'You break down on a motorway. How do you find the nearest emergency telephone?',
    [
      'Follow the arrows on the marker posts at the edge of the hard shoulder',
      'Walk in the direction you were travelling by default',
      'Use any gap in the central reservation',
      'Wait for a patrol to find you',
    ],
    'Marker posts point to the nearest phone, which connects you to the control centre.'
  ),
  q(
    'Motorway driving',
    'What colour are the reflective studs between a motorway and its slip road?',
    ['Green', 'Red', 'White', 'Amber'],
    'Red marks the left edge, amber the right, white the lanes, and green marks slip roads.'
  ),
  q(
    'Motorway driving',
    'When may a learner driver use the motorway?',
    [
      'With an approved driving instructor in a car with dual controls',
      'Never',
      'With any full licence holder',
      'Only after dark when traffic is light',
    ],
    'Since 2018 learners may have motorway lessons with an ADI in a dual-control car.'
  ),
  q(
    'Motorway driving',
    'A speed limit is shown in a red circle on a smart motorway gantry. What does it mean?',
    [
      'It is mandatory — you must not exceed it',
      'It is advisory only',
      'It applies to lorries only',
      'It shows the minimum speed',
    ],
    'Red-circled gantry limits are legally enforceable, often by average-speed cameras.'
  ),
  q(
    'Motorway driving',
    'You miss your motorway exit. What should you do?',
    [
      'Carry on to the next exit',
      'Stop on the hard shoulder and reverse',
      'Make a U-turn through the central reservation',
      'Brake hard and cut across the chevrons',
    ],
    'Never reverse or turn on a motorway — the next junction is the only option.'
  ),

  // ============ Rules of the road ============
  q(
    'Rules of the road',
    'At a pelican crossing, what does a flashing amber light mean?',
    [
      'Give way to pedestrians on the crossing, then go if it is clear',
      'Stop and wait for green',
      'Pedestrians must not start to cross',
      'The lights are out of order',
    ],
    'Flashing amber at a pelican crossing means give way to anyone still crossing.'
  ),
  q(
    'Rules of the road',
    'What is the national speed limit for cars on a single carriageway?',
    ['60 mph', '70 mph', '50 mph', '40 mph'],
    'Unless signed otherwise, cars may do 60 mph on single carriageways.'
  ),
  q(
    'Rules of the road',
    'Who has priority at an unmarked crossroads?',
    ['No one', 'Traffic going straight ahead', 'Traffic turning left', 'The larger vehicle'],
    'No one has priority at an unmarked crossroads — approach slowly and be ready to stop.'
  ),
  q(
    'Rules of the road',
    'When may you enter a yellow box junction?',
    [
      'When your exit road is clear — or to turn right while blocked only by oncoming traffic',
      'Whenever the lights are green',
      'When at least half the box is clear',
      'Never',
    ],
    'Do not block the box: enter only if you can leave it, except when waiting to turn right.'
  ),
  q(
    'Rules of the road',
    'A road has street lights but no speed limit signs. What is the limit usually?',
    ['30 mph', '40 mph', '20 mph', '50 mph'],
    'Street lighting normally means a 30 mph limit unless signs say otherwise.'
  ),
  q(
    'Rules of the road',
    'At night, which way should you park on a two-way road?',
    [
      'With the flow of traffic',
      'Facing oncoming traffic',
      'Either way if your lights are on',
      'Half on the pavement',
    ],
    'Parking against the flow at night hides your reflectors and dazzles others when you leave.'
  ),
  q(
    'Rules of the road',
    'Double white lines run along the centre of the road, with a solid line nearest you. When may you cross them?',
    [
      'To pass a stationary obstruction, or a cyclist, horse or works vehicle moving at 10 mph or less',
      'Whenever the road ahead is clear',
      'To overtake anything slower than you',
      'Only between midnight and 6 am',
    ],
    'A solid line your side bans overtaking except in those specific circumstances.'
  ),
  q(
    'Rules of the road',
    'What do zigzag lines before a pedestrian crossing mean?',
    [
      'No parking or overtaking in that area',
      'Give way to buses',
      'Parking for permit holders only',
      'The crossing is out of use',
    ],
    'The zigzags keep sightlines clear — stopping or overtaking there endangers pedestrians.'
  ),
  q(
    'Rules of the road',
    'When should you signal left on leaving a roundabout?',
    [
      'After passing the exit before the one you want',
      'On entering the roundabout',
      'Halfway around, whatever your exit',
      'Signalling is not needed on roundabouts',
    ],
    'Signal left once you pass the exit before yours, so following traffic knows your plan.'
  ),
  q(
    'Rules of the road',
    'Who may use a toucan crossing?',
    [
      'Pedestrians and cyclists together',
      'Pedestrians only',
      'Horse riders only',
      'Buses and taxis',
    ],
    '"Two can" cross — cyclists may ride across a toucan, unlike other crossings.'
  ),

  // ============ Road and traffic signs ============
  q(
    'Road and traffic signs',
    'What shape and colour are most signs that give orders?',
    [
      'Circular with a red border',
      'Triangular with a red border',
      'Rectangular and blue',
      'Diamond-shaped and yellow',
    ],
    'Circles give orders: red-bordered circles mostly tell you what you must not do.'
  ),
  q(
    'Road and traffic signs',
    'What do triangular road signs do?',
    ['Warn you of hazards ahead', 'Give orders', 'Give directions', 'Mark parking zones'],
    'Triangles warn — for example of bends, junctions, or crossings ahead.'
  ),
  q(
    'Road and traffic signs',
    'What does a blue circular sign generally mean?',
    [
      'A positive instruction, such as turn left ahead',
      'A warning of a hazard',
      'A route for heavy vehicles only',
      'The end of a restriction',
    ],
    'Blue circles give positive (mandatory) instructions, like minimum speeds or turn directions.'
  ),
  q(
    'Road and traffic signs',
    'Which road sign is octagonal?',
    ['Stop', 'Give way', 'No entry', 'National speed limit'],
    'The unique shape means a stop sign is recognisable even when covered in snow.'
  ),
  q(
    'Road and traffic signs',
    'What does a white circular sign with a single black diagonal stripe mean?',
    [
      'The national speed limit applies',
      'No overtaking',
      'End of motorway',
      'No through road',
    ],
    'The diagonal stripe cancels previous limits — national limits now apply.'
  ),
  q(
    'Road and traffic signs',
    'The broken white line along the centre of the road becomes longer with shorter gaps. What does this mean?',
    [
      'A hazard ahead — do not cross unless you can see it is clear',
      'Overtaking is now encouraged',
      'A cycle lane begins',
      'The road narrows on both sides',
    ],
    'Longer markings form a hazard warning line — take extra care.'
  ),
  q(
    'Road and traffic signs',
    'What are rectangular blue signs generally used for?',
    [
      'Information, such as motorway directions',
      'Orders you must obey',
      'Hazard warnings',
      'Temporary roadworks',
    ],
    'Rectangles inform: blue for motorways, green for primary routes, white for local routes.'
  ),
  q(
    'Road and traffic signs',
    'What does a red circle containing a white horizontal bar mean?',
    ['No entry', 'Stop at the barrier', 'One-way street', 'Road narrows'],
    'The white bar on red means no entry for vehicles — do not drive in.'
  ),
  q(
    'Road and traffic signs',
    'You see flashing red lights above your lane or at a level crossing. What must you do?',
    ['Stop', 'Speed up to clear the area', 'Proceed with caution', 'Change lanes and continue'],
    'Flashing red signals always mean stop — at crossings, bridges, and fire stations.'
  ),
  q(
    'Road and traffic signs',
    'What do brown road signs show?',
    ['Tourist attractions', 'Military zones', 'Truck routes', 'Roadworks diversions'],
    'Brown signs guide you to tourist destinations and facilities.'
  ),

  // ============ Essential documents ============
  q(
    'Essential documents',
    'Your licence is revoked if you get six penalty points within how long of passing your test?',
    ['Two years', 'One year', 'Five years', 'Six months'],
    'New drivers who reach six points within two years must retake both theory and practical tests.'
  ),
  q(
    'Essential documents',
    'A new car needs its first MOT test after how many years?',
    ['Three years', 'One year', 'Five years', 'Ten years'],
    'Cars need an MOT once they are three years old, then every year.'
  ),
  q(
    'Essential documents',
    'What is the minimum insurance cover you must have to drive on public roads?',
    ['Third party', 'Comprehensive', 'Third party, fire and theft', 'None if the car is taxed'],
    'Third-party cover is the legal minimum — it protects other people, not your own car.'
  ),
  q(
    'Essential documents',
    'What does making a SORN (Statutory Off Road Notification) mean?',
    [
      'The vehicle is kept off the road and needs no tax or insurance',
      'The vehicle has failed its MOT',
      'The vehicle is taxed for six months only',
      'The vehicle can be driven on Sundays only',
    ],
    'A SORN declares the vehicle off-road; it must not be driven or parked on public roads.'
  ),
  q(
    'Essential documents',
    'The police ask to see your documents but you do not have them with you. How long do you have to produce them at a police station?',
    ['7 days', '24 hours', '14 days', '30 days'],
    'You may be asked to produce your licence, insurance, and MOT within 7 days.'
  ),
  q(
    'Essential documents',
    'Which of these must a learner driver display and have in place?',
    [
      'L plates and supervision by someone 21+ who has held a full licence for 3+ years',
      'L plates only when on main roads',
      'A green P plate',
      'Nothing until after the theory test',
    ],
    'Learners need L plates (front and rear) and a qualified supervisor unless with an instructor.'
  ),
  q(
    'Essential documents',
    'What does the excess on an insurance policy mean?',
    [
      'The amount you must pay yourself towards any claim',
      'The maximum the insurer will ever pay',
      'A no-claims bonus',
      'The cost of extra drivers',
    ],
    'A £250 excess means you pay the first £250 of any claim.'
  ),
  q(
    'Essential documents',
    'When must you update your driving licence details?',
    [
      'When you change your name or address',
      'Only when it expires',
      'Every five years',
      'When you change your car',
    ],
    'DVLA must have your current name and address — driving on outdated details risks a fine.'
  ),
  q(
    'Essential documents',
    'What is the V5C document?',
    [
      'The vehicle registration certificate, naming the registered keeper',
      'Proof of insurance',
      'The MOT certificate',
      'A parking permit',
    ],
    'The V5C (log book) records the registered keeper and must be updated when a car is sold.'
  ),
  q(
    'Essential documents',
    'What is the Pass Plus scheme for?',
    [
      'Improving new drivers’ skills, which may reduce insurance costs',
      'Removing penalty points',
      'Licensing minibus driving',
      'Avoiding the practical test',
    ],
    'Pass Plus adds experience (motorways, night, all weathers) soon after passing.'
  ),

  // ============ Incidents and emergencies ============
  q(
    'Incidents and emergencies',
    'An injured motorcyclist is lying in the road. When should their helmet be removed?',
    [
      'Only if it is essential — for example to restore breathing',
      'Immediately, to help them breathe',
      'As soon as the engine is off',
      'Once they are sitting up',
    ],
    'Removing a helmet can worsen neck injuries — leave it on unless absolutely necessary.'
  ),
  q(
    'Incidents and emergencies',
    'You are first to arrive at a crash. What should you do first?',
    [
      'Make the scene safe — warn traffic and switch off engines',
      'Move all casualties out of their vehicles',
      'Photograph everything',
      'Find witnesses',
    ],
    'Deal with danger first so the situation cannot get worse, then check casualties and call 999.'
  ),
  q(
    'Incidents and emergencies',
    'How should you treat a burn?',
    [
      'Cool it with clean, cool water for at least 20 minutes',
      'Apply butter or cream',
      'Burst any blisters',
      'Wrap it tightly in a bandage immediately',
    ],
    'Cool the burn thoroughly with water; do not burst blisters or apply anything greasy.'
  ),
  q(
    'Incidents and emergencies',
    'A casualty is not breathing. At what rate should chest compressions be given?',
    [
      '100 to 120 per minute, pressing 5–6 cm deep',
      '30 per minute',
      '200 per minute',
      '60 per minute, pressing 1–2 cm deep',
    ],
    'Push hard and fast in the centre of the chest — about two per second.'
  ),
  q(
    'Incidents and emergencies',
    'You are involved in a collision that injures someone. What must you do?',
    [
      'Stop, give your details, and report to the police within 24 hours if details were not exchanged',
      'Stop only if your vehicle is damaged',
      'Report it within 7 days',
      'Leave once the other driver takes a photo of your plate',
    ],
    'Injury collisions must be reported to the police within 24 hours if details were not exchanged at the scene.'
  ),
  q(
    'Incidents and emergencies',
    'Your vehicle breaks down inside a tunnel. What should you do?',
    [
      'Switch on hazard lights, stop the engine, and use the emergency point to call for help',
      'Stay in the car with the engine running',
      'Reverse out of the tunnel',
      'Wait for another driver to report it',
    ],
    'Tunnels have emergency stations — use them so operators can manage the danger quickly.'
  ),
  q(
    'Incidents and emergencies',
    'Smoke is coming from under your bonnet. What should you do?',
    [
      'Pull over, get everyone out, and call the fire service — do not open the bonnet fully',
      'Open the bonnet wide to cool the engine',
      'Drive to the nearest garage',
      'Pour water in through the grille and continue',
    ],
    'Opening the bonnet feeds the fire with air — leave it and let the fire service deal with it.'
  ),
  q(
    'Incidents and emergencies',
    'Where should you place a warning triangle after breaking down on a normal road?',
    [
      'At least 45 metres behind the vehicle',
      'On the roof of the vehicle',
      '5 metres behind the vehicle',
      'On the opposite side of the road',
    ],
    '45 m gives following drivers time to react — but never use triangles on motorways.'
  ),
  q(
    'Incidents and emergencies',
    'A casualty at a crash scene is showing signs of shock. How can you help?',
    [
      'Keep them warm, comfortable and reassured — do not give food or drink',
      'Give them a hot sweet drink',
      'Walk them around to keep circulation up',
      'Leave them alone to rest',
    ],
    'Reassure and keep them still and warm; food or drink can cause problems if surgery is needed.'
  ),
  q(
    'Incidents and emergencies',
    'A front tyre bursts while you are driving. What should you do?',
    [
      'Grip the wheel firmly, ease off the accelerator, and roll to a stop',
      'Brake as hard as possible',
      'Swerve to the kerb immediately',
      'Accelerate to keep the car stable',
    ],
    'Hard braking on a blowout causes a swerve — slow gradually and steer gently to safety.'
  ),

  // ============ Vehicle loading ============
  q(
    'Vehicle loading',
    'How does overloading a vehicle affect it?',
    [
      'Steering and braking become less effective',
      'Fuel economy improves',
      'The ride becomes smoother',
      'Tyre grip increases',
    ],
    'An overloaded car handles and stops worse — and overloading is an offence.'
  ),
  q(
    'Vehicle loading',
    'What effect does a loaded roof rack have?',
    [
      'It increases wind resistance and fuel consumption',
      'It improves stability',
      'It reduces tyre wear',
      'It has no effect below 50 mph',
    ],
    'Weight up high plus drag means more fuel and less stable cornering.'
  ),
  q(
    'Vehicle loading',
    'Your caravan starts to snake (sway) at speed. What should you do?',
    [
      'Ease off the accelerator and slow down gradually',
      'Brake hard immediately',
      'Accelerate out of the sway',
      'Steer sharply against each sway',
    ],
    'Braking or steering hard makes snaking worse — reduce speed gently until it stops.'
  ),
  q(
    'Vehicle loading',
    'Who is responsible for making sure a vehicle’s load is secure?',
    ['The driver', 'The person who loaded it', 'The vehicle’s owner', 'The insurance company'],
    'However it was loaded, the driver carries the legal responsibility on the road.'
  ),
  q(
    'Vehicle loading',
    'How must a child under three years old travel in a car?',
    [
      'In a suitable child restraint for their weight and size',
      'On an adult’s lap with the belt around both',
      'With an adult seat belt only',
      'In the front seat with a cushion',
    ],
    'Under-threes must use an appropriate child seat — the driver is responsible.'
  ),
  q(
    'Vehicle loading',
    'What is a stabiliser for when towing a caravan?',
    [
      'It helps keep the outfit steady, especially in crosswinds',
      'It increases the legal towing speed',
      'It replaces the need for load balancing',
      'It reduces fuel consumption',
    ],
    'A stabiliser damps swaying — though correct loading matters even more.'
  ),
  q(
    'Vehicle loading',
    'You are towing a caravan wider than your car. What should you fit?',
    [
      'Extended-arm side mirrors',
      'A larger interior mirror',
      'Spotlights on the caravan',
      'Nothing extra is needed',
    ],
    'You must have an adequate view down both sides of the caravan.'
  ),
  q(
    'Vehicle loading',
    'What is the maximum motorway speed when towing a trailer or caravan?',
    ['60 mph, and not in the right-hand lane of a three-lane motorway', '70 mph in any lane', '50 mph', '65 mph'],
    'Towing outfits are limited to 60 mph and banned from the outside lane of three-lane motorways.'
  ),
  q(
    'Vehicle loading',
    'Where should heavy items be placed when loading a vehicle?',
    [
      'Low down and over the axles, secured firmly',
      'As high as possible',
      'At the very back',
      'On the parcel shelf',
    ],
    'Low, central, secured weight keeps the handling predictable.'
  ),
  q(
    'Vehicle loading',
    'How should pets travel in a car?',
    [
      'Suitably restrained so they cannot distract the driver',
      'Loose, so they can settle comfortably',
      'On the front passenger’s lap',
      'In the driver’s footwell',
    ],
    'An unrestrained pet is a distraction and a projectile in a crash — use a harness, carrier, or guard.'
  ),
];
