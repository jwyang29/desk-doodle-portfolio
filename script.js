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
  { img: "tail.png",       label: "쓰다듬기 🐾",       action: "cat", sway: true },
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
function toggleCat() { if (cat.dataset.missing) return; cat.classList.toggle("show"); }

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

/* 클릭: 특수 동작 or 페이지 이동 */
hit.addEventListener("click", (e) => {
  const rec = pick(e.clientX, e.clientY);
  if (!rec) return;
  if (rec.obj.action === "cat") return toggleCat();
  if (rec.obj.page) window.location.href = rec.obj.page;
});
