export function RichText({ richText }) {
  if (!richText || richText.length === 0) return null;
  return richText.map((rt, i) => {
    let el = rt.plain_text;
    const a = rt.annotations || {};
    let node = el;
    if (rt.href) {
      node = (
        <a href={rt.href} target="_blank" rel="noreferrer">
          {node}
        </a>
      );
    }
    if (a.code) node = <code key={"c" + i}>{node}</code>;
    if (a.bold) node = <strong key={"b" + i}>{node}</strong>;
    if (a.italic) node = <em key={"i" + i}>{node}</em>;
    if (a.strikethrough) node = <s key={"s" + i}>{node}</s>;
    if (a.underline) node = <u key={"u" + i}>{node}</u>;
    if (a.color && a.color !== "default") {
      const isBg = a.color.endsWith("_background");
      const cls = isBg ? "bg-" + a.color.replace("_background", "") : "fg-" + a.color;
      node = <span className={cls}>{node}</span>;
    }
    return <span key={i}>{node}</span>;
  });
}

function Callout({ block }) {
  const icon =
    block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "💡";
  const color = block.callout.color || "gray_background";
  return (
    <div className={"callout bg-" + color.replace("_background", "")}>
      <div className="callout-icon">{icon}</div>
      <div className="callout-body">
        <RichText richText={block.callout.rich_text} />
        {block._children && <Blocks blocks={block._children} />}
      </div>
    </div>
  );
}

function Toggle({ block }) {
  return (
    <details className="toggle">
      <summary>
        <RichText richText={block.toggle.rich_text} />
      </summary>
      <div className="toggle-body">
        {block._children && <Blocks blocks={block._children} />}
      </div>
    </details>
  );
}

function TableBlock({ block }) {
  const rows = block._children || [];
  const hasHeader = block.table.has_column_header;
  const width = block.table.table_width;
  const cls = "notion-table" + (width === 3 ? " cols-3" : width === 4 ? " cols-4" : "");
  return (
    <table className={cls}>
      <tbody>
        {rows.map((row, ri) => {
          const Tag = hasHeader && ri === 0 ? "th" : "td";
          return (
            <tr key={row.id}>
              {row.table_row.cells.map((cell, ci) => (
                <Tag key={ci}>
                  <RichText richText={cell} />
                </Tag>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ListGroup({ items, ordered }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((block) => (
        <li key={block.id}>
          <RichText
            richText={
              ordered
                ? block.numbered_list_item.rich_text
                : block.bulleted_list_item.rich_text
            }
          />
          {block._children && <Blocks blocks={block._children} />}
        </li>
      ))}
    </Tag>
  );
}

export default function Blocks({ blocks }) {
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const ordered = block.type === "numbered_list_item";
      const group = [];
      while (i < blocks.length && blocks[i].type === block.type) {
        group.push(blocks[i]);
        i++;
      }
      out.push(<ListGroup key={block.id} items={group} ordered={ordered} />);
      continue;
    }

    switch (block.type) {
      case "paragraph": {
        const text = block.paragraph.rich_text.map((t) => t.plain_text).join("");
        const isDisposition = text.trim().startsWith("Disposition:");
        out.push(
          <p key={block.id} className={isDisposition ? "disposition" : undefined}>
            <RichText richText={block.paragraph.rich_text} />
          </p>
        );
        break;
      }
      case "heading_1":
        out.push(
          <h1 key={block.id}>
            <RichText richText={block.heading_1.rich_text} />
          </h1>
        );
        break;
      case "heading_2":
        out.push(
          <h2 key={block.id}>
            <RichText richText={block.heading_2.rich_text} />
          </h2>
        );
        break;
      case "heading_3":
        out.push(
          <h3 key={block.id}>
            <RichText richText={block.heading_3.rich_text} />
          </h3>
        );
        break;
      case "callout":
        out.push(<Callout key={block.id} block={block} />);
        break;
      case "toggle":
        out.push(<Toggle key={block.id} block={block} />);
        break;
      case "table":
        out.push(<TableBlock key={block.id} block={block} />);
        break;
      case "divider":
        out.push(<hr key={block.id} />);
        break;
      case "quote":
        out.push(
          <blockquote key={block.id}>
            <RichText richText={block.quote.rich_text} />
          </blockquote>
        );
        break;
      case "to_do":
        out.push(
          <div key={block.id} className="todo">
            <input type="checkbox" checked={block.to_do.checked} readOnly />
            <RichText richText={block.to_do.rich_text} />
          </div>
        );
        break;
      default:
        break;
    }
    i++;
  }
  return <>{out}</>;
}
