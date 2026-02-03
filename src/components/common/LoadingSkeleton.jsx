import './LoadingSkeleton.css';

export const InfluencerCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text skeleton-text-short"></div>
        <div className="skeleton-stats">
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
        </div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="skeleton-message">
      <div className="skeleton-avatar skeleton-avatar-small"></div>
      <div className="skeleton-message-content">
        <div className="skeleton-text"></div>
        <div className="skeleton-text skeleton-text-short"></div>
      </div>
    </div>
  );
};

export const DealCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-stats">
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-avatar skeleton-avatar-large"></div>
      <div className="skeleton-profile-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text skeleton-text-short"></div>
      </div>
    </div>
  );
};
