export default function StampBadge({ status, children }) {
  const classe =
    status === 'atrasado' ? 'stamp stamp-overdue' :
    status === 'proximo' ? 'stamp stamp-warn' :
    'stamp stamp-ok';

  return <span className={classe}>{children}</span>;
}
