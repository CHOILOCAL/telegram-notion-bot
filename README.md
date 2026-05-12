# 📬 Telegram → Gemini AI → Notion 자동화 봇

텔레그램 메시지를 보내면 Gemini AI가 내용을 분석/검색하고 Notion에 자동으로 저장해주는 봇입니다.

---

## 📁 파일 구조

```
telegram-notion-bot/
├── index.js        # Express 서버 & Webhook 진입점
├── bot.js          # 메시지 처리 오케스트레이터
├── telegram.js     # Telegram API 헬퍼
├── gemini.js       # Gemini AI (의도 파악 + 웹 검색)
├── notion.js       # Notion API (생성/업데이트/검색)
├── package.json
└── .env.example    # 환경변수 예시
```

---

## ⚙️ 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 열어서 각 값 입력

# 3. 실행
npm start
```

---

## 🚀 Render 배포

1. GitHub에 이 프로젝트 push
2. [render.com](https://render.com) → New Web Service
3. GitHub 레포 연결
4. 설정:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Environment Variables 탭에서 `.env.example`의 값들 입력
6. Deploy 후 URL 복사 (예: `https://your-bot.onrender.com`)

---

## 🔗 Webhook 등록 (배포 후 1회만 실행)

브라우저에서 아래 URL 접속:

```
https://api.telegram.org/bot{TELEGRAM_TOKEN}/setWebhook?url=https://your-bot.onrender.com/webhook
```

성공 시 응답:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## 💬 사용법 예시

### 기존 페이지에 추가
```
"AI 트렌드 프로젝트에다가 2026년 멀티모달 AI 동향을 검색해서 추가해줘"
"리서치 노트에 이 내용 추가해줘: ..."
```

### 신규 페이지 생성
```
"신규로 만들어줘: 파이썬 학습 노트 - 데코레이터 패턴 정리해서 넣어줘"
"새 프로젝트 생성해서 LangChain 최신 업데이트 검색해서 정리해줘"
```

---

## 🔄 흐름도

```
사용자 → 텔레그램 메시지
         ↓
      Webhook (Express)
         ↓
   Gemini: 의도 분석
   (create_new / add_to_existing / search_needed)
         ↓
   [검색 필요시] Gemini: 웹 검색 + 정리
         ↓
   Notion: 신규 생성 or 기존 페이지 업데이트
         ↓
   텔레그램: 성공/실패 결과 메시지
```

---

## ⚠️ 주의사항

- Gemini 무료 티어: 하루 1,500 req/day (개인 사용 충분)
- Render 무료 티어: 비활성 시 sleep → 첫 메시지 응답 30초 소요될 수 있음
  - 해결: Render의 "Health Check" 설정 또는 UptimeRobot으로 주기적 ping
- `.env` 파일은 절대 GitHub에 올리지 말 것 (.gitignore에 추가)
# telegram-notion-bot
