
import { useDocument } from "automerge-repo-react-hooks"
import { DocumentId } from "automerge-repo"
import { Editor } from "./Editor"

interface Doc {
  count: number
}

export default function App(props: { documentId: DocumentId }) {
  const [doc, changeDoc] = useDocument<Doc>(props.documentId)

  if (!doc) {
    return null
  }

  return (
    <div>
      <button
        onClick={() => {
          changeDoc((d: any) => {
            d.count = (d.count || 0) + 1
          })
        }}
      >
        count is: {doc?.count ?? 0}
      </button>
      <Editor documentId={props.documentId} />
    </div>
  )
}
