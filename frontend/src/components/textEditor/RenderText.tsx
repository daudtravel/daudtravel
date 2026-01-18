import { stateToHTML } from "draft-js-export-html";
import { convertFromRaw, DraftEntityType } from "draft-js";

const renderDescription = (rawContent: string | null) => {
  if (!rawContent) return null;

  try {
    const contentState = convertFromRaw(JSON.parse(rawContent));

    // Define custom style map for colors - matching exactly what's in the editor
    const customStyleMap = {
      RED_TEXT: { style: { color: "red" } },
      BLUE_TEXT: { style: { color: "blue" } },
      GREEN_TEXT: { style: { color: "green" } },
      PURPLE_TEXT: { style: { color: "purple" } },
      ORANGE_TEXT: { style: { color: "orange" } },
      YELLOW_TEXT: { style: { color: "gold" } },
      TEAL_TEXT: { style: { color: "teal" } },
      BLACK_TEXT: { style: { color: "black" } },
    };

    const htmlContent = stateToHTML(contentState, {
      inlineStyles: customStyleMap,
      blockStyleFn: (block) => {
        if (block.getType() === "ordered-list-item") {
          return {
            attributes: {
              class: "list-decimal list-inside",
            },
          };
        }
        if (block.getType() === "unordered-list-item") {
          return {
            attributes: {
              class: "list-disc list-inside",
            },
          };
        }
      },
      entityStyleFn: (entity) => {
        const entityType = entity.getType() as DraftEntityType;
        if (entityType === "LINK") {
          const data = entity.getData();
          return {
            element: "a",
            attributes: {
              href: data.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-blue-600 underline",
            },
          };
        }
      },
    });

    return (
      <p
        className="text-gray-600 mb-6 md:mb-8 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  } catch (error) {
    console.error("Error rendering description:", error);
    return null;
  }
};

export default renderDescription;
