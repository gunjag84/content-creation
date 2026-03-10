export function TestRender() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-100">Rendering Test</h1>
      <p className="text-slate-400 mb-8">
        HTML to PNG rendering will be implemented in Plan 01-03
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">What This Will Do</h2>
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            This page will allow you to test the HTML-to-PNG rendering pipeline that powers
            the content creation system.
          </p>
          <p>Features that will be added:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
            <li>Upload or paste HTML/CSS template code</li>
            <li>Preview the rendered output</li>
            <li>Export as PNG at Instagram dimensions (1080x1350 or 1080x1920)</li>
            <li>Test different overlay opacities and text zones</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
