import { useState } from 'react';
import './Avatar.css';

/**
 * Reusable Avatar component with error handling
 * Falls back to placeholder if image fails to load
 */
const Avatar = ({
  src,
  alt = 'Avatar',
  name = 'U',
  size = 'md',
  className = '',
  onError = null,
}) => {
  const [hasError, setHasError] = useState(!src);

  const handleImageError = (e) => {
    console.warn(`⚠️ Avatar image failed to load: ${src}`);
    setHasError(true);
    if (onError) onError(e);
  };

  const handleImageLoad = () => {
    console.log(`✅ Avatar image loaded: ${src}`);
    setHasError(false);
  };

  const initials = name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          className="avatar-img"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      ) : (
        <div className="avatar-placeholder">
          {initials}
        </div>
      )}
    </div>
  );
};

export default Avatar;
