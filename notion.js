const axios = require("axios");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID; // 기존 특정 페이지 ID

const headers = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

// 텍스트를 Notion 블록 배열로 변환
function textToBlocks(text) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return lines.map((line) => {
    // 불릿 포인트 감지
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: line.replace(/^[-•]\s/, "") } }],
        },
      };
    }
    // 헤더 감지 (## or #)
    if (line.startsWith("## ")) {
      return {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: line.replace(/^##\s/, "") } }],
        },
      };
    }
    if (line.startsWith("# ")) {
      return {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: line.replace(/^#\s/, "") } }],
        },
      };
    }
    // 일반 텍스트
    return {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: line } }],
      },
    };
  });
}

// 신규 페이지 생성 (NOTION_PARENT_PAGE_ID 하위에)
async function createNotionPage(title, content) {
  const blocks = textToBlocks(content);

  const res = await axios.post(
    "https://api.notion.com/v1/pages",
    {
      parent: { page_id: NOTION_PARENT_PAGE_ID },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: [
        // 생성 날짜 블록
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [
              {
                type: "text",
                text: { content: `📅 생성일: ${new Date().toLocaleString("ko-KR")}` },
              },
            ],
            icon: { emoji: "🤖" },
          },
        },
        ...blocks,
      ],
    },
    { headers }
  );

  return res.data.url;
}

// 기존 페이지에 내용 추가 (append)
async function updateNotionPage(pageId, content) {
  const blocks = textToBlocks(content);

  // 구분선 + 날짜 추가
  const dividerAndDate = [
    { object: "block", type: "divider", divider: {} },
    {
      object: "block",
      type: "callout",
      callout: {
        rich_text: [
          {
            type: "text",
            text: { content: `📅 추가일: ${new Date().toLocaleString("ko-KR")}` },
          },
        ],
        icon: { emoji: "📝" },
      },
    },
  ];

  await axios.patch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    { children: [...dividerAndDate, ...blocks] },
    { headers }
  );
}

// 페이지 이름으로 검색 (NOTION_PARENT_PAGE_ID 하위에서)
async function findNotionPage(projectName) {
  const res = await axios.post(
    "https://api.notion.com/v1/search",
    {
      query: projectName,
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
    },
    { headers }
  );

  const pages = res.data.results;
  if (!pages || pages.length === 0) return null;

  // 이름이 가장 유사한 페이지 반환
  const match = pages.find((p) => {
    const titleArr = p.properties?.title?.title;
    if (!titleArr || titleArr.length === 0) return false;
    const pageTitle = titleArr[0].text.content.toLowerCase();
    return pageTitle.includes(projectName.toLowerCase());
  });

  return match ? match.id : null;
}

module.exports = { createNotionPage, updateNotionPage, findNotionPage };
