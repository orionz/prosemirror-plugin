
import "prosemirror-view/style/prosemirror.css"
import "prosemirror-menu/style/menu.css"

import { useEffect, useRef } from "react" 
import { useDocument } from "automerge-repo-react-hooks"
import { DocumentId } from "automerge-repo"

import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
import {exampleSetup} from "prosemirror-example-setup"

export function Editor(props: { documentId: DocumentId }) {
  const [doc, changeDoc] = useDocument<Doc>(props.documentId)
  const editorRoot = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks
    })
    const doc = DOMParser.fromSchema(mySchema).parse(editorRoot.current)
    const plugins = exampleSetup({schema: mySchema})
    const state = EditorState.create({ doc, plugins })
    const editor = new EditorView( editorRoot.current, { state })
    return () => editor.destroy()
  }, [props.documentId, editorRoot ])

  return (<div ref={editorRoot}><br /></div>)
}
