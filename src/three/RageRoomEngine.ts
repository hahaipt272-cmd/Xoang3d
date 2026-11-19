import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { glassAudio } from '../audio/glassAudio';
import {
  BOTTLE_SPECS,
  BottleKind,
  CHALLENGE_SPECS,
  ChallengeResult,
  EnvironmentLocation,
  GameMode,
  GamePhase,
  HudSnapshot,
  LightingMode,
  WallStyle,
  WeatherMode,
} from '../types/game';
import {
  BreakablePropKind,
  buildAlleyProps,
  buildBottleGroup,
  buildBreakableProp,
  buildConstructionProps,
  buildIndoorProps,
  buildMovingTargetPlate,
  buildShelfRack,
  createShardGeometry,
} from './models';
import {
  createGroundTexture,
  createWallImpactOverlay,
  createWallTextures,
  ImpactOverlayHandle,
  WallTextureSet,
} from './textures';

const WALL_Z = -4.2;
const WALL_WIDTH = 9.4;
const WALL_HEIGHT = 5.0;
const PLAYER_EYE_POS = new THREE.Vector3(0, 1.58, 2.55);
const GRAVITY = -13.5;

const MAX_SHARDS = 480;
const MAX_DUST = 220;
const MAX_RAIN = 320;

// Pre-allocated math helpers (zero GC inside animation loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -WALL_Z);

interface FlyingBottle {
  mesh: THREE.Group;
  kind: BottleKind;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  power: number;
  bounced: boolean;
  active: boolean;
}

interface ShardItem {
  active: boolean;
  settled: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  angVel: THREE.Vector3;
  scale: THREE.Vector3;
  colorHex: number;
}

interface DustItem {
  active: boolean;
  life: number;
  maxLife: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseScale: number;
}

interface RainDrop {
  x: number;
  y: number;
  z: number;
  speed: number;
  len: number;
}

interface MovingTargetItem {
  group: THREE.Group;
  baseY: number;
  x: number;
  y: number;
  phase: number;
  speed: number;
  ampX: number;
  respawnTimer: number;
  active: boolean;
}

interface BreakableObjectItem {
  group: THREE.Group;
  pos: THREE.Vector3;
  colorHex: number;
  broken: boolean;
}

export class RageRoomEngine {
  private mountEl: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private maxAnisotropy: number;

  private frameId = 0;
  private disposed = false;
  private lastTimeMs = 0;

  private phase: GamePhase = 'title';
  private gameMode: GameMode = 'free';
  private bottleKind: BottleKind = 'beer';
  private wallStyle: WallStyle = 'brick';
  private location: EnvironmentLocation = 'indoor';
  private lighting: LightingMode = 'night';
  private weather: WeatherMode = 'clear';
  private stressTag = 'DEADLINE';
  private slowMo = false;

  // Lighting refs
  private hemiLight!: THREE.HemisphereLight;
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private practicalLights: THREE.PointLight[] = [];
  private flashLight!: THREE.PointLight;
  private flashIntensity = 0;

  // Room & Environment visuals
  private floorMesh!: THREE.Mesh;
  private floorMaterial!: THREE.MeshStandardMaterial;
  private groundTextureCache = new Map<
    EnvironmentLocation,
    { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture }
  >();
  private locationPropsGroup: THREE.Group | null = null;

  private wallMesh!: THREE.Mesh;
  private wallMaterial!: THREE.MeshStandardMaterial;
  private wallTextureCache = new Map<WallStyle, WallTextureSet>();
  private impactOverlay!: ImpactOverlayHandle;
  private titleHeroBottle: THREE.Group | null = null;

  // Rain system
  private rainMesh!: THREE.InstancedMesh;
  private rainDrops: RainDrop[] = [];

  // Challenge Mode entities
  private challengeGroup = new THREE.Group();
  private movingTargets: MovingTargetItem[] = [];
  private breakableObjects: BreakableObjectItem[] = [];
  private bonusZoneMesh: THREE.Group | null = null;
  private bonusZonePos = new THREE.Vector2(0, 2.0);
  private bonusZoneTimer = 0;

  // Held bottle & aiming
  private heldBottleGroup: THREE.Group | null = null;
  private heldReloadTimer = 0;
  private aimWorld = new THREE.Vector3(0, 1.85, WALL_Z);
  private aimTargetWorld = new THREE.Vector3(0, 1.85, WALL_Z);
  private aimScreenX = 0.5;
  private aimScreenY = 0.45;
  private pointerDown = false;
  private spaceDown = false;
  private chargeRatio = 0;
  private trajectoryDots: THREE.Mesh[] = [];

  // Pools
  private flyingBottles: FlyingBottle[] = [];
  private shardsMesh!: THREE.InstancedMesh;
  private shards: ShardItem[] = [];
  private shardWriteCursor = 0;

  private dustMesh!: THREE.InstancedMesh;
  private dusts: DustItem[] = [];
  private dustWriteCursor = 0;

  // Camera & feel
  private hitstopTimer = 0;
  private cameraShake = 0;
  private cameraPitchRecoil = 0;
  private titleTime = 0;

  // Stats & Challenge tracking
  private bottlesSmashed = 0;
  private bottlesThrown = 0;
  private shardsCreated = 0;
  private comboCount = 0;
  private comboResetTimer = 0;
  private lastImpactForce = 0;
  private maxImpactForce = 0;
  private sessionSeconds = 0;

  private score = 0;
  private challengeProgress = 0;
  private challengeGoal = 0;
  private challengeTimeLeft = 0;
  private challengeEnded = false;
  private lastEventText = '';
  private eventTextTimer = 0;

  private lastHudEmitMs = 0;
  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onChallengeComplete: (result: ChallengeResult) => void;

  constructor(
    mountEl: HTMLElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onChallengeComplete: (result: ChallengeResult) => void,
  ) {
    this.mountEl = mountEl;
    this.onHudUpdate = onHudUpdate;
    this.onChallengeComplete = onChallengeComplete;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(
      mountEl.clientWidth || window.innerWidth,
      mountEl.clientHeight || window.innerHeight,
    );
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    mountEl.innerHTML = '';
    mountEl.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111318);
    this.scene.fog = new THREE.FogExp2(0x111318, 0.03);

    const aspect =
      (mountEl.clientWidth || window.innerWidth) /
      (mountEl.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(54, aspect, 0.08, 80);
    this.camera.position.set(1.85, 2.05, 3.6);
    this.camera.lookAt(0, 1.6, WALL_Z);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.setupLighting();
    this.setupBaseArena();
    this.rebuildLocationProps();
    this.applyLightingAndWeather();
    this.setupShardPool();
    this.setupDustPool();
    this.setupRainPool();
    this.setupTrajectoryDots();
    this.scene.add(this.challengeGroup);
    this.rebuildHeldBottle();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.lastTimeMs = performance.now();
    this.startLoop();
  }

  private setupLighting(): void {
    this.hemiLight = new THREE.HemisphereLight(0x6c8bb8, 0x261f18, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffe1b5, 2.35);
    this.keyLight.position.set(2.4, 5.4, 3.2);
    this.keyLight.target.position.set(0, 1.4, WALL_Z + 1.2);
    this.scene.add(this.keyLight.target);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    const d = 6.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x6b93d6, 0.75);
    this.rimLight.position.set(-4.2, 3.6, 1.5);
    this.scene.add(this.rimLight);

    for (const lx of [-2.4, 0, 2.4]) {
      const pLight = new THREE.PointLight(0xffcb85, 4.2, 10.5, 1.7);
      pLight.position.set(lx, 4.15, WALL_Z + 1.35);
      this.scene.add(pLight);
      this.practicalLights.push(pLight);
    }

    this.flashLight = new THREE.PointLight(0xffeed4, 0, 7.5, 1.8);
    this.flashLight.position.set(0, 2, WALL_Z + 0.5);
    this.scene.add(this.flashLight);

    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const areaLight = new THREE.RectAreaLight(0xfff0d6, 2.6, 6.8, 1.4);
      areaLight.position.set(0, 4.4, WALL_Z + 2.4);
      areaLight.lookAt(0, 1.5, WALL_Z);
      this.scene.add(areaLight);
    }
  }

  private setupBaseArena(): void {
    // Extended ground plane (covers both indoor bay and open-air outdoor arenas into horizon fog)
    const groundTex = createGroundTexture('indoor', this.maxAnisotropy);
    this.groundTextureCache.set('indoor', groundTex);

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: groundTex.map,
      roughnessMap: groundTex.roughnessMap,
      roughness: 0.78,
      metalness: 0.08,
    });
    this.floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), this.floorMaterial);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Target Wall
    this.wallTextureCache.set('brick', createWallTextures('brick', this.maxAnisotropy));
    const initialTex = this.wallTextureCache.get('brick')!;
    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: initialTex.map,
      bumpMap: initialTex.bumpMap,
      bumpScale: 0.035,
      roughness: 0.88,
      metalness: 0.05,
    });
    this.wallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(WALL_WIDTH, WALL_HEIGHT),
      this.wallMaterial,
    );
    this.wallMesh.position.set(0, WALL_HEIGHT / 2, WALL_Z);
    this.wallMesh.receiveShadow = true;
    this.scene.add(this.wallMesh);

    // Dynamic impact overlay plane
    this.impactOverlay = createWallImpactOverlay(this.maxAnisotropy);
    const overlayMat = new THREE.MeshBasicMaterial({
      map: this.impactOverlay.texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const overlayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(WALL_WIDTH, WALL_HEIGHT),
      overlayMat,
    );
    overlayMesh.position.set(0, WALL_HEIGHT / 2, WALL_Z + 0.014);
    overlayMesh.renderOrder = 2;
    this.scene.add(overlayMesh);

    // Concrete baseboard curb along target wall bottom (grounded at y = 0)
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x35383f,
      roughness: 0.9,
      metalness: 0.05,
    });
    const curb = new THREE.Mesh(new THREE.BoxGeometry(WALL_WIDTH + 0.4, 0.24, 0.28), curbMat);
    curb.position.set(0, 0.12, WALL_Z + 0.14);
    curb.castShadow = true;
    curb.receiveShadow = true;
    this.scene.add(curb);

    // Structural steel framing columns & top header beam around target wall
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.36,
      metalness: 0.82,
    });
    for (const sx of [-WALL_WIDTH / 2 - 0.16, WALL_WIDTH / 2 + 0.16]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, WALL_HEIGHT + 0.4, 0.38), steelMat);
      col.position.set(sx, (WALL_HEIGHT + 0.4) / 2, WALL_Z + 0.14);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);
    }
    const headerBeam = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_WIDTH + 0.8, 0.34, 0.42),
      steelMat,
    );
    headerBeam.position.set(0, WALL_HEIGHT + 0.1, WALL_Z + 0.18);
    headerBeam.castShadow = true;
    this.scene.add(headerBeam);

    // Hero display bottle resting on foreground crate for Title Screen
    this.titleHeroBottle = buildBottleGroup(
      'whiskey',
      this.stressTag,
      this.isSoftwareGl,
      this.maxAnisotropy,
      true,
    );
    this.titleHeroBottle.position.set(0.95, 0.37, 1.15);
    this.titleHeroBottle.scale.setScalar(1.15);
    this.scene.add(this.titleHeroBottle);
  }

  private rebuildLocationProps(): void {
    if (this.locationPropsGroup) {
      this.scene.remove(this.locationPropsGroup);
      this.disposeObject(this.locationPropsGroup);
      this.locationPropsGroup = null;
    }

    if (this.location === 'indoor') {
      this.locationPropsGroup = buildIndoorProps(
        WALL_Z,
        WALL_WIDTH,
        WALL_HEIGHT,
        this.isSoftwareGl,
        this.maxAnisotropy,
      );
    } else if (this.location === 'alley') {
      this.locationPropsGroup = buildAlleyProps(
        WALL_Z,
        WALL_WIDTH,
        this.isSoftwareGl,
        this.maxAnisotropy,
      );
    } else {
      this.locationPropsGroup = buildConstructionProps(
        WALL_Z,
        this.isSoftwareGl,
        this.maxAnisotropy,
      );
    }
    this.scene.add(this.locationPropsGroup);

    // Update ground texture for location
    let gTex = this.groundTextureCache.get(this.location);
    if (!gTex) {
      gTex = createGroundTexture(this.location, this.maxAnisotropy);
      this.groundTextureCache.set(this.location, gTex);
    }
    this.floorMaterial.map = gTex.map;
    this.floorMaterial.roughnessMap = gTex.roughnessMap;
    this.floorMaterial.needsUpdate = true;
  }

  private applyLightingAndWeather(): void {
    const isDay = this.lighting === 'day';
    const isRain = this.weather === 'rainy';
    const isOutdoor = this.location !== 'indoor';

    if (isDay) {
      const skyHex = isRain ? 0x627385 : isOutdoor ? 0x8db6db : 0x293242;
      this.scene.background = new THREE.Color(skyHex);
      this.scene.fog = new THREE.FogExp2(skyHex, isRain ? 0.038 : isOutdoor ? 0.022 : 0.025);

      this.hemiLight.color.setHex(isRain ? 0x9bb0c7 : 0xcce4ff);
      this.hemiLight.groundColor.setHex(0x463d34);
      this.hemiLight.intensity = isOutdoor ? (isRain ? 1.15 : 1.45) : 1.15;

      this.keyLight.color.setHex(isRain ? 0xdde8f2 : 0xfff3db);
      this.keyLight.intensity = isOutdoor ? (isRain ? 1.75 : 2.85) : 2.2;
      this.keyLight.position.set(3.8, 7.2, 4.2);

      this.rimLight.color.setHex(0x88b4e6);
      this.rimLight.intensity = 0.85;

      for (const pl of this.practicalLights) {
        pl.intensity = isOutdoor ? 1.2 : 2.4;
      }
      this.renderer.toneMappingExposure = isRain ? 1.05 : 1.18;
    } else {
      const nightHex = isOutdoor ? 0x090d16 : 0x0f1218;
      this.scene.background = new THREE.Color(nightHex);
      this.scene.fog = new THREE.FogExp2(nightHex, isRain ? 0.042 : 0.03);

      this.hemiLight.color.setHex(0x4e6b9c);
      this.hemiLight.groundColor.setHex(0x1f1914);
      this.hemiLight.intensity = 0.78;

      this.keyLight.color.setHex(isOutdoor ? 0x9ab8e8 : 0xffe0b2);
      this.keyLight.intensity = isOutdoor ? 1.45 : 2.25;
      this.keyLight.position.set(2.4, 5.4, 3.2);

      this.rimLight.color.setHex(0x638cd1);
      this.rimLight.intensity = 0.78;

      for (const pl of this.practicalLights) {
        pl.intensity = 4.5;
      }
      this.renderer.toneMappingExposure = 1.12;
    }

    // Wet surface sheen when rainy
    this.floorMaterial.roughness = isRain ? 0.24 : 0.82;
    this.floorMaterial.metalness = isRain ? 0.22 : 0.08;
    this.floorMaterial.needsUpdate = true;

    if (this.rainMesh) {
      this.rainMesh.visible = isRain;
    }
    glassAudio.setRainAmbience(isRain);
  }

  private setupShardPool(): void {
    const shardGeo = createShardGeometry();
    const shardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.1,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });

    this.shardsMesh = new THREE.InstancedMesh(shardGeo, shardMat, MAX_SHARDS);
    this.shardsMesh.frustumCulled = false;
    this.shardsMesh.castShadow = !this.isSoftwareGl;

    for (let i = 0; i < MAX_SHARDS; i++) {
      this.shards.push({
        active: false,
        settled: false,
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        angVel: new THREE.Vector3(),
        scale: new THREE.Vector3(1, 1, 1),
        colorHex: 0xffffff,
      });
      _mat4.makeScale(0, 0, 0);
      this.shardsMesh.setMatrixAt(i, _mat4);
      this.shardsMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.shardsMesh.instanceMatrix.needsUpdate = true;
    if (this.shardsMesh.instanceColor) this.shardsMesh.instanceColor.needsUpdate = true;
    this.shardsMesh.computeBoundingSphere();
    this.scene.add(this.shardsMesh);
  }

  private setupDustPool(): void {
    const dustGeo = new THREE.DodecahedronGeometry(0.025, 0);
    const dustMat = new THREE.MeshStandardMaterial({
      color: 0xe6e4dc,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.65,
    });

    this.dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, MAX_DUST);
    this.dustMesh.frustumCulled = false;

    for (let i = 0; i < MAX_DUST; i++) {
      this.dusts.push({
        active: false,
        life: 0,
        maxLife: 0.5,
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        baseScale: 1,
      });
      _mat4.makeScale(0, 0, 0);
      this.dustMesh.setMatrixAt(i, _mat4);
      this.dustMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.dustMesh.instanceMatrix.needsUpdate = true;
    if (this.dustMesh.instanceColor) this.dustMesh.instanceColor.needsUpdate = true;
    this.dustMesh.computeBoundingSphere();
    this.scene.add(this.dustMesh);
  }

  private setupRainPool(): void {
    const rainGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.42, 4);
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0xb9d6f2,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    this.rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, MAX_RAIN);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = this.weather === 'rainy';

    for (let i = 0; i < MAX_RAIN; i++) {
      const drop: RainDrop = {
        x: (Math.random() - 0.5) * 12,
        y: Math.random() * 6.5,
        z: WALL_Z + Math.random() * 9.5,
        speed: 11 + Math.random() * 5,
        len: 0.8 + Math.random() * 0.7,
      };
      this.rainDrops.push(drop);
      _euler.set(0.04, 0, -0.06);
      _quat.setFromEuler(_euler);
      _scale.set(1, drop.len, 1);
      _mat4.compose(_vec3A.set(drop.x, drop.y, drop.z), _quat, _scale);
      this.rainMesh.setMatrixAt(i, _mat4);
    }
    this.rainMesh.instanceMatrix.needsUpdate = true;
    this.rainMesh.computeBoundingSphere();
    this.scene.add(this.rainMesh);
  }

  private setupTrajectoryDots(): void {
    const dotGeo = new THREE.SphereGeometry(0.024, 8, 8);
    for (let i = 0; i < 8; i++) {
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.55 - i * 0.055,
        depthWrite: false,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.visible = false;
      this.scene.add(dot);
      this.trajectoryDots.push(dot);
    }
  }

  private clearChallengeEntities(): void {
    while (this.challengeGroup.children.length > 0) {
      const child = this.challengeGroup.children[0];
      this.challengeGroup.remove(child);
      this.disposeObject(child);
    }
    this.movingTargets = [];
    this.breakableObjects = [];
    this.bonusZoneMesh = null;
  }

  private setupChallengeEntities(): void {
    this.clearChallengeEntities();
    this.score = 0;
    this.challengeProgress = 0;
    this.challengeEnded = false;
    this.lastEventText = '';

    if (this.gameMode === 'free') {
      this.challengeGoal = 0;
      this.challengeTimeLeft = 0;
      return;
    }

    const spec = CHALLENGE_SPECS.find((c) => c.id === this.gameMode)!;
    this.challengeGoal = spec.targetGoal;
    this.challengeTimeLeft = spec.timeLimitSec;

    if (this.gameMode === 'moving_targets') {
      const railYPositions = [1.25, 2.15, 3.05];
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x333945,
        roughness: 0.4,
        metalness: 0.8,
      });
      for (let i = 0; i < 3; i++) {
        const y = railYPositions[i];
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, WALL_WIDTH - 0.8, 8),
          railMat,
        );
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, y + 0.44, WALL_Z + 0.38);
        this.challengeGroup.add(rail);

        const plate = buildMovingTargetPlate();
        plate.position.set(0, y, WALL_Z + 0.38);
        this.challengeGroup.add(plate);

        this.movingTargets.push({
          group: plate,
          baseY: y,
          x: 0,
          y,
          phase: i * 2.1,
          speed: 1.25 + i * 0.35,
          ampX: 3.1 - i * 0.2,
          respawnTimer: 0,
          active: true,
        });
      }
    } else if (this.gameMode === 'breakable_objects') {
      const rack = buildShelfRack(6.4);
      rack.position.set(0, 0, WALL_Z + 0.36);
      this.challengeGroup.add(rack);

      const propKinds: BreakablePropKind[] = ['vase', 'jar', 'neon_tube', 'flask'];
      // 8 on lower shelf (y = 1.13), 7 on upper shelf (y = 2.23) = 15 objects!
      const shelfConfigs = [
        { y: 1.13, count: 8, span: 5.6 },
        { y: 2.23, count: 7, span: 5.2 },
      ];
      let idx = 0;
      for (const shelf of shelfConfigs) {
        for (let i = 0; i < shelf.count; i++) {
          const t = shelf.count > 1 ? i / (shelf.count - 1) : 0.5;
          const x = (t - 0.5) * shelf.span;
          const kind = propKinds[idx % propKinds.length];
          const { group, colorHex } = buildBreakableProp(kind, this.isSoftwareGl);
          group.position.set(x, shelf.y, WALL_Z + 0.36);
          this.challengeGroup.add(group);
          this.breakableObjects.push({
            group,
            pos: new THREE.Vector3(x, shelf.y + 0.16, WALL_Z + 0.36),
            colorHex,
            broken: false,
          });
          idx++;
        }
      }
    } else if (this.gameMode === 'time_attack') {
      const ringGroup = new THREE.Group();
      const outer = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.032, 10, 32),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.8,
          roughness: 0.2,
        }),
      );
      const inner = new THREE.Mesh(
        new THREE.CircleGeometry(0.42, 24),
        new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      ringGroup.add(outer);
      ringGroup.add(inner);
      this.bonusZonePos.set(0, 2.0);
      ringGroup.position.set(0, 2.0, WALL_Z + 0.05);
      this.challengeGroup.add(ringGroup);
      this.bonusZoneMesh = ringGroup;
      this.bonusZoneTimer = 4.5;
    }
  }

  private relocateBonusZone(): void {
    this.bonusZonePos.set(
      (Math.random() - 0.5) * (WALL_WIDTH - 2.2),
      1.0 + Math.random() * 2.2,
    );
    if (this.bonusZoneMesh) {
      this.bonusZoneMesh.position.set(this.bonusZonePos.x, this.bonusZonePos.y, WALL_Z + 0.05);
    }
    this.bonusZoneTimer = 4.2;
  }

  private rebuildHeldBottle(): void {
    if (this.heldBottleGroup) {
      this.scene.remove(this.heldBottleGroup);
      this.disposeObject(this.heldBottleGroup);
      this.heldBottleGroup = null;
    }
    this.heldBottleGroup = buildBottleGroup(
      this.bottleKind,
      this.stressTag,
      this.isSoftwareGl,
      this.maxAnisotropy,
      true,
    );
    this.heldBottleGroup.visible = this.phase === 'playing';
    this.scene.add(this.heldBottleGroup);
  }

  public setPhase(phase: GamePhase): void {
    this.phase = phase;
    if (phase !== 'playing') {
      this.pointerDown = false;
      this.spaceDown = false;
      this.chargeRatio = 0;
    }
    if (this.heldBottleGroup) {
      this.heldBottleGroup.visible = phase === 'playing';
    }
    if (this.titleHeroBottle) {
      this.titleHeroBottle.visible = phase === 'title';
    }
    this.updateTrajectoryVisibility();
    this.emitHud(true);
  }

  public startGameMode(mode: GameMode): void {
    this.gameMode = mode;
    this.cleanRoom();
    this.bottlesSmashed = 0;
    this.bottlesThrown = 0;
    this.comboCount = 0;
    this.sessionSeconds = 0;
    this.setupChallengeEntities();
    this.setPhase('playing');
  }

  public setBottleKind(kind: BottleKind): void {
    if (this.bottleKind === kind) return;
    this.bottleKind = kind;
    this.heldReloadTimer = 0.22;
    this.rebuildHeldBottle();
    glassAudio.playBottlePickup(BOTTLE_SPECS[kind].pitchBaseHz);
  }

  public setWallStyle(style: WallStyle): void {
    if (this.wallStyle === style) return;
    this.wallStyle = style;
    let texSet = this.wallTextureCache.get(style);
    if (!texSet) {
      texSet = createWallTextures(style, this.maxAnisotropy);
      this.wallTextureCache.set(style, texSet);
    }
    this.wallMaterial.map = texSet.map;
    this.wallMaterial.bumpMap = texSet.bumpMap;

    if (style === 'glass_window') {
      this.wallMaterial.transparent = true;
      this.wallMaterial.opacity = 0.44;
      this.wallMaterial.roughness = 0.06;
      this.wallMaterial.metalness = 0.16;
      this.wallMaterial.envMapIntensity = 1.9;
      this.wallMaterial.bumpScale = 0.012;
    } else if (style === 'metal') {
      this.wallMaterial.transparent = false;
      this.wallMaterial.opacity = 1.0;
      this.wallMaterial.roughness = 0.34;
      this.wallMaterial.metalness = 0.78;
      this.wallMaterial.envMapIntensity = 1.4;
      this.wallMaterial.bumpScale = 0.025;
    } else {
      this.wallMaterial.transparent = false;
      this.wallMaterial.opacity = 1.0;
      this.wallMaterial.roughness = 0.88;
      this.wallMaterial.metalness = 0.05;
      this.wallMaterial.envMapIntensity = 1.0;
      this.wallMaterial.bumpScale = 0.035;
    }
    this.wallMaterial.needsUpdate = true;
  }

  public setEnvironment(
    location: EnvironmentLocation,
    lighting: LightingMode,
    weather: WeatherMode,
  ): void {
    const locChanged = this.location !== location;
    this.location = location;
    this.lighting = lighting;
    this.weather = weather;

    if (locChanged) {
      this.rebuildLocationProps();
    }
    this.applyLightingAndWeather();
  }

  public setStressTag(tag: string): void {
    const clean = tag.slice(0, 14);
    if (this.stressTag === clean) return;
    this.stressTag = clean;
    this.rebuildHeldBottle();
  }

  public setSlowMo(enabled: boolean): void {
    this.slowMo = enabled;
  }

  public cleanRoom(): void {
    this.impactOverlay.clear();
    for (let i = 0; i < MAX_SHARDS; i++) {
      this.shards[i].active = false;
      this.shards[i].settled = false;
      _mat4.makeScale(0, 0, 0);
      this.shardsMesh.setMatrixAt(i, _mat4);
    }
    this.shardsMesh.instanceMatrix.needsUpdate = true;
    glassAudio.playSweepBroom();
    this.emitHud(true);
  }

  public resetSession(): void {
    this.cleanRoom();
    this.bottlesSmashed = 0;
    this.bottlesThrown = 0;
    this.shardsCreated = 0;
    this.comboCount = 0;
    this.lastImpactForce = 0;
    this.maxImpactForce = 0;
    this.sessionSeconds = 0;
    this.setupChallengeEntities();
    this.emitHud(true);
  }

  private updateTrajectoryVisibility(): void {
    const show = this.phase === 'playing' && (this.pointerDown || this.spaceDown);
    for (let i = 0; i < this.trajectoryDots.length; i++) {
      this.trajectoryDots[i].visible = show;
    }
  }

  private getThrowOrigin(out: THREE.Vector3): THREE.Vector3 {
    return out.set(0.34, 1.32, PLAYER_EYE_POS.z - 0.52);
  }

  private computeBallisticVelocity(
    origin: THREE.Vector3,
    target: THREE.Vector3,
    powerRatio: number,
    outVel: THREE.Vector3,
  ): void {
    const spec = BOTTLE_SPECS[this.bottleKind];
    // Lighter bottles fly slightly faster; heavier bottles have heftier arc
    const weightPenalty = Math.max(0.84, 1.12 - spec.massKg * 0.22);
    const speed = (11.5 + powerRatio * 12.2) * weightPenalty;
    const dist = origin.distanceTo(target);
    const flightTime = Math.max(0.15, dist / speed);

    outVel.set(
      (target.x - origin.x) / flightTime,
      (target.y - origin.y - 0.5 * GRAVITY * flightTime * flightTime) / flightTime,
      (target.z - origin.z) / flightTime,
    );
  }

  private launchBottle(powerRatio: number): void {
    if (this.phase !== 'playing') return;
    glassAudio.unlock();

    const clampedPower = THREE.MathUtils.clamp(powerRatio, 0.22, 1.0);
    const origin = this.getThrowOrigin(_vec3A).clone();
    const vel = new THREE.Vector3();
    this.computeBallisticVelocity(origin, this.aimWorld, clampedPower, vel);

    const mesh = buildBottleGroup(
      this.bottleKind,
      this.stressTag,
      this.isSoftwareGl,
      this.maxAnisotropy,
      true,
    );
    mesh.position.copy(origin);
    mesh.rotation.set(-0.35, 0, 0.15);
    this.scene.add(mesh);

    this.bottlesThrown += 1;
    this.flyingBottles.push({
      mesh,
      kind: this.bottleKind,
      pos: origin,
      vel,
      angVel: new THREE.Vector3(
        -(9 + clampedPower * 12),
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 5,
      ),
      power: clampedPower,
      bounced: false,
      active: true,
    });

    glassAudio.playThrowWhoosh(clampedPower, this.slowMo);
    this.heldReloadTimer = 0.26;
    this.cameraPitchRecoil = 0.025 + clampedPower * 0.03;
  }

  private spawnShardsAt(
    pos: THREE.Vector3,
    normal: THREE.Vector3,
    count: number,
    baseColorHex: number,
    power: number,
    thicknessFactor: number,
  ): void {
    this.shardsCreated += count;
    for (let i = 0; i < count; i++) {
      const idx = this.shardWriteCursor;
      this.shardWriteCursor = (this.shardWriteCursor + 1) % MAX_SHARDS;

      const s = this.shards[idx];
      s.active = true;
      s.settled = false;
      s.pos.set(
        pos.x + (Math.random() - 0.5) * 0.15,
        Math.max(0.06, pos.y + (Math.random() - 0.5) * 0.18),
        Math.max(WALL_Z + 0.04, pos.z + (Math.random() - 0.5) * 0.08),
      );

      const spreadSpeed = (1.8 + Math.random() * 4.8) * (0.65 + power * 0.55);
      const outDirX = (Math.random() - 0.5) * 2.2;
      const outDirY = (Math.random() - 0.25) * 1.9;
      const outDirZ = normal.z * (0.45 + Math.random() * 0.9);
      s.vel.set(outDirX, outDirY, outDirZ).normalize().multiplyScalar(spreadSpeed);
      if (normal.y > 0.5) {
        s.vel.y = Math.abs(s.vel.y) * 0.8 + 1.4;
      }

      s.rot.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      s.angVel.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24,
      );

      const sizeMult = (0.55 + Math.random() * 1.25) * (0.8 + thicknessFactor * 0.25);
      s.scale.set(sizeMult, sizeMult, sizeMult * (0.7 + Math.random() * 0.6));

      let tint = baseColorHex;
      if (i % 6 === 0) tint = 0xdff6ff;
      else if (i % 11 === 0) tint = 0xf0e4cf;
      s.colorHex = tint;
      this.shardsMesh.setColorAt(idx, _color.setHex(tint));
    }
    if (this.shardsMesh.instanceColor) {
      this.shardsMesh.instanceColor.needsUpdate = true;
    }
  }

  private shatterBottle(
    bottle: FlyingBottle,
    hitNormal: THREE.Vector3,
    overrideShardColor?: number,
    isWallHit = true,
  ): void {
    const spec = BOTTLE_SPECS[bottle.kind];
    const impactSpeed = bottle.vel.length();

    this.bottlesSmashed += 1;
    this.comboCount += 1;
    this.comboResetTimer = 3.2;

    const forceNewtons = Math.round(spec.massKg * impactSpeed * 28);
    this.lastImpactForce = forceNewtons;
    if (forceNewtons > this.maxImpactForce) {
      this.maxImpactForce = forceNewtons;
    }

    const panX = THREE.MathUtils.clamp(bottle.pos.x / (WALL_WIDTH * 0.45), -0.85, 0.85);
    glassAudio.playWallShatter(spec, impactSpeed, panX, this.wallStyle, this.slowMo);

    if (isWallHit && bottle.pos.z <= WALL_Z + 0.35) {
      const u = (bottle.pos.x + WALL_WIDTH / 2) / WALL_WIDTH;
      const v = bottle.pos.y / WALL_HEIGHT;
      this.impactOverlay.stampImpact(
        u,
        v,
        spec.liquidColorHex,
        38 + bottle.power * 34,
        this.wallStyle,
      );
    }

    // Extra window shards if hitting glass_window
    const totalShards =
      spec.shardCount + (isWallHit && this.wallStyle === 'glass_window' ? 14 : 0);
    this.spawnShardsAt(
      bottle.pos,
      hitNormal,
      totalShards,
      overrideShardColor ?? spec.glassColorHex,
      bottle.power,
      spec.thicknessFactor,
    );

    // Dust/mist burst
    const dustCount = 22;
    for (let i = 0; i < dustCount; i++) {
      const idx = this.dustWriteCursor;
      this.dustWriteCursor = (this.dustWriteCursor + 1) % MAX_DUST;
      const d = this.dusts[idx];
      d.active = true;
      d.life = 0;
      d.maxLife = 0.35 + Math.random() * 0.45;
      d.pos.copy(bottle.pos);
      d.pos.z = Math.max(WALL_Z + 0.05, d.pos.z);
      d.vel.set(
        (Math.random() - 0.5) * 3.8,
        (Math.random() - 0.2) * 3.2,
        hitNormal.z * (0.6 + Math.random() * 2.2),
      );
      d.baseScale = 0.7 + Math.random() * 1.6;
      const mistColor = i % 3 === 0 ? spec.liquidColorHex : 0xdcdad2;
      this.dustMesh.setColorAt(idx, _color.setHex(mistColor));
    }
    if (this.dustMesh.instanceColor) {
      this.dustMesh.instanceColor.needsUpdate = true;
    }

    // Time Attack bonus zone check
    if (this.gameMode === 'time_attack' && !this.challengeEnded && isWallHit) {
      const distToZone = Math.hypot(
        bottle.pos.x - this.bonusZonePos.x,
        bottle.pos.y - this.bonusZonePos.y,
      );
      const mult = Math.min(4, 1 + Math.floor(this.comboCount / 3));
      if (distToZone <= 0.58) {
        const pts = 250 * mult;
        this.score += pts;
        this.challengeProgress = this.score;
        this.setEventText(`BULLSEYE +${pts}`);
        glassAudio.playTargetHit(this.comboCount, false);
        this.relocateBonusZone();
      } else {
        const pts = 80 * mult;
        this.score += pts;
        this.challengeProgress = this.score;
      }

      if (this.score >= this.challengeGoal) {
        this.finishChallenge(true);
      }
    }

    this.hitstopTimer = bottle.power > 0.72 ? 0.036 : 0.016;
    this.cameraShake = Math.min(0.16, this.cameraShake + 0.045 + bottle.power * 0.085);
    this.flashLight.position.set(
      bottle.pos.x,
      bottle.pos.y,
      Math.max(WALL_Z + 0.45, bottle.pos.z),
    );
    this.flashIntensity = 4.5 + bottle.power * 5.0;

    this.scene.remove(bottle.mesh);
    this.disposeObject(bottle.mesh);
    bottle.active = false;

    this.emitHud(true);
  }

  private setEventText(txt: string): void {
    this.lastEventText = txt;
    this.eventTextTimer = 1.6;
  }

  private finishChallenge(won: boolean): void {
    if (this.challengeEnded || this.gameMode === 'free') return;
    this.challengeEnded = true;
    glassAudio.playChallengeEnd(won);

    const spec = CHALLENGE_SPECS.find((c) => c.id === this.gameMode)!;
    let stars: 0 | 1 | 2 | 3 = 0;
    if (won) {
      const timeRatio = this.challengeTimeLeft / spec.timeLimitSec;
      stars = timeRatio > 0.35 ? 3 : timeRatio > 0.12 ? 2 : 1;
    }

    this.setPhase('challenge_result');
    this.onChallengeComplete({
      mode: this.gameMode,
      won,
      score: this.score,
      progress: this.challengeProgress,
      goal: this.challengeGoal,
      timeRemaining: Math.max(0, this.challengeTimeLeft),
      bottlesThrown: this.bottlesThrown,
      stars,
    });
  }

  private updateAimFromClient(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    this.aimScreenX = THREE.MathUtils.clamp(nx, 0.08, 0.92);
    this.aimScreenY = THREE.MathUtils.clamp(ny, 0.08, 0.88);

    _ndc.set(this.aimScreenX * 2 - 1, -(this.aimScreenY * 2 - 1));
    _raycaster.setFromCamera(_ndc, this.camera);

    if (_raycaster.ray.intersectPlane(_wallPlane, _vec3A)) {
      this.aimTargetWorld.set(
        THREE.MathUtils.clamp(_vec3A.x, -WALL_WIDTH / 2 + 0.35, WALL_WIDTH / 2 - 0.35),
        THREE.MathUtils.clamp(_vec3A.y, 0.38, WALL_HEIGHT - 0.45),
        WALL_Z,
      );
    }
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    const onPointerMove = (e: PointerEvent) => {
      if (this.phase !== 'playing') return;
      this.updateAimFromClient(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.phase !== 'playing') return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      glassAudio.unlock();
      this.updateAimFromClient(e.clientX, e.clientY);
      this.pointerDown = true;
      this.chargeRatio = 0.48;
      this.updateTrajectoryVisibility();
    };

    const onPointerUp = () => {
      if (this.phase !== 'playing') return;
      if (this.pointerDown) {
        const power = this.chargeRatio;
        this.pointerDown = false;
        this.chargeRatio = 0;
        this.updateTrajectoryVisibility();
        this.launchBottle(power);
      }
    };

    const onResize = () => {
      if (this.disposed) return;
      const w = this.mountEl.clientWidth || window.innerWidth;
      const h = this.mountEl.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    const onBlur = () => {
      this.pointerDown = false;
      this.spaceDown = false;
      this.chargeRatio = 0;
      this.updateTrajectoryVisibility();
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', onBlur);

    this.cleanupListeners = () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('blur', onBlur);
    };
  }

  public startSpaceCharge(): void {
    if (this.phase !== 'playing' || this.spaceDown) return;
    glassAudio.unlock();
    this.spaceDown = true;
    this.chargeRatio = 0.55;
    this.updateTrajectoryVisibility();
  }

  public releaseSpaceCharge(): void {
    if (this.phase !== 'playing' || !this.spaceDown) return;
    const power = this.chargeRatio;
    this.spaceDown = false;
    this.chargeRatio = 0;
    this.updateTrajectoryVisibility();
    this.launchBottle(power);
  }

  private cleanupListeners: () => void = () => {};

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTimeMs) / 1000;
      this.lastTimeMs = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.step(dt, now);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepRain(dt: number): void {
    if (this.weather !== 'rainy' || !this.rainMesh) return;
    for (let i = 0; i < MAX_RAIN; i++) {
      const r = this.rainDrops[i];
      r.y -= r.speed * dt;
      r.x -= 0.7 * dt;
      if (r.y < 0.05) {
        r.y = 6.2 + Math.random() * 1.2;
        r.x = (Math.random() - 0.5) * 12;
      }
      _euler.set(0.04, 0, -0.06);
      _quat.setFromEuler(_euler);
      _scale.set(1, r.len, 1);
      _mat4.compose(_vec3A.set(r.x, r.y, r.z), _quat, _scale);
      this.rainMesh.setMatrixAt(i, _mat4);
    }
    this.rainMesh.instanceMatrix.needsUpdate = true;
  }

  private step(rawDt: number, nowMs: number): void {
    if (this.phase === 'title') {
      this.titleTime += rawDt;
      const swayX = Math.sin(this.titleTime * 0.28) * 1.15;
      const swayY = 1.92 + Math.sin(this.titleTime * 0.42) * 0.12;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, swayX, 3.2, rawDt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, swayY, 3.2, rawDt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 3.4, 3.2, rawDt);
      this.camera.lookAt(0.25, 1.35, -1.8);
      if (this.titleHeroBottle) {
        this.titleHeroBottle.rotation.y = this.titleTime * 0.45;
      }
      this.stepRain(rawDt);
      return;
    }

    if (this.phase === 'paused' || this.phase === 'challenge_result') {
      return;
    }

    this.sessionSeconds += rawDt;

    if (this.eventTextTimer > 0) {
      this.eventTextTimer -= rawDt;
      if (this.eventTextTimer <= 0) this.lastEventText = '';
    }

    // Challenge Timer
    if (this.gameMode !== 'free' && !this.challengeEnded) {
      this.challengeTimeLeft -= rawDt;
      if (this.challengeTimeLeft <= 0) {
        this.challengeTimeLeft = 0;
        const won = this.challengeProgress >= this.challengeGoal;
        this.finishChallenge(won);
        return;
      }
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= rawDt;
      this.updateCamera(rawDt);
      return;
    }

    const timeScale = this.slowMo ? 0.34 : 1.0;
    const dt = rawDt * timeScale;

    this.stepRain(dt);

    // Step Moving Targets & Bonus Zone
    if (this.gameMode === 'moving_targets') {
      const difficultyBoost = 1 + this.challengeProgress * 0.055;
      for (const mt of this.movingTargets) {
        if (!mt.active) {
          mt.respawnTimer -= rawDt;
          if (mt.respawnTimer <= 0) {
            mt.active = true;
            mt.group.visible = true;
            mt.phase = Math.random() * Math.PI * 2;
          }
          continue;
        }
        mt.phase += mt.speed * difficultyBoost * dt;
        mt.x = Math.sin(mt.phase) * mt.ampX;
        mt.y = mt.baseY + Math.sin(mt.phase * 1.7) * 0.18;
        mt.group.position.set(mt.x, mt.y, WALL_Z + 0.38);
      }
    } else if (this.gameMode === 'time_attack' && this.bonusZoneMesh) {
      this.bonusZoneTimer -= rawDt;
      this.bonusZoneMesh.rotation.z += 1.6 * rawDt;
      if (this.bonusZoneTimer <= 0) {
        this.relocateBonusZone();
      }
    }

    if (this.comboCount > 0) {
      this.comboResetTimer -= rawDt;
      if (this.comboResetTimer <= 0) {
        this.comboCount = 0;
      }
    }

    if (this.pointerDown || this.spaceDown) {
      this.chargeRatio = Math.min(1.0, this.chargeRatio + rawDt * 0.95);
    }

    this.aimWorld.x = THREE.MathUtils.damp(this.aimWorld.x, this.aimTargetWorld.x, 18, rawDt);
    this.aimWorld.y = THREE.MathUtils.damp(this.aimWorld.y, this.aimTargetWorld.y, 18, rawDt);
    this.aimWorld.z = WALL_Z;

    if (this.heldBottleGroup) {
      if (this.heldReloadTimer > 0) {
        this.heldReloadTimer = Math.max(0, this.heldReloadTimer - rawDt);
      }
      const reloadT = this.heldReloadTimer / 0.26;
      const pullBack = this.chargeRatio * 0.24;
      const dropY = reloadT * 0.32;
      const tremble =
        this.chargeRatio > 0.85 ? (Math.random() - 0.5) * 0.008 * this.chargeRatio : 0;

      const targetX = 0.34 + (this.aimScreenX - 0.5) * 0.16 + tremble;
      const targetY = 1.24 - this.chargeRatio * 0.07 - dropY + tremble;
      const targetZ = PLAYER_EYE_POS.z - 0.56 + pullBack;

      this.heldBottleGroup.position.x = THREE.MathUtils.damp(
        this.heldBottleGroup.position.x,
        targetX,
        16,
        rawDt,
      );
      this.heldBottleGroup.position.y = THREE.MathUtils.damp(
        this.heldBottleGroup.position.y,
        targetY,
        16,
        rawDt,
      );
      this.heldBottleGroup.position.z = THREE.MathUtils.damp(
        this.heldBottleGroup.position.z,
        targetZ,
        16,
        rawDt,
      );

      const aimYaw = -(this.aimScreenX - 0.5) * 0.45;
      const aimPitch = 0.25 + this.chargeRatio * 0.55 - (this.aimScreenY - 0.5) * 0.35;
      this.heldBottleGroup.rotation.set(aimPitch, aimYaw, 0.14);
    }

    if (this.pointerDown || this.spaceDown) {
      const origin = this.getThrowOrigin(_vec3A);
      this.computeBallisticVelocity(origin, this.aimWorld, this.chargeRatio, _vec3B);
      const spec = BOTTLE_SPECS[this.bottleKind];
      const weightPenalty = Math.max(0.84, 1.12 - spec.massKg * 0.22);
      const totalTime = Math.max(
        0.15,
        origin.distanceTo(this.aimWorld) / ((11.5 + this.chargeRatio * 12.2) * weightPenalty),
      );
      for (let i = 0; i < this.trajectoryDots.length; i++) {
        const t = ((i + 1) / (this.trajectoryDots.length + 1)) * totalTime;
        const dot = this.trajectoryDots[i];
        dot.position.set(
          origin.x + _vec3B.x * t,
          origin.y + _vec3B.y * t + 0.5 * GRAVITY * t * t,
          origin.z + _vec3B.z * t,
        );
      }
    }

    // Step flying bottles + check Challenge Targets + Wall/Floor
    for (let i = this.flyingBottles.length - 1; i >= 0; i--) {
      const b = this.flyingBottles[i];
      if (!b.active) {
        this.flyingBottles.splice(i, 1);
        continue;
      }

      b.vel.y += GRAVITY * dt;
      b.pos.addScaledVector(b.vel, dt);

      b.mesh.position.copy(b.pos);
      b.mesh.rotation.x += b.angVel.x * dt;
      b.mesh.rotation.y += b.angVel.y * dt;
      b.mesh.rotation.z += b.angVel.z * dt;

      // 1. Check Moving Targets collision
      if (this.gameMode === 'moving_targets' && !this.challengeEnded && b.pos.z <= WALL_Z + 0.52) {
        let hitTarget = false;
        for (const mt of this.movingTargets) {
          if (!mt.active) continue;
          const dist = Math.hypot(b.pos.x - mt.x, b.pos.y - mt.y);
          if (dist <= 0.43) {
            mt.active = false;
            mt.group.visible = false;
            mt.respawnTimer = 0.75;
            this.challengeProgress += 1;
            const pts = 150 + this.comboCount * 25;
            this.score += pts;
            this.setEventText(`TARGET HIT +${pts}`);
            glassAudio.playTargetHit(this.comboCount, false);
            this.shatterBottle(b, _vec3C.set(0, 0, 1), 0xfbbf24, false);
            if (this.challengeProgress >= this.challengeGoal) {
              this.finishChallenge(true);
            }
            hitTarget = true;
            break;
          }
        }
        if (hitTarget) continue;
      }

      // 2. Check Breakable Shelf Objects collision
      if (this.gameMode === 'breakable_objects' && !this.challengeEnded && b.pos.z <= WALL_Z + 0.52) {
        let hitObj = false;
        for (const obj of this.breakableObjects) {
          if (obj.broken) continue;
          const dist = Math.hypot(b.pos.x - obj.pos.x, b.pos.y - obj.pos.y);
          if (dist <= 0.34) {
            obj.broken = true;
            obj.group.visible = false;
            this.challengeProgress += 1;
            const pts = 200 + this.comboCount * 30;
            this.score += pts;
            this.setEventText(`SMASHED ${this.challengeProgress}/${this.challengeGoal}`);
            glassAudio.playTargetHit(this.comboCount, true);
            // Extra prop shards
            this.spawnShardsAt(obj.pos, _vec3C.set(0, 0, 1), 22, obj.colorHex, 0.85, 1.0);
            this.shatterBottle(b, _vec3C.set(0, 0, 1), undefined, false);
            if (this.challengeProgress >= this.challengeGoal) {
              this.finishChallenge(true);
            }
            hitObj = true;
            break;
          }
        }
        if (hitObj) continue;
      }

      // 3. Check Wall / Floor / Side Walls
      if (b.pos.z <= WALL_Z + 0.08) {
        b.pos.z = WALL_Z + 0.08;
        const spec = BOTTLE_SPECS[b.kind];
        // Low-fragility thick glass bottles bounce once if thrown very softly!
        if (!b.bounced && b.power < spec.minBreakPower) {
          b.bounced = true;
          b.vel.z = Math.abs(b.vel.z) * 0.42;
          b.vel.x *= 0.6;
          b.vel.y = Math.max(1.2, b.vel.y * 0.5 + 1.8);
          glassAudio.playBottleBounce(spec, b.pos.x / (WALL_WIDTH * 0.45));
          this.setEventText(spec.fragility === 'Low' ? 'THICK GLASS BOUNCED!' : 'BOUNCED!');
        } else {
          this.shatterBottle(b, _vec3C.set(0, 0, 1), undefined, true);
        }
      } else if (b.pos.y <= 0.09) {
        b.pos.y = 0.09;
        this.shatterBottle(b, _vec3C.set(0, 1, 0), undefined, false);
      } else if (Math.abs(b.pos.x) >= WALL_WIDTH / 2 - 0.08) {
        const sign = b.pos.x > 0 ? -1 : 1;
        b.pos.x = Math.sign(b.pos.x) * (WALL_WIDTH / 2 - 0.08);
        this.shatterBottle(b, _vec3C.set(sign, 0, 0), undefined, false);
      }
    }

    // Step 3D glass shards
    let shardsMoved = false;
    const halfW = WALL_WIDTH / 2 - 0.04;
    for (let i = 0; i < MAX_SHARDS; i++) {
      const s = this.shards[i];
      if (!s.active || s.settled) continue;
      shardsMoved = true;

      s.vel.y += GRAVITY * dt;
      s.pos.addScaledVector(s.vel, dt);

      s.rot.x += s.angVel.x * dt;
      s.rot.y += s.angVel.y * dt;
      s.rot.z += s.angVel.z * dt;

      if (s.pos.z < WALL_Z + 0.04) {
        s.pos.z = WALL_Z + 0.04;
        s.vel.z = Math.abs(s.vel.z) * 0.45;
      }

      if (s.pos.x < -halfW || s.pos.x > halfW) {
        s.pos.x = THREE.MathUtils.clamp(s.pos.x, -halfW, halfW);
        s.vel.x *= -0.5;
      }

      if (s.pos.y <= 0.014) {
        s.pos.y = 0.014;
        if (Math.abs(s.vel.y) > 0.75) {
          s.vel.y = Math.abs(s.vel.y) * 0.36;
          s.vel.x *= 0.76;
          s.vel.z *= 0.76;
          s.angVel.multiplyScalar(0.65);
        } else {
          s.vel.y = 0;
          s.vel.x *= Math.max(0, 1 - 9 * dt);
          s.vel.z *= Math.max(0, 1 - 9 * dt);
          s.angVel.multiplyScalar(Math.max(0, 1 - 11 * dt));
          if (s.vel.lengthSq() < 0.015) {
            s.settled = true;
            s.rot.x = (Math.random() - 0.5) * 0.25;
            s.rot.z = (Math.random() - 0.5) * 0.25;
          }
        }
      }

      _quat.setFromEuler(s.rot);
      _mat4.compose(s.pos, _quat, s.scale);
      this.shardsMesh.setMatrixAt(i, _mat4);
    }
    if (shardsMoved) {
      this.shardsMesh.instanceMatrix.needsUpdate = true;
    }

    // Step dust particles
    let dustUpdated = false;
    for (let i = 0; i < MAX_DUST; i++) {
      const d = this.dusts[i];
      if (!d.active) continue;
      dustUpdated = true;
      d.life += dt;
      if (d.life >= d.maxLife) {
        d.active = false;
        _mat4.makeScale(0, 0, 0);
        this.dustMesh.setMatrixAt(i, _mat4);
        continue;
      }
      d.vel.y += -2.5 * dt;
      d.vel.multiplyScalar(Math.max(0, 1 - 2.6 * dt));
      d.pos.addScaledVector(d.vel, dt);
      const t = d.life / d.maxLife;
      const sc = d.baseScale * (1 - t);
      _euler.set(d.life * 4, d.life * 3, 0);
      _quat.setFromEuler(_euler);
      _scale.set(sc, sc, sc);
      _mat4.compose(d.pos, _quat, _scale);
      this.dustMesh.setMatrixAt(i, _mat4);
    }
    if (dustUpdated) {
      this.dustMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.flashIntensity > 0.01) {
      this.flashIntensity = THREE.MathUtils.damp(this.flashIntensity, 0, 22, rawDt);
      this.flashLight.intensity = this.flashIntensity;
    } else if (this.flashLight.intensity !== 0) {
      this.flashLight.intensity = 0;
    }

    this.updateCamera(rawDt);

    if (nowMs - this.lastHudEmitMs > 48) {
      this.emitHud(false, nowMs);
    }
  }

  private updateCamera(rawDt: number): void {
    const aimOffsetX = (this.aimScreenX - 0.5) * 0.16;
    const aimOffsetY = -(this.aimScreenY - 0.5) * 0.09;
    const chargePullZ = this.chargeRatio * 0.14;

    if (this.cameraShake > 0.001) {
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 14, rawDt);
    } else {
      this.cameraShake = 0;
    }
    if (this.cameraPitchRecoil > 0.0005) {
      this.cameraPitchRecoil = THREE.MathUtils.damp(this.cameraPitchRecoil, 0, 10, rawDt);
    } else {
      this.cameraPitchRecoil = 0;
    }

    const sx = (Math.random() - 0.5) * this.cameraShake;
    const sy = (Math.random() - 0.5) * this.cameraShake;

    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      PLAYER_EYE_POS.x + aimOffsetX + sx,
      10,
      rawDt,
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      PLAYER_EYE_POS.y + aimOffsetY + sy,
      10,
      rawDt,
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      PLAYER_EYE_POS.z + chargePullZ,
      10,
      rawDt,
    );

    const targetFov = 54 - this.chargeRatio * 4.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 10, rawDt);
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(
      (this.aimScreenX - 0.5) * 1.1 + sx * 1.4,
      1.6 + (0.45 - this.aimScreenY) * 0.7 + this.cameraPitchRecoil * 4 + sy * 1.4,
      WALL_Z,
    );
  }

  private emitHud(force = false, nowMs = performance.now()): void {
    if (!force && nowMs - this.lastHudEmitMs < 48) return;
    this.lastHudEmitMs = nowMs;

    let activeShardsInRoom = 0;
    for (let i = 0; i < MAX_SHARDS; i++) {
      if (this.shards[i].active) activeShardsInRoom++;
    }

    this.onHudUpdate({
      bottlesSmashed: this.bottlesSmashed,
      shardsCreated: this.shardsCreated,
      comboCount: this.comboCount,
      lastImpactForce: this.lastImpactForce,
      maxImpactForce: this.maxImpactForce,
      chargeRatio: this.chargeRatio,
      isCharging: this.pointerDown || this.spaceDown,
      aimScreenX: this.aimScreenX,
      aimScreenY: this.aimScreenY,
      activeShardsInRoom,
      sessionSeconds: this.sessionSeconds,
      gameMode: this.gameMode,
      score: this.score,
      challengeProgress: this.challengeProgress,
      challengeGoal: this.challengeGoal,
      challengeTimeLeft: this.challengeTimeLeft,
      lastEventText: this.lastEventText,
    });
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (!m) continue;
          const std = m as THREE.MeshStandardMaterial;
          std.map?.dispose();
          std.bumpMap?.dispose();
          std.roughnessMap?.dispose();
          m.dispose();
        }
      }
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupListeners();
    glassAudio.setRainAmbience(false);

    for (const b of this.flyingBottles) {
      this.disposeObject(b.mesh);
    }
    this.flyingBottles = [];
    this.clearChallengeEntities();

    this.wallTextureCache.forEach((set) => {
      set.map.dispose();
      set.bumpMap.dispose();
    });
    this.wallTextureCache.clear();

    this.groundTextureCache.forEach((set) => {
      set.map.dispose();
      set.roughnessMap.dispose();
    });
    this.groundTextureCache.clear();
    this.impactOverlay.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.InstancedMesh).isInstancedMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (!m) continue;
          const std = m as THREE.MeshStandardMaterial;
          std.map?.dispose();
          std.bumpMap?.dispose();
          std.roughnessMap?.dispose();
          m.dispose();
        }
      }
    });

    if (this.scene.environment) {
      this.scene.environment.dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.mountEl) {
      this.mountEl.removeChild(this.renderer.domElement);
    }
  }
}
