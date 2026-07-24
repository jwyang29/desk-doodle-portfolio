/* =========================================================================
   친구랑 톡 — 채팅 엔진
   응답(getFriendReply)은 백엔드와 분리돼 있어, 나중에 아래 CHAT_CONFIG의
   apiEndpoint만 채우면 진짜 AI 응답으로 바뀝니다. (성격은 persona에)
   지금은 apiEndpoint가 비어 있어 임시 목업 응답을 씁니다.
   ========================================================================= */
const CHAT_CONFIG = {
  friendName: "친구",
  greeting: "왔어? ㅋㅋ 뭐하고 있었어",
  // ▼ 진짜 AI로 바꾸려면 프록시 URL을 넣으세요 (예: Cloudflare Worker)
  apiEndpoint: "",
  // ▼ 상대 성격/말투 — 나중에 정리해서 채우기
  persona: "너는 사용자의 친한 친구야. 한국어 반말로, 짧고 장난스럽고 다정하게 답해. 이모지 가끔.",
};

const lock = document.getElementById("lock");
const chat = document.getElementById("chat");
const log = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
document.getElementById("chatName").textContent = CHAT_CONFIG.friendName;

const history = []; // {role:'user'|'friend', text}

/* ---- 잠금 해제 → 채팅 열기 ---- */
function unlock() {
  lock.hidden = true;
  chat.hidden = false;
  input.focus();
  if (CHAT_CONFIG.greeting) addBubble("friend", CHAT_CONFIG.greeting);
}
lock.addEventListener("click", unlock);

/* ---- 말풍선 추가 ---- */
function addBubble(who, text) {
  const b = document.createElement("div");
  b.className = "bubble " + (who === "user" ? "me" : "them");
  b.textContent = text;
  log.appendChild(b);
  history.push({ role: who, text });
  log.scrollTop = log.scrollHeight;
  return b;
}

/* ---- 타이핑 표시 ---- */
function showTyping() {
  const t = document.createElement("div");
  t.className = "typing";
  t.innerHTML = "<i></i><i></i><i></i>";
  log.appendChild(t);
  log.scrollTop = log.scrollHeight;
  return t;
}

/* ---- 전송 ---- */
let busy = false;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  addBubble("user", text);
  input.value = "";
  busy = true;
  sendBtn.disabled = true;

  const typing = showTyping();
  try {
    const reply = await getFriendReply(history);
    typing.remove();
    // 사람처럼 살짝 텀
    addBubble("friend", reply);
  } catch (err) {
    typing.remove();
    addBubble("friend", "(지금 답장을 못 했어… 잠시 후 다시 ㅠ)");
    console.error(err);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
});

/* ---- 응답 엔진 (백엔드 연결 지점) ---- */
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
    return (data.reply || "").trim() || "음…";
  }
  // 백엔드 미연결: 임시 목업 (분위기만)
  return mockReply(hist);
}

/* ---- 임시 목업 응답 (백엔드 연결 전까지) ---- */
function mockReply(hist) {
  const last = (hist[hist.length - 1] || {}).text || "";
  const t = last.toLowerCase();
  const canned = [
    "ㅋㅋㅋ 진짜?",
    "오 대박",
    "헐 나도 그 생각했는데",
    "밥은 먹었어?",
    "그래서 어떻게 됐는데 ㅋㅋ",
    "나 지금 개심심해 놀아줘 ㅠ",
    "완전 인정",
  ];
  let reply;
  if (/안녕|하이|ㅎㅇ/.test(t)) reply = "ㅎㅇㅎㅇ 오랜만~";
  else if (/뭐해|뭐 해|머해/.test(t)) reply = "그냥 누워서 폰 보는 중 ㅋㅋ 넌?";
  else if (/사랑|좋아/.test(t)) reply = "야 갑자기 왜그래 ㅋㅋㅋ 부끄럽게";
  else if (/\?$/.test(last)) reply = "음… 글쎄 ㅋㅋ 넌 어떻게 생각하는데?";
  else reply = canned[Math.floor(Math.random() * canned.length)];
  // 타이핑처럼 보이도록 길이에 비례한 딜레이
  const delay = 500 + Math.min(1600, reply.length * 60);
  return new Promise((r) => setTimeout(() => r(reply), delay));
}
