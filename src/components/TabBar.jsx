import { Home, Bone, Droplet, PawPrint, Pill, Scale, NotebookPen } from 'lucide-react';

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: Home, color: 'var(--primary)' },
  { id: 'alimentacao', label: 'Comida', icon: Bone, color: 'var(--comida)' },
  { id: 'agua', label: 'Água', icon: Droplet, color: 'var(--agua)' },
  { id: 'necessidades', label: 'Xixi/Cocô', icon: PawPrint, color: 'var(--necessidades)' },
  { id: 'medicacao', label: 'Remédios', icon: Pill, color: 'var(--remedios)' },
  { id: 'peso', label: 'Peso', icon: Scale, color: 'var(--peso)' },
  { id: 'comportamento', label: 'Notas', icon: NotebookPen, color: 'var(--notas)' },
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
          <span className="icon-wrap">
            <Icon size={15} strokeWidth={2.2} color={ativa === id ? '#fff' : 'currentColor'} />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
