/* ===========================================================================
   THE GLASS BOX — engine
   Classic script (global THREE r147) so the folder runs from file:// offline.
   Content lives in content.js; nothing in here needs editing to change copy.
   =========================================================================== */
(() => {
  const CONTENT = window.GLASSBOX_CONTENT;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // ---- world constants ----------------------------------------------------
  const H = 10;                 // half the box edge
  const PX = 0.0105;            // CSS px → world units for wall panels (1600px ≈ 16.8u)
  const PANEL_HALF = { x: 8.4, y: 5.25 };
  // Where the rocket parks on a wall (wall-plane coords): just right of the
  // right-most card, level with the card row, so it never covers the copy.
  const ROCKET_REST = { x: PANEL_HALF.x + 0.55, y: -3.0 };
  const DIST = { def: 12.5, min: 3.5, max: 18 };       // camera distance from a wall (def is re-fitted to the screen)
  const fitDist = () => {
    const t = Math.tan(THREE.MathUtils.degToRad(25));
    return clamp(Math.max((ROCKET_REST.x + 1.15) / (t * innerWidth / innerHeight), (PANEL_HALF.y + 0.9) / t), 8, DIST.max);
  };
  const ORBIT = { def: 48, min: 24, max: 80, rocket: 15 };
  const COL = {
    ink: 0x2d2230, purple500: 0x8f4bd2, purple300: 0xc7a5e9, pink500: 0xef84ef,
    pink400: 0xf3a3f3, pink300: 0xf7c2f7, analog: 0xf2e9ee, violet: 0x401f60, plum: 0x4f1f4f,
  };

  // The Make mark, measured from the official SVG in make.com's header (21×28 viewBox).
  // Every bar is the same rounded rectangle; only the lean differs: the first bar
  // has fallen furthest, the middle one half as far, the last stands upright.
  // bars: [centre x, centre y (y up), lean in degrees, top tipping right], relative to the mark's centre.
  const MAKE_MARK = {
    w: 4.3, h: 12.9, r: 0.43,
    bars: [[-6.15, 0.32, 26], [0.02, 0.16, 13.5], [6.12, 0, 0]],
  };

  // Inner walls. n = inward normal (wall → centre), u = screen-up when facing it.
  const FACES = [
    { n: V3(0, 0, 1),  u: V3(0, 1, 0) },   // 1 front
    { n: V3(-1, 0, 0), u: V3(0, 1, 0) },   // 2 right
    { n: V3(0, 0, -1), u: V3(0, 1, 0) },   // 3 back
    { n: V3(1, 0, 0),  u: V3(0, 1, 0) },   // 4 left
    { n: V3(0, -1, 0), u: V3(0, 0, -1) },  // 5 ceiling
    { n: V3(0, 1, 0),  u: V3(0, 0, -1) },  // 6 floor
  ].map((f) => ({ ...f, r: new THREE.Vector3().crossVectors(f.u, f.n), c: f.n.clone().multiplyScalar(-H) }));

  // ---- renderers -----------------------------------------------------------
  const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gl.setClearColor(0x000000, 0);
  gl.outputEncoding = THREE.sRGBEncoding;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  document.getElementById("gl").appendChild(gl.domElement);

  const css = new THREE.CSS3DRenderer();
  document.getElementById("css").appendChild(css.domElement);

  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, (innerWidth / innerHeight) || 16 / 9, 0.05, 600);

  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(COL.pink300, 0.35));
  const key = new THREE.DirectionalLight(COL.analog, 0.7);
  key.position.set(8, 14, 10);
  scene.add(key);

  // ---- helpers ---------------------------------------------------------------
  const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
  const damp = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.exp(-rate * dt));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const basisQuat = (r, u, n) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, n)).normalize();

  function radialTexture(stops) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const glowTex = radialTexture([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,0)"]]);

  // ---- the glass box -------------------------------------------------------
  const glassUniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uH: { value: H },
    uA: { value: new THREE.Color(COL.purple500) },
    uB: { value: new THREE.Color(COL.pink400) },
    uEdge: { value: new THREE.Color(COL.pink300) },
  };
  const glassMat = new THREE.ShaderMaterial({
    uniforms: glassUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    extensions: { derivatives: true },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uH; uniform vec2 uRes; uniform vec3 uA, uB, uEdge;
      varying vec3 vW; varying vec3 vN;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) N = -N;
        float fres = pow(1.0 - abs(dot(N, V)), 2.5);

        // horizontal-only tint (the Waves gradient rule)
        float gx = gl_FragCoord.x / uRes.x;
        vec3 tint = mix(uA, uB, smoothstep(0.1, 0.9, gx));

        // glowing rounded edges: second-largest |coord| near the edge of the box
        vec3 a = abs(vW) / uH;
        float mx = max(a.x, max(a.y, a.z));
        float mn = min(a.x, min(a.y, a.z));
        float mid = a.x + a.y + a.z - mx - mn;
        float edge = smoothstep(0.86, 0.985, mid);

        // faint grid etched in the glass
        vec3 g = abs(fract(vW * 0.5) - 0.5);
        vec3 fw = fwidth(vW * 0.5) * 1.5;
        vec3 l = 1.0 - smoothstep(vec3(0.0), fw, g);
        float grid = max(l.x, max(l.y, l.z)) * (1.0 - edge);

        // slow sheen sweeping across the glass
        float s = sin((vW.x + vW.y * 0.6 - vW.z * 0.4) * 0.18 - uTime * 0.35);
        float sheen = smoothstep(0.93, 1.0, s) * 0.22;

        vec3 col = mix(tint, uEdge, clamp(edge + fres * 0.4, 0.0, 1.0)) + sheen;
        float alpha = 0.035 + fres * 0.35 + edge * 0.55 + grid * 0.07 + sheen * 0.6;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.9));
      }`,
  });
  const box = new THREE.Mesh(new THREE.RoundedBoxGeometry(2 * H, 2 * H, 2 * H, 8, 1.6), glassMat);
  box.renderOrder = 2;
  scene.add(box);

  // ---- the Make mark inside the box (visible from outside) -----------------
  const logo = new THREE.Group();
  const barMat = new THREE.MeshStandardMaterial({
    color: COL.purple500, emissive: COL.pink500, emissiveIntensity: 0.6,
    roughness: 0.4, metalness: 0, transparent: true, envMapIntensity: 0.15,
  });
  const LOGO_S = 7.2 / MAKE_MARK.h;   // world units per SVG unit
  const barGeo = new THREE.RoundedBoxGeometry(MAKE_MARK.w * LOGO_S, MAKE_MARK.h * LOGO_S, 1.2, 4, MAKE_MARK.r * LOGO_S);
  MAKE_MARK.bars.forEach(([x, y, deg]) => {
    const b = new THREE.Mesh(barGeo, barMat);
    b.position.set(x * LOGO_S, y * LOGO_S, 0);
    b.rotation.z = -THREE.MathUtils.degToRad(deg);
    logo.add(b);
  });
  const logoGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: COL.pink500, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  logoGlow.scale.set(26, 26, 1);
  logo.add(logoGlow);
  logo.rotation.set(0.12, -0.35, 0);
  scene.add(logo);

  // ---- floating dust inside the box ------------------------------------------
  const DUST = 420;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos.set([(Math.random() * 2 - 1) * (H - 0.5), (Math.random() * 2 - 1) * (H - 0.5), (Math.random() * 2 - 1) * (H - 0.5)], i * 3);
    dustSeed[i] = Math.random() * 100;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: glowTex, color: COL.pink300, size: 0.12, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dust);

  // ---- the glass rocket ------------------------------------------------------
  const rocket = new THREE.Group();
  const rocketBody = new THREE.Group();
  rocket.add(rocketBody);

  const glass = new THREE.MeshPhysicalMaterial({
    color: COL.pink300, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.32,
    clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.8, iridescenceIOR: 1.35,
    envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false,
  });
  const profile = [[0, -1.05], [0.36, -1.0], [0.5, -0.6], [0.56, 0], [0.52, 0.55], [0.4, 1.0], [0.2, 1.42], [0, 1.6]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), glass);
  hull.renderOrder = 4;
  rocketBody.add(hull);

  // glowing Make mark as the rocket's core
  const coreMat = new THREE.MeshBasicMaterial({ color: COL.pink300 });
  const CORE_S = 0.5 / MAKE_MARK.h;
  const coreGeo = new THREE.BoxGeometry(MAKE_MARK.w * CORE_S, MAKE_MARK.h * CORE_S, 0.13);
  MAKE_MARK.bars.forEach(([x, y, deg]) => {
    const b = new THREE.Mesh(coreGeo, coreMat);
    b.position.set(x * CORE_S, 0.25 + y * CORE_S, 0);
    b.rotation.z = -THREE.MathUtils.degToRad(deg);
    rocketBody.add(b);
  });
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: COL.pink500, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.position.y = 0.25;
  coreGlow.scale.set(1.6, 1.6, 1);
  rocketBody.add(coreGlow);

  // fins
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(0.55, -0.55); finShape.lineTo(0.55, -0.95); finShape.lineTo(0, -0.55); finShape.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  finGeo.translate(0.42, -0.15, -0.025);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(finGeo, glass);
    f.rotation.y = (i / 3) * Math.PI * 2;
    f.renderOrder = 4;
    rocketBody.add(f);
  }
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 0.22, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: COL.purple300, roughness: 0.2, metalness: 0.6, envMapIntensity: 1.5, side: THREE.DoubleSide })
  );
  nozzle.position.y = -1.1;
  rocketBody.add(nozzle);

  // flame
  const flameMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0.4 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime, uPower; varying vec2 vUv;
      void main(){
        float flick = 0.85 + 0.15 * sin(uTime * 40.0 + vUv.y * 20.0);
        float a = pow(vUv.y, 1.6) * flick * (0.55 + uPower * 0.6);
        vec3 col = mix(vec3(0.94,0.52,0.94), vec3(1.0,0.95,1.0), pow(vUv.y, 3.0));
        gl_FragColor = vec4(col, a);
      }`,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.2, 24, 1, true), flameMat);
  flame.rotation.x = Math.PI;
  flame.position.y = -1.75;
  rocketBody.add(flame);
  const flameGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: COL.pink500, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flameGlow.position.y = -1.35;
  flameGlow.scale.set(2.2, 2.2, 1);
  rocketBody.add(flameGlow);
  const rocketLight = new THREE.PointLight(COL.pink500, 1.4, 14, 2);
  rocketLight.position.y = -1.3;
  rocketBody.add(rocketLight);

  rocket.scale.setScalar(0.55);
  scene.add(rocket);

  // exhaust trail (world space)
  const TRAIL = 90;
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(TRAIL * 3);
  const trailLife = new Float32Array(TRAIL).fill(0);
  const trailVel = new Float32Array(TRAIL * 3);
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trailMat = new THREE.PointsMaterial({
    map: glowTex, color: COL.pink400, size: 0.32, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(trailGeo, trailMat));
  let trailHead = 0;

  // ---- wall panels (CSS3D) -----------------------------------------------------
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // A card with an href becomes one big link: an invisible anchor stretched over it.
  const cardLink = (it) => it.href
    ? `<a class="card__link" href="${esc(it.href)}" target="_blank" rel="noopener" aria-label="${esc(it.title)}"></a>`
    : "";
  const arrow = (it) => (it.href ? ` <span class="card__arrow" aria-hidden="true">↗</span>` : "");
  // Optional hover tooltip: one line shown above the card while it lifts.
  const tip = (it) => (it.tooltip ? `<span class="card__tip" role="tooltip">${esc(it.tooltip)}</span>` : "");
  const cardClass = (it, base) => [base, it.href && "is-link", it.tooltip && "has-tip"].filter(Boolean).join(" ");

  function panelHTML(t, i) {
    const img = t.image && t.image.src
      ? `<figure class="media"><img src="${esc(t.image.src)}" alt="${esc(t.image.alt)}" width="1600" height="1000"></figure>`
      : t.image
        ? `<figure class="media media--empty"><div>Image slot · 16:10<br><small>${esc(t.image.alt)}</small><br><small>set image.src in content.js</small></div></figure>`
        : "";
    const links = (t.links || []).map((l) =>
      `<a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join("");
    const cards = (t.items || []).map((it) =>
      `<li class="${cardClass(it, "card")}">${it.tag ? `<span class="chip">${esc(it.tag)}</span>` : ""}<h3>${esc(it.title)}${arrow(it)}</h3><p>${esc(it.body)}</p>${cardLink(it)}${tip(it)}</li>`).join("");
    return `
      <div class="panel__head">
        <div class="panel__text">
          <p class="micro">${esc(t.eyebrow)}</p>
          <h2 class="display">${esc(t.title)}</h2>
          <p class="lead">${esc(t.lead)}</p>
          <div class="links">${links}</div>
        </div>
        ${img}
      </div>
      <ul class="cards" style="--cols:${Math.min(Math.max((t.items || []).length, 1), 4)}">${cards}</ul>`;
  }

  const panels = FACES.map((f, i) => {
    const el = document.createElement("article");
    el.className = "panel";
    el.innerHTML = panelHTML(CONTENT.topics[i], i);
    const o = new THREE.CSS3DObject(el);
    o.position.copy(f.c).addScaledVector(f.n, 0.06);
    o.quaternion.copy(basisQuat(f.r, f.u, f.n));
    o.scale.setScalar(PX);
    cssScene.add(o);
    return o;
  });

  // labels on the outside of each face (topic 7)
  const labels = FACES.map((f, i) => {
    const el = document.createElement("div");
    el.className = "facelabel";
    el.innerHTML = `<b>0${i + 1}</b><span>${esc(CONTENT.topics[i].short)}</span>`;
    const o = new THREE.CSS3DObject(el);
    const out = f.n.clone().negate();
    const r = new THREE.Vector3().crossVectors(f.u, out);
    o.position.copy(f.c).addScaledVector(out, 0.3);
    o.quaternion.copy(basisQuat(r, f.u, out));
    o.scale.setScalar(0.013);
    cssScene.add(o);
    return o;
  });

  // ---- 2D overlays + HUD ---------------------------------------------------------
  const introEl = document.getElementById("intro");
  const outroEl = document.getElementById("outro");
  const I = CONTENT.intro;
  const presenterEl = document.getElementById("presenter");
  const brandEl = document.getElementById("brand");
  if (I.presenter) {
    const P = I.presenter;
    presenterEl.innerHTML = `
      ${P.photo ? `<img src="${esc(P.photo)}" alt="${esc(P.name)}" width="56" height="56">` : ""}
      <div><p class="presenter__name">${esc(P.name)}</p>
      <p class="presenter__role meta">${esc(P.role)} <span aria-hidden="true">●</span> ${esc(P.title)}</p></div>`;
  }
  introEl.innerHTML = `
    <p class="micro">${esc(I.eyebrow)}</p>
    <h1 class="display-1">${esc(I.title)}</h1>
    <p class="statement">${esc(I.lead)}</p>
    ${I.hint ? `<p class="hint meta"><kbd>1</kbd> ${esc(I.hint)}</p>` : ""}`;
  const T7 = CONTENT.topics[6];
  outroEl.innerHTML = `
    <p class="micro">${esc(T7.eyebrow)}</p>
    <h2 class="display-2">${esc(T7.title)}</h2>
    <p class="lead">${esc(T7.lead)}</p>
    <ul class="list">${T7.items.map((it) =>
      `<li class="${cardClass(it, "")}">${it.tag ? `<span class="chip">${esc(it.tag)}</span>` : ""}<div class="title">${esc(it.title)}${arrow(it)}</div><div class="meta">${esc(it.body)}</div>${cardLink(it)}${tip(it)}</li>`).join("")}</ul>
    ${(T7.links || []).map((l) => `<a class="btn" style="--u:1;margin-top:1.5rem" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}`;

  const hud = document.getElementById("hud");
  const hudButtons = CONTENT.topics.map((t, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<b>${i + 1}</b><span>${esc(t.short)}</span>`;
    b.addEventListener("click", () => go(i + 1));
    hud.appendChild(b);
    return b;
  });

  // film grain tile, deliberately strong and dialled down by CSS opacity
  (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    document.getElementById("grain").style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  // ---- state ---------------------------------------------------------------------
  // stage: 0 = intro (outside), 1–6 = inner walls, 7 = outside overview
  const st = {
    stage: 0,
    ox: ROCKET_REST.x, oy: ROCKET_REST.y, vx: 0, vy: 0, camOx: 0, camOy: 0, camTx: 0, camTy: 0,
    dist: DIST.def, distT: DIST.def,
    az: 0.55, el: 0.22, vaz: 0, vel: 0, R: ORBIT.def, RT: ORBIT.def,
    idle: 0,
  };
  let trans = null;
  const cur = { cam: V3(0, 0, 0), camQ: new THREE.Quaternion(), rp: V3(0, 0, 0), rq: new THREE.Quaternion() };

  function go(stage) {
    stage = clamp(stage, 0, 7);
    if (stage === st.stage && !trans) {
      // pressing the same key again recentres
      parkRocket(); st.camTx = st.camTy = 0; st.distT = DIST.def; st.RT = ORBIT.def;
      return;
    }
    const wasOutside = st.stage === 0 || st.stage === 7;
    const toOutside = stage === 0 || stage === 7;
    let dur = 1.6;
    if (wasOutside !== toOutside) dur = 2.6;
    if (toOutside && wasOutside) dur = 1.8;
    trans = {
      from: { cam: cur.cam.clone(), camQ: cur.camQ.clone(), rp: cur.rp.clone(), rq: cur.rq.clone() },
      t: 0, dur,
    };
    st.stage = stage;
    parkRocket(); st.camOx = st.camOy = st.camTx = st.camTy = 0;
    st.dist = st.distT = DIST.def;
    st.R = st.RT = ORBIT.def;
    history.replaceState(null, "", "#" + stage);
    updateUI();
  }

  function parkRocket() {
    st.ox = ROCKET_REST.x; st.oy = ROCKET_REST.y; st.vx = st.vy = 0;
  }

  function updateUI() {
    introEl.classList.toggle("is-on", st.stage === 0);
    presenterEl.classList.toggle("is-on", st.stage === 0);
    brandEl.classList.toggle("is-on", st.stage === 0);
    outroEl.classList.toggle("is-on", st.stage === 7);
    hudButtons.forEach((b, i) => b.classList.toggle("is-on", st.stage === i + 1));
  }

  // ---- input -----------------------------------------------------------------------
  const keys = new Set();
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-7]$/.test(k)) { go(+k); e.preventDefault(); return; }
    if (k === "Enter" && st.stage === 0) { go(1); return; }
    if (k === "Escape") { go(0); return; }
    if (k === "PageDown") { go(st.stage === 7 ? 7 : st.stage + 1); e.preventDefault(); return; }
    if (k === "PageUp") { go(st.stage - 1); e.preventDefault(); return; }
    if (k === "+" || k === "=") { zoom(-1); e.preventDefault(); return; }
    if (k === "-" || k === "_") { zoom(1); e.preventDefault(); return; }
    if (k === "h" || k === "H") { document.body.classList.toggle("hud-off"); return; }
    if (k === "f" || k === "F") {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      return;
    }
    if (k.startsWith("Arrow")) { keys.add(k); e.preventDefault(); }
  });
  addEventListener("keyup", (e) => keys.delete(e.key));
  addEventListener("blur", () => keys.clear());
  addEventListener("wheel", (e) => { zoom(Math.sign(e.deltaY) * 0.5); }, { passive: true });

  function zoom(dir) {
    if (st.stage === 0 || st.stage === 7) st.RT = clamp(st.RT + dir * 5, ORBIT.min, ORBIT.max);
    else st.distT = clamp(st.distT + dir * 1.5, DIST.min, DIST.max);
  }

  // ---- poses -------------------------------------------------------------------------
  const tmp = { a: V3(0, 0, 0), b: V3(0, 0, 0) };
  const qRoll = new THREE.Quaternion();
  const qPitch = new THREE.Quaternion();
  const AX = { x: V3(1, 0, 0), y: V3(0, 1, 0), z: V3(0, 0, 1) };

  function targetPose(time) {
    const p = {};
    if (st.stage >= 1 && st.stage <= 6) {
      const f = FACES[st.stage - 1];
      const d = st.dist;
      p.cam = f.c.clone().addScaledVector(f.n, d).addScaledVector(f.r, st.camOx).addScaledVector(f.u, st.camOy);
      p.camQ = basisQuat(f.r, f.u, f.n);
      // halfway between the camera and the rocket's spot on the wall, so it
      // appears exactly over (ox, oy) on the wall whatever the camera is doing
      const onWall = f.c.clone().addScaledVector(f.r, st.ox).addScaledVector(f.u, st.oy);
      p.rp = p.cam.clone().lerp(onWall, 0.5);
      p.rq = basisQuat(f.r, f.u, f.n);
    } else {
      const dir = V3(Math.cos(st.el) * Math.sin(st.az), Math.sin(st.el), Math.cos(st.el) * Math.cos(st.az));
      const r = new THREE.Vector3().crossVectors(AX.y, dir).normalize();
      const u = new THREE.Vector3().crossVectors(dir, r);
      // shift the camera left so the box sits right of the overlay card
      p.cam = dir.clone().multiplyScalar(st.R).addScaledVector(r, -st.R * 0.3);
      p.camQ = basisQuat(r, u, dir);
      const ra = st.az + 0.2 + Math.sin(time * 0.4) * 0.05;
      const re = st.el - 0.05;
      const rdir = V3(Math.cos(re) * Math.sin(ra), Math.sin(re), Math.cos(re) * Math.cos(ra));
      const rr = new THREE.Vector3().crossVectors(AX.y, rdir).normalize();
      p.rp = rdir.multiplyScalar(ORBIT.rocket);
      p.rq = basisQuat(rr, new THREE.Vector3().crossVectors(rdir, rr), rdir);
    }
    return p;
  }

  // ---- loop ------------------------------------------------------------------------------
  const clock = new THREE.Clock();
  let first = true;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const ax = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
    const ay = (keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowDown") ? 1 : 0);
    const inside = st.stage >= 1 && st.stage <= 6;

    if (inside) {
      const speed = 5 + st.dist * 0.35;
      st.vx = damp(st.vx, ax * speed, 6, dt);
      st.vy = damp(st.vy, ay * speed, 6, dt);
      st.ox += st.vx * dt; st.oy += st.vy * dt;
      const minX = -PANEL_HALF.x - 0.5, maxX = ROCKET_REST.x, ly = PANEL_HALF.y;
      if (st.ox < minX || st.ox > maxX) { st.ox = clamp(st.ox, minX, maxX); st.vx = 0; }
      if (Math.abs(st.oy) > ly) { st.oy = clamp(st.oy, -ly, ly); st.vy = 0; }
      // camera holds still until the rocket nears the edge of the view, then pushes along
      const aspect = Number.isFinite(camera.aspect) && camera.aspect > 0 ? camera.aspect : 16 / 9;
      const vh = Math.tan(THREE.MathUtils.degToRad(25)) * st.dist, vw = vh * aspect;
      const mx = Math.max(vw - 1.3, 0.3), my = Math.max(vh - 2.0, 0.3);
      st.camTx = clamp(clamp(st.camTx, st.ox - mx, st.ox + mx), -PANEL_HALF.x, PANEL_HALF.x);
      st.camTy = clamp(clamp(st.camTy, st.oy - my, st.oy + my), -PANEL_HALF.y, PANEL_HALF.y);
      st.camOx = damp(st.camOx, st.camTx, 2.6, dt);
      st.camOy = damp(st.camOy, st.camTy, 2.6, dt);
      st.dist = damp(st.dist, st.distT, 5, dt);
    } else {
      st.vaz = damp(st.vaz, ax * 1.1, 5, dt);
      st.vel = damp(st.vel, ay * 0.8, 5, dt);
      st.idle = ax || ay ? 0 : st.idle + dt;
      st.az += (st.vaz + (st.idle > 2 ? 0.06 : 0)) * dt;
      st.el = clamp(st.el + st.vel * dt, -1.0, 1.15);
      st.R = damp(st.R, st.RT, 4, dt);
    }

    const tp = targetPose(time);
    if (first) { Object.assign(cur, { cam: tp.cam, camQ: tp.camQ, rp: tp.rp, rq: tp.rq }); first = false; }

    let spin = 0;
    if (trans) {
      trans.t += dt / trans.dur;
      const k = easeInOutQuart(Math.min(trans.t, 1));
      cur.cam.lerpVectors(trans.from.cam, tp.cam, k);
      cur.camQ.slerpQuaternions(trans.from.camQ, tp.camQ, k);
      cur.rp.lerpVectors(trans.from.rp, tp.rp, k);
      // arc the rocket toward the centre and give it a barrel roll
      cur.rp.addScaledVector(cur.rp.clone().normalize(), -Math.sin(Math.PI * k) * 2.5);
      cur.rq.slerpQuaternions(trans.from.rq, tp.rq, k);
      spin = k * Math.PI * 2;
      flameMat.uniforms.uPower.value = 1.6;
      if (trans.t >= 1) trans = null;
    } else {
      cur.cam.copy(tp.cam); cur.camQ.copy(tp.camQ); cur.rp.copy(tp.rp); cur.rq.copy(tp.rq);
      const v = inside ? Math.hypot(st.vx, st.vy) / 8 : Math.abs(st.vaz) + Math.abs(st.vel);
      flameMat.uniforms.uPower.value = damp(flameMat.uniforms.uPower.value, 0.35 + v, 6, dt);
    }

    camera.position.copy(cur.cam);
    camera.quaternion.copy(cur.camQ);

    // rocket: base orientation + bank into motion + idle bob/spin
    const bankX = inside ? st.vx : st.vaz * 6;
    const bankY = inside ? st.vy : st.vel * 6;
    rocket.position.copy(cur.rp);
    rocket.position.y += Math.sin(time * 1.6) * 0.08;
    qRoll.setFromAxisAngle(AX.z, -bankX * 0.06 + Math.sin(time * 0.9) * 0.04);
    qPitch.setFromAxisAngle(AX.x, -bankY * 0.04);
    rocket.quaternion.copy(cur.rq).multiply(qRoll).multiply(qPitch);
    rocketBody.rotation.y = time * 0.6 + spin;
    flameMat.uniforms.uTime.value = time;
    flame.scale.set(1, 0.7 + flameMat.uniforms.uPower.value * 0.6, 1);

    // exhaust particles
    rocket.updateMatrixWorld();
    const nozzleW = new THREE.Vector3(0, -1.5, 0).applyMatrix4(rocket.matrixWorld);
    const back = new THREE.Vector3(0, -1, 0).applyQuaternion(rocket.quaternion);
    const emit = flameMat.uniforms.uPower.value > 0.5 ? 2 : 1;
    for (let e = 0; e < emit; e++) {
      const i = trailHead; trailHead = (trailHead + 1) % TRAIL;
      trailPos.set([nozzleW.x, nozzleW.y, nozzleW.z], i * 3);
      trailVel.set([back.x * 1.5 + (Math.random() - 0.5) * 0.4, back.y * 1.5 + (Math.random() - 0.5) * 0.4, back.z * 1.5 + (Math.random() - 0.5) * 0.4], i * 3);
      trailLife[i] = 1;
    }
    for (let i = 0; i < TRAIL; i++) {
      if (trailLife[i] <= 0) { trailPos[i * 3 + 1] = 9999; continue; }
      trailLife[i] -= dt * 1.4;
      trailPos[i * 3] += trailVel[i * 3] * dt;
      trailPos[i * 3 + 1] += trailVel[i * 3 + 1] * dt;
      trailPos[i * 3 + 2] += trailVel[i * 3 + 2] * dt;
    }
    trailGeo.attributes.position.needsUpdate = true;

    // dust drift
    for (let i = 0; i < DUST; i++) {
      const s = dustSeed[i];
      dustPos[i * 3 + 1] += Math.sin(time * 0.3 + s) * 0.002;
      dustPos[i * 3] += Math.cos(time * 0.2 + s) * 0.0015;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // what's visible depends on where the camera is
    const m = Math.max(Math.abs(cur.cam.x), Math.abs(cur.cam.y), Math.abs(cur.cam.z));
    const outside = smooth(H - 1, H + 4, m);
    barMat.opacity = outside;
    rocket.scale.setScalar(0.55 + outside * 0.75);
    logo.visible = outside > 0.01;
    logoGlow.material.opacity = 0.35 * outside;
    logo.rotation.y = -0.35 + Math.sin(time * 0.25) * 0.15;
    logo.position.y = Math.sin(time * 0.5) * 0.25;
    glassUniforms.uTime.value = time;

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cur.camQ);
    // cull by hand: Chrome ignores backface-visibility on CSS3D children, and
    // anything behind the camera must never reach the CSS renderer
    const facing = (o, normal) => tmp.b.copy(cur.cam).sub(o.position).dot(normal) > 0;
    panels.forEach((o, i) => {
      const toP = tmp.a.copy(o.position).sub(cur.cam);
      o.visible = toP.dot(fwd) > 0.5 && facing(o, FACES[i].n);
      let op;
      if (st.stage === 7) op = 0.3;
      else if (st.stage === 0) op = 0.18;
      else op = st.stage === i + 1 ? 1 : 0.32;
      o.element.style.opacity = op;
    });
    labels.forEach((o, i) => {
      o.visible = facing(o, tmp.a.copy(FACES[i].n).negate());
      o.element.style.opacity = st.stage === 7 ? 1 : 0;
    });

    gl.render(scene, camera);
    css.render(cssScene, camera);
    requestAnimationFrame(frame);
  }

  function resize() {
    if (!innerWidth || !innerHeight) return;   // hidden/zero-size window: keep the last good size
    DIST.def = fitDist();
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    gl.setSize(innerWidth, innerHeight);
    css.setSize(innerWidth, innerHeight);
    glassUniforms.uRes.value.set(innerWidth * gl.getPixelRatio(), innerHeight * gl.getPixelRatio());
  }
  addEventListener("resize", resize);
  resize();
  st.dist = st.distT = DIST.def;

  // start where the URL says (handy when reloading mid-talk)
  const start = parseInt(location.hash.slice(1), 10);
  st.stage = Number.isFinite(start) ? clamp(start, 0, 7) : 0;
  updateUI();
  requestAnimationFrame(frame);
})();
