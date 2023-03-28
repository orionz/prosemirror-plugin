
import "prosemirror-view/style/prosemirror.css"
import "prosemirror-menu/style/menu.css"

import { useEffect, useRef } from "react"
import { useHandle } from "automerge-repo-react-hooks"
import { DocumentId } from "automerge-repo"
import { unstable as Automerge, Text } from "@automerge/automerge"

import {EditorState, Plugin, PluginKey} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
import {exampleSetup} from "prosemirror-example-setup"

let LOCAL_LOCK = false;

function automergePlugin(handle, path) {
  let key = new PluginKey('automerge');
  return new Plugin({
    key,
    state: {
      init: (_config,_state) => { },
      apply: (tr, value, oldState, newState) => {
          if (!LOCAL_LOCK) {
            for (let step of tr.steps) {
              console.log(`:: Step`, step);
              let start = step.from - 1; // prosemirror-to-automerge position
              if (step.slice.content.content.len > 1) {
                console.log("many contents? why?")
              }
              let step_text = step.slice.content.content.map((c) => c.text).join("")
              let del = step.to - step.from
              handle.updateDoc((doc) =>
                Automerge.change(doc, (d) => {
                  try {
                    Automerge.splice(d, "text", start, del, step_text)
                    console.log(`:: Automerge.splice(d, "text", ${step.from}, ${del}, ${step_text})`)
                  } catch (e) {
                    d.text = new Text(`Resetting text: ${e}`)
                  }
                })
              )
            }
          }
      },
    }
  })
}

export function Editor(props: { documentId: DocumentId }) {
  const handle = useHandle<Doc>(props.documentId)
  const editorRoot = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks
    })
    const doc = DOMParser.fromSchema(mySchema).parse(editorRoot.current)
    const plugins = [ ... exampleSetup({schema: mySchema}), automergePlugin(handle,"/text") ];
    const state = EditorState.create({ doc, plugins })
    const editor = new EditorView( editorRoot.current, { state })
    const patchHandler = ({ patches, info }) => {
      let transaction = patches.reduce((tr, patch) => {
        if (patch.context !== "sync") return tr;
        if (patch.path[0] !== "text") return tr;
        let start = patch.path[1] + 1; // automerge-to-prosemirror position
        switch (patch.action) {
          case "insert":
            let text = patch.values.join("");
            console.log("insertText", text, start, start)
            return tr.insertText(text, start, start)
          case "del":
            console.log("deleteText", "", start, start + patch.length)
            return tr.insertText("", start, start + patch.length)
        }
        return tr
      }, editor.state.tr)
      LOCAL_LOCK = true;
      editor.dispatch(transaction)
      LOCAL_LOCK = false;
    }
    handle.on("patch", patchHandler)
    return () => {
      editor.destroy()
      handle.off("patch", patchHandler)
    }
  }, [props.documentId, editorRoot ])

  let text = handle.doc.text || ""

  return (<div ref={editorRoot}><p>{text}</p></div>)
}
