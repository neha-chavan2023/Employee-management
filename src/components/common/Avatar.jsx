import { useEffect, useState } from 'react';
import { avatarColor, getInitials } from '../../utils/helpers';

export default function Avatar({ name = 'User', src = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = src && !failed;

  return (
    <span
      className={`avatar avatar--${size} ${className}`.trim()}
      style={showImage ? undefined : { backgroundColor: avatarColor(name), color: '#ffffff' }}
      title={name}
    >
      {showImage ? (
        <img src={src} alt={name} onError={() => setFailed(true)} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
