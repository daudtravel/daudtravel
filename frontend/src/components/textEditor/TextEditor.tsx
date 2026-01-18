import React, { useState } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  CompositeDecorator,
  ContentState,
  DraftEntityType,
  ContentBlock,
} from "draft-js";
import "draft-js/dist/Draft.css";

const findLinkEntities = (
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState
) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
};

const Link = (props: {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();

  return (
    <a
      href={url.startsWith("http") ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      {props.children}
    </a>
  );
};

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const decorator = new CompositeDecorator([
    {
      strategy: findLinkEntities,
      component: Link,
    },
  ]);

  const [editorState, setEditorState] = useState(
    value
      ? EditorState.createWithContent(
          convertFromRaw(JSON.parse(value)),
          decorator
        )
      : EditorState.createEmpty(decorator)
  );

  // Define custom style map for colors
  const styleMap = {
    RED_TEXT: { color: "red" },
    BLUE_TEXT: { color: "blue" },
    GREEN_TEXT: { color: "green" },
    PURPLE_TEXT: { color: "purple" },
    ORANGE_TEXT: { color: "orange" },
    YELLOW_TEXT: { color: "gold" },
    TEAL_TEXT: { color: "teal" },
    BLACK_TEXT: { color: "black" },
  };

  const handleEditorChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const contentState = newEditorState.getCurrentContent();
    onChange(JSON.stringify(convertToRaw(contentState)));
  };

  const toggleInlineStyle = (style: string) => {
    handleEditorChange(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType: string) => {
    handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
  };

  const addLink = () => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const url = window.prompt("Enter the URL")?.trim();

    if (url) {
      // Ensure URL has a protocol
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

      const contentStateWithEntity = contentState.createEntity(
        "LINK" as DraftEntityType,
        "MUTABLE",
        { url: formattedUrl }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.push(
        editorState,
        contentStateWithEntity,
        "apply-entity"
      );

      handleEditorChange(
        RichUtils.toggleLink(newEditorState, selection, entityKey)
      );
    }
  };

  return (
    <div className="border rounded p-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {/* Formatting options */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => toggleInlineStyle("BOLD")}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("ITALIC")}
            className="bg-green-500 text-white px-2 py-1 rounded text-sm"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => toggleBlockType("ordered-list-item")}
            className="bg-purple-500 text-white px-2 py-1 rounded text-sm"
          >
            OL
          </button>
          <button
            type="button"
            onClick={() => toggleBlockType("unordered-list-item")}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
          >
            UL
          </button>
          <button
            type="button"
            onClick={addLink}
            className="bg-indigo-500 text-white px-2 py-1 rounded text-sm"
          >
            Link
          </button>
        </div>

        {/* Color buttons */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => toggleInlineStyle("RED_TEXT")}
            className="bg-white text-red-500 border border-red-500 px-2 py-1 rounded text-sm"
            style={{ color: "red" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("BLUE_TEXT")}
            className="bg-white border border-blue-500 px-2 py-1 rounded text-sm"
            style={{ color: "blue" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("GREEN_TEXT")}
            className="bg-white border border-green-500 px-2 py-1 rounded text-sm"
            style={{ color: "green" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("PURPLE_TEXT")}
            className="bg-white border border-purple-500 px-2 py-1 rounded text-sm"
            style={{ color: "purple" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("ORANGE_TEXT")}
            className="bg-white border border-orange-500 px-2 py-1 rounded text-sm"
            style={{ color: "orange" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("YELLOW_TEXT")}
            className="bg-white border border-yellow-500 px-2 py-1 rounded text-sm"
            style={{ color: "gold" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("TEAL_TEXT")}
            className="bg-white border border-teal-500 px-2 py-1 rounded text-sm"
            style={{ color: "teal" }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleInlineStyle("BLACK_TEXT")}
            className="bg-white border border-black px-2 py-1 rounded text-sm"
            style={{ color: "black" }}
          >
            A
          </button>
        </div>
      </div>
      <Editor
        editorState={editorState}
        onChange={handleEditorChange}
        placeholder={placeholder}
        readOnly={disabled}
        customStyleMap={styleMap}
      />
    </div>
  );
};

export default RichTextEditor;
