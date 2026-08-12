import { getBlockChildren, getPageMeta } from "../../lib/notion";
import Blocks from "../../components/Blocks";
import Head from "next/head";
import Link from "next/link";

export default function CasePage({ title, icon, blocks, notFound }) {
  if (notFound) {
    return (
      <main className="page">
        <p>Case not found. It may have been moved or deleted in Notion.</p>
        <Link href="/">← Back to all cases</Link>
      </main>
    );
  }
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main className="page">
        <Link href="/" className="back-link">
          ← Back to all cases
        </Link>
        {icon && <div className="page-icon">{icon}</div>}
        <Blocks blocks={blocks} />
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  // Re-insert dashes into the raw 32-char ID so the Notion SDK accepts it
  const raw = params.id.replace(/-/g, "");
  const pageId = [
    raw.slice(0, 8),
    raw.slice(8, 12),
    raw.slice(12, 16),
    raw.slice(16, 20),
    raw.slice(20),
  ].join("-");

  try {
    const [meta, blocks] = await Promise.all([
      getPageMeta(pageId),
      getBlockChildren(pageId),
    ]);
    return { props: { title: meta.title, icon: meta.icon, blocks } };
  } catch (err) {
    return { props: { notFound: true, title: "Not found", icon: null, blocks: [] } };
  }
}
