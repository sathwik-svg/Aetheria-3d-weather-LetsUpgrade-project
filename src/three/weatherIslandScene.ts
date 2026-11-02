/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { WeatherConditionType } from '../types/weather';

// Pre-allocated scratch objects for zero GC in render loop
const _vec3 = new THREE.Vector3();
const _color = new THREE.Color();
const _targetColor = new THREE.Color();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();

export interface WeatherIslandOptions {
  container: HTMLDivElement;
  onSceneReady?: () => void;
}

export class WeatherIslandEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private frameId: number = 0;
  private isDestroyed: boolean = false;
  private isSoftwareGl: boolean = false;

  // Lights
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private lightningLight!: THREE.PointLight;
  private cabinLight!: THREE.PointLight;
  private celestialSphere!: THREE.Mesh;

  // Island Hierarchy (THREE.Group)
  private islandGroup!: THREE.Group;
  private rockBaseMesh!: THREE.Mesh;
  private plateauMesh!: THREE.Mesh;
  private waterPoolMesh!: THREE.Mesh;
  private treesGroup!: THREE.Group;
  private cabinGroup!: THREE.Group;
  private cloudsGroup!: THREE.Group;
  private cloudClusters: THREE.Group[] = [];
  private contactShadowMesh!: THREE.Mesh;

  // Particle Systems
  private rainMesh!: THREE.InstancedMesh;
  private snowMesh!: THREE.InstancedMesh;
  private rainCount = 350;
  private snowCount = 280;
  private rainVelocities: number[] = [];
  private snowVelocities: { y: number; drift: number; phase: number }[] = [];

  // Active Weather & Time State
  private currentCondition: WeatherConditionType = 'clear';
  private targetSkyColor = new THREE.Color('#38bdf8');
  private targetFogColor = new THREE.Color('#bae6fd');
  private currentSkyColor = new THREE.Color('#38bdf8');
  private currentFogColor = new THREE.Color('#bae6fd');
  private isDayTime: boolean = true;
  private selectedHour: number = 12;
  private lightningTimer: number = 0;

  // Materials References for Theme Transition
  private plateauMaterial!: THREE.MeshStandardMaterial;
  private rockMaterial!: THREE.MeshStandardMaterial;
  private waterMaterial!: THREE.MeshStandardMaterial;
  private foliageMaterials: THREE.MeshStandardMaterial[] = [];
  private cabinRoofMaterial!: THREE.MeshStandardMaterial;

  constructor(options: WeatherIslandOptions) {
    this.container = options.container;
    this.init();
    if (options.onSceneReady) options.onSceneReady();
  }

  private detectSoftwareGl(): boolean {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private init(): void {
    this.isSoftwareGl = this.detectSoftwareGl();

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = this.currentSkyColor;
    this.scene.fog = new THREE.FogExp2(this.currentFogColor.getHex(), 0.032);

    // 2. Camera Setup
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    this.camera.position.set(0, 4.2, 11.5);

    // 3. Renderer with PBR Settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Procedural Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('PMREM environment generation skipped:', e);
    }

    // 5. Controls with Silky Damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 0.4, 0);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 22;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.12; // Allow slightly below horizon
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.45;

    // 6. Lighting Rig
    this.setupLighting();

    // 7. Composite Procedural Island Geometry
    this.buildFloatingIsland();

    // 8. Dynamic Weather Particles
    this.setupWeatherParticles();

    // 9. Resize Handling
    window.addEventListener('resize', this.onWindowResize);

    // 10. Start Animation Loop
    this.startLoop();
  }

  private setupLighting(): void {
    // Hemisphere ambient light (sky/ground contrast)
    this.hemiLight = new THREE.HemisphereLight('#bae6fd', '#334155', 0.85);
    this.scene.add(this.hemiLight);

    // Warm Directional Key Light (Sun/Moon)
    this.keyLight = new THREE.DirectionalLight('#fff7ed', 1.8);
    this.keyLight.position.set(6, 9, 6);
    this.keyLight.castShadow = !this.isSoftwareGl;
    if (this.keyLight.castShadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 0.5;
      this.keyLight.shadow.camera.far = 28;
      const d = 5.5;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // Thunderstorm lightning point light
    this.lightningLight = new THREE.PointLight('#93c5fd', 0, 30, 2);
    this.lightningLight.position.set(0, 6, 2);
    this.scene.add(this.lightningLight);

    // Celestial Body Orb (Sun / Moon)
    const orbGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    this.celestialSphere = new THREE.Mesh(orbGeo, orbMat);
    this.celestialSphere.position.copy(this.keyLight.position).multiplyScalar(1.4);
    this.scene.add(this.celestialSphere);
  }

  /**
   * Assembles a 3–12 part procedural low-poly island inside a THREE.Group
   */
  private buildFloatingIsland(): void {
    this.islandGroup = new THREE.Group();
    this.islandGroup.position.set(0, 0, 0);

    // --- Part 1: Inverted Faceted Rock Base (Silhouette Scale 1) ---
    const rockGeo = new THREE.CylinderGeometry(2.9, 0.4, 3.2, 7, 3, false);
    // Displace vertices slightly for organic low-poly crags
    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0) {
        const noise = (Math.sin(pos.getX(i) * 3) + Math.cos(pos.getZ(i) * 3)) * 0.15;
        pos.setX(i, pos.getX(i) + noise);
        pos.setZ(i, pos.getZ(i) + noise);
      }
    }
    rockGeo.computeVertexNormals();

    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
    });
    this.rockBaseMesh = new THREE.Mesh(rockGeo, this.rockMaterial);
    this.rockBaseMesh.position.y = -1.6;
    this.rockBaseMesh.castShadow = !this.isSoftwareGl;
    this.rockBaseMesh.receiveShadow = !this.isSoftwareGl;
    this.islandGroup.add(this.rockBaseMesh);

    // --- Part 2: Top Grassy Plateau (Silhouette Scale 1) ---
    const plateauGeo = new THREE.CylinderGeometry(3.05, 2.9, 0.45, 7, 1);
    plateauGeo.computeVertexNormals();
    this.plateauMaterial = new THREE.MeshStandardMaterial({
      color: '#16a34a', // Emerald grass
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
    });
    this.plateauMesh = new THREE.Mesh(plateauGeo, this.plateauMaterial);
    this.plateauMesh.position.y = 0.22;
    this.plateauMesh.receiveShadow = !this.isSoftwareGl;
    this.islandGroup.add(this.plateauMesh);

    // --- Part 3: Stepped Secondary Terrain Layer (Silhouette Scale 2) ---
    const ridgeGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.35, 6, 1);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, this.plateauMaterial);
    ridgeMesh.position.set(-0.7, 0.55, -0.4);
    ridgeMesh.receiveShadow = !this.isSoftwareGl;
    ridgeMesh.castShadow = !this.isSoftwareGl;
    this.islandGroup.add(ridgeMesh);

    // --- Part 4: Mountain Spring Pool / Reflective Basin ---
    const poolGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.08, 12);
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    this.waterPoolMesh = new THREE.Mesh(poolGeo, this.waterMaterial);
    this.waterPoolMesh.position.set(0.9, 0.46, 0.3);
    this.waterPoolMesh.receiveShadow = !this.isSoftwareGl;
    this.islandGroup.add(this.waterPoolMesh);

    // --- Part 5: Low-Poly Pine Grove (3–6 Multi-Part Trees) ---
    this.treesGroup = new THREE.Group();
    const treePositions = [
      { x: -1.4, z: -0.8, scale: 0.95 },
      { x: -0.6, z: -1.3, scale: 0.8 },
      { x: -1.8, z: 0.2, scale: 1.1 },
      { x: 1.3, z: -0.9, scale: 0.85 },
      { x: -0.1, z: -1.4, scale: 0.7 },
    ];

    treePositions.forEach(tp => {
      const tree = this.createLowPolyPine(tp.scale);
      tree.position.set(tp.x, 0.45, tp.z);
      this.treesGroup.add(tree);
    });
    this.islandGroup.add(this.treesGroup);

    // --- Part 6: Alpine Cabin & Cozy Beacon (Silhouette Scale 3) ---
    this.cabinGroup = new THREE.Group();
    // Cabin Body
    const cabinBodyGeo = new THREE.BoxGeometry(0.85, 0.65, 0.75);
    const cabinBodyMat = new THREE.MeshStandardMaterial({
      color: '#78350f', // Warm cedar wood
      roughness: 0.8,
      metalness: 0.05,
    });
    const cabinBody = new THREE.Mesh(cabinBodyGeo, cabinBodyMat);
    cabinBody.position.y = 0.325;
    cabinBody.castShadow = !this.isSoftwareGl;
    cabinBody.receiveShadow = !this.isSoftwareGl;
    this.cabinGroup.add(cabinBody);

    // Gabled Roof
    const roofGeo = new THREE.ConeGeometry(0.72, 0.45, 4);
    this.cabinRoofMaterial = new THREE.MeshStandardMaterial({
      color: '#991b1b', // Burgundy roof tile
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    });
    const cabinRoof = new THREE.Mesh(roofGeo, this.cabinRoofMaterial);
    cabinRoof.position.y = 0.82;
    cabinRoof.rotation.y = Math.PI / 4;
    cabinRoof.castShadow = !this.isSoftwareGl;
    this.cabinGroup.add(cabinRoof);

    // Chimney & Stone accent
    const chimneyGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 });
    const chimney = new THREE.Mesh(chimneyGeo, stoneMat);
    chimney.position.set(0.24, 0.85, -0.15);
    this.cabinGroup.add(chimney);

    // Glowing Warm Window
    const windowGeo = new THREE.PlaneGeometry(0.22, 0.22);
    const windowMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });
    const cabinWindow = new THREE.Mesh(windowGeo, windowMat);
    cabinWindow.position.set(0, 0.35, 0.38);
    this.cabinGroup.add(cabinWindow);

    // Cozy Ambient Light emitting from the cabin
    this.cabinLight = new THREE.PointLight('#f59e0b', 0.8, 4, 1.8);
    this.cabinLight.position.set(0, 0.4, 0.5);
    this.cabinGroup.add(this.cabinLight);

    this.cabinGroup.position.set(0.7, 0.45, -0.6);
    this.islandGroup.add(this.cabinGroup);

    // --- Part 7: Outcrop Rocks & Boulders ---
    const boulderGeo = new THREE.DodecahedronGeometry(0.28, 0);
    const boulderMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      roughness: 0.85,
      flatShading: true,
    });
    const b1 = new THREE.Mesh(boulderGeo, boulderMat);
    b1.position.set(0.3, 0.45, 1.2);
    b1.scale.set(1.2, 0.8, 1);
    this.islandGroup.add(b1);

    const b2 = new THREE.Mesh(boulderGeo, boulderMat);
    b2.position.set(1.8, 0.42, 0.4);
    b2.scale.set(0.9, 0.6, 0.8);
    this.islandGroup.add(b2);

    // --- Part 8: Volumetric Procedural Cloud Formations ---
    this.cloudsGroup = new THREE.Group();
    const cloud1 = this.createProceduralCloudCluster(1.4);
    cloud1.position.set(-2.5, 2.8, -1.8);
    this.cloudsGroup.add(cloud1);
    this.cloudClusters.push(cloud1);

    const cloud2 = this.createProceduralCloudCluster(1.8);
    cloud2.position.set(2.4, 3.2, 1.2);
    this.cloudsGroup.add(cloud2);
    this.cloudClusters.push(cloud2);

    const cloud3 = this.createProceduralCloudCluster(1.1);
    cloud3.position.set(-0.8, 2.4, 2.6);
    this.cloudsGroup.add(cloud3);
    this.cloudClusters.push(cloud3);

    this.islandGroup.add(this.cloudsGroup);

    // --- Part 9: Contact Shadow Disc (Direct Grounding) ---
    const shadowGeo = new THREE.CircleGeometry(2.8, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#020617',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = -3.8;
    this.islandGroup.add(this.contactShadowMesh);

    this.scene.add(this.islandGroup);
  }

  /**
   * Helper: Builds a 3-part tiered low-poly pine tree
   */
  private createLowPolyPine(scale: number): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.4 * scale, 5);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#451a03',
      roughness: 0.9,
      flatShading: true,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.2 * scale;
    trunk.castShadow = !this.isSoftwareGl;
    tree.add(trunk);

    // 3 Foliage Tiers
    const foliageMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.78,
      flatShading: true,
    });
    this.foliageMaterials.push(foliageMat);

    const tierHeights = [0.45 * scale, 0.72 * scale, 0.96 * scale];
    const tierRadii = [0.48 * scale, 0.38 * scale, 0.26 * scale];

    tierHeights.forEach((h, idx) => {
      const coneGeo = new THREE.ConeGeometry(tierRadii[idx], 0.45 * scale, 5);
      const cone = new THREE.Mesh(coneGeo, foliageMat);
      cone.position.y = h;
      cone.castShadow = !this.isSoftwareGl;
      tree.add(cone);
    });

    return tree;
  }

  /**
   * Helper: Generates a soft volumetric cloud clump from clustered low-poly dodecahedrons
   */
  private createProceduralCloudCluster(scale: number): THREE.Group {
    const cluster = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    });

    const puffs = [
      { x: 0, y: 0, z: 0, r: 0.55 },
      { x: 0.45, y: -0.05, z: 0.1, r: 0.42 },
      { x: -0.4, y: -0.08, z: -0.1, r: 0.4 },
      { x: 0.1, y: 0.28, z: -0.05, r: 0.38 },
      { x: -0.2, y: 0.2, z: 0.15, r: 0.32 },
    ];

    puffs.forEach(p => {
      const puffGeo = new THREE.DodecahedronGeometry(p.r * scale, 1);
      const mesh = new THREE.Mesh(puffGeo, cloudMat);
      mesh.position.set(p.x * scale, p.y * scale, p.z * scale);
      mesh.castShadow = !this.isSoftwareGl;
      cluster.add(mesh);
    });

    return cluster;
  }

  /**
   * Setup Rain & Snow InstancedMeshes
   */
  private setupWeatherParticles(): void {
    // 1. Rain (Thin Streaks)
    const rainGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4);
    const rainMat = new THREE.MeshBasicMaterial({
      color: '#7dd3fc',
      transparent: true,
      opacity: 0.75,
    });
    this.rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, this.rainCount);
    this.rainMesh.frustumCulled = false;

    for (let i = 0; i < this.rainCount; i++) {
      _vec3.set(
        (Math.random() - 0.5) * 12,
        Math.random() * 12 - 2,
        (Math.random() - 0.5) * 12
      );
      _quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.12); // Wind tilt
      _mat4.compose(_vec3, _quat, new THREE.Vector3(1, 1, 1));
      this.rainMesh.setMatrixAt(i, _mat4);
      this.rainVelocities.push(0.24 + Math.random() * 0.15);
    }
    this.rainMesh.instanceMatrix.needsUpdate = true;
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);

    // 2. Snow (Soft tumbling crystals)
    const snowGeo = new THREE.DodecahedronGeometry(0.045, 0);
    const snowMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.88,
    });
    this.snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, this.snowCount);
    this.snowMesh.frustumCulled = false;

    for (let i = 0; i < this.snowCount; i++) {
      _vec3.set(
        (Math.random() - 0.5) * 12,
        Math.random() * 12 - 2,
        (Math.random() - 0.5) * 12
      );
      _quat.identity();
      _mat4.compose(_vec3, _quat, new THREE.Vector3(1, 1, 1));
      this.snowMesh.setMatrixAt(i, _mat4);
      this.snowVelocities.push({
        y: 0.03 + Math.random() * 0.03,
        drift: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }
    this.snowMesh.instanceMatrix.needsUpdate = true;
    this.snowMesh.visible = false;
    this.scene.add(this.snowMesh);
  }

  /**
   * Updates visual theme based on meteorological condition & time of day
   */
  public updateWeatherState(
    condition: WeatherConditionType,
    isDay: boolean,
    hour: number = 12
  ): void {
    this.currentCondition = condition;
    this.isDayTime = isDay;
    this.selectedHour = hour;

    // Atmospheric Palette Definitions
    let skyHex = '#0284c7';
    let fogHex = '#bae6fd';
    let grassColor = '#16a34a';
    let rockColor = '#475569';
    let keyLightIntensity = 1.8;
    let keyLightColor = '#fff7ed';

    if (!isDay || hour < 6 || hour >= 20) {
      // Night Mode
      skyHex = '#030712';
      fogHex = '#0f172a';
      grassColor = '#064e3b';
      rockColor = '#1e293b';
      keyLightIntensity = 0.5;
      keyLightColor = '#93c5fd'; // Cool moonlight
      this.celestialSphere.material = new THREE.MeshBasicMaterial({ color: '#e2e8f0' });
      this.cabinLight.intensity = 1.4;
    } else if (hour >= 6 && hour <= 8) {
      // Golden Dawn
      skyHex = '#f59e0b';
      fogHex = '#fed7aa';
      keyLightColor = '#ffedd5';
      keyLightIntensity = 1.5;
      this.cabinLight.intensity = 0.8;
    } else if (hour >= 18 && hour < 20) {
      // Dusk Twilight
      skyHex = '#4338ca';
      fogHex = '#a5b4fc';
      keyLightColor = '#fb923c';
      keyLightIntensity = 1.3;
      this.cabinLight.intensity = 1.2;
    } else {
      // Daytime standard
      this.celestialSphere.material = new THREE.MeshBasicMaterial({ color: '#fef08a' });
      this.cabinLight.intensity = 0.4;
    }

    // Weather condition specific adaptations
    switch (condition) {
      case 'clear':
        this.rainMesh.visible = false;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(0.7, 0.7, 0.7);
        break;

      case 'partly-cloudy':
        this.rainMesh.visible = false;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(1.0, 1.0, 1.0);
        break;

      case 'overcast':
        skyHex = isDay ? '#475569' : '#090d16';
        fogHex = isDay ? '#94a3b8' : '#1e293b';
        keyLightIntensity *= 0.65;
        this.rainMesh.visible = false;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(1.4, 1.3, 1.4);
        break;

      case 'rain':
      case 'drizzle':
        skyHex = isDay ? '#334155' : '#050a14';
        fogHex = isDay ? '#64748b' : '#0f172a';
        keyLightIntensity *= 0.6;
        grassColor = '#047857'; // Rain drenched
        this.rainMesh.visible = true;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(1.5, 1.4, 1.5);
        break;

      case 'thunderstorm':
        skyHex = '#0b0f19';
        fogHex = '#1e293b';
        keyLightIntensity = 0.35;
        grassColor = '#064e3b';
        this.rainMesh.visible = true;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(1.7, 1.6, 1.7);
        break;

      case 'snow':
        skyHex = isDay ? '#64748b' : '#0a0f1d';
        fogHex = isDay ? '#cbd5e1' : '#1e293b';
        grassColor = '#f8fafc'; // Crisp snow blanket!
        rockColor = '#94a3b8';
        this.waterMaterial.color.set('#e2e8f0'); // Frozen ice pool
        this.waterMaterial.roughness = 0.35;
        this.cabinRoofMaterial.color.set('#f1f5f9'); // Snow on cabin roof
        this.foliageMaterials.forEach(m => m.color.set('#1e3a2b')); // Frosty pine
        this.rainMesh.visible = false;
        this.snowMesh.visible = true;
        this.cloudsGroup.visible = true;
        this.cloudsGroup.scale.set(1.3, 1.2, 1.3);
        break;

      case 'fog':
        skyHex = isDay ? '#94a3b8' : '#111827';
        fogHex = isDay ? '#cbd5e1' : '#1f2937';
        keyLightIntensity *= 0.45;
        this.rainMesh.visible = false;
        this.snowMesh.visible = false;
        this.cloudsGroup.visible = true;
        break;
    }

    if (condition !== 'snow') {
      this.waterMaterial.color.set('#0284c7');
      this.waterMaterial.roughness = 0.12;
      this.cabinRoofMaterial.color.set('#991b1b');
      this.foliageMaterials.forEach(m => m.color.set('#15803d'));
    }

    this.targetSkyColor.set(skyHex);
    this.targetFogColor.set(fogHex);
    this.plateauMaterial.color.set(grassColor);
    this.rockMaterial.color.set(rockColor);
    this.keyLight.intensity = keyLightIntensity;
    this.keyLight.color.set(keyLightColor);

    // Orbit Sun/Moon in 3D based on hour
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunDist = 14;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.max(Math.sin(sunAngle) * sunDist, -4);
    const sunZ = Math.sin(sunAngle * 0.5) * 6;
    this.keyLight.position.set(sunX, sunY, sunZ);
    this.celestialSphere.position.copy(this.keyLight.position);
  }

  /**
   * Smoothly pans the camera toward the island with exponential glide
   */
  public triggerGlideAnimation(): void {
    const startPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      3.8 + Math.random() * 1.5,
      11 + Math.random() * 2
    );
    let progress = 0;

    const glideStep = () => {
      if (this.isDestroyed || progress >= 1) return;
      progress += 0.04;
      this.camera.position.lerpVectors(startPos, targetPos, 1 - Math.pow(1 - progress, 3));
      requestAnimationFrame(glideStep);
    };
    glideStep();
  }

  private startLoop(): void {
    const clock = new THREE.Clock();

    const tick = () => {
      if (this.isDestroyed) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth color transition for sky and fog
      this.currentSkyColor.lerp(this.targetSkyColor, 0.05);
      this.currentFogColor.lerp(this.targetFogColor, 0.05);
      this.scene.background = this.currentSkyColor;
      (this.scene.fog as THREE.FogExp2).color.copy(this.currentFogColor);

      // Gentle floating bob of the island
      if (this.islandGroup) {
        this.islandGroup.position.y = Math.sin(elapsed * 0.8) * 0.15;
        this.islandGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.04;
      }

      // Slow orbit of volumetric clouds
      if (this.cloudsGroup && this.cloudsGroup.visible) {
        this.cloudsGroup.rotation.y += 0.0015;
      }

      // Thunderstorm random lightning flash trigger
      if (this.currentCondition === 'thunderstorm') {
        this.lightningTimer += delta;
        if (this.lightningTimer > 3.5 + Math.random() * 4) {
          this.lightningLight.intensity = 8 + Math.random() * 6;
          this.lightningTimer = 0;
        } else if (this.lightningLight.intensity > 0) {
          this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - delta * 35);
        }
      } else {
        this.lightningLight.intensity = 0;
      }

      // Rain animation loop (InstancedMesh zero GC)
      if (this.rainMesh && this.rainMesh.visible) {
        for (let i = 0; i < this.rainCount; i++) {
          this.rainMesh.getMatrixAt(i, _mat4);
          _vec3.setFromMatrixPosition(_mat4);
          _vec3.y -= this.rainVelocities[i];
          _vec3.x -= 0.03; // Wind drift
          if (_vec3.y < -3.5) {
            _vec3.y = 8 + Math.random() * 3;
            _vec3.x = (Math.random() - 0.5) * 12;
            _vec3.z = (Math.random() - 0.5) * 12;
          }
          _mat4.setPosition(_vec3);
          this.rainMesh.setMatrixAt(i, _mat4);
        }
        this.rainMesh.instanceMatrix.needsUpdate = true;
      }

      // Snow animation loop (InstancedMesh zero GC)
      if (this.snowMesh && this.snowMesh.visible) {
        for (let i = 0; i < this.snowCount; i++) {
          this.snowMesh.getMatrixAt(i, _mat4);
          _vec3.setFromMatrixPosition(_mat4);
          const vel = this.snowVelocities[i];
          _vec3.y -= vel.y;
          _vec3.x += Math.sin(elapsed * 1.5 + vel.phase) * 0.015;
          _vec3.z += Math.cos(elapsed * 1.5 + vel.phase) * 0.015;
          if (_vec3.y < -3.5) {
            _vec3.y = 7 + Math.random() * 3;
            _vec3.x = (Math.random() - 0.5) * 12;
            _vec3.z = (Math.random() - 0.5) * 12;
          }
          _mat4.setPosition(_vec3);
          this.snowMesh.setMatrixAt(i, _mat4);
        }
        this.snowMesh.instanceMatrix.needsUpdate = true;
      }

      // Update Controls
      this.controls.update();

      // Render Frame
      this.renderer.render(this.scene, this.camera);

      // Software WebGL pacing or GPU rAF
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private onWindowResize = (): void => {
    if (this.isDestroyed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setAutoRotate(enable: boolean): void {
    if (this.controls) this.controls.autoRotate = enable;
  }

  public resetCamera(): void {
    if (this.controls && this.camera) {
      this.camera.position.set(0, 4.2, 11.5);
      this.controls.target.set(0, 0.4, 0);
      this.controls.update();
    }
  }

  public dispose(): void {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    if (this.controls) this.controls.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
