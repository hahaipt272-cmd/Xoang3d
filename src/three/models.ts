import * as THREE from 'three';
import { BottleKind, BottleSpec, BOTTLE_SPECS } from '../types/game';
import { createBottleLabelTexture, createWoodTexture } from './textures';

export function createGlassMaterial(
  spec: BottleSpec,
  isSoftwareGl: boolean,
): THREE.MeshPhysicalMaterial {
  if (isSoftwareGl) {
    return new THREE.MeshPhysicalMaterial({
      color: spec.glassColorHex,
      roughness: 0.06,
      metalness: 0.08,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      envMapIntensity: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });
  }

  return new THREE.MeshPhysicalMaterial({
    color: spec.glassColorHex,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.92,
    ior: 1.52,
    thickness: 0.35 * spec.thicknessFactor,
    attenuationColor: new THREE.Color(spec.attenuationColorHex),
    attenuationDistance: 0.25,
    envMapIntensity: 1.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });
}

function getBottleProfile(kind: BottleKind): {
  profile: THREE.Vector2[];
  radialSegs: number;
  labelY: number;
  labelH: number;
  labelR: number;
  liquidTopY: number;
  liquidR: number;
  capY: number;
  capR: number;
} {
  switch (kind) {
    case 'beer':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.032, 0.0),
          new THREE.Vector2(0.036, 0.012),
          new THREE.Vector2(0.036, 0.135),
          new THREE.Vector2(0.029, 0.165),
          new THREE.Vector2(0.015, 0.195),
          new THREE.Vector2(0.013, 0.242),
          new THREE.Vector2(0.016, 0.247),
          new THREE.Vector2(0.012, 0.25),
          new THREE.Vector2(0.0, 0.25),
        ],
        radialSegs: 28,
        labelY: 0.075,
        labelH: 0.072,
        labelR: 0.0366,
        liquidTopY: 0.15,
        liquidR: 0.031,
        capY: 0.251,
        capR: 0.0165,
      };
    case 'wine':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.039, 0.0),
          new THREE.Vector2(0.043, 0.014),
          new THREE.Vector2(0.043, 0.185),
          new THREE.Vector2(0.036, 0.215),
          new THREE.Vector2(0.017, 0.245),
          new THREE.Vector2(0.015, 0.302),
          new THREE.Vector2(0.0175, 0.308),
          new THREE.Vector2(0.013, 0.31),
          new THREE.Vector2(0.0, 0.31),
        ],
        radialSegs: 32,
        labelY: 0.102,
        labelH: 0.095,
        labelR: 0.0436,
        liquidTopY: 0.195,
        liquidR: 0.037,
        capY: 0.302,
        capR: 0.0165,
      };
    case 'whiskey':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.044, 0.0),
          new THREE.Vector2(0.049, 0.015),
          new THREE.Vector2(0.048, 0.155),
          new THREE.Vector2(0.042, 0.182),
          new THREE.Vector2(0.019, 0.205),
          new THREE.Vector2(0.018, 0.248),
          new THREE.Vector2(0.022, 0.256),
          new THREE.Vector2(0.014, 0.26),
          new THREE.Vector2(0.0, 0.26),
        ],
        radialSegs: 8,
        labelY: 0.088,
        labelH: 0.084,
        labelR: 0.0475,
        liquidTopY: 0.145,
        liquidR: 0.038,
        capY: 0.263,
        capR: 0.021,
      };
    case 'soda':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.029, 0.0),
          new THREE.Vector2(0.033, 0.012),
          new THREE.Vector2(0.031, 0.09),
          new THREE.Vector2(0.033, 0.138),
          new THREE.Vector2(0.024, 0.168),
          new THREE.Vector2(0.014, 0.192),
          new THREE.Vector2(0.013, 0.224),
          new THREE.Vector2(0.0155, 0.228),
          new THREE.Vector2(0.0, 0.23),
        ],
        radialSegs: 28,
        labelY: 0.084,
        labelH: 0.056,
        labelR: 0.0332,
        liquidTopY: 0.16,
        liquidR: 0.027,
        capY: 0.231,
        capR: 0.0155,
      };
    case 'champagne':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.042, 0.0),
          new THREE.Vector2(0.046, 0.015),
          new THREE.Vector2(0.046, 0.14),
          new THREE.Vector2(0.038, 0.195),
          new THREE.Vector2(0.022, 0.245),
          new THREE.Vector2(0.016, 0.308),
          new THREE.Vector2(0.019, 0.316),
          new THREE.Vector2(0.014, 0.32),
          new THREE.Vector2(0.0, 0.32),
        ],
        radialSegs: 32,
        labelY: 0.085,
        labelH: 0.075,
        labelR: 0.0466,
        liquidTopY: 0.21,
        liquidR: 0.038,
        capY: 0.322,
        capR: 0.018,
      };
    case 'perfume':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.032, 0.0),
          new THREE.Vector2(0.038, 0.018),
          new THREE.Vector2(0.036, 0.105),
          new THREE.Vector2(0.024, 0.125),
          new THREE.Vector2(0.014, 0.132),
          new THREE.Vector2(0.014, 0.148),
          new THREE.Vector2(0.0, 0.148),
        ],
        radialSegs: 6, // Hexagonal faceted crystal flacon
        labelY: 0.062,
        labelH: 0.052,
        labelR: 0.0345,
        liquidTopY: 0.095,
        liquidR: 0.028,
        capY: 0.162,
        capR: 0.02,
      };
    case 'jug':
      return {
        profile: [
          new THREE.Vector2(0.0, 0.0),
          new THREE.Vector2(0.06, 0.0),
          new THREE.Vector2(0.068, 0.022),
          new THREE.Vector2(0.068, 0.215),
          new THREE.Vector2(0.052, 0.265),
          new THREE.Vector2(0.024, 0.305),
          new THREE.Vector2(0.021, 0.348),
          new THREE.Vector2(0.026, 0.356),
          new THREE.Vector2(0.018, 0.36),
          new THREE.Vector2(0.0, 0.36),
        ],
        radialSegs: 32,
        labelY: 0.12,
        labelH: 0.115,
        labelR: 0.0688,
        liquidTopY: 0.18,
        liquidR: 0.059,
        capY: 0.362,
        capR: 0.024,
      };
  }
}

export function buildBottleGroup(
  kind: BottleKind,
  stressTag: string,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
  withTagLabel = true,
): THREE.Group {
  const spec = BOTTLE_SPECS[kind];
  const cfg = getBottleProfile(kind);

  const group = new THREE.Group();
  group.name = `bottle_${kind}`;

  const glassGeo = new THREE.LatheGeometry(cfg.profile, cfg.radialSegs);
  glassGeo.computeVertexNormals();
  const glassMat = createGlassMaterial(spec, isSoftwareGl);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.castShadow = true;
  glassMesh.renderOrder = 3;
  group.add(glassMesh);

  const baseGeo = new THREE.CylinderGeometry(
    cfg.profile[1].x * 0.92,
    cfg.profile[1].x * 0.85,
    0.016,
    cfg.radialSegs,
  );
  const baseMat = new THREE.MeshStandardMaterial({
    color: spec.glassColorHex,
    roughness: 0.14,
    metalness: 0.05,
    transparent: true,
    opacity: 0.72,
    envMapIntensity: 1.4,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.009;
  baseMesh.renderOrder = 1;
  group.add(baseMesh);

  const liquidH = cfg.liquidTopY - 0.018;
  const liquidGeo = new THREE.CylinderGeometry(
    cfg.liquidR * 0.94,
    cfg.liquidR,
    liquidH,
    Math.max(6, cfg.radialSegs),
  );
  const liquidMat = new THREE.MeshStandardMaterial({
    color: spec.liquidColorHex,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.78,
    envMapIntensity: 1.1,
  });
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidMesh.position.y = 0.018 + liquidH * 0.5;
  liquidMesh.renderOrder = 2;
  group.add(liquidMesh);

  const labelTex = createBottleLabelTexture(spec, withTagLabel ? stressTag : '', maxAnisotropy);
  const labelGeo = new THREE.CylinderGeometry(
    cfg.labelR,
    cfg.labelR,
    cfg.labelH,
    cfg.radialSegs,
    1,
    true,
    -Math.PI * 0.65,
    Math.PI * 1.3,
  );
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = cfg.labelY;
  labelMesh.rotation.y = Math.PI;
  labelMesh.renderOrder = 4;
  group.add(labelMesh);

  const neckCollarGeo = new THREE.CylinderGeometry(
    cfg.capR * 0.86,
    cfg.capR * 0.98,
    kind === 'champagne' ? 0.07 : 0.032,
    16,
    1,
    true,
  );
  const foilMat = new THREE.MeshStandardMaterial({
    color: spec.capColorHex,
    roughness: 0.32,
    metalness: 0.78,
    side: THREE.DoubleSide,
  });
  const neckCollar = new THREE.Mesh(neckCollarGeo, foilMat);
  neckCollar.position.y = cfg.capY - (kind === 'champagne' ? 0.042 : 0.022);
  neckCollar.renderOrder = 4;
  group.add(neckCollar);

  const isCork = kind === 'wine' || kind === 'jug' || kind === 'whiskey' || kind === 'champagne';
  const capGeo =
    kind === 'perfume'
      ? new THREE.BoxGeometry(0.032, 0.028, 0.032)
      : new THREE.CylinderGeometry(
          cfg.capR,
          cfg.capR * 0.95,
          isCork ? 0.026 : 0.014,
          isCork ? 16 : 20,
        );
  const capMat = new THREE.MeshStandardMaterial({
    color: isCork && kind === 'jug' ? 0x9c6e44 : spec.capColorHex,
    roughness: isCork && kind === 'jug' ? 0.82 : 0.22,
    metalness: isCork && kind === 'jug' ? 0.05 : 0.88,
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.y = cfg.capY + (isCork ? 0.006 : 0.002);
  capMesh.castShadow = true;
  capMesh.renderOrder = 4;
  group.add(capMesh);

  if (kind === 'jug') {
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.024, 0.31, 0),
      new THREE.Vector3(0.068, 0.3, 0),
      new THREE.Vector3(0.078, 0.25, 0),
      new THREE.Vector3(0.062, 0.205, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 16, 0.0085, 8, false);
    const handleMesh = new THREE.Mesh(handleGeo, glassMat);
    handleMesh.renderOrder = 3;
    group.add(handleMesh);
  }

  return group;
}

export function createShardGeometry(): THREE.BufferGeometry {
  const vertices = new Float32Array([
    -0.022, 0.0, -0.012,
     0.028, 0.002, -0.006,
     0.006, 0.001, 0.026,
    -0.020, -0.0045, -0.010,
     0.026, -0.0035, -0.005,
     0.005, -0.0045, 0.024,
  ]);

  const indices = [
    0, 2, 1,
    3, 4, 5,
    0, 1, 4, 0, 4, 3,
    1, 2, 5, 1, 5, 4,
    2, 0, 3, 2, 3, 5,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildIndustrialLamp(isSoftwareGl: boolean): THREE.Group {
  const lamp = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e2128,
    roughness: 0.45,
    metalness: 0.82,
  });

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), ironMat);
  rod.position.y = 0.27;
  lamp.add(rod);

  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 16, 1, true), ironMat);
  shade.material.side = THREE.DoubleSide;
  shade.position.y = -0.02;
  lamp.add(shade);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: 0xffb84d,
    emissiveIntensity: isSoftwareGl ? 2.2 : 2.6,
    roughness: 0.2,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), bulbMat);
  bulb.position.y = -0.07;
  lamp.add(bulb);

  const cage = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 6, 20), ironMat);
  cage.rotation.x = Math.PI / 2;
  cage.position.y = -0.14;
  lamp.add(cage);

  return lamp;
}

export function buildBottleCrate(
  isSoftwareGl: boolean,
  maxAnisotropy: number,
  crateIndex: number,
): THREE.Group {
  const crate = new THREE.Group();
  const woodTex = createWoodTexture(maxAnisotropy);
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.86,
    metalness: 0.04,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    roughness: 0.5,
    metalness: 0.72,
  });

  const w = 0.74;
  const h = 0.36;
  const d = 0.52;

  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), woodMat);
  base.position.y = 0.015;
  base.castShadow = true;
  base.receiveShadow = true;
  crate.add(base);

  const postGeo = new THREE.BoxGeometry(0.05, h, 0.05);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(sx * (w / 2 - 0.025), h / 2, sz * (d / 2 - 0.025));
      post.castShadow = true;
      post.receiveShadow = true;
      crate.add(post);
    }
  }

  const fbSlatGeo = new THREE.BoxGeometry(w - 0.02, 0.085, 0.022);
  const lrSlatGeo = new THREE.BoxGeometry(0.022, 0.085, d - 0.02);
  for (const rowY of [0.08, 0.19, 0.3]) {
    for (const sz of [-1, 1]) {
      const slat = new THREE.Mesh(fbSlatGeo, woodMat);
      slat.position.set(0, rowY, sz * (d / 2 - 0.011));
      slat.castShadow = true;
      crate.add(slat);
    }
    for (const sx of [-1, 1]) {
      const slat = new THREE.Mesh(lrSlatGeo, woodMat);
      slat.position.set(sx * (w / 2 - 0.011), rowY, 0);
      slat.castShadow = true;
      crate.add(slat);
    }
  }

  const bracketGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const br = new THREE.Mesh(bracketGeo, darkTrimMat);
      br.position.set(sx * (w / 2 - 0.02), h - 0.02, sz * (d / 2 - 0.02));
      crate.add(br);
    }
  }

  const kinds: BottleKind[] = ['beer', 'wine', 'whiskey', 'soda', 'champagne'];
  for (let i = 0; i < 4; i++) {
    const k = kinds[(i + crateIndex) % kinds.length];
    const b = buildBottleGroup(k, '', isSoftwareGl, maxAnisotropy, false);
    const col = i % 2;
    const row = Math.floor(i / 2);
    b.position.set(-0.16 + col * 0.32, 0.032, -0.11 + row * 0.22);
    b.rotation.y = (i * 1.1) % (Math.PI * 2);
    crate.add(b);
  }

  return crate;
}

// ===========================================================================
// LOCATION ENVIRONMENT BUILDERS (Indoor, Outdoor Alley, Construction Site)
// ===========================================================================

export function buildIndoorProps(
  wallZ: number,
  wallWidth: number,
  wallHeight: number,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): THREE.Group {
  const group = new THREE.Group();

  const rubberMat = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.024, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x17191f, roughness: 0.92, metalness: 0.04 }),
  );
  rubberMat.position.set(0, 0.012, 2.2);
  rubberMat.receiveShadow = true;
  group.add(rubberMat);

  const sideWallMat = new THREE.MeshStandardMaterial({
    color: 0x1c1f26,
    roughness: 0.92,
    metalness: 0.05,
  });
  for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.4), sideWallMat);
    sw.position.set(side * (wallWidth / 2 + 0.12), 2.7, 1.0);
    sw.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    sw.receiveShadow = true;
    group.add(sw);
  }

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.36,
    metalness: 0.82,
  });
  for (const tz of [-2.2, 0.2, 2.6]) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.22, 0.24), steelMat);
    truss.position.set(0, 4.95, tz);
    group.add(truss);
  }

  for (const lx of [-2.4, 0, 2.4]) {
    const lamp = buildIndustrialLamp(isSoftwareGl);
    lamp.position.set(lx, 4.45, wallZ + 1.2);
    group.add(lamp);
  }

  const crateLeft = buildBottleCrate(isSoftwareGl, maxAnisotropy, 0);
  crateLeft.position.set(-3.75, 0, -2.6);
  crateLeft.rotation.y = 0.28;
  group.add(crateLeft);

  const crateRight = buildBottleCrate(isSoftwareGl, maxAnisotropy, 2);
  crateRight.position.set(3.7, 0, -2.3);
  crateRight.rotation.y = -0.35;
  group.add(crateRight);

  // Also add back wall so glass_window view has a backdrop
  const backBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth + 1, wallHeight + 1),
    new THREE.MeshStandardMaterial({ color: 0x151820, roughness: 0.95 }),
  );
  backBackdrop.position.set(0, wallHeight / 2, wallZ - 2.6);
  group.add(backBackdrop);

  return group;
}

function buildDumpsterGroup(): THREE.Group {
  const d = new THREE.Group();
  const greenSteel = new THREE.MeshStandardMaterial({
    color: 0x244736,
    roughness: 0.55,
    metalness: 0.45,
  });
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.82,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 0.95), greenSteel);
  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;
  d.add(body);

  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.02), greenSteel);
  rim.position.y = 1.1;
  d.add(rim);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.07, 0.98), lidMat);
  lid.position.set(0, 1.17, -0.02);
  lid.rotation.x = -0.08;
  d.add(lid);

  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const sx of [-0.6, 0.6]) {
    for (const sz of [-0.36, 0.36]) {
      const w = new THREE.Mesh(wheelGeo, lidMat);
      w.position.set(sx, 0.08, sz);
      d.add(w);
    }
  }
  return d;
}

function buildStreetLamp(): THREE.Group {
  const pole = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x2a2e36,
    roughness: 0.42,
    metalness: 0.78,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 5.2, 10), metal);
  shaft.position.y = 2.6;
  shaft.castShadow = true;
  pole.add(shaft);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), metal);
  arm.position.set(0.5, 5.1, 0);
  pole.add(arm);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.24), metal);
  head.position.set(0.95, 5.04, 0);
  pole.add(head);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.05, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0xffe4b3,
      emissive: 0xffaa44,
      emissiveIntensity: 2.8,
    }),
  );
  glow.position.set(0.95, 4.98, 0);
  pole.add(glow);

  return pole;
}

export function buildAlleyProps(
  wallZ: number,
  wallWidth: number,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): THREE.Group {
  const group = new THREE.Group();

  // Flanking urban tenement walls (open sky overhead!)
  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c27,
    roughness: 0.9,
    metalness: 0.05,
  });
  const ledgeMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    roughness: 0.65,
    metalness: 0.4,
  });

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 16), facadeMat);
    wall.position.set(side * (wallWidth / 2 + 0.35), 3.75, -0.5);
    wall.receiveShadow = true;
    group.add(wall);

    // Cornice ledge & pipes
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 16), ledgeMat);
    cornice.position.set(side * (wallWidth / 2 + 0.28), 5.6, -0.5);
    group.add(cornice);

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.2, 8), ledgeMat);
    pipe.position.set(side * (wallWidth / 2 + 0.05), 3.1, -1.8);
    group.add(pipe);
  }

  // Distant alleyway skyline silhouettes behind glass_window
  const skylineMat = new THREE.MeshStandardMaterial({ color: 0x161922, roughness: 0.92 });
  for (let i = -3; i <= 3; i++) {
    const h = 6 + ((Math.abs(i) * 3) % 5);
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(2.8, h, 2.5), skylineMat);
    bldg.position.set(i * 3.1, h / 2, wallZ - 9 - Math.abs(i) * 1.4);
    group.add(bldg);
  }

  // Steel Dumpster on left
  const dumpster = buildDumpsterGroup();
  dumpster.position.set(-3.7, 0, -1.7);
  dumpster.rotation.y = 0.22;
  group.add(dumpster);

  // Streetlamp on left
  const lamp = buildStreetLamp();
  lamp.position.set(-4.35, 0, 0.6);
  group.add(lamp);

  // Bottle crate on right
  const crate = buildBottleCrate(isSoftwareGl, maxAnisotropy, 1);
  crate.position.set(3.85, 0, -1.9);
  crate.rotation.y = -0.3;
  group.add(crate);

  return group;
}

function buildSafetyCone(): THREE.Group {
  const cone = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: 0xeb5e19, roughness: 0.52 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.32), orange);
  base.position.y = 0.0175;
  base.castShadow = true;
  cone.add(base);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.125, 0.56, 14), orange);
  body.position.y = 0.31;
  body.castShadow = true;
  cone.add(body);

  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.09, 0.12, 14), white);
  stripe.position.y = 0.35;
  cone.add(stripe);

  return cone;
}

function buildScaffoldTower(): THREE.Group {
  const scaf = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: 0x525b68,
    roughness: 0.42,
    metalness: 0.78,
  });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x826241, roughness: 0.88 });

  const w = 1.4;
  const d = 1.1;
  const h = 4.2;

  for (const sx of [-w / 2, w / 2]) {
    for (const sz of [-d / 2, d / 2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 8), steel);
      post.position.set(sx, h / 2, sz);
      post.castShadow = true;
      scaf.add(post);
    }
  }

  for (const levelY of [1.4, 2.8, 4.1]) {
    for (const sz of [-d / 2, d / 2]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, w, 8), steel);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, levelY, sz);
      scaf.add(bar);
    }
    for (const sx of [-w / 2, w / 2]) {
      const sBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, d, 8), steel);
      sBar.rotation.x = Math.PI / 2;
      sBar.position.set(sx, levelY, 0);
      scaf.add(sBar);
    }
  }

  const plank = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, 0.05, d - 0.1), plankMat);
  plank.position.set(0, 2.83, 0);
  plank.castShadow = true;
  scaf.add(plank);

  return scaf;
}

function buildBarricade(): THREE.Group {
  const b = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e2025, roughness: 0.7 });

  for (const sx of [-0.48, 0.48]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.92, 0.07), dark);
    leg.position.set(sx, 0.45, 0);
    leg.castShadow = true;
    b.add(leg);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.24, 0.05), yellow);
  board.position.set(0, 0.72, 0);
  board.castShadow = true;
  b.add(board);

  return b;
}

export function buildConstructionProps(
  wallZ: number,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): THREE.Group {
  const group = new THREE.Group();

  // Scaffolding towers flanking the target wall
  const scafLeft = buildScaffoldTower();
  scafLeft.position.set(-4.1, 0, -2.5);
  group.add(scafLeft);

  const scafRight = buildScaffoldTower();
  scafRight.position.set(4.1, 0, -2.5);
  group.add(scafRight);

  // Safety cones
  const conePositions: [number, number][] = [
    [-3.1, -1.2],
    [3.15, -1.1],
    [3.55, -0.3],
  ];
  for (const [cx, cz] of conePositions) {
    const c = buildSafetyCone();
    c.position.set(cx, 0, cz);
    group.add(c);
  }

  // Sawhorse barricades
  const barL = buildBarricade();
  barL.position.set(-3.7, 0, 0.2);
  barL.rotation.y = 0.45;
  group.add(barL);

  // Stacked concrete cinderblocks
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x6b7075, roughness: 0.92 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3 - row; col++) {
      const blk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), blockMat);
      blk.position.set(3.55 + col * 0.42 + row * 0.2, 0.1 + row * 0.2, -3.1);
      blk.castShadow = true;
      blk.receiveShadow = true;
      group.add(blk);
    }
  }

  // Distant crane / construction framing behind glass_window
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xc2781a, roughness: 0.5, metalness: 0.6 });
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.45, 11, 0.45), craneMat);
  mast.position.set(-2.5, 5.5, wallZ - 8.5);
  group.add(mast);
  const jib = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.4, 0.4), craneMat);
  jib.position.set(1.2, 10.6, wallZ - 8.5);
  group.add(jib);

  const crate = buildBottleCrate(isSoftwareGl, maxAnisotropy, 3);
  crate.position.set(3.65, 0, -1.8);
  crate.rotation.y = -0.4;
  group.add(crate);

  return group;
}

// ===========================================================================
// CHALLENGE MODE TARGETS & BREAKABLE SHELF OBJECTS
// ===========================================================================

export function buildMovingTargetPlate(): THREE.Group {
  const plate = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x262b34,
    roughness: 0.35,
    metalness: 0.85,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.35,
    roughness: 0.35,
  });
  const amberRingMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });

  // Outer steel disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.045, 24), steelMat);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  plate.add(disc);

  // White inner bullseye ring
  const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.052, 24), whiteMat);
  ring1.rotation.x = Math.PI / 2;
  plate.add(ring1);

  // Red center bullseye
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.058, 20), redMat);
  center.rotation.x = Math.PI / 2;
  plate.add(center);

  // Glowing rim ring
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.018, 8, 28), amberRingMat);
  rim.position.z = 0.015;
  plate.add(rim);

  // Top trolley bracket
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.06), steelMat);
  bracket.position.y = 0.42;
  plate.add(bracket);

  return plate;
}

export type BreakablePropKind = 'vase' | 'jar' | 'neon_tube' | 'flask';

export function buildBreakableProp(
  kind: BreakablePropKind,
  isSoftwareGl: boolean,
): { group: THREE.Group; colorHex: number } {
  const group = new THREE.Group();

  if (kind === 'vase') {
    const colorHex = 0x3b82f6;
    const profile = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.065, 0),
      new THREE.Vector2(0.105, 0.11),
      new THREE.Vector2(0.095, 0.22),
      new THREE.Vector2(0.045, 0.29),
      new THREE.Vector2(0.062, 0.34),
      new THREE.Vector2(0.05, 0.34),
    ];
    const geo = new THREE.LatheGeometry(profile, 20);
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      roughness: 0.12,
      clearcoat: 1.0,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);
    return { group, colorHex };
  }

  if (kind === 'jar') {
    const colorHex = 0x22c55e;
    const jarMat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      roughness: 0.08,
      transparent: true,
      opacity: isSoftwareGl ? 0.65 : 0.85,
      clearcoat: 1.0,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.24, 18), jarMat);
    body.position.y = 0.12;
    body.castShadow = true;
    group.add(body);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.078, 0.032, 18),
      new THREE.MeshStandardMaterial({ color: 0xd4a438, metalness: 0.8, roughness: 0.25 }),
    );
    lid.position.y = 0.25;
    group.add(lid);
    return { group, colorHex };
  }

  if (kind === 'neon_tube') {
    const colorHex = 0xf43f5e;
    const capMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.3 });
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffd1dc,
      emissive: colorHex,
      emissiveIntensity: 1.9,
      roughness: 0.15,
    });

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.34, 14), tubeMat);
    tube.position.y = 0.19;
    group.add(tube);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 14), capMat);
    base.position.y = 0.025;
    group.add(base);

    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 14), capMat);
    top.position.y = 0.36;
    group.add(top);
    return { group, colorHex };
  }

  // flask
  const colorHex = 0xf59e0b;
  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.08,
    transparent: true,
    opacity: isSoftwareGl ? 0.65 : 0.88,
    clearcoat: 1.0,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 18), mat);
  cone.position.y = 0.12;
  cone.castShadow = true;
  group.add(cone);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.11, 14), mat);
  neck.position.y = 0.24;
  group.add(neck);
  return { group, colorHex };
}

export function buildShelfRack(width = 6.2): THREE.Group {
  const rack = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1f232b,
    roughness: 0.45,
    metalness: 0.78,
  });
  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x5c4028,
    roughness: 0.88,
  });

  // 2 horizontal shelf planks (y = 1.1 and y = 2.2)
  for (const sy of [1.1, 2.2]) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.38), plankMat);
    plank.position.set(0, sy, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    rack.add(plank);

    // Wall brackets
    for (const bx of [-width * 0.42, 0, width * 0.42]) {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.32), steelMat);
      br.position.set(bx, sy - 0.12, -0.02);
      rack.add(br);
    }
  }

  return rack;
}
