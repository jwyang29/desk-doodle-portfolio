/* =========================================================================
   클릭 요소 설정
   각 이미지는 배경과 동일 크기(2360×1640)의 투명 오버레이입니다.
   위치는 이미지 안에 이미 그려져 있으므로 좌표를 따로 줄 필요가 없고,
   JS가 실제 그림(불투명 픽셀) 위를 눌렀는지 판정해서 페이지로 넘깁니다.

     img    : assets/ 안의 PNG 파일명
     label  : 마우스 올렸을 때 이름표
     page   : 클릭 시 이동할 페이지
     action : 페이지 이동 대신 특수 동작 ('cat' = 고양이 튀어나오기)
     sway   : true 면 평소에 부드럽게 흔들림
   배열 순서 = 겹침 순서(뒤쪽이 위). 겹치는 부분은 위쪽이 우선 클릭됩니다.
   ========================================================================= */
const OBJECTS = [
  { img: "phone.png",      label: "친구랑 톡 💬",     page: "phone.html" },
  { img: "ipad.png",       label: "디지털 드로잉 🎨", page: "ipad.html" },
  { img: "camera.png",     label: "내가 찍은 사진 📷", page: "camera.html" },
  { img: "watercolor.png", label: "물감 놀이 🖌️",     page: "watercolor.html" },
  { img: "sketchbook.png", label: "낙서장 ✏️",        page: "sketchbook.html" },
  { img: "tail.png",       label: "만져볼까?",         action: "cat", sway: true },
  { img: "thread.png",     label: "실 당겨보기 🧶",     action: "thread" },
];

const ALPHA_THRESHOLD = 20;   // 이 값보다 불투명해야 클릭으로 인정
const HIT_W = 590;            // 픽셀 판정용 축소 캔버스 가로(성능용)

const stage = document.getElementById("stage");
const tooltip = document.getElementById("tooltip");

const layers = [];   // { obj, el(img), ctx, cw, ch }
let ready = 0;

OBJECTS.forEach((obj) => {
  const img = new Image();
  img.className = "layer" + (obj.sway ? " sway" : "");
  img.alt = obj.label;
  img.src = "assets/" + obj.img;
  stage.appendChild(img);

  const rec = { obj, el: img, ctx: null, cw: 0, ch: 0 };
  layers.push(rec);

  img.addEventListener("load", () => {
    const cw = HIT_W;
    const ch = Math.round((img.naturalHeight / img.naturalWidth) * cw);
    const c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    rec.ctx = ctx; rec.cw = cw; rec.ch = ch;
    ready++;
  });
});

/* 고양이 팝업 레이어 (tail 클릭 시 왼쪽에서 튀어나옴). cat.png는 나중에 추가 */
const cat = document.createElement("img");
cat.className = "cat-pop";
cat.id = "cat";
cat.alt = "";
cat.src = "assets/cat.png";
// cat.png가 아직 없으면 깨진 아이콘이 뜨지 않게 숨김. 파일 추가되면 자동으로 보임.
cat.addEventListener("error", () => { cat.dataset.missing = "1"; cat.style.display = "none"; });
cat.addEventListener("load", () => { cat.style.display = ""; delete cat.dataset.missing; });
stage.appendChild(cat);

// tail 레이어(흔들리는 이미지) 참조
const tailEl = (layers.find((l) => l.obj.sway) || {}).el || null;

/* 꼬리 클릭 시퀀스:
   1~2번째 클릭 → 흔들림이 잠깐 빨라졌다가 원상복귀
   3번째 클릭   → cat.png가 왼쪽에서 등장
   등장 10초 뒤 → 다시 꼬리 상태로 복귀 */
let tailClicks = 0, catTimer = null, exciteTimer = null;

function exciteTail() {
  if (!tailEl) return;
  tailEl.classList.add("excited");
  clearTimeout(exciteTimer);
  exciteTimer = setTimeout(() => tailEl.classList.remove("excited"), 900);
}
function showCat() {
  if (cat.dataset.missing) return;
  if (tailEl) { tailEl.classList.remove("excited"); tailEl.classList.add("cat-out"); } // 꼬리 숨김
  cat.classList.add("show");
  clearTimeout(catTimer);
  catTimer = setTimeout(hideCat, 10000);
}
function hideCat() {
  cat.classList.remove("show");
  if (tailEl) tailEl.classList.remove("cat-out"); // 꼬리 복귀
  tailClicks = 0;
}
function pokeTail() {
  if (cat.classList.contains("show")) return; // 이미 나와 있으면 무시
  tailClicks++;
  if (tailClicks >= 3) showCat();
  else exciteTail();
}

/* 클릭 캡처용 투명 레이어 */
const hit = document.createElement("div");
hit.className = "hit";
stage.appendChild(hit);

/* 좌표 → 판정 캔버스 픽셀의 alpha */
function alphaAt(rec, nx, ny) {
  if (!rec.ctx) return 0;
  const x = Math.floor(nx * rec.cw);
  const y = Math.floor(ny * rec.ch);
  if (x < 0 || y < 0 || x >= rec.cw || y >= rec.ch) return 0;
  return rec.ctx.getImageData(x, y, 1, 1).data[3];
}

/* 좌표에서 가장 위에 있는 불투명 오브젝트 찾기 */
function pick(clientX, clientY) {
  const r = stage.getBoundingClientRect();
  const nx = (clientX - r.left) / r.width;
  const ny = (clientY - r.top) / r.height;
  if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
  for (let i = layers.length - 1; i >= 0; i--) {
    if (alphaAt(layers[i], nx, ny) > ALPHA_THRESHOLD) return layers[i];
  }
  return null;
}

/* 마우스 이동: 커서 + 이름표 + 살짝 강조 */
let hovered = null;
hit.addEventListener("mousemove", (e) => {
  if (drag) return;                 // 드래그 중엔 툴팁/호버 억제
  const rec = pick(e.clientX, e.clientY);
  if (rec !== hovered) {
    if (hovered) hovered.el.classList.remove("hot");
    hovered = rec;
    if (hovered) hovered.el.classList.add("hot");
  }
  if (rec) {
    hit.style.cursor = "pointer";
    tooltip.textContent = rec.obj.label;
    tooltip.style.left = e.clientX + "px";
    tooltip.style.top = e.clientY + "px";
    tooltip.hidden = false;
  } else {
    hit.style.cursor = "default";
    tooltip.hidden = true;
  }
});
hit.addEventListener("mouseleave", () => {
  if (hovered) { hovered.el.classList.remove("hot"); hovered = null; }
  tooltip.hidden = true;
});

/* 클릭: 특수 동작 or 페이지 이동 (드래그 직후 클릭은 무시) */
let justDragged = false;
hit.addEventListener("click", (e) => {
  if (justDragged) { justDragged = false; return; }
  const rec = pick(e.clientX, e.clientY);
  if (!rec) return;
  if (rec.obj.action === "cat") return pokeTail();
  if (rec.obj.action === "thread") return;      // 실은 드래그로만 동작
  if (rec.obj.page) window.location.href = rec.obj.page;
});

/* ── 실(thread) 당기기: 잡고 움직이면 실이 따라오고, 움직인 만큼 고양이가
   왼쪽→오른쪽으로 서서히 등장. 놓으면(클릭 해제/터치 멈춤) 원상복구 ── */
const threadEl = (layers.find((l) => l.obj.action === "thread") || {}).el || null;
const PULL_FULL = 0.55;   // stage 가로의 이만큼 끌면 고양이 완전히 등장(클수록 천천히)
const CAT_SHIFT = 30;     // 고양이가 숨을 때 왼쪽으로 밀리는 정도(%)
let drag = null;

function setCatReveal(p) {
  cat.style.opacity = String(p);
  cat.style.transform = "translateX(" + (-CAT_SHIFT * (1 - p)) + "%) scale(" + (0.94 + 0.06 * p) + ")";
  if (tailEl) tailEl.classList.toggle("cat-out", p > 0.02);
}

hit.addEventListener("pointerdown", (e) => {
  if (cat.dataset.missing || !threadEl) return;
  const rec = pick(e.clientX, e.clientY);
  if (!rec || rec.obj.action !== "thread") return;
  drag = { x0: e.clientX, y0: e.clientY, moved: false };
  threadEl.style.transition = "none";
  cat.style.transition = "none";           // 드래그 중엔 즉각 반응
  tooltip.hidden = true;
  try { hit.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
});

hit.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  threadEl.style.transform = "translate(" + dx + "px," + dy + "px)"; // 실이 손을 따라옴
  const r = stage.getBoundingClientRect();
  const dist = Math.hypot(dx, dy);
  const p = Math.max(0, Math.min(1, dist / (r.width * PULL_FULL)));
  setCatReveal(p);
});

function endDrag() {
  if (!drag) return;
  if (drag.moved) { justDragged = true; setTimeout(() => { justDragged = false; }, 0); }
  // 부드럽게 원상복구
  threadEl.style.transition = "transform .6s cubic-bezier(.34,1.4,.6,1)";
  threadEl.style.transform = "";
  cat.style.transition = "";     // 기본 트랜지션으로 스르륵 복귀
  cat.style.opacity = "";
  cat.style.transform = "";
  if (tailEl) tailEl.classList.remove("cat-out");
  drag = null;
}
hit.addEventListener("pointerup", endDrag);
hit.addEventListener("pointercancel", endDrag);

/* ── 연필: 클릭하면 손(PencilHand) 커서로 바뀌고, 누른 채 움직이면
   연필 끝에서 선이 그려짐 (필기 효과) ── */
(function setupPencil() {
  const spot = document.createElement("button");   // 연필 클릭 영역
  spot.className = "pencil-hotspot";
  spot.setAttribute("aria-label", "연필로 그리기");
  stage.appendChild(spot);

  const canvas = document.createElement("canvas");  // 그림 캔버스
  canvas.className = "draw-layer";
  stage.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  function fit() {
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 3.2; ctx.strokeStyle = "#2b2b2b";
  }
  fit();
  window.addEventListener("resize", fit);

  const hand = document.createElement("img");       // 연필 든 손 커서
  hand.className = "pencil-cursor"; hand.alt = "";
  document.body.appendChild(hand);
  let tipX = 0.12, handW = 150, handH = 175;         // 펜촉 x비율 / 커서 크기

  const toolbar = document.createElement("div");     // 그리기 툴바
  toolbar.className = "draw-toolbar";
  toolbar.innerHTML = '<button data-a="clear">지우기 🧽</button><button data-a="exit">그만 ✕</button>';
  document.body.appendChild(toolbar);

  // PencilHand 크롭 + 펜촉(맨 위 불투명 픽셀) 위치 계산 → 커서 이미지
  const pimg = new Image();
  pimg.onload = () => {
    const cw = Math.min(700, pimg.naturalWidth), ch = Math.round(pimg.naturalHeight * cw / pimg.naturalWidth);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(pimg, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data;
    let minx = cw, miny = ch, maxx = 0, maxy = 0;
    for (let y = 0; y < ch; y++) for (let xx = 0; xx < cw; xx++) if (d[(y * cw + xx) * 4 + 3] > 40) { if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    const bw = maxx - minx, bh = maxy - miny;
    let sx = 0, sn = 0, band = miny + Math.max(2, Math.round(bh * 0.05));
    for (let y = miny; y < band; y++) for (let xx = minx; xx <= maxx; xx++) if (d[(y * cw + xx) * 4 + 3] > 40) { sx += xx; sn++; }
    tipX = (sn ? sx / sn - minx : bw / 2) / bw;
    const sc = pimg.naturalWidth / cw;
    const fw = Math.round(bw * sc), fh = Math.round(bh * sc);
    const oc = document.createElement("canvas"); oc.width = fw; oc.height = fh;
    oc.getContext("2d").drawImage(pimg, minx * sc, miny * sc, bw * sc, bh * sc, 0, 0, fw, fh);
    hand.src = oc.toDataURL("image/png");
    handW = Math.round(handH * bw / bh);
    hand.style.width = handW + "px"; hand.style.height = handH + "px";
  };
  pimg.src = "assets/PencilHand.png";

  let active = false, drawing = false;
  const toLocal = (cx, cy) => { const r = stage.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top }; };
  function moveHand(cx, cy) { hand.style.transform = "translate(" + (cx - tipX * handW) + "px," + cy + "px)"; }
  function enter() {
    if (active) return; active = true;
    canvas.classList.add("active"); hand.classList.add("on"); toolbar.classList.add("on");
    tooltip.hidden = true; document.body.style.cursor = "none";
  }
  function exit() {
    active = false; drawing = false;
    canvas.classList.remove("active"); hand.classList.remove("on"); toolbar.classList.remove("on");
    document.body.style.cursor = "";
  }
  spot.addEventListener("click", enter);
  spot.addEventListener("mouseenter", (e) => { if (active) return; tooltip.textContent = "그려볼까? ✏️"; tooltip.style.left = e.clientX + "px"; tooltip.style.top = e.clientY + "px"; tooltip.hidden = false; });
  spot.addEventListener("mousemove", (e) => { if (active) return; tooltip.style.left = e.clientX + "px"; tooltip.style.top = e.clientY + "px"; });
  spot.addEventListener("mouseleave", () => { tooltip.hidden = true; });

  canvas.addEventListener("pointerdown", (e) => {
    if (!active) return;
    drawing = true; const p = toLocal(e.clientX, e.clientY);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
    moveHand(e.clientX, e.clientY);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!active) return;
    moveHand(e.clientX, e.clientY);
    if (drawing) { const p = toLocal(e.clientX, e.clientY); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);

  toolbar.addEventListener("click", (e) => {
    const a = e.target.getAttribute("data-a"); if (!a) return;
    if (a === "clear") { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore(); }
    if (a === "exit") exit();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && active) exit(); });
})();

/* ── 위에서 3번째(가운데) 발자국을 누르면 그 자리에 잉크 고양이가 나타남 ── */
(function setupPawCat() {
  const PAW = { x: 35.5, y: 50, w: 6, h: 7 };   // 발자국 중심 + 클릭영역 크기(%)
  const spot = document.createElement("button");
  spot.className = "paw-hotspot";
  spot.style.left = (PAW.x - PAW.w / 2) + "%"; spot.style.top = (PAW.y - PAW.h / 2) + "%";
  spot.style.width = PAW.w + "%"; spot.style.height = PAW.h + "%";
  spot.setAttribute("aria-label", "고양이 발자국");
  stage.appendChild(spot);

  const inkCat = document.createElement("img");
  inkCat.className = "ink-cat"; inkCat.alt = "";
  inkCat.style.left = PAW.x + "%"; inkCat.style.top = PAW.y + "%";
  stage.appendChild(inkCat);

  let CX = 50, CY = 50, shown = false;
  const applyState = () => {
    inkCat.style.transform = "translate(" + (-CX) + "%," + (-CY) + "%) scale(" + (shown ? 1 : 0.2) + ")";
    inkCat.style.opacity = shown ? "1" : "0";
    inkCat.style.pointerEvents = shown ? "auto" : "none";
    inkCat.style.cursor = shown ? "pointer" : "default";
    spot.style.pointerEvents = shown ? "none" : "auto";
  };

  // Catink 크롭 + 잉크 무게중심(dense) 계산 → 그 지점을 발자국에 정렬
  const img = new Image();
  img.onload = () => {
    const cw = Math.min(700, img.naturalWidth), ch = Math.round(img.naturalHeight * cw / img.naturalWidth);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data;
    let minx = cw, miny = ch, maxx = 0, maxy = 0, sxw = 0, syw = 0, sn = 0;
    for (let y = 0; y < ch; y++) for (let xx = 0; xx < cw; xx++) {
      const i = (y * cw + xx) * 4, white = d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240;
      if (d[i + 3] > 30 && !white) { if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (y < miny) miny = y; if (y > maxy) maxy = y; sxw += xx; syw += y; sn++; }
    }
    const bw = maxx - minx, bh = maxy - miny, sc = img.naturalWidth / cw;
    CX = sn ? (sxw / sn - minx) / bw * 100 : 50;
    CY = sn ? (syw / sn - miny) / bh * 100 : 50;
    inkCat.style.transformOrigin = CX + "% " + CY + "%";
    const fw = Math.round(bw * sc), fh = Math.round(bh * sc);
    const oc = document.createElement("canvas"); oc.width = fw; oc.height = fh;
    oc.getContext("2d").drawImage(img, minx * sc, miny * sc, bw * sc, bh * sc, 0, 0, fw, fh);
    inkCat.src = oc.toDataURL("image/png");
    applyState();
  };
  img.src = "assets/Catink.png";

  function toggle() { shown = !shown; applyState(); }
  spot.addEventListener("click", toggle);
  inkCat.addEventListener("click", toggle);
  spot.addEventListener("mouseenter", (e) => { tooltip.textContent = "여기 뭐지? 🐾"; tooltip.style.left = e.clientX + "px"; tooltip.style.top = e.clientY + "px"; tooltip.hidden = false; });
  spot.addEventListener("mousemove", (e) => { tooltip.style.left = e.clientX + "px"; tooltip.style.top = e.clientY + "px"; });
  spot.addEventListener("mouseleave", () => { tooltip.hidden = true; });
})();
