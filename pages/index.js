import { getBlockChildren, getPageMeta } from "../lib/notion";
import Blocks from "../components/Blocks";
import Head from "next/head";

export default function Home({ title, icon, blocks }) {
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
  try {
    const [meta, blocks] = await Promise.all([
      getPageMeta(rootPageId),
      getBlockChildren(rootPageId),
    ]);
    return { props: { title: meta.title, icon: meta.icon, blocks } };
  } catch (err) {
    return {
      props: { title: "Error", icon: null, blocks: [] },
    };
  }
}
