import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Recursively fetch all children blocks of a block/page, including
// nested children for blocks that support them (toggles, callouts, tables, etc).
export async function getBlockChildren(blockId) {
  const blocks = [];
  let cursor = undefined;

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  // Recursively resolve children for blocks that have them
  for (const block of blocks) {
    if (block.has_children && block.type !== "child_page") {
      block._children = await getBlockChildren(block.id);
    }
  }

  return blocks;
}

export async function getPageMeta(pageId) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  let title = "Untitled";
  const titleProp = Object.values(page.properties || {}).find(
    (p) => p.type === "title"
  );
  if (titleProp && titleProp.title.length > 0) {
    title = titleProp.title.map((t) => t.plain_text).join("");
  }
  let icon = null;
  if (page.icon) {
    if (page.icon.type === "emoji") icon = page.icon.emoji;
    else if (page.icon.type === "external") icon = page.icon.external.url;
    else if (page.icon.type === "file") icon = page.icon.file.url;
  }
  return { title, icon };
}

// Find child_page blocks anywhere in a block tree (used to list case pages on the hub)
export function collectChildPages(blocks) {
  const found = [];
  for (const block of blocks) {
    if (block.type === "child_page") {
      found.push({ id: block.id, title: block.child_page.title });
    }
    if (block._children) {
      found.push(...collectChildPages(block._children));
    }
  }
  return found;
}
