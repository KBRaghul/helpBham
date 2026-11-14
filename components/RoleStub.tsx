export default function RoleStub({ title, desc, slots }: { title: string; desc: string; slots: string[] }) {
  return (
    <section style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>{title}</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>{desc}</p>
      {slots.map((s) => (
        <div key={s} style={{ border: '1px dashed #aaa', borderRadius: 8, padding: 24, marginBottom: 12, color: '#666', fontSize: 14 }}>
          Coming soon: {s}
        </div>
      ))}
    </section>
  );
}