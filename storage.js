/* 그림 저장소 (localStorage 공유)
   낙서장/물감놀이에서 저장 → 디지털 드로잉(ipad.html)에서 표시 */
const DRAWINGS_KEY = "doodleDrawings";

function getDrawings() {
  try { return JSON.parse(localStorage.getItem(DRAWINGS_KEY) || "[]"); }
  catch (e) { return []; }
}

function setDrawings(list) {
  localStorage.setItem(DRAWINGS_KEY, JSON.stringify(list));
}

/* 캔버스를 흰 배경에 합성 + 축소해서 저장 (용량 절약) */
function saveDrawingFromCanvas(canvas, from) {
  const maxW = 800;
  const scale = Math.min(1, maxW / canvas.width);
  const w = Math.round(canvas.width * scale);
  const h = Math.round(canvas.height * scale);
  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d");
  t.fillStyle = "#fff";
  t.fillRect(0, 0, w, h);
  t.drawImage(canvas, 0, 0, w, h);

  const list = getDrawings();
  list.unshift({ id: Date.now(), src: tmp.toDataURL("image/png"), from: from || "", at: new Date().toISOString() });
  try {
    setDrawings(list);
    return true;
  } catch (e) {
    alert("저장 공간이 부족해요. 디지털 드로잉에서 기존 그림을 지운 뒤 다시 시도해 주세요.");
    return false;
  }
}

function removeDrawing(id) {
  setDrawings(getDrawings().filter((d) => d.id !== id));
}

/* 저장 완료 토스트 */
function showToast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 1900);
}
