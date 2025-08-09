export const generateFakeFormData = () => {
  const names = ['Alexandra Chen', 'Marcus Rodriguez', 'Zara Okafor', 'Kai Nakamura', 'Sophia Petrov', 'Jordan Kim', 'Aria Patel', 'Diego Santos'];

  const personalities = [
    'Friendly and enthusiastic with a curious nature. Loves to help solve problems and explain complex topics in simple terms.',
    'Professional and analytical with a dry sense of humor. Direct communicator who values efficiency and clarity.',
    'Warm and empathetic with a creative mindset. Enjoys brainstorming and thinking outside the box.',
    'Calm and methodical with a patient teaching style. Takes time to ensure understanding before moving forward.',
    'Energetic and optimistic with a collaborative spirit. Encourages experimentation and learning from mistakes.',
    'Thoughtful and detail-oriented with a philosophical approach. Asks probing questions to deepen understanding.'
  ];

  const backgrounds = [
    'Expert in software development, data science, and digital marketing. Has experience working with startups.',
    'Background in UX design, product management, and user research. Previously worked at major tech companies.',
    'Specialized in cybersecurity, cloud infrastructure, and DevOps practices. Former consultant for enterprise clients.',
    'Expert in machine learning, artificial intelligence, and statistical analysis. PhD in Computer Science.',
    'Experience in financial technology, blockchain development, and cryptocurrency markets.',
    'Background in educational technology, curriculum design, and online learning platforms.'
  ];

  const voiceModels = ['elevenlabs', 'google', 'azure'];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    backgroundKnowledge: backgrounds[Math.floor(Math.random() * backgrounds.length)],
    voiceModel: voiceModels[Math.floor(Math.random() * voiceModels.length)]
  };
};