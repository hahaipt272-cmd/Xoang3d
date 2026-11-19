export type Language = 'en' | 'vi';

export type GamePhase = 'title' | 'playing' | 'paused' | 'challenge_result';

export type BottleKind =
  | 'beer'
  | 'wine'
  | 'whiskey'
  | 'soda'
  | 'champagne'
  | 'perfume'
  | 'jug';

export type FragilityLevel = 'Ultra' | 'High' | 'Medium' | 'Low';

export type WallStyle = 'brick' | 'concrete' | 'glass_window' | 'metal';

export type EnvironmentLocation = 'indoor' | 'alley' | 'construction';
export type LightingMode = 'day' | 'night';
export type WeatherMode = 'clear' | 'rainy';

export type GameMode =
  | 'free'
  | 'moving_targets'
  | 'breakable_objects'
  | 'time_attack';

export interface BottleSpec {
  id: BottleKind;
  nameEn: string;
  nameVi: string;
  shortEn: string;
  shortVi: string;
  massKg: number;
  fragility: FragilityLevel;
  fragilityScore: number; // 1 (Low) .. 4 (Ultra)
  minBreakPower: number; // minimum power ratio to shatter on first hit
  glassColorHex: number;
  liquidColorHex: number;
  attenuationColorHex: number;
  capColorHex: number;
  labelBgHex: string;
  labelTextHex: string;
  shardCount: number;
  pitchBaseHz: number;
  thicknessFactor: number;
  heightM: number;
  radiusM: number;
  descEn: string;
  descVi: string;
}

export const BOTTLE_SPECS: Record<BottleKind, BottleSpec> = {
  soda: {
    id: 'soda',
    nameEn: 'Crystal Soda Bottle',
    nameVi: 'Chai Soda Trong',
    shortEn: 'Soda',
    shortVi: 'Soda',
    massKg: 0.26,
    fragility: 'Ultra',
    fragilityScore: 4,
    minBreakPower: 0.15,
    glassColorHex: 0xcdeff5,
    liquidColorHex: 0x7fd6e8,
    attenuationColorHex: 0xb2ebf2,
    capColorHex: 0xd9383a,
    labelBgHex: '#ffffff',
    labelTextHex: '#0c4a6e',
    shardCount: 40,
    pitchBaseHz: 4600,
    thicknessFactor: 0.72,
    heightM: 0.23,
    radiusM: 0.033,
    descEn: 'Featherlight thin glass; shatters effortlessly into razor-bright high chimes.',
    descVi: 'Thuỷ tinh mỏng nhẹ; vỡ tung tức thì với âm thanh cao vút giòn tan.',
  },
  perfume: {
    id: 'perfume',
    nameEn: 'Crystal Perfume Flacon',
    nameVi: 'Lọ Nước Hoa Pha Lê',
    shortEn: 'Perfume',
    shortVi: 'Nước Hoa',
    massKg: 0.22,
    fragility: 'Ultra',
    fragilityScore: 4,
    minBreakPower: 0.14,
    glassColorHex: 0xf4c2d7,
    liquidColorHex: 0xe68ab8,
    attenuationColorHex: 0xf09ec4,
    capColorHex: 0xe5c158,
    labelBgHex: '#1e1b24',
    labelTextHex: '#f6d37a',
    shardCount: 42,
    pitchBaseHz: 5400,
    thicknessFactor: 0.68,
    heightM: 0.17,
    radiusM: 0.036,
    descEn: 'Delicate faceted crystal bottle that explodes in high-pitched sparkling chimes.',
    descVi: 'Lọ pha lê vát cạnh tinh xảo, vỡ ra âm thanh lanh lảnh cực cao.',
  },
  beer: {
    id: 'beer',
    nameEn: 'Emerald Beer Bottle',
    nameVi: 'Chai Bia Xanh',
    shortEn: 'Beer',
    shortVi: 'Bia',
    massKg: 0.36,
    fragility: 'High',
    fragilityScore: 3,
    minBreakPower: 0.2,
    glassColorHex: 0x1a6b38,
    liquidColorHex: 0xd48c1c,
    attenuationColorHex: 0x1d7a3c,
    capColorHex: 0xd4a438,
    labelBgHex: '#f2e8cf',
    labelTextHex: '#1b4332',
    shardCount: 36,
    pitchBaseHz: 3600,
    thicknessFactor: 0.9,
    heightM: 0.25,
    radiusM: 0.036,
    descEn: 'Balanced weight and crisp snap—ideal for rapid stress-relief throwing.',
    descVi: 'Trọng lượng cân đối, tiếng nổ giòn rã—lý tưởng để ném xả stress liên hoàn.',
  },
  wine: {
    id: 'wine',
    nameEn: 'Vintage Wine Bottle',
    nameVi: 'Chai Vang Đỏ',
    shortEn: 'Wine',
    shortVi: 'Vang',
    massKg: 0.68,
    fragility: 'Medium',
    fragilityScore: 2,
    minBreakPower: 0.28,
    glassColorHex: 0x263f22,
    liquidColorHex: 0x5c0a18,
    attenuationColorHex: 0x223b1c,
    capColorHex: 0x8f1d2c,
    labelBgHex: '#ede0d4',
    labelTextHex: '#3d0814',
    shardCount: 46,
    pitchBaseHz: 2550,
    thicknessFactor: 1.25,
    heightM: 0.31,
    radiusM: 0.043,
    descEn: 'Heavy dark olive glass with deep impact thud and rich red splash.',
    descVi: 'Thuỷ tinh xanh rêu dày nặng, lực va đập đầm tay và vết vang đỏ đậm.',
  },
  whiskey: {
    id: 'whiskey',
    nameEn: 'Amber Whiskey Flask',
    nameVi: 'Chai Whisky Vuông',
    shortEn: 'Whiskey',
    shortVi: 'Whisky',
    massKg: 0.85,
    fragility: 'Low',
    fragilityScore: 1,
    minBreakPower: 0.42,
    glassColorHex: 0x8c4714,
    liquidColorHex: 0xb85b14,
    attenuationColorHex: 0x9c4d11,
    capColorHex: 0xc29248,
    labelBgHex: '#1d1916',
    labelTextHex: '#e6be7a',
    shardCount: 50,
    pitchBaseHz: 2150,
    thicknessFactor: 1.48,
    heightM: 0.26,
    radiusM: 0.048,
    descEn: 'Thick octagonal amber glass—requires a firm throw or it bounces before breaking!',
    descVi: 'Kính hổ phách dày chắc—cần ném mạnh tay để đập tan ngay cú đầu!',
  },
  champagne: {
    id: 'champagne',
    nameEn: 'Pressurized Champagne',
    nameVi: 'Chai Sâm Panh',
    shortEn: 'Champagne',
    shortVi: 'Sâm Panh',
    massKg: 0.95,
    fragility: 'Low',
    fragilityScore: 1,
    minBreakPower: 0.45,
    glassColorHex: 0x204d28,
    liquidColorHex: 0xe6c86e,
    attenuationColorHex: 0x24592c,
    capColorHex: 0xd4af37,
    labelBgHex: '#faf3dd',
    labelTextHex: '#3c2a12',
    shardCount: 58,
    pitchBaseHz: 1950,
    thicknessFactor: 1.62,
    heightM: 0.32,
    radiusM: 0.046,
    descEn: 'Reinforced thick bottle that bursts with a pressurized cork pop and 58 shards.',
    descVi: 'Chai chịu lực cực dày, nổ bung nút bần kèm gần 60 mảnh kính tung toé.',
  },
  jug: {
    id: 'jug',
    nameEn: 'Heavy Glass Demijohn',
    nameVi: 'Bình Thuỷ Tinh Lớn',
    shortEn: 'Big Jug',
    shortVi: 'Bình Lớn',
    massKg: 1.35,
    fragility: 'Medium',
    fragilityScore: 2,
    minBreakPower: 0.32,
    glassColorHex: 0x2d6d73,
    liquidColorHex: 0x1e5c63,
    attenuationColorHex: 0x29737a,
    capColorHex: 0x8c5a32,
    labelBgHex: '#e9d8a6',
    labelTextHex: '#001219',
    shardCount: 66,
    pitchBaseHz: 1680,
    thicknessFactor: 1.75,
    heightM: 0.36,
    radiusM: 0.068,
    descEn: 'Massive 1.35 kg jug delivering maximum camera shake and thunderous shatter.',
    descVi: 'Bình đại 1.35 kg tạo chấn động rung màn hình và tiếng vỡ vang dội nhất.',
  },
};

export const BOTTLE_ORDER: BottleKind[] = [
  'soda',
  'perfume',
  'beer',
  'wine',
  'whiskey',
  'champagne',
  'jug',
];

export interface SurfaceSpec {
  id: WallStyle;
  nameEn: string;
  nameVi: string;
  shortEn: string;
  shortVi: string;
  descEn: string;
  descVi: string;
}

export const SURFACE_SPECS: SurfaceSpec[] = [
  {
    id: 'brick',
    nameEn: 'Rough Brick Wall',
    nameVi: 'Tường Gạch Thô',
    shortEn: 'Brick',
    shortVi: 'Gạch Thô',
    descEn: 'Earthy masonry thud with dusty mortar chips and soaked liquid splatters.',
    descVi: 'Tiếng đập trầm vào gạch thô kèm bụi vữa và vết chất lỏng loang lổ.',
  },
  {
    id: 'concrete',
    nameEn: 'Reinforced Concrete',
    nameVi: 'Tường Bê Tông',
    shortEn: 'Concrete',
    shortVi: 'Bê Tông',
    descEn: 'Hard acoustic slap-back transient and pale concrete impact craters.',
    descVi: 'Âm phản xạ đanh thép trên bê tông xám kèm vết nứt và bụi xi măng.',
  },
  {
    id: 'glass_window',
    nameEn: 'Tempered Glass Window',
    nameVi: 'Vách Kính Cường Lực',
    shortEn: 'Glass Pane',
    shortVi: 'Vách Kính',
    descEn: 'Dual-pane sympathetic shatter resonance with spiderweb crack decals.',
    descVi: 'Tiếng vỡ cộng hưởng kép vang dội cùng mạng nhện rạn nứt trên mặt kính.',
  },
  {
    id: 'metal',
    nameEn: 'Corrugated Metal Sheet',
    nameVi: 'Tấm Kim Loại / Tôn Thép',
    shortEn: 'Metal Sheet',
    shortVi: 'Kim Loại',
    descEn: 'Resonant metallic clang & sheet reverberation leaving bright steel dents.',
    descVi: 'Tiếng choang vang vọng đặc trưng của thép tấm cùng vết móp trầy kim loại.',
  },
];

export interface LocationSpec {
  id: EnvironmentLocation;
  nameEn: string;
  nameVi: string;
  descEn: string;
  descVi: string;
}

export const LOCATION_SPECS: LocationSpec[] = [
  {
    id: 'indoor',
    nameEn: 'Indoor Rage Room',
    nameVi: 'Phòng Xả Stress Kín',
    descEn: 'Enclosed concrete-and-steel bay with caged tungsten lamps, rubber floor mat, and stacked bottle crates.',
    descVi: 'Phòng bê tông và khung thép kín với đèn lồng công nghiệp, thảm cao su và thùng chai dự trữ.',
  },
  {
    id: 'alley',
    nameEn: 'Outdoor Urban Alley',
    nameVi: 'Hẻm Phố Ngoài Trời',
    descEn: 'Open-air brick alleyway flanked by weathered tenement facades, steel dumpsters, chain fencing, and streetlamps.',
    descVi: 'Con hẻm gạch ngoài trời kẹp giữa hai dãy tường nhà cũ, thùng rác thép, hàng rào và đèn đường.',
  },
  {
    id: 'construction',
    nameEn: 'Construction Site',
    nameVi: 'Công Trường Xây Dựng',
    descEn: 'Gritty open-air work zone with steel scaffolding towers, orange safety cones, hazard barricades, and gravel.',
    descVi: 'Công trường thoáng rộng với giàn giáo thép, cọc tiêu cam, rào chắn công trình và nền sỏi đá.',
  },
];

export interface ChallengeSpec {
  id: Exclude<GameMode, 'free'>;
  nameEn: string;
  nameVi: string;
  typeLabelEn: string;
  typeLabelVi: string;
  descEn: string;
  descVi: string;
  timeLimitSec: number;
  targetGoal: number; // targets count or score
  goalUnit: 'targets' | 'objects' | 'score';
}

export const CHALLENGE_SPECS: ChallengeSpec[] = [
  {
    id: 'moving_targets',
    nameEn: 'Moving Target Dash',
    nameVi: 'Hạ Mục Tiêu Di Động',
    typeLabelEn: 'Moving Targets',
    typeLabelVi: 'Mục tiêu di chuyển',
    descEn: 'Track and shatter 12 gliding steel target plates across the wall before the 45s clock runs out.',
    descVi: 'Ngắm chuẩn và đập trúng 12 tấm bia di chuyển ngang dọc trước khi hết 45 giây.',
    timeLimitSec: 45,
    targetGoal: 12,
    goalUnit: 'targets',
  },
  {
    id: 'breakable_objects',
    nameEn: 'Fragile Shelf Wipeout',
    nameVi: 'Quét Sạch Kệ Đồ Vỡ',
    typeLabelEn: 'Breakable Objects',
    typeLabelVi: 'Đập vỡ vật thể',
    descEn: 'Demolish all 15 fragile ceramic vases, jars, and neon tubes mounted on the racks within 40 seconds.',
    descVi: 'Phá nát toàn bộ 15 bình gốm, hũ thuỷ tinh và bóng đèn đặt trên kệ trong 40 giây.',
    timeLimitSec: 40,
    targetGoal: 15,
    goalUnit: 'objects',
  },
  {
    id: 'time_attack',
    nameEn: '30s Rage Blitz',
    nameVi: 'Cuồng Phong 30 Giây',
    typeLabelEn: 'Timed Score Attack',
    typeLabelVi: 'Ghi điểm tính giờ',
    descEn: 'Score 2,500 points in 30 seconds by chaining rapid throws and hitting the shifting glowing bonus ring.',
    descVi: 'Đạt 2.500 điểm trong 30 giây bằng chuỗi ném liên hoàn và đánh trúng vòng sáng thưởng.',
    timeLimitSec: 30,
    targetGoal: 2500,
    goalUnit: 'score',
  },
];

export const STRESS_TAG_PRESETS: string[] = [
  '',
  'DEADLINE',
  'ÁP LỰC',
  'KẸT XE',
  'MẤT NGỦ',
  'STRESS',
];

export interface EnvironmentConfig {
  location: EnvironmentLocation;
  lighting: LightingMode;
  weather: WeatherMode;
}

export interface ChallengeResult {
  mode: Exclude<GameMode, 'free'>;
  won: boolean;
  score: number;
  progress: number;
  goal: number;
  timeRemaining: number;
  bottlesThrown: number;
  stars: 0 | 1 | 2 | 3;
}

export interface HudSnapshot {
  bottlesSmashed: number;
  shardsCreated: number;
  comboCount: number;
  lastImpactForce: number;
  maxImpactForce: number;
  chargeRatio: number;
  isCharging: boolean;
  aimScreenX: number;
  aimScreenY: number;
  activeShardsInRoom: number;
  sessionSeconds: number;
  // Challenge state
  gameMode: GameMode;
  score: number;
  challengeProgress: number;
  challengeGoal: number;
  challengeTimeLeft: number;
  lastEventText: string;
}
