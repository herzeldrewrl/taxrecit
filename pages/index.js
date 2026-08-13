import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getBlockChildren, getPageMeta } from "../lib/notion";
import Blocks, { RichText } from "../components/Blocks";
import Head from "next/head";

function plainText(richText) {
  return (richText || []).map((t) => t.plain_text).join("");
}

// Split "Session 1 — August 13, 2026" into { label: "Session 1", date: "August 13, 2026" }
function splitSessionTitle(text) {
  const parts = text.split(/—|-{1,2}/);
  return {
    label: (parts[0] || text).trim(),
    date: parts.length > 1 ? parts.slice(1).join("-").trim() : "",
  };
}

async function buildSessions(rootPageId) {
  const rootBlocks = await getBlockChildren(rootPageId);

  const sessions = [];
  let current = null;

  for (const block of rootBlocks) {
    if (block.type === "heading_2") {
      const titleText = plainText(block.heading_2.rich_text);
      current = {
        id: "session-" + (sessions.length + 1),
        title: titleText,
        cases: [],
        pendingItems: [],
        extraBlocks: [],
      };
      sessions.push(current);
    } else if (block.type === "child_page") {
      if (!current) {
        current = { id: "session-1", title: "Cases", cases: [], pendingItems: [], extraBlocks: [] };
        sessions.push(current);
      }
      const [meta, blocks] = await Promise.all([
        getPageMeta(block.id),
        getBlockChildren(block.id),
      ]);
      current.cases.push({
        id: "case-" + block.id.replace(/-/g, ""),
        title: meta.title,
        icon: meta.icon,
        blocks,
      });
    } else if (block.type === "numbered_list_item") {
      if (current) current.pendingItems.push(block);
    } else if (current) {
      current.extraBlocks.push(block);
    }
  }

  return sessions;
}

export default function Home({ title, sessions, error }) {
  const router = useRouter();
  const [openSessions, setOpenSessions] = useState(() => new Set(sessions.map((s) => s.id)));

  useEffect(() => {
    const interval = setInterval(() => {
      router.replace(router.asPath, undefined, { scroll: false });
    }, 30000); // auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [router]);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Something went wrong loading Notion</h1>
        <div className="callout bg-red">
          <div className="callout-body">
            <p><strong>Error:</strong> {error}</p>
          </div>
        </div>
        <p>Common causes:</p>
        <ul>
          <li><code>NOTION_TOKEN</code> or <code>NOTION_ROOT_PAGE_ID</code> is missing/wrong in Vercel's Environment Variables</li>
          <li>The Notion page wasn't shared with your integration (Notion page → ... → Connections → Add connections)</li>
        </ul>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <h1 className="top-title">{title}</h1>

      <div className="page-wrap">
        <div className="sidebar">
          <h4>Sessions</h4>
          {sessions.map((s) => {
            const { label, date } = splitSessionTitle(s.title);
            return (
              <details
                key={s.id}
                className="sidebar-session"
                open={openSessions.has(s.id)}
                onToggle={(e) => {
                  const isOpen = e.target.open;
                  setOpenSessions((prev) => {
                    const next = new Set(prev);
                    if (isOpen) next.add(s.id);
                    else next.delete(s.id);
                    return next;
                  });
                }}
              >
                <summary className="sidebar-session-link">
                  {label}
                  {date && <span className="date">{date}</span>}
                </summary>
                <div className="sidebar-case-list">
                  {s.cases.map((c) => (
                    <a key={c.id} href={`#${c.id}`} className="sidebar-case-link">
                      {c.title}
                    </a>
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        <div className="main-content">
          <div className="toc">
            <strong>Table of Contents</strong>
            {sessions.map((s) => (
              <div key={s.id}>
                <p style={{ margin: "6px 0 2px 0" }}>
                  <strong>{s.title}</strong>
                </p>
                <ol>
                  {s.cases.map((c) => (
                    <li key={c.id}>
                      <a href={`#${c.id}`}>{c.title}</a>
                    </li>
                  ))}
                  {s.pendingItems.map((block) => (
                    <li key={block.id}>
                      <RichText richText={block.numbered_list_item.rich_text} />
                    </li>
                  ))}
                </ol>
                {s.extraBlocks.length > 0 && <Blocks blocks={s.extraBlocks} />}
              </div>
            ))}
          </div>

          {sessions.map((s) => (
            <div key={s.id} id={s.id}>
              <h1 className="session-banner">{s.title.toUpperCase()}</h1>
              {s.cases.map((c, idx) => (
                <div
                  key={c.id}
                  id={c.id}
                  className="case-section"
                  style={idx > 0 ? { pageBreakBefore: "always" } : undefined}
                >
                  <h1>{c.title}</h1>
                  <Blocks blocks={c.blocks} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const rootPageId = process.env.NOTION_ROOT_PAGE_ID;
  if (!rootPageId || !process.env.NOTION_TOKEN) {
    return {
      props: {
        error: "Missing NOTION_TOKEN or NOTION_ROOT_PAGE_ID environment variable.",
      },
    };
  }
  try {
    const meta = await getPageMeta(rootPageId);
    const sessions = await buildSessions(rootPageId);
    return { props: { title: meta.title, sessions } };
  } catch (err) {
    return { props: { error: err.message || "Unknown error" } };
  }
}
