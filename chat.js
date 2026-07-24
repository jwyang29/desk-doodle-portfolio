/* =========================================================================
   친구랑 톡 — 채팅 엔진 (규칙 기반)
   말투 참고: 실제 친구(박수흔) — 반말+애교, ㅋㅋ/ㅜㅜ/!!! 많이, 가끔 오타,
   자주 아프고 학원/학교 얘기, 다정하고 살짝 드라마틱, 짧게 여러 번 나눠 보냄.
   나중에 진짜 AI로 바꾸려면 CHAT_CONFIG.apiEndpoint만 채우면 됩니다.
   ========================================================================= */
const CHAT_CONFIG = {
  friendName: "친구",
  greeting: "왔어?? ㅋㅋ 뭐하고 있었어",
  apiEndpoint: "", // 진짜 AI로 바꾸려면 프록시 URL
  persona: "너는 사용자의 친한 친구 '수흔'이야. 한국어 반말, 애교 많고 다정함. ㅋㅋㅋ, ㅜㅜ, !!! 자주 쓰고 가끔 오타. 자주 아프고(감기) 학원/학교 얘기 많이 함. 짧게 여러 번 나눠서 답함.",
};

/* ── 규칙: [정규식, [응답들]] 순서대로 검사, 먼저 맞는 것 사용.
   응답이 배열이면 여러 말풍선으로 순서대로 전송됨. ── */
const RULES = [
  [/안녕|하이|ㅎㅇ|왔어|하잉|헤이|반가/, [
    ["ㅎㅇㅎㅇ", "오랜만이야 진짜ㅋㅋ"],
    "왔어?? 기다렸잖아 ㅋㅋ",
    "하이하이~ 뭐하고 있었어?",
    ["안녕!!", "오늘 뭐함?"],
    "왔구나 ㅎㅎ 보고싶었어 ㅜㅜ",
  ]],
  [/아파|아퍼|아프|열나|열이|감기|몸살|병원|안좋|콜록|기침|목아파|몸이 안|어지러|배아파|두통/, [
    ["나도 감기 계속 안 낫아 ㅜㅜ", "같이 아프네 우리ㅋㅋ"],
    "헐 괜찮아?? 병원은 갔어?",
    "약 먹었어?? 무리하지마 진짜..",
    "아프지마 ㅠㅠㅠ 내가 대신 아파주고싶다",
    ["나 저번주부터 몸이 안좋아서", "계속 침대엿어…", "감기가 길게 걸림 ㅜㅜ"],
    "빨리 나아야돼 알겠지? 물 많이 마셔!!",
    ["헐 열나?? ", "이불 잘 덮고 푹 자 ㅜㅜ"],
  ]],
  [/괜찮|괜찬|갠찮/, [
    "응 괜찮아 걱정해줘서 고마워 ㅎㅎ",
    ["아직 좀 그래 ㅜㅜ", "근데 니가 물어봐주니까 나음ㅋㅋ"],
    "괜찮아질거야 아마도?? ㅋㅋㅋ",
    "헐 걱정해줘서 고마워 진짜ㅠㅠ",
  ]],
  [/학교|학원|공부|시험|숙제|수업|등교|과제|성적|시간표|자습|야자/, [
    "학원 가기 싫어 죽겠어 ㅜㅜㅜ",
    ["나 이따 학원가야돼", "수학학원 ㅠㅠ"],
    "시험 언제야 나 하나도 공부 안했어 헐",
    "학교에서 폰 써도 돼?? ㅋㅋㅋ 걸리지마~",
    "숙제 했어?? 나 아직 시작도 안함…",
    ["공부 같이 하자", "도서관 ㄱㄱ? ㅋㅋ"],
    "아 학교 가기시러 ㅜㅜ 그냥 놀고싶다",
  ]],
  [/밥|먹었|뭐먹|점심|저녁|아침|배고파|맛있|치킨|떡볶이|피자|카페|디저트/, [
    "밥 먹었어? 난 아직ㅠㅠ",
    ["헐 나 지금 완전 배고파", "뭐라도 먹을까"],
    "뭐 먹었는데?? 맛있는거 먹었어?",
    ["나 방금 라면 먹음 ㅋㅋ", "살찔거같아 ㅜㅜ"],
    "같이 먹고싶다 진짜.. 담에 맛집가자!!",
    "떡볶이 땡긴다 진짜 ㅋㅋㅋ 시켜먹을까",
  ]],
  [/사랑|좋아해|보고싶|보고파|최고|이뻐|예뻐|귀여|멋있|짱|사랑해/, [
    "야 갑자기 왜그래 ㅋㅋㅋ 부끄럽게",
    "나도 나도!! 보고싶어 진짜 ㅜㅜ",
    ["헤헤", "나도 니가 젤 좋아 ㅎㅎ"],
    "낯간지럽게 ㅋㅋㅋ 근데 기분좋다",
    "우리 언제 만나?? 보고싶단말야 ㅠㅠ",
  ]],
  [/고마워|고맙|ㄱㅅ|감사|고마웡/, [
    "뭘 이런걸로 ㅋㅋ 친구잖아",
    "헐 아니야~ 당연한거지",
    "고맙긴!! 언제든 말해 ㅎㅎ",
  ]],
  [/미안|죄송|ㅈㅅ|쏘리|미안해/, [
    "괜찮아 괜찮아 ㅋㅋ 신경쓰지마",
    "야 됐어 무슨 미안이야~",
    "미안하면 담에 맛있는거 사 ㅋㅋㅋ",
  ]],
  [/피곤|졸려|졸림|힘들|지쳐|힘드|빡세|버거|잠와|자고싶|눕고싶/, [
    "나도 개피곤해 ㅜㅜ 자고싶다",
    ["힘들지..", "고생했어 진짜 오늘도"],
    "얼른 쉬어 무리하지말고!!",
    ["커피라도 마셔 ㅋㅋ", "아님 그냥 자자 우리 ㅜㅜ"],
  ]],
  [/심심|노잼|재미없|할거없|할게없|지루/, [
    "나도 개심심 ㅋㅋㅋ 뭐하고 놀지",
    "심심하면 나랑 통화할래?",
    ["ㅋㅋㅋ 심심하면", "웃긴거 보내줄게 기다려봐"],
    "우리 만날까 그냥?? ㅋㅋ",
  ]],
  [/놀자|만나|만날|보자|약속|나와|나올|어디야|나갈/, [
    "좋아좋아!! 언제 볼까??",
    ["나 이번주는 학원땜에 힘들고 ㅜㅜ", "담주 어때??"],
    "콜! 뭐할지 정하자 ㅋㅋ",
    "만나면 맛있는거 먹으러가자 ㅎㅎ",
  ]],
  [/축하|생일|합격|붙었|해냈|성공|1등|잘됐|잘 됐/, [
    "헐 축하해!!!! 🎉 대박이다 진짜",
    ["와 축하축하!!", "한턱 쏴 ㅋㅋㅋ"],
    "진짜 잘됐다 ㅠㅠ 내일처럼 기뻐",
  ]],
  [/ㅜㅜ|ㅠㅠ|슬퍼|우울|눈물|속상|힘내|짜증|화나|화남|스트레스|빡쳐|현타/, [
    "왜그래 무슨일있어?? ㅜㅜ",
    ["에고 ㅜㅜ", "내가 안아줄게 힘내"],
    "무슨일이야 말해봐 다 들어줄게",
    "속상하겠다 진짜.. 나한테 다 털어놔",
    "괜찮아질거야 우리 파이팅 ㅜㅜ 💪",
  ]],
  [/잘자|굿밤|자러|잔다|굿나잇|자야|자야지|굿밤/, [
    "잘자 좋은꿈꿔 ㅎㅎ",
    ["응 잘자!!", "내꿈꿔 ㅋㅋㅋ"],
    "굿밤 🌙 내일봐~",
  ]],
  [/날씨|더워|추워|비와|비온|눈와|덥다|춥다|미세먼지/, [
    "그니까 날씨 왜이래 진짜ㅜㅜ",
    "감기 조심해 옷 따뜻하게 입고!!",
    "밖에 나가기 싫은 날씨다 ㅋㅋ",
  ]],
  [/^\s*(ㅇㅇ|응|ㅇㅋ|그래|오케이|ㅇㅑ|ㄱㄱ|콜|ㅇㅈ|인정)\s*$/, [
    "ㅇㅋㅇㅋ ㅋㅋ",
    "굿굿 그럼 그렇게 하자",
    "콜콜 ㅋㅋㅋ",
  ]],
  [/^\s*(아니|ㄴㄴ|노노?|싫어|안돼|별로|글쎄)/, [
    "왜애 ㅜㅜ",
    "헐 왜 싫어 ㅋㅋㅋ",
    "그래그래 알겠어~ 그럼 딴거 하자",
  ]],
  [/뭐해|뭐 해|머해|뭐하|모해|뭐함/, [
    "그냥 침대에 누워있지 뭐 ㅋㅋ 넌?",
    ["나? 폰만 보는중", "넌 뭐해?"],
    "숙제하는 척 하는중 ㅋㅋㅋ",
    "학원 갈 준비… 가기싫다 진짜 ㅜㅜ",
    "심심해서 너한테 연락하려던 참이었어 ㅋㅋ",
  ]],
  [/\?\s*$|어때|어떻게|뭐야|왜|언제|어디|누구|얼마/, [
    "음… 글쎄 ㅋㅋ 너는 어떻게 생각하는데?",
    "그건 좀 생각해봐야될듯 ㅋㅋㅋ",
    "몰라몰라~ 너가 정해 ㅎㅎ",
    "왜? 무슨일인데?? 궁금하게",
    "그니까 ㅋㅋ 나도 그거 궁금했어",
  ]],
  [/ㅋㅋ|ㅎㅎ|웃겨|웃김|개웃|빵터|킹받|웃프|ㅋ큐/, [
    "ㅋㅋㅋㅋㅋㅋ 진짜 웃기다",
    "야 그만웃겨 배아파 ㅋㅋㅋㅋ",
    "ㅋㅋㅋㅋㅋ 미쳤어 진짜",
    "ㅋㅋㅋㅋ 너 왜케 웃겨",
  ]],
];

/* 키워드 안 걸릴 때 쓰는 기본 응답 풀 (다양하게) */
const GENERIC = [
  "ㅋㅋㅋ 진짜?",
  "헐 대박",
  "오 완전 신기하다",
  "그래서 어떻게 됐어??",
  ["헐 나도 그생각 했었는데 ㅋㅋ", "완전 통했다 우리"],
  "완전 인정 ㅇㅈ",
  "아 진짜?? 몰랐어",
  "ㅋㅋㅋㅋ 웃기다 진짜",
  "그니까~ 내말이",
  "오오 좋다좋다",
  "음 그렇구나 ㅎㅎ",
  "헐 나 지금 완전 공감돼",
  "그랬구나 ㅜㅜ 고생했어",
  "말도안돼 ㅋㅋㅋ 진짜??",
  ["오키", "그럼 어떻게 할까?"],
  "나 사실 지금 좀 심심했는데 잘됐다 ㅋㅋ",
  "너는? 넌 요즘 어때",
  "ㅋㅋㅋ 역시 너답다",
  "헉 그런일이…",
  "우와 부럽다 진짜 ㅜㅜ",
  "오 그래?? 더 얘기해봐 ㅋㅋ",
  "아 웃겨 진짜 ㅋㅋㅋ 넌 뭐하고있었어?",
];

/* ---------------- DOM ---------------- */
const lock = document.getElementById("lock");
const chat = document.getElementById("chat");
const log = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
document.getElementById("chatName").textContent = CHAT_CONFIG.friendName;

const history = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function unlock() {
  lock.hidden = true;
  chat.hidden = false;
  input.focus();
  if (CHAT_CONFIG.greeting) addBubble("friend", CHAT_CONFIG.greeting);
}
lock.addEventListener("click", unlock);

function addBubble(who, text) {
  const b = document.createElement("div");
  b.className = "bubble " + (who === "user" ? "me" : "them");
  b.textContent = text;
  log.appendChild(b);
  history.push({ role: who, text });
  log.scrollTop = log.scrollHeight;
}
function showTyping() {
  const t = document.createElement("div");
  t.className = "typing";
  t.innerHTML = "<i></i><i></i><i></i>";
  log.appendChild(t);
  log.scrollTop = log.scrollHeight;
  return t;
}

/* ---------------- 이모티콘 ---------------- */
const emojiTray = document.getElementById("emojiTray");
const emojiBtn = document.getElementById("emojiBtn");
let EMOJIS = []; // 존재하는 이모티콘 id 목록

/* assets/emoji_00.png, emoji_01.png … 자동 탐색 (연속 번호가 끊기면 종료) */
(function probeEmojis(cb) {
  const found = [];
  (function tryIdx(n) {
    if (n > 40) return cb(found);
    const id = "emoji_" + String(n).padStart(2, "0");
    const img = new Image();
    img.onload = () => { found.push(id); tryIdx(n + 1); };
    img.onerror = () => cb(found);
    img.src = "assets/" + id + ".png?v=" + Date.now();
  })(0);
})((ids) => {
  EMOJIS = ids;
  if (!ids.length) return;
  emojiBtn.hidden = false;
  ids.forEach((id) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "emoji-item";
    const img = document.createElement("img"); img.src = "assets/" + id + ".png"; img.alt = id;
    b.appendChild(img);
    b.addEventListener("click", () => { emojiTray.hidden = true; sendSticker(id); });
    emojiTray.appendChild(b);
  });
});
emojiBtn.addEventListener("click", () => { emojiTray.hidden = !emojiTray.hidden; });

/* 이모티콘(스티커) 말풍선 */
function addSticker(who, id) {
  const b = document.createElement("div");
  b.className = "bubble sticker " + (who === "user" ? "me" : "them");
  const img = document.createElement("img"); img.src = "assets/" + id + ".png"; img.alt = "이모티콘";
  b.appendChild(img);
  log.appendChild(b);
  const c = EMOJI_CONTEXT[id];
  // 히스토리엔 이모티콘 의미를 텍스트로 남겨, 챗봇이 반응할 수 있게
  history.push({ role: who, text: "(" + (c ? c.context + " " + (c.keywords || []).join(" ") : "이모티콘") + ")" });
  log.scrollTop = log.scrollHeight;
}

/* 내 메시지 상황에 맞는 이모티콘 고르기 (컨텍스트 keywords 매칭) */
const recentEmoji = [];
function pickBotEmoji() {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUser && lastUser.text) || "";
  const matches = EMOJIS.filter((id) => {
    const c = EMOJI_CONTEXT[id];
    return c && c.keywords && c.keywords.some((k) => text.includes(k));
  });
  if (!matches.length) return null;
  const fresh = matches.filter((id) => !recentEmoji.includes(id));
  const arr = fresh.length ? fresh : matches;
  const pick = arr[Math.floor(Math.random() * arr.length)];
  recentEmoji.push(pick); if (recentEmoji.length > 5) recentEmoji.shift();
  return pick;
}

/* ---------------- 전송 ---------------- */
let busy = false;

async function respond() {
  busy = true;
  sendBtn.disabled = true;
  try {
    const replies = await getFriendReply(history); // 문자열 배열
    for (let i = 0; i < replies.length; i++) {
      const t = showTyping();
      await wait(500 + Math.min(1500, replies[i].length * 55) + (i ? 200 : 0));
      t.remove();
      addBubble("friend", replies[i]);
    }
    // 상황에 맞는 이모티콘 가끔 덧붙이기
    const eid = pickBotEmoji();
    if (eid && Math.random() < 0.45) {
      const t = showTyping();
      await wait(600);
      t.remove();
      addSticker("friend", eid);
    }
  } catch (err) {
    addBubble("friend", "(지금 답장을 못 했어… 잠시 후 다시 ㅠ)");
    console.error(err);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  addBubble("user", text);
  input.value = "";
  respond();
});

function sendSticker(id) {
  if (busy) return;
  addSticker("user", id);
  respond();
}

/* ---------------- 응답 엔진 ---------------- */
async function getFriendReply(hist) {
  if (CHAT_CONFIG.apiEndpoint) {
    const res = await fetch(CHAT_CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona: CHAT_CONFIG.persona,
        messages: hist.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
      }),
    });
    if (!res.ok) throw new Error("api " + res.status);
    const data = await res.json();
    return [((data.reply || "").trim() || "음…")];
  }
  return ruleReply(hist);
}

/* 최근 답변 반복 방지 */
const recent = [];
const keyOf = (x) => (Array.isArray(x) ? x.join("|") : x);
function choose(pool) {
  const fresh = pool.filter((x) => !recent.includes(keyOf(x)));
  const arr = fresh.length ? fresh : pool;
  const picked = arr[Math.floor(Math.random() * arr.length)];
  recent.push(keyOf(picked));
  if (recent.length > 10) recent.shift();
  return Array.isArray(picked) ? picked.slice() : [picked];
}

function ruleReply(hist) {
  const last = (hist[hist.length - 1] || {}).text || "";
  for (const [re, pool] of RULES) {
    if (re.test(last)) return Promise.resolve(choose(pool));
  }
  return Promise.resolve(choose(GENERIC));
}
