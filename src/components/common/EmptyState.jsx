import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon />
      </span>
      <h4>{title}</h4>
      {message ? <p>{message}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
