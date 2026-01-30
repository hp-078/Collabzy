import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Sample influencers data
const sampleInfluencers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    niche: 'Fashion & Lifestyle',
    description: 'Fashion enthusiast sharing daily style inspiration and lifestyle tips. Passionate about sustainable fashion and helping brands connect with conscious consumers.',
    followers: '125K',
    platform: 'Instagram',
    location: 'New York, USA',
    verified: true,
    rating: 4.9,
    services: [
      { id: 's1', name: 'Instagram Post', price: 500, description: 'Single feed post with product mention' },
      { id: 's2', name: 'Story Package', price: 300, description: '3-5 stories with swipe up link' },
      { id: 's3', name: 'Reel Creation', price: 800, description: 'Engaging 30-60 second reel' },
    ],
    pastCollabs: ['Nike', 'Zara', 'H&M', 'Sephora'],
    joinedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    niche: 'Tech & Gadgets',
    description: 'Tech reviewer and gadget enthusiast. I help brands showcase their products through honest, detailed reviews that my audience trusts.',
    followers: '250K',
    platform: 'YouTube',
    location: 'San Francisco, USA',
    verified: true,
    rating: 4.8,
    services: [
      { id: 's1', name: 'YouTube Review', price: 1500, description: 'Full product review video (8-12 mins)' },
      { id: 's2', name: 'Unboxing Video', price: 800, description: 'First impressions unboxing' },
      { id: 's3', name: 'Comparison Video', price: 2000, description: 'Side by side product comparison' },
    ],
    pastCollabs: ['Samsung', 'Apple', 'Sony', 'OnePlus'],
    joinedDate: '2023-08-20',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    niche: 'Fitness & Health',
    description: 'Certified fitness trainer sharing workout routines, nutrition tips, and healthy lifestyle content. Partner with wellness and fitness brands.',
    followers: '180K',
    platform: 'Instagram',
    location: 'Los Angeles, USA',
    verified: true,
    rating: 4.7,
    services: [
      { id: 's1', name: 'Workout Feature', price: 600, description: 'Product featured in workout video' },
      { id: 's2', name: 'Challenge Campaign', price: 1200, description: '7-day fitness challenge featuring brand' },
      { id: 's3', name: 'Nutrition Post', price: 450, description: 'Recipe or supplement review' },
    ],
    pastCollabs: ['Nike', 'Gymshark', 'MyProtein', 'Fitbit'],
    joinedDate: '2024-02-10',
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    niche: 'Food & Cooking',
    description: 'Home chef and food blogger. I create delicious recipe content and help food brands reach passionate home cooks.',
    followers: '95K',
    platform: 'TikTok',
    location: 'Chicago, USA',
    verified: false,
    rating: 4.6,
    services: [
      { id: 's1', name: 'Recipe Video', price: 400, description: 'Recipe using brand product' },
      { id: 's2', name: 'Product Review', price: 350, description: 'Honest product taste test' },
      { id: 's3', name: 'Cook-along Live', price: 700, description: 'Live cooking session featuring brand' },
    ],
    pastCollabs: ['Blue Apron', 'HelloFresh', 'KitchenAid'],
    joinedDate: '2024-03-05',
  },
  {
    id: '5',
    name: 'Lisa Martinez',
    email: 'lisa@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    niche: 'Beauty & Skincare',
    description: 'Beauty expert and skincare enthusiast. I help beauty brands connect with an engaged audience through authentic reviews and tutorials.',
    followers: '320K',
    platform: 'Instagram',
    location: 'Miami, USA',
    verified: true,
    rating: 4.9,
    services: [
      { id: 's1', name: 'GRWM Video', price: 700, description: 'Get ready with me featuring products' },
      { id: 's2', name: 'Tutorial Post', price: 550, description: 'Step-by-step makeup tutorial' },
      { id: 's3', name: 'Brand Takeover', price: 1500, description: 'Full day story takeover' },
    ],
    pastCollabs: ['Fenty Beauty', 'Charlotte Tilbury', 'The Ordinary', 'Glossier'],
    joinedDate: '2023-11-12',
  },
  {
    id: '6',
    name: 'Alex Thompson',
    email: 'alex@example.com',
    role: 'influencer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    niche: 'Travel & Adventure',
    description: 'Adventure traveler and photographer. I showcase destinations and travel gear to inspire wanderlust in my community.',
    followers: '200K',
    platform: 'YouTube',
    location: 'Denver, USA',
    verified: true,
    rating: 4.8,
    services: [
      { id: 's1', name: 'Destination Feature', price: 2500, description: 'Full travel vlog featuring location' },
      { id: 's2', name: 'Gear Review', price: 1000, description: 'Travel gear review and showcase' },
      { id: 's3', name: 'Photo Package', price: 800, description: '10 professional photos for brand use' },
    ],
    pastCollabs: ['GoPro', 'Airbnb', 'Lonely Planet', 'REI'],
    joinedDate: '2023-09-28',
  },
];

// Sample brands data
const sampleBrands = [
  {
    id: 'b1',
    name: 'TechVibe Electronics',
    email: 'brand@techvibe.com',
    role: 'brand',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    industry: 'Technology',
    description: 'Innovative consumer electronics company focused on creating smart home products that simplify everyday life.',
    website: 'https://techvibe.com',
    location: 'San Jose, USA',
    verified: true,
    activeRequests: 3,
    completedCollabs: 12,
    joinedDate: '2023-06-15',
  },
  {
    id: 'b2',
    name: 'GreenLife Organics',
    email: 'brand@greenlife.com',
    role: 'brand',
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    industry: 'Food & Beverage',
    description: 'Organic food company committed to sustainable farming and healthy eating. Looking to partner with health-conscious influencers.',
    website: 'https://greenlife.com',
    location: 'Portland, USA',
    verified: true,
    activeRequests: 5,
    completedCollabs: 28,
    joinedDate: '2023-04-20',
  },
  {
    id: 'b3',
    name: 'StyleHouse Fashion',
    email: 'brand@stylehouse.com',
    role: 'brand',
    avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
    industry: 'Fashion',
    description: 'Contemporary fashion brand offering trendy, affordable clothing for young professionals.',
    website: 'https://stylehouse.com',
    location: 'New York, USA',
    verified: true,
    activeRequests: 8,
    completedCollabs: 45,
    joinedDate: '2023-02-10',
  },
];

// Sample collaboration requests
const sampleCollaborations = [
  {
    id: 'c1',
    brandId: 'b1',
    brandName: 'TechVibe Electronics',
    influencerId: '2',
    influencerName: 'Mike Chen',
    service: 'YouTube Review',
    status: 'pending',
    budget: 1500,
    message: 'We would love for you to review our new smart home hub. It features voice control, app integration, and works with all major smart devices.',
    createdAt: '2025-01-25',
    deadline: '2025-02-15',
  },
  {
    id: 'c2',
    brandId: 'b2',
    brandName: 'GreenLife Organics',
    influencerId: '3',
    influencerName: 'Emma Wilson',
    service: 'Nutrition Post',
    status: 'active',
    budget: 450,
    message: 'Looking for a post featuring our new protein powder line. Perfect for your fitness audience!',
    createdAt: '2025-01-20',
    deadline: '2025-02-01',
  },
  {
    id: 'c3',
    brandId: 'b3',
    brandName: 'StyleHouse Fashion',
    influencerId: '1',
    influencerName: 'Sarah Johnson',
    service: 'Instagram Post',
    status: 'completed',
    budget: 500,
    message: 'Showcase our spring collection with your unique style perspective.',
    createdAt: '2025-01-10',
    deadline: '2025-01-20',
    completedAt: '2025-01-18',
  },
];

// Sample messages
const sampleMessages = [
  {
    id: 'm1',
    collaborationId: 'c1',
    senderId: 'b1',
    senderName: 'TechVibe Electronics',
    receiverId: '2',
    receiverName: 'Mike Chen',
    content: 'Hi Mike! We loved your recent tech reviews. Would you be interested in reviewing our new smart home hub?',
    timestamp: '2025-01-25T10:30:00',
    read: true,
  },
  {
    id: 'm2',
    collaborationId: 'c1',
    senderId: '2',
    senderName: 'Mike Chen',
    receiverId: 'b1',
    receiverName: 'TechVibe Electronics',
    content: 'Thanks for reaching out! I am definitely interested. Can you tell me more about the product features?',
    timestamp: '2025-01-25T11:15:00',
    read: true,
  },
  {
    id: 'm3',
    collaborationId: 'c2',
    senderId: 'b2',
    senderName: 'GreenLife Organics',
    receiverId: '3',
    receiverName: 'Emma Wilson',
    content: 'Hi Emma! Your fitness content is amazing. We think our protein powder would be perfect for your audience.',
    timestamp: '2025-01-20T14:00:00',
    read: true,
  },
];

export const DataProvider = ({ children }) => {
  const [influencers, setInfluencers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage or use sample data
    const storedInfluencers = localStorage.getItem('collabzy_influencers');
    const storedBrands = localStorage.getItem('collabzy_brands');
    const storedCollaborations = localStorage.getItem('collabzy_collaborations');
    const storedMessages = localStorage.getItem('collabzy_messages');

    setInfluencers(storedInfluencers ? JSON.parse(storedInfluencers) : sampleInfluencers);
    setBrands(storedBrands ? JSON.parse(storedBrands) : sampleBrands);
    setCollaborations(storedCollaborations ? JSON.parse(storedCollaborations) : sampleCollaborations);
    setMessages(storedMessages ? JSON.parse(storedMessages) : sampleMessages);
    setLoading(false);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('collabzy_influencers', JSON.stringify(influencers));
      localStorage.setItem('collabzy_brands', JSON.stringify(brands));
      localStorage.setItem('collabzy_collaborations', JSON.stringify(collaborations));
      localStorage.setItem('collabzy_messages', JSON.stringify(messages));
    }
  }, [influencers, brands, collaborations, messages, loading]);

  // Influencer functions
  const addInfluencer = (influencer) => {
    const newInfluencer = {
      ...influencer,
      id: Date.now().toString(),
      joinedDate: new Date().toISOString().split('T')[0],
      rating: 0,
      verified: false,
    };
    setInfluencers([...influencers, newInfluencer]);
    return newInfluencer;
  };

  const updateInfluencer = (id, updates) => {
    setInfluencers(influencers.map(inf => 
      inf.id === id ? { ...inf, ...updates } : inf
    ));
  };

  // Brand functions
  const addBrand = (brand) => {
    const newBrand = {
      ...brand,
      id: Date.now().toString(),
      joinedDate: new Date().toISOString().split('T')[0],
      activeRequests: 0,
      completedCollabs: 0,
      verified: false,
    };
    setBrands([...brands, newBrand]);
    return newBrand;
  };

  const updateBrand = (id, updates) => {
    setBrands(brands.map(brand => 
      brand.id === id ? { ...brand, ...updates } : brand
    ));
  };

  // Collaboration functions
  const createCollaboration = (collab) => {
    const newCollab = {
      ...collab,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCollaborations([...collaborations, newCollab]);
    return newCollab;
  };

  const updateCollaboration = (id, updates) => {
    setCollaborations(collaborations.map(collab => 
      collab.id === id ? { ...collab, ...updates } : collab
    ));
  };

  // Message functions
  const sendMessage = (message) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages([...messages, newMessage]);
    return newMessage;
  };

  const markMessageAsRead = (id) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, read: true } : msg
    ));
  };

  const getMessagesByCollaboration = (collaborationId) => {
    return messages.filter(msg => msg.collaborationId === collaborationId);
  };

  const getMessagesByUser = (userId) => {
    return messages.filter(msg => 
      msg.senderId === userId || msg.receiverId === userId
    );
  };

  const value = {
    influencers,
    brands,
    collaborations,
    messages,
    loading,
    addInfluencer,
    updateInfluencer,
    addBrand,
    updateBrand,
    createCollaboration,
    updateCollaboration,
    sendMessage,
    markMessageAsRead,
    getMessagesByCollaboration,
    getMessagesByUser,
  };

  return (
    <DataContext.Provider value={value}>
      {!loading && children}
    </DataContext.Provider>
  );
};
