import { useEffect, useRef } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Eraser, Italic, Underline } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  minHeight?: number
}

export function RichTextEditor({ value, onChange, minHeight = 96 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.innerHTML !== value && document.activeElement !== editor) editor.innerHTML = value
  }, [value])

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar" role="toolbar" aria-label="Textformatering">
        <button type="button" onClick={() => run('bold')} title="Fet"><Bold size={15} /></button>
        <button type="button" onClick={() => run('italic')} title="Kursiv"><Italic size={15} /></button>
        <button type="button" onClick={() => run('underline')} title="Understruken"><Underline size={15} /></button>
        <span className="toolbar-rule" />
        <button type="button" onClick={() => run('justifyLeft')} title="Vänster"><AlignLeft size={15} /></button>
        <button type="button" onClick={() => run('justifyCenter')} title="Centrera"><AlignCenter size={15} /></button>
        <button type="button" onClick={() => run('justifyRight')} title="Höger"><AlignRight size={15} /></button>
        <span className="toolbar-rule" />
        <select defaultValue="3" onChange={(event) => run('fontSize', event.target.value)} aria-label="Textstorlek">
          <option value="2">Liten</option>
          <option value="3">Normal</option>
          <option value="5">Stor</option>
          <option value="7">Extra stor</option>
        </select>
        <button type="button" onClick={() => run('removeFormat')} title="Rensa formatering"><Eraser size={15} /></button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor-surface"
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  )
}
