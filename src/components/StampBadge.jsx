export default function StampBadge({ status, children }) {
  const classe =
    status === 'atrasado' ? 'badge badge-overdue' :
    status === 'proximo' ? 'badge badge-warn' :
    'badge badge-ok';

  return <span className={classe}>{children}</span>;
}
