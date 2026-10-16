type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const BULLET = /^[–—•-]\s*/;

/**
 * El caso de estudio se carga en el panel como texto plano. Se lee asi:
 * una linea corta sin punto final es un titulo ("El desafío"), las que
 * arrancan con guion son una lista y el resto son parrafos.
 */
function parse(content: string): Block[] {
  const blocks: Block[] = [];

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET.test(line)) {
      const item = line.replace(BULLET, "");
      const last = blocks.at(-1);
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
    } else if (line.length <= 40 && !/[.:;,]$/.test(line)) {
      blocks.push({ type: "heading", text: line });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  return blocks;
}

/** "Portal público: buscador..." -> el rotulo antes de los dos puntos en blanco. */
function ListItem({ text }: { text: string }) {
  const colon = text.indexOf(": ");
  if (colon > 0 && colon <= 40) {
    return (
      <>
        <span className="text-foreground">{text.slice(0, colon)}:</span> {text.slice(colon + 2)}
      </>
    );
  }
  return <>{text}</>;
}

export function CaseStudy({ content }: { content: string }) {
  return (
    <div className="text-body text-paragraph">
      {parse(content).map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="text-statement mb-5 mt-14 font-medium text-foreground first:mt-0">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="mb-6 grid max-w-[62ch] gap-3">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-orange" />
                  <span>
                    <ListItem text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mb-6 max-w-[62ch]">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
