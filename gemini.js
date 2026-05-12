const axios = require("axios");

const GEMINI_KEY = process.env.GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

// Gemini에 요청 보내는 공통 함수
async function callGemini(prompt) {
  const res = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  });
  return res.data.candidates[0].content.parts[0].text.trim();
}

// 1단계: 사용자 메시지 의도 파악
async function analyzeIntent(userMessage) {
  const prompt = `
당신은 사용자의 메시지를 분석해서 Notion 작업 의도를 파악하는 AI입니다.

사용자 메시지: "${userMessage}"

아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:
{
  "action": "create_new" 또는 "add_to_existing",
  "project_name": "프로젝트/페이지 이름",
  "search_needed": true 또는 false,
  "search_query": "검색이 필요한 경우 검색어, 불필요하면 null",
  "content": "사용자가 추가하길 원하는 내용 요약"
}

판단 기준:
- "신규", "만들어", "새로", "생성" → create_new
- "추가", "업데이트", "넣어줘", "기존" → add_to_existing
- "검색해서", "찾아서", "알아봐서" → search_needed: true
`;

  const raw = await callGemini(prompt);

  try {
    // JSON 파싱 (혹시 코드블록이 붙어있으면 제거)
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Intent parse error, raw:", raw);
    throw new Error("의도 분석에 실패했습니다.");
  }
}

// 2단계: 웹 검색 + 정리 (Gemini의 grounding 기능 사용)
async function searchAndSummarize(searchQuery, originalContent) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: `다음 주제를 검색하고 핵심 내용을 한국어로 깔끔하게 정리해주세요.

검색 주제: "${searchQuery}"
추가 맥락: "${originalContent || "없음"}"

정리 형식:
- 핵심 내용 요약 (3~5줄)
- 주요 포인트 (불릿 포인트)
- 참고할 만한 정보

Notion에 바로 붙여넣을 수 있도록 깔끔하게 작성해주세요.`,
            },
          ],
        },
      ],
      tools: [{ google_search: {} }], // Gemini grounding - 웹 검색
      generationConfig: { temperature: 0.5 },
    }
  );

  return res.data.candidates[0].content.parts[0].text.trim();
}

module.exports = { analyzeIntent, searchAndSummarize };
