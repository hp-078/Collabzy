export const staticPages = {
  pricing: {
    eyebrow: 'Platform',
    title: 'Simple pricing for every stage of growth',
    intro: 'This demo pricing page shows how Collabzy would present plans, feature limits, and upgrade paths once the real pricing flow is ready.',
    highlights: [
      { label: 'Starter', title: 'Free to explore', body: 'A lightweight entry tier for creators and brands testing the platform.' },
      { label: 'Growth', title: 'Built for active teams', body: 'More campaigns, more collaboration slots, and better analytics visibility.' },
      { label: 'Enterprise', title: 'Custom support', body: 'Dedicated onboarding, integrations, and account management.' },
    ],
    sections: [
      {
        title: 'What is included in the demo',
        body: 'Plan cards, usage notes, and a clear call to action so the page feels complete even before billing is implemented.',
        points: ['Feature comparison', 'Upgrade prompts', 'Support contact path'],
      },
    ],
    primaryCta: { label: 'Create account', to: '/register' },
    secondaryCta: { label: 'Find influencers', to: '/influencers' },
  },
  about: {
    eyebrow: 'Company',
    title: 'About Collabzy',
    intro: 'This static About page gives the footer a real destination and describes the collaboration-first product story at a glance.',
    highlights: [
      { label: 'Mission', title: 'Make partnerships easier', body: 'Help brands and influencers discover each other without noisy workflows.' },
      { label: 'Vision', title: 'Build trust into every collaboration', body: 'Keep discovery, messaging, and delivery in one clear experience.' },
      { label: 'Values', title: 'Transparent and creator-friendly', body: 'Keep the platform simple, honest, and easy to use.' },
    ],
    sections: [
      {
        title: 'Why this page exists',
        body: 'It is a demo-only destination for the footer and can later be replaced with real company copy, team bios, and milestones.',
        points: ['Brand story', 'Product direction', 'Company timeline'],
      },
    ],
    primaryCta: { label: 'Explore platform', to: '/influencers' },
    secondaryCta: { label: 'Join now', to: '/register' },
  },
  blog: {
    eyebrow: 'Company',
    title: 'Collabzy Blog',
    intro: 'A placeholder blog hub for announcements, creator tips, and campaign stories. For now it is a polished static landing page.',
    highlights: [
      { label: 'Update', title: 'Product news', body: 'Release notes, feature drops, and platform improvements.' },
      { label: 'Guide', title: 'Creator playbooks', body: 'Simple ideas for better outreach and stronger profiles.' },
      { label: 'Story', title: 'Brand spotlights', body: 'Examples of campaigns and partnerships that worked well.' },
    ],
    sections: [
      {
        title: 'Future content buckets',
        body: 'This route can later power a real blog index, article pages, and editorial search.',
        points: ['Announcements', 'Guides', 'Case studies'],
      },
    ],
    primaryCta: { label: 'Contact us', to: '/contact' },
    secondaryCta: { label: 'Help center', to: '/help-center' },
  },
  careers: {
    eyebrow: 'Company',
    title: 'Careers at Collabzy',
    intro: 'A static careers page for now, with enough structure to look intentional until real job openings are added.',
    highlights: [
      { label: 'Team', title: 'Small and focused', body: 'Build with people who care about creators, brands, and product quality.' },
      { label: 'Culture', title: 'Ship with clarity', body: 'Keep the workflow lightweight and easy to understand.' },
      { label: 'Growth', title: 'Room to expand', body: 'Use this page later for open roles and hiring priorities.' },
    ],
    sections: [
      {
        title: 'What candidates would learn here',
        body: 'A real version could include team values, hiring process, benefits, and open positions.',
        points: ['Open roles', 'Benefits', 'Hiring process'],
      },
    ],
    primaryCta: { label: 'Read about us', to: '/about' },
    secondaryCta: { label: 'Get in touch', to: '/contact' },
  },
  pressKit: {
    eyebrow: 'Company',
    title: 'Press kit',
    intro: 'This press kit page keeps the footer link alive and suggests where logos, brand assets, and media notes could live.',
    highlights: [
      { label: 'Assets', title: 'Logo downloads', body: 'Space for wordmarks, icons, and approved brand artwork.' },
      { label: 'Media', title: 'Fact sheet', body: 'Quick notes about what Collabzy does and who it serves.' },
      { label: 'Contact', title: 'Press inquiries', body: 'A direct path for media or partnership questions.' },
    ],
    sections: [
      {
        title: 'Ready for a real media hub',
        body: 'The static version is enough for demo navigation, and the structure can later support downloadable assets.',
        points: ['Brand guidelines', 'Press releases', 'Media contact'],
      },
    ],
    primaryCta: { label: 'View contact page', to: '/contact' },
    secondaryCta: { label: 'About Collabzy', to: '/about' },
  },
  helpCenter: {
    eyebrow: 'Support',
    title: 'Help center',
    intro: 'A simple support landing page for account help, onboarding tips, and common questions.',
    highlights: [
      { label: 'FAQ', title: 'Quick answers', body: 'Use this space for common product and account questions.' },
      { label: 'Guides', title: 'How-to content', body: 'Walkthroughs for onboarding, messaging, and campaigns.' },
      { label: 'Support', title: 'Contact options', body: 'Escalate to the support or contact pages when needed.' },
    ],
    sections: [
      {
        title: 'Good demo content for support flows',
        body: 'This page can later host search, articles, and ticketing links without changing the footer structure.',
        points: ['FAQs', 'Setup guides', 'Account help'],
      },
    ],
    primaryCta: { label: 'Contact support', to: '/contact' },
    secondaryCta: { label: 'Terms of service', to: '/terms' },
  },
  terms: {
    eyebrow: 'Support',
    title: 'Terms of service',
    intro: 'A static terms page for now. It gives the footer a legal destination and can later be replaced with the full policy copy.',
    highlights: [
      { label: 'Usage', title: 'Platform rules', body: 'Outline acceptable use, account responsibilities, and limitations.' },
      { label: 'Billing', title: 'Commercial terms', body: 'Add payment and refund rules when pricing is finalized.' },
      { label: 'Safety', title: 'Trust and moderation', body: 'Reserve space for moderation and content guidelines.' },
    ],
    sections: [
      {
        title: 'Demo placeholder only',
        body: 'This is intentionally short, static content so the route feels real without pretending to be legal advice.',
        points: ['Acceptable use', 'Account rules', 'Content policy'],
      },
    ],
    primaryCta: { label: 'Privacy policy', to: '/privacy' },
    secondaryCta: { label: 'Contact us', to: '/contact' },
  },
  privacy: {
    eyebrow: 'Support',
    title: 'Privacy policy',
    intro: 'A demo privacy page to cover the footer link until the final policy text is written and reviewed.',
    highlights: [
      { label: 'Data', title: 'What is collected', body: 'Account, profile, and usage details would normally be described here.' },
      { label: 'Control', title: 'How data is used', body: 'Reserve space for transparency on support, analytics, and messaging.' },
      { label: 'Rights', title: 'User choices', body: 'Explain access, deletion, and communication preferences.' },
    ],
    sections: [
      {
        title: 'Policy outline',
        body: 'This page is a placeholder, but it already gives the application a sensible route structure for a real privacy policy.',
        points: ['Data usage', 'Retention', 'Contact details'],
      },
    ],
    primaryCta: { label: 'Terms of service', to: '/terms' },
    secondaryCta: { label: 'Help center', to: '/help-center' },
  },
  contact: {
    eyebrow: 'Support',
    title: 'Contact Collabzy',
    intro: 'A static contact page with realistic contact details and a clear route for footer navigation.',
    highlights: [
      { label: 'Email', title: 'hello@collabzy.com', body: 'Use this address for product, partnership, or general inquiries.' },
      { label: 'Phone', title: '+1 (555) 123-4567', body: 'A demo support number for the static footer page.' },
      { label: 'Location', title: 'San Francisco, CA', body: 'Placeholder office location for the demo experience.' },
    ],
    sections: [
      {
        title: 'Best use for this page',
        body: 'It can later become a proper contact form, support inbox, or company directory.',
        points: ['General inquiries', 'Press inquiries', 'Partnership requests'],
      },
    ],
    primaryCta: { label: 'Back to home', to: '/' },
    secondaryCta: { label: 'Explore creators', to: '/influencers' },
  },
};