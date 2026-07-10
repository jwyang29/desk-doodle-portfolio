/* 폴더 안의 이미지를 이름 규칙(prefix + 1,2,3...)으로 자동 탐색.
   예) assets/photos/photo1.jpg, photo2.jpg ... 를 순서대로 찾다가
       다음 번호가 없으면 멈춘다. 코드 수정 없이 파일만 올리면 됨. */
function probeImages(prefix, exts, cb, max) {
  const found = [];
  max = max || 60;
  function tryIndex(idx, extPos) {
    if (idx > max) return cb(found);
    if (extPos >= exts.length) return cb(found); // 이 번호가 모든 확장자에서 없음 → 종료
    const src = prefix + idx + "." + exts[extPos];
    const img = new Image();
    img.onload = () => { found.push(src); tryIndex(idx + 1, 0); };
    img.onerror = () => { tryIndex(idx, extPos + 1); };
    img.src = src + "?v=" + Date.now(); // 캐시 우회
  }
  tryIndex(1, 0);
}

const IMG_EXTS = ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG", "webp"];
