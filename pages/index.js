import { getBlockChildren, getPageMeta } from "../lib/notion";
import Blocks from "../components/Blocks";
import Head from "next/head";

export default function Home({ title, icon, blocks, error }) {
  if (error) {
    return (
      <main className="page">
        <h1>Something went wrong loading Notion</h1>
        <div className="callout bg-red">
          <div className="callout-icon">⚠️</div>
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
      <main className="page">
        {icon && <div className="page-icon">{icon}</div>}
        <Blocks blocks={blocks} />
      </main>
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
