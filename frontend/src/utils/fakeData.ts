export const generateFakeFormData = () => {
  const names = [
    'Alexandra Chen',
    'Marcus Rodriguez',
    'Zara Okafor',
    'Kai Nakamura',
    'Sophia Petrov',
    'Jordan Kim',
    'Aria Patel',
    'Diego Santos',
  ];

  const personalities = [
    'Friendly and enthusiastic with a curious nature. Loves to help solve problems and explain complex topics in simple terms.',
    'Professional and analytical with a dry sense of humor. Direct communicator who values efficiency and clarity.',
    'Warm and empathetic with a creative mindset. Enjoys brainstorming and thinking outside the box.',
    'Calm and methodical with a patient teaching style. Takes time to ensure understanding before moving forward.',
    'Energetic and optimistic with a collaborative spirit. Encourages experimentation and learning from mistakes.',
    'Thoughtful and detail-oriented with a philosophical approach. Asks probing questions to deepen understanding.',
  ];

  const backgrounds = [
    'Expert in software development, data science, and digital marketing. Has experience working with startups.',
    'Background in UX design, product management, and user research. Previously worked at major tech companies.',
    'Specialized in cybersecurity, cloud infrastructure, and DevOps practices. Former consultant for enterprise clients.',
    'Expert in machine learning, artificial intelligence, and statistical analysis. PhD in Computer Science.',
    'Experience in financial technology, blockchain development, and cryptocurrency markets.',
    'Background in educational technology, curriculum design, and online learning platforms.',
  ];

  const voiceModels = ['elevenlabs', 'openai', 'azure', 'google'] as const;
  const categories = ['realistic', 'stylized', 'cartoon', 'fantasy'] as const;
  const descriptions = [
    'Professional businesswoman with expertise in technology',
    'Creative artist with a passion for innovation',
    'Tech entrepreneur focused on solving complex problems',
    'Fitness instructor promoting healthy lifestyles',
    'Anime character with vibrant personality',
    'Fantasy warrior with magical abilities',
  ];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    category: categories[Math.floor(Math.random() * categories.length)] as
      | 'realistic'
      | 'stylized'
      | 'cartoon'
      | 'fantasy',
    personality:
      personalities[Math.floor(Math.random() * personalities.length)],
    backgroundKnowledge:
      backgrounds[Math.floor(Math.random() * backgrounds.length)],
    voiceModel: voiceModels[Math.floor(Math.random() * voiceModels.length)] as
      | 'elevenlabs'
      | 'openai'
      | 'azure'
      | 'google',
  };
};

export const DIALOG_SEEDS = [
  "Hey there! This is pretty cool right? Let's have a conversation about the future of AI.",
  "What's up everyone! Today we're going to talk about something really fascinating.",
  "Greetings! I hope you're having an amazing day. Let me share something interesting with you.",
  'Hello friends! Welcome back to another episode where we explore the unknown.',
  "Hey, what's happening? I've got something mind-blowing to share with you today.",
  "Good morning, afternoon, or evening wherever you are! Let's dive into something epic.",
  'Yo! Ready for another adventure? This is going to be absolutely incredible.',
  "Well hello there! I'm super excited to talk to you about this topic today.",
  'Hey everyone! Thanks for joining me. This conversation is going to be legendary.',
  "What's good? I've been thinking about this all day and I can't wait to share it.",
  "Alright, alright, alright! Let's get into something that'll blow your mind.",
  "Hey there, beautiful souls! Today's topic is something really close to my heart.",
];
