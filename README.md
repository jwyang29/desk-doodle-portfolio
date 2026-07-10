# 책상 두들 포트폴리오 (탑뷰)

탑뷰 책상 위 오브젝트를 클릭하면 각각의 인터랙션/페이지가 뜨는 두들 컨셉 포트폴리오.

## 실행 방법
그냥 `index.html`을 브라우저로 열거나, 폴더에서:
```
python3 -m http.server 5500
```
후 http://localhost:5500 접속.

## PNG 그려서 넣는 법
그린 오브젝트를 **투명 배경 PNG**로 저장해서 `assets/objects/` 에 아래 파일명으로 넣으면 자동으로 붙습니다.
파일이 없으면 임시로 점선 박스가 뜹니다.

| 파일명 | 오브젝트 | 클릭 시 |
|--------|----------|---------|
| `phone.png`      | 핸드폰   | 친구와의 채팅창 |
| `ipad.png`       | 아이패드 | 디지털 드로잉 갤러리 |
| `camera.png`     | 카메라   | 내가 찍은 사진 갤러리 |
| `paint.png`      | 물감     | 클릭하면 물감이 튐 |
| `sketchbook.png` | 스케치북 | 마우스로 그리는 낙서장 |
| `coffee.png` `pen.png` `plant.png` | 꾸밈요소 | (클릭 없음) |

- **아이패드 드로잉 이미지** → `assets/drawings/` 에 넣고 `script.js`의 `DRAWINGS` 목록 수정
- **카메라 사진** → `assets/photos/` 에 넣고 `script.js`의 `PHOTOS` 목록 수정
- **채팅 내용** → `script.js`의 `CHAT` 수정

## 위치/크기 조절
`script.js` 맨 위 `OBJECTS` 배열에서 각 오브젝트의 `x, y`(위치 %), `w`(크기 %), `rot`(기울기)만 바꾸면 됩니다.
새 오브젝트를 추가하려면 배열에 한 줄 더 넣으면 끝.
