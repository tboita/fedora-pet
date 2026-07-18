import { Home, Bone, Droplet, PawPrint, Pill, Scale, NotebookPen } from 'lucide-react';

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: Home, color: 'var(--pine)' },
  { id: 'alimentacao', label: 'Comida', icon: Bone, color: 'var(--tab-alimentacao)' },
  { id: 'agua', label: 'Água', icon: Droplet, color: 'var(--tab-agua)' },
  { id: 'necessidades', label: 'Xixi/Cocô', icon: PawPrint, color: 'var(--tab-necessidades)' },
  { id: 'medicacao', label: 'Remédios', icon: Pill, color: 'var(--tab-medicacao)' },
  { id: 'peso', label: 'Peso', icon: Scale, color: 'var(--tab-peso)' },
  { id: 'comportamento', label: 'Notas', icon: NotebookPen, color: 'var(--tab-comportamento)' },
];

export default function TabBar({ ativa, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map(({ id, label, icon: Icon, color }) => (
        <button
          key={id}
          className={`tab-btn ${ativa === id ? 'active' : ''}`}
          style={{ '--tab-color': color }}
          onClick={() => onChange(id)}
          aria-current={ativa === id ? 'page' : undefined}
        >
          <Icon size={18} strokeWidth={ativa === id ? 2.4 : 1.8} />
          <span>{label}</span>
          <span className="dot" />
        </button>
      ))}
    </nav>
  );
}
