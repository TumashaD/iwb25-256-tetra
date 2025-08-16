import CheckList from '@editorjs/checklist'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import InlineCode from '@editorjs/inline-code'
import LinkTool from '@editorjs/link'
import List from '@editorjs/list'
import Marker from '@editorjs/marker'
import Quote from '@editorjs/quote'
import Raw from '@editorjs/raw'
import SimpleImage from '@editorjs/simple-image'
import Table from '@editorjs/table'
import Warning from '@editorjs/warning'
import Paragraph from '@editorjs/paragraph'
import Header from '@editorjs/header'
import ImageTool from '@editorjs/image'
import { OrganizerService } from '@/services/organizerService'

export function getEditorJsTools(competitionId) {
  return {
    paragraph: Paragraph,
    embed: Embed,
    table: Table,
    header: Header,
    list: List,
  warning: Warning,
  code: Code,
  linkTool: LinkTool,
  image: {
    class: ImageTool,
    config:{
      uploader: {
        async uploadByFile(file){
          const url = await OrganizerService.uploadFile(competitionId, file);
          return {
            success: 1,
            file: {
              url: url
            }
          };
        }
      }
    }
  },
  raw: Raw,
  quote: Quote,
  marker: Marker,
  checklist: CheckList,
  delimiter: Delimiter,
  inlineCode: InlineCode,
  simpleImage: SimpleImage,
};
}
