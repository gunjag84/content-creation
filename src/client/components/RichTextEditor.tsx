import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { FONT_OPTIONS } from '@shared/fontOptions'
import type { FontLibraryEntry } from '@shared/types'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onFocus?: () => void
  placeholder?: string
  fontLibrary?: FontLibraryEntry[]
  // Zone base font size — shown as fallback when selection has no inline override
  zoneFontSize?: number
  // Bump this to force TipTap to reload content (e.g. after stripping inline marks).
  // Does NOT fire on normal typing — prevents any content-sync loop.
  contentVersion?: number
}

const BTN = 'px-1.5 py-0.5 text-xs rounded transition-colors'
const BTN_ACTIVE = 'bg-blue-600 text-white'
const BTN_INACTIVE = 'text-gray-700 hover:bg-gray-100'

export function RichTextEditor({
  content,
  onChange,
  onFocus,
  placeholder,
  fontLibrary,
  zoneFontSize,
  contentVersion,
}: RichTextEditorProps) {
  const customFonts = fontLibrary?.length
    ? fontLibrary.map(f => ({ label: f.name, value: f.name }))
    : []
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Saved selection range — captured on mousedown of selects so we can restore after blur
  const savedSelection = useRef<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, FontFamily, FontSize],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onFocus: () => onFocus?.(),
    editorProps: {
      attributes: { class: 'outline-none min-h-[60px] w-full' },
    },
  })

  // Explicit content reset — only fires when contentVersion changes (e.g. font-family strip).
  // Does NOT depend on `content` directly, so normal typing never triggers it.
  useEffect(() => {
    if (!editor || contentVersion === undefined || contentVersion === 0) return
    editor.commands.setContent(content, false) // false = don't emit onUpdate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, contentVersion])

  // Reactive editor state — re-runs on every transaction
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      hasSelection: !e.state.selection.empty,
      isFocused: e.isFocused,
      color: (e.getAttributes('textStyle').color as string) || '',
      fontFamily: (e.getAttributes('textStyle').fontFamily as string) || '',
      fontSize: (e.getAttributes('textStyle').fontSize as string) || '',
    }),
  })

  // Compute floating toolbar position from browser selection rect
  useEffect(() => {
    if (!state?.hasSelection || !state?.isFocused) { setToolbarPos(null); return }
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { setToolbarPos(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) { setToolbarPos(null); return }
    setToolbarPos({
      top: rect.top + window.scrollY - 52,
      left: rect.left + window.scrollX + rect.width / 2,
    })
  }, [state?.hasSelection, state?.isFocused])

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return
    function handleDocMouseDown(e: MouseEvent) {
      if (!colorPickerRef.current?.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [showColorPicker])

  if (!editor || !state) return null

  // Font size displayed: inline selection override if present, otherwise zone base
  const selFontSizeNum = state.fontSize ? parseInt(state.fontSize) : undefined
  const displaySize = selFontSizeNum ?? zoneFontSize ?? 56

  function saveSelection() {
    if (!editor) return
    savedSelection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
  }

  function restoreAndRun(fn: () => void) {
    if (!editor) return
    const sel = savedSelection.current
    if (sel && sel.from !== sel.to) {
      editor.chain().setTextSelection(sel).focus().command(() => { fn(); return true }).run()
    } else {
      editor.chain().focus().command(() => { fn(); return true }).run()
    }
    savedSelection.current = null
  }

  return (
    <div>
      {/* Floating selection toolbar — appears above selected text */}
      {toolbarPos && state.hasSelection && state.isFocused && (
        <div
          ref={toolbarRef}
          style={{
            position: 'fixed',
            top: toolbarPos.top,
            left: toolbarPos.left,
            transform: 'translateX(-50%)',
            zIndex: 200,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 flex items-center gap-1 flex-wrap max-w-sm"
          onMouseDown={e => e.preventDefault()} // prevents toolbar clicks from stealing editor focus
        >
          {/* Bold */}
          <button
            type="button"
            aria-label="Bold"
            onMouseDown={() => editor.chain().focus().toggleBold().run()}
            className={`${BTN} font-bold ${state.isBold ? BTN_ACTIVE : BTN_INACTIVE}`}
          >B</button>

          {/* Italic */}
          <button
            type="button"
            aria-label="Italic"
            onMouseDown={() => editor.chain().focus().toggleItalic().run()}
            className={`${BTN} italic ${state.isItalic ? BTN_ACTIVE : BTN_INACTIVE}`}
          >I</button>

          <div className="w-px h-4 bg-gray-200" />

          {/* Font size — per selection, stored as inline mark (not zone-level) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Decrease font size"
              onMouseDown={() => editor.chain().focus().setFontSize(`${Math.max(8, displaySize - 2)}px`).run()}
              className={`${BTN} ${BTN_INACTIVE} leading-none`}
            >−</button>
            <input
              type="number"
              aria-label="Font size"
              min={8}
              max={200}
              value={displaySize}
              className="w-10 h-5 text-center text-xs border border-gray-200 rounded"
              onMouseDown={e => e.stopPropagation()}
              onChange={e => {
                const val = parseInt(e.target.value)
                if (val >= 8) editor.chain().focus().setFontSize(`${val}px`).run()
              }}
            />
            <button
              type="button"
              aria-label="Increase font size"
              onMouseDown={() => editor.chain().focus().setFontSize(`${Math.min(200, displaySize + 2)}px`).run()}
              className={`${BTN} ${BTN_INACTIVE} leading-none`}
            >+</button>
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Font family — per selection. Select steals focus/selection, so we save+restore. */}
          <select
            aria-label="Selection font family"
            value={state.fontFamily}
            className="text-xs border border-gray-200 rounded px-1 py-0.5 max-w-[100px]"
            onMouseDown={e => { e.stopPropagation(); saveSelection() }}
            onChange={e => {
              const val = e.target.value
              restoreAndRun(() => {
                if (val) {
                  editor.chain().setFontFamily(val).run()
                } else {
                  editor.chain().unsetFontFamily().run()
                }
              })
            }}
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
            {customFonts.length > 0 && (
              <optgroup label="Custom Fonts">
                {customFonts.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </optgroup>
            )}
          </select>

          <div className="w-px h-4 bg-gray-200" />

          {/* Color — per selection */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              aria-label="Selection text color"
              onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v) }}
              className="w-5 h-5 rounded border border-gray-200"
              style={{ backgroundColor: state.color || '#000000' }}
            />
            {showColorPicker && (
              <div
                className="absolute z-50 bottom-7 left-0 bg-white border border-gray-200 rounded-lg shadow-md p-2"
                onMouseDown={e => e.preventDefault()}
              >
                <HexColorPicker
                  color={state.color || '#000000'}
                  onChange={c => editor.chain().focus().setColor(c).run()}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor area */}
      <div
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm relative cursor-text"
        onClick={() => editor.commands.focus()}
      >
        {!editor.getText() && placeholder && (
          <div className="pointer-events-none text-gray-400 text-sm absolute top-2 left-3">{placeholder}</div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
