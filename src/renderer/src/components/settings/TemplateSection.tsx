interface TemplateSectionProps {
  // Templates are managed separately from Settings object
}

export function TemplateSection(props: TemplateSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Templates</h2>
        <p className="text-slate-400">Template management - Will be implemented in Plan 06</p>
      </div>
      <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-500">Coming soon: Template library, create/edit/duplicate templates, visual template builder</p>
      </div>
    </div>
  )
}
