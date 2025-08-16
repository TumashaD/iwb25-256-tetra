import { memo, useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs"; 
import {getEditorJsTools} from './tools';
import { useParams } from "next/navigation";

const Editor = ({ data, onChange, editorblock }) => {
  const editorRef = useRef(null);
  const params = useParams();
  const competitionId = params.id;

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new EditorJS({
        holder: editorblock,
        tools: getEditorJsTools(competitionId),
        data: data,
        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
      });
    }

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return <div id={editorblock} />;
};

export default memo(Editor);