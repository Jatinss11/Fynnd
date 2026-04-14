import { CVData } from './cvTypes';

interface Props { cv: CVData; }

export default function CVPreview({ cv }: Props) {
  const { template, personal, experience, education, skills, certifications, languages } = cv;

  if (template === 'modern') return <ModernTemplate cv={cv} />;
  if (template === 'classic') return <ClassicTemplate cv={cv} />;
  if (template === 'bold') return <BoldTemplate cv={cv} />;
  return <MinimalTemplate cv={cv} />;
}

// ─── MODERN TEMPLATE ────────────────────────────────────────────────────────
function ModernTemplate({ cv }: Props) {
  const { personal, experience, education, skills, certifications, languages } = cv;
  return (
    <div className="bg-white text-gray-900 font-sans" style={{ minHeight: '297mm', padding: '12mm 14mm', fontSize: '10pt', lineHeight: '1.5' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #4f46e5', paddingBottom: '8px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '22pt', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>{personal.name || 'Your Name'}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', fontSize: '9pt', color: '#6b7280' }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.phone && <span>📞 {personal.phone}</span>}
          {personal.city && <span>📍 {personal.city}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.github && <span>💻 {personal.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {personal.summary && (
        <Section title="Professional Summary" accent="#4f46e5">
          <p style={{ color: '#374151', margin: 0 }}>{personal.summary}</p>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills" accent="#4f46e5">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skills.map((s, i) => (
              <span key={i} style={{ background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: '20px', fontSize: '9pt', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <Section title="Work Experience" accent="#4f46e5">
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '11pt', margin: 0, color: '#1e1b4b' }}>{e.role}</p>
                  <p style={{ color: '#4f46e5', fontWeight: 600, margin: 0, fontSize: '9.5pt' }}>{e.company}</p>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '9pt', margin: 0, whiteSpace: 'nowrap' }}>{e.startDate} – {e.current ? 'Present' : e.endDate}</p>
              </div>
              {e.description && <p style={{ color: '#4b5563', marginTop: '4px', whiteSpace: 'pre-line', fontSize: '9.5pt' }}>{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Section title="Education" accent="#4f46e5">
          {education.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{e.degree}</p>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '9.5pt' }}>{e.institution}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '9pt' }}>{e.year}</p>
                {e.grade && <p style={{ color: '#4f46e5', margin: 0, fontSize: '9pt', fontWeight: 600 }}>{e.grade}</p>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Certifications & Languages */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {certifications.length > 0 && (
          <Section title="Certifications" accent="#4f46e5">
            {certifications.map((c, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt' }}>• {c}</p>)}
          </Section>
        )}
        {languages.length > 0 && (
          <Section title="Languages" accent="#4f46e5">
            {languages.map((l, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt' }}>• {l}</p>)}
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── CLASSIC TEMPLATE ───────────────────────────────────────────────────────
function ClassicTemplate({ cv }: Props) {
  const { personal, experience, education, skills, certifications, languages } = cv;
  return (
    <div className="bg-white text-gray-900 font-serif" style={{ minHeight: '297mm', padding: '14mm', fontSize: '10pt', lineHeight: '1.6' }}>
      <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '2px solid #1e293b', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '24pt', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>{personal.name || 'Your Name'}</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '9pt' }}>
          {[personal.email, personal.phone, personal.city, personal.linkedin].filter(Boolean).join('  |  ')}
        </p>
      </div>

      {personal.summary && <><ClassicSection title="Objective" /><p style={{ color: '#374151', marginBottom: '12px' }}>{personal.summary}</p></>}

      {experience.length > 0 && (
        <><ClassicSection title="Professional Experience" />
        {experience.map((e, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{e.role}</strong>
              <span style={{ color: '#64748b', fontSize: '9pt' }}>{e.startDate} – {e.current ? 'Present' : e.endDate}</span>
            </div>
            <p style={{ color: '#475569', margin: '2px 0', fontStyle: 'italic' }}>{e.company}</p>
            {e.description && <p style={{ color: '#4b5563', whiteSpace: 'pre-line', fontSize: '9.5pt' }}>{e.description}</p>}
          </div>
        ))}</>
      )}

      {education.length > 0 && (
        <><ClassicSection title="Education" />
        {education.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div><strong>{e.degree}</strong><br /><span style={{ color: '#64748b', fontSize: '9.5pt' }}>{e.institution}</span></div>
            <div style={{ textAlign: 'right' }}><span style={{ color: '#64748b', fontSize: '9pt' }}>{e.year}</span>{e.grade && <><br /><span style={{ fontSize: '9pt' }}>{e.grade}</span></>}</div>
          </div>
        ))}</>
      )}

      {skills.length > 0 && <><ClassicSection title="Skills" /><p style={{ marginBottom: '12px' }}>{skills.join(' • ')}</p></>}
      {certifications.length > 0 && <><ClassicSection title="Certifications" /><p>{certifications.join(' • ')}</p></>}
      {languages.length > 0 && <><ClassicSection title="Languages" /><p>{languages.join(' • ')}</p></>}
    </div>
  );
}

// ─── BOLD TEMPLATE ──────────────────────────────────────────────────────────
function BoldTemplate({ cv }: Props) {
  const { personal, experience, education, skills, certifications, languages } = cv;
  return (
    <div className="bg-white text-gray-900 font-sans" style={{ minHeight: '297mm', fontSize: '10pt', lineHeight: '1.5' }}>
      {/* Dark header */}
      <div style={{ background: '#0f172a', color: 'white', padding: '20px 20px 16px' }}>
        <h1 style={{ fontSize: '26pt', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{personal.name || 'Your Name'}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '8px', fontSize: '9pt', color: '#94a3b8' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.city && <span>{personal.city}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
        </div>
        {personal.summary && <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '9.5pt', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>{personal.summary}</p>}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {skills.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <BoldSection title="Core Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: '4px', fontSize: '9pt', fontWeight: 600 }}>{s}</span>)}
            </div>
          </div>
        )}

        {experience.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <BoldSection title="Experience" />
            {experience.map((e, i) => (
              <div key={i} style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '3px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: 700, fontSize: '11pt', margin: 0 }}>{e.role}</p>
                  <p style={{ color: '#64748b', fontSize: '9pt', margin: 0 }}>{e.startDate} – {e.current ? 'Present' : e.endDate}</p>
                </div>
                <p style={{ color: '#10b981', fontWeight: 600, margin: '2px 0', fontSize: '9.5pt' }}>{e.company}</p>
                {e.description && <p style={{ color: '#4b5563', whiteSpace: 'pre-line', fontSize: '9.5pt', marginTop: '4px' }}>{e.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <BoldSection title="Education" />
            {education.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div><p style={{ fontWeight: 700, margin: 0 }}>{e.degree}</p><p style={{ color: '#64748b', margin: 0, fontSize: '9.5pt' }}>{e.institution}</p></div>
                <div style={{ textAlign: 'right' }}><p style={{ color: '#64748b', margin: 0, fontSize: '9pt' }}>{e.year}</p>{e.grade && <p style={{ color: '#10b981', margin: 0, fontSize: '9pt', fontWeight: 600 }}>{e.grade}</p>}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {certifications.length > 0 && <div><BoldSection title="Certifications" />{certifications.map((c, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt' }}>• {c}</p>)}</div>}
          {languages.length > 0 && <div><BoldSection title="Languages" />{languages.map((l, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt' }}>• {l}</p>)}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── MINIMAL TEMPLATE ───────────────────────────────────────────────────────
function MinimalTemplate({ cv }: Props) {
  const { personal, experience, education, skills, certifications, languages } = cv;
  return (
    <div className="bg-white text-gray-900 font-sans" style={{ minHeight: '297mm', padding: '16mm 18mm', fontSize: '10pt', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '28pt', fontWeight: 300, letterSpacing: '-1px', margin: 0, color: '#111827' }}>{personal.name || 'Your Name'}</h1>
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '9pt', color: '#9ca3af', marginBottom: '20px' }}>
        {[personal.email, personal.phone, personal.city, personal.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
      </div>

      {personal.summary && <><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>About</p><p style={{ color: '#374151', marginBottom: '16px', borderLeft: '2px solid #fed7aa', paddingLeft: '10px' }}>{personal.summary}</p></>}

      {skills.length > 0 && (
        <><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Skills</p>
        <p style={{ marginBottom: '16px', color: '#374151' }}>{skills.join('  ·  ')}</p></>
      )}

      {experience.length > 0 && (
        <><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Experience</p>
        {experience.map((e, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{e.role} <span style={{ color: '#9ca3af', fontWeight: 400 }}>@ {e.company}</span></p>
              <p style={{ color: '#9ca3af', fontSize: '9pt', margin: 0 }}>{e.startDate} – {e.current ? 'Present' : e.endDate}</p>
            </div>
            {e.description && <p style={{ color: '#6b7280', whiteSpace: 'pre-line', fontSize: '9.5pt', marginTop: '3px' }}>{e.description}</p>}
          </div>
        ))}</>
      )}

      {education.length > 0 && (
        <><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', marginTop: '4px' }}>Education</p>
        {education.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ margin: 0 }}><strong>{e.degree}</strong> · {e.institution}</p>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '9pt' }}>{e.year}{e.grade ? ` · ${e.grade}` : ''}</p>
          </div>
        ))}</>
      )}

      {(certifications.length > 0 || languages.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
          {certifications.length > 0 && <div><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Certifications</p>{certifications.map((c, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt', color: '#374151' }}>{c}</p>)}</div>}
          {languages.length > 0 && <div><p style={{ color: '#f97316', fontWeight: 600, fontSize: '8pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Languages</p>{languages.map((l, i) => <p key={i} style={{ margin: '2px 0', fontSize: '9.5pt', color: '#374151' }}>{l}</p>)}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <p style={{ fontWeight: 700, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1px', color: accent, margin: 0 }}>{title}</p>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>
      {children}
    </div>
  );
}

function ClassicSection({ title }: { title: string }) {
  return <p style={{ fontWeight: 700, fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #1e293b', paddingBottom: '3px', marginBottom: '8px', marginTop: '12px' }}>{title}</p>;
}

function BoldSection({ title }: { title: string }) {
  return <p style={{ fontWeight: 800, fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a', marginBottom: '6px', marginTop: '0' }}>{title}</p>;
}
