import { FileQuestion, Inbox, Search } from 'lucide-react';
import './EmptyState.css';

export const EmptyMessages = () => (
  <div className="empty-state">
    <Inbox size={64} className="empty-icon" />
    <h3>No messages yet</h3>
    <p>Start a conversation with influencers or brands</p>
  </div>
);

export const EmptyCollaborations = () => (
  <div className="empty-state">
    <FileQuestion size={64} className="empty-icon" />
    <h3>No active collaborations</h3>
    <p>Browse influencers and create your first campaign</p>
  </div>
);

export const EmptySearchResults = () => (
  <div className="empty-state">
    <Search size={64} className="empty-icon" />
    <h3>No results found</h3>
    <p>Try adjusting your search filters</p>
  </div>
);
