import type {LifeEvent} from './state.ts';
import type {Project} from './projects.ts';

// Public visual catalogue, released 2026-09-22. These are not private historical records.
export const inventionProjects:Project[]=[
  {
    "id": "body-metrics",
    "name": "Karmic Body Metrics",
    "zone": "health",
    "plot": 0,
    "motif": "health",
    "links": [
      "kinetics",
      "run-dna"
    ]
  },
  {
    "id": "webroker",
    "name": "Webroker",
    "zone": "business",
    "plot": 0,
    "motif": "network",
    "links": [
      "rwa",
      "investor-portal",
      "automation-economics"
    ]
  },
  {
    "id": "windpanel",
    "name": "WindPanel",
    "zone": "wind",
    "plot": 0,
    "motif": "energy",
    "links": [
      "wake-recoverability",
      "solar-sales",
      "mih-hub"
    ]
  },
  {
    "id": "bong-tracker",
    "name": "Bong-shot Data Tracker",
    "zone": "health",
    "plot": 1,
    "motif": "phone",
    "links": [
      "capture-memory",
      "analytics"
    ]
  },
  {
    "id": "kinetics",
    "name": "Karmic Motion Intelligence",
    "zone": "health",
    "plot": 2,
    "motif": "health",
    "links": [
      "robotics-core",
      "body-metrics",
      "run-dna"
    ]
  },
  {
    "id": "rigpulse",
    "name": "RigPulse / Predator Sense",
    "zone": "maker",
    "plot": 0,
    "motif": "phone",
    "links": [
      "edge-core",
      "compute-cluster"
    ]
  },
  {
    "id": "aic-ecosystem",
    "name": "AIC Living Startup Ecosystem",
    "zone": "business",
    "plot": 1,
    "motif": "network",
    "links": [
      "webuild",
      "investor-portal"
    ]
  },
  {
    "id": "karmic-cameras",
    "name": "Karmic Cameras",
    "zone": "maker",
    "plot": 1,
    "motif": "phone",
    "links": [
      "sync",
      "robotics-core"
    ]
  },
  {
    "id": "games-vault",
    "name": "Karmic Games Vault",
    "zone": "creative",
    "plot": 0,
    "motif": "game",
    "links": [
      "gamer-passport",
      "ludo"
    ]
  },
  {
    "id": "gamer-passport",
    "name": "Gamer Passport",
    "zone": "creative",
    "plot": 1,
    "motif": "game",
    "links": [
      "games-vault",
      "character-studio"
    ]
  },
  {
    "id": "character-studio",
    "name": "AI Character Studio",
    "zone": "creative",
    "plot": 2,
    "motif": "media",
    "links": [
      "robot-podcast",
      "ghibliface",
      "era-skins"
    ]
  },
  {
    "id": "reels-studio",
    "name": "Karmic Reels Studio",
    "zone": "creative",
    "plot": 3,
    "motif": "media",
    "links": [
      "review-pages",
      "brand-studio",
      "knowledge-film"
    ]
  },
  {
    "id": "we-news",
    "name": "WE News Global",
    "zone": "knowledge",
    "plot": 0,
    "motif": "network",
    "links": [
      "ministers",
      "knowledge-film"
    ]
  },
  {
    "id": "wraithwave",
    "name": "WraithWave / MixerWave",
    "zone": "creative",
    "plot": 4,
    "motif": "media",
    "links": [
      "reels-studio",
      "robot-podcast"
    ]
  },
  {
    "id": "ghibliface",
    "name": "GhibliFace AI",
    "zone": "creative",
    "plot": 5,
    "motif": "media",
    "links": [
      "character-studio",
      "era-skins"
    ]
  },
  {
    "id": "finance-os",
    "name": "Karmic Finance OS",
    "zone": "business",
    "plot": 2,
    "motif": "network",
    "links": [
      "investor-portal",
      "analytics"
    ]
  },
  {
    "id": "legal-os",
    "name": "Karmic Legal OS",
    "zone": "business",
    "plot": 3,
    "motif": "network",
    "links": [
      "ip-vault",
      "webroker"
    ]
  },
  {
    "id": "brand-studio",
    "name": "Karmic Brand Studio",
    "zone": "creative",
    "plot": 6,
    "motif": "media",
    "links": [
      "reels-studio",
      "review-pages"
    ]
  },
  {
    "id": "investor-portal",
    "name": "Karmic Investor Portal",
    "zone": "business",
    "plot": 4,
    "motif": "network",
    "links": [
      "finance-os",
      "patent-discovery",
      "aic-ecosystem"
    ]
  },
  {
    "id": "talent-os",
    "name": "Karmic Talent OS",
    "zone": "business",
    "plot": 5,
    "motif": "network",
    "links": [
      "aic-ecosystem",
      "webuild"
    ]
  },
  {
    "id": "ip-vault",
    "name": "Karmic IP & Patent Vault",
    "zone": "knowledge",
    "plot": 1,
    "motif": "science",
    "links": [
      "patent-discovery",
      "legal-os",
      "idea-evaluation"
    ]
  },
  {
    "id": "analytics",
    "name": "Karmic Analytics Hub",
    "zone": "agents",
    "plot": 0,
    "motif": "science",
    "links": [
      "capture-memory",
      "api-gateway"
    ]
  },
  {
    "id": "api-gateway",
    "name": "Karmic API Gateway",
    "zone": "agents",
    "plot": 1,
    "motif": "network",
    "links": [
      "edge-core",
      "multi-ai",
      "capture-memory"
    ]
  },
  {
    "id": "webuild",
    "name": "WeBuild India",
    "zone": "business",
    "plot": 6,
    "motif": "workshop",
    "links": [
      "maker-bay",
      "aic-ecosystem",
      "circular-materials"
    ]
  },
  {
    "id": "circular-materials",
    "name": "HDHMR Circular Materials",
    "zone": "maker",
    "plot": 2,
    "motif": "materials",
    "links": [
      "plastic-recycler",
      "bio-bottle",
      "maker-bay"
    ]
  },
  {
    "id": "rf-tattoos",
    "name": "Wi-Fi Reflective Tattoos",
    "zone": "maker",
    "plot": 3,
    "motif": "science",
    "links": [
      "distributed-self",
      "spatial-engine"
    ]
  },
  {
    "id": "green-lab",
    "name": "Green Tech Lab",
    "zone": "wind",
    "plot": 1,
    "motif": "garden",
    "links": [
      "plastic-recycler",
      "circular-materials",
      "wake-recoverability"
    ]
  },
  {
    "id": "sanskrit-agi",
    "name": "Karmic Sanskrit AGI",
    "zone": "knowledge",
    "plot": 2,
    "motif": "science",
    "links": [
      "multi-ai",
      "guru-engine"
    ]
  },
  {
    "id": "robotics-core",
    "name": "Universal Smartphone Robotics Core",
    "zone": "maker",
    "plot": 4,
    "motif": "robot",
    "links": [
      "machine-bridge",
      "kinetics",
      "edge-core"
    ]
  },
  {
    "id": "plastic-recycler",
    "name": "Karmic Solar Plastic Recycler",
    "zone": "maker",
    "plot": 5,
    "motif": "materials",
    "links": [
      "green-lab",
      "circular-materials"
    ]
  },
  {
    "id": "capture-memory",
    "name": "Karmic Capture / Memory",
    "zone": "knowledge",
    "plot": 3,
    "motif": "phone",
    "links": [
      "edge-core",
      "analytics",
      "karmic-life"
    ]
  },
  {
    "id": "edge-core",
    "name": "Karmic Edge + Core",
    "zone": "agents",
    "plot": 2,
    "motif": "network",
    "links": [
      "capture-memory",
      "compute-cluster",
      "robotics-core"
    ]
  },
  {
    "id": "sync",
    "name": "Karmic Sync",
    "zone": "maker",
    "plot": 6,
    "motif": "phone",
    "links": [
      "karmic-cameras",
      "spatial-engine"
    ]
  },
  {
    "id": "spatial-engine",
    "name": "Karmic Spatial Interaction Engine",
    "zone": "maker",
    "plot": 7,
    "motif": "phone",
    "links": [
      "portals",
      "robotics-core",
      "sync"
    ]
  },
  {
    "id": "rwa",
    "name": "RWA Predictive Governance",
    "zone": "business",
    "plot": 7,
    "motif": "network",
    "links": [
      "pet-comfort",
      "webroker",
      "ministers"
    ]
  },
  {
    "id": "pet-comfort",
    "name": "Pet Comfort Ledger",
    "zone": "home",
    "plot": 0,
    "motif": "garden",
    "links": [
      "rwa"
    ]
  },
  {
    "id": "run-dna",
    "name": "Run DNA",
    "zone": "health",
    "plot": 3,
    "motif": "health",
    "links": [
      "kinetics",
      "body-metrics",
      "creatine"
    ]
  },
  {
    "id": "rope-storage",
    "name": "Rope-only Wall Storage",
    "zone": "maker",
    "plot": 8,
    "motif": "materials",
    "links": [
      "maker-bay",
      "webuild"
    ]
  },
  {
    "id": "magnetic-iron",
    "name": "Magnetic Ironing",
    "zone": "maker",
    "plot": 9,
    "motif": "workshop",
    "links": [
      "maker-bay"
    ]
  },
  {
    "id": "personality-elements",
    "name": "Personality Periodic Table",
    "zone": "mentor",
    "plot": 0,
    "motif": "science",
    "links": [
      "guru-engine",
      "four-log"
    ]
  },
  {
    "id": "solar-sales",
    "name": "Solar Rooftop Sales Engine",
    "zone": "wind",
    "plot": 2,
    "motif": "energy",
    "links": [
      "webroker",
      "green-lab"
    ]
  },
  {
    "id": "automation-economics",
    "name": "Worker ↔ Robot Economics",
    "zone": "business",
    "plot": 8,
    "motif": "robot",
    "links": [
      "robotics-core",
      "finance-os"
    ]
  },
  {
    "id": "wake-recoverability",
    "name": "Disturbed-Flow Recoverability",
    "zone": "wind",
    "plot": 3,
    "motif": "science",
    "links": [
      "windpanel",
      "green-lab"
    ]
  },
  {
    "id": "keltech-avatars",
    "name": "Keltech Employee Avatars",
    "zone": "creative",
    "plot": 7,
    "motif": "media",
    "links": [
      "character-studio",
      "brand-studio"
    ]
  },
  {
    "id": "chase-tag",
    "name": "World Chase Tag Rig",
    "zone": "creative",
    "plot": 8,
    "motif": "game",
    "links": [
      "mih-hub",
      "kinetics"
    ]
  },
  {
    "id": "titanium-merch",
    "name": "Titanium Team Merch",
    "zone": "business",
    "plot": 9,
    "motif": "workshop",
    "links": [
      "brand-studio",
      "mih-hub"
    ]
  },
  {
    "id": "mih-hub",
    "name": "MIH Innovation Hub",
    "zone": "maker",
    "plot": 10,
    "motif": "workshop",
    "links": [
      "windpanel",
      "chase-tag",
      "patent-discovery"
    ]
  },
  {
    "id": "experimental-vehicle",
    "name": "Experimental Vehicle Lab",
    "zone": "maker",
    "plot": 11,
    "motif": "robot",
    "links": [
      "windpanel",
      "robotics-core"
    ]
  },
  {
    "id": "patent-discovery",
    "name": "Patent Discovery + Investing",
    "zone": "knowledge",
    "plot": 4,
    "motif": "science",
    "links": [
      "ip-vault",
      "investor-portal",
      "mih-hub"
    ]
  },
  {
    "id": "karmic-life",
    "name": "Karmic Life / Civilization OS",
    "zone": "home",
    "plot": 1,
    "motif": "game",
    "links": [
      "agent-swarm",
      "capture-memory",
      "idea-evaluation"
    ]
  },
  {
    "id": "distributed-self",
    "name": "Distributed Self & Human Fields",
    "zone": "health",
    "plot": 4,
    "motif": "science",
    "links": [
      "rf-tattoos",
      "personality-elements"
    ]
  },
  {
    "id": "maker-bay",
    "name": "Local AI Workshop / Maker Bay",
    "zone": "maker",
    "plot": 12,
    "motif": "workshop",
    "links": [
      "machine-bridge",
      "circular-materials",
      "compute-cluster"
    ]
  },
  {
    "id": "machine-bridge",
    "name": "Machine ↔ Phone Bridge",
    "zone": "maker",
    "plot": 13,
    "motif": "phone",
    "links": [
      "robotics-core",
      "edge-core",
      "maker-bay"
    ]
  },
  {
    "id": "star-registry",
    "name": "Buy a Star Registry",
    "zone": "spirit",
    "plot": 0,
    "motif": "science",
    "links": [
      "sanskrit-agi"
    ]
  },
  {
    "id": "ludo",
    "name": "4D Ludo & Indian Game Lab",
    "zone": "creative",
    "plot": 9,
    "motif": "game",
    "links": [
      "games-vault",
      "religion-earths"
    ]
  },
  {
    "id": "knowledge-film",
    "name": "Knowledge → Film Engine",
    "zone": "creative",
    "plot": 10,
    "motif": "media",
    "links": [
      "we-news",
      "reels-studio",
      "distributed-self"
    ]
  },
  {
    "id": "era-skins",
    "name": "Era Skins",
    "zone": "creative",
    "plot": 11,
    "motif": "media",
    "links": [
      "character-studio",
      "ghibliface"
    ]
  },
  {
    "id": "idea-evaluation",
    "name": "Idea Evaluation Engine",
    "zone": "agents",
    "plot": 3,
    "motif": "science",
    "links": [
      "agent-swarm",
      "ip-vault",
      "karmic-life"
    ]
  },
  {
    "id": "portals",
    "name": "3D Portals",
    "zone": "maker",
    "plot": 14,
    "motif": "phone",
    "links": [
      "spatial-engine",
      "robotics-core"
    ]
  },
  {
    "id": "multi-ai",
    "name": "Multi-AI Conversation Site",
    "zone": "agents",
    "plot": 4,
    "motif": "network",
    "links": [
      "agent-swarm",
      "robot-podcast",
      "api-gateway"
    ]
  },
  {
    "id": "robot-podcast",
    "name": "AI Robot Podcast",
    "zone": "creative",
    "plot": 12,
    "motif": "robot",
    "links": [
      "character-studio",
      "multi-ai",
      "robotics-core"
    ]
  },
  {
    "id": "compute-cluster",
    "name": "Personal Distributed Compute",
    "zone": "agents",
    "plot": 5,
    "motif": "network",
    "links": [
      "edge-core",
      "rigpulse",
      "maker-bay"
    ]
  },
  {
    "id": "ministers",
    "name": "GitHub for Ministers",
    "zone": "knowledge",
    "plot": 5,
    "motif": "network",
    "links": [
      "we-news",
      "rwa"
    ]
  },
  {
    "id": "gravity-rail",
    "name": "Gravity Logistics Railway",
    "zone": "transit",
    "plot": 0,
    "motif": "logistics",
    "links": [
      "webuild",
      "automation-economics"
    ]
  },
  {
    "id": "bio-bottle",
    "name": "Edible / Biodegradable Bottle",
    "zone": "maker",
    "plot": 15,
    "motif": "materials",
    "links": [
      "circular-materials",
      "plastic-recycler",
      "green-lab"
    ]
  },
  {
    "id": "ai-chess",
    "name": "AI Chess Evolution",
    "zone": "ideas",
    "plot": 0,
    "motif": "game",
    "links": [
      "religion-earths",
      "idea-evaluation"
    ]
  },
  {
    "id": "creatine",
    "name": "Karmic Creatine",
    "zone": "health",
    "plot": 5,
    "motif": "health",
    "links": [
      "run-dna",
      "review-pages"
    ]
  },
  {
    "id": "review-pages",
    "name": "Co-branded Review Pages",
    "zone": "creative",
    "plot": 13,
    "motif": "media",
    "links": [
      "reels-studio",
      "creatine",
      "brand-studio"
    ]
  },
  {
    "id": "religion-earths",
    "name": "Religion Earths",
    "zone": "ideas",
    "plot": 1,
    "motif": "game",
    "links": [
      "ai-chess",
      "ludo",
      "we-news"
    ]
  },
  {
    "id": "cooling-stack",
    "name": "Transparent Cooling Stack",
    "zone": "maker",
    "plot": 16,
    "motif": "workshop",
    "links": [
      "rigpulse",
      "maker-bay"
    ]
  },
  {
    "id": "agent-swarm",
    "name": "Karmic Agent Swarm",
    "zone": "agents",
    "plot": 6,
    "motif": "robot",
    "links": [
      "idea-evaluation",
      "multi-ai",
      "karmic-life",
      "compute-cluster"
    ]
  },
  {
    "id": "rudraksha",
    "name": "Digital Rudraksha Jaap Mala",
    "zone": "spirit",
    "plot": 1,
    "motif": "temple",
    "links": [
      "capture-memory",
      "sanskrit-agi"
    ]
  },
  {
    "id": "time-use",
    "name": "24-hour Class Simulator",
    "zone": "mentor",
    "plot": 1,
    "motif": "science",
    "links": [
      "guru-engine",
      "four-log"
    ]
  },
  {
    "id": "smoking-freedom",
    "name": "Smoking Freedom",
    "zone": "health",
    "plot": 6,
    "motif": "garden",
    "links": [
      "bong-tracker",
      "distributed-self"
    ]
  },
  {
    "id": "guru-engine",
    "name": "Guru-selection Engine",
    "zone": "mentor",
    "plot": 2,
    "motif": "network",
    "links": [
      "four-log",
      "personality-elements",
      "time-use"
    ]
  },
  {
    "id": "four-log",
    "name": "“4 Log” Reference Classes",
    "zone": "mentor",
    "plot": 3,
    "motif": "science",
    "links": [
      "guru-engine",
      "idea-evaluation"
    ]
  },
  {
    "id": "thermal-phone",
    "name": "Smartphone Thermal Investigation",
    "zone": "maker",
    "plot": 17,
    "motif": "phone",
    "links": [
      "karmic-cameras",
      "rigpulse"
    ]
  }
];
const visualDescriptions:Record<string,string>={
  "body-metrics": "A body-scan studio with a measurement arch and anatomical display.",
  "webroker": "Connected city towers and a broker network plaza represent property relationships.",
  "windpanel": "An aerodynamic vehicle-energy laboratory with a ducted rotor test bay.",
  "bong-tracker": "A phone-shaped observatory for timelines and radial data visualizations.",
  "kinetics": "A motion-capture pavilion with articulated movement markers.",
  "rigpulse": "A telemetry terminal links a laptop display to a phone dashboard.",
  "aic-ecosystem": "An incubator campus connects startup pavilions around a shared courtyard.",
  "karmic-cameras": "A camera workshop crowned by a large lens and sensor mast.",
  "games-vault": "An arcade vault stores game worlds and achievement symbols.",
  "gamer-passport": "A passport gateway celebrates persistent player identity.",
  "character-studio": "An avatar studio displays character busts and a creation stage.",
  "reels-studio": "A short-film studio with screens, lights, and a vertical editing display.",
  "we-news": "A newsroom tower carries a globe and broadcast displays.",
  "wraithwave": "An audio laboratory turns waveforms into sculptural fins.",
  "ghibliface": "A stylized portrait atelier with a face display and transformation frame.",
  "finance-os": "A financial planning pavilion with chart-like rooflines.",
  "legal-os": "A legal knowledge hall with balanced wings and an archive entrance.",
  "brand-studio": "A creative brand workshop with a display wall and color samples.",
  "investor-portal": "An investment observatory links project display pods.",
  "talent-os": "A talent exchange campus connects individual profile stations.",
  "ip-vault": "A patent archive protects invention diagrams inside a geometric vault.",
  "analytics": "A data observatory features charts and a central analysis instrument.",
  "api-gateway": "A network gateway connects luminous data conduits.",
  "webuild": "A maker construction yard with structural frames and workshop bays.",
  "circular-materials": "A materials workshop connects waste intake, processing, and filament output.",
  "rf-tattoos": "An experimental radio-surface laboratory displays antenna patterns.",
  "green-lab": "A garden laboratory combines vegetation and environmental instruments.",
  "sanskrit-agi": "A language research hall combines inscription panels and an intelligence core.",
  "robotics-core": "A robotics hangar surrounds a smartphone dock with robot platforms.",
  "plastic-recycler": "A solar recycler links panel arrays to a compact processing chamber.",
  "capture-memory": "A memory archive gathers media tiles around a capture device.",
  "edge-core": "A compute hub connects small edge nodes to a central processor.",
  "sync": "A reactive-lighting studio surrounds a screen with colored light strips.",
  "spatial-engine": "A gesture laboratory frames an interactive spatial display.",
  "rwa": "A community planning hall displays a shared civic network.",
  "pet-comfort": "A pet-friendly garden with shelter, pathways, and comfort stations.",
  "run-dna": "A running park turns route geometry into a luminous double-helix sculpture.",
  "rope-storage": "A tension-rope workshop displays suspended storage frames.",
  "magnetic-iron": "A compact ironing laboratory showcases a magnetic pressure platform.",
  "personality-elements": "A periodic-table pavilion arranges colorful elemental blocks.",
  "solar-sales": "A rooftop solar colony demonstrates connected photovoltaic roofs.",
  "automation-economics": "A comparative workshop pairs human and robotic workstations.",
  "wake-recoverability": "A flow research tunnel visualizes disturbed wakes and energy recovery.",
  "keltech-avatars": "An avatar gallery displays a recurring ensemble of character portraits.",
  "chase-tag": "An obstacle pavilion creates a compact maze of chase routes.",
  "titanium-merch": "A merchandise atelier displays caps and fabrication equipment.",
  "mih-hub": "An invention campus combines demonstration bays and a public exhibition space.",
  "experimental-vehicle": "A vehicle laboratory presents a futuristic chassis on a test platform.",
  "patent-discovery": "An invention discovery hall connects patent displays to evaluation stations.",
  "karmic-life": "A civilization command landmark joins the surrounding idea districts.",
  "distributed-self": "A speculative research pavilion maps interconnected biological systems.",
  "maker-bay": "A fabrication laboratory combines a printer, electronics benches, and machinery.",
  "machine-bridge": "A machine-control station connects a phone dock to experimental hardware.",
  "star-registry": "A celestial registry pavilion points a telescope toward a star sculpture.",
  "ludo": "An experimental board-game pavilion turns a game board into a miniature world.",
  "knowledge-film": "A film laboratory translates knowledge displays into a cinema stage.",
  "era-skins": "A costume and character pavilion presents contrasting visual eras.",
  "idea-evaluation": "An evaluation laboratory puts concepts between opposing analysis stations.",
  "portals": "A pair of spatial gateways represents connected remote rooms.",
  "multi-ai": "A roundtable pavilion connects multiple intelligence terminals.",
  "robot-podcast": "A podcast stage pairs robot hosts with microphones and phone faces.",
  "compute-cluster": "A distributed computing hall links server nodes and personal devices.",
  "ministers": "A civic ledger hall displays a public timeline and evidence columns.",
  "gravity-rail": "A gravity logistics station combines elevated cargo tracks and lift towers.",
  "bio-bottle": "A biomaterials laboratory displays reinforced bottle prototypes.",
  "ai-chess": "A chess laboratory arranges pieces as an intelligence evolution sculpture.",
  "creatine": "A sports sampling pavilion features a sculptural dispenser beside a running track.",
  "review-pages": "A customer-story studio combines a video booth and review display.",
  "religion-earths": "An observatory holds multiple miniature worlds in orbital rings.",
  "cooling-stack": "A thermal laboratory displays coolant reservoirs, pipes, and radiator fins.",
  "agent-swarm": "An agent command center surrounds a shared intelligence core with workstations.",
  "rudraksha": "A meditation shrine frames a sculptural ring of carved digital beads.",
  "time-use": "A time-allocation observatory divides a large clock into activity sectors.",
  "smoking-freedom": "A freedom garden uses an open gateway and clear-air planting.",
  "guru-engine": "A mentor temple offers branching paths toward different learning halls.",
  "four-log": "A reference-class pavilion compares four neighboring perspective stations.",
  "thermal-phone": "A sensor laboratory displays a phone and a thermal-color experiment panel."
};
export const inventionEvents:LifeEvent[]=inventionProjects.map(project=>({id:'public-catalogue:'+project.id,date:'2026-09-22',title:project.name,summary:visualDescriptions[project.id],zone:project.zone,kind:'idea',sourceTitle:'Public idea-world catalogue · 2026-09-22',actor:'Karmic Life public catalogue',truthState:'USER_IDEA',project}));
export const legacyProjectIds:Record<string,string>={};
