const { sendTelegram } = require("./telegram");
const { analyzeIntent, searchAndSummarize } = require("./gemini");
const { createNotionPage, updateNotionPage, findNotionPage } = require("./notion");

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  // 시작 알림
  await sendTelegram(chatId, "⏳ 처리 중입니다...");

  try {
    // 1단계: Gemini로 사용자 의도 파악
    const intent = await analyzeIntent(text);
    console.log("Intent:", JSON.stringify(intent));

    let content = intent.content;

    // 2단계: 웹 검색이 필요하면 검색 후 정리
    if (intent.search_needed && intent.search_query) {
      await sendTelegram(chatId, `🔍 "${intent.search_query}" 검색 중...`);
      content = await searchAndSummarize(intent.search_query, intent.content);
    }

    // 3단계: Notion 처리
    if (intent.action === "create_new") {
      // 신규 페이지 생성
      const pageUrl = await createNotionPage(intent.project_name, content);
      await sendTelegram(
        chatId,
        `✅ 신규 페이지 생성 완료!\n📄 ${intent.project_name}\n🔗 ${pageUrl}`
      );
    } else if (intent.action === "add_to_existing") {
      // 기존 페이지 검색 후 업데이트
      await sendTelegram(chatId, `🔎 "${intent.project_name}" 페이지 검색 중...`);
      const pageId = await findNotionPage(intent.project_name);

      if (!pageId) {
        await sendTelegram(
          chatId,
          `❌ "${intent.project_name}" 페이지를 찾지 못했습니다.\n신규 생성할까요? "신규로 만들어줘: ${intent.project_name}" 라고 보내주세요.`
        );
        return;
      }

      await updateNotionPage(pageId, content);
      await sendTelegram(
        chatId,
        `✅ 업데이트 완료!\n📄 ${intent.project_name}\n📝 내용이 추가되었습니다.`
      );
    } else {
      await sendTelegram(chatId, "❓ 의도를 파악하지 못했습니다. 다시 시도해주세요.");
    }
  } catch (err) {
    console.error("handleMessage error:", err);
    await sendTelegram(chatId, `❌ 오류가 발생했습니다: ${err.message}`);
  }
}

module.exports = { handleMessage };
