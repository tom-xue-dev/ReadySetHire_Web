import { useState } from "react";

type UploadState = {
  file: File | null;
  jd: string;
  extractedText: string; // for .txt preview
  notes: string[];
};

export default function ResumeAssessment() {
  const [state, setState] = useState<UploadState>({ file: null, jd: "", extractedText: "", notes: [] });
  const [prepared, setPrepared] = useState<string>("");

  function pushNote(msg: string) {
    setState((s) => ({ ...s, notes: [...s.notes, msg] }));
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setState((s) => ({ ...s, file: null, extractedText: "" }));
      return;
    }
    setState((s) => ({ ...s, file, extractedText: "", notes: [] }));

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      const text = await file.text();
      setState((s) => ({ ...s, extractedText: text }));
      pushNote(`Loaded TXT with ${text.length} characters.`);
    } else if (ext === "pdf") {
      pushNote("PDF selected. Parsing will be handled by backend.");
    } else {
      pushNote("Unsupported file type. Please upload .pdf or .txt");
    }
  }

  function onPrepare() {
    if (!state.file) {
      alert("Please upload a PDF or TXT resume file first.");
      return;
    }
    if (!state.jd.trim()) {
      alert("Please paste the Job Description (JD).");
      return;
    }

    // This is a front-end only stub to show what we'll send
    // Backend can accept FormData: { file, jd }
    // For TXT we also preview the extracted text
    const payloadPreview = {
      jd: state.jd,
      fileName: state.file.name,
      fileType: state.file.type || state.file.name.split(".").pop(),
      sizeBytes: state.file.size,
      extractedTextPreview: state.extractedText ? state.extractedText.slice(0, 4000) : undefined,
    };
    setPrepared(JSON.stringify(payloadPreview, null, 2));
  }

  function onReset() {
    setState({ file: null, jd: "", extractedText: "", notes: [] });
    setPrepared("");
  }

  const label: React.CSSProperties = { fontSize: 13, color: "#374151", marginBottom: 6 };
  const input: React.CSSProperties = { padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 };
  const btnPrimary: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, border: "1px solid #2563eb", background: "#2563eb", color: "#fff" };
  const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" };

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Resume Assessment</h2>

      <div style={{ display: "grid", gap: 16, maxWidth: 920 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={label}>Resume file (.pdf or .txt) *</label>
          <input type="file" accept=".pdf,.txt" onChange={onFileChange} />
          {state.file && (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Selected: {state.file.name} ({Math.round(state.file.size / 1024)} KB)
            </div>
          )}
          {state.extractedText && (
            <div>
              <div style={{ fontSize: 13, color: "#374151", margin: "8px 0" }}>Extracted text preview (TXT):</div>
              <textarea readOnly value={state.extractedText} style={{ ...input, minHeight: 160 }} />
            </div>
          )}
          {state.notes.length > 0 && (
            <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280" }}>
              {state.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={label}>Job Description (JD) *</label>
          <textarea
            placeholder="Paste the JD here..."
            value={state.jd}
            onChange={(e) => setState((s) => ({ ...s, jd: e.target.value }))}
            style={{ ...input, minHeight: 160 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPrepare} style={btnPrimary}>Prepare Payload</button>
          <button onClick={onReset} style={btn}>Reset</button>
        </div>

        {prepared && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Prepared request (preview)</div>
            <pre style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, overflow: "auto" }}>
{prepared}
            </pre>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Backend can accept FormData with fields: <code>file</code> (binary) and <code>jd</code> (string). For TXT, you may also pass <code>extractedText</code> if you prefer client-side parsing.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

