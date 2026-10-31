System.register("chunks:///_virtual/Assets.ts", ['cc'], function (exports) {
  var cclegacy, resources, sys, SpriteAtlas, Texture2D, SpriteFrame, Material, gfx, BitmapFont, JsonAsset;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      resources = module.resources;
      sys = module.sys;
      SpriteAtlas = module.SpriteAtlas;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      Material = module.Material;
      gfx = module.gfx;
      BitmapFont = module.BitmapFont;
      JsonAsset = module.JsonAsset;
    }],
    execute: function () {
      exports({
        getFrame: getFrame,
        getFrameFromTexture: getFrameFromTexture,
        hasTexture: hasTexture,
        initAssets: initAssets,
        loadAtlas: loadAtlas,
        loadFont: loadFont,
        loadJson: loadJson,
        loadTerrainMaterial: loadTerrainMaterial,
        loadTexture: loadTexture,
        preloadFrames: preloadFrames,
        setStylePack: setStylePack,
        sheetsForFrame: sheetsForFrame,
        stylePackFor: stylePackFor,
        stylePackSetting: stylePackSetting,
        terrainMaterial: terrainMaterial,
        tryLoadJson: tryLoadJson,
        vertexColorMaterial: vertexColorMaterial
      });
      cclegacy._RF.push({}, "a89c3HZPNBBtqc5cc3FLYHP", "Assets", undefined);

      /** Thin promise wrappers around `resources` plus frame-name lookup across sprite sheets. */

      function load(path, type) {
        return new Promise((resolve, reject) => {
          resources.load(path, type, (err, asset) => err ? reject(err) : resolve(asset));
        });
      }
      const jsonCache = new Map();
      const atlasCache = new Map();
      const textureCache = new Map();
      const frameCache = new Map();
      let frameIndex = null;
      let textureNames = null;
      async function loadJson(path) {
        if (jsonCache.has(path)) return jsonCache.get(path);
        const a = await load(path, JsonAsset);
        jsonCache.set(path, a.json);
        return a.json;
      }
      async function tryLoadJson(path) {
        try {
          return await loadJson(path);
        } catch {
          return null;
        }
      }

      /**
       * Style pack: restyled copies of some sheets / loose textures under resources/stylepacks/<name>/
       * (sheets/<sheet>.plist+png, textures/<file>), with the original names and sizes so level data is
       * unchanged. manifest.json lists what the pack replaces; anything else loads from the originals.
       * Caches are keyed per pack so themes that share an original sheet keep their own art.
       */

      let pack = null;

      /**
       * Style pack of a level: config/level_styles.json "levels" (per level id), else "themes" (per world config),
       * else the originals. `?style=<pack>` in the URL forces a pack on every level, `?style=orig` the originals.
       */
      async function stylePackFor(levelId, configName) {
        var _cfg$levels, _cfg$themes;
        const forced = sys.isBrowser ? new URLSearchParams(window.location.search).get('style') : null;
        const cfg = await tryLoadJson('config/level_styles');
        const name = forced || (cfg == null || (_cfg$levels = cfg.levels) == null ? void 0 : _cfg$levels[levelId]) || (cfg == null || (_cfg$themes = cfg.themes) == null ? void 0 : _cfg$themes[configName]) || null;
        return name === 'orig' ? null : name;
      }

      /** Use the named style pack (null = originals). */
      async function setStylePack(name) {
        const m = name ? await tryLoadJson(`stylepacks/${name}/manifest`) : null;
        if (name && !m) console.warn('[BR] missing style pack', name);
        pack = m ? {
          name,
          sheets: new Set(m.sheets || []),
          textures: new Set(m.textures || []),
          data: m
        } : null;
      }

      /** Extra settings of the active style pack's manifest (e.g. "water" colours), or undefined. */
      function stylePackSetting(key) {
        var _pack;
        return (_pack = pack) == null || (_pack = _pack.data) == null ? void 0 : _pack[key];
      }
      const sheetKey = s => {
        var _pack2;
        return (_pack2 = pack) != null && _pack2.sheets.has(s) ? `${pack.name}:${s}` : s;
      };
      const texKey = f => {
        var _pack3;
        return (_pack3 = pack) != null && _pack3.textures.has(f) ? `${pack.name}:${f}` : f;
      };
      const texPath = f => {
        var _pack4;
        return (_pack4 = pack) != null && _pack4.textures.has(f) ? `stylepacks/${pack.name}/textures/${stripExt(f)}` : `textures/${stripExt(f)}`;
      };
      async function initAssets() {
        frameIndex = await loadJson('config/frame_index');
        textureNames = new Set(frameIndex.textures);
      }
      async function loadAtlas(name) {
        const key = sheetKey(name);
        if (atlasCache.has(key)) return atlasCache.get(key);
        const path = key === name ? `sheets/${name}` : `stylepacks/${pack.name}/sheets/${name}`;
        try {
          const a = await load(path, SpriteAtlas);
          atlasCache.set(key, a);
          return a;
        } catch (e) {
          console.warn('[BR] missing atlas', path);
          atlasCache.set(key, null);
          return null;
        }
      }
      function stripExt(n) {
        return n.replace(/\.png$/i, '');
      }
      function hasTexture(file) {
        return textureNames.has(file);
      }
      async function loadTexture(file) {
        if (!file) return null;
        const key = texKey(file);
        if (textureCache.has(key)) return textureCache.get(key);
        let tex = null;
        if (textureNames.has(file)) {
          try {
            tex = await load(`${texPath(file)}/texture`, Texture2D);
          } catch (e) {
            console.warn('[BR] texture load failed', file, e);
          }
        } else {
          console.warn('[BR] unknown texture', file);
        }
        textureCache.set(key, tex);
        return tex;
      }

      /** Sheets that must be loaded before `getFrame` can resolve `frame` without a hint. */
      function sheetsForFrame(frame) {
        return frameIndex.frames[frame] || [];
      }

      /**
       * Loads every sheet / texture referenced by `refs` so `getFrame` can be called synchronously.
       */
      async function preloadFrames(refs) {
        const sheets = new Set();
        const textures = new Set();
        for (const r of refs) {
          if (r.textureFile) textures.add(r.textureFile);
          if (!r.frame) continue;
          if (r.sheet) sheets.add(r.sheet);else if (frameIndex.frames[r.frame]) sheets.add(frameIndex.frames[r.frame][0]);else if (textureNames.has(r.frame)) textures.add(r.frame);
        }
        // Array.from, not spread: Cocos' loose Babel turns [...set] into [set]
        await Promise.all(Array.from(sheets).map(s => loadAtlas(s)));
        await Promise.all(Array.from(textures).map(async t => {
          if (!textureNames.has(t) || frameCache.has('tex:' + texKey(t))) return;
          // loose images are imported as plain textures; wrap them in a SpriteFrame
          const tex = await loadTexture(t);
          if (!tex) return;
          const sf = new SpriteFrame();
          sf.texture = tex;
          frameCache.set('tex:' + texKey(t), sf);
        }));
      }

      /** Resolve a frame by name, preferring `sheet`, then any loaded sheet containing it, then loose textures. */
      function getFrame(frame, sheet) {
        if (!frame) return null;
        const key = stripExt(frame);
        const candidates = [];
        if (sheet) candidates.push(sheet);
        for (const s of frameIndex.frames[frame] || []) candidates.push(s);
        for (const s of candidates) {
          const atlas = atlasCache.get(sheetKey(s));
          if (!atlas) continue;
          const f = atlas.getSpriteFrame(key) || atlas.getSpriteFrame(frame);
          if (f) return f;
        }
        return frameCache.get('tex:' + texKey(frame)) || null;
      }
      function getFrameFromTexture(file) {
        return frameCache.get('tex:' + texKey(file)) || null;
      }
      const materialCache = new Map();
      let terrainBase = null;
      async function loadTerrainMaterial() {
        if (!terrainBase) terrainBase = await load('materials/terrain', Material);
      }
      let vertexColor = null;

      /**
       * Untextured, vertex-coloured triangles blended like cocos2d's ShaderPositionColor with
       * ccGLBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA) on straight (not premultiplied) colours.
       */
      function vertexColorMaterial() {
        if (!vertexColor) {
          vertexColor = new Material();
          vertexColor.initialize({
            effectAsset: terrainBase.effectAsset,
            technique: 1,
            defines: {
              USE_VERTEX_COLOR: true
            },
            states: {
              rasterizerState: {
                cullMode: gfx.CullMode.NONE
              },
              depthStencilState: {
                depthTest: false,
                depthWrite: false
              },
              blendState: {
                targets: [{
                  blend: true,
                  blendSrc: gfx.BlendFactor.ONE,
                  blendDst: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
                  blendSrcAlpha: gfx.BlendFactor.ONE,
                  blendDstAlpha: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA
                }]
              }
            }
          });
        }
        return vertexColor;
      }

      /** One material per texture so terrain meshes sharing a texture can batch. */
      function terrainMaterial(tex, file) {
        const key = texKey(file);
        let m = materialCache.get(key);
        if (!m) {
          m = new Material();
          m.copy(terrainBase);
          m.setProperty('mainTexture', tex);
          materialCache.set(key, m);
        }
        return m;
      }
      async function loadFont(name) {
        try {
          return await load(`fonts/${name}`, BitmapFont);
        } catch {
          return null;
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/backoff.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('retryDelay', retryDelay);
      cclegacy._RF.push({}, "cb706qgpDlLy5z7r5Zu/Zge", "backoff", undefined);
      /** Cho giua cac lan thu lai (spec OTA1 §4.4, KS §9.3 muc 4: engine khong tu cho). */
      const RETRY_DELAYS_MS = exports('RETRY_DELAYS_MS', [2000, 5000, 15000]);

      /** attempt dem tu 0; het luot -> null. */
      function retryDelay(attempt) {
        return attempt >= 0 && attempt < RETRY_DELAYS_MS.length ? RETRY_DELAYS_MS[attempt] : null;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Bike.ts", ['cc', './planck.mjs', './Config.ts', './LevelData.ts', './PhysicsBuilder.ts'], function (exports) {
  var cclegacy, DistanceJoint, RevoluteJoint, BIKE_SHEETS, spawnBikeEntities, PhysicsBuilder;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      DistanceJoint = module.DistanceJoint;
      RevoluteJoint = module.RevoluteJoint;
    }, function (module) {
      BIKE_SHEETS = module.BIKE_SHEETS;
    }, function (module) {
      spawnBikeEntities = module.spawnBikeEntities;
    }, function (module) {
      PhysicsBuilder = module.PhysicsBuilder;
    }],
    execute: function () {
      cclegacy._RF.push({}, "2332dil5ZRJOL078VTr5yqa", "Bike", undefined);

      /** Per-level tuning from the bike entity ("Moto", "XtremeBike", ...). */

      /*
       * Control model reverse-engineered from libgame.so (BikeCommon1 -update:, -speedLimit:Factor:,
       * -addContact:..., Moto/XtremeBike/... -init). Constants are the original ones.
       */
      const DRIVE_FORCE = 4500; // * forceScale, split between rear wheel and frame
      const LEAN_RATE = -7; // frame angular velocity (rad/s) at full tilt
      const LEAN_SPEEDUP_FROM = 90; // above this speed lean gets faster: 1 + (v - 90) / 42
      const START_PUSH_SPEED = 25; // gas from (almost) standstill sets frame velocity along the ground
      const AIR_WHEEL_TORQUE = -1000; // gas in the air spins the rear wheel
      const GAS_FRICTION = 100; // rear wheel friction while accelerating
      const NITRO_GROUND = 1.2; // force multiplier with nitro on the ground
      const NITRO_AIR = 0.36; // nitro thrust in the air (* DRIVE_FORCE)
      const HEAD_SAFE_SPEED = 40; // head touches slower than this don't kill if the bike is upright
      const GROUND_DELAY = 0.1; // a wheel still counts as grounded this long after leaving (-removeContact:)
      const SUNK_FRAME_DENSITY = 12; // -setMotoDensity: once the frame is in a fluid
      const BURNOUT_TORQUE = -600; // gas + brake on the ground spins the rear wheel
      const BURNOUT_MAX_SLIP = 10; // burnout only builds up while the rear wheel moves slower than its ground
      const ICE_TAG = 7;
      const ICE_WHEEL_TORQUE = -10000; // gas on ice only spins the rear wheel (no push along the ground)
      const NITRO_ICE = 0.6; // nitro on ice pushes the frame (* DRIVE_FORCE)
      const BURNOUT_SQUAT = 2.6 / 2.912226; // rear spring length while burning (burnoutDJointBurning / Normal)
      /** Keyboard/touch tilt ramps to full in this many seconds (the original reads the accelerometer). */
      const TILT_RAMP = 0.12;

      /** Per-bike force split (from each bike class' -init). */
      const BIKE_FORCES = {
        MainBikePref: {
          wheel: 0.7,
          center: 1.3,
          pcx: 0,
          pcy: 0
        },
        PizzaBikePref: {
          wheel: 0.35,
          center: 1.8,
          pcx: 0,
          pcy: 0
        },
        NeonBikePref: {
          wheel: 0.9,
          center: 0.9,
          pcx: 0,
          pcy: -3
        },
        SuperDukePref: {
          wheel: 0.9,
          center: 1.1,
          pcx: 0,
          pcy: -1
        },
        XtremeBikePref: {
          wheel: 0.9,
          center: 0.9,
          pcx: 0,
          pcy: 1.5
        }
      };

      /**
       * Rider pose for a pose value p in [-1, 1]: absolute lengths and frequencies of the three rider
       * springs (times the bike entity's scale) and joint limits in degrees, keyed by joint name.
       * Joints a bike's -updatePose does not touch keep their prefab values.
       */

      const piece = (p, neg, pos) => p <= 0 ? neg : pos;
      /** Each bike class' -updatePose (Moto, MotoPizza, NeonBike, SuperDuke, XtremeBike), transcribed. */
      const POSES = {
        MainBikePref: p => {
          const knee = [-55.4792 - p * piece(p, -4.5208015, -126.11279), 25 - p * piece(p, 53, -65.6336)];
          const foot = [-97.78253 - p * piece(p, -0.4815979, -104.73673), 29.28082 - p * piece(p, -18.358301, 22.326622)];
          return {
            springs: {
              dJointHead: [9 - p * piece(p, -0.97078323, 4), 3.32 - p * piece(p, 1.0000002, -4.68)],
              dJointTorso: [5.853149 - p * piece(p, -3.998483, -2.146851), 5.630224 - p * piece(p, 1, 1.6171242)],
              dJointWaist: [5.630351 - p * piece(p, -5.630351, -1.2732493), 6 - p * piece(p, 2, 0)]
            },
            limits: {
              revJointHead: [2.966609 - p * piece(p, -42.96661, 5.432362), 9.400685 - p * piece(p, -49.400684, 1.4833055)],
              revJointElbow: [-40.97389 - p * piece(p, -29.026112, -40.97389), 25.5899 - p * piece(p, -95.5899, 25.5899)],
              revJointKnee: knee,
              revJointKnee2: knee,
              revJointFoot: foot,
              revJointFoot2: foot
            }
          };
        },
        PizzaBikePref: p => {
          const foot = [-97.78253 - p * piece(p, -0.4815979, -104.73673), 29.28082 - p * piece(p, -18.358301, 22.326622)];
          return {
            springs: {
              dJointHead: [8.309697 - p * piece(p, 0.7703028, 3.3096972), 5 + p * piece(p, 0.6799998, 1.9295111)],
              dJointTorso: [3.551865 - p * piece(p, -0.14786506, 0.5518651), piece(p, 3 - 3.6302242 * p, 3)],
              dJointWaist: [3.069966 - p * piece(p, -0.11996603, -1.8005388), 7.984823 + p * piece(p, -2.0151768, -2.269287e-7)]
            },
            limits: {
              revJointHead: [2.966609 - p * piece(p, -26.48759, 5.432362), 9.400685 - p * piece(p, -32.921665, 1.4833055)],
              revJointElbow: [-40.97389 - p * piece(p, -18.974743, 22.05693), 142.5899 - p * piece(p, -199.4756, 205.62073)],
              revJointKnee: [-55.4792 + p * piece(p, -0.47919846, 112.4227), 25 + p * piece(p, -75, 57.33305)],
              revJointFoot: foot,
              revJointFoot2: foot
            }
          };
        },
        NeonBikePref: p => ({
          springs: {
            dJointHead: [6.845536, 4.32],
            dJointTorso: [p + 7.09651, 10],
            dJointWaist: [3.497776, 6.935765]
          },
          limits: {}
        }),
        SuperDukePref: p => {
          const knee = [-55.4792 - p * piece(p, -4.5208015, -126.11279), 25 - p * piece(p, 53, -65.6336)];
          const foot = [-97.78253 - p * piece(p, -0.4815979, -107.78253), 29.28082 - p * piece(p, -18.358301, 19.28082)];
          return {
            springs: {
              dJointHead: [10 - p * piece(p, -3.6, 1.8199997), 3.32 - p * piece(p, 1.0000002, -4.68)],
              dJointTorso: [5.5 - p * piece(p, 0.13000011, -2.5), 5.630224 - p * piece(p, 1, 1.6171242)],
              dJointWaist: [5 + p * piece(p, 1, 1.9036002), 6 - p * piece(p, 2, 0)]
            },
            limits: {
              revJointHead: [piece(p, 15.966609 * p + 2.966609, 2.966609), piece(p, 22.400684 * p + 9.400685, 9.400685)],
              revJointElbow: [-40.97389 - p * piece(p, -3.0261116, -40.97389), 25.5899 - p * piece(p, -44.589897, 25.5899)],
              revJointKnee: knee,
              revJointKnee2: knee,
              revJointFoot: foot,
              revJointFoot2: foot
            }
          };
        },
        XtremeBikePref: p => {
          const foot = [-7.76 - p * piece(p, -2.2399998, -14.7142), 50 - p * piece(p, -39.07748, 43.0458)];
          return {
            springs: {
              dJointHead: [11.238 - p * piece(p, 2.3520002, -0.62040997), 4.32],
              dJointTorso: [4.983 - p * piece(p, -1.1829998, -1.9808273), 6.630224 - p * piece(p, 0, 2.617124)],
              dJointWaist: [6.042 - p * piece(p, -2.8129997, -6.4082403), 6.935765 - p * piece(p, 0, 2.6613069)]
            },
            limits: {
              revJointHead: [2.966609 - p * piece(p, -26.48759, 5.432362), 9.400685 - p * piece(p, -32.921665, 1.4833055)],
              revJointElbow: [-40.97389 - p * piece(p, -18.426113, -97.68622), 60 - p * piece(p, -119.4, -10)],
              revJointKnee: [-55.4792 - p * piece(p, 0.47919846, -120.0892), 25 - p * piece(p, 75, -39.61)],
              revJointFoot: foot,
              revJointFoot2: foot
            }
          };
        }
      };
      const DEG = Math.PI / 180;
      class Bike {
        constructor(world, range, params, gravity) {
          this.bodies = [];
          this.joints = [];
          this.frame = void 0;
          this.backWheel = void 0;
          this.frontWheel = void 0;
          this.torso = void 0;
          this.head = void 0;
          this.riderBodies = new Set();
          /** Rider joints by name (dJointHead, revJointKnee, ...), driven by the pose. */
          this.poseJoints = new Map();
          this.poseOf = POSES.MainBikePref;
          this.forces = BIKE_FORCES.MainBikePref;
          /** Lean buttons / keys, ramped like a tilted device. */
          this.tiltPose = 0;
          /** BikeCommon1 tiltPoseValue_: the tilt (buttons + device), squared on the ground; drives the lean and the pose. */
          this.tiltValue = 0;
          /** Ground contact state, refreshed every step from the wheels' contact lists. */
          this.backGround = false;
          this.frontGround = false;
          this.groundTangent = {
            x: 1,
            y: 0
          };
          this.groundTraction = true;
          /** Last ground contact of each wheel: world point and the subtag of what it touches. */
          this.contact = {
            back: {
              x: 0,
              y: 0,
              subtag: 0
            },
            front: {
              x: 0,
              y: 0,
              subtag: 0
            }
          };
          this.backDelay = 0;
          this.frontDelay = 0;
          this.backContacts = new Set();
          this.frontContacts = new Set();
          /** Tag of the last ground a wheel started touching (BikeCommon1 lastGroundTag_; 7 = ice). */
          this.lastGroundTag = 1;
          /** What the rear wheel stands on (BikeCommon1 lastContactObject_). */
          this.groundBody = null;
          /** NeonBike -init: ignoreIce_ (it drives on ice like on any ground). */
          this.ignoreIce = false;
          /**
           * Wheels that touched down this step (BikeCommon1 -wheelContact:...: the wheel was off the
           * ground), with the contact point; consumed by BikeEffects.
           */
          this.landings = [];
          /** Gas + brake on the ground this step (the burnout branch of BikeCommon1 -update:). */
          this.burning = false;
          this.burnoutPower = 1;
          /** Engine state (BikeCommon1 -updateEngineRPM), drives the engine sound's RPM parameter. */
          this.rpm = 0;
          this.load = 0.5;
          this.rpmTarget = 0;
          this.rpmRecover = 1;
          this.burnoutJoint = null;
          this.burnoutLen0 = 0;
          this.events = null;
          this.crashed = false;
          /** the bike blew up (Bike exploded_): the wheels are off */
          this.exploded = false;
          this.finished = false;
          /** BikeCommon1 underwater_: the frame went into a fluid and sinks */
          this.underwater = false;
          this.world = world;
          this.range = range;
          this.params = params;
          this.gravity = gravity;
        }
        static async spawn(world, ground, entities, view, prefab, params, x, y, gravity) {
          const range = await spawnBikeEntities(entities, prefab, x, y);
          const builder = new PhysicsBuilder(world, entities, ground);
          builder.build(range[0], range[1]);
          const bike = new Bike(world, range, params, gravity);
          bike.forces = BIKE_FORCES[prefab] || BIKE_FORCES.MainBikePref;
          bike.poseOf = POSES[prefab] || POSES.MainBikePref;
          bike.ignoreIce = prefab === 'NeonBikePref';
          builder.bodies.forEach(b => bike.bodies.push(b));
          builder.joints.forEach(j => bike.joints.push(j));
          await view.build(entities, builder.bodies, range[0], range[1], BIKE_SHEETS[prefab]);
          bike.resolveParts();
          return bike;
        }
        resolveParts() {
          const byName = n => this.bodies.find(b => b.getUserData().name === n);
          const bySub = s => this.bodies.find(b => b.getUserData().subtag === s);
          this.frame = bySub(2) || byName('MotoCenter');
          this.backWheel = bySub(3) || byName('backWheel');
          this.frontWheel = bySub(4) || byName('frontWheel');
          this.head = bySub(0) || byName('herohead');
          this.torso = bySub(1) || byName('heroTorso');
          for (const b of this.bodies) {
            const name = (b.getUserData().name || '').toLowerCase();
            if (name.startsWith('hero')) this.riderBodies.add(b);
          }
          if (!this.frame || !this.backWheel || !this.frontWheel) console.warn('[BR] bike parts not found');
          for (const j of this.joints) {
            var _j$getUserData;
            const name = (((_j$getUserData = j.getUserData()) == null ? void 0 : _j$getUserData.name) || '').trim();
            if (name === 'dJointBWheel' && j instanceof DistanceJoint) {
              this.burnoutJoint = j;
              this.burnoutLen0 = j.getLength();
            }
            if ((j instanceof DistanceJoint || j instanceof RevoluteJoint) && !this.poseJoints.has(name)) {
              this.poseJoints.set(name, j);
            }
          }
        }

        /** BikeCommon1 -update: poseValue, then the bike class' -updatePose (see POSES). */
        updatePose() {
          // leanValue: frame angle mapped to [-1, 1] at +-60 degrees
          let a = this.frame.getAngle() % (2 * Math.PI);
          if (a > Math.PI) a -= 2 * Math.PI;
          if (a < -Math.PI) a += 2 * Math.PI;
          if (a > Math.PI / 2) a = Math.PI - a;else if (a < -Math.PI / 2) a = -Math.PI - a;
          const lean = Math.max(-1, Math.min(1, a / (Math.PI / 3)));
          const p = Math.max(-1, Math.min(1, this.tiltValue + lean));
          const pose = this.poseOf(p);
          const k = this.params.scale ?? 1; // PhysicsEntity scale_p
          for (const name in pose.springs) {
            const j = this.poseJoints.get(name);
            if (!(j instanceof DistanceJoint)) continue;
            const [len, freq] = pose.springs[name];
            j.setLength(len * k);
            j.setFrequency(freq * k);
          }
          for (const name in pose.limits) {
            const j = this.poseJoints.get(name);
            if (!(j instanceof RevoluteJoint)) continue;
            const lo = pose.limits[name][0] * DEG,
              hi = pose.limits[name][1] * DEG;
            j.setLimits(Math.min(lo, hi), Math.max(lo, hi));
          }
        }
        isRider(b) {
          return this.riderBodies.has(b);
        }
        owns(b) {
          const info = b.getUserData();
          return info && info.bike === this.range[0];
        }
        get position() {
          return (this.crashed ? this.frame : this.torso || this.frame).getPosition();
        }
        get speed() {
          return this.frame.getLinearVelocity().x;
        }

        /** -isInStablePosition: the head is above both wheels. */
        isStable() {
          const hy = this.head.getPosition().y;
          return this.backWheel.getPosition().y <= hy && this.frontWheel.getPosition().y <= hy;
        }

        /** -addContact: a head touch kills unless it is slow and the bike is upright. */
        headHitIsFatal(other) {
          const len = v => Math.hypot(v.x, v.y);
          if (len(this.head.getLinearVelocity()) > HEAD_SAFE_SPEED) return true;
          if (len(other.getLinearVelocity()) > HEAD_SAFE_SPEED) return true;
          return !this.isStable();
        }

        /**
         * Scan a wheel's contacts for ground (anything solid that is not part of the bike). A contact
         * that just began sets lastGroundTag (BikeCommon1 -addContact:FixtureA:FixtureB:).
         */
        touching(wheel, wantTangent) {
          const back = wheel === this.backWheel;
          const prev = back ? this.backContacts : this.frontContacts;
          const now = new Set();
          for (let ce = wheel.getContactList(); ce; ce = ce.next) {
            var _other$getUserData, _wm$points, _other$getUserData2;
            const c = ce.contact;
            if (!c.isTouching() || c.getFixtureA().isSensor() || c.getFixtureB().isSensor()) continue;
            const other = ce.other;
            if (this.owns(other)) continue;
            // -PreSolve: only ground (tag 0), obstacles (1) and tag 7 (ice) objects count as ground
            const tag = ((_other$getUserData = other.getUserData()) == null ? void 0 : _other$getUserData.tag) ?? 0;
            if (tag !== 0 && tag !== 1 && tag !== 7) continue;
            now.add(c);
            if (!prev.has(c)) this.lastGroundTag = tag;
            if (now.size > 1) continue;
            const wm = c.getWorldManifold(null);
            const info = back ? this.contact.back : this.contact.front;
            const pt = wm == null || (_wm$points = wm.points) == null ? void 0 : _wm$points[0];
            const wp = wheel.getPosition();
            info.x = pt ? pt.x : wp.x;
            info.y = pt ? pt.y : wp.y;
            info.subtag = ((_other$getUserData2 = other.getUserData()) == null ? void 0 : _other$getUserData2.subtag) ?? 0;
            if (back) this.groundBody = other;
            if (wantTangent) {
              var _other$getUserData3;
              if (wm) {
                // the normal points from fixture A to B; make it point from the ground into the wheel
                let nx = wm.normal.x,
                  ny = wm.normal.y;
                if (c.getFixtureA().getBody() === wheel) {
                  nx = -nx;
                  ny = -ny;
                }
                this.groundTangent = {
                  x: ny,
                  y: -nx
                };
              }
              this.groundTraction = !((_other$getUserData3 = other.getUserData()) != null && _other$getUserData3.noTraction);
            }
          }
          if (back) this.backContacts = now;else this.frontContacts = now;
          return now.size > 0;
        }

        /**
         * Box2D 2.1 mixes fixture frictions every step (b2ContactSolver); planck stores the mix in the
         * contact when it is created, so contacts already touching must be refreshed by hand.
         */
        setFriction(b, f) {
          for (let fx = b.getFixtureList(); fx; fx = fx.getNext()) fx.setFriction(f);
          for (let ce = b.getContactList(); ce; ce = ce.next) ce.contact.resetFriction();
        }

        /** -speedLimit:Factor: clamp |v| to lerp(speedLimit, maxWheelieSpeed, k). */
        limit(b, k) {
          const v = b.getLinearVelocity();
          const s = Math.hypot(v.x, v.y);
          const p = this.params;
          const max = p.speedLimit + (p.maxWheelieSpeed - p.speedLimit) * k;
          if (s > p.speedLimit && s > 1e-6) b.setLinearVelocity({
            x: v.x / s * max,
            y: v.y / s * max
          });
        }
        update(input, dt) {
          if (!this.frame || !this.backWheel) return;
          const p = this.params;
          // BikeCommon1 -update: starts by unlocking both wheels; braking (and a burnout's front wheel)
          // locks them again with b2Body fixedRotation, so contacts can't turn a braked wheel either
          this.backWheel.setFixedRotation(false);
          this.frontWheel.setFixedRotation(false);
          // BikeCommon1 -wheelContact: (every PreSolve) / -removeContact: / -update:: a wheel is on the
          // ground while it touches, and until GROUND_DELAY after its last contact ended
          if (this.touching(this.backWheel, true)) {
            if (!this.backGround) {
              // landing on the rear wheel chokes the engine for a moment
              this.rpmRecover = 0.5;
              this.landings.push({
                front: false,
                ...this.contact.back
              });
            }
            this.backGround = true;
            this.backDelay = GROUND_DELAY;
          } else if ((this.backDelay -= dt) <= 0) {
            this.backGround = false;
          }
          if (this.touching(this.frontWheel, false)) {
            if (!this.frontGround) this.landings.push({
              front: true,
              ...this.contact.front
            });
            this.frontGround = true;
            this.frontDelay = GROUND_DELAY;
          } else if ((this.frontDelay -= dt) <= 0) {
            this.frontGround = false;
          }
          this.burning = false;
          this.rpmRecover += (1 - this.rpmRecover) * 0.05;
          if (this.crashed || this.finished) {
            this.rpmTarget = 0;
            this.updateEngineRPM();
            return;
          }

          // lean: the frame's angular velocity is set directly from the tilt input
          const target = (input.leanForward ? 1 : 0) - (input.leanBack ? 1 : 0);
          const step = dt / TILT_RAMP;
          this.tiltPose += Math.max(-step, Math.min(step, target - this.tiltPose));
          const fv = this.frame.getLinearVelocity();
          const speed = Math.hypot(fv.x, fv.y);
          const speedup = speed > LEAN_SPEEDUP_FROM ? 1 + (speed - LEAN_SPEEDUP_FROM) * 0.0238095 : 1;
          // on the ground the tilt response is squared: powf(|tilt|, 2) * sign
          const onGround = this.backGround || this.frontGround;
          const tp = this.tiltPose + (input.tilt || 0);
          this.tiltValue = onGround ? tp * Math.abs(tp) : tp;
          this.frame.setAngularVelocity(speedup * this.tiltValue * LEAN_RATE * (p.tilt || 1));
          this.updatePose();

          // ground tangent and how well the bike is aligned with it
          const t = this.groundTangent;
          const tl = Math.hypot(t.x, t.y) || 1;
          const tx = t.x / tl,
            ty = t.y / tl;
          const a = this.frame.getAngle();
          const align = Math.cos(a) * tx + Math.sin(a) * ty;
          const nitro = input.nitro;

          // speed limits while the rear wheel is on the ground (nitro ignores them)
          if (!nitro && this.backGround && !input.brake) {
            const k = this.frontGround ? 0 : align > 0.9 ? (0.9 - align) * 10 + 1 : 1;
            this.limit(this.frame, k);
            this.limit(this.backWheel, k);
            this.limit(this.frontWheel, k);
          }
          const F = DRIVE_FORCE * (p.forceScale || 1);
          if (!input.gas) this.burnoutPower = 1;
          const onIce = this.lastGroundTag === ICE_TAG && !this.ignoreIce;
          if (input.brake && input.gas && this.backGround && this.frontGround) {
            var _this$groundBody, _this$burnoutJoint;
            this.frontWheel.setAngularVelocity(0);
            const gv = ((_this$groundBody = this.groundBody) == null ? void 0 : _this$groundBody.getLinearVelocity()) || {
              x: 0,
              y: 0
            };
            const wv = this.backWheel.getLinearVelocity();
            if (Math.hypot(gv.x - wv.x, gv.y - wv.y) >= BURNOUT_MAX_SLIP) {
              // still rolling: no burnout; on ice the rear wheel just spins
              if (onIce) {
                this.backWheel.applyTorque(BURNOUT_TORQUE, true);
                this.setFriction(this.backWheel, 0);
              }
              this.updateEngineRPM();
              return;
            }
            // burnout: rear wheel spins in place, power builds up to 2
            this.setFriction(this.backWheel, 0);
            this.backWheel.applyTorque(BURNOUT_TORQUE, true);
            this.burnoutPower = Math.min(2, this.burnoutPower + dt);
            this.burning = true;
            this.frontWheel.setFixedRotation(true);
            (_this$burnoutJoint = this.burnoutJoint) == null || _this$burnoutJoint.setLength(this.burnoutLen0 * BURNOUT_SQUAT);
            this.rpmTarget = this.burnoutPower * 0.5;
            this.updateEngineRPM();
            return;
          }
          if (this.burnoutPower > 1 && input.gas && this.backGround) {
            var _this$burnoutJoint2, _this$events;
            // releasing the brake launches frame and rear wheel along the ground: the original applies
            // the vector as an impulse and then also sets it as their velocity (the ground speed
            // limit trims it back to speedLimit on the next step)
            const k = this.burnoutPower * 100 * (p.burnoutSpeed || 1);
            for (const b of [this.frame, this.backWheel]) {
              b.applyLinearImpulse({
                x: tx * k,
                y: ty * k
              }, b.getWorldCenter(), true);
              b.setLinearVelocity({
                x: tx * k,
                y: ty * k
              });
            }
            this.burnoutPower = 1;
            (_this$burnoutJoint2 = this.burnoutJoint) == null || _this$burnoutJoint2.setLength(this.burnoutLen0);
            (_this$events = this.events) == null || _this$events.onBurnoutLaunch == null || _this$events.onBurnoutLaunch();
          }
          // engine: idle unless the throttle is open (in the air it revs freely)
          this.rpmTarget = 0;
          if (input.brake) {
            // lock both wheels; grip falls off with speed
            this.backWheel.setFixedRotation(true);
            this.frontWheel.setFixedRotation(true);
            const grip = Math.max(0.3, (130 - speed) * 0.1);
            this.setFriction(this.backWheel, grip);
            this.setFriction(this.frontWheel, grip);
          } else if (input.gas || nitro) {
            if (!this.backGround) {
              if (nitro) {
                const k = F * NITRO_AIR * (p.nitroPerformance || 1);
                this.frame.applyForceToCenter({
                  x: Math.cos(a) * k,
                  y: Math.sin(a) * k
                }, true);
              }
              this.backWheel.applyTorque(AIR_WHEEL_TORQUE, true);
              this.rpmTarget = 1;
            } else if (onIce) {
              // BikeCommon1 -update: on ice (lastGroundTag 7) the rear wheel gets a big torque instead of
              // the push along the ground; nitro pushes the frame at its power centre
              this.rpmTarget = this.backWheel.getAngularVelocity() * -0.0142857;
              if (nitro) {
                const k = F * NITRO_ICE * (p.nitroPerformance || 1);
                const at = this.frame.getWorldPoint({
                  x: this.forces.pcx,
                  y: this.forces.pcy
                });
                this.frame.applyForce({
                  x: tx * k,
                  y: ty * k
                }, at, true);
              }
              this.backWheel.applyTorque(ICE_WHEEL_TORQUE, true);
            } else {
              this.rpmTarget = this.backWheel.getAngularVelocity() * -0.0142857;
              const wv = this.backWheel.getLinearVelocity();
              if (Math.hypot(wv.x, wv.y) < START_PUSH_SPEED) {
                this.frame.setLinearVelocity({
                  x: tx * START_PUSH_SPEED,
                  y: ty * START_PUSH_SPEED
                });
              }
              const n = nitro ? NITRO_GROUND * (p.nitroPerformance || 1) : 1;
              // without traction, misalignment moves the push from the wheel to the frame
              const mis = this.groundTraction ? 0 : align > 0.3 ? (0.3 - align) * 1.42857 + 1 : 1;
              if (this.groundTraction && this.forces.wheel > 0) {
                const k = F * (1 - mis) * n * this.forces.wheel;
                this.backWheel.applyForce({
                  x: tx * k,
                  y: ty * k
                }, this.backWheel.getPosition(), true);
              }
              if (this.groundTraction && this.forces.center > 0) {
                const k = F * (mis + 1) * n * this.forces.center;
                const at = this.frame.getWorldPoint({
                  x: this.forces.pcx,
                  y: this.forces.pcy
                });
                this.frame.applyForce({
                  x: tx * k,
                  y: ty * k
                }, at, true);
              }
            }
            this.setFriction(this.backWheel, GAS_FRICTION);
          }
          this.updateEngineRPM();
        }

        /**
         * BikeCommon1 -updateEngineRPM: rpm eases towards rpmTarget * rpmRecover (faster when rising in
         * the air), load jumps with rpm changes and settles back to 0.5.
         */
        updateEngineRPM() {
          const prev = this.rpm;
          const d = this.rpmTarget * this.rpmRecover - this.rpm;
          this.rpm += d * (d < 0 ? 0.0666667 : this.backGround ? 0.1 : 0.125);
          this.load += (this.rpm - prev) * 2;
          this.load += (0.5 - this.load) * 0.02;
        }

        /**
         * BikeCommon1 -update: with willExplode: the wheel joints (dJoint/revJoint BWheel, dJoint/lJoint
         * FWheel) are unloaded, the wheels roll off on their own.
         */
        explode() {
          if (this.exploded) return;
          this.exploded = true;
          for (const j of this.joints.slice()) {
            const a = j.getBodyA(),
              b = j.getBodyB();
            const wheel = x => x === this.backWheel || x === this.frontWheel;
            if (wheel(a) !== wheel(b)) {
              this.world.destroyJoint(j);
              this.joints.splice(this.joints.indexOf(j), 1);
            }
          }
        }

        /**
         * BikeCommon1 -addContact: with a tag 2 entity (WaterTrigger) on motoCenter: -setMotoDensity:12
         * (every frame fixture, then ResetMassData) and underwater_. Buoyancy is applied once per frame
         * fixture touching the fluid, so at its prefab density (~0.5) the frame would shoot back up.
         */
        sink() {
          this.underwater = true;
          for (let f = this.frame.getFixtureList(); f; f = f.getNext()) f.setDensity(SUNK_FRAME_DENSITY);
          this.frame.resetMassData();
        }

        /** Detach the rider from the bike (ragdoll). */
        crash() {
          if (this.crashed) return;
          this.crashed = true;
          for (const j of this.joints.slice()) {
            const a = j.getBodyA(),
              b = j.getBodyB();
            if (this.isRider(a) !== this.isRider(b)) {
              this.world.destroyJoint(j);
              this.joints.splice(this.joints.indexOf(j), 1);
            }
          }
        }
        destroy(view) {
          for (const j of this.joints) this.world.destroyJoint(j);
          for (const b of this.bodies) {
            view.detachBody(b);
            this.world.destroyBody(b);
          }
          view.removeOwners(this.range[0], this.range[1]);
          this.joints.length = 0;
          this.bodies.length = 0;
        }
      }
      exports('Bike', Bike);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BikeEffects.ts", ['cc', './Config.ts', './Assets.ts'], function (exports) {
  var cclegacy, resources, ParticleAsset, Node, Layers, ParticleSystem2D, gfx, Color, Material, builtinResMgr, UITransform, Sprite, PX_PER_UNIT, getFrame;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      resources = module.resources;
      ParticleAsset = module.ParticleAsset;
      Node = module.Node;
      Layers = module.Layers;
      ParticleSystem2D = module.ParticleSystem2D;
      gfx = module.gfx;
      Color = module.Color;
      Material = module.Material;
      builtinResMgr = module.builtinResMgr;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
    }, function (module) {
      PX_PER_UNIT = module.PX_PER_UNIT;
    }, function (module) {
      getFrame = module.getFrame;
    }],
    execute: function () {
      cclegacy._RF.push({}, "c42daPPYyxBZqJw+/71X5VO", "BikeEffects", undefined);
      /** Exhaust offset from the frame, in points (Bike escapeShift_: BikeCommon1 -init, MotoPizza -init). */
      const ESCAPE_SHIFT = {
        MotoPizza: [-60, -33]
      };
      const DEFAULT_ESCAPE_SHIFT = [-70, 8];
      /** BikeCommon1 burnoutOffsetX_/Y_: burnout smoke offset from the rear wheel, in points (not rotated). */
      const BURNOUT_OFFSET = {
        x: -10,
        y: -15
      };
      /** escape.plist start colour (rgb), restored when the gas is released after a burnout. */
      const ESCAPE_RGB = [0.2537435, 0.35, 0.3732096];
      /** Seconds between two dust puffs of one wheel (BikeCommon1 back/frontDustCooldown_). */
      const DUST_COOLDOWN = 1;
      /** Nitro flames blink every this many seconds (Bike nitroBlinkDelay_). */
      const NITRO_BLINK = 0.05;

      /** Universe and pack (0-based) of a level id: "<pack>_<n>" or "<universe>_<pack>_<n>". */
      function themeOf(levelId) {
        const parts = levelId.split('_').map(Number);
        if (parts.length >= 3) return {
          universe: parts[0] - 1,
          pack: parts[1] - 1
        };
        return {
          universe: 0,
          pack: (parts[0] || 1) - 1
        };
      }
      const c4 = (r, g, b, a) => new Color(r * 255, g * 255, b * 255, a * 255);

      /**
       * The bike's particle effects and nitro flames (BikeCommon1 -loadEscapeTube, -loadBurnoutSmoke,
       * -loadDustEffects, Bike -loadNitroEffect and their use in BikeCommon1 -update: /
       * -wheelContact:Entity:CollideEntity: / -setUsingNitro: / -setAcceleration:).
       *
       * The particle systems are children of the bike node in the original, with positionType
       * "relative": emitted particles stay where they are in the world. Here they hang off a node in
       * the world view scaled to points (world units * 10), drawn over the bike (the bike sprites have
       * z -4..-1, the systems z 0 / 3 inside the bike); the nitro flames hang off the game scene at z -3
       * / -1, behind the bike.
       */
      class BikeEffects {
        constructor(view, bikeDefinition, levelId) {
          this.hasSmoke = void 0;
          this.showNitro = void 0;
          this.shift = void 0;
          this.theme = void 0;
          this.root = void 0;
          this.nitroRoot = void 0;
          this.escape = null;
          this.burnout = null;
          this.dust = [];
          // [back, front]
          this.dustCooldown = [DUST_COOLDOWN, DUST_COOLDOWN];
          /** Frames left before a dust burst stops emitting (see emit()). */
          this.dustFrames = [0, 0];
          this.rates = new Map();
          this.nitroFlames = [];
          this.nitroLight = null;
          this.nitroBlink = 0;
          this.usingNitro = false;
          this.burnoutColor = false;
          this.theme = themeOf(levelId);
          // NeonBike -init turns both off; -loadBurnoutSmoke turns the smoke off in pack 3
          this.hasSmoke = bikeDefinition !== 'NeonBike' && !(this.theme.pack === 3 && this.theme.universe !== 1);
          this.showNitro = bikeDefinition !== 'NeonBike';
          this.shift = ESCAPE_SHIFT[bikeDefinition] || DEFAULT_ESCAPE_SHIFT;
          const points = name => {
            const n = new Node(name);
            n.layer = Layers.Enum.UI_2D;
            n.addComponent(UITransform);
            n.setScale(1 / PX_PER_UNIT, 1 / PX_PER_UNIT, 1);
            return n;
          };
          this.root = points('BikeEffects');
          view.addEffect(this.root, 0);
          this.nitroRoot = points('NitroEffect');
          view.addEffect(this.nitroRoot, -4.5);
        }
        async load() {
          const load = name => new Promise(res => resources.load(`particles/${name}`, ParticleAsset, (err, a) => res(err ? null : a)));
          const [escape, dust, burnout] = await Promise.all([load('escape'), load('dust'), load('burnout')]);
          if (this.hasSmoke) {
            this.dust = [this.system(dust, 'dustBack'), this.system(dust, 'dustFront')];
            this.burnout = this.system(burnout, 'burnout');
            this.escape = this.system(escape, 'escape'); // z 3: last
            this.applyColors();
            this.dust.forEach(d => this.emit(d, false));
            this.emit(this.burnout, true);
            this.emit(this.escape, true);
          }
          if (this.showNitro) this.buildNitro();
        }
        system(asset, name) {
          if (!asset) return null;
          const n = new Node(name);
          n.layer = Layers.Enum.UI_2D;
          this.root.addChild(n);
          const ps = n.addComponent(ParticleSystem2D);
          ps.playOnLoad = false;
          // (ONE, ONE_MINUS_SRC_ALPHA) is cocos2d's premultiplied-alpha blend, where it also
          // premultiplies the particle colours; our textures are not premultiplied: plain alpha blend
          // (the importer already turned the plist's GL constants into gfx.BlendFactor values)
          const dict = asset._nativeAsset;
          if (dict && Number(dict.blendFuncSource) === gfx.BlendFactor.ONE && Number(dict.blendFuncDestination) === gfx.BlendFactor.ONE_MINUS_SRC_ALPHA) {
            dict.blendFuncSource = gfx.BlendFactor.SRC_ALPHA;
          }
          // the system re-reads the plist in __preload, which waits while the level is built under an
          // inactive layer (GameRoot.startLevel): put the position type in the plist too
          if (dict) dict.positionType = ParticleSystem2D.PositionType.RELATIVE;
          ps.file = asset;
          ps.positionType = ParticleSystem2D.PositionType.RELATIVE;
          // Cocos stops drawing a system as soon as it is stopped (cocos2d lets the living particles
          // finish), and a finite duration stops it: run forever and gate the emission rate instead
          this.rates.set(ps, ps.emissionRate);
          ps.duration = -1;
          ps.resetSystem();
          return ps;
        }

        /**
         * cocos2d -resetSystem (restart = true: kill the living particles and emit again) /
         * -stopSystem (stop emitting; the living particles keep going).
         */
        emit(ps, on, restart = on) {
          if (!ps) return;
          if (restart) ps.resetSystem();
          ps.emissionRate = on ? this.rates.get(ps) : 0;
        }

        /** Theme colours (-loadDustEffects, -loadBurnoutSmoke); the burnout smoke starts with no life. */
        applyColors() {
          const {
            universe,
            pack
          } = this.theme;
          for (const d of this.dust) {
            if (!d) continue;
            if (universe === 1) {
              d.startColor = c4(0, 0, 0, 1);
              d.endColor = c4(0, 0, 0, 0);
            } else if (universe === 2) {
              d.startColor = c4(1, 1, 1, 1);
              d.endColor = c4(1, 1, 1, 0);
            }
          }
          const b = this.burnout;
          if (!b) return;
          b.life = 0;
          b.lifeVar = 0;
          if (pack === 1 || universe === 1) {
            b.startColor = c4(0, 0, 0, 1);
            b.endColor = c4(0, 0, 0, 0);
          } else if (pack === 2) {
            b.startColor = c4(0.75, 0.75, 0.75, 1);
            b.endColor = c4(0.75, 0.75, 0.75, 0);
          }
        }

        /** Bike -loadNitroEffect: two blinking flames and a light, additive, anchored at the exhaust. */
        buildNitro() {
          if (!BikeEffects.additive) {
            const m = new Material();
            m.initialize({
              effectAsset: builtinResMgr.get('ui-sprite-material').effectAsset,
              defines: {
                USE_TEXTURE: true
              },
              states: {
                blendState: {
                  targets: [{
                    blend: true,
                    blendSrc: gfx.BlendFactor.ONE,
                    blendDst: gfx.BlendFactor.ONE,
                    blendSrcAlpha: gfx.BlendFactor.ONE,
                    blendDstAlpha: gfx.BlendFactor.ONE
                  }]
                }
              }
            });
            BikeEffects.additive = m;
          }
          const sprite = (frame, ax) => {
            const f = getFrame(frame, 'menusheet_hd');
            if (!f) return null;
            const n = new Node(frame);
            n.layer = Layers.Enum.UI_2D;
            const sp = n.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.RAW;
            sp.trim = false;
            sp.spriteFrame = f;
            sp.customMaterial = BikeEffects.additive;
            n.getComponent(UITransform).setAnchorPoint(ax, 0.5);
            n.active = false;
            this.nitroRoot.addChild(n);
            return n;
          };
          // z -3 (flames) below z -1 (light) in the game scene
          this.nitroFlames = [sprite('NitroFrame1.png', 0.84), sprite('NitroFrame2.png', 0.84)].filter(n => n);
          this.nitroLight = sprite('NitroFrame_Light.png', 0.65);
        }

        /** Bike -reset: dust cooldowns back to 1 s, nitro off (the exhaust starts again). */
        reset() {
          this.dustCooldown = [DUST_COOLDOWN, DUST_COOLDOWN];
          this.setNitro(false);
          if (this.burnout) this.burnout.life = 0;
        }

        /** Bike -setUsingNitro: the exhaust stops while the nitro burns, the flames show. */
        setNitro(on) {
          if (on === this.usingNitro) return;
          this.usingNitro = on;
          this.emit(this.escape, !on);
          if (!on) {
            this.nitroFlames.forEach(n => n.active = false);
            if (this.nitroLight) this.nitroLight.active = false;
          } else if (this.nitroLight) {
            this.nitroLight.active = true;
          }
        }

        /** Per physics step, after Bike.update. */
        step(bike, input, dt) {
          var _this$escape, _bike$head;
          this.setNitro(!!input.nitro && !bike.crashed);
          // BikeCommon1 -addContact: the exhaust stops once the frame is under water
          if (bike.underwater && (_this$escape = this.escape) != null && _this$escape.emissionRate) this.emit(this.escape, false, false);
          // dust cooldowns only run while the rider moves (lastHeadLinearVelocity_ > 0.5)
          const hv = (_bike$head = bike.head) == null ? void 0 : _bike$head.getLinearVelocity();
          if (hv && Math.hypot(hv.x, hv.y) > 0.5) {
            for (let i = 0; i < 2; i++) if (this.dustCooldown[i] > 0) this.dustCooldown[i] -= dt;
          }
          // -wheelContact: a wheel landing on plain ground (subtag 0) throws up dust
          for (const l of bike.landings) {
            const i = l.front ? 1 : 0;
            const d = this.dust[i];
            if (!d || l.subtag !== 0 || this.dustCooldown[i] >= 0) continue;
            d.node.setPosition(l.x * PX_PER_UNIT, l.y * PX_PER_UNIT);
            // dust.plist lasts 0.01 s: one frame of emission (this frame's and the next sync)
            this.emit(d, true);
            this.dustFrames[i] = 2;
            this.dustCooldown[i] = DUST_COOLDOWN;
          }
          bike.landings.length = 0;
          if (!this.hasSmoke) return;
          const v = bike.frame.getLinearVelocity();
          const speed = Math.hypot(v.x, v.y);
          if (this.escape) this.escape.speed = 100 - speed;
          const p = bike.burnoutPower;
          const b = this.burnout;
          if (bike.burning) {
            // the smoke grows with the burnout power, the exhaust speeds up and darkens
            if (b) {
              const bw = bike.backWheel.getPosition();
              b.node.setPosition(bw.x * PX_PER_UNIT + BURNOUT_OFFSET.x, bw.y * PX_PER_UNIT + BURNOUT_OFFSET.y);
              b.life = (p - 1) * 0.85;
              b.lifeVar = 0;
              b.endSize = (p - 1) * 150;
              b.speed = (p - 1) * 70 + 80;
            }
            if (this.escape) {
              this.escape.speed = (p - 1) * 49 + 151;
              this.escape.startColor = c4(ESCAPE_RGB[0], ESCAPE_RGB[1], ESCAPE_RGB[2], p * 0.25 + 0.12);
            }
            this.burnoutColor = true;
          } else if (b && b.life !== 0) {
            // brake released (launch) or gas released: no more burnout smoke
            b.life = 0;
            b.lifeVar = 0;
          }
          if (!input.gas && this.burnoutColor) {
            // -setAcceleration:NO restores the exhaust colour
            if (this.escape) this.escape.startColor = c4(ESCAPE_RGB[0], ESCAPE_RGB[1], ESCAPE_RGB[2], 0.12);
            this.burnoutColor = false;
          }
        }

        /**
         * Per frame: the exhaust (and the nitro flames) follow the frame's drawn pose; escapeShift is
         * rotated with the frame.
         */
        sync(bike, pose, dt) {
          var _this$escape2;
          for (let i = 0; i < 2; i++) {
            if (this.dustFrames[i] > 0 && --this.dustFrames[i] === 0) this.emit(this.dust[i], false);
          }
          if (!(bike != null && bike.frame)) return;
          const f = pose(bike.frame);
          const c = Math.cos(f.a),
            s = Math.sin(f.a);
          const ex = f.x * PX_PER_UNIT + this.shift[0] * c - this.shift[1] * s;
          const ey = f.y * PX_PER_UNIT + this.shift[0] * s + this.shift[1] * c;
          (_this$escape2 = this.escape) == null || _this$escape2.node.setPosition(ex, ey);
          if (!this.usingNitro || bike.crashed || !this.showNitro) return;
          const deg = f.a * 180 / Math.PI;
          for (const n of [...this.nitroFlames, this.nitroLight]) {
            if (!n) continue;
            n.setPosition(ex, ey);
            n.angle = deg;
          }
          this.nitroBlink -= dt;
          if (this.nitroBlink < 0 && this.nitroFlames.length === 2) {
            this.nitroBlink = NITRO_BLINK;
            const [a, b] = this.nitroFlames;
            const wasA = a.active;
            a.active = !wasA;
            b.active = wasA;
          }
        }
        destroy() {
          this.root.destroy();
          this.nitroRoot.destroy();
        }
      }
      exports('BikeEffects', BikeEffects);
      BikeEffects.additive = null;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/BikeShopView.ts", ['cc', './Config.ts', './Assets.ts', './Progress.ts', './CcbView.ts', './UiKit.ts'], function (exports) {
  var cclegacy, Color, instantiate, BlockInputEvents, Node, Sprite, tween, Vec3, Label, UITransform, _decorator, SHOP_BIKES, preloadFrames, getFrame, getSelectedBike, setSelectedBike, CcbView, findNode, sprite;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      instantiate = module.instantiate;
      BlockInputEvents = module.BlockInputEvents;
      Node = module.Node;
      Sprite = module.Sprite;
      tween = module.tween;
      Vec3 = module.Vec3;
      Label = module.Label;
      UITransform = module.UITransform;
      _decorator = module._decorator;
    }, function (module) {
      SHOP_BIKES = module.SHOP_BIKES;
    }, function (module) {
      preloadFrames = module.preloadFrames;
      getFrame = module.getFrame;
    }, function (module) {
      getSelectedBike = module.getSelectedBike;
      setSelectedBike = module.setSelectedBike;
    }, function (module) {
      CcbView = module.CcbView;
      findNode = module.findNode;
    }, function (module) {
      sprite = module.sprite;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "cf0f8E1xyJA2Yap8igo38Je", "BikeShopView", undefined);
      const {
        ccclass
      } = _decorator;

      /** ShopPopup -updateStatBar:Number:: ten Shop_StatsUnit.png after the label, 10 points apart. */
      const STAT_UNITS = 10;
      const STAT_STEP = 20;
      const STAT_EMPTY = new Color(104, 104, 104);

      /** Pixels per CocosBuilder point (the HD art), for the carousel's numbers which are in points. */
      const UNIT = 2;
      /**
       * ShopPopup -update: drags the carousel by bikeOffset points, 0.01 radian each: one bike every pi/2,
       * 320 points of overdrag (shown at a quarter) at the ends.
       */
      const BIKE_STEP = 50 * Math.PI;
      const OVERDRAG = 320;
      const FRAME = 1 / 60;
      /** BikeInfo -update:: a bike at angle a from the front sits -100 sin(a) points along, hidden from 2pi/3. */
      const RADIUS = 100;
      const HIDE_ANGLE = 2 * Math.PI / 3;
      /** ShopPopup -loadBikeStand: the opening slide onto the bike in use stops after 0.5 s. */
      const BEGIN_ANIM = 0.5;
      /** A drag longer than this (points) is not a tap on the bike. */
      const TAP_SLOP = 12;

      /**
       * The bike screen: ShopMenuMain.ccbi (the store's frame: background, back button) holding ShopMenu.ccbi (the
       * original's ShopPopup) where its subNode_ is. The bikes turn on a wheel around bikeNode_ (drag it, it
       * snaps to the nearest bike); the orange button or a tap on the front bike rides it. Name, special and stats
       * come from Shop.dat (SHOP_BIKES). The port has no coins, so every bike is unlocked: no price tag, sale
       * stamp or unlock conditions. The arrows are for devices without a touch screen in the original, which the
       * port does not tell apart, so they stay hidden as on phones.
       */
      let BikeShopView = exports('BikeShopView', (_dec = ccclass('BikeShopView'), _dec(_class = class BikeShopView extends CcbView {
        constructor(...args) {
          super(...args);
          this.shop = void 0;
          this.bikes = [];
          /** ShopPopup currentBikeIndex_: the bike in front, whose name and stats are shown. */
          this.current = -1;
          this.offset = 0;
          this.used = 0;
          this.speed = 0;
          this.dragging = false;
          this.dragged = 0;
          this.lastX = 0;
          this.startIndex = 0;
          this.beginAnim = 0;
          this.acc = 0;
          /** Scale each popped label returns to. */
          this.popScale = new Map();
        }
        async init(shopPrefab, cb) {
          var _this$shop$getCompone;
          // ShopLayer -loadSubmenu puts the submenu in subNode_, which has no size: ShopMenu lays itself out
          // in percent of the screen, so it goes next to subNode_ instead
          this.shop = instantiate(shopPrefab);
          this.node.insertChild(this.shop, this.find('subNode_').getSiblingIndex());
          // it covers the whole screen above ShopMenuMain's back button: its root must not swallow the taps
          // (ShopMenuMain's root still keeps them from the screens below)
          (_this$shop$getCompone = this.shop.getComponent(BlockInputEvents)) == null || _this$shop$getCompone.destroy();
          for (const name of ['priceTagSprite_', 'stamp_', 'menuVideo_', 'conditionsNode_']) {
            const n = findNode(this.shop, name);
            if (n) n.active = false;
          }
          await preloadFrames([{
            frame: 'Shop_StatsUnit.png',
            sheet: 'ShopSheet_hd'
          }, ...SHOP_BIKES.map(b => ({
            frame: '',
            textureFile: `Shop_${b.image}.png`
          }))]);
          if (!this.isValid) return;
          const stand = findNode(this.shop, 'bikeNode_');
          this.bikes = SHOP_BIKES.map(b => sprite(stand, getFrame(`Shop_${b.image}.png`), 0, 0, 1, b.prefab));
          this.onSelectors({
            clickBack: cb.back,
            'clickSelect:': () => this.select(),
            selectCurrentBike: () => this.dragged < TAP_SLOP ? this.select() : false
          });
          this.node.on(Node.EventType.TOUCH_START, this.touchStart, this, true);
          this.node.on(Node.EventType.TOUCH_MOVE, this.touchMove, this, true);
          this.node.on(Node.EventType.TOUCH_END, this.touchEnd, this, true);
          this.node.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this, true);

          // ShopPopup -setStartBikeIndex: one bike past the one in use, then the opening slide back onto it
          this.startIndex = Math.max(0, SHOP_BIKES.findIndex(b => b.prefab === getSelectedBike()));
          this.offset = this.used = (this.startIndex + 1) * BIKE_STEP;
          this.beginAnim = BEGIN_ANIM;
          this.showInfo(this.startIndex);
          this.layoutBikes();
        }

        /** Ends the opening slide (for screenshots): bike `i` (default: the one in use) in front, at rest. */
        settle(i = this.startIndex) {
          this.startIndex = Math.max(0, Math.min(SHOP_BIKES.length - 1, i));
          this.offset = this.used = this.startIndex * BIKE_STEP;
          this.speed = 0;
          this.beginAnim = 0;
          this.layoutBikes();
        }
        touchStart(e) {
          this.dragging = true;
          this.dragged = 0;
          this.speed = 0;
          this.lastX = e.getUILocation().x;
        }

        /** ShopPopup -ccTouchesMoved:: the finger drags the wheel, its last move is the fling speed. */
        touchMove(e) {
          const x = e.getUILocation().x;
          const d = (this.lastX - x) / UNIT;
          this.lastX = x;
          this.speed = d;
          this.offset += d;
          this.dragged += Math.abs(d);
        }
        touchEnd() {
          this.dragging = false;
        }
        update(dt) {
          if (!this.bikes.length) return;
          if (this.beginAnim > 0) this.beginAnim -= dt;
          // the original steps once per frame at 60 fps
          this.acc = Math.min(this.acc + dt, 0.25);
          for (; this.acc >= FRAME; this.acc -= FRAME) this.step();
          this.layoutBikes();
        }

        /** ShopPopup -update: (without -updateBikes, done once per rendered frame). */
        step() {
          const max = (SHOP_BIKES.length - 1) * BIKE_STEP;
          if (this.offset < -OVERDRAG || this.offset > max + OVERDRAG) {
            this.offset = Math.max(-OVERDRAG, Math.min(max + OVERDRAG, this.offset));
            this.speed = 0;
          }
          this.used = this.offset < 0 ? this.offset * 0.25 : this.offset > max ? max + (this.offset - max) * 0.25 : this.offset;
          if (this.dragging) return;
          this.offset += this.speed;
          const target = this.beginAnim > 0 ? this.startIndex : this.nearest();
          this.offset += (target * BIKE_STEP - this.offset) * 0.05;
          this.speed *= 0.9166667;
        }
        nearest() {
          return Math.max(0, Math.min(SHOP_BIKES.length - 1, Math.round(this.used / BIKE_STEP)));
        }

        /**
         * ShopPopup -updateBikes: and BikeInfo -update:: the front bike's info, and each bike at its angle a
         * from the front: -100 sin(a) points along, brightness cos(a), scale and opacity cos(2a/3).
         */
        layoutBikes() {
          if (!this.bikes.length) return; // still loading the pictures
          const front = this.nearest();
          if (front !== this.current) this.showInfo(front);
          const angle = this.used * 0.01;
          this.bikes.forEach((n, i) => {
            const a = angle - i * Math.PI / 2;
            const visible = Math.abs(a) < HIDE_ANGLE;
            n.active = visible;
            if (!visible) return;
            const light = Math.max(0, Math.cos(a)) * 255,
              scale = Math.max(0, Math.cos(a * 2 / 3));
            n.setPosition(-RADIUS * UNIT * Math.sin(a), 0);
            n.setScale(scale, scale, 1);
            n.getComponent(Sprite).color = new Color(light, light, light, scale * 255);
          });
          this.bikes[front].setSiblingIndex(this.bikes.length - 1);
        }

        /** ShopPopup -clickSelect: (and -selectCurrentBike): ride the front bike from now on. */
        select() {
          const b = SHOP_BIKES[this.current];
          if (!b || b.prefab === getSelectedBike()) return false;
          setSelectedBike(b.prefab);
          this.updateButton();
          // -selectCurrentBike: CCScaleTo 0.1 s to 1.2, then CCEaseElasticOut (period 0.6) back to 1 in 0.3 s
          const btn = findNode(this.shop, 'selectButton_');
          if (btn) {
            tween(btn).stop();
            tween(btn).to(0.1, {
              scale: new Vec3(1.2, 1.2, 1)
            }).to(0.3, {
              scale: Vec3.ONE
            }, {
              easing: 'elasticOut'
            }).start();
          }
        }

        /** ShopPopup -updateBikeInfo:: name, special, stats and the button of the bike now in front. */
        showInfo(i) {
          this.current = i;
          const b = SHOP_BIKES[i];
          this.text('productTitle_', b.name);
          this.text('bikeFeature_', b.feature);
          this.stat('topSpeedTTF_', b.stats.topspeed);
          this.stat('accelTTF_', b.stats.accel);
          this.stat('handlingTTF_', b.stats.handling);
          this.stat('nitroTTF_', b.stats.nitro);
          this.pop(findNode(this.shop, 'productTitle_'));
          this.updateButton();
        }
        updateButton() {
          const selected = SHOP_BIKES[this.current].prefab === getSelectedBike();
          this.text('selectButtonBMFont_', selected ? 'SELECTED' : 'SELECT');
          this.pop(findNode(this.shop, 'selectButtonBMFont_'));
        }
        text(name, s) {
          var _findNode;
          const l = (_findNode = findNode(this.shop, name)) == null ? void 0 : _findNode.getComponent(Label);
          if (l) l.string = s;
        }

        /** ShopPopup -animateLayer:: a short pop when the text changes. */
        pop(n) {
          if (!n) return;
          if (!this.popScale.has(n)) this.popScale.set(n, n.scale.clone());
          const s = this.popScale.get(n);
          tween(n).stop();
          n.setScale(s.x * 0.8, s.y * 0.8, 1);
          tween(n).to(0.15, {
            scale: s
          }, {
            easing: 'backOut'
          }).start();
        }

        /**
         * ShopPopup -updateStatBar:Number:: the label's children are ten units starting 10 points after its
         * text at 0.4 of its height, the first `n` lit from orange to yellow (205 + 5i, 128 + 5i, 64), the
         * rest grey.
         */
        stat(name, n) {
          var _findNode2;
          const l = (_findNode2 = findNode(this.shop, name)) == null ? void 0 : _findNode2.getComponent(Label);
          if (!l) return;
          l.updateRenderData(true);
          const tf = l.getComponent(UITransform);
          l.node.removeAllChildren();
          const frame = getFrame('Shop_StatsUnit.png', 'ShopSheet_hd');
          const x0 = (1 - tf.anchorX) * tf.width + STAT_STEP,
            y = (0.4 - tf.anchorY) * tf.height;
          for (let i = 0; i < STAT_UNITS; i++) {
            const unit = sprite(l.node, frame, x0 + i * STAT_STEP, y, 1, 'unit' + i);
            unit.getComponent(Sprite).color = i < n ? new Color(205 + 5 * i, 128 + 5 * i, 64) : STAT_EMPTY;
          }
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Boot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CcbAnimator.ts', './Nav.ts', './otaConfig.ts', './otaFlow.ts', './jsbOtaPort.ts', './UiKit.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Prefab, Node, _decorator, Component, profiler, instantiate, sys, Color, Graphics, CcbAnimator, installDebug, ensureAssets, preloadScene, Nav, BOOT_TRIES_KEY, otaEnabled, runOta, JsbOtaPort, OtaConsoleLogger, uiNode, label;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Prefab = module.Prefab;
      Node = module.Node;
      _decorator = module._decorator;
      Component = module.Component;
      profiler = module.profiler;
      instantiate = module.instantiate;
      sys = module.sys;
      Color = module.Color;
      Graphics = module.Graphics;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      installDebug = module.installDebug;
      ensureAssets = module.ensureAssets;
      preloadScene = module.preloadScene;
      Nav = module.Nav;
    }, function (module) {
      BOOT_TRIES_KEY = module.BOOT_TRIES_KEY;
      otaEnabled = module.otaEnabled;
    }, function (module) {
      runOta = module.runOta;
    }, function (module) {
      JsbOtaPort = module.JsbOtaPort;
      OtaConsoleLogger = module.OtaConsoleLogger;
    }, function (module) {
      uiNode = module.uiNode;
      label = module.label;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
      cclegacy._RF.push({}, "9894bHBYZZKHp6GNI0c7CrU", "Boot", undefined);
      const {
        ccclass,
        property
      } = _decorator;

      /** How long the "new version in the store" note stays before the game starts anyway. */
      const NEED_STORE_HOLD_MS = 2000;
      const BAR_W = 420;
      const BAR_H = 10;

      /**
       * Entry point of the game (boot.scene, the build's start scene): shows the original's loading screen
       * while the shared assets and the first scene load, then opens the main menu, or a level straight away with `?level=1_1` in the URL.
       * On Android builds it first runs the hot update gate (core/ota, tools/hot-update/README.md): a newer
       * version on the OTA repo is downloaded under the loading screen and the game restarts into it.
       */
      let Boot = exports('Boot', (_dec = ccclass('Boot'), _dec2 = property(Prefab), _dec3 = property(Node), _dec(_class = (_class2 = class Boot extends Component {
        constructor(...args) {
          super(...args);
          /** Loading.ccbi */
          _initializerDefineProperty(this, "loading", _descriptor, this);
          /** Where the loading screen goes (the Canvas). */
          _initializerDefineProperty(this, "layer", _descriptor2, this);
          this.status = null;
          this.bar = null;
        }
        async start() {
          profiler.hideStats();
          installDebug();
          if (this.loading && this.layer) {
            var _n$getComponent;
            const n = instantiate(this.loading);
            this.layer.addChild(n);
            (_n$getComponent = n.getComponent(CcbAnimator)) == null || _n$getComponent.play('loadin');
          }
          if (sys.isNative) await this.hotUpdate();
          if (!this.isValid) return;
          const q = sys.isBrowser ? new URLSearchParams(window.location.search).get('level') : null;
          // the loading screen stays up until the scene it opens is in memory, so that scene appears at once
          await Promise.all([ensureAssets(), preloadScene(q ? 'game' : 'menu')]);
          // another scene was opened meanwhile (tools driving __br): it decides where to go
          if (!this.isValid || Nav.debugDriven) return;
          if (q) Nav.toGame(q);else Nav.toMenu('main');
        }

        /**
         * Resolves when the game should start with what it has; a finished download restarts the game instead
         * (game.restart), and the hook in main.js then runs the downloaded scripts.
         */
        hotUpdate() {
          // getting here means the running scripts load and this gate works: clear main.js' crash counter
          sys.localStorage.setItem(BOOT_TRIES_KEY, '0');
          if (!otaEnabled(sys.localStorage)) {
            console.log('[ota] tat (ban build --no-ota)');
            return Promise.resolve();
          }
          return new Promise(resolve => {
            const port = new JsbOtaPort(new OtaConsoleLogger(), {
              onStatus: s => this.show(s),
              onEnter: () => resolve()
            });
            void runOta(port).then(o => {
              // the APK is older than the update needs: say so, then play the installed version
              if (o === 'store') setTimeout(resolve, NEED_STORE_HOLD_MS);
            });
          });
        }
        show(s) {
          if (!this.isValid || !this.layer) return;
          if (!this.status) {
            const root = uiNode('OtaStatus', this.layer);
            root.setPosition(0, -220);
            this.status = label(root, '', 26, 0, 24, Color.WHITE, false);
            this.bar = uiNode('bar', root).addComponent(Graphics);
          }
          let pct = null;
          if (s.phase === 'checking') this.status.string = 'Đang kiểm tra bản cập nhật...';else if (s.phase === 'needStore') this.status.string = 'Đã có phiên bản mới trên cửa hàng';else if (s.percent === null) this.status.string = 'Đang chuẩn bị cập nhật...';else {
            pct = s.percent;
            this.status.string = `Đang tải bản cập nhật ${pct}%`;
          }
          const g = this.bar;
          g.clear();
          if (pct === null) return;
          g.fillColor = new Color(255, 255, 255, 60);
          g.roundRect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H, BAR_H / 2);
          g.fill();
          g.fillColor = new Color(255, 200, 40, 255);
          g.roundRect(-BAR_W / 2, -BAR_H / 2, Math.max(BAR_H, BAR_W * pct / 100), BAR_H, BAR_H / 2);
          g.fill();
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "loading", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "layer", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Box2D21.ts", ['cc', './planck.mjs'], function () {
  var cclegacy, Contact;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      Contact = module.Contact;
    }],
    execute: function () {
      cclegacy._RF.push({}, "699fcxYAQ5BWowZO2dX0Ajl", "Box2D21", undefined);

      /**
       * b2ContactSolver::SolvePositionConstraints of the game's Box2D 2.1.2 (libgame.so @0x44caf0):
       *
       * - It weighs both bodies by m_mass * m_invMass and m_mass * m_invI, i.e. every dynamic body counts
       *   as unit mass. Against a static body that changes nothing, but between two dynamic bodies planck
       *   (Box2D 2.3) pushes the light one almost all the way: a wheel on a heavy rock that is welded into
       *   the terrain (1-3 start) gets flung up by the rock's own correction against the terrain every step.
       * - It stops the island's position iterations once the deepest contact is within 1.5 linearSlop;
       *   planck already at 3 linearSlop, leaving wheels resting deeper in the ground. planck's island
       *   solver tests minSeparation >= -3 linearSlop, so report twice the separation: that means
       *   >= -1.5 linearSlop, and the minimum over the contacts is unchanged.
       */
      Contact.prototype.solvePositionConstraint = function (step) {
        const a = this.m_fixtureA.m_body,
          b = this.m_fixtureB.m_body;
        this.p_invMassA = a.m_mass * a.m_invMass;
        this.p_invIA = a.m_mass * a.m_invI;
        this.p_invMassB = b.m_mass * b.m_invMass;
        this.p_invIB = b.m_mass * b.m_invI;
        return 2 * this._solvePositionConstraint(step, null, null);
      };
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbAnimator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CcbGradient.ts', './CcbLayerColor.ts', './CcbNode.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, _decorator, Component, UIRenderer, Color, UIOpacity, CcbGradient, CcbLayerColor, CcbNode;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Component = module.Component;
      UIRenderer = module.UIRenderer;
      Color = module.Color;
      UIOpacity = module.UIOpacity;
    }, function (module) {
      CcbGradient = module.CcbGradient;
    }, function (module) {
      CcbLayerColor = module.CcbLayerColor;
    }, function (module) {
      CcbNode = module.CcbNode;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
      cclegacy._RF.push({}, "34ba2AVxc5GgYDC3sVGJ3Pz", "CcbAnimator", undefined);
      const {
        ccclass,
        property
      } = _decorator;

      /** One keyframe: time, easing (CCBKeyframe easing type), easing option, value. */

      // cocos2d easing (CCActionEase), t in [0, 1]
      function bounceOut(t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
      function ease(type, opt, t) {
        const TAU = Math.PI * 2;
        switch (type) {
          case 2:
            return Math.pow(t, opt);
          // cubic in (CCEaseIn, rate)
          case 3:
            return Math.pow(t, 1 / opt);
          // cubic out
          case 4:
            {
              t *= 2;
              return t < 1 ? 0.5 * Math.pow(t, opt) : 1 - 0.5 * Math.pow(2 - t, opt);
            }
          case 5:
            {
              // elastic in (period)
              if (t === 0 || t === 1) return t;
              const s = opt / 4;
              t -= 1;
              return -Math.pow(2, 10 * t) * Math.sin((t - s) * TAU / opt);
            }
          case 6:
            {
              if (t === 0 || t === 1) return t;
              const s = opt / 4;
              return Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / opt) + 1;
            }
          case 7:
            {
              if (t === 0 || t === 1) return t;
              const p = opt || 0.3 * 1.5,
                s = p / 4;
              t = t * 2 - 1;
              return t < 0 ? -0.5 * Math.pow(2, 10 * t) * Math.sin((t - s) * TAU / p) : Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) * 0.5 + 1;
            }
          case 8:
            return 1 - bounceOut(1 - t);
          case 9:
            return bounceOut(t);
          case 10:
            return t < 0.5 ? 0.5 * (1 - bounceOut(1 - t * 2)) : 0.5 * bounceOut(t * 2 - 1) + 0.5;
          case 11:
            {
              const o = 1.70158;
              return t * t * ((o + 1) * t - o);
            }
          case 12:
            {
              const o = 1.70158;
              t -= 1;
              return t * t * ((o + 1) * t + o) + 1;
            }
          case 13:
            {
              const o = 1.70158 * 1.525;
              t *= 2;
              if (t < 1) return t * t * ((o + 1) * t - o) / 2;
              t -= 2;
              return t * t * ((o + 1) * t + o) / 2 + 1;
            }
          default:
            return t;
          // linear
        }
      }

      function lerp(a, b, f) {
        if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * f);
        if (typeof a === 'number') return a + (b - a) * f;
        return f < 1 ? a : b;
      }

      /** Value of a property track at time t (CCBAnimationManager: first keyframe applied at once, then tweens). */
      function sample(keys, prop, t) {
        if (t <= keys[0].t) return keys[0].v;
        for (let i = 0; i < keys.length - 1; i++) {
          const k0 = keys[i],
            k1 = keys[i + 1];
          if (t >= k1.t) continue;
          // visible: shown/hidden when the next keyframe is reached; instant easing: jumps at once
          if (prop === 'visible') return k0.v;
          if (k0.e === 0) return k1.v;
          const f = k1.t > k0.t ? (t - k0.t) / (k1.t - k0.t) : 1;
          return lerp(k0.v, k1.v, ease(k0.e, k0.o ?? 0, f));
        }
        return keys[keys.length - 1].v;
      }

      /**
       * Plays a CocosBuilder file's timelines (sequences) on the nodes the converter built from it, the way the
       * original's CCBAnimationManager did: the sequence named in the file plays on load (autoPlay), a finished
       * sequence starts its chained one, and properties the sequence does not animate go back to their file value.
       */
      let CcbAnimator = exports('CcbAnimator', (_dec = ccclass('CcbAnimator'), _dec2 = property({
        multiline: true
      }), _dec3 = property({
        tooltip: 'Play the file\'s autoPlay sequence when the node loads'
      }), _dec(_class = (_class2 = class CcbAnimator extends Component {
        constructor(...args) {
          super(...args);
          /** The timelines as JSON (written by tools/ccb2prefab.py). */
          _initializerDefineProperty(this, "timeline", _descriptor, this);
          _initializerDefineProperty(this, "autoPlay", _descriptor2, this);
          this.data = null;
          this.nodes = new Map();
          this.signs = new Map();
          this.current = null;
          this.tracks = [];
          this.time = 0;
          this.onDone = null;
        }
        get sequenceNames() {
          return this.timeline ? this.load().sequences.map(s => s.name) : [];
        }

        /** Name of the running sequence, null when idle. */
        get running() {
          var _this$current;
          return ((_this$current = this.current) == null ? void 0 : _this$current.name) ?? null;
        }
        onLoad() {
          this.load();
        }
        start() {
          if (this.autoPlay && this.data && this.data.autoPlay >= 0 && !this.current) this.playId(this.data.autoPlay);
        }

        /** Starts the sequence named `name`; `onDone` runs when it (not a chained one) finishes. */
        play(name, onDone) {
          const s = this.load().sequences.find(q => q.name === name);
          if (!s) {
            console.warn('[ccb] no sequence', name, 'on', this.node.name);
            return false;
          }
          this.playId(s.id);
          this.onDone = onDone ?? null;
          return true;
        }
        stop() {
          this.current = null;
        }
        load() {
          if (!this.data) this.data = this.timeline ? JSON.parse(this.timeline) : {
            sequences: [],
            autoPlay: -1,
            tracks: [],
            base: []
          };
          return this.data;
        }
        find(path) {
          if (this.nodes.has(path)) return this.nodes.get(path);
          let n = this.node;
          for (const name of path ? path.split('/') : []) {
            var _n;
            n = (_n = n) == null ? void 0 : _n.getChildByName(name);
          }
          if (!n) console.warn('[ccb] missing node', path, 'under', this.node.name);
          if (n) this.nodes.set(path, n); // not found: look again next time
          return n ?? null;
        }
        playId(id) {
          const d = this.load();
          const s = d.sequences.find(q => q.id === id);
          if (!s) return;
          this.current = s;
          this.time = 0;
          this.tracks = d.tracks.filter(t => t.seq === id);
          const animated = new Set(this.tracks.map(t => t.node + '|' + t.prop));
          for (const b of d.base) {
            if (!animated.has(b.node + '|' + b.prop)) this.set(b.node, b.prop, b.v);
          }
          this.applyAt(0);
        }
        update(dt) {
          if (!this.current) return;
          this.time += dt;
          const s = this.current;
          if (this.time < s.duration) {
            this.applyAt(this.time);
            return;
          }
          this.applyAt(s.duration);
          this.current = null;
          if (s.chained >= 0) this.playId(s.chained);else {
            const cb = this.onDone;
            this.onDone = null;
            cb == null || cb(s.name);
          }
        }
        applyAt(t) {
          for (const tr of this.tracks) this.set(tr.node, tr.prop, sample(tr.keys, tr.prop, t));
        }
        set(path, prop, v) {
          const n = this.find(path);
          if (!n) return;
          switch (prop) {
            case 'position':
              {
                const c = n.getComponent(CcbNode);
                if (c) c.setPosition(v[0], v[1]);
                break;
              }
            case 'scale':
              {
                // flips are negative scales set by the converter: keep their sign
                let sg = this.signs.get(n);
                if (!sg) this.signs.set(n, sg = [Math.sign(n.scale.x) || 1, Math.sign(n.scale.y) || 1]);
                n.setScale(v[0] * sg[0], v[1] * sg[1], 1);
                break;
              }
            case 'rotation':
              n.angle = -v;
              break;
            case 'visible':
              n.active = !!v;
              break;
            case 'opacity':
              this.setOpacity(n, Math.round(v));
              break;
            case 'color':
              {
                const r = n.getComponent(UIRenderer);
                if (r) r.color = new Color(v[0], v[1], v[2], r.color.a);
                const lc = n.getComponent(CcbLayerColor);
                if (lc) {
                  lc.color = new Color(v[0], v[1], v[2], lc.color.a);
                  lc.draw();
                }
                break;
              }
            // displayFrame and others: not used by the converted screens
          }
        }

        setOpacity(n, a) {
          const lc = n.getComponent(CcbLayerColor);
          if (lc) return lc.setOpacity(a);
          const gr = n.getComponent(CcbGradient);
          if (gr) return gr.setOpacity(a);
          const r = n.getComponent(UIRenderer);
          if (r) {
            const c = r.color;
            if (c.a !== a) r.color = new Color(c.r, c.g, c.b, a);
            return;
          }
          // nodes without a renderer (CCMenu, CCNode): cocos2d's CCMenu passed its opacity on to its items
          (n.getComponent(UIOpacity) || n.addComponent(UIOpacity)).opacity = a;
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "timeline", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "autoPlay", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      })), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbButton.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Event, Button, _decorator, Component;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Event = module.Event;
      Button = module.Button;
      _decorator = module._decorator;
      Component = module.Component;
    }],
    execute: function () {
      var _dec, _dec2, _class, _class2, _descriptor;
      cclegacy._RF.push({}, "11da2ZSaUJCkIuoy4KO9AYX", "CcbButton", undefined);
      const {
        ccclass,
        property,
        requireComponent
      } = _decorator;

      /** Event type dispatched (bubbling) when a CocosBuilder menu item is tapped. */
      const CCB_CLICK = exports('CCB_CLICK', 'ccb-click');
      class CcbClickEvent extends Event {
        constructor(selector, button) {
          super(CCB_CLICK, true);
          this.selector = selector;
          this.button = button;
        }
      }
      exports('CcbClickEvent', CcbClickEvent);

      /**
       * A CocosBuilder menu item (CCMenuItem and the game's MenuItem / BasicButton). Tapping it dispatches a
       * bubbling CCB_CLICK event carrying the selector the .ccbi named (e.g. "btnResume"), so the screen's view
       * script handles every button in one listener on its root.
       */
      let CcbButton = exports('CcbButton', (_dec = ccclass('CcbButton'), _dec2 = requireComponent(Button), _dec(_class = _dec2(_class = (_class2 = class CcbButton extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "selector", _descriptor, this);
        }
        onLoad() {
          this.node.on(Button.EventType.CLICK, this.onClick, this);
        }
        onDestroy() {
          this.node.off(Button.EventType.CLICK, this.onClick, this);
        }
        onClick() {
          if (!this.selector) return;
          this.node.dispatchEvent(new CcbClickEvent(this.selector, this));
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "selector", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbGradient.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Graphics, Color, Vec2, _decorator, Component, Node, UITransform;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Graphics = module.Graphics;
      Color = module.Color;
      Vec2 = module.Vec2;
      _decorator = module._decorator;
      Component = module.Component;
      Node = module.Node;
      UITransform = module.UITransform;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
      cclegacy._RF.push({}, "75238mssVhECqIRYTztbM5q", "CcbGradient", undefined);
      const {
        ccclass,
        property,
        executeInEditMode,
        requireComponent
      } = _decorator;
      const BANDS = 48;

      /**
       * CCLayerGradient: start colour at the end the vector points away from, end colour where it points to
       * (cocos2d's default vector (0, -1) runs from the top down). Drawn as thin bands along the vector's main axis.
       */
      let CcbGradient = exports('CcbGradient', (_dec = ccclass('CcbGradient'), _dec2 = requireComponent(Graphics), _dec3 = property(Color), _dec4 = property(Color), _dec5 = property(Vec2), _dec(_class = executeInEditMode(_class = _dec2(_class = (_class2 = class CcbGradient extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "startColor", _descriptor, this);
          _initializerDefineProperty(this, "endColor", _descriptor2, this);
          _initializerDefineProperty(this, "vector", _descriptor3, this);
          /** Layer opacity (0-255), multiplies both colours' alpha. */
          _initializerDefineProperty(this, "opacity", _descriptor4, this);
        }
        onEnable() {
          this.node.on(Node.EventType.SIZE_CHANGED, this.draw, this);
          this.node.on(Node.EventType.ANCHOR_CHANGED, this.draw, this);
          this.draw();
        }
        onDisable() {
          this.node.off(Node.EventType.SIZE_CHANGED, this.draw, this);
          this.node.off(Node.EventType.ANCHOR_CHANGED, this.draw, this);
        }
        onValidate() {
          this.draw();
        }
        setOpacity(a) {
          this.opacity = a;
          this.draw();
        }
        draw() {
          const g = this.getComponent(Graphics);
          const tf = this.getComponent(UITransform);
          g.clear();
          if (!tf) return;
          const w = tf.width,
            h = tf.height,
            x0 = -tf.anchorX * w,
            y0 = -tf.anchorY * h;
          const vertical = Math.abs(this.vector.y) >= Math.abs(this.vector.x);
          // runs from the start colour at s = 0 to the end colour at s = 1
          const flip = vertical ? this.vector.y < 0 : this.vector.x < 0;
          const c = new Color();
          for (let i = 0; i < BANDS; i++) {
            const s = (i + 0.5) / BANDS;
            Color.lerp(c, this.startColor, this.endColor, s);
            c.a = Math.round(c.a * this.opacity / 255);
            if (c.a === 0) continue;
            g.fillColor = c;
            // band i covers s in [i/B, (i+1)/B]; s = 0 is the top (vertical, flip) or bottom
            const a = i / BANDS,
              b = (i + 1) / BANDS;
            // bands meet exactly: overlapping ones would double their alpha into stripes
            if (vertical) {
              const ya = flip ? y0 + h * (1 - b) : y0 + h * a;
              g.rect(x0, ya, w, h / BANDS);
            } else {
              const xa = flip ? x0 + w * (1 - b) : x0 + w * a;
              g.rect(xa, y0, w / BANDS, h);
            }
            g.fill();
          }
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "startColor", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 255);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "endColor", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 0);
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "vector", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(0, -1);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "opacity", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 255;
        }
      })), _class2)) || _class) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbLayerColor.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Graphics, Color, _decorator, Component, Node, UITransform;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Graphics = module.Graphics;
      Color = module.Color;
      _decorator = module._decorator;
      Component = module.Component;
      Node = module.Node;
      UITransform = module.UITransform;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
      cclegacy._RF.push({}, "c1254FzOkVHSZRpJ6imoLlU", "CcbLayerColor", undefined);
      const {
        ccclass,
        property,
        executeInEditMode,
        requireComponent
      } = _decorator;

      /** CCLayerColor: a filled rectangle over the node's content size. */
      let CcbLayerColor = exports('CcbLayerColor', (_dec = ccclass('CcbLayerColor'), _dec2 = requireComponent(Graphics), _dec3 = property(Color), _dec(_class = executeInEditMode(_class = _dec2(_class = (_class2 = class CcbLayerColor extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "color", _descriptor, this);
          /** Corner radius in pixels (not in CocosBuilder: the port's own panels). */
          _initializerDefineProperty(this, "radius", _descriptor2, this);
        }
        onEnable() {
          this.node.on(Node.EventType.SIZE_CHANGED, this.draw, this);
          this.node.on(Node.EventType.ANCHOR_CHANGED, this.draw, this);
          this.draw();
        }
        onDisable() {
          this.node.off(Node.EventType.SIZE_CHANGED, this.draw, this);
          this.node.off(Node.EventType.ANCHOR_CHANGED, this.draw, this);
        }
        onValidate() {
          this.draw();
        }
        setOpacity(a) {
          this.color.a = a;
          this.draw();
        }
        draw() {
          const g = this.getComponent(Graphics);
          const tf = this.getComponent(UITransform);
          g.clear();
          if (!tf || this.color.a === 0) return;
          g.fillColor = this.color;
          const x = -tf.anchorX * tf.width,
            y = -tf.anchorY * tf.height;
          if (this.radius > 0) g.roundRect(x, y, tf.width, tf.height, this.radius);else g.rect(x, y, tf.width, tf.height);
          g.fill();
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "color", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 255);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "radius", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      })), _class2)) || _class) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbNode.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Enum, _decorator, Component, Node, UITransform, view;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Enum = module.Enum;
      _decorator = module._decorator;
      Component = module.Component;
      Node = module.Node;
      UITransform = module.UITransform;
      view = module.view;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
      cclegacy._RF.push({}, "15c10l5/TVFi43SDWp5Bj3e", "CcbNode", undefined);
      const {
        ccclass,
        property,
        executeInEditMode,
        disallowMultiple
      } = _decorator;

      /** CocosBuilder position types (CCBReader kCCBPositionType*). */
      let CcbPosType = exports('CcbPosType', /*#__PURE__*/function (CcbPosType) {
        CcbPosType[CcbPosType["RelativeBottomLeft"] = 0] = "RelativeBottomLeft";
        CcbPosType[CcbPosType["RelativeTopLeft"] = 1] = "RelativeTopLeft";
        CcbPosType[CcbPosType["RelativeTopRight"] = 2] = "RelativeTopRight";
        CcbPosType[CcbPosType["RelativeBottomRight"] = 3] = "RelativeBottomRight";
        CcbPosType[CcbPosType["Percent"] = 4] = "Percent";
        CcbPosType[CcbPosType["MultiplyResolution"] = 5] = "MultiplyResolution";
        return CcbPosType;
      }({}));
      Enum(CcbPosType);

      /**
       * CocosBuilder size types (kCCBSizeType*); None = the node keeps the size its renderer gives it (not -1:
       * cc.Enum treats -1 as "next value").
       */
      let CcbSizeType = exports('CcbSizeType', /*#__PURE__*/function (CcbSizeType) {
        CcbSizeType[CcbSizeType["Absolute"] = 0] = "Absolute";
        CcbSizeType[CcbSizeType["Percent"] = 1] = "Percent";
        CcbSizeType[CcbSizeType["RelativeContainer"] = 2] = "RelativeContainer";
        CcbSizeType[CcbSizeType["HorizontalPercent"] = 3] = "HorizontalPercent";
        CcbSizeType[CcbSizeType["VerticalPercent"] = 4] = "VerticalPercent";
        CcbSizeType[CcbSizeType["MultiplyResolution"] = 5] = "MultiplyResolution";
        CcbSizeType[CcbSizeType["None"] = 6] = "None";
        return CcbSizeType;
      }({}));
      Enum(CcbSizeType);

      /**
       * A node laid out the way CocosBuilder placed it in the original game's .ccbi files: position and size in
       * CocosBuilder's own units and types (points from a corner, percent of the parent, ...), recomputed whenever
       * the parent changes size. One point is `unit` pixels: 2 for the menus (the original ran its HD art at a content
       * scale of 2), 1 for the world map panels, laid out in the pixels of their 1136 x 768 backgrounds.
       *
       * cocos2d measures a child's position from its parent's bottom-left corner, Cocos Creator from the parent's
       * anchor; nodes that ignore their anchor for positioning (CCLayer, CCMenu) place their bottom-left corner.
       */
      let CcbNode = exports('CcbNode', (_dec = ccclass('CcbNode'), _dec2 = property({
        type: CcbPosType
      }), _dec3 = property({
        type: CcbSizeType
      }), _dec4 = property({
        tooltip: 'ignoreAnchorPointForPosition: the position is the bottom-left corner'
      }), _dec5 = property({
        tooltip: 'Pixels per CocosBuilder point'
      }), _dec(_class = executeInEditMode(_class = disallowMultiple(_class = (_class2 = class CcbNode extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "posType", _descriptor, this);
          _initializerDefineProperty(this, "posX", _descriptor2, this);
          _initializerDefineProperty(this, "posY", _descriptor3, this);
          _initializerDefineProperty(this, "sizeType", _descriptor4, this);
          _initializerDefineProperty(this, "sizeW", _descriptor5, this);
          _initializerDefineProperty(this, "sizeH", _descriptor6, this);
          _initializerDefineProperty(this, "ignoreAnchor", _descriptor7, this);
          _initializerDefineProperty(this, "unit", _descriptor8, this);
          this.watched = null;
        }
        onEnable() {
          this.watch(this.node.parent);
          this.node.on(Node.EventType.PARENT_CHANGED, this.onParentChanged, this);
          this.node.on(Node.EventType.SIZE_CHANGED, this.apply, this);
          this.node.on(Node.EventType.ANCHOR_CHANGED, this.apply, this);
          this.apply();
        }
        onDisable() {
          this.watch(null);
          this.node.off(Node.EventType.PARENT_CHANGED, this.onParentChanged, this);
          this.node.off(Node.EventType.SIZE_CHANGED, this.apply, this);
          this.node.off(Node.EventType.ANCHOR_CHANGED, this.apply, this);
        }

        /** Called by the inspector after a property edit. */
        onValidate() {
          this.apply();
        }
        setPosition(x, y) {
          this.posX = x;
          this.posY = y;
          this.apply();
        }
        onParentChanged() {
          this.watch(this.node.parent);
          this.apply();
        }
        watch(parent) {
          var _this$watched, _this$watched2;
          if (this.watched === parent) return;
          (_this$watched = this.watched) == null || _this$watched.off(Node.EventType.SIZE_CHANGED, this.apply, this);
          (_this$watched2 = this.watched) == null || _this$watched2.off(Node.EventType.ANCHOR_CHANGED, this.apply, this);
          this.watched = parent;
          parent == null || parent.on(Node.EventType.SIZE_CHANGED, this.apply, this);
          parent == null || parent.on(Node.EventType.ANCHOR_CHANGED, this.apply, this);
        }
        apply() {
          var _this$node$parent;
          const U = this.unit;
          const ptf = (_this$node$parent = this.node.parent) == null ? void 0 : _this$node$parent.getComponent(UITransform);
          const vs = ptf ? null : view.getVisibleSize();
          const pw = ptf ? ptf.width : vs.width;
          const ph = ptf ? ptf.height : vs.height;
          const tf = this.node.getComponent(UITransform);
          if (tf && this.sizeType !== CcbSizeType.None) {
            let w = this.sizeW * U,
              h = this.sizeH * U;
            switch (this.sizeType) {
              case CcbSizeType.Percent:
                w = this.sizeW / 100 * pw;
                h = this.sizeH / 100 * ph;
                break;
              case CcbSizeType.RelativeContainer:
                w = pw - this.sizeW * U;
                h = ph - this.sizeH * U;
                break;
              case CcbSizeType.HorizontalPercent:
                w = this.sizeW / 100 * pw;
                break;
              case CcbSizeType.VerticalPercent:
                h = this.sizeH / 100 * ph;
                break;
            }
            if (tf.width !== w || tf.height !== h) tf.setContentSize(w, h); // re-enters apply() via SIZE_CHANGED
          }

          let x = this.posX * U,
            y = this.posY * U;
          switch (this.posType) {
            case CcbPosType.RelativeTopLeft:
              y = ph - y;
              break;
            case CcbPosType.RelativeTopRight:
              x = pw - x;
              y = ph - y;
              break;
            case CcbPosType.RelativeBottomRight:
              x = pw - x;
              break;
            case CcbPosType.Percent:
              x = this.posX / 100 * pw;
              y = this.posY / 100 * ph;
              break;
          }
          if (this.ignoreAnchor && tf) {
            x += tf.anchorX * tf.width;
            y += tf.anchorY * tf.height;
          }
          if (ptf) {
            x -= ptf.anchorX * pw;
            y -= ptf.anchorY * ph;
          }
          const p = this.node.position;
          if (p.x !== x || p.y !== y) this.node.setPosition(x, y, p.z);
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "posType", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CcbPosType.RelativeBottomLeft;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "posX", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "posY", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "sizeType", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CcbSizeType.None;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "sizeW", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "sizeH", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "ignoreAnchor", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "unit", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      })), _class2)) || _class) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CcbView.ts", ['cc', './CcbAnimator.ts', './CcbButton.ts', './Sound.ts'], function (exports) {
  var cclegacy, Component, Label, Sprite, CcbAnimator, CCB_CLICK, Sound;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Component = module.Component;
      Label = module.Label;
      Sprite = module.Sprite;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      CCB_CLICK = module.CCB_CLICK;
    }, function (module) {
      Sound = module.Sound;
    }],
    execute: function () {
      exports('findNode', findNode);
      cclegacy._RF.push({}, "805cbhesJ1AbY+U9GVU83SV", "CcbView", undefined);

      /** Depth-first search for a node named `name` (the .ccbi member variable names) below `root`. */
      function findNode(root, name) {
        for (const c of root.children) {
          if (c.name === name) return c;
          const f = findNode(c, name);
          if (f) return f;
        }
        return null;
      }

      /**
       * Base of the scripts that drive a screen converted from a .ccbi (tools/ccb2prefab.py): finds its nodes by
       * member variable name and maps its buttons' selectors to handlers.
       */
      class CcbView extends Component {
        constructor(...args) {
          super(...args);
          this.handlers = {};
        }
        find(name) {
          const n = findNode(this.node, name);
          if (!n) console.warn('[ccb]', this.node.name, 'has no node', name);
          return n;
        }
        label(name) {
          var _this$find;
          return ((_this$find = this.find(name)) == null ? void 0 : _this$find.getComponent(Label)) ?? null;
        }
        setFrame(node, frame) {
          const sp = node == null ? void 0 : node.getComponent(Sprite);
          if (sp && frame) sp.spriteFrame = frame;
        }
        get animator() {
          return this.getComponent(CcbAnimator);
        }

        /**
         * Buttons whose selector has no handler do nothing (features the port does not have); a handler returning
         * false ignored the tap (no click sound).
         */
        onSelectors(handlers) {
          this.handlers = handlers;
          this.node.on(CCB_CLICK, this.onClick, this);
        }
        onClick(e) {
          const h = this.handlers[e.selector];
          if (!h) return;
          e.propagationStopped = true;
          if (h() !== false) Sound.play('sfx_button');
        }
      }
      exports('CcbView', CcbView);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Config.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1267eKniLZFR75CGoaqiA2B", "Config", undefined);
      // Global tuning constants. World units are the level editor's units (Box2D metres).

      /**
       * Sprite texture pixels per world unit. The original multiplies world positions by 10 (points)
       * and scales the game layer by winSize / (2 * winSize) = 0.5 on 2x screens, so one unit is
       * 10 * zoom device pixels and a sprite pixel is 1 device pixel at zoom 1.
       */
      const PX_PER_UNIT = exports('PX_PER_UNIT', 10);

      /** Screen pixels per world unit at zoom 1 (design resolution 1136x640 = iPhone 5 pixels). */
      const VIEW_SCALE = exports('VIEW_SCALE', 1);

      /** Physics settings from GameConfig_T*.plist ("ts", "viter", "piter", "gy"). */
      const TIME_STEP = exports('TIME_STEP', 1 / 60);
      const VELOCITY_ITERATIONS = exports('VELOCITY_ITERATIONS', 21);
      const POSITION_ITERATIONS = exports('POSITION_ITERATIONS', 12);
      const DEFAULT_GRAVITY = exports('DEFAULT_GRAVITY', -70);

      /** Level "definition" of the bike entity -> bike prefab / sprite sheet. */
      /**
       * Engine sound per bike: FMOD bank and the RPM parameter range the bike maps its rpm onto
       * (BikeCommon1 rpmMinParam/rpmMaxParam: 14..106 by default, overridden by MotoPizza, NeonBike,
       * SuperDuke). The bank is the one whose RPM parameter spans that range.
       */
      const BIKE_ENGINES = exports('BIKE_ENGINES', {
        Moto: {
          bank: 'Engine3',
          min: 14,
          max: 106
        },
        XtremeBike: {
          bank: 'Engine3',
          min: 14,
          max: 106
        },
        SuperDuke: {
          bank: 'Engine_ktm',
          min: 80,
          max: 200
        },
        MotoPizza: {
          bank: 'Engine1',
          min: 85,
          max: 173
        },
        NeonBike: {
          bank: 'Engine1',
          min: 85,
          max: 173
        }
      });
      const DEFAULT_ENGINE = exports('DEFAULT_ENGINE', BIKE_ENGINES.Moto);
      const BIKE_PREFABS = exports('BIKE_PREFABS', {
        Moto: 'MainBikePref',
        XtremeBike: 'XtremeBikePref',
        SuperDuke: 'SuperDukePref',
        MotoPizza: 'PizzaBikePref',
        NeonBike: 'NeonBikePref',
        ApocalypticBike: 'ApocalypticBikePref',
        MercenaryBike: 'MercenaryBikePref',
        DynamiteBike: 'DynamiteBikePref',
        HarleyMoto: 'HarleyBikePref',
        ChristmasBike: 'ChristmasBikePref'
      });
      const BIKE_SHEETS = exports('BIKE_SHEETS', {
        MainBikePref: 'MainBike',
        MX1Pref: 'MX1',
        MX2Pref: 'MX2',
        MX3Pref: 'MX3',
        MX4Pref: 'MX4',
        MX5Pref: 'MX5',
        XtremeBikePref: 'XtremeBike',
        SuperDukePref: 'SuperDuke',
        PizzaBikePref: 'PizzaBike',
        NeonBikePref: 'NeonBike',
        ApocalypticBikePref: 'ApocalypticBike',
        MercenaryBikePref: 'MercenaryBike',
        DynamiteBikePref: 'DynamiteBike',
        HarleyBikePref: 'HarleyBike',
        ChristmasBikePref: 'ChristmasBike'
      });

      /**
       * Sheets redrawn at a higher resolution (tools/upscale_sheet.py): pixels per pixel of the original sheet. Their
       * sprites are drawn that much smaller, so they keep their size and get the extra detail.
       */
      const SHEET_RESOLUTION = exports('SHEET_RESOLUTION', Object.fromEntries(['MainBike', 'MX1', 'MX2', 'MX3', 'MX4', 'MX5', 'XtremeBike', 'SuperDuke', 'PizzaBike', 'NeonBike', 'MercenaryBike', 'ChristmasBike', 'ApocalypticBike', 'DynamiteBike', 'HarleyBike'].map(sheet => [sheet, 2])));

      /** A bike of the bike screen: Shop.dat entry (name, Shop_<image> picture, special, stats out of 10). */

      /**
       * The bikes of Shop.dat (racing bikes, then special bikes). The MX bikes are Moto with other parts. The
       * Apocalyptic, Mercenary, Dynamite, Chopper and Christmas bikes ride on their own prefab (speed, forces, frame,
       * joints) but without their bike class' own code: Bike.ts gives them the Moto's force split and rider pose,
       * and their specials (Dynamite surviving its first impact, the Christmas bike's speed on Christmas levels)
       * are not there yet.
       */
      const SHOP_BIKES = exports('SHOP_BIKES', [{
        name: 'Classic',
        image: 'MainBike',
        prefab: 'MainBikePref',
        feature: '',
        stats: {
          topspeed: 2,
          accel: 1,
          handling: 4,
          nitro: 1
        }
      }, {
        name: 'Pizza Gut',
        image: 'PizzaBike',
        prefab: 'PizzaBikePref',
        feature: 'Special: Deliver some pizzas!',
        stats: {
          topspeed: 1,
          accel: 1,
          handling: 2,
          nitro: 5
        }
      }, {
        name: 'Pinky',
        image: 'MX1',
        prefab: 'MX1Pref',
        feature: '',
        stats: {
          topspeed: 3,
          accel: 2,
          handling: 4,
          nitro: 1
        }
      }, {
        name: 'Blink',
        image: 'MX2',
        prefab: 'MX2Pref',
        feature: '',
        stats: {
          topspeed: 3,
          accel: 2,
          handling: 5,
          nitro: 2
        }
      }, {
        name: 'Breezer',
        image: 'MX3',
        prefab: 'MX3Pref',
        feature: '',
        stats: {
          topspeed: 3,
          accel: 4,
          handling: 4,
          nitro: 3
        }
      }, {
        name: 'Ninja',
        image: 'MX4',
        prefab: 'MX4Pref',
        feature: '',
        stats: {
          topspeed: 2,
          accel: 4,
          handling: 4,
          nitro: 5
        }
      }, {
        name: 'Bolt',
        image: 'MX5',
        prefab: 'MX5Pref',
        feature: '',
        stats: {
          topspeed: 5,
          accel: 3,
          handling: 4,
          nitro: 5
        }
      }, {
        name: 'Extreme Bike',
        image: 'ExtremeBike',
        prefab: 'XtremeBikePref',
        feature: '',
        stats: {
          topspeed: 7,
          accel: 6,
          handling: 9,
          nitro: 5
        }
      }, {
        name: 'Legacy Bike',
        image: 'NeonBike',
        prefab: 'NeonBikePref',
        feature: 'Special 1 : Great performance on Ice!\nSpecial 2 : Burnout charges nitro!',
        stats: {
          topspeed: 7,
          accel: 7,
          handling: 3,
          nitro: 6
        }
      }, {
        name: '1290 SuperDuke R',
        image: 'SuperDukeR',
        prefab: 'SuperDukePref',
        feature: "KTM's Official Bike!",
        stats: {
          topspeed: 9,
          accel: 7,
          handling: 5,
          nitro: 7
        }
      }, {
        name: 'Apocalyptic Bike',
        image: 'ApokalyptictBike',
        prefab: 'ApocalypticBikePref',
        feature: '',
        stats: {
          topspeed: 8,
          accel: 8,
          handling: 6,
          nitro: 6
        }
      }, {
        name: 'Mercenary Bike',
        image: 'MercenaryBike',
        prefab: 'MercenaryBikePref',
        feature: '',
        stats: {
          topspeed: 8,
          accel: 7,
          handling: 7,
          nitro: 6
        }
      }, {
        name: 'Dynamite',
        image: 'DynamiteBike',
        prefab: 'DynamiteBikePref',
        feature: 'Special: Survive the first impact!',
        stats: {
          topspeed: 6,
          accel: 5,
          handling: 6,
          nitro: 2
        }
      }, {
        name: 'Chopper',
        image: 'HarleyBike',
        prefab: 'HarleyBikePref',
        feature: '',
        stats: {
          topspeed: 6,
          accel: 8,
          handling: 2,
          nitro: 8
        }
      }, {
        name: 'Christmas Bike',
        image: 'ChristmasBike',
        prefab: 'ChristmasBikePref',
        feature: 'Special: Faster on Christmas Levels!',
        stats: {
          topspeed: 6,
          accel: 7,
          handling: 4,
          nitro: 6
        }
      }]);

      /**
       * Level packs in menu order. Level ids are "<pack>_<n>" for the main universe and
       * "<universe>_<pack>_<n>" for the special universes (GameConfig_U<u>_T<pack>).
       */
      const WORLDS = exports('WORLDS', [{
        prefix: '1_',
        name: 'Desert',
        levels: 30
      }, {
        prefix: '2_',
        name: 'Industrial',
        levels: 30
      }, {
        prefix: '3_',
        name: 'Frozen',
        levels: 30
      }, {
        prefix: '4_',
        name: 'Apocalypse',
        levels: 15
      }, {
        prefix: '2_1_',
        name: 'Special I',
        levels: 10
      }, {
        prefix: '3_1_',
        name: 'Special II',
        levels: 15
      }]);
      const SAVE_KEY = exports('SAVE_KEY', 'bikerivals.progress.v1');
      /** Dev switch: every level playable (no records are written, so turning it off restores real progress). */
      const DEV_UNLOCK_ALL_KEY = exports('DEV_UNLOCK_ALL_KEY', 'bikerivals.dev.unlockAll');
      /** Prefab of the bike chosen on the bike screen. */

      const SELECTED_BIKE_KEY = exports('SELECTED_BIKE_KEY', 'bikerivals.selectedBike');
      /** The bike ridden until one is chosen on the bike screen: the Extreme Bike (Neon Green Trials). */
      const DEFAULT_BIKE = exports('DEFAULT_BIKE', 'XtremeBikePref');
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Controls.ts", ['cc', './PadButton.ts'], function (exports) {
  var cclegacy, sys, UITransform, Node, input, Input, Vec3, KeyCode, PadButton;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
      UITransform = module.UITransform;
      Node = module.Node;
      input = module.input;
      Input = module.Input;
      Vec3 = module.Vec3;
      KeyCode = module.KeyCode;
    }, function (module) {
      PadButton = module.PadButton;
    }],
    execute: function () {
      exports({
        loadControlSettings: loadControlSettings,
        saveControlSettings: saveControlSettings
      });
      cclegacy._RF.push({}, "8de36sb8H1G9pz0okv/ky7P", "Controls", undefined);
      const SETTINGS_KEY = 'bikerivals_controls';
      /**
       * Accelerometer x along the screen's width on native builds, in m/s^2 / 10 like the original (MCAccelerometer
       * -onSensorChanged: turns the axes to the screen, the native side multiplies by -0.1 into CoreMotion's
       * acceleration, MotionManager -tilt returns its y) and like Cocos' web input. In JS the device motion values
       * hold the acceleration without gravity in slots 0-2 and with gravity (TYPE_ACCELEROMETER) in slots 3-5
       * (jsb_cocos_manual.cpp JSB_getDeviceMotionValue); only the latter shows how the phone is tilted. Same
       * orientation and sign handling as pal/input/native/accelerometer-input.ts.
       */
      function nativeTiltX() {
        const v = jsb.device.getDeviceMotionValue();
        let x = v[3] * 0.1;
        const y = v[4] * 0.1;
        const o = jsb.device.getDeviceOrientation(); // degrees: -90 landscape left, 90 landscape right
        if (o === 90) x = -y;else if (o === -90) x = y;else if (o === 180) x = -x;
        // Android reports the reaction to gravity, iOS (and the original's CoreMotion values) gravity itself
        if (sys.os === sys.OS.ANDROID) x = -x;
        return x;
      }

      /** How the rider leans: tilting the device (the original's only way on phones) or the lean buttons. */

      function loadControlSettings() {
        let s = {};
        try {
          s = JSON.parse(sys.localStorage.getItem(SETTINGS_KEY) || '{}') || {};
        } catch {
          /* defaults */
        }
        return {
          tilt: s.tilt ?? sys.isMobile,
          invert: !!s.invert
        };
      }
      function saveControlSettings(s) {
        try {
          sys.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
        } catch {
          /* storage unavailable */
        }
      }

      /**
       * Keyboard, touch and the accelerometer.
       * Keys: Up/W = gas, Down/S = brake, Left/A = lean back, Right/D = lean forward, Space/Shift = nitro, R = restart.
       * Tilt (MotionManager -tilt): the acceleration along the screen's width, in g, feeds the lean directly;
       * Cocos already turns the device axes to match the landscape orientation.
       * With tilt on (phones) the screen itself is the pedals, as in BikeCommon1 -ccTouchesBegan/Ended:; without
       * it, round buttons for gas, brake and both leans.
       */
      class Controls {
        /** `root`: an instance of Controls.prefab (round buttons gas / brake / leanBack / leanForward, TouchZones). */
        constructor(root) {
          this.state = {
            gas: false,
            brake: false,
            leanBack: false,
            leanForward: false,
            nitro: false,
            tilt: 0
          };
          this.onNitro = null;
          this.onRestart = null;
          this.keys = new Set();
          this.touch = {
            gas: false,
            brake: false,
            leanBack: false,
            leanForward: false
          };
          this.buttons = [];
          this.zones = void 0;
          this.zoneTouches = 0;
          this.settings = loadControlSettings();
          this.accel = 0;
          this.width = void 0;
          this.root = root;
          this.width = root.getComponent(UITransform).width;
          this.zones = root.getChildByName('TouchZones');
          this.zones.on(Node.EventType.TOUCH_START, this.zoneStart, this);
          this.zones.on(Node.EventType.TOUCH_END, this.zoneEnd, this);
          this.zones.on(Node.EventType.TOUCH_CANCEL, this.zoneEnd, this);
          for (const key of ['leanBack', 'leanForward', 'brake', 'gas']) this.buttons.push(this.button(key));
          input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
          input.on(Input.EventType.KEY_UP, this.keyUp, this);
          input.on(Input.EventType.DEVICEMOTION, this.onMotion, this);
          input.on(Input.EventType.TOUCH_START, this.askMotionPermission, this);
          this.apply();
        }

        /** -ccTouchesBegan: the right third of the screen is gas, the left third brake, the middle nothing. */
        zoneStart(e) {
          this.zoneTouches++;
          const x = this.zoneX(e);
          if (x > this.width * (2 / 3)) this.touch.gas = true;else if (x < this.width / 3) this.touch.brake = true;
          this.refresh();
        }

        /**
         * -ccTouchesEnded: a finger lifted on the right half releases the gas, on the left half the brake
         * (wherever it went down); the last finger up releases both.
         */
        zoneEnd(e) {
          this.zoneTouches = Math.max(0, this.zoneTouches - 1);
          if (this.zoneX(e) > this.width / 2) this.touch.gas = false;else this.touch.brake = false;
          if (this.zoneTouches === 0) this.touch.gas = this.touch.brake = false;
          this.refresh();
        }

        /** Touch x in the controls' own space, 0 at the left edge. */
        zoneX(e) {
          const p = e.getUILocation();
          return this.zones.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 0)).x + this.width / 2;
        }
        get controlSettings() {
          return {
            ...this.settings
          };
        }
        setControlSettings(s) {
          this.settings = {
            ...s
          };
          saveControlSettings(this.settings);
          this.apply();
        }
        apply() {
          // milliseconds; the original's CMMotionManager updates every 1/60 s. Set before enabling: the
          // engine's native source starts its polling timer with the interval it has then (200 ms by default)
          if (this.settings.tilt) input.setAccelerometerInterval(1000 / 60);else this.accel = 0;
          input.setAccelerometerEnabled(this.settings.tilt);
          // phones lean by tilting and use the screen halves as pedals in the original: no buttons then
          // (the keyboard still works)
          for (const b of this.buttons) b.active = !this.settings.tilt;
          this.zones.active = this.settings.tilt;
          this.touch.gas = this.touch.brake = this.touch.leanBack = this.touch.leanForward = false;
          this.zoneTouches = 0;
          this.refresh();
        }

        /**
         * iOS 13+ only reports motion after a permission request made from a user gesture; the engine
         * asked when the accelerometer was enabled (no gesture, refused), so enable it again once granted.
         */
        askMotionPermission() {
          input.off(Input.EventType.TOUCH_START, this.askMotionPermission, this);
          const dme = globalThis.DeviceMotionEvent;
          if (this.settings.tilt && dme && typeof dme.requestPermission === 'function') {
            dme.requestPermission().then(r => {
              if (r === 'granted' && this.settings.tilt) {
                input.setAccelerometerEnabled(false);
                input.setAccelerometerEnabled(true);
              }
            }).catch(() => undefined);
          }
        }
        onMotion(e) {
          var _e$acc;
          if (!this.settings.tilt) return;
          const x = sys.isNative ? nativeTiltX() : ((_e$acc = e.acc) == null ? void 0 : _e$acc.x) || 0;
          // device right side down (clockwise) = lean forward
          this.accel = (this.settings.invert ? -1 : 1) * x;
          this.state.tilt = this.accel;
        }
        button(key) {
          const n = this.root.getChildByName(key);
          const pad = n.getComponent(PadButton);
          const set = v => {
            this.touch[key] = v;
            pad.setDown(v);
            this.refresh();
          };
          n.on(Node.EventType.TOUCH_START, () => set(true));
          n.on(Node.EventType.TOUCH_END, () => set(false));
          n.on(Node.EventType.TOUCH_CANCEL, () => set(false));
          return n;
        }
        keyDown(e) {
          var _this$onNitro, _this$onRestart;
          this.keys.add(e.keyCode);
          if (e.keyCode === KeyCode.SPACE || e.keyCode === KeyCode.SHIFT_LEFT) (_this$onNitro = this.onNitro) == null || _this$onNitro.call(this);
          if (e.keyCode === KeyCode.KEY_R) (_this$onRestart = this.onRestart) == null || _this$onRestart.call(this);
          this.refresh();
        }
        keyUp(e) {
          this.keys.delete(e.keyCode);
          this.refresh();
        }
        refresh() {
          const k = (...codes) => codes.some(c => this.keys.has(c));
          this.state.gas = this.touch.gas || k(KeyCode.ARROW_UP, KeyCode.KEY_W);
          this.state.brake = this.touch.brake || k(KeyCode.ARROW_DOWN, KeyCode.KEY_S);
          this.state.leanBack = this.touch.leanBack || k(KeyCode.ARROW_LEFT, KeyCode.KEY_A);
          this.state.leanForward = this.touch.leanForward || k(KeyCode.ARROW_RIGHT, KeyCode.KEY_D);
          this.state.tilt = this.settings.tilt ? this.accel : 0;
        }
        reset() {
          this.keys.clear();
          for (const key of Object.keys(this.touch)) this.touch[key] = false;
          this.zoneTouches = 0;
          this.refresh();
        }
        destroy() {
          input.off(Input.EventType.KEY_DOWN, this.keyDown, this);
          input.off(Input.EventType.KEY_UP, this.keyUp, this);
          input.off(Input.EventType.DEVICEMOTION, this.onMotion, this);
          input.off(Input.EventType.TOUCH_START, this.askMotionPermission, this);
          input.setAccelerometerEnabled(false);
          this.root.destroy();
        }
      }
      exports('Controls', Controls);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/decide.ts", ['cc', './version.ts'], function (exports) {
  var cclegacy, compareVersion, nativeOf;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      compareVersion = module.compareVersion;
      nativeOf = module.nativeOf;
    }],
    execute: function () {
      exports('decide', decide);
      cclegacy._RF.push({}, "3f594HvfK5LP7O6BG4sFznW", "decide", undefined);
      function decide(i) {
        const p = i.pointer;
        if (p === null) return {
          kind: 'enter',
          reason: 'noPointer'
        };
        if (p.reset) return i.hasLocalUpdate ? {
          kind: 'reset'
        } : {
          kind: 'enter',
          reason: 'resetDone'
        };
        if (compareVersion(nativeOf(i.apkVersion), p.minNativeVersion) < 0) return {
          kind: 'needStore'
        };
        if (compareVersion(p.version, i.effective) <= 0) return {
          kind: 'enter',
          reason: 'upToDate'
        };
        return {
          kind: 'update',
          pointer: p
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Drone.ts", ['cc', './planck.mjs'], function (exports) {
  var cclegacy, CircleShape, BoxShape;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      CircleShape = module.Circle;
      BoxShape = module.Box;
    }],
    execute: function () {
      cclegacy._RF.push({}, "95ec0leDsZGxpNh8RZyyu8n", "Drone", undefined);
      const DEG = Math.PI / 180;
      /** Drone -wakeup: the shell opens, then -lockPartsAndChangeColor locks it 1.575 s later. */
      const LOCK_DELAY = 1.575;
      /** Drone -explodeDrone: the explosion follows 1.45 s later (-explodeDroneNow). */
      const EXPLODE_DELAY = 1.45;
      /** -explodeDroneNow: GameLogic -explodeAt:Damage:5. */
      const EXPLOSION_DAMAGE = 5;
      /** Drone -update: reaching the target this close posts "kill". */
      const KILL_DISTANCE = 10;
      /**
       * World 4 security drone (Drone class). It hangs on a rail (a motorised prismatic joint that
       * patrols between two motor triggers) and sweeps the ground with two light beams carried by its
       * eye. A bike touching a beam wakes it: the shell opens, and after `wakeTime` it leaves the rail
       * and flies at the rider's head, accelerating by `accel` up to `maxSpeed`. It explodes when it
       * reaches the head (killing the rider), after `explodeTime`, or when it hits a collider.
       */
      class Drone {
        constructor(host, entities, group, children, bodyMap, joints) {
          this.bodies = new Set();
          this.orb = void 0;
          this.eye = void 0;
          this.shells = [];
          this.parts = new Map();
          this.joints = void 0;
          this.sensors = [];
          this.awake = false;
          this.follow = false;
          this.releaseDrone = false;
          this.released = false;
          this.followPosition = false;
          this.exploding = false;
          this.exploded = false;
          this.disabled = false;
          this.abortAttack = false;
          this.unloadingOrb = false;
          this.orbUnloaded = false;
          this.followObject = null;
          this.followSpeed = 0;
          this.followTime = 0;
          this.tickDelay = 0;
          this.targetAngle = 0;
          this.lookAngle = 0;
          this.newLookAngleTime = 0;
          this.timers = [];
          this.angle = void 0;
          this.accel = void 0;
          this.maxSpeed = void 0;
          this.wakeTime = void 0;
          this.explodeTime = void 0;
          this.host = host;
          this.entities = entities;
          this.bodyMap = bodyMap;
          const p = entities[group].Properties;
          this.angle = p.angle || 0;
          this.accel = p.accel ?? 6;
          this.maxSpeed = p.maxSpeed ?? 150;
          this.wakeTime = p.wakeTime ?? 0.5;
          this.explodeTime = p.explodeTime ?? 3;
          for (const c of children) this.parts.set((entities[c].Properties.name || '').toLowerCase(), c);
          this.orb = this.body('orbpoly');
          this.eye = this.body('eye');
          this.shells = ['topleftbody', 'toprightbody', 'bottomleftbody', 'bottomrightbody'].map(n => this.body(n)).filter(b => b);
          [this.orb, this.eye, ...this.shells].forEach(b => b && this.bodies.add(b));
          this.bindJoints(joints);
          // the beam kill zones ride on the eye, the centre trigger on the orb
          for (const n of ['boundarykill1', 'boundarykill2', 'boundarykill3']) this.addSensor(n, this.eye, 'beam');
          this.addSensor('centertrigger', this.orb, 'center');
          this.resetState();
        }

        /** Trigger entities the drone handles itself (the session must not treat them as generic triggers). */
        get ownTriggers() {
          return ['boundarykill1', 'boundarykill2', 'boundarykill3', 'centertrigger'].map(n => this.parts.get(n)).filter(i => i != null);
        }
        body(name) {
          const i = this.parts.get(name);
          return i != null ? this.bodyMap.get(i) || null : null;
        }
        bindJoints(joints) {
          const j = n => {
            const i = this.parts.get(n);
            return i != null ? joints.get(i) || null : null;
          };
          this.joints = {
            j1: j('joint1'),
            j2: j('joint2'),
            j3: j('joint3'),
            j4: j('joint4'),
            rail: j('rail'),
            rev: j('revjoint')
          };
        }
        addSensor(name, body, part) {
          var _p$position, _p$position2;
          const i = this.parts.get(name);
          if (i == null || !body) return;
          const p = this.entities[i].Properties;
          const bp = body.getPosition();
          const c = {
            x: (((_p$position = p.position) == null ? void 0 : _p$position[0]) || 0) - bp.x,
            y: (((_p$position2 = p.position) == null ? void 0 : _p$position2[1]) || 0) - bp.y
          };
          const shape = (p.shape ?? 1) === 0 ? new CircleShape(c, Math.max(0.05, p.radius || 1)) : new BoxShape(Math.max(0.05, (p.width || 1) / 2), Math.max(0.05, (p.height || 1) / 2), c, (p.rotation || 0) * Math.PI / 180);
          this.sensors.push(body.createFixture(shape, {
            isSensor: true,
            density: 0,
            userData: {
              drone: this,
              part
            }
          }));
        }
        resetState() {
          this.awake = this.follow = this.releaseDrone = this.released = this.followPosition = false;
          this.exploding = this.exploded = this.disabled = this.abortAttack = false;
          this.unloadingOrb = this.orbUnloaded = false;
          this.followObject = null;
          this.followSpeed = this.followTime = this.tickDelay = 0;
          this.targetAngle = this.lookAngle = this.angle;
          this.newLookAngleTime = 0;
          this.timers = [];
          this.setBeamsVisible(true);
          this.setVisible('orb', true);
        }

        /** Drone -reset (level reset on respawn): joints were re-created, bodies moved back. */
        reset(joints) {
          this.bindJoints(joints);
          if (this.orb) this.orb.setType('dynamic');
          this.resetState();
        }
        after(t, fn) {
          this.timers.push({
            t,
            fn
          });
        }

        // ---- contacts (Drone -addContact:FixtureA:FixtureB:) ----

        /** A non-sensor fixture touched one of the drone's sensors. */
        onSensor(part, other, isBike) {
          var _other$getUserData;
          if (isBike && !this.disabled) {
            if (part === 'beam') {
              if (!this.awake && !this.exploding) {
                // GreenBike riders hack drones instead; the levels' bikes never do
                this.wakeup();
                this.followObject = this.host.bikeHead();
              }
            } else if (!this.exploding) {
              if (!this.followPosition) this.disableDrone();else this.explodeDrone();
            }
            return;
          }
          if (part === 'center' && ((_other$getUserData = other.getUserData()) == null ? void 0 : _other$getUserData.tag) === 1) this.explodeDrone();
        }

        /** One of the drone's solid bodies touched something. */
        onHit(other) {
          var _other$getUserData2;
          if (((_other$getUserData2 = other.getUserData()) == null ? void 0 : _other$getUserData2.tag) === 1 && !this.bodies.has(other)) this.explodeDrone();
        }

        // ---- behaviour ----

        wakeup() {
          this.awake = true;
          const {
            j1,
            j2,
            j3,
            j4
          } = this.joints;
          // the shell motors reverse: the four quarters slide open
          for (const j of [j1, j2, j3, j4]) if (j) j.setMotorSpeed(-j.getMotorSpeed());
          this.setPartLimits(0, 100 * DEG);
          this.after(LOCK_DELAY, () => this.setPartLimits(99 * DEG, 100 * DEG));
          if (this.eye) this.targetAngle = this.eye.getAngle();
          this.follow = true;
          this.abortAttack = false;
          this.after(this.wakeTime, () => this.attack());
        }

        /** -setPartLimits / -lockPartsAndChangeColor: joints 1, 3 open to +lim, joints 2, 4 to -lim. */
        setPartLimits(lo, hi) {
          const {
            j1,
            j2,
            j3,
            j4
          } = this.joints;
          j1 == null || j1.setLimits(lo, hi);
          j2 == null || j2.setLimits(-hi, -lo);
          j3 == null || j3.setLimits(lo, hi);
          j4 == null || j4.setLimits(-hi, -lo);
        }
        attack() {
          if (this.abortAttack) return;
          this.followPosition = true;
        }
        disableDrone() {
          var _this$orb;
          this.setBeamsVisible(false);
          this.releaseDrone = true;
          this.disabled = true;
          this.abortAttack = true;
          this.follow = false;
          // it drops (and explodes when it hits the ground)
          (_this$orb = this.orb) == null || _this$orb.setType('dynamic');
        }
        explodeDrone() {
          if (this.exploding) return;
          this.exploding = true;
          this.after(EXPLODE_DELAY, () => this.explodeDroneNow());
        }
        explodeDroneNow() {
          var _ref;
          if (this.exploded) return;
          this.exploded = true;
          this.disableDrone();
          this.exploding = true;
          const at = (_ref = this.eye || this.orb) == null ? void 0 : _ref.getPosition();
          if (at) this.host.explodeAt(at.x, at.y, EXPLOSION_DAMAGE);
          this.unloadingOrb = true;
        }

        /** Drone -update:, one call per 60 Hz physics step. */
        update(dt) {
          for (const t of this.timers.slice()) {
            t.t -= dt;
            if (t.t <= 0) {
              this.timers.splice(this.timers.indexOf(t), 1);
              t.fn();
            }
          }
          if (!this.orb || this.orbUnloaded) return;
          if (this.releaseDrone && !this.released) {
            this.released = true;
            const rail = this.joints.rail;
            if (rail) {
              rail.setMotorSpeed(0);
              this.host.world.destroyJoint(rail);
              this.joints.rail = null;
            }
          }
          if (!this.follow) {
            if (!this.exploding && !this.releaseDrone) {
              // asleep: the eye sweeps a quarter turn around the drone's angle
              this.newLookAngleTime -= dt;
              if (this.newLookAngleTime < 0) {
                this.newLookAngleTime = Math.floor(Math.random() * 100) * 0.01 + 0.4;
                this.lookAngle = this.angle - Math.PI / 4 + Math.floor(Math.random() * 314) * 0.005;
              }
              this.targetAngle += (this.lookAngle - this.targetAngle) * 0.1;
              this.aimEye();
            }
          } else if (!this.released) {
            this.releaseDrone = true;
            this.orb.setType('kinematic');
          } else if (this.followObject) {
            const op = this.orb.getPosition();
            const tp = this.followObject.getPosition();
            let dx = tp.x - op.x,
              dy = tp.y - op.y;
            const dist = Math.hypot(dx, dy);
            if (dist >= 1.1920929e-7) {
              dx /= dist;
              dy /= dist;
            }
            let mx = 0,
              my = 0;
            if (!this.followPosition) {
              const v = this.orb.getLinearVelocity();
              this.orb.setLinearVelocity({
                x: v.x * 0.9,
                y: v.y * 0.9
              });
            } else {
              this.followSpeed += dt * this.accel;
              if (this.followSpeed * 60 > this.maxSpeed) this.followSpeed = this.maxSpeed / 60;
              mx = dx * this.followSpeed;
              my = dy * this.followSpeed;
              this.followTime += dt;
              this.tickDelay -= dt;
              if (this.tickDelay < 0) {
                this.host.sound('/DroneTick');
                this.tickDelay = (this.explodeTime - this.followTime) * 0.1;
              }
              // the orb is kinematic: it and the four shell quarters are moved by hand
              for (const b of [this.orb, ...this.shells]) {
                const p = b.getPosition();
                b.setTransform({
                  x: p.x + mx,
                  y: p.y + my
                }, b.getAngle());
              }
            }
            // the eye (and its beams) turn towards the target
            let a = Math.atan2(dy, dx) + Math.PI / 2;
            while (a - this.targetAngle > Math.PI) a -= 2 * Math.PI;
            while (a - this.targetAngle < -Math.PI) a += 2 * Math.PI;
            this.targetAngle += (a - this.targetAngle) * 0.1;
            this.aimEye();
            if (dist < KILL_DISTANCE && this.followPosition) {
              this.orb.setType('dynamic');
              this.host.killBike();
              this.explodeDrone();
            } else if (this.followTime >= this.explodeTime) {
              this.orb.setType('dynamic');
              this.explodeDrone();
            }
          }
          if (this.unloadingOrb && !this.orbUnloaded) {
            this.orbUnloaded = true;
            const rev = this.joints.rev;
            if (rev) {
              this.host.world.destroyJoint(rev);
              this.joints.rev = null;
            }
            for (const b of [this.orb, this.eye]) b == null || b.setActive(false);
            this.setVisible('orb', false);
          }
        }
        aimEye() {
          if (this.eye) this.eye.setTransform(this.eye.getPosition(), this.targetAngle);
        }
        setBeamsVisible(on) {
          this.setVisible('beamsprite1', on);
          this.setVisible('beamsprite2', on);
        }
        setVisible(name, on) {
          const i = this.parts.get(name);
          if (i != null) for (const n of this.host.nodesOf(i)) this.host.show(n, on);
        }
      }
      exports('Drone', Drone);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameRoot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CcbAnimator.ts', './Config.ts', './Nav.ts', './Sound.ts', './GameSession.ts', './WorldView.ts', './Progress.ts', './Controls.ts', './PauseView.ts', './ResultView.ts', './Screens.ts', './UiKit.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Prefab, _decorator, Component, view, instantiate, UITransform, CcbAnimator, WORLDS, BIKE_ENGINES, DEFAULT_ENGINE, installDebug, ensureAssets, Nav, SOUND_EVENTS, Sound, GameSession, WorldView, getRecord, saveResult, Controls, PauseView, ResultView, Hud, uiNode;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Prefab = module.Prefab;
      _decorator = module._decorator;
      Component = module.Component;
      view = module.view;
      instantiate = module.instantiate;
      UITransform = module.UITransform;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      WORLDS = module.WORLDS;
      BIKE_ENGINES = module.BIKE_ENGINES;
      DEFAULT_ENGINE = module.DEFAULT_ENGINE;
    }, function (module) {
      installDebug = module.installDebug;
      ensureAssets = module.ensureAssets;
      Nav = module.Nav;
      SOUND_EVENTS = module.SOUND_EVENTS;
    }, function (module) {
      Sound = module.Sound;
    }, function (module) {
      GameSession = module.GameSession;
    }, function (module) {
      WorldView = module.WorldView;
    }, function (module) {
      getRecord = module.getRecord;
      saveResult = module.saveResult;
    }, function (module) {
      Controls = module.Controls;
    }, function (module) {
      PauseView = module.PauseView;
    }, function (module) {
      ResultView = module.ResultView;
    }, function (module) {
      Hud = module.Hud;
    }, function (module) {
      uiNode = module.uiNode;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
      cclegacy._RF.push({}, "7b1f0wuXTpOi5xBL2qNDhs3", "GameRoot", undefined);
      const {
        ccclass,
        property
      } = _decorator;

      /** Worlds on the map; later WORLDS entries are the special packs. */
      const MAP_WORLDS = 4;

      /** Runs a converted screen's entrance to its end. */
      function finish(n) {
        const a = n == null ? void 0 : n.getComponent(CcbAnimator);
        for (let i = 0; i < 1200 && a != null && a.running; i++) a.update(1 / 60);
      }

      /**
       * Root of game.scene: runs a GameSession for Nav.pendingLevel with the HUD and controls, the original's
       * loading, pause and level-complete screens (prefabs converted from Loading, PauseMenu and
       * LevelCompletedMenu .ccbi), and goes back to menu.scene.
       */
      let GameRoot = exports('GameRoot', (_dec = ccclass('GameRoot'), _dec2 = property(Prefab), _dec3 = property(Prefab), _dec4 = property(Prefab), _dec5 = property(Prefab), _dec6 = property(Prefab), _dec7 = property(Prefab), _dec(_class = (_class2 = class GameRoot extends Component {
        constructor(...args) {
          super(...args);
          /** Loading.ccbi */
          _initializerDefineProperty(this, "loadingPrefab", _descriptor, this);
          /** PauseMenu.ccbi */
          _initializerDefineProperty(this, "pausePrefab", _descriptor2, this);
          /** LevelCompletedMenu.ccbi */
          _initializerDefineProperty(this, "resultPrefab", _descriptor3, this);
          /** ExplosionEffect.ccbi (TNT barrels, bombs) */
          _initializerDefineProperty(this, "explosionPrefab", _descriptor4, this);
          /** The port's HUD (tools/port_layouts.py) */
          _initializerDefineProperty(this, "hudPrefab", _descriptor5, this);
          /** The port's touch controls (tools/port_layouts.py) */
          _initializerDefineProperty(this, "controlsPrefab", _descriptor6, this);
          this.session = null;
          this.controls = null;
          this.uiLayer = null;
          this.gameLayer = null;
          this.hud = null;
          this.popup = null;
          this.levelId = '';
          this.loading = false;
          this.ready = null;
        }
        async start() {
          installDebug();
          const vs = view.getVisibleSize();
          this.gameLayer = uiNode('GameLayer', this.node, vs.width, vs.height);
          this.uiLayer = uiNode('UiLayer', this.node, vs.width, vs.height);
          this.ready = ensureAssets();
          await this.ready;
          if (!this.isValid) return; // left the scene while loading
          Nav.game = this;
          WorldView.explosionPrefab = this.explosionPrefab;
          const id = Nav.pendingLevel;
          Nav.pendingLevel = null;
          if (id) this.startLevel(id);
          // game.scene opened on its own (editor preview): play the first level
          else if (!Nav.debugDriven) this.startLevel('1_1');
        }
        onDestroy() {
          this.endSession();
          Sound.stopEngine();
          if (Nav.game === this) Nav.game = null;
        }
        clearUi() {
          this.uiLayer.destroyAllChildren();
          this.popup = null;
        }

        /** Back to the menus: the map at this level, or the special packs. */
        toMenu() {
          Nav.toMenu(this.worldOf(this.levelId) >= MAP_WORLDS ? 'specials' : 'map', this.levelId);
        }
        worldOf(id) {
          // longest matching prefix with a numeric remainder
          let best = -1;
          WORLDS.forEach((wd, i) => {
            if (id.startsWith(wd.prefix) && /^\d+$/.test(id.slice(wd.prefix.length))) {
              if (best < 0 || wd.prefix.length > WORLDS[best].prefix.length) best = i;
            }
          });
          return best;
        }
        nextLevel(id) {
          const w = this.worldOf(id);
          if (w < 0) return null;
          const n = Number(id.slice(WORLDS[w].prefix.length));
          if (n < WORLDS[w].levels) return WORLDS[w].prefix + (n + 1);
          return w + 1 < WORLDS.length ? WORLDS[w + 1].prefix + '1' : null;
        }
        endSession() {
          var _this$session, _this$controls, _this$gameLayer;
          (_this$session = this.session) == null || _this$session.destroy();
          this.session = null;
          (_this$controls = this.controls) == null || _this$controls.destroy();
          this.controls = null;
          this.hud = null;
          // timers of the previous run: result popup, "GO!" message
          this.unscheduleAllCallbacks();
          if ((_this$gameLayer = this.gameLayer) != null && _this$gameLayer.isValid) this.gameLayer.destroyAllChildren();
        }

        /** The original's loading screen over everything, entering. */
        showLoading() {
          var _cover$getComponent;
          const cover = instantiate(this.loadingPrefab);
          this.uiLayer.addChild(cover);
          (_cover$getComponent = cover.getComponent(CcbAnimator)) == null || _cover$getComponent.play('loadin');
          return cover;
        }
        async startLevel(id) {
          if (this.loading) return;
          this.loading = true;
          this.endSession();
          this.clearUi();
          this.levelId = id;
          const cover = this.showLoading();
          // the loading screen has no background of its own: keep the level out of sight while it is built
          this.gameLayer.active = false;
          try {
            const vs = this.uiLayer.getComponent(UITransform);
            const host = uiNode('Session', this.gameLayer, vs.width, vs.height);
            let nitro = 0;
            this.session = await GameSession.start(host, id, {
              onFinish: (t, stars) => this.onFinish(t, stars),
              onCrash: () => {
                Sound.playRandom(['GuyPain_mid1', 'GuyPain_high1', 'GuyPain_low1']);
                Sound.playRandom(['bodyhit_hard1', 'bonebreak1', 'bonebreak2'], 0.8);
              },
              onNitro: n => {
                var _this$hud;
                if (n > nitro) Sound.play('sfx_nitroMount');
                nitro = n;
                (_this$hud = this.hud) == null || _this$hud.setNitro(n);
              },
              onNitroUse: () => Sound.play('sfx_nitroStart'),
              onCheckpoint: () => Sound.play('sfx_checkpoint'),
              onExplosion: () => Sound.play('sfx_explosion1'),
              onSound: ev => {
                const name = ev.split('/').pop();
                const sample = SOUND_EVENTS[name] || name;
                if (Array.isArray(sample)) Sound.playRandom(sample);else Sound.play(sample);
              }
            });
            Sound.music('InGame');
            await Sound.loadEngine(this.engineOf().bank);
            if (!this.isValid) {
              var _this$session2;
              // the scene changed while the level loaded
              (_this$session2 = this.session) == null || _this$session2.destroy();
              return;
            }
          } catch (e) {
            console.error('[BR] level load failed', id, e);
            this.loading = false;
            this.gameLayer.active = true;
            Nav.toMenu('main');
            return;
          }
          cover.destroy();
          this.gameLayer.active = true;
          const controls = instantiate(this.controlsPrefab);
          this.uiLayer.addChild(controls);
          this.controls = new Controls(controls);
          this.controls.onNitro = () => {
            var _this$session3;
            return (_this$session3 = this.session) == null ? void 0 : _this$session3.useNitro();
          };
          this.controls.onRestart = () => this.startLevel(this.levelId);
          const hud = instantiate(this.hudPrefab);
          this.uiLayer.addChild(hud);
          this.hud = new Hud(hud, id, {
            pause: () => this.pause(),
            restart: () => this.startLevel(this.levelId),
            nitro: () => {
              var _this$session4;
              return (_this$session4 = this.session) == null ? void 0 : _this$session4.useNitro();
            }
          });
          this.hud.placeNitro(this.controls.controlSettings.tilt);
          this.hud.setNitro(this.session.nitroCount);
          this.hud.message('GO!');
          this.scheduleOnce(() => {
            var _this$hud2;
            return (_this$hud2 = this.hud) == null ? void 0 : _this$hud2.message('');
          }, 1.2);
          this.loading = false;
          console.log('[BR] level started', id);
        }
        pause() {
          var _getRecord;
          if (!this.session || this.popup || this.session.finished) return;
          this.session.paused = true;
          Sound.play('sfx_pause');
          this.controls.reset();
          this.controls.root.active = false;
          this.popup = instantiate(this.pausePrefab);
          this.uiLayer.addChild(this.popup);
          this.popup.addComponent(PauseView).init(this.session.level.times, ((_getRecord = getRecord(this.levelId)) == null ? void 0 : _getRecord.stars) || 0, {
            resume: () => {
              var _this$popup;
              (_this$popup = this.popup) == null || _this$popup.destroy();
              this.popup = null;
              if (this.session) this.session.paused = false;
              if (this.controls) this.controls.root.active = true;
            },
            restart: () => this.startLevel(this.levelId),
            menu: () => this.toMenu()
          }, [{
            text: () => {
              var _this$controls2;
              return `Điều khiển: ${(_this$controls2 = this.controls) != null && _this$controls2.controlSettings.tilt ? 'nghiêng máy' : 'nút bấm'}`;
            },
            toggle: () => {
              var _this$controls3, _this$hud3, _this$controls4;
              const s = (_this$controls3 = this.controls) == null ? void 0 : _this$controls3.controlSettings;
              if (s) this.controls.setControlSettings({
                ...s,
                tilt: !s.tilt
              });
              (_this$hud3 = this.hud) == null || _this$hud3.placeNitro(!!((_this$controls4 = this.controls) != null && _this$controls4.controlSettings.tilt));
            }
          }, {
            text: () => {
              var _this$controls5;
              return `Đảo chiều nghiêng: ${(_this$controls5 = this.controls) != null && _this$controls5.controlSettings.invert ? 'bật' : 'tắt'}`;
            },
            toggle: () => {
              var _this$controls6;
              const s = (_this$controls6 = this.controls) == null ? void 0 : _this$controls6.controlSettings;
              if (s) this.controls.setControlSettings({
                ...s,
                invert: !s.invert
              });
            }
          }]);
        }
        onFinish(time, stars) {
          var _getRecord2;
          Sound.play('sfx_finishline');
          const before = ((_getRecord2 = getRecord(this.levelId)) == null ? void 0 : _getRecord2.time) ?? null;
          const best = saveResult(this.levelId, time, stars);
          const session = this.session;
          this.scheduleOnce(() => {
            // not if the level was restarted or left meanwhile
            if (this.session === session && !this.popup) this.showResult(time, stars, best, before);
          }, 1.0);
        }
        showResult(time, stars, newBest, before, instant = false) {
          var _this$controls7;
          const next = this.nextLevel(this.levelId);
          (_this$controls7 = this.controls) == null || _this$controls7.reset();
          if (this.controls) this.controls.root.active = false;
          if (this.hud) this.hud.root.active = false;
          this.popup = instantiate(this.resultPrefab);
          this.uiLayer.addChild(this.popup);
          this.popup.addComponent(ResultView).init(time, stars, newBest, before, !!next, {
            restart: () => this.startLevel(this.levelId),
            next: () => next && this.startLevel(next),
            menu: () => this.toMenu()
          }, instant);
        }

        /**
         * Puts the UI in a fixed state for tools/ui_snap.mjs: "loading", "hud:<level>:buttons|tilt",
         * "pause:<level>", "result:<level>:<stars>:<time>". In-level states stop the session as soon as it is
         * loaded and finish the screens' entrances at once, so every run shows the same frame.
         */
        async debugShow(state) {
          await this.ready;
          const [kind, id, a, b] = state.split(':');
          if (kind === 'loading') {
            this.endSession();
            this.clearUi();
            finish(this.showLoading());
            return;
          }
          await this.startLevel(id);
          if (!this.session) throw new Error('level did not load: ' + id);
          this.session.paused = true;
          this.hud.message('');
          const tilt = kind === 'hud' && a === 'tilt';
          this.controls.setControlSettings({
            ...this.controls.controlSettings,
            tilt
          });
          this.hud.placeNitro(tilt);
          if (kind === 'pause') {
            this.pause();
            finish(this.popup);
          }
          if (kind === 'result') this.showResult(Number(b), Number(a), true, null, true);
        }
        engineOf() {
          var _s$level$entities$s$l;
          const s = this.session;
          const def = s == null || (_s$level$entities$s$l = s.level.entities[s.level.bikeGroup]) == null ? void 0 : _s$level$entities$s$l.Properties.definition;
          return BIKE_ENGINES[def] || DEFAULT_ENGINE;
        }
        update(dt) {
          var _this$hud4;
          if (!this.session || !this.controls) {
            Sound.setEngine(0, false);
            return;
          }
          this.session.update(dt, this.controls.state);
          (_this$hud4 = this.hud) == null || _this$hud4.setTime(this.session.time);
          const bike = this.session.bike;
          if (bike != null && bike.backWheel) {
            const e = this.engineOf();
            Sound.setEngine(bike.rpm, !bike.crashed && !this.session.paused, e.min, e.max);
          }
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "loadingPrefab", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "pausePrefab", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "resultPrefab", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "explosionPrefab", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "hudPrefab", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "controlsPrefab", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameSession.ts", ['cc', './planck.mjs', './Config.ts', './Assets.ts', './LevelData.ts', './Box2D21.ts', './PhysicsBuilder.ts', './ParallaxView.ts', './WorldView.ts', './Bike.ts', './BikeEffects.ts', './Drone.ts', './Progress.ts', './Water.ts'], function (exports) {
  var cclegacy, Material, builtinResMgr, gfx, UITransform, Node, Layers, Sprite, Color, tween, view, Settings, Contact, Body, World, CircleShape, BoxShape, DEFAULT_GRAVITY, SHEET_RESOLUTION, BIKE_SHEETS, TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS, PX_PER_UNIT, VIEW_SCALE, loadJson, setStylePack, stylePackFor, loadAtlas, getFrame, loadLevel, configNameFor, groupChildren, PhysicsBuilder, ParallaxView, WorldView, Bike, BikeEffects, Drone, getSelectedBike, WaterArea;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Material = module.Material;
      builtinResMgr = module.builtinResMgr;
      gfx = module.gfx;
      UITransform = module.UITransform;
      Node = module.Node;
      Layers = module.Layers;
      Sprite = module.Sprite;
      Color = module.Color;
      tween = module.tween;
      view = module.view;
    }, function (module) {
      Settings = module.Settings;
      Contact = module.Contact;
      Body = module.Body;
      World = module.World;
      CircleShape = module.Circle;
      BoxShape = module.Box;
    }, function (module) {
      DEFAULT_GRAVITY = module.DEFAULT_GRAVITY;
      SHEET_RESOLUTION = module.SHEET_RESOLUTION;
      BIKE_SHEETS = module.BIKE_SHEETS;
      TIME_STEP = module.TIME_STEP;
      VELOCITY_ITERATIONS = module.VELOCITY_ITERATIONS;
      POSITION_ITERATIONS = module.POSITION_ITERATIONS;
      PX_PER_UNIT = module.PX_PER_UNIT;
      VIEW_SCALE = module.VIEW_SCALE;
    }, function (module) {
      loadJson = module.loadJson;
      setStylePack = module.setStylePack;
      stylePackFor = module.stylePackFor;
      loadAtlas = module.loadAtlas;
      getFrame = module.getFrame;
    }, function (module) {
      loadLevel = module.loadLevel;
      configNameFor = module.configNameFor;
      groupChildren = module.groupChildren;
    }, null, function (module) {
      PhysicsBuilder = module.PhysicsBuilder;
    }, function (module) {
      ParallaxView = module.ParallaxView;
    }, function (module) {
      WorldView = module.WorldView;
    }, function (module) {
      Bike = module.Bike;
    }, function (module) {
      BikeEffects = module.BikeEffects;
    }, function (module) {
      Drone = module.Drone;
    }, function (module) {
      getSelectedBike = module.getSelectedBike;
    }, function (module) {
      WaterArea = module.WaterArea;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d6ea07QUtBNUrjymS6iYiwx", "GameSession", undefined);
      /** EditorTrigger "action" values handled by Trigger -update: in the original. */
      const ACTION_UNLOAD = 1;
      const ACTION_LOAD = 2;
      const ACTION_EVENT = 3;
      const ACTION_CAMERA = 4;
      const ACTION_BOUNDARY = 6;
      const ACTION_SHAKE = 5;
      const ACTION_MOTOR = 7;
      const ACTION_SLOW_MOTION = 8;
      const ACTION_WATER_LEVEL = 9;
      const ACTION_SOUND = 10;
      const ACTION_EXPLODE = 11;
      const HANDLED_ACTIONS = new Set([ACTION_UNLOAD, ACTION_LOAD, ACTION_EVENT, ACTION_CAMERA, ACTION_SHAKE, ACTION_BOUNDARY, ACTION_MOTOR, ACTION_SLOW_MOTION, ACTION_WATER_LEVEL, ACTION_SOUND, ACTION_EXPLODE]);
      /** BikeCommon1 -loadLight: headlight sprite position on the bike body sprite (HD pixels, from its bottom-left). */
      const LIGHT_POS = {
        XtremeBike: [120, 80]
      };
      const DEFAULT_LIGHT_POS = [170, 80];
      /** PhysicsObject -update: a fading object loses 2.5 opacity per second, then unloads. */
      const FADE_OUT_SPEED = 2.5;

      /**
       * A trigger area. Like Trigger -loadEntity in the original it is a Box2D sensor (circle or box,
       * angle = +rotation degrees) and it counts contacts: the first contact activates it, the last
       * one leaving deactivates it. collideTag: -1 = bike parts (tag -1), 99 = anything, n = tag n.
       */

      // the game's Box2D build clamps a body's motion per step to 2.8 units (b2Island::Solve), not
      // Box2D's stock 2.0: at 60 Hz that allows 168 u/s, above the bikes' speedLimit (~132)
      Settings.maxTranslation = 2.8;

      // Box2D 2.1 (b2ContactManager::AddPair @0x448014) does not wake bodies when their AABBs start
      // overlapping; planck's Contact.create does, which wakes "startSleep" stacks (breakable towers)
      // as soon as the level loads. Bodies only wake when a contact really starts touching.
      const planckCreateContact = Contact.create;
      Contact.create = function (fA, iA, fB, iB) {
        const a = fA.getBody(),
          b = fB.getBody();
        const awakeA = a.isAwake(),
          awakeB = b.isAwake();
        const c = planckCreateContact.call(this, fA, iA, fB, iB);
        if (c) {
          if (!awakeA && a.isAwake()) a.setAwake(false);
          if (!awakeB && b.isAwake()) b.setAwake(false);
        }
        return c;
      };

      // A dynamic body welded to a static one (1-3: the rock under the start, welded to the ground and sunk
      // 24 units into the cliff) cannot move, but its contacts with the terrain it overlaps still push it
      // out every position iteration and the weld pulls it back; whatever rests on it is shoved out of the
      // displaced rock and jitters. Those contacts do nothing while the weld holds, so skip them; once the
      // weld is destroyed the body's proxy moves and the broadphase pairs it with the terrain again.
      const weldedToStatic = b => b.isDynamic() && (() => {
        for (let je = b.getJointList(); je; je = je.next) if (je.joint.getType() === 'weld-joint' && je.other.isStatic()) return true;
        return false;
      })();
      const planckShouldCollide = Body.prototype.shouldCollide;
      Body.prototype.shouldCollide = function (that) {
        if (!planckShouldCollide.call(this, that)) return false;
        return !(this.isStatic() && weldedToStatic(that) || that.isStatic() && weldedToStatic(this));
      };
      const RESPAWN_DELAY = 1.6;
      /** WaterTrigger -addContact: performSelector:@selector(explodeBike:) afterDelay:0.5 */
      const LAVA_EXPLODE_DELAY = 0.5;
      const CLOCK_BONUS = 2;
      const GEYSER_FORCE = 2.2; // multiples of the body's weight
      const EXPLOSION_RADIUS = 28;
      const EXPLOSION_IMPULSE = 45; // velocity change at the centre
      const EXPLOSION_PRESSURE_SCALE = 1; // barrel "minPressure" vs. contact normal impulse

      /** One running level: physics world, views, bike, triggers, camera and timer. */
      class GameSession {
        constructor(host, events) {
          this.level = void 0;
          this.world = void 0;
          this.worldView = void 0;
          this.parallax = void 0;
          this.effects = null;
          this.bike = void 0;
          this.time = 0;
          this.started = false;
          this.finished = false;
          this.nitroCount = 0;
          this.nitroTime = 0;
          this.paused = false;
          this.ground = void 0;
          this.gravity = DEFAULT_GRAVITY;
          this.regions = [];
          this.activations = [];
          this.waters = [];
          /** Joint motors ramping toward a trigger's speed (Physics*Joint -update:). */
          this.motorRamps = new Map();
          this.killBodies = new Set();
          this.geysers = [];
          this.barrels = new Map();
          this.pendingExplosions = new Set();
          this.spawn = {
            x: 0,
            y: 0
          };
          this.respawnTimer = -1;
          this.crashRequested = false;
          /** WaterTrigger -explodeBike: pending (seconds left), -1 when none. */
          this.lavaExplodeTimer = -1;
          /**
           * Camera -setFollowEntity:nil (the bike drowned): the camera glides on with its last motion, slowing
           * down, until respawn.
           */
          this.cameraHeld = false;
          /** BikeCommon1 headLinearVelocity_ (speed of the rider's head, last step and the one before). */
          this.headSpeed = 0;
          this.lastHeadSpeed = 0;
          /** The crash about to happen comes from a fatal head hit (Bike headHit_). */
          this.headHit = false;
          this.accumulator = 0;
          this.bikeParams = void 0;
          /**
           * Camera state, mirroring the original Camera (-init defaults: xOffset 15, vRayValue 130) and GameScene.
           * camZoom is Camera.zoom_ (only changed in the air), refZoom its referenceZoom_ (set by camera
           * triggers), zoom the smoothed GameScene cameraZoom_. (dstX, dstY) is Camera dstPosition_, where the
           * camera wants to be; (x, y) GameScene cameraCenter_, which closes in on it by smoothX / smoothY (the
           * level camera's, times enableFactor_: 0 when the camera is enabled at the level start, +0.025 a frame).
           * upAngle turns the view (TriggerNewGravity -> GameScene -setCameraUpAngle:).
           */
          this.cam = {
            x: 0,
            y: 0,
            dstX: 0,
            dstY: 0,
            lastVX: 0,
            lastVY: 0,
            dampX: 0,
            curHeight: 0,
            vRay: 130,
            zoom: 1,
            camZoom: 1,
            refZoom: 1,
            lastWant: 1,
            defaultZoom: 1,
            zoomSmooth: 0.03,
            defaultSmooth: 0.03,
            smoothX: 1,
            smoothY: 1,
            enableFactor: 0,
            followX: 0.055,
            followY: 0.07,
            xOffset: 15,
            curXOffset: 15,
            shakeTime: 0,
            shakePower: 0,
            shakePhaseX: 0,
            shakePhaseY: 0,
            upAngle: 0,
            dstUpAngle: 0
          };
          this.joints = new Map();
          this.bodies = new Map();
          this.timeScale = 1;
          this.slowMoTime = 0;
          this.minY = Infinity;
          this.builder = void 0;
          /** Initial state of every level body and barrel, restored when the bike respawns. */
          this.initialBodies = new Map();
          this.initialBarrels = new Map();
          this.checkpointReached = false;
          this.checkpointNitro = 0;
          /** Entities that belong to a group (prefab parts, pickups...): boundaries never fade them. */
          this.grouped = new Set();
          /** Bodies that touched a boundary (action 6) during the last step. */
          this.boundaryTouches = [];
          this.fading = new Map();
          /** Objects that faded out: hidden until the level resets. */
          this.fadedOut = new Set();
          /** Trigger action 3: regions the bike just left (their "leaveEvent" is sent after the step). */
          this.deactivations = [];
          this.headlight = null;
          this.drones = [];
          /**
           * Render interpolation: body poses before the last physics step. Drawing lerps between them
           * and the current poses by the leftover time, so a frame that ran 0 or 2 fixed steps doesn't jerk.
           */
          this.prevPose = new Map();
          this.stepId = 0;
          this.alpha = 1;
          this.droneOf = new Map();
          /** Interpolated pose of a body for drawing. */
          this.pose = b => {
            const p = b.getPosition();
            const e = this.prevPose.get(b);
            if (!e || e.step !== this.stepId) return {
              x: p.x,
              y: p.y,
              a: b.getAngle()
            };
            const t = this.alpha;
            return {
              x: e.x + (p.x - e.x) * t,
              y: e.y + (p.y - e.y) * t,
              a: e.a + (b.getAngle() - e.a) * t
            };
          };
          this.host = host;
          this.events = events;
        }
        static async start(host, levelId, events) {
          const s = new GameSession(host, events);
          await s.load(levelId);
          return s;
        }
        async load(levelId) {
          var _ents$this$level$bike, _ref;
          this.level = await loadLevel(levelId, getSelectedBike());
          const cfgName = configNameFor(levelId);
          const cfg = await loadJson(`config/${cfgName}`).catch(() => null);
          this.gravity = (cfg == null ? void 0 : cfg.gy) ?? DEFAULT_GRAVITY;
          await setStylePack(await stylePackFor(levelId, cfgName));

          // -[Physics initPhysics] turns continuous collision off (b2World::SetContinuousPhysics(false)):
          // no TOI sub-steps, fast wheels just sink into corners and get pushed out by the solver
          this.world = new World({
            gravity: {
              x: 0,
              y: this.gravity
            },
            continuousPhysics: false
          });
          this.parallax = new ParallaxView(this.host);
          if (cfg != null && cfg.laxpath) {
            const name = cfg.laxpath.split('/').pop().replace('.plist', '');
            await this.parallax.build(name);
          }
          this.worldView = new WorldView(this.host);
          await loadAtlas('ExplosionSheet');
          await loadAtlas('menusheet_hd');
          const builder = new PhysicsBuilder(this.world, this.level.entities);
          this.ground = builder.ground;
          this.builder = builder;
          builder.build();
          this.joints = builder.joints;
          this.bodies = builder.bodies;
          await this.worldView.build(this.level.entities, builder.bodies);
          await this.worldView.buildRopes(this.level.entities, builder.joints);
          builder.bodies.forEach(b => {
            for (let f = b.getFixtureList(); f; f = f.getNext()) {
              const aabb = f.getAABB(0);
              if (aabb) this.minY = Math.min(this.minY, aabb.lowerBound.y);
            }
          });
          this.collectDrones(builder);
          this.collectTriggers(builder);
          this.collectHazards(builder);
          builder.bodies.forEach(b => {
            const p = b.getPosition();
            this.initialBodies.set(b, {
              x: p.x,
              y: p.y,
              a: b.getAngle(),
              awake: b.isAwake()
            });
          });
          this.barrels.forEach((v, b) => this.initialBarrels.set(b, v));
          this.level.entities.forEach((e, i) => {
            if (e.Type !== 'WaterTrigger') return;
            this.waters.push(new WaterArea(this.world, i, e));
          });
          for (const w of this.waters) await this.worldView.addWater(w);
          const ents = this.level.entities;
          const bikeEnt = (_ents$this$level$bike = ents[this.level.bikeGroup]) == null ? void 0 : _ents$this$level$bike.Properties;
          if (!bikeEnt) throw new Error('level has no bike');
          this.bikeParams = {
            speedLimit: bikeEnt.speedLimit || 130,
            maxWheelieSpeed: bikeEnt.maxWheelieSpeed || 150,
            forceScale: bikeEnt.forceScale || 1,
            tilt: bikeEnt.tilt || 1,
            nitroPerformance: bikeEnt.nitroPerformance || 1,
            burnoutSpeed: bikeEnt.burnoutSpeed || 1,
            geyserPower: bikeEnt.geyserPower || 1,
            scale: bikeEnt.scale ?? 1
          };
          this.spawn = {
            x: bikeEnt.position[0],
            y: bikeEnt.position[1]
          };

          // the level's main camera. EditorCameraClassic (1-5, 1-20) is a fixed camera zone the original never
          // switches to: it overrides -Activate while its trigger sends -Activate:
          const camEnt = (_ref = ents.find(e => e.Type === 'EditorCamera') || ents.find(e => e.Type === 'EditorCameraClassic')) == null ? void 0 : _ref.Properties;
          if (camEnt) {
            // set while loading, so they also become Camera defaultZoom_ / defaultSmooth_
            this.cam.camZoom = this.cam.defaultZoom = camEnt.zoom ?? 1;
            this.cam.zoomSmooth = this.cam.defaultSmooth = camEnt.zoomSmooth ?? 0.03;
            this.cam.followX = camEnt.followSmoothX ?? 0.055;
            this.cam.followY = camEnt.followSmoothY ?? 0.07;
            this.cam.smoothX = camEnt.smoothX ?? 1;
            this.cam.smoothY = camEnt.smoothY ?? 1;
          }
          this.world.on('begin-contact', c => {
            this.sensorContact(c, true);
            this.onContact(c);
            if (this.drones.length) this.droneContact(c);
          });
          this.world.on('end-contact', c => this.sensorContact(c, false));
          this.effects = new BikeEffects(this.worldView, bikeEnt == null ? void 0 : bikeEnt.definition, this.level.id);
          await this.effects.load();
          await this.spawnBike();
        }
        async spawnBike() {
          var _this$effects;
          if (this.bike) {
            for (const b of this.bike.bodies) this.waters.forEach(w => w.forget(b));
            this.bike.destroy(this.worldView);
            // destroyed bodies may not report end-contact: recount sensor contacts from scratch
            for (const r of this.regions) r.contacts = 0;
            for (const w of this.waters) w.clearBodies();
            for (let c = this.world.getContactList(); c; c = c.getNext()) {
              if (c.isTouching()) this.sensorContact(c, true, true);
            }
            this.activations = [];
          }
          this.headlight = null;
          this.bike = await Bike.spawn(this.world, this.ground, this.level.entities, this.worldView, this.level.bikePrefab, this.bikeParams, this.spawn.x, this.spawn.y, this.gravity);
          this.crashRequested = false;
          this.lavaExplodeTimer = -1;
          this.respawnTimer = -1;
          this.cameraHeld = false;
          (_this$effects = this.effects) == null || _this$effects.reset();
          this.snapCamera();
        }

        /** Geysers (tag 3 sensor area pushing things up) and explosive barrels/presents. */
        collectHazards(builder) {
          const ents = this.level.entities;
          for (let i = 0; i < ents.length; i++) {
            const e = ents[i];
            const def = e.Properties.definition || e.Type;
            if (def !== 'Geyser' && def !== 'ExplosiveBarrel' && def !== 'ExplosiveTimer' && def !== 'ExplosiveBarrelRoll') continue;
            for (const c of groupChildren(ents, i)) {
              const body = builder.bodies.get(c);
              if (!body) continue;
              if (def === 'Geyser') {
                const p = e.Properties;
                this.geysers.push({
                  body,
                  power: (p.power ?? 1) * (p.objPower ?? 1),
                  periodic: !!p.isPeriodic,
                  awake: p.awakeTime || 0.5,
                  sleep: p.sleepTime || 0.5,
                  t: 0
                });
              } else if (body.isDynamic()) {
                this.barrels.set(body, {
                  group: i,
                  minPressure: e.Properties.minPressure || 800,
                  damage: e.Properties.damage ?? 1,
                  z: e.Properties.explosionZ
                });
              }
            }
          }
          this.world.on('post-solve', (c, impulse) => {
            let sum = 0;
            for (const v of (impulse == null ? void 0 : impulse.normalImpulses) || []) sum += v;
            for (const b of [c.getFixtureA().getBody(), c.getFixtureB().getBody()]) {
              const info = this.barrels.get(b);
              if (info && sum > info.minPressure * EXPLOSION_PRESSURE_SCALE) this.pendingExplosions.add(b);
            }
          });
        }
        updateGeysers(dt) {
          const bike = this.bike;
          if (!bike) return;
          const g = Math.abs(this.gravity);
          for (const gz of this.geysers) {
            gz.t += dt;
            if (gz.periodic && gz.t % (gz.awake + gz.sleep) > gz.awake) continue;
            const f = gz.body.getFixtureList();
            if (!f) continue;
            const up = gz.body.getWorldVector({
              x: 0,
              y: 1
            });
            for (const b of bike.bodies) {
              if (!f.testPoint(b.getWorldCenter())) continue;
              const k = b.getMass() * g * GEYSER_FORCE * gz.power * (this.bikeParams.geyserPower || 1);
              b.applyForceToCenter({
                x: up.x * k,
                y: up.y * k
              }, true);
            }
          }
        }
        explode(body) {
          const info = this.barrels.get(body);
          if (!info) return;
          this.barrels.delete(body);
          const c = body.getWorldCenter();
          // kept (inactive) so a level reset can bring the barrel back
          body.setActive(false);
          for (const n of groupChildren(this.level.entities, info.group)) {
            for (const node of this.worldView.nodesOf.get(n) || []) this.worldView.show(node, false);
          }
          this.explodeAt(c.x, c.y, info.damage, info.z);
        }

        /** BikeCommon1 -update: with willExplode set: the wheels come off, GameLogic -explodeAt:Damage:0.5. */
        explodeBike() {
          const bike = this.bike;
          if (!bike || bike.exploded) return;
          bike.explode();
          const c = bike.frame.getPosition();
          this.explodeAt(c.x, c.y, 0.5);
        }

        /**
         * GameLogic -explodeAt:Damage:Node: fireball, push dynamic bodies away, kill a rider close by. The fireball
         * is drawn at `z` among the level visuals (a barrel's "explosionZ": under water it stays behind the
         * surface), or over everything.
         */
        explodeAt(x, y, damage, z) {
          var _this$events$onExplos, _this$events;
          const at = {
            x,
            y
          };
          this.worldView.explosion(at.x, at.y, z);
          this.shake(20, 0.6);
          (_this$events$onExplos = (_this$events = this.events).onExplosion) == null || _this$events$onExplos.call(_this$events);
          for (let b = this.world.getBodyList(); b; b = b.getNext()) {
            if (!b.isDynamic()) continue;
            const p = b.getWorldCenter();
            const dx = p.x - at.x,
              dy = p.y - at.y;
            const dist = Math.hypot(dx, dy);
            if (dist > EXPLOSION_RADIUS || dist < 1e-3) continue;
            const s = (1 - dist / EXPLOSION_RADIUS) * EXPLOSION_IMPULSE * b.getMass() * damage;
            b.applyLinearImpulse({
              x: dx / dist * s,
              y: dy / dist * s + s * 0.3
            }, p, true);
          }
          const bp = this.bike.frame.getWorldCenter();
          if (Math.hypot(bp.x - at.x, bp.y - at.y) < EXPLOSION_RADIUS * 0.6 && !this.finished) this.crashRequested = true;
        }

        /** World 4 drones (Drone groups): their sensors and AI live in Drone. */
        collectDrones(builder) {
          const ents = this.level.entities;
          for (let i = 0; i < ents.length; i++) {
            if (ents[i].Type !== 'Drone') continue;
            const d = new Drone({
              world: this.world,
              bikeHead: () => {
                var _this$bike;
                return ((_this$bike = this.bike) == null ? void 0 : _this$bike.head) || null;
              },
              killBike: () => {
                var _this$bike2;
                if (!this.finished && !((_this$bike2 = this.bike) != null && _this$bike2.crashed)) this.crashRequested = true;
              },
              explodeAt: (x, y, damage) => this.explodeAt(x, y, damage),
              sound: name => {
                var _this$events$onSound, _this$events2;
                return (_this$events$onSound = (_this$events2 = this.events).onSound) == null ? void 0 : _this$events$onSound.call(_this$events2, name);
              },
              nodesOf: idx => this.worldView.nodesOf.get(idx) || [],
              show: (node, on) => this.worldView.show(node, on)
            }, ents, i, groupChildren(ents, i), builder.bodies, builder.joints);
            this.drones.push(d);
            d.bodies.forEach(b => this.droneOf.set(b, d));
          }
        }

        /** Drone -addContact:FixtureA:FixtureB: */
        droneContact(c) {
          for (const [fs, fo] of [[c.getFixtureA(), c.getFixtureB()], [c.getFixtureB(), c.getFixtureA()]]) {
            var _this$droneOf$get;
            const u = fs.getUserData();
            if (fo.isSensor()) continue;
            const other = fo.getBody();
            if (u != null && u.drone) {
              var _this$bike3;
              u.drone.onSensor(u.part, other, !!((_this$bike3 = this.bike) != null && _this$bike3.owns(other)));
              continue;
            }
            if (!fs.isSensor()) (_this$droneOf$get = this.droneOf.get(fs.getBody())) == null || _this$droneOf$get.onHit(other);
          }
        }
        collectTriggers(builder) {
          const ents = this.level.entities;
          const kindOf = (type, def) => {
            const t = def || type;
            if (t.startsWith('TriggerWin')) return 'win';
            if (t.startsWith('Checkpoint')) return 'checkpoint';
            if (t === 'Nitro') return 'nitro';
            if (t.startsWith('Spikes')) return 'kill';
            if (t === 'TriggerClockBad' || t === 'TriggerClockBadDyn') return 'clockBad';
            if (t.startsWith('TriggerClock')) return 'clockGood';
            if (t === 'TriggerNewGravity') return 'gravity';
            return null;
          };
          const inGroup = new Set();
          for (let i = 0; i < ents.length; i++) {
            const e = ents[i];
            const kind = kindOf(e.Type, e.Properties.definition);
            if (!kind) continue;
            const children = groupChildren(ents, i);
            children.forEach(c => inGroup.add(c));
            for (const c of children) {
              const ce = ents[c];
              if (ce.Type === 'EditorTrigger') this.regions.push(this.regionOf(kind, i, ce, e));
              if (kind === 'kill' && builder.bodies.has(c)) this.killBodies.add(builder.bodies.get(c));
            }
          }
          // any other trigger flagged "kill" (pits...), and camera / motor / ... triggers (drones handle their own)
          const droneOwned = new Set();
          for (const d of this.drones) d.ownTriggers.forEach(i => droneOwned.add(i));
          for (let i = 0; i < ents.length; i++) {
            const e = ents[i];
            if (e.Type !== 'EditorTrigger' || inGroup.has(i) || droneOwned.has(i)) continue;
            let r;
            // boundaries (action 6) handle their own kill flag: they also clear debris
            if (e.Properties.kill && e.Properties.action !== ACTION_BOUNDARY) r = this.regionOf('kill', i, e, e);else if (HANDLED_ACTIONS.has(e.Properties.action)) {
              r = this.regionOf('action', i, e, e);
              r.data = e.Properties;
            } else continue;
            const mount = builder.bodies.get(e.Properties.refentity);
            if (mount && !mount.isStatic()) r.mount = mount;
            this.regions.push(r);
          }
          for (const r of this.regions) this.createSensor(r);
          for (let i = 0; i < ents.length; i++) {
            if (Array.isArray(ents[i].Properties.refobjectList)) groupChildren(ents, i).forEach(c => this.grouped.add(c));
          }
        }
        createSensor(r) {
          const body = r.mount || this.world.createBody({
            type: 'static',
            position: {
              x: r.x,
              y: r.y
            },
            angle: r.rot
          });
          // mounted sensors are placed in the body's frame (bodies are created with angle 0)
          const center = r.mount ? {
            x: r.x - r.mount.getPosition().x,
            y: r.y - r.mount.getPosition().y
          } : {
            x: 0,
            y: 0
          };
          const angle = r.mount ? r.rot : 0;
          const shape = r.shape === 0 ? new CircleShape(center, Math.max(0.05, r.r)) : new BoxShape(Math.max(0.05, r.w / 2), Math.max(0.05, r.h / 2), center, angle);
          body.createFixture(shape, {
            isSensor: true,
            density: 0,
            userData: r
          });
        }

        /** Sensor bookkeeping (from begin/end-contact); activations run after the step. */
        sensorContact(c, begin, recount = false) {
          for (const [fs, fo] of [[c.getFixtureA(), c.getFixtureB()], [c.getFixtureB(), c.getFixtureA()]]) {
            var _fs$getUserData, _this$events$onSound2, _this$events3, _this$level$entities$;
            const w = (_fs$getUserData = fs.getUserData()) == null ? void 0 : _fs$getUserData.water;
            if (!w) continue;
            const bike = this.bike;
            // WaterTrigger -addContact: the rider's head diving in makes the splash sound
            if (w.contact(c, fo, begin, (bike == null ? void 0 : bike.head) || null, !recount)) (_this$events$onSound2 = (_this$events3 = this.events).onSound) == null || _this$events$onSound2.call(_this$events3, w.fluidType === 1 || w.fluidType === 5 ? 'LavaDive' : 'WaterDeath');
            // BikeCommon1 -addContact: the frame entering a tag 2 entity: a live bike dies ("kill",
            // object "water") and the camera stops following it; the frame always sinks
            if (begin && !recount && bike && fo.getBody() === bike.frame && ((_this$level$entities$ = this.level.entities[w.idx]) == null ? void 0 : _this$level$entities$.Properties.tag) === 2) {
              if (!bike.crashed && !this.finished) {
                this.crashRequested = true;
                this.cameraHeld = true;
              }
              bike.sink();
            }
            // lava: the bike frame going in blows the bike up 0.5 s later (-explodeBike: -> setWillExplode:)
            if (begin && !recount && w.fluidType === 1 && bike && fo.getBody() === bike.frame && !bike.exploded && this.lavaExplodeTimer < 0) {
              this.lavaExplodeTimer = LAVA_EXPLODE_DELAY;
            }
          }
          for (const [fs, fo] of [[c.getFixtureA(), c.getFixtureB()], [c.getFixtureB(), c.getFixtureA()]]) {
            var _this$bike4, _other$getUserData, _r$data, _r$data2;
            const r = fs.getUserData();
            if (!r || r.contacts === undefined || fo.isSensor()) continue;
            const other = fo.getBody();
            const isBike = !!((_this$bike4 = this.bike) != null && _this$bike4.owns(other));
            // group triggers (finish, checkpoints, pickups, spikes) only react to the bike
            if (r.kind !== 'action' && !isBike) continue;
            if (r.kind === 'action' && r.collideTag !== 99 && ((_other$getUserData = other.getUserData()) == null ? void 0 : _other$getUserData.tag) !== r.collideTag) continue;
            if (begin && r.kind === 'action' && ((_r$data = r.data) == null ? void 0 : _r$data.action) === ACTION_BOUNDARY) this.boundaryTouches.push({
              r,
              body: other
            });
            r.contacts += begin ? 1 : -1;
            if (begin && r.contacts === 1) this.activations.push(r);
            if (!begin && r.contacts === 0 && r.kind === 'action' && ((_r$data2 = r.data) == null ? void 0 : _r$data2.action) === ACTION_EVENT) this.deactivations.push(r);
            if (r.contacts < 0) r.contacts = 0;
          }
        }
        processActivations() {
          var _this$events$onNitro, _this$events5;
          const left = this.deactivations;
          this.deactivations = [];
          for (const r of left) if (r.data.leaveEvent) this.sendEvent(r.data.leaveEvent);
          const list = this.activations;
          this.activations = [];
          const bike = this.bike;
          for (const r of list) {
            if (r.kind === 'action') {
              if (r.data.action !== ACTION_BOUNDARY) this.runAction(r.data);
              continue;
            }
            if (!bike || this.finished || r.used && r.kind !== 'kill') continue;
            switch (r.kind) {
              case 'win':
                if (!bike.crashed) this.finish();
                break;
              case 'checkpoint':
                if (!bike.crashed) {
                  var _this$events$onCheckp, _this$events4;
                  r.used = true;
                  const pos = r.data || [r.x, r.y];
                  this.spawn = {
                    x: pos[0],
                    y: pos[1]
                  };
                  this.checkpointReached = true;
                  this.checkpointNitro = this.nitroCount;
                  (_this$events$onCheckp = (_this$events4 = this.events).onCheckpoint) == null || _this$events$onCheckp.call(_this$events4);
                }
                break;
              case 'nitro':
                r.used = true;
                this.nitroCount++;
                this.hideGroup(r.group);
                (_this$events$onNitro = (_this$events5 = this.events).onNitro) == null || _this$events$onNitro.call(_this$events5, this.nitroCount);
                break;
              case 'clockGood':
              case 'clockBad':
                r.used = true;
                this.time = Math.max(0, this.time + (r.kind === 'clockGood' ? -CLOCK_BONUS : CLOCK_BONUS));
                this.hideGroup(r.group);
                break;
              case 'gravity':
                {
                  r.used = true;
                  const ang = (r.data || 0) * Math.PI / 180;
                  const g = Math.abs(this.gravity);
                  this.world.setGravity({
                    x: g * Math.sin(ang),
                    y: -g * Math.cos(ang)
                  });
                  this.cam.dstUpAngle = r.data || 0;
                  break;
                }
              case 'kill':
                if (!bike.crashed) this.crashRequested = true;
                break;
            }
          }
        }

        /**
         * Trigger -processBoundaryTouch (action 6), for everything that touched the boundary: a loose
         * physics object (not in a group, not "dontFadeOut") loses its joints and fades out; the
         * bike dies if the boundary is flagged "kill".
         */
        processBoundaryTouches() {
          const list = this.boundaryTouches;
          this.boundaryTouches = [];
          for (const {
            r,
            body
          } of list) {
            var _this$bike5, _body$getUserData;
            if ((_this$bike5 = this.bike) != null && _this$bike5.owns(body)) {
              if (r.data.kill && !this.bike.crashed && !this.finished) this.crashRequested = true;
              continue;
            }
            const idx = (_body$getUserData = body.getUserData()) == null ? void 0 : _body$getUserData.idx;
            if (idx == null || idx < 0 || this.bodies.get(idx) !== body) continue;
            if (this.grouped.has(idx) || this.level.entities[idx].Properties.dontFadeOut) continue;
            if (!body.isActive() || this.fading.has(body)) continue;
            this.joints.forEach((j, k) => {
              if (j.getBodyA() === body || j.getBodyB() === body) {
                this.world.destroyJoint(j);
                this.joints.delete(k);
              }
            });
            this.fading.set(body, {
              idx,
              alpha: 1
            });
          }
        }
        updateFading(dt) {
          this.fading.forEach((f, body) => {
            f.alpha = Math.max(0, f.alpha - FADE_OUT_SPEED * dt);
            this.worldView.setOpacity(this.ownersOf(f.idx), f.alpha);
            if (f.alpha <= 0) {
              this.fading.delete(body);
              this.fadedOut.add(f.idx);
              this.setLoaded(f.idx, body, false);
            }
          });
        }

        /**
         * Trigger action 3 posts a notification. The bike listens to "enablelight"/"disablelight"
         * (BikeCommon1 -enableLight: / -disableLight:); "a_*" names are achievements.
         */
        sendEvent(name) {
          if (name === 'enablelight') this.setHeadlight(true);else if (name === 'disablelight') this.setHeadlight(false);
        }

        /**
         * BikeCommon1 -loadLight: two "bikelight.png" sprites on the bike body sprite, anchor (0, 0.5),
         * scale 3.33, blend (DST_COLOR, ONE) so they brighten what is behind them, faded in over 0.2 s.
         */
        setHeadlight(on) {
          var _this$worldView$nodes, _ents$this$level$bike2;
          if (!on) {
            var _this$headlight;
            (_this$headlight = this.headlight) == null || _this$headlight.forEach(n => n.isValid && n.destroy());
            this.headlight = null;
            return;
          }
          if (this.headlight || !this.bike) return;
          const ents = this.level.entities;
          const [from, to] = this.bike.range;
          let bodySprite = null;
          for (let i = from; i < to && bodySprite == null; i++) {
            var _p$mountedSprites;
            const p = ents[i].Properties;
            if (ents[i].Type === 'EditorPhysicsObject' && p.tag === -1 && p.subtag === 2) bodySprite = (_p$mountedSprites = p.mountedSprites) == null ? void 0 : _p$mountedSprites[0];
          }
          const parent = bodySprite != null ? (_this$worldView$nodes = this.worldView.nodesOf.get(bodySprite)) == null ? void 0 : _this$worldView$nodes[0] : null;
          const frame = getFrame('bikelight.png', 'menusheet_hd');
          if (!parent || !frame) return;
          if (!GameSession.lightMaterial) {
            const m = new Material();
            m.initialize({
              effectAsset: builtinResMgr.get('ui-sprite-material').effectAsset,
              defines: {
                USE_TEXTURE: true
              },
              states: {
                blendState: {
                  targets: [{
                    blend: true,
                    blendSrc: gfx.BlendFactor.DST_COLOR,
                    blendDst: gfx.BlendFactor.ONE,
                    blendSrcAlpha: gfx.BlendFactor.ZERO,
                    blendDstAlpha: gfx.BlendFactor.ONE
                  }]
                }
              }
            });
            GameSession.lightMaterial = m;
          }
          const tf = parent.getComponent(UITransform);
          const [lx, ly] = LIGHT_POS[(_ents$this$level$bike2 = ents[this.level.bikeGroup]) == null ? void 0 : _ents$this$level$bike2.Properties.definition] || DEFAULT_LIGHT_POS;
          // the body sprite's pixels: a sheet redrawn at a higher resolution has more of them
          const res = SHEET_RESOLUTION[BIKE_SHEETS[this.level.bikePrefab]] ?? 1;
          this.headlight = [0, 1].map(() => {
            const n = new Node('headlight');
            n.layer = Layers.Enum.UI_2D;
            const sp = n.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.RAW;
            sp.trim = false;
            sp.spriteFrame = frame;
            sp.customMaterial = GameSession.lightMaterial;
            sp.color = new Color(0, 0, 0, 255);
            n.getComponent(UITransform).setAnchorPoint(0, 0.5);
            n.setPosition(lx * res - tf.width * tf.anchorX, ly * res - tf.height * tf.anchorY);
            n.setScale(3.33333 * res, 3.33333 * res, 1);
            parent.addChild(n);
            // the texture is premultiplied grey: fading the tint from black is fading the light in
            const fade = {
              v: 0
            };
            tween(fade).to(0.2, {
              v: 255
            }, {
              onUpdate: () => n.isValid && (sp.color = new Color(fade.v, fade.v, fade.v, 255))
            }).start();
            return n;
          });
        }

        /** Trigger -update: actions (see ACTION_*). */
        runAction(p) {
          switch (p.action) {
            case ACTION_CAMERA:
              // the trigger's values (Trigger -init defaults) go to the main camera; the zoom only
              // becomes the reference for the in-air zoom
              this.cam.refZoom = p.zoom ?? 1;
              this.cam.vRay = p.vRayValue ?? 130;
              this.cam.zoomSmooth = p.smooth ?? 0.03;
              this.cam.xOffset = p.xOffset ?? 15;
              break;
            case ACTION_SHAKE:
              this.shake(p.shakePower ?? 6, p.shakeDuration ?? 2.5);
              break;
            case ACTION_MOTOR:
              // -setMotorTriggerAction:Speed:Accel: (accel 0 means instant, 9999)
              for (const o of p.objects || []) {
                const j = this.joints.get(o);
                if (!(j != null && j.enableMotor)) continue;
                j.enableMotor(!!p.enable);
                if (p.enable) this.motorRamps.set(j, {
                  target: p.speed || 0,
                  accel: p.acceleration || 9999
                });
                j.getBodyA().setAwake(true);
                j.getBodyB().setAwake(true);
              }
              break;
            case ACTION_UNLOAD:
              // Trigger -update case 1: every listed object is unloaded; physics objects take
              // every joint attached to them along
              for (const o of p.objects || []) {
                const jo = this.joints.get(o);
                if (jo) {
                  this.world.destroyJoint(jo);
                  this.joints.delete(o);
                  jo.getBodyA().setAwake(true);
                  jo.getBodyB().setAwake(true);
                  continue;
                }
                const b = this.bodies.get(o);
                if (!b) continue;
                this.joints.forEach((jj, k) => {
                  if (jj.getBodyA() === b || jj.getBodyB() === b) {
                    this.world.destroyJoint(jj);
                    this.joints.delete(k);
                  }
                });
                this.setLoaded(o, b, false);
              }
              break;
            case ACTION_LOAD:
              for (const o of p.objects || []) {
                const b = this.bodies.get(o);
                if (b) this.setLoaded(o, b, true);
              }
              break;
            case ACTION_EVENT:
              if (p.sendEvent) this.sendEvent(p.sendEvent);
              break;
            case ACTION_SLOW_MOTION:
              this.timeScale = 60 / (p.timestep || 120);
              this.slowMoTime = p.time || 1;
              break;
            case ACTION_WATER_LEVEL:
              for (const o of p.objects || []) {
                var _this$waters$find;
                (_this$waters$find = this.waters.find(w => w.idx === o)) == null || _this$waters$find.setDestination(p.waterOffset ?? 1, p.speedChange);
              }
              break;
            case ACTION_EXPLODE:
              // the listed objects are explosive barrel groups (1-1: the barrel under the bridge
              // goes off as the bike crosses, while action 1 breaks the bridge's joints)
              for (const o of p.objects || []) {
                this.barrels.forEach((info, b) => {
                  if (info.group === o) this.pendingExplosions.add(b);
                });
              }
              break;
            case ACTION_SOUND:
              {
                var _this$events$onSound3, _this$events6;
                const v = this.bike.frame.getLinearVelocity();
                if (Math.hypot(v.x, v.y) >= (p.speedTrigger || 0) && p.soundEvent) (_this$events$onSound3 = (_this$events6 = this.events).onSound) == null || _this$events$onSound3.call(_this$events6, p.soundEvent);
                break;
              }
          }
        }

        /**
         * Physics object load/unload (PhysicsObject -loadEntity / -unloadEntity): only the body comes and
         * goes. The terrain mesh and mounted sprites stay drawn, so a level can switch which half of a
         * loop the bike collides with (1-2: the z 2 front and z -6 back rock) without either vanishing.
         */
        setLoaded(idx, body, on) {
          body.setActive(on);
        }

        /** The entity and the sprites mounted on it. */
        ownersOf(idx) {
          var _this$level$entities$2;
          const p = ((_this$level$entities$2 = this.level.entities[idx]) == null ? void 0 : _this$level$entities$2.Properties) || {};
          const owners = [idx, ...(p.mountedSprites || [])];
          if (p.refsprite1 != null && p.refsprite1 >= 0) owners.push(p.refsprite1);
          return owners;
        }
        regionOf(kind, group, t, g) {
          var _p$position, _p$position2;
          const p = t.Properties;
          let w = p.width || 0;
          if (kind === 'kill' && g.Properties.XRepeat) w *= g.Properties.XRepeat;
          return {
            kind,
            group,
            shape: p.shape ?? 1,
            x: ((_p$position = p.position) == null ? void 0 : _p$position[0]) || 0,
            y: ((_p$position2 = p.position) == null ? void 0 : _p$position2[1]) || 0,
            w,
            h: p.height || 0,
            r: p.radius || 0,
            rot: (p.rotation || 0) * Math.PI / 180,
            collideTag: p.collideTag ?? -1,
            used: false,
            contacts: 0,
            data: kind === 'gravity' ? g.Properties.angle || 0 : kind === 'checkpoint' ? g.Properties.position : null
          };
        }
        onContact(c) {
          const a = c.getFixtureA().getBody(),
            b = c.getFixtureB().getBody();
          const bike = this.bike;
          if (!bike || bike.crashed || this.finished) return;
          for (const [mine, other] of [[a, b], [b, a]]) {
            if (!bike.owns(mine) || bike.owns(other)) continue;
            if (this.killBodies.has(other)) {
              this.crashRequested = true;
              return;
            }
            // -addContact: only the head is fatal, against "Collider" (tag 1) or tag 7 objects
            const oinfo = other.getUserData();
            const solid = !c.getFixtureA().isSensor() && !c.getFixtureB().isSensor();
            if (mine === bike.head && solid && ((oinfo == null ? void 0 : oinfo.tag) === 1 || (oinfo == null ? void 0 : oinfo.tag) === 7) && bike.headHitIsFatal(other)) {
              this.crashRequested = true;
              this.headHit = true;
              return;
            }
            // the frame falling into water: sensorContact (it also sinks the frame)
          }
        }

        /**
         * EntityManager -reset (run on every respawn): every level entity is unloaded and loaded
         * again, so moved/fallen objects, opened gates, exploded barrels and pickups come back.
         * Without a checkpoint the run restarts (GameLogicMain -reset: time 0).
         */
        resetLevel() {
          var _this$events$onNitro2, _this$events7;
          this.initialBodies.forEach((s, b) => {
            b.setActive(true);
            b.setTransform({
              x: s.x,
              y: s.y
            }, s.a);
            b.setLinearVelocity({
              x: 0,
              y: 0
            });
            b.setAngularVelocity(0);
            b.setAwake(s.awake);
          });
          // faded objects come back (opacity 1 only on what was faded: no UIOpacity added to every object)
          this.fading.forEach(f => this.worldView.setOpacity(this.ownersOf(f.idx), 1));
          this.fadedOut.forEach(idx => this.worldView.setOpacity(this.ownersOf(idx), 1));
          this.fading.clear();
          this.fadedOut.clear();
          this.boundaryTouches = [];
          this.bodies.forEach((b, idx) => this.setLoaded(idx, b, true));
          this.builder.rebuildJoints();
          this.joints = this.builder.joints;
          this.worldView.rebindRopes(this.joints);
          for (const d of this.drones) d.reset(this.joints);
          this.motorRamps.clear();
          this.barrels.clear();
          this.pendingExplosions.clear();
          this.initialBarrels.forEach((v, b) => {
            this.barrels.set(b, v);
            for (const n of groupChildren(this.level.entities, v.group)) {
              for (const node of this.worldView.nodesOf.get(n) || []) this.worldView.show(node, true);
            }
          });
          for (const r of this.regions) {
            if (r.kind === 'checkpoint' || r.kind === 'win') continue;
            if (r.used && r.kind !== 'kill' && r.kind !== 'action') {
              for (const c of groupChildren(this.level.entities, r.group)) {
                for (const n of this.worldView.nodesOf.get(c) || []) this.worldView.show(n, true);
              }
            }
            r.used = false;
          }
          for (const w of this.waters) w.reset();
          for (const g of this.geysers) g.t = 0;
          this.timeScale = 1;
          this.slowMoTime = 0;
          // Camera -reset (vRayValue and the current x offset are kept); the position snaps in spawnBike
          const cam = this.cam;
          cam.refZoom = 1;
          cam.xOffset = 15;
          cam.camZoom = cam.defaultZoom;
          cam.zoomSmooth = cam.defaultSmooth;
          this.nitroTime = 0; // BikeCommon1 -reset: -setUsingNitro:NO
          this.nitroCount = this.checkpointReached ? this.checkpointNitro : 0;
          (_this$events$onNitro2 = (_this$events7 = this.events).onNitro) == null || _this$events$onNitro2.call(_this$events7, this.nitroCount);
          if (!this.checkpointReached) this.time = 0;
        }
        hideGroup(group) {
          for (const c of groupChildren(this.level.entities, group)) {
            for (const n of this.worldView.nodesOf.get(c) || []) this.worldView.show(n, false);
          }
        }
        finish() {
          var _this$events$onFinish, _this$events8;
          this.finished = true;
          this.bike.finished = true;
          const t = this.time;
          const stars = this.level.times.filter(th => t <= th).length;
          (_this$events$onFinish = (_this$events8 = this.events).onFinish) == null || _this$events$onFinish.call(_this$events8, t, stars);
        }
        useNitro() {
          if (this.nitroCount > 0 && this.nitroTime <= 0 && !this.bike.crashed) {
            var _this$events$onNitro3, _this$events9, _this$events$onNitroU, _this$events10;
            this.nitroCount--;
            this.nitroTime = 2.5;
            // Bike -consumeNitro:
            this.shake(5, 0.5);
            (_this$events$onNitro3 = (_this$events9 = this.events).onNitro) == null || _this$events$onNitro3.call(_this$events9, this.nitroCount);
            (_this$events$onNitroU = (_this$events10 = this.events).onNitroUse) == null || _this$events$onNitroU.call(_this$events10);
          }
        }
        update(dt, input) {
          var _this$effects3;
          if (this.paused || !this.bike) return;
          if (!this.started && (input.gas || input.brake || input.leanBack || input.leanForward)) this.started = true;
          dt = Math.min(dt, 0.1);
          if (this.started && !this.finished && !this.bike.crashed) this.time += dt;
          if (this.nitroTime > 0) this.nitroTime -= dt;
          if (this.slowMoTime > 0) {
            this.slowMoTime -= dt;
            if (this.slowMoTime <= 0) this.timeScale = 1;
          }

          // the original does not step the world before the first input: the bike waits exactly at its
          // spawn pose (stepping meanwhile lets it settle and roll back, shifting every later contact)
          if (this.started) this.accumulator += dt * this.timeScale;
          const bikeInput = {
            ...input,
            nitro: this.nitroTime > 0
          };
          // ... but runs -update: every frame meanwhile (rider pose, frame spin)
          if (!this.started) this.bike.update(bikeInput, TIME_STEP);
          while (this.accumulator >= TIME_STEP) {
            var _this$bike$head, _this$effects2;
            this.snapshotPoses();
            this.updateGeysers(TIME_STEP);
            for (const d of this.drones) d.update(TIME_STEP);
            for (const w of this.waters) w.step(this.world, TIME_STEP);
            this.motorRamps.forEach((m, j) => {
              const cur = j.getMotorSpeed();
              const step = m.accel * TIME_STEP;
              const next = cur < m.target ? Math.min(m.target, cur + step) : Math.max(m.target, cur - step);
              j.setMotorSpeed(next);
              if (next === m.target) this.motorRamps.delete(j);
            });
            this.world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
            // the original steps the world before BikeCommon1 -update: (its forces, torques and frame
            // spin act on the next step), so the first step after the start runs without throttle
            this.bike.update(bikeInput, TIME_STEP);
            this.lastHeadSpeed = this.headSpeed;
            const hv = (_this$bike$head = this.bike.head) == null ? void 0 : _this$bike$head.getLinearVelocity();
            this.headSpeed = hv ? Math.hypot(hv.x, hv.y) : 0;
            (_this$effects2 = this.effects) == null || _this$effects2.step(this.bike, bikeInput, TIME_STEP);
            this.accumulator -= TIME_STEP;
            if (this.lavaExplodeTimer >= 0 && (this.lavaExplodeTimer -= TIME_STEP) < 0) this.explodeBike();
            if (this.pendingExplosions.size) {
              const list = Array.from(this.pendingExplosions);
              this.pendingExplosions.clear();
              list.forEach(b => this.explode(b));
            }
            if (this.finished) this.crashRequested = false;
            if (!this.crashRequested) this.headHit = false;
            if (this.crashRequested && !this.bike.crashed) {
              var _this$events$onCrash, _this$events11;
              // BikeCommon1 -update: a head hit that stopped the head hard shakes the screen
              if (this.headHit && this.lastHeadSpeed - this.headSpeed > 20) {
                this.shake((this.lastHeadSpeed - 168) * 0.10135135 + 17, 0.6);
              }
              this.bike.crash();
              this.respawnTimer = RESPAWN_DELAY;
              (_this$events$onCrash = (_this$events11 = this.events).onCrash) == null || _this$events$onCrash.call(_this$events11);
            }
            this.processActivations();
            this.processBoundaryTouches();
          }
          this.updateFading(dt);
          if (!this.bike.crashed && !this.finished && this.bike.position.y < this.minY - 60) {
            this.crashRequested = true;
          }
          if (this.respawnTimer > 0) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
              this.world.setGravity({
                x: 0,
                y: this.gravity
              });
              this.cam.dstUpAngle = 0;
              this.resetLevel();
              this.spawnBike();
              this.forgetPoses();
            }
          }
          this.alpha = Math.min(1, this.accumulator / TIME_STEP);
          this.worldView.sync(this.pose);
          (_this$effects3 = this.effects) == null || _this$effects3.sync(this.bike, this.pose, dt);
          this.updateCamera(dt);
        }
        snapshotPoses() {
          const id = ++this.stepId;
          for (let b = this.world.getBodyList(); b; b = b.getNext()) {
            if (b.isStatic() || !b.isAwake()) continue;
            const p = b.getPosition();
            let e = this.prevPose.get(b);
            if (!e) this.prevPose.set(b, e = {
              x: 0,
              y: 0,
              a: 0,
              step: 0
            });
            e.x = p.x;
            e.y = p.y;
            e.a = b.getAngle();
            e.step = id;
          }
        }

        /** Teleports (respawn, level reset) must not be interpolated. */
        forgetPoses() {
          this.prevPose.clear();
          this.stepId++;
        }
        /**
         * Camera -followBody:Damping: (per 60 Hz frame): a damped copy of the target trails it and the
         * camera sits at target + (target - damped), i.e. it leads in the direction of motion.
         * -speedZoom zooms out with speed: zoom - |v| / 700, at least 0.3.
         */
        updateCamera(dt) {
          const c = this.cam;
          const f = Math.min(3, dt * 60);
          let want = c.lastWant;
          if (this.cameraHeld) {
            // no follow entity: dstPosition_ += lastVector_, lastVector_ *= 0.8696 (per frame)
            c.dstX += c.lastVX * f;
            c.dstY += c.lastVY * f;
            const k = Math.pow(0.86956525, f);
            c.lastVX *= k;
            c.lastVY *= k;
          } else {
            const t = this.cameraTarget();
            want = c.lastWant = t.want;
            const px = c.dstX,
              py = c.dstY;
            c.dampX += (t.target.x - c.dampX) * Math.min(1, 2 * c.followX * f);
            c.curXOffset += (c.xOffset - c.curXOffset) * Math.min(1, f / 30);
            c.dstX = t.target.x + (t.target.x - c.dampX) + c.curXOffset;
            c.curHeight += (t.height - c.curHeight) * Math.min(1, 0.1 * f);
            c.dstY = c.curHeight;
            if (f > 0) {
              c.lastVX = (c.dstX - px) / f;
              c.lastVY = (c.dstY - py) / f;
            }
            c.enableFactor = Math.min(1, c.enableFactor + 0.025 * f);
          }
          // GameScene -setCameraPosition:Damping:dt:
          c.zoom += (want - c.zoom) * Math.min(1, c.zoomSmooth * f);
          c.x += (c.dstX - c.x) * Math.min(1, c.smoothX * c.enableFactor * f);
          c.y += (c.dstY - c.y) * Math.min(1, c.smoothY * c.enableFactor * f);
          this.applyCamera(dt);
        }

        /**
         * Camera -resetCamPosition: the damped point jumps to the rider and -followBody:Damping:0 /
         * -setCameraPosition:Damping:0 place the camera without smoothing (x offset, height, zoom).
         */
        snapCamera() {
          const c = this.cam;
          this.forgetPoses();
          const {
            target,
            height,
            want
          } = this.cameraTarget();
          c.dampX = target.x;
          c.x = c.dstX = target.x + c.xOffset;
          c.y = c.dstY = c.curHeight = height;
          c.lastVX = c.lastVY = 0;
          c.zoom = c.lastWant = want;
          this.applyCamera(0);
        }

        /** GameScene -shake:Duration: (a new shake replaces the running one). */
        shake(power, duration) {
          this.cam.shakePower = power;
          this.cam.shakeTime = duration;
        }

        /**
         * GameLogic -updateRaycastHeight (camera height; in the air the camera zoom is recomputed from
         * the reference zoom, down to 0.6, and otherwise kept) and Camera -speedZoom (zoom - |v| / 700,
         * at least 0.3).
         */
        cameraTarget() {
          const c = this.cam;
          const followed = this.bike.crashed ? this.bike.frame : this.bike.torso || this.bike.frame;
          const target = this.pose(followed);
          const vel = followed.getLinearVelocity();
          const groundY = this.groundBelow(target.x, target.y, c.vRay);
          const d = target.y - groundY;
          if (d > 5) c.camZoom = Math.max(0.6, c.refZoom - (d - 5) / (c.vRay - 5) * 0.5);
          const mid = (target.y + groundY) * 0.5;
          const rise = vel.y - 70 > 0 && vel.y - 70 < 180 ? (vel.y - 70) * 0.02 : 0;
          const extra = d > 90 ? d - 90 : 0;
          const height = mid + rise * (target.y - mid) + extra - 15 * d / c.vRay + 15;
          const want = Math.max(0.3, c.camZoom - Math.hypot(vel.x, vel.y) / 700);
          return {
            target,
            height,
            want
          };
        }

        /** Closest solid, non-bike surface straight below (x, y) within `range`; y itself if none. */
        groundBelow(x, y, range) {
          let best = y;
          let bestFraction = 1;
          this.world.rayCast({
            x,
            y
          }, {
            x,
            y: y - range
          }, (fixture, point, _normal, fraction) => {
            if (fixture.isSensor() || this.bike.owns(fixture.getBody())) return -1;
            if (fraction < bestFraction) {
              bestFraction = fraction;
              best = point.y;
            }
            return fraction;
          });
          return best;
        }

        /**
         * GameScene -updateCamera:Zoom:dt:, `dt` seconds after the last call. The shake moves the eye only (not the
         * parallax): x by power / 4 and y by power points along two sine waves (+1.2 and +1.3 rad a frame), fading
         * out over its last half second. The up angle turns the world and the parallax layer (cocos2d rotation:
         * clockwise) and eases in by 2% a frame.
         */
        applyCamera(dt) {
          const c = this.cam;
          const f = Math.min(3, dt * 60);
          const scale = PX_PER_UNIT * c.zoom * VIEW_SCALE;
          let sx = 0,
            sy = 0;
          if (c.shakeTime > 0 && f > 0) {
            const power = c.shakeTime < 0.5 ? 2 * c.shakeTime * c.shakePower : c.shakePower;
            c.shakePhaseX += 1.2 * f;
            c.shakePhaseY += 1.3 * f;
            sx = power * 0.25 * Math.cos(c.shakePhaseX) / PX_PER_UNIT;
            sy = power * Math.sin(c.shakePhaseY) / PX_PER_UNIT;
            c.shakeTime -= dt;
          }
          c.upAngle += (c.dstUpAngle - c.upAngle) * Math.min(1, 0.02 * f);
          const ang = -c.upAngle;
          const rad = ang * Math.PI / 180,
            cos = Math.cos(rad),
            sin = Math.sin(rad);
          const n = this.worldView.root;
          n.setScale(scale, scale, 1);
          n.angle = ang;
          const px = -(c.x + sx) * scale,
            py = -(c.y + sy) * scale;
          n.setPosition(px * cos - py * sin, px * sin + py * cos);
          // the parallax follows the camera centre (GameScene cameraCenter, in points) with its own zoom
          // (ParallaxSprite -cameraZoom: 0.6 * zoom + 0.4)
          const vs = view.getVisibleSize();
          this.parallax.root.angle = ang;
          this.parallax.update(c.x * PX_PER_UNIT, c.y * PX_PER_UNIT, (0.6 * c.zoom + 0.4) * VIEW_SCALE, vs.width, vs.height);
          this.worldView.syncForeground(this.cam.x, this.cam.y);
          // what the screen shows, in level units, plus a margin for things about to scroll in (a turned view
          // shows the screen's bounding box)
          const k = 1.15 / (2 * scale);
          const ac = Math.abs(cos),
            as = Math.abs(sin);
          this.worldView.cull(c.x + sx, c.y + sy, (vs.width * ac + vs.height * as) * k, (vs.width * as + vs.height * ac) * k);
        }
        destroy() {
          var _this$effects4, _this$worldView, _this$parallax;
          (_this$effects4 = this.effects) == null || _this$effects4.destroy();
          this.effects = null;
          (_this$worldView = this.worldView) == null || _this$worldView.destroy();
          (_this$parallax = this.parallax) == null || _this$parallax.destroy();
          this.world = null;
          this.bike = null;
        }
      }
      exports('GameSession', GameSession);
      GameSession.lightMaterial = null;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Geometry.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        catmullRomClosed: catmullRomClosed,
        decomposeLikeOriginal: decomposeLikeOriginal,
        dedupe: dedupe,
        signedArea: signedArea,
        triangulate: triangulate
      });
      cclegacy._RF.push({}, "b2cb0GfnlhEM7sA4mY7pzrK", "Geometry", undefined);
      /** Polygon helpers: spline smoothing, triangulation and convex decomposition. */
      function signedArea(poly) {
        let a = 0;
        for (let i = 0, n = poly.length; i < n; i++) {
          const p = poly[i];
          const q = poly[(i + 1) % n];
          a += p.x * q.y - q.x * p.y;
        }
        return a / 2;
      }

      /** Remove consecutive near-duplicate points (Box2D rejects them). */
      function dedupe(poly, eps = 0.02) {
        const out = [];
        for (const p of poly) {
          const last = out[out.length - 1];
          if (!last || Math.abs(last.x - p.x) > eps || Math.abs(last.y - p.y) > eps) out.push({
            x: p.x,
            y: p.y
          });
        }
        while (out.length > 1) {
          const a = out[0];
          const b = out[out.length - 1];
          if (Math.abs(a.x - b.x) > eps || Math.abs(a.y - b.y) > eps) break;
          out.pop();
        }
        return out;
      }

      /**
       * Closed Catmull-Rom spline through every vertex. `segs[i]` is the number of
       * segments between vertex i and i+1 (the editor's per-vertex "segments").
       */
      function catmullRomClosed(pts, segs) {
        const n = pts.length;
        if (n < 3) return pts.slice();
        const out = [];
        for (let i = 0; i < n; i++) {
          const p0 = pts[(i - 1 + n) % n];
          const p1 = pts[i];
          const p2 = pts[(i + 1) % n];
          const p3 = pts[(i + 2) % n];
          const s = Math.max(1, Math.round(segs[i] || 1));
          for (let k = 0; k < s; k++) {
            const t = k / s;
            const t2 = t * t;
            const t3 = t2 * t;
            out.push({
              x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
              y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
            });
          }
        }
        return out;
      }
      function cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      }
      function pointInTri(p, a, b, c) {
        return cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
      }

      /** Ear clipping. Returns index triples into `poly` (any winding), CCW triangles. */
      function triangulate(poly) {
        const n = poly.length;
        if (n < 3) return [];
        const idx = [];
        for (let i = 0; i < n; i++) idx.push(i);
        if (signedArea(poly) < 0) idx.reverse();
        const tris = [];
        let guard = 0;
        while (idx.length > 3 && guard++ < n * n) {
          let clipped = false;
          for (let i = 0; i < idx.length; i++) {
            const ia = idx[(i - 1 + idx.length) % idx.length];
            const ib = idx[i];
            const ic = idx[(i + 1) % idx.length];
            const a = poly[ia],
              b = poly[ib],
              c = poly[ic];
            if (cross(a, b, c) <= 1e-9) continue; // reflex or degenerate
            let inside = false;
            for (const j of idx) {
              if (j === ia || j === ib || j === ic) continue;
              if (pointInTri(poly[j], a, b, c)) {
                inside = true;
                break;
              }
            }
            if (inside) continue;
            tris.push(ia, ib, ic);
            idx.splice(i, 1);
            clipped = true;
            break;
          }
          if (!clipped) {
            // self-intersecting input: drop a vertex to make progress
            idx.splice(0, 1);
          }
        }
        if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
        return tris;
      }

      /*
       * The original's physics polygon decomposition (PhysicsObject -createPolygon, libgame.so
       * 0x667984 / 0x66817c / 0x629478): clean the outline, Mark Bayazit's convex decomposition, then
       * fans of at most 8 vertices. The seams between the pieces are where wheels can catch, so the pieces
       * have to be the original ones.
       */
      const FLT_EPSILON = 1.1920929e-7;
      const at = (p, i) => p[(i % p.length + p.length) % p.length];
      const area = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
      const left = (a, b, c) => area(a, b, c) > 0;
      const leftOn = (a, b, c) => area(a, b, c) >= 0;
      const right = (a, b, c) => area(a, b, c) < 0;
      const rightOn = (a, b, c) => area(a, b, c) <= 0;
      const sqdist = (a, b) => (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);

      /** Intersection of the lines p1p2 and q1q2; (0, 0) if they are parallel. */
      function lineInt(p1, p2, q1, q2) {
        const a1 = p2.y - p1.y,
          b1 = p1.x - p2.x,
          c1 = a1 * p1.x + b1 * p1.y;
        const a2 = q2.y - q1.y,
          b2 = q1.x - q2.x,
          c2 = a2 * q1.x + b2 * q1.y;
        const det = a1 * b2 - a2 * b1;
        if (Math.abs(det) > FLT_EPSILON) return {
          x: (b2 * c1 - b1 * c2) / det,
          y: (a1 * c2 - a2 * c1) / det
        };
        return {
          x: 0,
          y: 0
        };
      }

      /** 0x667a18: drop vertexes closer than sqrt(0.00035) to the next one (and a closing duplicate). */
      function cleanClose(v) {
        const n = v.length;
        const out = [];
        for (let i = 0; i < n; i++) if (sqdist(v[i], v[(i + 1) % n]) > 0.00035) out.push(v[i]);
        if (n > 1 && sqdist(v[n - 1], v[0]) < 0.00035) {
          if (!out.length) return v;
          out.pop();
        }
        return out;
      }

      /** 0x667798: drop vertexes whose two edges are parallel. */
      function removeCollinear(v) {
        const out = [];
        for (let i = 0; i < v.length; i++) {
          const a = at(v, i - 1),
            b = v[i],
            c = at(v, i + 1);
          const det = (b.y - a.y) * (b.x - c.x) - (c.y - b.y) * (a.x - b.x);
          if (Math.abs(det) > FLT_EPSILON) out.push(b);
        }
        return out;
      }

      /** 0x667bf8: counter-clockwise, judged at the bottom-right vertex. */
      function makeCCW(v) {
        let br = 0;
        for (let i = 1; i < v.length; i++) {
          if (v[i].y < v[br].y || v[i].y === v[br].y && v[i].x > v[br].x) br = i;
        }
        if (v.length && !left(at(v, br - 1), at(v, br), at(v, br + 1))) v.reverse();
      }

      /** 0x66817c: Bayazit's decomposition (the first reflex vertex splits the polygon, smaller half first). */
      function bayazit(poly, out, depth) {
        if (depth >= 100) return;
        const n = poly.length;
        for (let i = 0; i < n; i++) {
          if (!right(at(poly, i - 1), at(poly, i), at(poly, i + 1))) continue;
          let upperDist = Number.MAX_VALUE,
            lowerDist = Number.MAX_VALUE;
          let upperInt = {
              x: 0,
              y: 0
            },
            lowerInt = {
              x: 0,
              y: 0
            };
          let upperIndex = 0,
            lowerIndex = 0;
          for (let j = 0; j < n; j++) {
            if (left(at(poly, i - 1), at(poly, i), at(poly, j)) && rightOn(at(poly, i - 1), at(poly, i), at(poly, j - 1))) {
              const p = lineInt(at(poly, i - 1), at(poly, i), at(poly, j), at(poly, j - 1));
              if (right(at(poly, i + 1), at(poly, i), p)) {
                const d = sqdist(poly[i], p);
                if (d < lowerDist) {
                  lowerDist = d;
                  lowerInt = p;
                  lowerIndex = j;
                }
              }
            }
            if (left(at(poly, i + 1), at(poly, i), at(poly, j + 1)) && rightOn(at(poly, i + 1), at(poly, i), at(poly, j))) {
              const p = lineInt(at(poly, i + 1), at(poly, i), at(poly, j), at(poly, j + 1));
              if (left(at(poly, i - 1), at(poly, i), p)) {
                const d = sqdist(poly[i], p);
                if (d < upperDist) {
                  upperDist = d;
                  upperInt = p;
                  upperIndex = j;
                }
              }
            }
          }
          let lower = [],
            upper = [];
          if (lowerIndex === (upperIndex + 1) % n) {
            // nothing to connect to: split at the middle of the two intersections
            const p = {
              x: (lowerInt.x + upperInt.x) / 2,
              y: (lowerInt.y + upperInt.y) / 2
            };
            if (i < upperIndex) {
              lower = poly.slice(i, upperIndex + 1).concat([p]);
              upper = [p].concat(lowerIndex !== 0 ? poly.slice(lowerIndex) : [], poly.slice(0, i + 1));
            } else {
              lower = (i !== 0 ? poly.slice(i) : []).concat(poly.slice(0, upperIndex + 1), [p]);
              upper = [p].concat(poly.slice(lowerIndex, i + 1));
            }
          } else {
            // connect to the closest vertex inside the wedge
            if (lowerIndex > upperIndex) upperIndex += n;
            let closestDist = Number.MAX_VALUE,
              closestIndex = 0;
            for (let j = lowerIndex; j <= upperIndex; j++) {
              if (leftOn(at(poly, i - 1), at(poly, i), at(poly, j)) && rightOn(at(poly, i + 1), at(poly, i), at(poly, j))) {
                const d = sqdist(at(poly, i), at(poly, j));
                if (d < closestDist) {
                  closestDist = d;
                  closestIndex = j % n;
                }
              }
            }
            if (i < closestIndex) {
              lower = poly.slice(i, closestIndex + 1);
              upper = (closestIndex !== 0 ? poly.slice(closestIndex) : []).concat(poly.slice(0, i + 1));
            } else {
              lower = (i !== 0 ? poly.slice(i) : []).concat(poly.slice(0, closestIndex + 1));
              upper = poly.slice(closestIndex, i + 1);
            }
          }
          if (lower.length < upper.length) {
            bayazit(lower, out, depth + 1);
            bayazit(upper, out, depth + 1);
          } else {
            bayazit(upper, out, depth + 1);
            bayazit(lower, out, depth + 1);
          }
          return;
        }
        if (n >= 3) out.push(poly);
      }

      /** 0x629478: a convex piece becomes fans around its first vertex of at most 8 vertexes. */
      function fans(poly) {
        const n = poly.length;
        let k = Math.trunc((n - 2) * 0.16666667 + 1);
        const parts = [];
        for (let c = 0; c < k; c++) parts.push([poly[0]]);
        let vi = 1;
        outer: for (let c = 0; c < k; c++) {
          let j = 1;
          for (;;) {
            parts[c].push(poly[vi + j - 1]);
            if (vi + j === n) break outer;
            if (j > 6) break;
            j++;
          }
          vi += j - 1;
        }
        if (k > 1 && parts[k - 1].length < 3) k--;
        return parts.slice(0, k);
      }

      /** Physics pieces of a polygon outline exactly as the original builds them (see above). */
      function decomposeLikeOriginal(outline) {
        let v = cleanClose(outline);
        v = removeCollinear(v);
        v = cleanClose(v);
        if (v.length > 2) makeCCW(v);
        const convex = [];
        bayazit(v, convex, 0);
        const out = [];
        for (const c of convex) out.push(...fans(c));
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/jsbOtaPort.ts", ['cc', './manifestRewrite.ts', './md5.ts', './otaConfig.ts', './version.ts'], function (exports) {
  var cclegacy, sys, game, manifestVersion, rewriteManifestUrls, md5Hex, OTA_CONFIG, SEARCH_PATHS_KEY, pickEffective, compareVersion;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
      game = module.game;
    }, function (module) {
      manifestVersion = module.manifestVersion;
      rewriteManifestUrls = module.rewriteManifestUrls;
    }, function (module) {
      md5Hex = module.md5Hex;
    }, function (module) {
      OTA_CONFIG = module.OTA_CONFIG;
      SEARCH_PATHS_KEY = module.SEARCH_PATHS_KEY;
    }, function (module) {
      pickEffective = module.pickEffective;
      compareVersion = module.compareVersion;
    }],
    execute: function () {
      cclegacy._RF.push({}, "83c611lOl9A04vHL4O9K4MO", "jsbOtaPort", undefined);

      /** jsb.d.ts cua 3.8.7 khong khai bao jsb.fileUtils: chi phan OTA dung. */

      function fileUtils() {
        return jsb.fileUtils;
      }

      /** Log OTA ra logcat bang console.log (console.debug co the bi loc tren Android). */
      class OtaConsoleLogger {
        debug(msg) {
          console.log(msg);
        }
        warn(msg) {
          console.warn(msg);
        }
        error(msg) {
          console.error(msg);
        }
      }
      exports('OtaConsoleLogger', OtaConsoleLogger);
      /** Cai OtaPort bang jsb (spec OTA1 §4.1). Chi tao khi sys.isNative. */
      class JsbOtaPort {
        constructor(log, hooks) {
          this.fu = fileUtils();
          this.storage = void 0;
          this.log = log;
          this.hooks = hooks;
          this.storage = this.fu.getWritablePath() + OTA_CONFIG.storageDir + '/';
        }
        now() {
          return Date.now();
        }
        schedule(ms, fn) {
          const id = setTimeout(fn, ms);
          return () => clearTimeout(id);
        }
        fetchText(url, timeoutMs) {
          return new Promise(resolve => {
            const t0 = Date.now();
            const xhr = new XMLHttpRequest();
            const done = (text, why) => {
              this.log.debug(`[ota] GET ${url} ${why} ${Date.now() - t0} ms`);
              resolve(text);
            };
            xhr.timeout = timeoutMs;
            xhr.onload = () => xhr.status === 200 ? done(xhr.responseText, '200') : done(null, 'HTTP ' + xhr.status);
            xhr.onerror = () => done(null, 'loi mang');
            xhr.ontimeout = () => done(null, 'timeout');
            try {
              xhr.open('GET', url, true);
              xhr.setRequestHeader('Cache-Control', 'no-cache');
              xhr.send();
            } catch (e) {
              done(null, 'nem loi ' + String(e));
            }
          });
        }
        apkVersion() {
          const v = manifestVersion(this.fu.getStringFromFile('apk.manifest'));
          if (v === null) throw new Error('khong doc duoc apk.manifest');
          return v;
        }
        cachedVersion() {
          // Khong co khoa thi hook khong dat search path: ban tai (neu con) khong chay
          if (!sys.localStorage.getItem(SEARCH_PATHS_KEY)) return null;
          const p = this.storage + 'project.manifest';
          return this.fu.isFileExist(p) ? manifestVersion(this.fu.getStringFromFile(p)) : null;
        }

        /** Version hien o Login/Setting; loi thi tra null. */
        effectiveVersion() {
          try {
            return pickEffective(this.apkVersion(), this.cachedVersion());
          } catch {
            return null;
          }
        }
        hasLocalUpdate() {
          return this.fu.isDirectoryExist(this.storage) || !!sys.localStorage.getItem(SEARCH_PATHS_KEY);
        }
        clearLocalUpdate() {
          this.fu.removeDirectory(this.storage);
          this.fu.removeDirectory(this.storage.slice(0, -1) + '_temp/');
          sys.localStorage.removeItem(SEARCH_PATHS_KEY);
        }
        createUpdater(pointer) {
          return new JsbUpdater(this.fu, this.storage, pointer, this.log);
        }
        setStatus(s) {
          this.hooks.onStatus(s);
        }
        restart() {
          game.restart();
        }
        enterGame() {
          this.hooks.onEnter();
        }
      }
      exports('JsbOtaPort', JsbOtaPort);
      class JsbUpdater {
        constructor(fu, storage, pointer, log) {
          this.am = null;
          this.onEvent = null;
          /** Vi sao lan thu truoc ket thuc: assets -> downloadFailedAssets; manifest -> update(); null (dung im) -> tao lai. */
          this.lastFailure = null;
          /** Manager cu giu tham chieu toi dispose: destructor cua no xoa con tro static cua engine. */
          this.retired = [];
          /** UPDATE_FAILED cua engine khong co message: tu dem file loi va giu loi cuoi. */
          this.failedFiles = 0;
          this.lastError = '';
          this.fu = fu;
          this.storage = storage;
          this.pointer = pointer;
          this.log = log;
        }
        start(onEvent) {
          this.onEvent = onEvent;
          this.open().update();
        }
        retry() {
          const failure = this.lastFailure;
          this.lastFailure = null;
          this.failedFiles = 0;
          this.lastError = '';
          const am = this.am;
          if (failure === 'assets' && am !== null) {
            am.downloadFailedAssets();
            return;
          }
          if (failure === 'manifest' && am !== null) {
            am.update();
            return;
          }
          // dung im, khong co su kien loi: huy manager cu, giu lai, tao manager moi
          if (am !== null) {
            am.cancelUpdate();
            am.setEventCallback(() => {});
            this.retired.push(am);
            this.am = null;
          }
          this.open().update();
        }
        apply() {
          const am = this.am;
          if (am === null) throw new Error('chua co AssetsManager');
          const np = am.getLocalManifest().getSearchPaths();
          const sp = this.fu.getSearchPaths();
          const merged = np.concat(sp.filter(p => np.indexOf(p) < 0));
          sys.localStorage.setItem(SEARCH_PATHS_KEY, JSON.stringify(merged));
          this.fu.setSearchPaths(merged);
        }
        dispose() {
          this.onEvent = null;
          if (this.am !== null) this.am.setEventCallback(() => {});
          this.am = null;
          this.retired = [];
        }

        /** Ghi de URL ca manifest cache lan manifest APK theo tag (spec §4.2) roi nap. */
        open() {
          const {
            cdnBase
          } = OTA_CONFIG;
          const tag = this.pointer.tag;
          const cached = this.storage + 'project.manifest';
          if (this.fu.isFileExist(cached)) {
            try {
              this.fu.writeStringToFile(rewriteManifestUrls(this.fu.getStringFromFile(cached), cdnBase, tag), cached);
            } catch {
              this.log.warn('[ota] manifest cache hong, xoa');
              this.fu.removeFile(cached);
            }
          }
          const am = new jsb.AssetsManager('', this.storage, compareVersion);
          am.setVerifyCallback((path, asset) => this.verify(path, asset));
          am.setEventCallback(ev => this.handle(ev));
          const apk = rewriteManifestUrls(this.fu.getStringFromFile('apk.manifest'), cdnBase, tag);
          am.loadLocalManifest(new jsb.Manifest(apk, this.storage), this.storage);
          this.am = am;
          return am;
        }
        verify(path, asset) {
          if (asset.compressed) return true;
          const data = this.fu.getDataFromFile(path);
          const ok = data !== null && md5Hex(new Uint8Array(data)) === asset.md5;
          if (!ok) this.log.warn('[ota] md5 sai: ' + asset.path);
          return ok;
        }
        handle(ev) {
          const emit = this.onEvent;
          if (emit === null) return;
          const E = jsb.EventAssetsManager;
          const progress = () => emit({
            type: 'progress',
            downloadedBytes: ev.getDownloadedBytes(),
            totalBytes: ev.getTotalBytes()
          });
          switch (ev.getEventCode()) {
            case E.ALREADY_UP_TO_DATE:
              emit({
                type: 'upToDate'
              });
              return;
            case E.UPDATE_FINISHED:
              this.log.debug(`[ota] tai xong ${ev.getTotalFiles()} file ${ev.getTotalBytes()} byte`);
              emit({
                type: 'finished'
              });
              return;
            case E.UPDATE_FAILED:
              this.lastFailure = 'assets';
              emit({
                type: 'failed',
                message: this.failedFiles + ' file loi, cuoi: ' + this.lastError
              });
              this.failedFiles = 0;
              this.lastError = '';
              return;
            case E.ERROR_NO_LOCAL_MANIFEST:
            case E.ERROR_DOWNLOAD_MANIFEST:
            case E.ERROR_PARSE_MANIFEST:
              this.lastFailure = 'manifest';
              emit({
                type: 'failed',
                message: 'manifest ' + ev.getEventCode() + ' ' + ev.getMessage()
              });
              return;
            case E.ERROR_UPDATING:
            case E.ERROR_DECOMPRESS:
              this.failedFiles++;
              this.lastError = ev.getAssetId() + ': ' + ev.getMessage();
              this.log.warn('[ota] loi file ' + this.lastError);
              progress();
              return;
            default:
              // NEW_VERSION_FOUND, UPDATE_PROGRESSION, ASSET_UPDATED
              if (ev.getMessage() !== '') this.log.debug('[ota] ' + ev.getMessage());
              // Ban tren mang moi hon, dang tai project.manifest: otaFlow doi ngan sach 20 s -> 60 s (spec §4.4 b)
              if (ev.getEventCode() === E.NEW_VERSION_FOUND || ev.getEventCode() === E.UPDATE_PROGRESSION && ev.getAssetId() === '@manifest') {
                emit({
                  type: 'checking'
                });
              }
              progress();
          }
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelButtonView.ts", ['cc', './Assets.ts', './CcbView.ts'], function (exports) {
  var cclegacy, Button, Node, Sprite, Color, _decorator, getFrame, CcbView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Button = module.Button;
      Node = module.Node;
      Sprite = module.Sprite;
      Color = module.Color;
      _decorator = module._decorator;
    }, function (module) {
      getFrame = module.getFrame;
    }, function (module) {
      CcbView = module.CcbView;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "a80ccPCwFJBBKza/j/5W2gO", "LevelButtonView", undefined);
      const {
        ccclass
      } = _decorator;

      /**
       * LevelButton.ccbi, one level dot: the marker's rim shows the world (LevelMarkerSmall0-3), its bright
       * "On" variant an unlocked level, the frame under it the stars won, and a glow marks the next level to play.
       */
      let LevelButtonView = exports('LevelButtonView', (_dec = ccclass('LevelButtonView'), _dec(_class = class LevelButtonView extends CcbView {
        show(n, world, unlocked, stars, next, onClick) {
          const num = this.label('_levelNum');
          if (num) num.string = String(n);
          this.setFrame(this.find('_marker'), getFrame(`LevelMarkerSmall${Math.min(world, 3)}${unlocked ? 'On' : ''}.png`, 'LevelSelection'));
          for (let i = 1; i <= 3; i++) {
            const s = this.find('_star' + i);
            if (s) s.active = stars >= i;
          }
          const item = this.find('menuItem_');
          const btn = item == null ? void 0 : item.getComponent(Button);
          if (btn) btn.interactable = unlocked;
          if (next && item) {
            const glow = new Node('glow');
            glow.layer = item.layer;
            glow.addComponent(Sprite).spriteFrame = getFrame('LevelMarkerGlow.png', 'LevelSelection');
            const marker = this.find('_marker');
            item.insertChild(glow, 0);
            if (marker) glow.setPosition(marker.position);
          }
          if (num && !unlocked) num.color = new Color(150, 150, 150, 255);
          this.onSelectors({
            'levelSelected:': onClick
          });
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelData.ts", ['cc', './Config.ts', './Assets.ts'], function (exports) {
  var cclegacy, BIKE_PREFABS, tryLoadJson;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      BIKE_PREFABS = module.BIKE_PREFABS;
    }, function (module) {
      tryLoadJson = module.tryLoadJson;
    }],
    execute: function () {
      exports({
        bikePrefabFor: bikePrefabFor,
        configNameFor: configNameFor,
        groupChildren: groupChildren,
        instantiatePrefab: instantiatePrefab,
        loadLevel: loadLevel,
        spawnBikeEntities: spawnBikeEntities
      });
      cclegacy._RF.push({}, "b68076qXlRGroY7jy/R/25J", "LevelData", undefined);

      /**
       * Level / prefab files are the original editor's plists converted to JSON:
       * { Entities: [{ Type, Properties, Vertexes?, Anchors? }], times?, type? }.
       * Entities reference each other by index (object_id, refobjectList, mountedSprites...).
       * All coordinates are absolute world positions (y up, rotation in degrees counter-clockwise:
       * Sprite -setRotation: hands -rotation to cocos2d's clockwise CCSprite).
       */

      function apply(t, x, y) {
        const r = t.rot * Math.PI / 180;
        const c = Math.cos(r),
          s = Math.sin(r);
        return {
          x: t.x + (x * c - y * s) * t.scale,
          y: t.y + (x * s + y * c) * t.scale
        };
      }
      const INDEX_PROPS = ['refentity', 'refsprite1', 'reffollowEntity', 'refoffsetNode'];
      const INDEX_LIST_PROPS = ['refobjectList', 'mountedSprites', 'objects'];

      /** Deep-copy `src` entities into `out`, transformed by `t`, remapping indices by +base. */
      function appendTransformed(out, src, t, skip) {
        const base = out.length;
        // indices of src that are kept, compacted
        const map = [];
        let k = 0;
        for (let i = 0; i < src.length; i++) map[i] = skip.has(i) ? -1 : base + k++;
        const remap = i => i == null || i < 0 ? i : map[i] ?? -1;
        for (let i = 0; i < src.length; i++) {
          if (skip.has(i)) continue;
          const e = src[i];
          const p = {
            ...e.Properties
          };
          if (Array.isArray(p.position)) {
            const q = apply(t, p.position[0], p.position[1]);
            p.position = [q.x, q.y];
          }
          if (typeof p.rotation === 'number') p.rotation += t.rot;
          if (t.scale !== 1) {
            for (const key of ['scale', 'radius', 'width', 'height', 'length', 'edgeSize']) {
              if (typeof p[key] === 'number') p[key] *= t.scale;
            }
          }
          for (const key of INDEX_PROPS) if (typeof p[key] === 'number') p[key] = remap(p[key]);
          for (const key of INDEX_LIST_PROPS) if (Array.isArray(p[key])) p[key] = p[key].map(remap).filter(v => v >= 0);
          const ne = {
            Type: e.Type,
            Properties: p
          };
          if (e.Vertexes) ne.Vertexes = e.Vertexes.map(v => ({
            ...v,
            ...apply(t, v.x, v.y)
          }));
          if (e.Anchors) {
            ne.Anchors = e.Anchors.map(a => {
              const q = apply(t, a.x, a.y);
              const na = {
                x: q.x,
                y: q.y,
                object_id: remap(a.object_id)
              };
              if (a.object2_id != null) na.object2_id = remap(a.object2_id);
              return na;
            });
          }
          out.push(ne);
        }
        return map;
      }
      const prefabCache = new Map();
      async function prefab(name) {
        if (!prefabCache.has(name)) prefabCache.set(name, await tryLoadJson(`prefabs/${name}`));
        return prefabCache.get(name);
      }

      /**
       * Instantiate prefab `name` at transform `t`, appending to `out`.
       * The prefab's group entity (index 0, the one with refobjectList) is dropped; its
       * remapped child list is returned so the caller's group entity can adopt it.
       */
      async function instantiatePrefab(out, name, t) {
        const pf = await prefab(name);
        if (!pf) return null;
        const src = pf.Entities;
        const groupIdx = src.findIndex(e => {
          var _e$Properties;
          return Array.isArray((_e$Properties = e.Properties) == null ? void 0 : _e$Properties.refobjectList);
        });
        const skip = new Set(groupIdx >= 0 ? [groupIdx] : []);
        const map = appendTransformed(out, src, t, skip);
        if (groupIdx >= 0) return src[groupIdx].Properties.refobjectList.map(i => map[i]).filter(i => i >= 0);
        return src.map((_, i) => map[i]).filter(i => i >= 0);
      }
      function bikePrefabFor(definition) {
        return BIKE_PREFABS[definition] || 'MainBikePref';
      }

      /** Bike entity properties that come from the bike's prefab (the level editor copied them into each level). */
      const BIKE_TUNING = ['definition', 'speedLimit', 'maxWheelieSpeed', 'forceScale', 'tilt', 'nitroPerformance', 'burnoutSpeed', 'geyserPower'];

      /**
       * Load a level and expand every prefab instance (bike, checkpoints, spikes, ...). A level riding the default
       * bike (definition "Moto") rides `bike` instead, like the original's prefab alias "Moto" -> selected bike;
       * levels that set another bike keep it.
       */
      async function loadLevel(id, bike = 'MainBikePref') {
        const file = await tryLoadJson(`levels/${id}`);
        if (!file) throw new Error('level not found: ' + id);
        const entities = file.Entities.map(e => ({
          ...e,
          Properties: {
            ...e.Properties
          }
        }));
        let bikeGroup = -1;
        let bikePrefab = 'MainBikePref';
        const count = entities.length;
        for (let i = 0; i < count; i++) {
          const e = entities[i];
          const p = e.Properties;
          const isBike = p.prefabName === 'Moto' || !!BIKE_PREFABS[p.definition];
          if (isBike) {
            var _await$prefab;
            bikeGroup = i;
            bikePrefab = bikePrefabFor(p.definition);
            const own = p.definition === 'Moto' && bike !== bikePrefab ? (_await$prefab = await prefab(bike)) == null ? void 0 : _await$prefab.Entities.find(b => {
              var _b$Properties;
              return Array.isArray((_b$Properties = b.Properties) == null ? void 0 : _b$Properties.refobjectList);
            }) : null;
            if (own) {
              for (const k of BIKE_TUNING) if (k in own.Properties) p[k] = own.Properties[k];
              bikePrefab = bike;
            }
            continue; // the bike is spawned separately so it can be respawned at checkpoints
          }

          if (Array.isArray(p.refobjectList) && p.refobjectList.length) {
            if (p.XRepeat > 1) repeatSprites(entities, p, p.refobjectList);
            continue;
          }
          if (!p.prefabName) continue;
          const pos = p.position || [0, 0];
          const refs = await instantiatePrefab(entities, p.prefabName, {
            x: pos[0],
            y: pos[1],
            rot: p.rotation || 0,
            scale: p.scale || 1
          });
          if (refs) {
            p.refobjectList = refs;
            if (p.XRepeat > 1) repeatSprites(entities, p, refs);
          } else console.warn('[BR] missing prefab', p.prefabName);
        }
        return {
          id,
          entities,
          times: file.times || [],
          bikeGroup,
          bikePrefab
        };
      }

      /**
       * "XRepeat" groups (spike strips): tile the group's sprites n times along the group's
       * x axis, one trigger-width apart, centred on the original.
       */
      function repeatSprites(entities, group, refs) {
        const n = Math.round(group.XRepeat);
        // groups already expanded by the editor carry their copies
        if (refs.filter(i => {
          var _entities$i;
          return ((_entities$i = entities[i]) == null ? void 0 : _entities$i.Type) === 'EditorSprite';
        }).length !== 1) return;
        const trigger = refs.map(i => entities[i]).find(e => e.Type === 'EditorTrigger');
        const step = (trigger == null ? void 0 : trigger.Properties.width) || 12.8;
        const r = (group.rotation || 0) * Math.PI / 180;
        const dx = Math.cos(r) * step,
          dy = Math.sin(r) * step;
        for (const i of refs.slice()) {
          const e = entities[i];
          if (e.Type !== 'EditorSprite') continue;
          const [x, y] = e.Properties.position;
          for (let k = 0; k < n; k++) {
            const off = k - (n - 1) / 2;
            if (k === 0) {
              e.Properties.position = [x + dx * off, y + dy * off];
              continue;
            }
            entities.push({
              Type: e.Type,
              Properties: {
                ...e.Properties,
                position: [x + dx * off, y + dy * off]
              }
            });
            refs.push(entities.length - 1);
          }
        }
      }

      /** Spawn the bike prefab at (x, y); returns the index range of its entities. */
      async function spawnBikeEntities(out, prefabName, x, y, rot = 0) {
        const start = out.length;
        await instantiatePrefab(out, prefabName, {
          x,
          y,
          rot,
          scale: 1
        });
        for (let i = start; i < out.length; i++) out[i].bike = start;
        return [start, out.length];
      }

      /** Children of a group entity, following nested groups. */
      function groupChildren(entities, idx) {
        const res = [];
        const seen = new Set();
        const walk = i => {
          for (const c of ((_entities$i2 = entities[i]) == null || (_entities$i2 = _entities$i2.Properties) == null ? void 0 : _entities$i2.refobjectList) || []) {
            var _entities$i2;
            if (seen.has(c) || !entities[c]) continue;
            seen.add(c);
            res.push(c);
            if (Array.isArray(entities[c].Properties.refobjectList)) walk(c);
          }
        };
        walk(idx);
        return res;
      }

      /** World config for a level id: GameConfig_T<pack> or GameConfig_U<u>_T<pack>. */
      function configNameFor(id) {
        const parts = id.split('_').map(Number);
        return parts.length === 3 ? `GameConfig_U${parts[0]}_T${parts[1]}` : `GameConfig_T${parts[0]}`;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LineJoint.ts", ['cc', './planck.mjs'], function (exports) {
  var cclegacy, PrismaticJoint, Settings;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      PrismaticJoint = module.PrismaticJoint;
      Settings = module.Settings;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b7952YIqC1MJLk2ikszbOhE", "LineJoint", undefined);
      const INACTIVE = 0,
        AT_LOWER = 1,
        AT_UPPER = 2,
        EQUAL = 3;

      /**
       * Box2D 2.1 b2LineJoint: body B slides along an axis fixed in body A, with an optional limit and
       * motor, while rotating freely. The bikes' front forks are line joints limited to their travel;
       * planck has no equivalent (its wheel joint has no limit, its prismatic joint locks rotation),
       * so this is a prismatic joint whose solver drops the angular row, as b2LineJoint does.
       */
      class LineJoint extends PrismaticJoint {
        constructor(def, bodyA, bodyB, anchor, axis) {
          super(def, bodyA, bodyB, anchor, axis);
          this.li = {
            x: 0,
            y: 0
          };
          // perpendicular / limit impulses
          this.lineLimit = INACTIVE;
          this.k11 = 0;
          this.k12 = 0;
          this.k22 = 0;
        }
        initVelocityConstraints(step) {
          const self = this;
          const bA = self.m_bodyA,
            bB = self.m_bodyB;
          self.m_localCenterA = bA.m_sweep.localCenter;
          self.m_localCenterB = bB.m_sweep.localCenter;
          const mA = self.m_invMassA = bA.m_invMass,
            mB = self.m_invMassB = bB.m_invMass;
          const iA = self.m_invIA = bA.m_invI,
            iB = self.m_invIB = bB.m_invI;
          const cA = bA.c_position.c,
            aA = bA.c_position.a,
            cB = bB.c_position.c,
            aB = bB.c_position.a;
          const vA = bA.c_velocity.v,
            vB = bB.c_velocity.v;
          let wA = bA.c_velocity.w,
            wB = bB.c_velocity.w;
          const g = this.geometry(cA, aA, cB, aB);
          self.m_axis = {
            x: g.ax,
            y: g.ay
          };
          self.m_perp = {
            x: g.px,
            y: g.py
          };
          self.m_a1 = g.a1;
          self.m_a2 = g.a2;
          self.m_s1 = g.s1;
          self.m_s2 = g.s2;
          let motorMass = mA + mB + iA * g.a1 * g.a1 + iB * g.a2 * g.a2;
          self.m_motorMass = motorMass > 0 ? 1 / motorMass : motorMass;
          this.k11 = mA + mB + iA * g.s1 * g.s1 + iB * g.s2 * g.s2;
          this.k12 = iA * g.s1 * g.a1 + iB * g.s2 * g.a2;
          this.k22 = mA + mB + iA * g.a1 * g.a1 + iB * g.a2 * g.a2;
          if (self.m_enableLimit) {
            const t = g.ax * g.dx + g.ay * g.dy;
            if (Math.abs(self.m_upperTranslation - self.m_lowerTranslation) < 2 * Settings.linearSlop) this.lineLimit = EQUAL;else if (t <= self.m_lowerTranslation) {
              if (this.lineLimit !== AT_LOWER) this.li.y = 0;
              this.lineLimit = AT_LOWER;
            } else if (t >= self.m_upperTranslation) {
              if (this.lineLimit !== AT_UPPER) this.li.y = 0;
              this.lineLimit = AT_UPPER;
            } else {
              this.lineLimit = INACTIVE;
              this.li.y = 0;
            }
          } else {
            this.lineLimit = INACTIVE;
            this.li.y = 0;
          }
          if (!self.m_enableMotor) self.m_motorImpulse = 0;
          if (step.warmStarting) {
            this.li.x *= step.dtRatio;
            this.li.y *= step.dtRatio;
            self.m_motorImpulse *= step.dtRatio;
            const ia = self.m_motorImpulse + this.li.y;
            const px = this.li.x * g.px + ia * g.ax,
              py = this.li.x * g.py + ia * g.ay;
            const L1 = this.li.x * g.s1 + ia * g.a1,
              L2 = this.li.x * g.s2 + ia * g.a2;
            vA.x -= mA * px;
            vA.y -= mA * py;
            wA -= iA * L1;
            vB.x += mB * px;
            vB.y += mB * py;
            wB += iB * L2;
          } else {
            this.li.x = this.li.y = 0;
            self.m_motorImpulse = 0;
          }
          bA.c_velocity.w = wA;
          bB.c_velocity.w = wB;
        }
        solveVelocityConstraints(step) {
          const self = this;
          const bA = self.m_bodyA,
            bB = self.m_bodyB;
          const vA = bA.c_velocity.v,
            vB = bB.c_velocity.v;
          let wA = bA.c_velocity.w,
            wB = bB.c_velocity.w;
          const mA = self.m_invMassA,
            mB = self.m_invMassB,
            iA = self.m_invIA,
            iB = self.m_invIB;
          const ax = self.m_axis.x,
            ay = self.m_axis.y,
            px = self.m_perp.x,
            py = self.m_perp.y;
          const a1 = self.m_a1,
            a2 = self.m_a2,
            s1 = self.m_s1,
            s2 = self.m_s2;
          const apply = (ix, iy) => {
            // ix along the perpendicular, iy along the axis
            const Px = ix * px + iy * ax,
              Py = ix * py + iy * ay;
            vA.x -= mA * Px;
            vA.y -= mA * Py;
            wA -= iA * (ix * s1 + iy * a1);
            vB.x += mB * Px;
            vB.y += mB * Py;
            wB += iB * (ix * s2 + iy * a2);
          };
          if (self.m_enableMotor && this.lineLimit !== EQUAL) {
            const Cdot = ax * (vB.x - vA.x) + ay * (vB.y - vA.y) + a2 * wB - a1 * wA;
            let impulse = self.m_motorMass * (self.m_motorSpeed - Cdot);
            const old = self.m_motorImpulse;
            const maxImpulse = step.dt * self.m_maxMotorForce;
            self.m_motorImpulse = Math.max(-maxImpulse, Math.min(maxImpulse, old + impulse));
            impulse = self.m_motorImpulse - old;
            apply(0, impulse);
          }
          const Cdot1 = px * (vB.x - vA.x) + py * (vB.y - vA.y) + s2 * wB - s1 * wA;
          if (self.m_enableLimit && this.lineLimit !== INACTIVE) {
            const Cdot2 = ax * (vB.x - vA.x) + ay * (vB.y - vA.y) + a2 * wB - a1 * wA;
            const f1x = this.li.x,
              f1y = this.li.y;
            const det = this.k11 * this.k22 - this.k12 * this.k12;
            const inv = det !== 0 ? 1 / det : 0;
            // K * df = -Cdot
            this.li.x += inv * (this.k22 * -Cdot1 - this.k12 * -Cdot2);
            this.li.y += inv * (this.k11 * -Cdot2 - this.k12 * -Cdot1);
            if (this.lineLimit === AT_LOWER) this.li.y = Math.max(this.li.y, 0);else if (this.lineLimit === AT_UPPER) this.li.y = Math.min(this.li.y, 0);
            // solve the perpendicular row again with the clamped limit impulse
            const b = -Cdot1 - (this.li.y - f1y) * this.k12;
            this.li.x = (this.k11 !== 0 ? b / this.k11 : 0) + f1x;
            apply(this.li.x - f1x, this.li.y - f1y);
          } else {
            const df = this.k11 !== 0 ? -Cdot1 / this.k11 : 0;
            this.li.x += df;
            apply(df, 0);
          }
          bA.c_velocity.w = wA;
          bB.c_velocity.w = wB;
        }
        solvePositionConstraints(step) {
          const self = this;
          const bA = self.m_bodyA,
            bB = self.m_bodyB;
          const cA = bA.c_position.c,
            cB = bB.c_position.c;
          let aA = bA.c_position.a,
            aB = bB.c_position.a;
          const mA = self.m_invMassA,
            mB = self.m_invMassB,
            iA = self.m_invIA,
            iB = self.m_invIB;
          const g = this.geometry(cA, aA, cB, aB);
          const slop = Settings.linearSlop,
            maxCorr = Settings.maxLinearCorrection;
          const C1 = g.px * g.dx + g.py * g.dy;
          let linearError = Math.abs(C1);
          let active = false;
          let C2 = 0;
          if (self.m_enableLimit) {
            const t = g.ax * g.dx + g.ay * g.dy;
            const lo = self.m_lowerTranslation,
              hi = self.m_upperTranslation;
            if (Math.abs(hi - lo) < 2 * slop) {
              C2 = Math.max(-maxCorr, Math.min(maxCorr, t));
              linearError = Math.max(linearError, Math.abs(t));
              active = true;
            } else if (t <= lo) {
              C2 = Math.max(-maxCorr, Math.min(0, t - lo + slop));
              linearError = Math.max(linearError, lo - t);
              active = true;
            } else if (t >= hi) {
              C2 = Math.max(0, Math.min(maxCorr, t - hi - slop));
              linearError = Math.max(linearError, t - hi);
              active = true;
            }
          }
          const k11 = mA + mB + iA * g.s1 * g.s1 + iB * g.s2 * g.s2;
          let ix = 0,
            iy = 0;
          if (active) {
            const k12 = iA * g.s1 * g.a1 + iB * g.s2 * g.a2;
            const k22 = mA + mB + iA * g.a1 * g.a1 + iB * g.a2 * g.a2;
            const det = k11 * k22 - k12 * k12;
            const inv = det !== 0 ? 1 / det : 0;
            ix = inv * (k22 * -C1 - k12 * -C2);
            iy = inv * (k11 * -C2 - k12 * -C1);
          } else {
            ix = k11 !== 0 ? -C1 / k11 : 0;
          }
          const Px = ix * g.px + iy * g.ax,
            Py = ix * g.py + iy * g.ay;
          cA.x -= mA * Px;
          cA.y -= mA * Py;
          aA -= iA * (ix * g.s1 + iy * g.a1);
          cB.x += mB * Px;
          cB.y += mB * Py;
          aB += iB * (ix * g.s2 + iy * g.a2);
          bA.c_position.a = aA;
          bB.c_position.a = aB;
          return linearError <= slop;
        }

        /** Anchor separation, world axis/perpendicular and their lever arms (b2LineJoint). */
        geometry(cA, aA, cB, aB) {
          const self = this;
          const ca = Math.cos(aA),
            sa = Math.sin(aA),
            cb = Math.cos(aB),
            sb = Math.sin(aB);
          const la = self.m_localAnchorA,
            lb = self.m_localAnchorB,
            lcA = self.m_localCenterA,
            lcB = self.m_localCenterB;
          const rAx = ca * (la.x - lcA.x) - sa * (la.y - lcA.y),
            rAy = sa * (la.x - lcA.x) + ca * (la.y - lcA.y);
          const rBx = cb * (lb.x - lcB.x) - sb * (lb.y - lcB.y),
            rBy = sb * (lb.x - lcB.x) + cb * (lb.y - lcB.y);
          const dx = cB.x + rBx - cA.x - rAx,
            dy = cB.y + rBy - cA.y - rAy;
          const xa = self.m_localXAxisA,
            ya = self.m_localYAxisA;
          const ax = ca * xa.x - sa * xa.y,
            ay = sa * xa.x + ca * xa.y;
          const px = ca * ya.x - sa * ya.y,
            py = sa * ya.x + ca * ya.y;
          const ux = dx + rAx,
            uy = dy + rAy;
          return {
            dx,
            dy,
            ax,
            ay,
            px,
            py,
            a1: ux * ay - uy * ax,
            a2: rBx * ay - rBy * ax,
            s1: ux * py - uy * px,
            s2: rBx * py - rBy * px
          };
        }
      }
      exports('LineJoint', LineJoint);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/logger.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "3a152k646BPWLfaAScGYI4Y", "logger", undefined);
      /** Dung khi chay that. La noi DUY NHAT trong core/ duoc goi console. */
      class ConsoleLogger {
        constructor(prefix = '[bikerivals]') {
          this.prefix = prefix;
        }
        debug(msg) {
          console.debug(this.prefix, msg);
        }
        warn(msg) {
          console.warn(this.prefix, msg);
        }
        error(msg) {
          console.error(this.prefix, msg);
        }
      }
      exports('ConsoleLogger', ConsoleLogger);

      /** Dung trong test — cho phep khang dinh la khong co canh bao nao phat ra. */
      class MemoryLogger {
        constructor() {
          this.entries = [];
        }
        debug(msg) {
          this.entries.push({
            level: 'debug',
            msg
          });
        }
        warn(msg) {
          this.entries.push({
            level: 'warn',
            msg
          });
        }
        error(msg) {
          this.entries.push({
            level: 'error',
            msg
          });
        }
        warnings() {
          return this.entries.filter(e => e.level !== 'debug').map(e => e.msg);
        }
        clear() {
          this.entries.length = 0;
        }
      }
      exports('MemoryLogger', MemoryLogger);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./Boot.ts', './Config.ts', './GameRoot.ts', './CcbAnimator.ts', './CcbButton.ts', './CcbGradient.ts', './CcbLayerColor.ts', './CcbNode.ts', './Assets.ts', './Geometry.ts', './Nav.ts', './Sound.ts', './logger.ts', './backoff.ts', './decide.ts', './manifestRewrite.ts', './md5.ts', './otaConfig.ts', './otaFlow.ts', './pointer.ts', './version.ts', './Bike.ts', './BikeEffects.ts', './Drone.ts', './GameSession.ts', './Progress.ts', './Water.ts', './Box2D21.ts', './LevelData.ts', './LineJoint.ts', './ParallaxView.ts', './PhysicsBuilder.ts', './TerrainMesh.ts', './WaterView.ts', './WorldView.ts', './jsbOtaPort.ts', './BikeShopView.ts', './CcbView.ts', './Controls.ts', './LevelButtonView.ts', './MainMenuView.ts', './MenuRoot.ts', './PadButton.ts', './PauseView.ts', './ResultView.ts', './Screens.ts', './SpecialsView.ts', './UiKit.ts', './WorldMapView.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/MainMenuView.ts", ['cc', './CcbButton.ts', './Progress.ts', './CcbView.ts', './UiKit.ts'], function (exports) {
  var cclegacy, UITransform, view, Color, Button, _decorator, CcbButton, isUnlockAll, setUnlockAll, CcbView, rect, label, onClick;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
      view = module.view;
      Color = module.Color;
      Button = module.Button;
      _decorator = module._decorator;
    }, function (module) {
      CcbButton = module.CcbButton;
    }, function (module) {
      isUnlockAll = module.isUnlockAll;
      setUnlockAll = module.setUnlockAll;
    }, function (module) {
      CcbView = module.CcbView;
    }, function (module) {
      rect = module.rect;
      label = module.label;
      onClick = module.onClick;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "58fce0+I6pP4KGPlc3dC8a3", "MainMenuView", undefined);
      const {
        ccclass
      } = _decorator;

      /**
       * MainMenu.ccbi: the rider intro the first time, the short "static" entrance afterwards; Play opens the map,
       * Store the bike screen.
       */
      let MainMenuView = exports('MainMenuView', (_dec = ccclass('MainMenuView'), _dec(_class = class MainMenuView extends CcbView {
        init(intro, onPlay, onStore) {
          var _this$animator;
          this.touchOnLabels();
          (_this$animator = this.animator) == null || _this$animator.play(intro ? 'intro' : 'static');
          this.onSelectors({
            pressButtonA: onPlay,
            pressButtonC: onStore
          });
          this.addDevButton();
        }

        /** Port-only dev switch in the top-left corner: every level unlocked on the map and the special packs. */
        addDevButton() {
          const tf = this.getComponent(UITransform);
          const size = tf != null && tf.contentSize.width ? tf.contentSize : view.getVisibleSize();
          const ax = tf ? tf.anchorX : 0.5,
            ay = tf ? tf.anchorY : 0.5;
          const w = 260,
            h = 48,
            pad = 16;
          const row = rect(this.node, w, h, new Color(20, 20, 20, 190), -size.width * ax + pad + w / 2, size.height * (1 - ay) - pad - h / 2, 12, 'devUnlockAll');
          const text = () => `DEV: mở tất cả level: ${isUnlockAll() ? 'BẬT' : 'TẮT'}`;
          const l = label(row, text(), 20, 0, 0, Color.WHITE, false);
          onClick(row, () => {
            setUnlockAll(!isUnlockAll());
            l.string = text();
          });
        }

        /**
         * The menu items (menuItemPlay_ ...) have no image and no size in the .ccbi: the game sized them in code.
         * Their visible label is the sprite next to them (spritePlay_ ...), so that sprite takes the taps.
         */
        touchOnLabels() {
          for (const item of this.getComponentsInChildren(CcbButton)) {
            const tf = item.getComponent(UITransform);
            if (tf.width > 0 && tf.height > 0) continue;
            const label = this.find(item.node.name.replace('menuItem', 'sprite'));
            if (!label) continue;
            label.addComponent(Button);
            label.addComponent(CcbButton).selector = item.selector;
            item.enabled = false;
          }
        }

        /** Jumps to the end of the entrance (for screenshots). */
        finish() {
          const a = this.animator;
          for (let i = 0; i < 18 * 60 && a != null && a.running; i++) a.update(1 / 60);
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/manifestRewrite.ts", ['cc', './version.ts'], function (exports) {
  var cclegacy, isVersion4, tagBase;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      isVersion4 = module.isVersion4;
      tagBase = module.tagBase;
    }],
    execute: function () {
      exports({
        manifestVersion: manifestVersion,
        rewriteManifestUrls: rewriteManifestUrls
      });
      cclegacy._RF.push({}, "953b5/cezxGaLPGMvxWlXRS", "manifestRewrite", undefined);
      function rewriteManifestUrls(text, cdnBase, tag) {
        const m = JSON.parse(text);
        if (m === null || typeof m !== 'object' || Array.isArray(m)) throw new Error('manifest khong phai object');
        const o = m;
        const base = tagBase(cdnBase, tag);
        o.packageUrl = base + 'data/';
        o.remoteManifestUrl = base + 'project.manifest';
        o.remoteVersionUrl = base + 'version.manifest';
        return JSON.stringify(o);
      }

      /** Version A.B.C.D trong noi dung manifest; hong/thieu -> null. */
      function manifestVersion(text) {
        try {
          const m = JSON.parse(text);
          if (m === null || typeof m !== 'object') return null;
          const v = m.version;
          return isVersion4(v) ? v : null;
        } catch {
          return null;
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/md5.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('md5Hex', md5Hex);
      cclegacy._RF.push({}, "9d2dd5xIF5E4LOf60DVcv+o", "md5", undefined);
      /** md5 thuan JS cho verifyCallback (jsb khong co ham md5, KS §1.3). Tra hex thuong. */
      const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
      const K = [];
      for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
      function md5Hex(input) {
        const len = input.length;
        const nBlocks = (len + 8 >>> 6) + 1;
        const words = new Uint32Array(nBlocks * 16);
        for (let i = 0; i < len; i++) words[i >> 2] |= input[i] << i % 4 * 8;
        words[len >> 2] |= 0x80 << len % 4 * 8;
        const bitLen = len * 8;
        words[nBlocks * 16 - 2] = bitLen >>> 0;
        words[nBlocks * 16 - 1] = Math.floor(bitLen / 4294967296) >>> 0;
        let a0 = 0x67452301;
        let b0 = 0xefcdab89;
        let c0 = 0x98badcfe;
        let d0 = 0x10325476;
        for (let blk = 0; blk < nBlocks; blk++) {
          let A = a0;
          let B = b0;
          let C = c0;
          let D = d0;
          const o = blk * 16;
          for (let i = 0; i < 64; i++) {
            let F;
            let g;
            if (i < 16) {
              F = B & C | ~B & D;
              g = i;
            } else if (i < 32) {
              F = D & B | ~D & C;
              g = (5 * i + 1) % 16;
            } else if (i < 48) {
              F = B ^ C ^ D;
              g = (3 * i + 5) % 16;
            } else {
              F = C ^ (B | ~D);
              g = 7 * i % 16;
            }
            F = F + A + K[i] + words[o + g] >>> 0;
            A = D;
            D = C;
            C = B;
            B = B + (F << S[i] | F >>> 32 - S[i]) >>> 0;
          }
          a0 = a0 + A >>> 0;
          b0 = b0 + B >>> 0;
          c0 = c0 + C >>> 0;
          d0 = d0 + D >>> 0;
        }
        let hex = '';
        for (const v of [a0, b0, c0, d0]) {
          for (let i = 0; i < 4; i++) {
            const b = v >>> i * 8 & 255;
            hex += (b < 16 ? '0' : '') + b.toString(16);
          }
        }
        return hex;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/MenuRoot.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CcbAnimator.ts', './Config.ts', './Nav.ts', './Sound.ts', './BikeShopView.ts', './MainMenuView.ts', './SpecialsView.ts', './WorldMapView.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Prefab, Node, _decorator, Component, instantiate, CcbAnimator, WORLDS, installDebug, ensureAssets, Nav, Sound, BikeShopView, MainMenuView, SpecialsView, WorldMapView;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Prefab = module.Prefab;
      Node = module.Node;
      _decorator = module._decorator;
      Component = module.Component;
      instantiate = module.instantiate;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      WORLDS = module.WORLDS;
    }, function (module) {
      installDebug = module.installDebug;
      ensureAssets = module.ensureAssets;
      Nav = module.Nav;
    }, function (module) {
      Sound = module.Sound;
    }, function (module) {
      BikeShopView = module.BikeShopView;
    }, function (module) {
      MainMenuView = module.MainMenuView;
    }, function (module) {
      SpecialsView = module.SpecialsView;
    }, function (module) {
      WorldMapView = module.WorldMapView;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
      cclegacy._RF.push({}, "48a6fH5NRJFha9xDKdwubc+", "MenuRoot", undefined);
      const {
        ccclass,
        property
      } = _decorator;

      /** Special packs page showing `level` (the packs after the four map worlds), 0 if it is not in one. */
      function pageOf(level) {
        const packs = WORLDS.slice(4);
        const i = packs.findIndex(w => (level == null ? void 0 : level.startsWith(w.prefix)) && /^\d+$/.test(level.slice(w.prefix.length)));
        return Math.max(0, i);
      }

      /**
       * Root of menu.scene: shows one of the original's menu screens (prefabs converted from MainMenu,
       * LevelSelection, LevelMenu and ShopMenuMain + ShopMenu .ccbi) and starts levels in game.scene.
       */
      let MenuRoot = exports('MenuRoot', (_dec = ccclass('MenuRoot'), _dec2 = property(Prefab), _dec3 = property(Prefab), _dec4 = property([Prefab]), _dec5 = property(Prefab), _dec6 = property(Prefab), _dec7 = property(Prefab), _dec8 = property(Prefab), _dec9 = property(Node), _dec(_class = (_class2 = class MenuRoot extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "mainMenu", _descriptor, this);
          /** LevelSelection.ccbi */
          _initializerDefineProperty(this, "worldMap", _descriptor2, this);
          /** WorldPanel1-11.ccbi, in map order (the 12th background has no level dots) */
          _initializerDefineProperty(this, "worldPanels", _descriptor3, this);
          /** LevelMenu.ccbi */
          _initializerDefineProperty(this, "specials", _descriptor4, this);
          _initializerDefineProperty(this, "levelButton", _descriptor5, this);
          /** ShopMenuMain.ccbi, the store's frame */
          _initializerDefineProperty(this, "shopMain", _descriptor6, this);
          /** ShopMenu.ccbi, the bikes */
          _initializerDefineProperty(this, "shop", _descriptor7, this);
          /** Where the screens go (the Canvas). */
          _initializerDefineProperty(this, "layer", _descriptor8, this);
          this.screen = null;
          this.ready = null;
        }
        async start() {
          installDebug();
          this.ready = ensureAssets();
          await this.ready;
          if (!this.isValid) return; // left the scene while loading
          Nav.menu = this;
          Sound.music('menu');
          await this.show(Nav.menuScreen, Nav.menuLevel, pageOf(Nav.menuLevel));
        }
        onDestroy() {
          if (Nav.menu === this) Nav.menu = null;
        }
        async show(screen, focus = null, page = 0) {
          var _this$screen;
          (_this$screen = this.screen) == null || _this$screen.destroy();
          const start = id => Nav.toGame(id);
          if (screen === 'main') {
            this.screen = instantiate(this.mainMenu);
            this.layer.addChild(this.screen);
            this.screen.addComponent(MainMenuView).init(!Nav.introPlayed, () => this.show('map'), () => this.show('bikes'));
            Nav.introPlayed = true;
          } else if (screen === 'map') {
            this.screen = instantiate(this.worldMap);
            this.layer.addChild(this.screen);
            await this.screen.addComponent(WorldMapView).init(this.worldPanels, this.levelButton, focus, {
              level: start,
              back: () => this.show('main'),
              specials: () => this.show('specials')
            });
          } else if (screen === 'bikes') {
            this.screen = instantiate(this.shopMain);
            this.layer.addChild(this.screen);
            await this.screen.addComponent(BikeShopView).init(this.shop, {
              back: () => this.show('main')
            });
          } else {
            this.screen = instantiate(this.specials);
            this.layer.addChild(this.screen);
            this.screen.addComponent(SpecialsView).init(this.levelButton, page, {
              level: start,
              back: () => this.show('map')
            });
          }
        }
        async debugShow(state) {
          await this.ready;
          const [kind, arg] = state.split(':');
          await this.show(kind, kind === 'map' ? arg ?? null : null, kind === 'specials' ? Number(arg) || 0 : 0);
          if (kind === 'main') this.screen.getComponent(MainMenuView).finish();
          if (kind === 'bikes') this.screen.getComponent(BikeShopView).settle(arg === undefined ? undefined : Number(arg));
          // let the converted screens finish their entrance so screenshots are stable
          const anim = this.screen.getComponent(CcbAnimator);
          for (let i = 0; i < 600 && anim != null && anim.running; i++) anim.update(1 / 60);
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "mainMenu", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "worldMap", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "worldPanels", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "specials", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "levelButton", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "shopMain", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "shop", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "layer", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Nav.ts", ['cc', './Assets.ts', './Sound.ts', './Screens.ts', './UiKit.ts'], function (exports) {
  var cclegacy, director, Node, initAssets, loadTerrainMaterial, loadFont, Sound, preloadUi, setDefaultFont;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      director = module.director;
      Node = module.Node;
    }, function (module) {
      initAssets = module.initAssets;
      loadTerrainMaterial = module.loadTerrainMaterial;
      loadFont = module.loadFont;
    }, function (module) {
      Sound = module.Sound;
    }, function (module) {
      preloadUi = module.preloadUi;
    }, function (module) {
      setDefaultFont = module.setDefaultFont;
    }],
    execute: function () {
      exports({
        ensureAssets: ensureAssets,
        installDebug: installDebug,
        preloadScene: preloadScene
      });
      cclegacy._RF.push({}, "e8fa4Jp0D9GZ57Dizq6XWt1", "Nav", undefined);

      /** Sound effects every scene may play; loaded once at startup. */
      const SFX = exports('SFX', ['sfx_button', 'sfx_finishline', 'sfx_checkpoint', 'sfx_nitroMount', 'sfx_nitroStart', 'GuyPain_mid1', 'GuyPain_high1', 'GuyPain_low1', 'bodyhit_hard1', 'bonebreak1', 'bonebreak2', 'sfx_pause', 'sfx_explosion1', 'waterSplash1', 'waterSplash2', 'sfx_lavaDrop', 'sfx_lavaDrop2']);

      /**
       * FMOD event names used by sound triggers whose sample has a different name (several: one at
       * random, like a multi-sound instrument).
       */
      const SOUND_EVENTS = exports('SOUND_EVENTS', {
        stonehitmed: 'sfx_stoneimpact_med',
        stonehitsoft: 'sfx_stoneimpact_soft',
        stonehithard: 'sfx_stoneimpact_hard',
        RockHit: 'sfx_stoneimpact_hard',
        BreakWood: 'sfx_breakWood1',
        DroneTick: 'drone_tick',
        LavaDive: ['sfx_lavaDrop', 'sfx_lavaDrop2'],
        WaterDeath: ['waterSplash1', 'waterSplash2'],
        c_y_trainTrigger: 'c_trainTrigger'
      });
      let assets = null;
      const scenes = {};

      /**
       * Downloads a scene and everything it references ahead of time, once, so a later director.loadScene opens it
       * without waiting. Never fails: on an error the scene is simply loaded the normal way when it opens.
       */
      function preloadScene(name) {
        if (!scenes[name]) {
          scenes[name] = new Promise(resolve => director.preloadScene(name, err => {
            if (err) console.warn('could not preload scene ' + name, err);
            resolve();
          }));
        }
        return scenes[name];
      }

      /**
       * Loads what every scene needs (frame index, terrain material, fonts, menu sheets, sound effects) once,
       * and puts the sound player on a node that survives scene changes. Safe to call from any scene, so a scene
       * opened on its own in the editor still works. Also starts preloading the menu and game scenes.
       */
      function ensureAssets() {
        if (!assets) {
          preloadScene('menu');
          preloadScene('game');
          assets = (async () => {
            const host = new Node('Audio');
            director.getScene().addChild(host);
            director.addPersistRootNode(host);
            Sound.init(host);
            await initAssets();
            await loadTerrainMaterial();
            setDefaultFont(await loadFont('edo'));
            await preloadUi();
            await Sound.preload(SFX);
          })();
        }
        return assets;
      }

      /** The screens of menu.scene. */

      /** A scene's root component that tools/ui_snap.mjs can put in a fixed state. */

      /** Which scene shows what, and the data passed between scenes. */
      const Nav = exports('Nav', {
        /** Level game.scene starts. */
        pendingLevel: null,
        /** Screen menu.scene opens on, and the level the world map centres on. */
        menuScreen: 'main',
        menuLevel: null,
        /** Set once a tool drives the scenes through __br: Boot then leaves navigation to it. */
        debugDriven: false,
        /** The main menu plays its long intro only the first time. */
        introPlayed: false,
        /** Root components of the running scene (set by them while they live). */
        game: null,
        menu: null,
        toGame(id) {
          this.pendingLevel = id;
          director.loadScene('game');
        },
        toMenu(screen, level = null) {
          this.menuScreen = screen;
          this.menuLevel = level;
          director.loadScene('menu');
        }
      });
      async function loadScene(name) {
        // loadScene refuses (returns false, no callback) while another scene is loading: wait for that one first
        for (let i = 0; i < 600; i++) {
          const started = await new Promise((resolve, reject) => {
            if (!director.loadScene(name, err => err ? reject(err) : resolve(true))) resolve(false);
          });
          if (started) return;
          await new Promise(r => setTimeout(r, 50));
        }
        throw new Error('could not load scene ' + name);
      }
      async function until(get, ms = 30000) {
        const end = Date.now() + ms;
        for (;;) {
          const v = get();
          if (v) return v;
          if (Date.now() > end) throw new Error('timed out waiting for the scene');
          await new Promise(r => setTimeout(r, 50));
        }
      }

      /**
       * globalThis.__br for automated tests and tools/ui_snap.mjs: startLevel, debugShow and the running game's
       * controls / session / UI layer, whichever scene is open. Menu states: "main", "map:<level>",
       * "specials:<page>", "bikes[:<index>]"; game states: "loading", "hud:<level>:buttons|tilt", "pause:<level>",
       * "result:<level>:<stars>:<time>".
       */
      function installDebug() {
        const g = globalThis;
        if (g.__br) return;
        g.__sound = Sound;
        g.__br = {
          startLevel(id) {
            if (Nav.game) Nav.game.startLevel(id);else Nav.toGame(id);
          },
          async debugShow(state) {
            var _director$getScene;
            Nav.debugDriven = true;
            const menu = /^(main|map|specials|bikes)/.test(state);
            const scene = menu ? 'menu' : 'game';
            if (((_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.name) !== scene || !(menu ? Nav.menu : Nav.game)) {
              Nav.pendingLevel = null;
              await loadScene(scene);
            }
            const target = await until(() => menu ? Nav.menu : Nav.game);
            await target.debugShow(state);
          },
          get controls() {
            var _Nav$game;
            return ((_Nav$game = Nav.game) == null ? void 0 : _Nav$game.controls) ?? null;
          },
          get session() {
            var _Nav$game2;
            return ((_Nav$game2 = Nav.game) == null ? void 0 : _Nav$game2.session) ?? null;
          },
          get uiLayer() {
            var _Nav$game3;
            return ((_Nav$game3 = Nav.game) == null ? void 0 : _Nav$game3.uiLayer) ?? null;
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/otaConfig.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('otaEnabled', otaEnabled);
      cclegacy._RF.push({}, "32619Luu/xMQLl00exhElpG", "otaConfig", undefined);
      /**
       * Cau hinh hot update Android (spec OTA1 §3.4). Phai khop tools/hot-update/ota.config.json
       * (test/ota/otaConfig.test.ts); nativeVersion chi tool dung, client doc version tu apk.manifest.
       */
      const OTA_CONFIG = exports('OTA_CONFIG', {
        repo: 'https://github.com/arcadenix-ota/bikerivals-ota.git',
        cdnBase: 'https://raw.githubusercontent.com/arcadenix-ota/bikerivals-ota',
        pointerUrls: ['https://raw.githubusercontent.com/arcadenix-ota/bikerivals-ota/main/latest/android.json', 'https://cdn.jsdelivr.net/gh/arcadenix-ota/bikerivals-ota@main/latest/android.json'],
        pointerPath: 'latest/android.json',
        distBranch: 'dist-android',
        tagPrefix: 'android-',
        storageDir: 'bikerivals-ota'
      });

      /** Khoa localStorage ma hook main.js doc (spec §5). */
      const SEARCH_PATHS_KEY = exports('SEARCH_PATHS_KEY', 'HotUpdateSearchPaths');
      /** Bo dem khoi dong ma hook main.js tang moi lan dat search path; Boot dat ve '0' (spec §5 watchdog). */
      const BOOT_TRIES_KEY = exports('BOOT_TRIES_KEY', 'HotUpdateBootTries');
      /** Hook main.js cua APK build --no-ota dat '1'; ban thuong xoa khoa nay (spec §5). */
      const OTA_DISABLED_KEY = exports('OTA_DISABLED_KEY', 'HotUpdateDisabled');

      /** OTA bat tru khi hook bao ban build --no-ota. store = sys.localStorage. */
      function otaEnabled(store) {
        return store.getItem(OTA_DISABLED_KEY) !== '1';
      }
      /** Timeout moi URL con tro (spec §4.4). */
      const POINTER_TIMEOUT_MS = exports('POINTER_TIMEOUT_MS', 6000);
      /** Thoi gian toi khi biet ban tren mang moi hon (con tro + version.manifest) (spec §4.4 b). */
      const PRE_DOWNLOAD_BUDGET_MS = exports('PRE_DOWNLOAD_BUDGET_MS', 20000);
      /** Sau khi biet co ban moi: them toi da chung nay de tai project.manifest toi byte asset dau tien (spec §4.4 b). */
      const MANIFEST_BUDGET_MS = exports('MANIFEST_BUDGET_MS', 60000);
      /** Khong co su kien nao trong khoang nay = loi (spec §4.4 a). */
      const STALL_MS = exports('STALL_MS', 30000);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/otaFlow.ts", ['cc', './backoff.ts', './decide.ts', './otaConfig.ts', './pointer.ts', './version.ts'], function (exports) {
  var cclegacy, retryDelay, decide, PRE_DOWNLOAD_BUDGET_MS, STALL_MS, MANIFEST_BUDGET_MS, OTA_CONFIG, POINTER_TIMEOUT_MS, parsePointer, pickEffective;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      retryDelay = module.retryDelay;
    }, function (module) {
      decide = module.decide;
    }, function (module) {
      PRE_DOWNLOAD_BUDGET_MS = module.PRE_DOWNLOAD_BUDGET_MS;
      STALL_MS = module.STALL_MS;
      MANIFEST_BUDGET_MS = module.MANIFEST_BUDGET_MS;
      OTA_CONFIG = module.OTA_CONFIG;
      POINTER_TIMEOUT_MS = module.POINTER_TIMEOUT_MS;
    }, function (module) {
      parsePointer = module.parsePointer;
    }, function (module) {
      pickEffective = module.pickEffective;
    }],
    execute: function () {
      exports('runOta', runOta);
      cclegacy._RF.push({}, "a26d6vUnnFJEby52MqTj4fA", "otaFlow", undefined);

      /** 'store': APK thap hon minNativeVersion, khong goi enterGame / restart (spec B13-B15 §4.4). */

      async function fetchPointer(port) {
        for (const url of OTA_CONFIG.pointerUrls) {
          const text = await port.fetchText(url, POINTER_TIMEOUT_MS);
          if (text === null) continue;
          const p = parsePointer(text);
          if (p !== null) return p;
          port.log.warn('[ota] con tro sai dinh dang: ' + url);
        }
        return null;
      }
      function errText(e) {
        return e instanceof Error ? e.message : String(e);
      }
      async function runOta(port) {
        const t0 = port.now();
        try {
          port.setStatus({
            phase: 'checking'
          });
          const pointer = await fetchPointer(port);
          const apk = port.apkVersion();
          const effective = pickEffective(apk, port.cachedVersion());
          const d = decide({
            pointer,
            effective,
            apkVersion: apk,
            hasLocalUpdate: port.hasLocalUpdate()
          });
          port.log.debug(`[ota] apk=${apk} effective=${effective} pointer=${pointer === null ? 'none' : pointer.version} -> ${d.kind}`);
          if (d.kind === 'reset') {
            port.clearLocalUpdate();
            port.restart();
            return 'restart';
          }
          if (d.kind === 'needStore') {
            port.setStatus({
              phase: 'needStore'
            });
            return 'store';
          } else if (d.kind === 'update') {
            const left = PRE_DOWNLOAD_BUDGET_MS - (port.now() - t0);
            if (left > 0) return await runUpdate(port, d.pointer, left);
            port.log.warn('[ota] het ' + PRE_DOWNLOAD_BUDGET_MS + ' ms truoc khi tai');
          }
        } catch (e) {
          port.log.warn('[ota] loi: ' + errText(e));
        }
        port.enterGame();
        return 'enter';
      }
      function runUpdate(port, pointer, budgetMs) {
        return new Promise(resolve => {
          let done = false;
          let attempt = 0;
          let started = false;
          let manifestPhase = false;
          let cancelStall = () => {};
          let cancelBudget = () => {};
          let cancelRetry = () => {};
          const updater = port.createUpdater(pointer);
          const end = (wanted, why) => {
            if (done) return;
            done = true;
            cancelStall();
            cancelBudget();
            cancelRetry();
            let outcome = wanted;
            if (outcome === 'restart') {
              try {
                updater.apply();
              } catch (e) {
                port.log.warn('[ota] apply loi: ' + errText(e));
                outcome = 'enter';
              }
            }
            try {
              updater.dispose();
            } catch (e) {
              port.log.warn('[ota] dispose loi: ' + errText(e));
            }
            port.log.debug(`[ota] ket thuc (${why}) -> ${outcome}`);
            if (outcome === 'restart') port.restart();else port.enterGame();
            resolve(outcome);
          };
          const armStall = () => {
            cancelStall();
            cancelStall = port.schedule(STALL_MS, () => fail('khong co su kien ' + STALL_MS + ' ms'));
          };
          const fail = message => {
            if (done) return;
            cancelStall();
            cancelRetry();
            const delay = retryDelay(attempt);
            port.log.warn(`[ota] that bai lan ${attempt + 1}: ${message}`);
            if (delay === null) {
              end('enter', 'het luot thu lai');
              return;
            }
            attempt++;
            cancelRetry = port.schedule(delay, () => {
              if (done) return;
              armStall();
              try {
                updater.retry();
              } catch (e) {
                fail('retry loi: ' + errText(e));
              }
            });
          };
          const onEvent = e => {
            if (done) return;
            switch (e.type) {
              case 'upToDate':
                end('enter', 'engine bao da moi nhat');
                return;
              case 'checking':
                // Lan dau: doi ngan sach 20 s thanh MANIFEST_BUDGET_MS tinh tu bay gio; lan sau bo qua
                if (started || manifestPhase) return;
                manifestPhase = true;
                cancelBudget();
                cancelBudget = port.schedule(MANIFEST_BUDGET_MS, () => {
                  if (!started) end('enter', 'qua ' + MANIFEST_BUDGET_MS + ' ms tai manifest');
                });
                armStall();
                port.setStatus({
                  phase: 'downloading',
                  percent: null
                });
                return;
              case 'progress':
                {
                  if (e.totalBytes > 0 && !started) {
                    started = true;
                    cancelBudget();
                  }
                  const percent = e.totalBytes > 0 ? Math.min(100, Math.floor(e.downloadedBytes * 100 / e.totalBytes)) : null;
                  port.setStatus({
                    phase: 'downloading',
                    percent
                  });
                  armStall();
                  return;
                }
              case 'failed':
                fail(e.message);
                return;
              case 'finished':
                end('restart', 'tai xong');
                return;
            }
          };
          cancelBudget = port.schedule(budgetMs, () => {
            if (!started) end('enter', 'qua ' + PRE_DOWNLOAD_BUDGET_MS + ' ms chua bat dau tai');
          });
          armStall();
          try {
            updater.start(onEvent);
          } catch (e) {
            port.log.warn('[ota] start loi: ' + errText(e));
            end('enter', 'start loi');
          }
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PadButton.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Color, Graphics, _decorator, Component;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Graphics = module.Graphics;
      _decorator = module._decorator;
      Component = module.Component;
    }],
    execute: function () {
      var _dec, _dec2, _class, _class2, _descriptor;
      cclegacy._RF.push({}, "1ae2eOBmVRPuIjdH2aWJCrF", "PadButton", undefined);
      const {
        ccclass,
        property,
        executeInEditMode,
        requireComponent
      } = _decorator;
      const UP = new Color(20, 20, 20, 120);
      const DOWN = new Color(255, 200, 40, 200);
      const RIM = new Color(255, 255, 255, 180);

      /** A round on-screen pedal / lean button of the controls: dark, yellow while held. */
      let PadButton = exports('PadButton', (_dec = ccclass('PadButton'), _dec2 = requireComponent(Graphics), _dec(_class = executeInEditMode(_class = _dec2(_class = (_class2 = class PadButton extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "radius", _descriptor, this);
        }
        onEnable() {
          this.setDown(false);
        }
        onValidate() {
          this.setDown(false);
        }
        setDown(down) {
          const g = this.getComponent(Graphics);
          g.clear();
          g.fillColor = down ? DOWN : UP;
          g.strokeColor = RIM;
          g.lineWidth = 4;
          g.circle(0, 0, this.radius);
          g.fill();
          g.stroke();
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "radius", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 62;
        }
      }), _class2)) || _class) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ParallaxView.ts", ['cc', './Config.ts', './Assets.ts'], function (exports) {
  var cclegacy, Node, Layers, UITransform, Sprite, PX_PER_UNIT, tryLoadJson, preloadFrames, getFrame;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      Layers = module.Layers;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
    }, function (module) {
      PX_PER_UNIT = module.PX_PER_UNIT;
    }, function (module) {
      tryLoadJson = module.tryLoadJson;
      preloadFrames = module.preloadFrames;
      getFrame = module.getFrame;
    }],
    execute: function () {
      cclegacy._RF.push({}, "40843z+pp1NEY292QElZ8EQ", "ParallaxView", undefined);
      /**
       * Background layers from ParallaxConfig_*.plist (EditorParallaxSprite entities), placed like
       * ParallaxSprite -update: / -updateRepeatedSprites: in the original:
       * - all layers hang off a node at the screen centre scaled by the parallax zoom
       *   (-cameraZoom: 0.6 * camera zoom + 0.4, so they zoom less than the world);
       * - a layer at speed s sits at -eye * s, eye being the camera centre in points (world * 10);
       * - sprites are anchored bottom-left at position * 10 and repeat every xRepeatVal points;
       * - the background sprite is scaled to the screen width and hangs from the top of the screen
       *   (its optimizeY cropping only trims the bottom part the scenery covers).
       * Points are design pixels here (1 world unit = PX_PER_UNIT).
       */
      class ParallaxView {
        constructor(parent) {
          this.root = void 0;
          this.layers = [];
          this.root = new Node('Parallax');
          this.root.layer = Layers.Enum.UI_2D;
          this.root.addComponent(UITransform);
          parent.addChild(this.root);
        }
        async build(configName) {
          const cfg = await tryLoadJson(`prefabs/${configName}`);
          if (!cfg) return;
          const ents = cfg.Entities.filter(e => e.Type === 'EditorParallaxSprite').map((e, i) => ({
            p: e.Properties,
            i
          })).sort((a, b) => (a.p.z || 0) - (b.p.z || 0) || a.i - b.i);
          await preloadFrames(ents.map(({
            p
          }) => ({
            frame: p.frame,
            sheet: p.sheet,
            textureFile: p.textureFile
          })));
          for (const {
            p
          } of ents) {
            var _p$position, _p$position2;
            const frame = getFrame(p.frame, p.sheet) || getFrame(p.textureFile);
            if (!frame) {
              console.warn('[BR] parallax frame missing', p.frame);
              continue;
            }
            const layerNode = new Node('layer');
            layerNode.layer = Layers.Enum.UI_2D;
            layerNode.addComponent(UITransform);
            this.root.addChild(layerNode);
            const repeat = p.xRepeat ? p.xRepeatVal || 256 : 0;
            const count = repeat > 0 ? 12 : 1;
            const tiles = [];
            for (let k = 0; k < count; k++) {
              const n = new Node('tile');
              n.layer = Layers.Enum.UI_2D;
              const sp = n.addComponent(Sprite);
              sp.sizeMode = Sprite.SizeMode.RAW;
              sp.trim = false;
              sp.spriteFrame = frame;
              // ParallaxSprite -reloadSprite: background anchored at its bottom centre, the rest
              // bottom-left; the background is hung from its top edge here (see update)
              n.getComponent(UITransform).setAnchorPoint(p.background ? 0.5 : 0, p.background ? 1 : 0);
              n.angle = p.rotation || 0;
              layerNode.addChild(n);
              tiles.push(n);
            }
            this.layers.push({
              node: layerNode,
              tiles,
              x: (((_p$position = p.position) == null ? void 0 : _p$position[0]) || 0) * PX_PER_UNIT,
              y: (((_p$position2 = p.position) == null ? void 0 : _p$position2[1]) || 0) * PX_PER_UNIT,
              sx: p.xSpeed ?? 1,
              sy: p.ySpeed ?? 1,
              scale: p.scale ?? 1,
              repeat,
              flip: !!p.alternateFlipX,
              background: p.background ? frame.originalSize.width : 0
            });
          }
        }

        /**
         * @param eyeX camera centre in points (world units * PX_PER_UNIT)
         * @param zoom parallax zoom (ParallaxSprite -cameraZoom)
         * @param viewW visible width in points, @param viewH visible height in points
         */
        update(eyeX, eyeY, zoom, viewW, viewH) {
          this.root.setScale(zoom, zoom, 1);
          for (const l of this.layers) {
            if (l.background) {
              // undo the parallax zoom: screen width, top edge on the top of the screen
              const s = viewW / l.background;
              l.node.setScale(1 / zoom, 1 / zoom, 1);
              l.node.setPosition(0, 0);
              l.tiles[0].setScale(s * l.scale, s * l.scale, 1);
              l.tiles[0].setPosition(0, viewH / 2);
              continue;
            }
            const ox = -eyeX * l.sx,
              oy = -eyeY * l.sy;
            l.node.setPosition(ox, oy);
            l.node.setScale(1, 1, 1);
            if (l.repeat > 0) {
              // ParallaxSprite -updateRepeatedSprites: tiles every xRepeatVal from the left edge
              const left = -viewW / 2 / zoom - ox - l.x;
              const k0 = Math.floor(left / l.repeat);
              const need = Math.min(l.tiles.length, Math.ceil(viewW / zoom / l.repeat) + 2);
              for (let k = 0; k < l.tiles.length; k++) {
                const t = l.tiles[k];
                t.active = k < need;
                if (!t.active) continue;
                const idx = k0 + k;
                const flip = l.flip && Math.abs(idx) % 2 === 1 ? -1 : 1;
                t.setScale(l.scale * flip, l.scale, 1);
                // a mirrored tile still has to cover [x, x + width]
                const w = t.getComponent(UITransform).width * l.scale;
                t.setPosition(l.x + idx * l.repeat + (flip < 0 ? w : 0), l.y);
              }
            } else {
              l.tiles[0].setScale(l.scale, l.scale, 1);
              l.tiles[0].setPosition(l.x, l.y);
            }
          }
        }
        destroy() {
          this.root.destroy();
        }
      }
      exports('ParallaxView', ParallaxView);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PauseView.ts", ['cc', './Sound.ts', './CcbView.ts', './UiKit.ts'], function (exports) {
  var cclegacy, Color, _decorator, Sound, CcbView, label, rect, onClick;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      _decorator = module._decorator;
    }, function (module) {
      Sound = module.Sound;
    }, function (module) {
      CcbView = module.CcbView;
    }, function (module) {
      label = module.label;
      rect = module.rect;
      onClick = module.onClick;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "fb151qOhSxGToubxFYTIz0c", "PauseView", undefined);
      const {
        ccclass
      } = _decorator;

      /** A pause-menu setting of the port (not in the original): its current text, and what tapping it does. */

      /**
       * PauseMenu.ccbi: resume / restart / exit, the music switch, and the level's three star times under the
       * stars (the best result's stars lit). Below it the port's own control settings.
       */
      let PauseView = exports('PauseView', (_dec = ccclass('PauseView'), _dec(_class = class PauseView extends CcbView {
        init(thresholds, bestStars, cb, toggles) {
          var _this$animator;
          // the port's settings come in once the menu has
          const entered = (_this$animator = this.animator) == null ? void 0 : _this$animator.play('begin', () => {
            this.lightStars(bestStars);
            this.addToggles(toggles);
          });
          if (!entered) this.addToggles(toggles);
          this.lightStars(bestStars);
          thresholds.slice(0, 3).forEach((t, i) => {
            const at = this.find(`star${i + 1}Node_`);
            if (at) label(at, `${t}s`, 30, 0, 0, Color.WHITE, true);
          });
          const music = () => {
            const off = this.find('disabledMusicSprite_');
            if (off) off.active = !Sound.enabled;
          };
          music();
          this.onSelectors({
            btnResume: cb.resume,
            btnRestart: cb.restart,
            btnExit: cb.menu,
            btnToggleMusic: () => {
              Sound.toggle();
              music();
            }
          });
        }
        addToggles(toggles) {
          toggles.forEach((t, i) => {
            const row = rect(this.node, 460, 52, new Color(20, 20, 20, 200), 0, -232 - i * 62, 14, 'toggle');
            const l = label(row, t.text(), 24, 0, 0, Color.WHITE, false);
            onClick(row, () => {
              t.toggle();
              l.string = t.text();
            });
          });
        }
        lightStars(stars) {
          for (let i = 1; i <= 3; i++) {
            const on = this.find(`star${i}On_`);
            if (on) on.active = stars >= i;
          }
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PhysicsBuilder.ts", ['cc', './planck.mjs', './Geometry.ts', './LineJoint.ts'], function (exports) {
  var cclegacy, CircleShape, PolygonShape, ChainShape, PrismaticJoint, DistanceJoint, WeldJoint, RevoluteJoint, catmullRomClosed, dedupe, decomposeLikeOriginal, LineJoint;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      CircleShape = module.Circle;
      PolygonShape = module.Polygon;
      ChainShape = module.Chain;
      PrismaticJoint = module.PrismaticJoint;
      DistanceJoint = module.DistanceJoint;
      WeldJoint = module.WeldJoint;
      RevoluteJoint = module.RevoluteJoint;
    }, function (module) {
      catmullRomClosed = module.catmullRomClosed;
      dedupe = module.dedupe;
      decomposeLikeOriginal = module.decomposeLikeOriginal;
    }, function (module) {
      LineJoint = module.LineJoint;
    }],
    execute: function () {
      exports('outlineOf', outlineOf);
      cclegacy._RF.push({}, "e2867Qi0ypGpoqy0s4sa1K/", "PhysicsBuilder", undefined);
      const DEG = Math.PI / 180;
      /** Outline of a physics object in world coordinates (spline applied). */
      function outlineOf(e, raw = false) {
        const p = e.Properties;
        const vs = e.Vertexes || [];
        if (vs.length < 3) return vs.map(v => ({
          x: v.x,
          y: v.y
        }));
        let pts;
        if (p.spline) {
          const def = p.segments || 1;
          pts = catmullRomClosed(vs, vs.map(v => v.segments != null ? v.segments : def));
        } else {
          pts = vs.map(v => ({
            x: v.x,
            y: v.y
          }));
        }
        return raw ? pts : dedupe(pts);
      }
      function hex(v, def) {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.length) {
          const n = parseInt(v, 16);
          if (!isNaN(n)) return n;
        }
        return def;
      }

      /**
       * Builds planck bodies/joints for entities [from, to). Bodies are created with angle 0 at the
       * entity "position" (circles) or the mean of the vertexes (polygons); fixtures use the absolute
       * vertexes minus that origin.
       */
      class PhysicsBuilder {
        constructor(world, entities, ground) {
          this.bodies = new Map();
          this.joints = new Map();
          this.ground = void 0;
          this.world = world;
          this.entities = entities;
          this.ground = ground || world.createBody({
            type: 'static',
            userData: {
              idx: -1,
              name: 'ground',
              tag: 1,
              subtag: 0
            }
          });
        }
        build(from = 0, to = this.entities.length) {
          for (let i = from; i < to; i++) {
            const e = this.entities[i];
            if (e.Type === 'EditorPhysicsObject') this.buildBody(i, e);
          }
          for (let i = from; i < to; i++) {
            const e = this.entities[i];
            if (e.Anchors && e.Type.startsWith('EditorPhysics')) {
              try {
                this.buildJoint(i, e);
              } catch (err) {
                console.warn('[BR] joint failed', e.Properties.name, err);
              }
            }
          }
        }

        /** Level reset: destroy every joint and create them again from the entities. */
        rebuildJoints() {
          this.joints.forEach(j => this.world.destroyJoint(j));
          this.joints.clear();
          for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.Anchors && e.Type.startsWith('EditorPhysics')) {
              try {
                this.buildJoint(i, e);
              } catch (err) {
                console.warn('[BR] joint failed', e.Properties.name, err);
              }
            }
          }
        }
        bodyFor(idx) {
          return idx != null && idx >= 0 && this.bodies.get(idx) || this.ground;
        }
        buildBody(i, e) {
          const p = e.Properties;
          if (p.physics === false) return;
          let pos = p.position || [0, 0];
          const vs = p.shapeType !== 1 ? outlineOf(e, true) : [];
          if (vs.length >= 3) {
            // polygon bodies have their origin at the mean of the editor vertexes (before the spline is
            // applied) in the original (PhysicsObject -getTransformCenter:; the frame's powerCenter /
            // escapeShift are relative to it)
            const ev = e.Vertexes;
            pos = [ev.reduce((s, v) => s + v.x, 0) / ev.length, ev.reduce((s, v) => s + v.y, 0) / ev.length];
          }
          const isStatic = !!p.Static;
          const body = this.world.createBody({
            type: isStatic ? 'static' : 'dynamic',
            position: {
              x: pos[0],
              y: pos[1]
            },
            bullet: !!p.bullet,
            fixedRotation: !!p.fixedRotation,
            allowSleep: p.allowSleep !== false,
            awake: !p.startSleep,
            userData: {
              idx: i,
              name: p.name,
              tag: p.tag,
              subtag: p.subtag,
              bike: e.bike,
              noTraction: !!p.noTraction
            }
          });
          const fd = {
            density: p.density ?? 1,
            friction: p.friction ?? 0.5,
            restitution: p.restitution ?? 0,
            // tag 3 = "Trigger" in GameConfig Tags (geyser areas...): never solid
            isSensor: !!p.sensor || p.tag === 3,
            filterCategoryBits: hex(p.categoryBits, 1),
            filterMaskBits: hex(p.maskBits, 0xffff),
            filterGroupIndex: Math.round(p.groupIndex || 0)
          };
          let made = 0;
          if (p.shapeType === 1) {
            body.createFixture(new CircleShape({
              x: 0,
              y: 0
            }, Math.max(0.05, p.radius || 1)), fd);
            made++;
          } else {
            const outline = vs.map(v => ({
              x: v.x - pos[0],
              y: v.y - pos[1]
            }));
            if (outline.length >= 3) {
              // static ground too is built from convex polygons in the original (its Box2D has no chain
              // shapes), cut exactly like the original: wheels catch on the seams between them
              for (const part of decomposeLikeOriginal(outline)) {
                try {
                  body.createFixture(new PolygonShape(part), fd);
                  made++;
                } catch {
                  /* degenerate piece */
                }
              }
              if (!made && isStatic) {
                try {
                  body.createFixture(new ChainShape(outline, true), fd);
                  made++;
                } catch (err) {
                  console.warn('[BR] chain failed', p.name, err);
                }
              }
            }
          }
          if (!made) {
            this.world.destroyBody(body);
            return;
          }
          this.bodies.set(i, body);
        }
        buildJoint(i, e) {
          const p = e.Properties;
          const a = e.Anchors[0];
          if (!a) return;
          const collideConnected = !!p.collideConnected;
          let j = null;
          switch (e.Type) {
            case 'EditorPhysicsRevoluteJoint':
              {
                const bA = this.bodyFor(a.object_id),
                  bB = this.bodyFor(a.object2_id);
                if (bA === bB) return;
                // PhysicsRevoluteJoint -loadEntity: limits in degrees, motor speed passed through (rad/s)
                j = new RevoluteJoint({
                  collideConnected,
                  enableLimit: !!p.limited,
                  lowerAngle: (p.minLimit || 0) * DEG,
                  upperAngle: (p.maxLimit || 0) * DEG,
                  enableMotor: !!p.motor,
                  motorSpeed: p.speed || 0,
                  maxMotorTorque: p.maxTorque || 0
                }, bA, bB, {
                  x: a.x,
                  y: a.y
                });
                break;
              }
            case 'EditorPhysicsWeldJoint':
              {
                const bA = this.bodyFor(a.object_id),
                  bB = this.bodyFor(a.object2_id);
                if (bA === bB) return;
                j = new WeldJoint({
                  collideConnected
                }, bA, bB, {
                  x: a.x,
                  y: a.y
                });
                break;
              }
            case 'EditorPhysicsDistanceJoint':
              {
                const b = e.Anchors[1];
                if (!b) return;
                const bA = this.bodyFor(a.object_id),
                  bB = this.bodyFor(b.object_id);
                if (bA === bB) return;
                j = new DistanceJoint({
                  collideConnected,
                  frequencyHz: p.frequency || 0,
                  dampingRatio: p.damping || 0,
                  // PhysicsDistanceJoint -loadEntity sets m_length to the entity's "length", which can be
                  // far from the anchor distance: a spring preloaded by design (1-1 rock catapult:
                  // 2.44 vs 246). Only the editor's -relaxTension sets it to the anchor distance.
                  length: Number.isFinite(p.length) ? p.length : Math.hypot(b.x - a.x, b.y - a.y)
                }, bA, bB, {
                  x: a.x,
                  y: a.y
                }, {
                  x: b.x,
                  y: b.y
                });
                break;
              }
            case 'EditorPhysicsPrismaticJoint':
              {
                const bA = this.bodyFor(a.object_id),
                  bB = this.bodyFor(a.object2_id);
                if (bA === bB) return;
                // PhysicsPrismaticJoint -loadEntity: axis angle is measured from "up" (angle + pi/2)
                // and the translation limits are stored in degrees-like units (* pi/180)
                const ang = (p.axisAngle || 0) * DEG;
                const lo = (p.minLimit || 0) * DEG,
                  hi = (p.maxLimit || 0) * DEG;
                j = new PrismaticJoint({
                  collideConnected,
                  enableLimit: !!p.limited,
                  lowerTranslation: Math.min(lo, hi),
                  upperTranslation: Math.max(lo, hi),
                  enableMotor: !!p.motor,
                  motorSpeed: p.speed || 0,
                  maxMotorForce: p.maxForce || 0
                }, bA, bB, {
                  x: a.x,
                  y: a.y
                }, {
                  x: -Math.sin(ang),
                  y: Math.cos(ang)
                });
                break;
              }
            case 'EditorPhysicsLineJoint':
              {
                // Box2D 2.1 line joint: translation along an axis with limit and motor, free rotation
                // (bike forks: the limit is the fork travel)
                const bA = this.bodyFor(a.object_id),
                  bB = this.bodyFor(a.object2_id);
                if (bA === bB) return;
                const ang = (p.axisAngle || 0) * DEG; // measured from "up", as for prismatic joints
                const lo = (p.minLimit || 0) * DEG,
                  hi = (p.maxLimit || 0) * DEG;
                j = new LineJoint({
                  collideConnected,
                  enableLimit: !!p.limited,
                  lowerTranslation: Math.min(lo, hi),
                  upperTranslation: Math.max(lo, hi),
                  enableMotor: !!p.motor,
                  motorSpeed: p.speed || 0,
                  maxMotorForce: p.maxForce || 0
                }, bA, bB, {
                  x: a.x,
                  y: a.y
                }, {
                  x: -Math.sin(ang),
                  y: Math.cos(ang)
                });
                break;
              }
          }
          if (j) {
            this.world.createJoint(j);
            j.setUserData == null || j.setUserData({
              idx: i,
              name: p.name
            });
            this.joints.set(i, j);
          }
        }
      }
      exports('PhysicsBuilder', PhysicsBuilder);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/pointer.ts", ['cc', './version.ts'], function (exports) {
  var cclegacy, isVersion4, isVersion3, compareVersion, nativeOf;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      isVersion4 = module.isVersion4;
      isVersion3 = module.isVersion3;
      compareVersion = module.compareVersion;
      nativeOf = module.nativeOf;
    }],
    execute: function () {
      exports('parsePointer', parsePointer);
      cclegacy._RF.push({}, "3ec93DB77lFY4zdobgIS1Ww", "pointer", undefined);
      /** Sai bat ky luat nao -> null (coi nhu khong doc duoc con tro). */
      function parsePointer(text) {
        let o;
        try {
          o = JSON.parse(text.replace(/^\uFEFF/, ''));
        } catch {
          return null;
        }
        if (o === null || typeof o !== 'object' || Array.isArray(o)) return null;
        const r = o;
        const {
          version,
          tag,
          minNativeVersion,
          reset
        } = r;
        if (r.schema !== 1) return null;
        if (!isVersion4(version) || !isVersion3(minNativeVersion)) return null;
        if (typeof tag !== 'string' || tag === '') return null;
        if (typeof reset !== 'boolean') return null;
        if (compareVersion(nativeOf(version), minNativeVersion) < 0) return null;
        return {
          version,
          tag,
          minNativeVersion,
          reset
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Progress.ts", ['cc', './Config.ts'], function (exports) {
  var cclegacy, sys, SAVE_KEY, DEV_UNLOCK_ALL_KEY, SELECTED_BIKE_KEY, SHOP_BIKES, DEFAULT_BIKE;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
    }, function (module) {
      SAVE_KEY = module.SAVE_KEY;
      DEV_UNLOCK_ALL_KEY = module.DEV_UNLOCK_ALL_KEY;
      SELECTED_BIKE_KEY = module.SELECTED_BIKE_KEY;
      SHOP_BIKES = module.SHOP_BIKES;
      DEFAULT_BIKE = module.DEFAULT_BIKE;
    }],
    execute: function () {
      exports({
        formatTime: formatTime,
        getRecord: getRecord,
        getSelectedBike: getSelectedBike,
        isUnlockAll: isUnlockAll,
        isUnlocked: isUnlocked,
        saveResult: saveResult,
        setSelectedBike: setSelectedBike,
        setUnlockAll: setUnlockAll
      });
      cclegacy._RF.push({}, "62df9hjcylK7oECoo0aEJrY", "Progress", undefined);

      /** Best time / stars per level, saved in localStorage. */

      let data = null;
      function loadAll() {
        if (data) return data;
        try {
          data = JSON.parse(sys.localStorage.getItem(SAVE_KEY) || '{}') || {};
        } catch {
          data = {};
        }
        return data;
      }
      function getRecord(id) {
        return loadAll()[id] || null;
      }

      /** Returns true if this is a new best time. */
      function saveResult(id, time, stars) {
        const all = loadAll();
        const old = all[id];
        const better = !old || time < old.time;
        all[id] = {
          time: better ? time : old.time,
          stars: Math.max(stars, (old == null ? void 0 : old.stars) || 0)
        };
        try {
          sys.localStorage.setItem(SAVE_KEY, JSON.stringify(all));
        } catch {
          /* storage unavailable: progress lives for this session only */
        }
        return better;
      }
      let unlockAll = null;

      /** Dev: all levels unlocked (main menu "DEV" button). */
      function isUnlockAll() {
        if (unlockAll === null) {
          try {
            unlockAll = sys.localStorage.getItem(DEV_UNLOCK_ALL_KEY) === '1';
          } catch {
            unlockAll = false;
          }
        }
        return unlockAll;
      }
      function setUnlockAll(on) {
        unlockAll = on;
        try {
          if (on) sys.localStorage.setItem(DEV_UNLOCK_ALL_KEY, '1');else sys.localStorage.removeItem(DEV_UNLOCK_ALL_KEY);
        } catch {
          /* storage unavailable: the switch lasts for this session only */
        }
      }

      /** Prefab of the bike chosen on the bike screen (DEFAULT_BIKE until one is chosen). */
      function getSelectedBike() {
        let p = null;
        try {
          p = sys.localStorage.getItem(SELECTED_BIKE_KEY);
        } catch {
          /* storage unavailable */
        }
        return SHOP_BIKES.some(b => b.prefab === p) ? p : DEFAULT_BIKE;
      }
      function setSelectedBike(prefab) {
        try {
          sys.localStorage.setItem(SELECTED_BIKE_KEY, prefab);
        } catch {
          /* storage unavailable: the default bike stays */
        }
      }

      /** A level is unlocked if it is the first of its pack or the previous one is completed (or the dev switch is on). */
      function isUnlocked(prefix, n) {
        return isUnlockAll() || n === 1 || !!getRecord(prefix + (n - 1));
      }
      function formatTime(t) {
        const m = Math.floor(t / 60);
        const s = t - m * 60;
        return (m > 0 ? m + ':' + (s < 10 ? '0' : '') : '') + s.toFixed(2);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ResultView.ts", ['cc', './CcbAnimator.ts', './Sound.ts', './Progress.ts', './CcbView.ts'], function (exports) {
  var cclegacy, Label, tween, Vec3, _decorator, CcbAnimator, Sound, formatTime, CcbView, findNode;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Label = module.Label;
      tween = module.tween;
      Vec3 = module.Vec3;
      _decorator = module._decorator;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      Sound = module.Sound;
    }, function (module) {
      formatTime = module.formatTime;
    }, function (module) {
      CcbView = module.CcbView;
      findNode = module.findNode;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "f20f0l3AqNNnaYUsxHffZyT", "ResultView", undefined);
      const {
        ccclass
      } = _decorator;
      const STAR_DELAY = 0.3;

      /**
       * LevelCompletedMenu.ccbi: the "begin" entrance, then the stars won one by one, the time, and the best
       * time effect (NewBestTimeEffect.ccbi with the old best struck through, or BestTimeEffect.ccbi).
       * Next is hidden after the last level.
       */
      let ResultView = exports('ResultView', (_dec = ccclass('ResultView'), _dec(_class = class ResultView extends CcbView {
        constructor(...args) {
          super(...args);
          this.instant = false;
        }
        /** `instant` skips the entrance and the reveal timing (for screenshots). */
        init(time, stars, newBest, best, hasNext, cb, instant = false) {
          var _this$animator;
          this.instant = instant;
          const next = this.find('menuPlay_');
          if (next) next.active = hasNext;
          this.onSelectors({
            btnNext: cb.next,
            btnExit: cb.menu,
            btnRestart: cb.restart
          });
          const reveal = () => this.reveal(time, stars, newBest, best);
          if (!((_this$animator = this.animator) != null && _this$animator.play('begin', reveal))) reveal();else if (instant) this.runOut(this.animator);
        }
        reveal(time, stars, newBest, best) {
          this.showStars(stars, true);
          this.after(STAR_DELAY * 3, () => {
            var _this$animator2, _findNode, _findNode2;
            // begin_2 brings the buttons in; it also puts back what it does not animate, so set the rest after it
            (_this$animator2 = this.animator) == null || _this$animator2.play('begin_2');
            if (this.instant) this.runOut(this.animator);
            this.showStars(stars, false);
            for (const n of ['timeTextLabel_', 'timeTTF_']) {
              const node = this.find(n);
              if (node) node.active = true;
            }
            const t = this.label('timeTTF_');
            if (t) t.string = formatTime(time);
            const effect = this.find(newBest ? 'ccbNewBestTime_' : 'ccbBestTime_');
            if (!effect) return;
            effect.active = true;
            // both effects have a bestTimeTTF_: look inside the one shown
            const bestTime = (_findNode = findNode(effect, 'bestTimeTTF_')) == null ? void 0 : _findNode.getComponent(Label);
            if (bestTime) bestTime.string = formatTime(newBest || best == null ? time : best);
            const old = (_findNode2 = findNode(effect, 'bestTimeOldTTF_')) == null ? void 0 : _findNode2.getComponent(Label);
            if (old) {
              old.string = best == null ? '' : formatTime(best);
              old.node.active = best != null;
            }
            const fx = effect.getComponentInChildren(CcbAnimator);
            fx == null || fx.play('begin');
            if (this.instant) this.runOut(fx);
          });
        }

        /** The three star slots, and the stars won: one by one with a pop (`animate`), or all at once. */
        showStars(stars, animate) {
          for (let i = 1; i <= 3; i++) {
            const off = this.find(`star${i}Off_`);
            if (off) off.active = true;
            const on = this.find(`star${i}On_`);
            if (!on || i > stars) continue;
            if (!animate || this.instant) {
              on.active = true;
              continue;
            }
            this.after(STAR_DELAY * (i - 1), () => {
              on.active = true;
              on.setScale(1.6, 1.6, 1);
              tween(on).to(0.15, {
                scale: new Vec3(1, 1, 1)
              }).start();
              Sound.play('sfx_checkpoint');
            });
          }
        }
        after(delay, fn) {
          if (this.instant) fn();else this.scheduleOnce(fn, delay);
        }
        runOut(a) {
          for (let i = 0; i < 1200 && a != null && a.running; i++) a.update(1 / 60);
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Screens.ts", ['cc', './Config.ts', './CcbButton.ts', './Assets.ts', './Progress.ts', './CcbView.ts'], function (exports) {
  var cclegacy, UITransform, Label, Node, Sprite, UIOpacity, WORLDS, CCB_CLICK, preloadFrames, getRecord, formatTime, findNode;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
      Label = module.Label;
      Node = module.Node;
      Sprite = module.Sprite;
      UIOpacity = module.UIOpacity;
    }, function (module) {
      WORLDS = module.WORLDS;
    }, function (module) {
      CCB_CLICK = module.CCB_CLICK;
    }, function (module) {
      preloadFrames = module.preloadFrames;
    }, function (module) {
      getRecord = module.getRecord;
      formatTime = module.formatTime;
    }, function (module) {
      findNode = module.findNode;
    }],
    execute: function () {
      exports('preloadUi', preloadUi);
      cclegacy._RF.push({}, "1bfc6brAkpHk7cK4DCLV94T", "Screens", undefined);

      /** Nitro charges that fill the HUD gauge, and the colour strip's scale along the gauge when full. */
      const NITRO_FULL = 3;
      const NITRO_FILL = 1.27;
      /** Opacity of the nitro button with no charge (greyed out). */
      const NITRO_EMPTY_OPACITY = 140;

      /** Sheets and textures the menus and the HUD take frames from by name. */
      async function preloadUi() {
        await preloadFrames([{
          frame: 'Background_Normal.png',
          sheet: 'MainMenu'
        }, {
          frame: 'Play.png',
          sheet: 'MainMenu'
        }, {
          frame: 'btn_back.png',
          sheet: 'menusheet_hd'
        }, {
          frame: 'LevelMarkerSmall0.png',
          sheet: 'LevelSelection'
        }, {
          frame: 'Star_Bigger.png',
          sheet: 'LevelSelection'
        }, {
          frame: 'World_Locked.png',
          sheet: 'LevelSelection'
        }, {
          frame: 'bike.png',
          sheet: 'MainMenu2'
        }, ...WORLDS.map((_, i) => ({
          frame: '',
          textureFile: `LevelSelectBK${i + 1}.png`
        }))]);
      }

      /** The in-level HUD: an instance of Hud.prefab (timer, level name, pause / restart, nitro button and count, message). */
      class Hud {
        constructor(root, levelId, cb) {
          this.timeLabel = void 0;
          this.nitroFill = void 0;
          this.nitro = void 0;
          this.msg = void 0;
          this.w = void 0;
          this.h = void 0;
          this.root = root;
          const tf = root.getComponent(UITransform);
          this.w = tf.width;
          this.h = tf.height;
          const find = name => findNode(root, name);
          this.timeLabel = find('time').getComponent(Label);
          const best = getRecord(levelId);
          find('best').getComponent(Label).string = best ? formatTime(best.time) : '';
          this.nitroFill = find('nitroFill');
          root.on(CCB_CLICK, e => e.selector === 'pause' ? cb.pause() : e.selector === 'restart' ? cb.restart() : undefined);
          this.nitro = find('nitro');
          // fires on touch down (-ccTouchesBegan:), not on a click: the thumb usually lands while the other one
          // holds the gas, and Samsung's palm rejection then cancels that second touch before it lifts
          this.nitro.on(Node.EventType.TOUCH_START, cb.nitro);
          this.placeNitro(false);
          this.msg = find('message').getComponent(Label);
        }
        setTime(t) {
          this.timeLabel.string = formatTime(t);
        }

        /**
         * Tilt mode: flush with the bottom-left corner, which NitroButton.png is cut for (the button takes the
         * touches it covers on the brake third); button mode: above the gas button.
         */
        placeNitro(tilt) {
          var _this$nitro$getCompon;
          // the frame's own size: the node's UITransform can still be 0 x 0 here
          const size = (_this$nitro$getCompon = this.nitro.getComponent(Sprite).spriteFrame) == null ? void 0 : _this$nitro$getCompon.originalSize;
          const sc = this.nitro.scale.x;
          const bw = ((size == null ? void 0 : size.width) ?? 140) * sc,
            bh = ((size == null ? void 0 : size.height) ?? 147) * sc;
          if (tilt) {
            this.nitro.setPosition(-this.w / 2 + bw / 2, -this.h / 2 + bh / 2);
          } else {
            this.nitro.setPosition(this.w / 2 - 95, -this.h / 2 + 235);
          }
        }

        /**
         * The gauge on the left edge: full from NITRO_FULL charges up (the port counts charges, not fuel). The
         * button greys out while there is no charge to use.
         */
        setNitro(n) {
          this.nitroFill.setScale(NITRO_FILL * Math.min(1, n / NITRO_FULL), this.nitroFill.scale.y, 1);
          this.nitro.getComponent(Sprite).grayscale = n <= 0;
          const op = this.nitro.getComponent(UIOpacity) || this.nitro.addComponent(UIOpacity);
          op.opacity = n > 0 ? 255 : NITRO_EMPTY_OPACITY;
        }
        message(text) {
          this.msg.string = text;
        }
      }
      exports('Hud', Hud);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Sound.ts", ['cc'], function (exports) {
  var cclegacy, Node, AudioSource, resources, JsonAsset, AudioClip;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      AudioSource = module.AudioSource;
      resources = module.resources;
      JsonAsset = module.JsonAsset;
      AudioClip = module.AudioClip;
    }],
    execute: function () {
      cclegacy._RF.push({}, "09179jbcWNGrYIiwa2jDRGk", "Sound", undefined);

      /** Sound effects, music and a crossfaded engine loop (clips from the original FMOD banks). */

      const clips = new Map();
      function loadClip(name) {
        if (clips.has(name)) return Promise.resolve(clips.get(name));
        return new Promise(resolve => {
          resources.load(`audio/${name}`, AudioClip, (err, clip) => {
            clips.set(name, err ? null : clip);
            resolve(err ? null : clip);
          });
        });
      }

      /**
       * One instrument of an engine event (tools/fmod_engine.py): played on [start, end] of the RPM
       * parameter, its volume the product of its curves (points [x, y, curvature]), its pitch RPM / ref
       * (ref 0: fixed), pre-rendered at a ladder of pitches.
       */

      const ENGINE_VOLUME = 0.7;
      function curveAt(points, x) {
        if (x <= points[0][0]) return points[0][1];
        for (let i = 1; i < points.length; i++) {
          const [x1, y1] = points[i];
          if (x <= x1) {
            const [x0, y0] = points[i - 1];
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1);
          }
        }
        return points[points.length - 1][1];
      }
      class Sound {
        static init(host) {
          this.node = new Node('Sound');
          host.addChild(this.node);
          this.sfxSource = this.node.addComponent(AudioSource);
          this.sfxSource.playOnAwake = false;
          this.musicSource = this.node.addComponent(AudioSource);
          this.musicSource.loop = true;
          this.musicSource.volume = 0.5;
        }
        static async preload(names) {
          await Promise.all(names.map(loadClip));
        }

        /** Loads the engine event of a bike (Engine3, Engine_ktm, ...); its loops start silent. */
        static async loadEngine(bank) {
          if (this.engineBank === bank || !this.node) return;
          this.engineBank = bank;
          this.engine.forEach(layer => layer.forEach(s => s.destroy()));
          this.engine = [];
          this.engineEvent = null;
          const ev = await new Promise(resolve => {
            resources.load(`audio/engine/${bank}`, JsonAsset, (err, a) => resolve(err ? null : a.json));
          });
          if (!ev || this.engineBank !== bank) return;
          const layers = await Promise.all(ev.layers.map(l => Promise.all(l.steps.map(s => loadClip(`engine/${s.file}`)))));
          if (this.engineBank !== bank) return;
          this.engine = layers.map(clipsOfLayer => clipsOfLayer.map(c => {
            const s = this.node.addComponent(AudioSource);
            // the sound node outlives scenes and is re-enabled by each one: no restart on that
            s.playOnAwake = false;
            s.loop = true;
            s.volume = 0;
            s.clip = c;
            // native decodes a clip on its first play(), on the game thread (~100 ms for these loops):
            // do it now, while the level loads, not when the RPM first reaches each rung mid-ride
            if (c) {
              s.play();
              s.pause();
            }
            return s;
          }));
          this.engineEvent = ev;
        }
        static play(name, volume = 1) {
          if (!this.enabled || !this.sfxSource) return;
          const c = clips.get(name);
          if (c) this.sfxSource.playOneShot(c, volume);else loadClip(name);
        }
        static playRandom(names, volume = 1) {
          this.play(names[Math.floor(Math.random() * names.length)], volume);
        }
        static async music(name) {
          if (!this.musicSource || this.currentMusic === name) return;
          this.currentMusic = name;
          const c = await loadClip(name);
          if (!c || this.currentMusic !== name) return;
          this.musicSource.stop();
          this.musicSource.clip = c;
          if (this.enabled) this.musicSource.play();
        }

        /**
         * SoundManager -setEngineRPM:Load:Min:Max: the event's RPM parameter is min + (max - min) * rpm.
         * Each layer gets its curve volume and plays the pre-rendered rung nearest RPM / ref. Two rungs are
         * 12% apart: mixed for long they beat like two engines out of tune (the RPM rests between rungs at
         * full gas), so only the nearest one sounds; the volume smoothing makes the switch a ~0.1 s
         * crossfade, and a rung coming in starts at the same point of the loop as the one going out (the
         * rungs are one loop resampled), so they do not cancel each other meanwhile.
         */
        static setEngine(rpm, on, rpmMin = 14, rpmMax = 106) {
          const ev = this.engineEvent;
          if (!ev) return;
          const v = Math.max(ev.min, Math.min(ev.max, rpmMin + (rpmMax - rpmMin) * rpm));
          ev.layers.forEach((l, li) => {
            const sources = this.engine[li];
            let gain = on && this.enabled && v >= l.start && v <= l.end ? ENGINE_VOLUME * (ev.gain ?? 1) : 0;
            for (const c of l.curves) gain *= curveAt(c, v);
            const pitch = l.ref > 0 ? v / l.ref : 1;
            const steps = l.steps;
            let near = 0;
            steps.forEach((st, i) => {
              if (Math.abs(Math.log(pitch / st.pitch)) < Math.abs(Math.log(pitch / steps[near].pitch))) near = i;
            });
            sources.forEach((s, i) => {
              const target = i === near ? gain : 0;
              s.volume += (target - s.volume) * 0.35;
              if (s.volume > 0.005 && !s.playing && s.clip) {
                const lead = sources.reduce((a, o) => o !== s && o.playing && (!a || o.volume > a.volume) ? o : a, null);
                if ((lead == null ? void 0 : lead.duration) > 0 && s.duration > 0) s.currentTime = lead.currentTime / lead.duration * s.duration;
                s.play();
              }
              if (s.volume <= 0.005 && s.playing) s.pause();
            });
          });
        }

        /** Silences the engine at once (leaving a level: its sources live on past the game scene). */
        static stopEngine() {
          this.engine.forEach(layer => layer.forEach(s => {
            s.volume = 0;
            s.pause();
          }));
        }
        static toggle() {
          var _this$musicSource;
          this.enabled = !this.enabled;
          if (this.enabled && (_this$musicSource = this.musicSource) != null && _this$musicSource.clip) this.musicSource.play();
          if (!this.enabled) {
            var _this$musicSource2;
            (_this$musicSource2 = this.musicSource) == null || _this$musicSource2.pause();
            this.engine.forEach(layer => layer.forEach(s => s.pause()));
          }
          return this.enabled;
        }
      }
      exports('Sound', Sound);
      Sound.node = void 0;
      Sound.sfxSource = void 0;
      Sound.musicSource = void 0;
      Sound.engineEvent = null;
      Sound.engineBank = '';
      /** one looping source per pre-rendered pitch, per layer */
      Sound.engine = [];
      Sound.currentMusic = '';
      Sound.enabled = true;
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SpecialsView.ts", ['cc', './Config.ts', './Assets.ts', './Progress.ts', './CcbView.ts', './LevelButtonView.ts', './UiKit.ts'], function (exports) {
  var cclegacy, Sprite, Color, Node, UITransform, instantiate, _decorator, WORLDS, getFrame, isUnlocked, getRecord, CcbView, LevelButtonView, label, sprite, rect;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Sprite = module.Sprite;
      Color = module.Color;
      Node = module.Node;
      UITransform = module.UITransform;
      instantiate = module.instantiate;
      _decorator = module._decorator;
    }, function (module) {
      WORLDS = module.WORLDS;
    }, function (module) {
      getFrame = module.getFrame;
    }, function (module) {
      isUnlocked = module.isUnlocked;
      getRecord = module.getRecord;
    }, function (module) {
      CcbView = module.CcbView;
    }, function (module) {
      LevelButtonView = module.LevelButtonView;
    }, function (module) {
      label = module.label;
      sprite = module.sprite;
      rect = module.rect;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "c70b5EeuHVFSZQnjyPnWa/5", "SpecialsView", undefined);
      const {
        ccclass
      } = _decorator;

      /** The special packs (WORLDS entries after the four map worlds), one page each. */
      const PAGES = [4, 5];
      const COLUMNS = 5;
      /** Grid pitch of the level buttons inside levelSelectionNode_ (pixels, before its 0.9 scale). */
      const PITCH_X = 200;
      const PITCH_Y = 170;
      const SWIPE = 80;

      /**
       * LevelMenu.ccbi, the original's grid of levels for the special packs: one page per pack, page dots at the
       * bottom (pageLeft_ / pageRight_), swipe to turn. The grid itself was laid out in code; this one centres
       * five-column rows in levelSelectionNode_.
       */
      let SpecialsView = exports('SpecialsView', (_dec = ccclass('SpecialsView'), _dec(_class = class SpecialsView extends CcbView {
        constructor(...args) {
          super(...args);
          this.page = 0;
          this.grid = void 0;
          this.title = null;
          this.startX = 0;
          this.levelButton = void 0;
          this.onLevel = void 0;
        }
        init(levelButton, page, cb) {
          this.levelButton = levelButton;
          this.onLevel = cb.level;
          this.grid = this.find('levelSelectionNode_');
          this.background();
          // the bike / coins bar (CurrentBikeMenu.ccbi): the port has no shop or coins
          const bikeBar = this.find('changeBikeMenu_');
          if (bikeBar) bikeBar.active = false;
          // the pack titles (text_trialpack.png ...) are not in the converted sheets: the pack name instead
          const top = this.find('topTextSprite_');
          if (top) {
            var _top$getComponent;
            (_top$getComponent = top.getComponent(Sprite)) == null || _top$getComponent.destroy();
            this.title = label(top, '', 56, 0, 0, new Color(255, 214, 40), true);
          }
          this.onSelectors({
            clickBack: cb.back
          });
          this.node.on(Node.EventType.TOUCH_START, e => this.startX = e.getUILocation().x, this, true);
          this.node.on(Node.EventType.TOUCH_END, e => {
            const dx = e.getUILocation().x - this.startX;
            if (Math.abs(dx) > SWIPE) this.show(this.page + (dx < 0 ? 1 : -1));
          }, this, true);
          this.show(page);
        }

        /**
         * The .ccbi has no background (the original showed it over another screen): the main menu's, darkened.
         */
        background() {
          this.layoutBackground();
          this.node.on(Node.EventType.SIZE_CHANGED, this.layoutBackground, this);
        }
        layoutBackground() {
          var _this$node$getChildBy, _this$node$getChildBy2, _bg$getComponent$spri;
          (_this$node$getChildBy = this.node.getChildByName('background')) == null || _this$node$getChildBy.destroy();
          (_this$node$getChildBy2 = this.node.getChildByName('shade')) == null || _this$node$getChildBy2.destroy();
          const tf = this.node.getComponent(UITransform);
          const bg = sprite(this.node, getFrame('Background_Normal.png', 'MainMenu'), 0, 0, 1, 'background');
          const sz = (_bg$getComponent$spri = bg.getComponent(Sprite).spriteFrame) == null ? void 0 : _bg$getComponent$spri.originalSize;
          if (sz) {
            const k = Math.max(tf.width / sz.width, tf.height / sz.height);
            bg.setScale(k, k, 1);
          }
          bg.setSiblingIndex(0);
          rect(this.node, tf.width, tf.height, new Color(0, 0, 0, 150), 0, 0, 0, 'shade').setSiblingIndex(1);
        }
        show(page) {
          this.page = Math.max(0, Math.min(PAGES.length - 1, page));
          const wd = WORLDS[PAGES[this.page]];
          this.grid.destroyAllChildren();
          const rows = Math.ceil(wd.levels / COLUMNS);
          for (let n = 1; n <= wd.levels; n++) {
            var _getRecord;
            const i = n - 1,
              r = Math.floor(i / COLUMNS),
              c = i % COLUMNS;
            const cell = new Node('level' + n);
            cell.layer = this.grid.layer;
            this.grid.addChild(cell);
            cell.setPosition((c - (COLUMNS - 1) / 2) * PITCH_X, ((rows - 1) / 2 - r) * PITCH_Y);
            const dot = instantiate(this.levelButton);
            cell.addChild(dot);
            const id = wd.prefix + n;
            dot.addComponent(LevelButtonView).show(n, PAGES[this.page], isUnlocked(wd.prefix, n), ((_getRecord = getRecord(id)) == null ? void 0 : _getRecord.stars) || 0, false, () => this.onLevel(id));
          }
          const left = this.find('pageLeft_'),
            right = this.find('pageRight_');
          if (left) left.active = this.page === 0;
          if (right) right.active = this.page === 1;
          if (this.title) this.title.string = wd.name.toUpperCase();
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainMesh.ts", ['cc', './Assets.ts', './Geometry.ts'], function (exports) {
  var cclegacy, Node, Layers, utils, Texture2D, MeshRenderer, UIMeshRenderer, terrainMaterial, triangulate, signedArea;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      Layers = module.Layers;
      utils = module.utils;
      Texture2D = module.Texture2D;
      MeshRenderer = module.MeshRenderer;
      UIMeshRenderer = module.UIMeshRenderer;
    }, function (module) {
      terrainMaterial = module.terrainMaterial;
    }, function (module) {
      triangulate = module.triangulate;
      signedArea = module.signedArea;
    }],
    execute: function () {
      exports({
        buildEdge: buildEdge,
        buildFill: buildFill
      });
      cclegacy._RF.push({}, "f9434h/Pd5AI5/rseLPcohL", "TerrainMesh", undefined);

      /*
       * Textured terrain, following PhysicsObject -triangulate / -calculateEdgeVertex:Last:LastLast:Index:
       * in libgame.so. Vertices are in the owning node's local space (world units, 1 unit = 10 points).
       *
       *  fill: uv = rotate(textureRot)(fillTile * 10x / W, -fillTile * 10y / H)
       *  edge: a strip around the whole outline; each vertex is pushed along its averaged outward
       *        normal by s = 0.025 * H * edgeSize, from -s*(1 + edgeOffset) (v = 1, inside) to
       *        +s*(1 - edgeOffset) (v = 0, outside); u advances 20 * length / (W * edgeSize).
       */

      function makeMeshNode(name, positions, uvs, indices, tex, key) {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (let i = 0; i < positions.length; i += 3) {
          minX = Math.min(minX, positions[i]);
          maxX = Math.max(maxX, positions[i]);
          minY = Math.min(minY, positions[i + 1]);
          maxY = Math.max(maxY, positions[i + 1]);
        }
        const mesh = utils.MeshUtils.createMesh({
          positions,
          uvs,
          indices,
          minPos: {
            x: minX,
            y: minY,
            z: 0
          },
          maxPos: {
            x: maxX,
            y: maxY,
            z: 0
          }
        });
        tex.setWrapMode(Texture2D.WrapMode.REPEAT, Texture2D.WrapMode.REPEAT);
        const mr = node.addComponent(MeshRenderer);
        mr.mesh = mesh;
        mr.setSharedMaterial(terrainMaterial(tex, key), 0);
        node.addComponent(UIMeshRenderer);
        return node;
      }
      function buildFill(outline, tex, texKey, tile, rotDeg) {
        const idx = triangulate(outline);
        if (!idx.length) return null;
        const t = tile || 1;
        const r = (rotDeg || 0) * (Math.PI / 180);
        const c = Math.cos(r),
          s = Math.sin(r);
        const positions = [];
        const uvs = [];
        for (const p of outline) {
          positions.push(p.x, p.y, 0);
          const u = t * 10 * p.x / tex.width;
          const v = -t * 10 * p.y / tex.height;
          uvs.push(u * c - v * s, u * s + v * c);
        }
        return makeMeshNode('fill', positions, uvs, idx, tex, texKey);
      }

      /** Strip along the whole closed outline (the original draws every edge). */
      function buildEdge(outline, tex, texKey, edgeSize, edgeOffset) {
        const n = outline.length;
        if (n < 3) return null;
        const size = edgeSize || 1;
        const half = 0.025 * tex.height * size;
        const eo = edgeOffset || 0;
        // outward = right of the walking direction for counter-clockwise outlines
        const sign = signedArea(outline) > 0 ? 1 : -1;
        const positions = [];
        const uvs = [];
        const indices = [];
        let u = 0;
        for (let k = 0; k <= n; k++) {
          const i = k % n;
          const prev = outline[(i - 1 + n) % n],
            cur = outline[i],
            next = outline[(i + 1) % n];
          let ax = cur.x - prev.x,
            ay = cur.y - prev.y;
          let bx = next.x - cur.x,
            by = next.y - cur.y;
          const la = Math.hypot(ax, ay) || 1,
            lb = Math.hypot(bx, by) || 1;
          ax /= la;
          ay /= la;
          bx /= lb;
          by /= lb;
          let tx = (ax + bx) * 0.5,
            ty = (ay + by) * 0.5;
          const lt = Math.hypot(tx, ty) || 1;
          tx /= lt;
          ty /= lt;
          const ox = ty * sign * half,
            oy = -tx * sign * half;
          if (k > 0) u += 20 * la / (tex.width * size);
          positions.push(cur.x - ox * (1 + eo), cur.y - oy * (1 + eo), 0);
          uvs.push(u, 1);
          positions.push(cur.x + ox * (1 - eo), cur.y + oy * (1 - eo), 0);
          uvs.push(u, 0);
          if (k > 0) {
            const b = (k - 1) * 2;
            indices.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
          }
        }
        return makeMeshNode('edge', positions, uvs, indices, tex, texKey);
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/UiKit.ts", ['cc'], function (exports) {
  var cclegacy, Node, Layers, UITransform, Sprite, Color, Label, LabelOutline, HorizontalTextAlignment, Graphics, Button, Vec3;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      Layers = module.Layers;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Color = module.Color;
      Label = module.Label;
      LabelOutline = module.LabelOutline;
      HorizontalTextAlignment = module.HorizontalTextAlignment;
      Graphics = module.Graphics;
      Button = module.Button;
      Vec3 = module.Vec3;
    }],
    execute: function () {
      exports({
        label: label,
        onClick: onClick,
        rect: rect,
        setDefaultFont: setDefaultFont,
        setPos: setPos,
        sprite: sprite,
        uiNode: uiNode
      });
      cclegacy._RF.push({}, "6c34apLb71J7qLrqhzyaJv8", "UiKit", undefined);

      /** Small helpers to build UI from code (no prefabs needed). */

      let defaultFont = null;
      function setDefaultFont(f) {
        defaultFont = f;
      }
      function uiNode(name, parent, w = 0, h = 0) {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        const tf = n.addComponent(UITransform);
        tf.setContentSize(w, h);
        if (parent) parent.addChild(n);
        return n;
      }
      function sprite(parent, frame, x = 0, y = 0, scale = 1, name = 'sprite') {
        const n = uiNode(name, parent);
        const sp = n.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.RAW;
        sp.trim = false;
        if (frame) sp.spriteFrame = frame;
        n.setPosition(x, y);
        n.setScale(scale, scale, 1);
        return n;
      }
      function label(parent, text, size = 32, x = 0, y = 0, color = Color.WHITE, useFont = true) {
        const n = uiNode('label', parent);
        const l = n.addComponent(Label);
        if (useFont && defaultFont) {
          l.font = defaultFont;
          l.useSystemFont = false;
        } else {
          l.useSystemFont = true;
          l.isBold = true;
          const o = n.addComponent(LabelOutline);
          o.color = new Color(0, 0, 0, 200);
          o.width = 2;
        }
        l.fontSize = size;
        l.lineHeight = size * 1.1;
        l.horizontalAlign = HorizontalTextAlignment.CENTER;
        l.color = color;
        l.string = text;
        n.setPosition(x, y);
        return l;
      }

      /** Filled rounded rectangle, used for panels and fallback buttons. */
      function rect(parent, w, h, fill, x = 0, y = 0, radius = 12, name = 'rect') {
        const n = uiNode(name, parent, w, h);
        const g = n.addComponent(Graphics);
        g.fillColor = fill;
        g.roundRect(-w / 2, -h / 2, w, h, radius);
        g.fill();
        n.setPosition(x, y);
        return n;
      }
      function onClick(n, cb) {
        const tf = n.getComponent(UITransform);
        const b = n.addComponent(Button);
        b.transition = Button.Transition.SCALE;
        b.zoomScale = 0.92;
        b.target = n;
        n.on(Button.EventType.CLICK, cb);
        if (tf && tf.width === 0) {
          const sp = n.getComponent(Sprite);
          if (sp != null && sp.spriteFrame) tf.setContentSize(sp.spriteFrame.originalSize);
        }
      }
      function setPos(n, x, y) {
        n.setPosition(new Vec3(x, y, 0));
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/version.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        compareVersion: compareVersion,
        isVersion3: isVersion3,
        isVersion4: isVersion4,
        nativeOf: nativeOf,
        pickEffective: pickEffective,
        tagBase: tagBase
      });
      cclegacy._RF.push({}, "afc1cObelhL+oFxCjebqAhQ", "version", undefined);
      /** Version noi dung A.B.C.D va version native A.B.C (spec OTA1 §2). */
      const RE3 = /^\d+\.\d+\.\d+$/;
      const RE4 = /^\d+\.\d+\.\d+\.\d+$/;
      function isVersion3(s) {
        return typeof s === 'string' && RE3.test(s);
      }
      function isVersion4(s) {
        return typeof s === 'string' && RE4.test(s);
      }

      /** So tung so; thieu so coi la 0. Tra -1/0/1 (dung lam versionCompareHandle cua jsb.AssetsManager). */
      function compareVersion(a, b) {
        const x = a.split('.');
        const y = b.split('.');
        for (let i = 0; i < Math.max(x.length, y.length); i++) {
          const d = (parseInt(x[i] ?? '0', 10) || 0) - (parseInt(y[i] ?? '0', 10) || 0);
          if (d !== 0) return d < 0 ? -1 : 1;
        }
        return 0;
      }
      function nativeOf(v) {
        return v.split('.').slice(0, 3).join('.');
      }

      /** Version hieu luc: ban tai neu khong cu hon APK (hook main.js da xoa ban cu hon). */
      function pickEffective(apk, cached) {
        return cached !== null && compareVersion(cached, apk) >= 0 ? cached : apk;
      }
      function tagBase(cdnBase, tag) {
        return `${cdnBase}/${tag}/android/`;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Water.ts", ['cc', './planck.mjs'], function (exports) {
  var cclegacy, PolygonShape, Manifold, CircleShape;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      PolygonShape = module.Polygon;
      Manifold = module.Manifold;
      CircleShape = module.Circle;
    }],
    execute: function () {
      cclegacy._RF.push({}, "3637cC/31lJ05DfRoo/nHxG", "Water", undefined);
      /** WaterTrigger -setFluidType: buoyancy and wave settings of each fluid (0 water, 1 lava, 2 toxic, 3 purple, 4 ice water, 5 honey). */
      const FLUID_DEFAULTS = {
        0: {
          density: 1,
          linearDrag: 1,
          angularDrag: 1,
          drawDamping: 0.99,
          drawDiffusion: 0.9
        },
        1: {
          density: 1.5,
          linearDrag: 5,
          angularDrag: 5,
          drawDamping: 0.96,
          drawDiffusion: 0.8
        },
        5: {
          density: 5,
          linearDrag: 2,
          angularDrag: 1,
          drawDamping: 0.73,
          drawDiffusion: 0.73
        }
      };

      /** WaterSplash.ccbi "begin" sequence length, in seconds. */
      const SPLASH_TIME = exports('SPLASH_TIME', 1);
      /** lava_blow (animations.plist): Blow01..Blow11 at 20 fps. */
      const LAVA_BLOW_FRAMES = exports('LAVA_BLOW_FRAMES', 11);
      const LAVA_BLOW_FPS = 20;

      /** WaterSplash.ccbi, played by Waves -makeSplashAt:Intensity: (fresh water, intensity >= 0.9). In points. */

      /** Bubble (Waves -addBubble:): rises 25 points/s for 4-6 s or until it reaches the surface. */

      /** Waves -runExplosionAnim:Angle:Scale: on lava, anchored on the surface. */

      /**
       * WaterTrigger (libgame.so). The trigger box is a solid fixture whose contacts are disabled in
       * PreSolve (a sensor here); touching bodies go to a Box2D b2BuoyancyController (normal (0,1),
       * offset = surface height, density, linearDrag, angularDrag, world gravity).
       *
       * The level ("offset", 1 = full) moves toward destinationOffset every update:
       *   offset += |dest - offset| > offsetChangeSpeed ? +-offsetChangeSpeed : (dest - offset) * 0.01
       * surface y = position.y - height / 2 + height * offset.
       *
       * The surface is a Waves object: `count` columns (width / 2) of a damped verlet height field in
       * points (Waves -vertlet, -diffuse, a random ripple each update), dented by everything that
       * falls in (-makeSplashAt:Intensity:). Waves are in points: world units * 10.
       */
      class WaterArea {
        constructor(world, idx, e) {
          var _p$position, _p$position2;
          this.sensor = void 0;
          this.offset = void 0;
          this.dest = void 0;
          this.changeSpeed = 0.001;
          this.density = void 0;
          this.linearDrag = void 0;
          this.angularDrag = void 0;
          this.fluidType = void 0;
          this.x = void 0;
          this.y = void 0;
          this.w = void 0;
          this.h = void 0;
          /** editor z of the trigger: the waves are drawn there */
          this.z = void 0;
          this.offset0 = void 0;
          /** Bodies in the water and how many of their fixtures touch the sensor. */
          this.bodies = new Map();
          /** Waves bounds, in points */
          this.bx = void 0;
          this.by = void 0;
          this.bw = void 0;
          this.bh = void 0;
          this.count = void 0;
          this.dx = void 0;
          this.damping = void 0;
          this.diffusion = void 0;
          /** current and previous column heights */
          this.h2 = void 0;
          this.h1 = void 0;
          this.splashes = [];
          this.bubbles = [];
          this.blows = [];
          this.bubbleDelay = 0.1;
          this.lavaBlowTimer = 1.5;
          /** the rider's head in the fluid (WaterTrigger headDiving_) and for how long */
          this.headDiving = null;
          this.underwaterTime = 0;
          this.idx = idx;
          const p = e.Properties;
          this.x = ((_p$position = p.position) == null ? void 0 : _p$position[0]) || 0;
          this.y = ((_p$position2 = p.position) == null ? void 0 : _p$position2[1]) || 0;
          this.w = p.width || 10;
          this.h = p.height || 10;
          this.z = p.z ?? 1;
          this.offset = this.dest = this.offset0 = p.offset ?? 1;
          this.fluidType = p.fluidType || 0;
          const d = FLUID_DEFAULTS[this.fluidType] || FLUID_DEFAULTS[0];
          this.density = p.density ?? d.density;
          this.linearDrag = p.linearDrag ?? d.linearDrag;
          this.angularDrag = p.angularDrag ?? d.angularDrag;
          this.damping = p.drawDamping ?? d.drawDamping;
          this.diffusion = p.drawDiffusion ?? d.drawDiffusion;
          this.sensor = world.createBody({
            type: 'kinematic',
            position: {
              x: this.x,
              y: this.sensorY()
            },
            userData: {
              idx,
              name: p.name,
              tag: 2,
              subtag: 0
            }
          });
          const f = this.sensor.createFixture(new PolygonShape([{
            x: -this.w / 2,
            y: -this.h / 2
          }, {
            x: this.w / 2,
            y: -this.h / 2
          }, {
            x: this.w / 2,
            y: this.h / 2
          }, {
            x: -this.w / 2,
            y: this.h / 2
          }]), {
            isSensor: true,
            density: 0
          });
          f.setUserData({
            water: this
          });
          // WaterTrigger -loadEntity: Waves initWithBounds:(10x - 5w, 10y - 5h, 10w, 10h) count:(int)w / 2
          this.bx = this.x * 10 - this.w * 5;
          this.by = this.y * 10 - this.h * 5;
          this.bw = this.w * 10;
          this.bh = this.h * 10;
          this.count = Math.max(3, Math.trunc(Math.trunc(this.w) * 0.5));
          this.dx = this.bw / (this.count - 1);
          this.h1 = new Float32Array(this.count);
          this.h2 = new Float32Array(this.count);
        }
        sensorY() {
          return this.y + this.h * (this.offset - 1);
        }
        get surface() {
          return this.y + this.h / 2 + this.h * (this.offset - 1);
        }

        /** Waves -getWaterLevelY: the still surface, in points. */
        get levelY() {
          return this.by + this.bh * this.offset;
        }

        /** Level reset (the entity is loaded again): initial level, flat new Waves. */
        reset() {
          this.offset = this.dest = this.offset0;
          this.sensor.setPosition({
            x: this.x,
            y: this.sensorY()
          });
          this.h1.fill(0);
          this.h2.fill(0);
          this.splashes.length = this.bubbles.length = this.blows.length = 0;
          this.bubbleDelay = 0.1;
          this.lavaBlowTimer = 1.5;
          this.headDiving = null;
          this.underwaterTime = 0;
        }

        /** Trigger action 9: change the level (Trigger -update: speedChange * 0.0045 + 0.0005 per update). */
        setDestination(offset, speedChange) {
          this.dest = offset;
          this.changeSpeed = (speedChange ?? 0.1) * 0.0045 + 0.0005;
        }

        /**
         * -addContact: / -removeContact:. Every fixture touching the trigger adds its body to the
         * controller once more. On contact the surface is dented where the shapes meet, harder the
         * faster the body moves. Returns true when the rider's head (`head`) just went in.
         */
        contact(c, other, begin, head, effects = true) {
          const b = other.getBody();
          if (!b.isDynamic() || other.isSensor()) return false;
          const n = (this.bodies.get(b) || 0) + (begin ? 1 : -1);
          if (n <= 0) this.bodies.delete(b);else this.bodies.set(b, n);
          if (!begin) {
            if (b === head) {
              this.headDiving = null;
              this.underwaterTime = 0;
            }
            return false;
          }
          if (!effects) return false;
          const v = b.getLinearVelocity();
          const intensity = Math.min(1, Math.max(0.4, Math.hypot(v.x, v.y) * 0.02));
          this.makeSplash((contactX(c) ?? b.getPosition().x) * 10 - this.bx, intensity);
          if (b !== head) return false;
          this.headDiving = b;
          return true;
        }
        forget(b) {
          this.bodies.delete(b);
          if (b === this.headDiving) this.headDiving = null;
        }

        /** All contacts are counted again (bike respawn). */
        clearBodies() {
          this.bodies.clear();
          this.headDiving = null;
          this.underwaterTime = 0;
        }

        /** Waves -makeSplashAt:Intensity:, x in points from the left edge. */
        makeSplash(x, intensity) {
          const i = Math.max(1, Math.min(this.count - 1, Math.trunc(x / this.dx)));
          const f = this.fluidType === 1 ? -0.5 * intensity : -intensity;
          const h = this.h2;
          const dent = (k, d) => {
            if (k < this.count) h[k] = Math.min(50, Math.max(-40, h[k] + d));
          };
          dent(i - 1, f * 4);
          dent(i, f * 5);
          dent(i + 1, f * 4);
          if (this.fluidType !== 0 || intensity < 0.9) return;
          const scale = intensity * 0.4;
          this.splashes.push({
            x: this.bx + x,
            idx: Math.min(i, this.count - 1),
            drop: Math.random() * 20,
            y: this.levelY - 5,
            scale,
            scaleX: scale * (0.7 + Math.random() * 0.5),
            t: 0
          });
        }

        /**
         * WaterTrigger -update: (with Waves -update:), then the b2BuoyancyController step on every
         * awake body in the water.
         */
        step(world, dt) {
          this.updateWaves(dt);
          const diff = this.dest - this.offset;
          this.offset += Math.abs(diff) > this.changeSpeed ? diff > 0 ? this.changeSpeed : -this.changeSpeed : diff * 0.01;
          this.sensor.setPosition({
            x: this.x,
            y: this.sensorY()
          });
          // bubbles out of the head while it is under fresh water (5 s at most)
          const head = this.headDiving;
          if (head && this.fluidType === 0) {
            this.underwaterTime += dt;
            if (this.underwaterTime < 5) this.addBubble(head.getPosition().x, head.getPosition().y);
          }
          this.updateParticles(dt);
          this.buoyancy(world);
        }

        /** Waves -update: verlet + diffusion, a random ripple; splashes ride the waves; lava blows. */
        updateWaves(dt) {
          const n = this.count;
          // -vertlet
          const prev = this.h1,
            cur = this.h2;
          for (let i = 0; i < n; i++) prev[i] = cur[i] * 2 - prev[i];
          this.h1 = cur;
          this.h2 = prev;
          // -diffuse
          const h = this.h2,
            damp = this.damping,
            k = this.diffusion;
          let left = h[0],
            mid = h[0],
            right = h[1];
          h[0] = damp * (mid * k + (mid + right) * 0.5 * (1 - k));
          for (let i = 1; i < n - 1; i++) {
            mid = right;
            right = h[i + 1];
            h[i] = damp * (mid * k + (left + right) * 0.5 * (1 - k));
            left = mid;
          }
          h[n - 1] = damp * (right * k + (mid + right) * 0.5 * (1 - k));
          // a ripple somewhere
          const at = Math.floor(Math.random() * (n - 2));
          const r = Math.floor(Math.random() * 20) * 0.05;
          h[at] += r * 0.5;
          h[at + 1] += r;
          h[at + 2] += r * 0.5;
          if (this.fluidType === 0) {
            for (const s of this.splashes) s.y = h[s.idx] + (this.levelY - 20 - s.drop);
            if (this.bubbleDelay > 0) this.bubbleDelay -= dt;
          } else if (this.fluidType === 1) {
            this.lavaBlowTimer -= dt;
            if (this.lavaBlowTimer < 0) {
              this.lavaBlowTimer = Math.floor(Math.random() * 150) * 0.01;
              const x = Math.floor(Math.random() * Math.trunc(this.bw * 80)) * 0.01 - this.bw * 0.4 + this.bx + this.bw * 0.5;
              const scale = Math.floor(Math.random() * 50) * 0.02 + 0.5;
              this.blows.push({
                x,
                y: this.levelY,
                scale: Math.min(2, scale),
                flip: Math.random() < 0.5,
                t: 0
              });
            }
            for (const b of this.blows) b.y = this.levelY;
          }
        }

        /** Waves -addBubble: at a world point, every 0.1 s, only well below the surface. */
        addBubble(x, y) {
          if (this.bubbleDelay > 0) return;
          const by = (y + Math.random() * 3 - 1.5) * 10;
          if (by > this.levelY - 10) return;
          this.bubbles.push({
            x: (x + Math.random() * 3 - 1.5) * 10,
            y: by,
            scale: 1 + Math.random(),
            life: 4 + Math.random() * 2
          });
          this.bubbleDelay = 0.1;
        }
        updateParticles(dt) {
          const surf = this.levelY - 5;
          for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y += dt * 25;
            b.life -= dt;
            if (b.life < 0 || b.y > surf) this.bubbles.splice(i, 1);
          }
          for (let i = this.splashes.length - 1; i >= 0; i--) {
            if ((this.splashes[i].t += dt) >= SPLASH_TIME) this.splashes.splice(i, 1);
          }
          for (let i = this.blows.length - 1; i >= 0; i--) {
            if ((this.blows[i].t += dt) >= LAVA_BLOW_FRAMES / LAVA_BLOW_FPS) this.blows.splice(i, 1);
          }
        }

        /** Frame of a lava blow (0-based). */
        static blowFrame(b) {
          return Math.min(LAVA_BLOW_FRAMES - 1, Math.floor(b.t * LAVA_BLOW_FPS));
        }
        buoyancy(world) {
          const g = world.getGravity();
          const surf = this.surface;
          // b2Controller::AddBody does not dedupe: the original adds one controller edge per fixture
          // contact, so a body with n fixtures in the water gets buoyancy and drag n times (this is
          // what keeps triangulated rafts with density 1 afloat)
          this.bodies.forEach((n, b) => {
            if (!b.isAwake()) return;
            let area = 0,
              cx = 0,
              cy = 0;
            for (let f = b.getFixtureList(); f; f = f.getNext()) {
              if (f.isSensor()) continue;
              const r = submerged(f, surf);
              if (r.area <= 0) continue;
              area += r.area;
              cx += r.cx * r.area;
              cy += r.cy * r.area;
            }
            if (area < 1e-6) return;
            cx /= area;
            cy /= area;
            const c = {
              x: cx,
              y: cy
            };
            b.applyForce({
              x: -this.density * area * g.x * n,
              y: -this.density * area * g.y * n
            }, c, true);
            const v = b.getLinearVelocityFromWorldPoint(c);
            const drag = this.linearDrag * area * n;
            b.applyForce({
              x: -v.x * drag,
              y: -v.y * drag
            }, c, true);
            const m = b.getMass();
            if (m > 0) b.applyTorque(-b.getInertia() / m * area * n * b.getAngularVelocity() * this.angularDrag, true);
          });
        }
      }
      exports('WaterArea', WaterArea);
      const manifold = new Manifold();

      /**
       * x of the first point of the contact's world manifold, where the original dents the surface. The
       * trigger is a sensor here, so the manifold the original's solid fixture gets is evaluated on demand.
       */
      function contactX(c) {
        const fa = c.getFixtureA(),
          fb = c.getFixtureB();
        const xfA = fa.getBody().getTransform(),
          xfB = fb.getBody().getTransform();
        manifold.pointCount = 0;
        c.evaluate(manifold, xfA, xfB);
        if (manifold.pointCount < 1) return null;
        const wm = manifold.getWorldManifold(null, xfA, fa.getShape().getRadius(), xfB, fb.getShape().getRadius());
        return wm.points[0].x;
      }

      /** Area and centroid of a fixture below the horizontal line y = level (world space). */
      function submerged(f, level) {
        const b = f.getBody();
        const shape = f.getShape();
        if (shape instanceof CircleShape || (shape.getType == null ? void 0 : shape.getType()) === 'circle') {
          const c = b.getWorldPoint(shape.getCenter());
          const r = shape.getRadius();
          const d = level - c.y; // distance from centre up to the surface
          if (d <= -r) return {
            area: 0,
            cx: 0,
            cy: 0
          };
          if (d >= r) return {
            area: Math.PI * r * r,
            cx: c.x,
            cy: c.y
          };
          // circular segment below the surface
          const h = r + d;
          const theta = 2 * Math.acos((r - h) / r);
          const area = r * r * (theta - Math.sin(theta)) / 2;
          const cyOff = 4 * r * Math.pow(Math.sin(theta / 2), 3) / (3 * (theta - Math.sin(theta)));
          return {
            area,
            cx: c.x,
            cy: c.y - cyOff
          };
        }
        const verts = (shape.m_vertices || []).map(v => b.getWorldPoint(v));
        if (verts.length < 3) return {
          area: 0,
          cx: 0,
          cy: 0
        };
        // clip polygon to y <= level (Sutherland-Hodgman, single plane)
        const out = [];
        for (let i = 0; i < verts.length; i++) {
          const a = verts[i],
            c = verts[(i + 1) % verts.length];
          const ain = a.y <= level,
            cin = c.y <= level;
          if (ain) out.push(a);
          if (ain !== cin) {
            const t = (level - a.y) / (c.y - a.y);
            out.push({
              x: a.x + (c.x - a.x) * t,
              y: level
            });
          }
        }
        if (out.length < 3) return {
          area: 0,
          cx: 0,
          cy: 0
        };
        let area = 0,
          cx = 0,
          cy = 0;
        for (let i = 0; i < out.length; i++) {
          const p = out[i],
            q = out[(i + 1) % out.length];
          const cr = p.x * q.y - q.x * p.y;
          area += cr;
          cx += (p.x + q.x) * cr;
          cy += (p.y + q.y) * cr;
        }
        area /= 2;
        if (Math.abs(area) < 1e-9) return {
          area: 0,
          cx: 0,
          cy: 0
        };
        return {
          area: Math.abs(area),
          cx: cx / (6 * area),
          cy: cy / (6 * area)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WaterView.ts", ['cc', './Config.ts', './Assets.ts', './Water.ts'], function (exports) {
  var cclegacy, utils, MeshRenderer, UIMeshRenderer, Sprite, Color, UITransform, Node, Layers, PX_PER_UNIT, stylePackSetting, preloadFrames, vertexColorMaterial, getFrame, LAVA_BLOW_FRAMES, SPLASH_TIME, WaterArea;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      utils = module.utils;
      MeshRenderer = module.MeshRenderer;
      UIMeshRenderer = module.UIMeshRenderer;
      Sprite = module.Sprite;
      Color = module.Color;
      UITransform = module.UITransform;
      Node = module.Node;
      Layers = module.Layers;
    }, function (module) {
      PX_PER_UNIT = module.PX_PER_UNIT;
    }, function (module) {
      stylePackSetting = module.stylePackSetting;
      preloadFrames = module.preloadFrames;
      vertexColorMaterial = module.vertexColorMaterial;
      getFrame = module.getFrame;
    }, function (module) {
      LAVA_BLOW_FRAMES = module.LAVA_BLOW_FRAMES;
      SPLASH_TIME = module.SPLASH_TIME;
      WaterArea = module.WaterArea;
    }],
    execute: function () {
      cclegacy._RF.push({}, "779d1pba+JHlq0Mi+5Eg8/q", "WaterView", undefined);
      /**
       * Waves -draw colours per fluid type (globalColor_ white): the body is a strip from the bottom
       * (`bottom`) to the wavy surface (`top`; alpha -1: clamp(200 + wave height, 0, 255)), then a
       * 3-pixel line along the surface (`line`, 0..1) and, except for water and ice water, a 50-point
       * glow above it (`glow` at the surface fading to nothing).
       */
      const STYLES = {
        0: {
          bottom: [10, 44, 88, 255],
          top: [0, 107, 156, -1],
          line: [0, 0.6862745, 0.8117647, 0.8]
        },
        1: {
          bottom: [255, 198, 0, 255],
          top: [243, 93, 67, 255],
          line: [1, 0.7764706, 0, 0.8],
          glow: [160, 80, 0, 20]
        },
        2: {
          bottom: [2, 144, 10, 178],
          top: [0, 150, 12, 100],
          line: [0.8156863, 1, 0.59607846, 0.8],
          glow: [0, 120, 0, 20]
        },
        3: {
          bottom: [85, 6, 121, 178],
          top: [154, 0, 224, 100],
          line: [0.8156863, 1, 0.59607846, 0.8],
          glow: [154, 0, 224, 20]
        },
        4: {
          bottom: [85, 159, 255, 255],
          top: [109, 209, 255, -1],
          line: [1, 1, 1, 0.8]
        },
        5: {
          bottom: [254, 149, 0, 255],
          top: [254, 243, 0, 50],
          line: [1, 1, 1, 1],
          glow: [100, 90, 0, 20]
        }
      };

      /** A keyframe track: [time, value, easing] with easing applied from that key to the next. */

      function sample(track, t) {
        if (t <= track[0][0]) return track[0][1];
        for (let i = 1; i < track.length; i++) {
          const [t1, v1] = track[i];
          if (t > t1) continue;
          const [t0, v0, ease] = track[i - 1];
          let p = (t - t0) / (t1 - t0);
          // CCBuilder CubicIn / CubicOut with rate 2: CCEaseIn t^2, CCEaseOut t^(1/2)
          if (ease === 'in') p = p * p;else if (ease === 'out') p = Math.sqrt(p);
          return v0.map((v, k) => v + (v1[k] - v) * p);
        }
        return track[track.length - 1][1];
      }

      /** WaterSplash.ccbi "begin": the jump (node tag 2), its squash (tag 3), WaterBlow.png's opacity (tag 4). */
      const SPLASH_Y = [[0, [0], 'out'], [0.13333334, [205], 'in'], [0.6333333, [0], 'linear'], [0.76666665, [20], 'linear'], [0.9, [0], 'linear']];
      const SPLASH_SCALE = [[0, [1.4, 0.1], 'out'], [0.13333334, [0.88, 1.1], 'in'], [0.6333333, [1.5, 0.1], 'linear']];
      const SPLASH_OPACITY = [[0, [20], 'linear'], [0.033333335, [150], 'linear'], [0.4, [150], 'linear'], [0.7, [0], 'linear']];
      const BLOW_FRAMES = Array.from({
        length: LAVA_BLOW_FRAMES
      }, (_, i) => `Blow${String(i + 1).padStart(2, '0')}.png`);
      function pointsNode(name) {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        n.addComponent(UITransform);
        return n;
      }
      function spriteNode(name, frame, sheet) {
        const n = pointsNode(name);
        const sp = n.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.RAW;
        sp.trim = false;
        sp.spriteFrame = getFrame(frame, sheet);
        return n;
      }

      /** One strip of quads between two rows of `count` vertices each. */
      function stripIndices(out, first, count) {
        for (let i = 0; i < count - 1; i++) {
          const b0 = first + i * 2,
            t0 = b0 + 1,
            b1 = b0 + 2,
            t1 = b0 + 3;
          out.push(b0, t0, b1, t0, t1, b1);
        }
      }

      /** The drawn part of a WaterTrigger: Waves (in front, at the trigger's z) and BackWaves (z -5). */
      class WaterView {
        constructor(water) {
          var _stylePackSetting;
          /** in points, like the original's Waves node */
          this.front = void 0;
          this.back = void 0;
          this.blowLayer = void 0;
          this.bubbleLayer = void 0;
          this.splashLayer = void 0;
          this.frontMesh = void 0;
          this.backMesh = void 0;
          this.style = void 0;
          this.warm = 0;
          this.nodes = new Map();
          this.water = water;
          // a style pack can recolour a fluid type ("water": {"<fluidType>": {bottom, top, line, glow}})
          const packed = (_stylePackSetting = stylePackSetting('water')) == null ? void 0 : _stylePackSetting[water.fluidType];
          this.style = {
            ...(STYLES[water.fluidType] || STYLES[3]),
            ...packed
          };
          this.front = pointsNode('Waves');
          this.front.setScale(1 / PX_PER_UNIT, 1 / PX_PER_UNIT, 1);
          // children with negative z draw before the waves: lava blows -10, bubbles -2, splashes -1
          this.blowLayer = pointsNode('LavaBlows');
          this.bubbleLayer = pointsNode('Bubbles');
          this.splashLayer = pointsNode('Splashes');
          this.front.addChild(this.blowLayer);
          this.front.addChild(this.bubbleLayer);
          this.front.addChild(this.splashLayer);
          this.frontMesh = this.makeMesh(this.front, !!this.style.glow);
          // WaterTrigger -loadEntity: water and purple fluid are also drawn behind the bike
          if (water.fluidType === 0 || water.fluidType === 3) {
            this.back = pointsNode('BackWaves');
            this.back.setScale(1 / PX_PER_UNIT, 1 / PX_PER_UNIT, 1);
            this.backMesh = this.makeMesh(this.back, false);
          } else {
            this.back = null;
            this.backMesh = null;
          }
        }
        static async preload() {
          await preloadFrames([{
            frame: 'Bubble.png'
          }, ...BLOW_FRAMES.map(frame => ({
            frame
          }))]);
        }
        makeMesh(parent, glow) {
          const n = this.water.count;
          const verts = n * 2 * (glow ? 3 : 2);
          const idx = [];
          stripIndices(idx, 0, n);
          stripIndices(idx, n * 2, n);
          if (glow) stripIndices(idx, n * 4, n);
          const positions = new Float32Array(verts * 3);
          const colors = new Float32Array(verts * 4);
          const indices = Uint16Array.from(idx);
          const mesh = utils.MeshUtils.createDynamicMesh(0, {
            positions,
            colors,
            indices16: indices
          }, undefined, {
            maxSubMeshes: 1,
            maxSubMeshVertices: verts,
            maxSubMeshIndices: indices.length
          });
          const node = pointsNode('mesh');
          const mr = node.addComponent(MeshRenderer);
          mr.mesh = mesh;
          mr.setSharedMaterial(vertexColorMaterial(), 0);
          node.addComponent(UIMeshRenderer);
          parent.addChild(node);
          return {
            mesh,
            positions,
            colors,
            indices
          };
        }

        /** Waves -draw (and BackWaves -draw: no glow); `pxPerPoint` keeps the line 3 pixels wide. */
        sync(pxPerPoint) {
          const w = this.water;
          // the glow flickers on lava: warmFactor += 0.8 per draw
          let glowHeight = 50;
          if (w.fluidType === 1) {
            this.warm += 0.8;
            glowHeight += Math.sin(this.warm) * 2.5;
          }
          this.fill(this.frontMesh, pxPerPoint, this.style.glow ? glowHeight : 0);
          if (this.backMesh) this.fill(this.backMesh, pxPerPoint, 0);
          this.syncSprites();
        }
        fill(m, pxPerPoint, glowHeight) {
          const w = this.water,
            s = this.style,
            n = w.count,
            h = w.h2;
          const {
            positions: pos,
            colors: col
          } = m;
          const level = w.levelY;
          const half = 1.5 / Math.max(1e-3, pxPerPoint);
          const put = (v, x, y, c, scale = 255) => {
            pos[v * 3] = x;
            pos[v * 3 + 1] = y;
            pos[v * 3 + 2] = 0;
            col[v * 4] = c[0] / scale;
            col[v * 4 + 1] = c[1] / scale;
            col[v * 4 + 2] = c[2] / scale;
            col[v * 4 + 3] = c[3] / scale;
          };
          const top = [...s.top];
          const none = [0, 0, 0, 0];
          let minY = w.by,
            maxY = level;
          for (let i = 0; i < n; i++) {
            const x = w.bx + w.dx * i;
            const y = level + h[i];
            if (s.top[3] < 0) top[3] = Math.min(255, Math.max(0, h[i] + 200));
            put(i * 2, x, w.by, s.bottom);
            put(i * 2 + 1, x, y, top);
            // GL_LINE_STRIP with glLineWidth(3): widened across the (mostly horizontal) surface
            put(n * 2 + i * 2, x, y - half, s.line, 1);
            put(n * 2 + i * 2 + 1, x, y + half, s.line, 1);
            if (glowHeight) {
              put(n * 4 + i * 2, x, y, s.glow);
              put(n * 4 + i * 2 + 1, x, y + glowHeight, none);
            }
            maxY = Math.max(maxY, y + half + glowHeight);
            minY = Math.min(minY, y - half);
          }
          m.mesh.updateSubMesh(0, {
            positions: pos,
            colors: col,
            indices16: m.indices,
            minPos: {
              x: w.bx,
              y: minY,
              z: 0
            },
            maxPos: {
              x: w.bx + w.bw,
              y: maxY,
              z: 0
            }
          });
        }
        syncSprites() {
          const w = this.water;
          const alive = new Set();
          for (const s of w.splashes) {
            alive.add(s);
            const n = this.nodes.get(s) || this.makeSplash(s);
            n.setPosition(s.x, s.y);
            const jump = n.children[0],
              squash = jump.children[0],
              sprite = squash.children[0].getComponent(Sprite);
            const t = Math.min(s.t, SPLASH_TIME);
            jump.setPosition(0, sample(SPLASH_Y, t)[0]);
            const [sx, sy] = sample(SPLASH_SCALE, t);
            squash.setScale(sx, sy, 1);
            sprite.color = new Color(255, 255, 255, sample(SPLASH_OPACITY, t)[0]);
          }
          for (const b of w.bubbles) {
            alive.add(b);
            let n = this.nodes.get(b);
            if (!n) {
              n = spriteNode('Bubble', 'Bubble.png');
              n.setScale(b.scale, b.scale, 1);
              this.bubbleLayer.addChild(n);
              this.nodes.set(b, n);
            }
            n.setPosition(b.x, b.y);
          }
          for (const b of w.blows) {
            alive.add(b);
            let n = this.nodes.get(b);
            if (!n) {
              n = spriteNode('LavaBlow', BLOW_FRAMES[0]);
              n.getComponent(UITransform).setAnchorPoint(0.5, 0);
              n.setScale(b.flip ? -b.scale : b.scale, b.scale, 1);
              this.blowLayer.addChild(n);
              this.nodes.set(b, n);
            }
            n.setPosition(b.x, b.y);
            const f = getFrame(BLOW_FRAMES[WaterArea.blowFrame(b)]);
            const sp = n.getComponent(Sprite);
            if (f && sp.spriteFrame !== f) sp.spriteFrame = f;
          }
          this.nodes.forEach((n, key) => {
            if (alive.has(key)) return;
            n.destroy();
            this.nodes.delete(key);
          });
        }

        /** WaterSplash.ccbi: root (tag 1, the splash's scale) > jump (tag 2) > squash (tag 3) > WaterBlow.png (tag 4). */
        makeSplash(s) {
          const root = pointsNode('WaterSplash');
          root.setScale(s.scaleX, s.scale, 1);
          const jump = pointsNode('jump');
          const squash = pointsNode('squash');
          const sprite = spriteNode('WaterBlow', 'WaterBlow.png', 'menusheet_hd');
          root.addChild(jump);
          jump.addChild(squash);
          squash.addChild(sprite);
          this.splashLayer.addChild(root);
          this.nodes.set(s, root);
          return root;
        }
      }
      exports('WaterView', WaterView);
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WorldMapView.ts", ['cc', './Config.ts', './Assets.ts', './Progress.ts', './CcbView.ts', './LevelButtonView.ts'], function (exports) {
  var cclegacy, UITransform, Node, instantiate, SpriteFrame, Sprite, _decorator, WORLDS, loadTexture, getRecord, isUnlocked, CcbView, LevelButtonView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
      Node = module.Node;
      instantiate = module.instantiate;
      SpriteFrame = module.SpriteFrame;
      Sprite = module.Sprite;
      _decorator = module._decorator;
    }, function (module) {
      WORLDS = module.WORLDS;
    }, function (module) {
      loadTexture = module.loadTexture;
    }, function (module) {
      getRecord = module.getRecord;
      isUnlocked = module.isUnlocked;
    }, function (module) {
      CcbView = module.CcbView;
    }, function (module) {
      LevelButtonView = module.LevelButtonView;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "cedc0MB2lZDBrdLumQz33Dw", "WorldMapView", undefined);
      const {
        ccclass
      } = _decorator;

      /** The map's backgrounds (WorldDefinition.json "visuals"): 1136 x 768 each, side by side. */
      const PANELS = 12;
      const PANEL_W = 1136;
      const PANEL_H = 768;
      /** Worlds laid out on the map, in level order (the special packs have their own screen). */
      const MAP_WORLDS = 4;
      const DRAG_SLOP = 12;

      /**
       * LevelSelection.ccbi with the scrolling world map the original builds in code: the LevelSelectBK
       * backgrounds, and one LevelButton per level at the anchor nodes of WorldPanel1-11.ccbi, numbered in
       * panel order (105 anchors = the 105 levels of the four main worlds). Back returns to the main menu,
       * Special Packs opens the special packs.
       */
      let WorldMapView = exports('WorldMapView', (_dec = ccclass('WorldMapView'), _dec(_class = class WorldMapView extends CcbView {
        constructor(...args) {
          super(...args);
          this.map = void 0;
          this.content = void 0;
          this.dots = [];
          this.velocity = 0;
          this.lastMove = 0;
          this.dragging = false;
          this.dragged = 0;
        }
        async init(panels, levelButton, focus, cb) {
          this.onSelectors({
            btnExit: cb.back,
            btnUniverse: cb.specials
          });
          this.buildMap(panels, levelButton, cb.level);
          let total = 0;
          for (const w of WORLDS) for (let n = 1; n <= w.levels; n++) {
            var _getRecord;
            total += ((_getRecord = getRecord(w.prefix + n)) == null ? void 0 : _getRecord.stars) || 0;
          }
          const stars = this.label('_totalStarsLabel');
          if (stars) stars.string = String(total);
          this.scrollTo(focus ?? this.nextLevel());
          await Promise.all(Array.from({
            length: PANELS
          }, (_, i) => this.loadBackground(i)));
        }
        buildMap(panels, levelButton, onLevel) {
          const tf = this.node.getComponent(UITransform);
          this.map = new Node('Map');
          this.map.layer = this.node.layer;
          const mtf = this.map.addComponent(UITransform);
          mtf.setAnchorPoint(0, 0);
          this.node.insertChild(this.map, 0);
          const fit = () => {
            mtf.setContentSize(tf.width, tf.height);
            this.map.setPosition(-tf.anchorX * tf.width, -tf.anchorY * tf.height);
            // the panels are taller than the screen: shrink them to its height so the top dots stay visible
            const s = tf.height / PANEL_H;
            this.content.setScale(s, s);
            this.clamp();
          };
          this.node.on(Node.EventType.SIZE_CHANGED, fit);
          this.content = new Node('Content');
          this.content.layer = this.node.layer;
          this.content.addComponent(UITransform).setAnchorPoint(0, 0);
          this.content.getComponent(UITransform).setContentSize(PANELS * PANEL_W, PANEL_H);
          this.map.addChild(this.content);
          const next = this.nextLevel();
          let k = 0;
          for (let i = 0; i < PANELS; i++) {
            const panel = new Node('panel' + (i + 1));
            panel.layer = this.node.layer;
            const ptf = panel.addComponent(UITransform);
            ptf.setAnchorPoint(0, 0);
            ptf.setContentSize(PANEL_W, PANEL_H);
            panel.setPosition(i * PANEL_W, 0);
            this.content.addChild(panel);
            const bg = new Node('background');
            bg.layer = panel.layer;
            bg.addComponent(UITransform).setAnchorPoint(0, 0);
            panel.addChild(bg);
            if (!panels[i]) continue;
            const overlay = instantiate(panels[i]);
            panel.addChild(overlay);
            for (const anchor of overlay.children) {
              var _getRecord2;
              const lv = this.levelAt(k++);
              if (!lv) continue;
              const dot = instantiate(levelButton);
              anchor.addChild(dot);
              this.dots.push(dot);
              const unlocked = isUnlocked(lv.prefix, lv.n);
              dot.addComponent(LevelButtonView).show(lv.n, lv.world, unlocked, ((_getRecord2 = getRecord(lv.id)) == null ? void 0 : _getRecord2.stars) || 0, lv.id === next,
              // a drag that ends on a dot is not a tap
              () => this.dragged < DRAG_SLOP ? onLevel(lv.id) : false);
              dot.name = lv.id;
            }
          }
          // capture phase: the dots' buttons stop the touch from bubbling, but dragging over them still scrolls
          this.map.on(Node.EventType.TOUCH_START, this.touchStart, this, true);
          this.map.on(Node.EventType.TOUCH_MOVE, this.touchMove, this, true);
          this.map.on(Node.EventType.TOUCH_END, this.touchEnd, this, true);
          this.map.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this, true);
          fit();
        }
        async loadBackground(i) {
          var _this$content;
          const tex = await loadTexture(`LevelSelectBK${i + 1}.png`);
          if (!tex || !((_this$content = this.content) != null && _this$content.isValid)) return;
          const sf = new SpriteFrame();
          sf.texture = tex;
          const sp = this.content.children[i].getChildByName('background').addComponent(Sprite);
          sp.sizeMode = Sprite.SizeMode.RAW;
          sp.trim = false;
          sp.spriteFrame = sf;
        }

        /** k-th dot of the map (0-based): its level, or null past the last world. */
        levelAt(k) {
          for (let w = 0; w < MAP_WORLDS; w++) {
            const wd = WORLDS[w];
            if (k < wd.levels) return {
              id: wd.prefix + (k + 1),
              prefix: wd.prefix,
              n: k + 1,
              world: w
            };
            k -= wd.levels;
          }
          return null;
        }

        /** First level of the map not completed yet. */
        nextLevel() {
          for (let w = 0; w < MAP_WORLDS; w++) {
            const wd = WORLDS[w];
            for (let n = 1; n <= wd.levels; n++) if (!getRecord(wd.prefix + n)) return wd.prefix + n;
          }
          return WORLDS[MAP_WORLDS - 1].prefix + WORLDS[MAP_WORLDS - 1].levels;
        }

        /** Scrolls so the level's dot is in the middle of the screen. */
        scrollTo(id) {
          const dot = this.dots.find(d => d.name === id);
          if (!dot) return;
          const x = this.content.getComponent(UITransform).convertToNodeSpaceAR(dot.worldPosition).x;
          this.content.setPosition(this.map.getComponent(UITransform).width / 2 - x * this.content.scale.x, 0);
          this.clamp();
        }
        clamp() {
          if (!this.content) return;
          const w = this.map.getComponent(UITransform).width;
          const min = Math.min(0, w - PANELS * PANEL_W * this.content.scale.x);
          const x = Math.max(min, Math.min(0, this.content.position.x));
          if (x !== this.content.position.x) {
            this.content.setPosition(x, 0);
            this.velocity = 0;
          }
        }
        touchStart() {
          this.dragging = true;
          this.dragged = 0;
          this.velocity = 0;
          this.lastMove = performance.now();
        }
        touchMove(e) {
          const dx = e.getUIDelta().x;
          this.dragged += Math.abs(dx);
          this.content.setPosition(this.content.position.x + dx, 0);
          const now = performance.now();
          this.velocity = dx / Math.max(1 / 120, (now - this.lastMove) / 1000); // pixels per second
          this.lastMove = now;
          this.clamp();
        }
        touchEnd() {
          this.dragging = false;
        }
        update(dt) {
          if (this.dragging || !this.content || Math.abs(this.velocity) < 5) return;
          this.content.setPosition(this.content.position.x + this.velocity * dt, 0);
          this.velocity *= Math.pow(0.05, dt);
          this.clamp();
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WorldView.ts", ['cc', './CcbAnimator.ts', './Config.ts', './Assets.ts', './PhysicsBuilder.ts', './TerrainMesh.ts', './WaterView.ts'], function (exports) {
  var cclegacy, Node, Layers, UITransform, Color, Vec3, Sprite, instantiate, UIOpacity, CcbAnimator, PX_PER_UNIT, SHEET_RESOLUTION, preloadFrames, loadTexture, getFrame, outlineOf, buildFill, buildEdge, WaterView;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Node = module.Node;
      Layers = module.Layers;
      UITransform = module.UITransform;
      Color = module.Color;
      Vec3 = module.Vec3;
      Sprite = module.Sprite;
      instantiate = module.instantiate;
      UIOpacity = module.UIOpacity;
    }, function (module) {
      CcbAnimator = module.CcbAnimator;
    }, function (module) {
      PX_PER_UNIT = module.PX_PER_UNIT;
      SHEET_RESOLUTION = module.SHEET_RESOLUTION;
    }, function (module) {
      preloadFrames = module.preloadFrames;
      loadTexture = module.loadTexture;
      getFrame = module.getFrame;
    }, function (module) {
      outlineOf = module.outlineOf;
    }, function (module) {
      buildFill = module.buildFill;
      buildEdge = module.buildEdge;
    }, function (module) {
      WaterView = module.WaterView;
    }],
    execute: function () {
      cclegacy._RF.push({}, "149afZqjYJNFKjEntVoeLaZ", "WorldView", undefined);
      const RAD2DEG = 180 / Math.PI;
      /** Foreground ("foregroundSprite") decorations: always above the world, scrolling faster. */
      const FOREGROUND_Z = 1000;
      const FOREGROUND_PARALLAX = 1.6;
      /**
       * Where each bike's "frontDamperSprite" image meets the front axle (its lower end / hub), as an anchor.
       * The prefabs place the sprite on the axle; centred there, the leg would hang half below the wheel.
       */
      const DAMPER_ANCHORS = {
        'frontDamp.png': [0.676, 0.128],
        'frontdamp2.png': [0.75, 0.127],
        'frontDamp3.png': [0.773, 0.114],
        'frontDamp5.png': [0.727, 0.12],
        'frontDamp6.png': [0.781, 0.127],
        'frontDamp7.png': [0.471, 0.131],
        'frontDamp8.png': [0.694, 0.132],
        'frontDamp9.png': [0.813, 0.128],
        'frontDamp11.png': [0.57, 0.19],
        'frontDamp20.png': [0.794, 0.148]
      };
      /**
       * Owns the visual nodes of the level. Every visual has a z (editor "z") and is kept
       * sorted inside `root`; nodes attached to a body follow it every frame.
       */
      class WorldView {
        constructor(parent) {
          this.root = void 0;
          this.followers = [];
          this.foreground = [];
          this.ropes = [];
          this.waters = [];
          this.zOf = new Map();
          /**
           * Sprites and terrain, culled when off screen: each is a circle of radius r (level units) around
           * its node position, so moving visuals need nothing more. Without this all of a level's ~100 draw
           * calls render every frame and leave a phone at 60 Hz too little room to keep up.
           */
          this.cullables = [];
          /** Visuals switched off by the culling (and only those are switched back on). */
          this.culled = new Set();
          /** visuals created per entity index, so groups can be hidden (nitro, checkpoints...). */
          this.nodesOf = new Map();
          this.root = new Node('World');
          this.root.layer = Layers.Enum.UI_2D;
          this.root.addComponent(UITransform);
          parent.addChild(this.root);
        }
        destroy() {
          this.root.destroy();
        }
        insert(node, z, owner) {
          node.layer = Layers.Enum.UI_2D;
          this.zOf.set(node, z);
          const children = this.root.children;
          let at = children.length;
          // stable: after every child with z <= new z
          for (let i = children.length - 1; i >= 0; i--) {
            if ((this.zOf.get(children[i]) ?? 0) <= z) {
              at = i + 1;
              break;
            }
            at = i;
          }
          this.root.insertChild(node, at);
          if (!this.nodesOf.has(owner)) this.nodesOf.set(owner, []);
          this.nodesOf.get(owner).push(node);
        }

        /** A node drawn among the level visuals at `z` that outlives the bike (particles, nitro flames). */
        addEffect(node, z) {
          this.insert(node, z, -1);
        }
        removeOwners(from, to) {
          for (let i = from; i < to; i++) {
            for (const n of this.nodesOf.get(i) || []) {
              this.zOf.delete(n);
              n.destroy();
            }
            this.nodesOf.delete(i);
          }
          this.followers = this.followers.filter(f => f.node.isValid);
          this.cullables = this.cullables.filter(c => c.node.isValid);
          this.culled.forEach(n => !n.isValid && this.culled.delete(n));
        }

        /** Shows or hides a level visual for the game (pickups taken, barrels blown up, drone beams...). */
        show(node, on) {
          this.culled.delete(node);
          node.active = on;
        }

        /** Switches off the visuals outside the view centred on (cx, cy), half size hw x hh (level units). */
        cull(cx, cy, hw, hh) {
          // visuals destroyed by others since (their level layer torn down, an effect removed)
          if (this.cullables.some(c => !c.node.isValid)) this.cullables = this.cullables.filter(c => c.node.isValid);
          for (const c of this.cullables) {
            const p = c.node.position;
            const inView = Math.abs(p.x - cx) <= hw + c.r && Math.abs(p.y - cy) <= hh + c.r;
            if (inView) {
              if (this.culled.delete(c.node)) c.node.active = true;
            } else if (c.node.active) {
              c.node.active = false;
              this.culled.add(c.node);
            }
          }
        }
        follow(node, body, wx, wy, waDeg, angleBody) {
          const bp = body.getPosition();
          const a = (angleBody || body).getAngle();
          const c = Math.cos(-a),
            s = Math.sin(-a);
          const dx = wx - bp.x,
            dy = wy - bp.y;
          this.followers.push({
            node,
            body,
            lx: dx * c - dy * s,
            ly: dx * s + dy * c,
            la: waDeg - a * RAD2DEG,
            angleBody
          });
        }

        /** Build visuals for entities [from, to). `bodies` maps entity index -> body. */
        async build(entities, bodies, from = 0, to = entities.length, sheetHint) {
          const sprites = [];
          const terrains = [];
          const mountedOn = new Map(); // sprite idx -> physics entity idx
          for (let i = from; i < to; i++) {
            const e = entities[i];
            if (e.Type === 'EditorSprite') sprites.push(i);else if (e.Type === 'EditorPhysicsObject') {
              const p = e.Properties;
              for (const s of p.mountedSprites || []) mountedOn.set(s, i);
              if (p.refsprite1 != null && p.refsprite1 >= 0) mountedOn.set(p.refsprite1, i);
              if (p.textureFill || p.textureEdge) terrains.push(i);
            }
          }
          await preloadFrames(sprites.map(i => {
            const p = entities[i].Properties;
            return {
              frame: p.frame,
              sheet: p.sheet || sheetHint,
              textureFile: p.textureFile
            };
          }));
          for (const i of terrains) await this.buildTerrain(i, entities[i], bodies.get(i));
          // bike prefabs leave the fork's lower leg ("frontDamperSprite") unmounted: it slides with the
          // front wheel along the suspension line joint and keeps the frame's angle
          const part = (subtag, name) => {
            for (let i = from; i < to; i++) {
              const p = entities[i].Properties;
              if (entities[i].Type === 'EditorPhysicsObject' && (p.subtag === subtag || p.name === name)) return bodies.get(i);
            }
            return undefined;
          };
          for (const i of sprites) {
            const owner = mountedOn.get(i);
            if (owner == null && entities[i].Properties.name === 'frontDamperSprite') {
              const wheel = part(4, 'frontWheel'),
                frame = part(2, 'MotoCenter');
              if (wheel && frame) {
                this.buildSprite(i, entities[i], wheel, sheetHint, frame);
                continue;
              }
            }
            this.buildSprite(i, entities[i], owner != null ? bodies.get(owner) : null, sheetHint);
          }
        }
        async buildTerrain(i, e, body) {
          var _p$position, _p$position2;
          const p = e.Properties;
          const outline = outlineOf(e);
          if (outline.length < 3) return;
          const pos = body ? body.getPosition() : {
            x: ((_p$position = p.position) == null ? void 0 : _p$position[0]) || 0,
            y: ((_p$position2 = p.position) == null ? void 0 : _p$position2[1]) || 0
          };
          const local = outline.map(v => ({
            x: v.x - pos.x,
            y: v.y - pos.y
          }));
          const holder = new Node(p.name || 'terrain');
          holder.addComponent(UITransform);
          holder.setPosition(pos.x, pos.y);
          if (p.textureFill) {
            const tex = await loadTexture(p.textureFill);
            if (tex) {
              const n = buildFill(local, tex, p.textureFill, p.fillTile || 1, p.textureRot || 0);
              if (n) holder.addChild(n);
            }
          }
          if (p.textureEdge) {
            const tex = await loadTexture(p.textureEdge);
            if (tex) {
              const n = buildEdge(local, tex, p.textureEdge, p.edgeSize || 1, p.edgeOffset || 0);
              if (n) holder.addChild(n);
            }
          }
          for (const c of holder.children) c.layer = Layers.Enum.UI_2D;
          this.insert(holder, p.z || 0, i);
          this.cullables.push({
            node: holder,
            r: Math.max(...local.map(v => Math.hypot(v.x, v.y)))
          });
          if (body && body.isDynamic()) this.follow(holder, body, pos.x, pos.y, 0);
        }
        buildSprite(i, e, body, sheetHint, angleBody) {
          var _p$position3, _p$position4;
          const p = e.Properties;
          const frame = p.textureFile && !p.spriteSheet ? getFrame(p.textureFile) || getFrame(p.frame, p.sheet || sheetHint) : getFrame(p.frame, p.sheet || sheetHint);
          if (!frame) {
            if (p.frame || p.textureFile) console.warn('[BR] missing frame', p.frame || p.textureFile, p.sheet);
            return;
          }
          const node = new Node(p.name || 'sprite');
          const col = p.color || [1, 1, 1];
          const color = new Color(col[0] * 255, col[1] * 255, col[2] * 255, (p.opacity ?? 1) * 255);
          const damper = angleBody ? DAMPER_ANCHORS[p.frame] : undefined;
          const ax = damper ? damper[0] : p.anchorX ?? 0.5,
            ay = damper ? damper[1] : p.anchorY ?? 0.5;
          const tile = n => {
            const sp = n.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.RAW;
            sp.trim = false;
            sp.spriteFrame = frame;
            sp.color = color;
            n.getComponent(UITransform).setAnchorPoint(ax, ay);
          };
          // repeatCount: that many copies side by side along the sprite's x, the row centred on its position
          const repeat = Math.max(1, Math.round(p.repeatCount || 1));
          if (repeat === 1) tile(node);else {
            node.addComponent(UITransform);
            const w = frame.originalSize.width;
            for (let k = 0; k < repeat; k++) {
              const c = new Node('tile');
              c.layer = Layers.Enum.UI_2D;
              tile(c);
              c.setPosition((k - (repeat - 1) / 2) * w, 0);
              node.addChild(c);
            }
          }
          // aspectRatio stretches the width only (sprites on box bodies match their boxes that way)
          const s = (p.scale ?? 1) / PX_PER_UNIT / (SHEET_RESOLUTION[p.sheet || sheetHint] ?? 1),
            sx = s * (p.aspectRatio ?? 1);
          node.setScale(new Vec3(p.flipImageX ? -sx : sx, p.flipImageY ? -s : s, 1));
          const x = ((_p$position3 = p.position) == null ? void 0 : _p$position3[0]) || 0,
            y = ((_p$position4 = p.position) == null ? void 0 : _p$position4[1]) || 0;
          const angle = p.rotation || 0; // editor degrees are counter-clockwise, like node.angle
          node.setPosition(x, y);
          node.angle = angle;
          if (p.foregroundSprite && !body) {
            // blurred foreground decoration: drawn on top and scrolling faster than the world
            this.insert(node, FOREGROUND_Z + (p.z || 0), i);
            this.foreground.push({
              node,
              x,
              y
            });
            return;
          }
          this.insert(node, p.z || 0, i);
          // farthest corner from the anchor (the whole row when repeated), scaled
          const fw = frame.originalSize.width * repeat,
            fh = frame.originalSize.height;
          const rx = Math.max(ax, 1 - ax) * fw * Math.abs(sx),
            ry = Math.max(ay, 1 - ay) * fh * s;
          this.cullables.push({
            node,
            r: Math.hypot(rx, ry)
          });
          if (body && body.isDynamic()) this.follow(node, body, x, y, angle, angleBody);
        }

        /** Sync followers with their bodies (`pose` gives the interpolated body transform). */
        sync(pose) {
          const pxPerPoint = this.root.scale.x / PX_PER_UNIT;
          for (const wv of this.waters) wv.sync(pxPerPoint);
          for (const r of this.ropes) {
            const a = this.interpAnchor(r.joint.getBodyA(), r.joint.getAnchorA(), pose);
            const b = this.interpAnchor(r.joint.getBodyB(), r.joint.getAnchorB(), pose);
            const dx = b.x - a.x,
              dy = b.y - a.y;
            r.node.setPosition(a.x, a.y);
            r.node.angle = Math.atan2(dy, dx) * RAD2DEG - 90;
            r.tf.height = Math.hypot(dx, dy) * PX_PER_UNIT;
          }
          for (const f of this.followers) {
            if (!f.node.isValid) continue;
            const {
              x: px,
              y: py,
              a: ba
            } = pose(f.body);
            const pos = {
              x: px,
              y: py
            };
            const a = f.angleBody ? pose(f.angleBody).a : ba;
            const c = Math.cos(a),
              s = Math.sin(a);
            f.node.setPosition(pos.x + f.lx * c - f.ly * s, pos.y + f.lx * s + f.ly * c);
            f.node.angle = f.la + a * RAD2DEG;
          }
        }

        /** A joint anchor moved with its body's interpolated pose. */
        interpAnchor(body, world, pose) {
          const l = body.getLocalPoint(world);
          const p = pose(body);
          const c = Math.cos(p.a),
            s = Math.sin(p.a);
          return {
            x: p.x + l.x * c - l.y * s,
            y: p.y + l.x * s + l.y * c
          };
        }

        /** A WaterTrigger's Waves at its z, and its BackWaves (water and purple fluid) at -5. */
        async addWater(w) {
          await WaterView.preload();
          const v = new WaterView(w);
          this.insert(v.front, w.z, -1);
          if (v.back) this.insert(v.back, -5, -1);
          this.waters.push(v);
        }

        /** Visible ropes/chains: distance joints with a "ropeTexture", drawn as tiled strips. */
        async buildRopes(entities, joints) {
          const ropes = [];
          joints.forEach((j, i) => {
            var _entities$i;
            if ((_entities$i = entities[i]) != null && (_entities$i = _entities$i.Properties) != null && _entities$i.ropeTexture) ropes.push(i);
          });
          await preloadFrames(ropes.map(i => ({
            frame: '',
            textureFile: entities[i].Properties.ropeTexture
          })));
          for (const i of ropes) {
            const p = entities[i].Properties;
            const frame = getFrame(p.ropeTexture);
            if (!frame) continue;
            const node = new Node('rope');
            const sp = node.addComponent(Sprite);
            sp.spriteFrame = frame;
            sp.type = Sprite.Type.TILED;
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            const tf = node.getComponent(UITransform);
            tf.setAnchorPoint(0.5, 0);
            const texW = frame.originalSize.width;
            tf.width = Math.max(4, texW * Math.abs(p.width || 6) / 20);
            node.setScale(1 / PX_PER_UNIT, 1 / PX_PER_UNIT, 1);
            this.insert(node, p.z ?? 1, i);
            this.ropes.push({
              node,
              tf,
              joint: joints.get(i),
              idx: i
            });
          }
        }

        /** ExplosionEffect.ccbi converted to a prefab (set by the scene's root before levels load). */

        /**
         * One-shot explosion: the original's ExplosionEffect.ccbi ("runExplosion": flash, fireball, smoke, debris)
         * centred on (x, y), one HD pixel per pixel of the world, removed when it ends. Drawn at `z` among the
         * level visuals, or over all of them.
         */
        explosion(x, y, z) {
          if (!WorldView.explosionPrefab) return;
          // a zero-size holder: the effect's percent layout centres on it
          const holder = new Node('explosion');
          holder.layer = Layers.Enum.UI_2D;
          holder.addComponent(UITransform).setContentSize(0, 0);
          holder.setPosition(x, y);
          holder.setScale(1 / PX_PER_UNIT, 1 / PX_PER_UNIT, 1);
          if (z == null) this.root.addChild(holder);else this.insert(holder, z, -1);
          const fx = instantiate(WorldView.explosionPrefab);
          holder.addChild(fx);
          const anim = fx.getComponent(CcbAnimator);
          if (!(anim != null && anim.play('runExplosion', () => holder.destroy()))) holder.destroy();
        }

        /** Foreground sprites sit at p + (p - cam) * (FOREGROUND_PARALLAX - 1). */
        syncForeground(camX, camY) {
          const k = FOREGROUND_PARALLAX - 1;
          for (const f of this.foreground) if (f.node.isValid) f.node.setPosition(f.x + (f.x - camX) * k, f.y + (f.y - camY) * k);
        }

        /** Opacity (0..1) of every visual created for `owners`. */
        setOpacity(owners, alpha) {
          for (const o of owners) {
            for (const n of this.nodesOf.get(o) || []) {
              const op = n.getComponent(UIOpacity);
              // fully opaque needs no component: level resets show every object without adding one to each
              if (op) op.opacity = alpha * 255;else if (alpha < 1) n.addComponent(UIOpacity).opacity = alpha * 255;
            }
          }
        }

        /** Level reset: ropes follow the re-created joints. */
        rebindRopes(joints) {
          for (const r of this.ropes) {
            r.joint = joints.get(r.idx) || r.joint;
            r.node.active = true;
          }
        }

        /** Re-attach every follower of `oldBody` to nothing (used when a body is destroyed). */
        detachBody(body) {
          this.followers = this.followers.filter(f => f.body !== body && f.angleBody !== body);
        }
      }
      exports('WorldView', WorldView);
      WorldView.explosionPrefab = null;
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});