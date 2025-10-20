type SeedType =
  | 'name'
  | 'personality'
  | 'background'
  | 'dialog'
  | 'image_avatar_prompt'
  | 'video_avatar_prompt';

export const getRandomSeed = (seedType: SeedType): string => {
  const seedArrays: Record<SeedType, string[]> = {
    name: [
      'Alexandra Chen',
      'Marcus Rodriguez',
      'Zara Okafor',
      'Kai Nakamura',
      'Sophia Petrov',
      'Jordan Kim',
      'Aria Patel',
      'Diego Santos',
    ],
    personality: [
      'Friendly and enthusiastic with a curious nature. Loves to help solve problems and explain complex topics in simple terms.',
      'Professional and analytical with a dry sense of humor. Direct communicator who values efficiency and clarity.',
      'Warm and empathetic with a creative mindset. Enjoys brainstorming and thinking outside the box.',
      'Calm and methodical with a patient teaching style. Takes time to ensure understanding before moving forward.',
      'Energetic and optimistic with a collaborative spirit. Encourages experimentation and learning from mistakes.',
      'Thoughtful and detail-oriented with a philosophical approach. Asks probing questions to deepen understanding.',
    ],
    background: [
      'Expert in software development, data science, and digital marketing. Has experience working with startups.',
      'Background in UX design, product management, and user research. Previously worked at major tech companies.',
      'Specialized in cybersecurity, cloud infrastructure, and DevOps practices. Former consultant for enterprise clients.',
      'Expert in machine learning, artificial intelligence, and statistical analysis. PhD in Computer Science.',
      'Experience in financial technology, blockchain development, and cryptocurrency markets.',
      'Background in educational technology, curriculum design, and online learning platforms.',
    ],
    dialog: [
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
    ],
    image_avatar_prompt: [
      'a professional headshot of a software developer',
      'a creative artist painting in a studio',
      'a tech entrepreneur giving a presentation',
      'a fitness instructor leading a workout class',
      'an anime character with vibrant colors',
      'a fantasy warrior in a mystical forest',
    ],
    video_avatar_prompt: [
      'An ultra-realistic video of the avatar speaking the provided dialog, with natural facial expressions and lip-syncing, set against a simple background.',
      'A dynamic video of a fantasy warrior in action, showcasing fluid movements and detailed armor in a mystical forest setting.',
      'A lively video of a fitness instructor leading a workout, capturing energetic motions and an engaging atmosphere in a modern gym.',
    ],
  };

  const selectedArray = seedArrays[seedType];

  if (!selectedArray) {
    throw new Error(
      `Invalid seed type: ${seedType}. Available types: ${Object.keys(seedArrays).join(', ')}`,
    );
  }

  return selectedArray[Math.floor(Math.random() * selectedArray.length)];
};
