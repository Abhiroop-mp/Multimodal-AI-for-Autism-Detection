// Comprehensive Games Dataset for Personalized Autism Therapy
// Based on patient assessment scores across four domains:
// Social Communication, Behavioral Patterns, Sensory Processing, Cognitive Abilities

const gamesDataset = {
    // SOCIAL COMMUNICATION GAMES
    socialCommunication: {
        beginner: {
            toddler: [
                {
                    id: "social-toddler-1",
                    name: "Peek-a-Boo Friends",
                    description: "Interactive peek-a-boo game with animated characters",
                    personalizedDescription: "Let's play peek-a-boo! This helps you learn about faces and emotions.",
                    icon: "fa-eye",
                    difficulty: "Beginner",
                    recommendedTime: "5-10 minutes",
                    targetScore: "< 40%",
                    skills: ["Eye contact", "Joint attention", "Social engagement"],
                    gameType: "interactive",
                    ageGroup: "toddler"
                },
                {
                    id: "social-toddler-2", 
                    name: "Bubble Pop Social",
                    description: "Pop bubbles while making eye contact with animated friends",
                    personalizedDescription: "Fun bubbles! Watch and pop them with your new friends!",
                    icon: "fa-circle",
                    difficulty: "Beginner",
                    recommendedTime: "5-8 minutes",
                    targetScore: "< 40%",
                    skills: ["Eye contact", "Turn-taking", "Social smiles"],
                    gameType: "interactive",
                    ageGroup: "toddler"
                },
                {
                    id: "social-toddler-3",
                    name: "Animal Sound Match",
                    description: "Match animals with their sounds and simple social interactions",
                    personalizedDescription: "Animals make sounds! Can you help them find their friends?",
                    icon: "fa-paw",
                    difficulty: "Beginner",
                    recommendedTime: "8-12 minutes",
                    targetScore: "< 40%",
                    skills: ["Sound recognition", "Social imitation", "Attention"],
                    gameType: "audio-visual",
                    ageGroup: "toddler"
                }
            ],
            child: [
                {
                    id: "social-child-1",
                    name: "Emotion Detective",
                    description: "Identify emotions on cartoon faces and match them to situations",
                    personalizedDescription: "Become an emotion detective! Help characters understand their feelings.",
                    icon: "fa-search",
                    difficulty: "Beginner",
                    recommendedTime: "10-15 minutes",
                    targetScore: "< 40%",
                    skills: ["Emotion recognition", "Face reading", "Social understanding"],
                    gameType: "matching",
                    ageGroup: "child"
                },
                {
                    id: "social-child-2",
                    name: "Conversation Builder",
                    description: "Build simple conversations by choosing appropriate responses",
                    personalizedDescription: "Let's build conversations! Pick the best things to say.",
                    icon: "fa-comments",
                    difficulty: "Beginner",
                    recommendedTime: "12-18 minutes",
                    targetScore: "< 40%",
                    skills: ["Turn-taking", "Appropriate responses", "Conversation skills"],
                    gameType: "interactive",
                    ageGroup: "child"
                },
                {
                    id: "social-child-3",
                    name: "Social Story Adventure",
                    description: "Interactive social stories with choices and outcomes",
                    personalizedDescription: "Go on adventures and make good social choices!",
                    icon: "fa-book-open",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Social scenarios", "Decision making", "Empathy"],
                    gameType: "story",
                    ageGroup: "child"
                }
            ],
            adolescent: [
                {
                    id: "social-teen-1",
                    name: "Social Media Simulator",
                    description: "Practice appropriate online social interactions",
                    personalizedDescription: "Learn to navigate social media safely and appropriately.",
                    icon: "fa-mobile-alt",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Digital communication", "Online safety", "Social cues"],
                    gameType: "simulation",
                    ageGroup: "adolescent"
                },
                {
                    id: "social-teen-2",
                    name: "Group Project Challenge",
                    description: "Collaborate with virtual team members on projects",
                    personalizedDescription: "Work with others to complete fun projects together!",
                    icon: "fa-users",
                    difficulty: "Beginner",
                    recommendedTime: "20-25 minutes",
                    targetScore: "< 40%",
                    skills: ["Teamwork", "Communication", "Collaboration"],
                    gameType: "collaborative",
                    ageGroup: "adolescent"
                }
            ],
            adult: [
                {
                    id: "social-adult-1",
                    name: "Workplace Social Skills",
                    description: "Navigate workplace social situations and professional communication",
                    personalizedDescription: "Master workplace interactions and build professional relationships.",
                    icon: "fa-briefcase",
                    difficulty: "Beginner",
                    recommendedTime: "20-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Professional communication", "Workplace etiquette", "Networking"],
                    gameType: "simulation",
                    ageGroup: "adult"
                },
                {
                    id: "social-adult-2",
                    name: "Community Connection",
                    description: "Practice social skills in community settings",
                    personalizedDescription: "Build confidence in social situations around your community.",
                    icon: "fa-building",
                    difficulty: "Beginner",
                    recommendedTime: "25-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Community interaction", "Social confidence", "Practical communication"],
                    gameType: "simulation",
                    ageGroup: "adult"
                }
            ]
        }
    },

    // BEHAVIORAL PATTERNS GAMES
    behavioralPatterns: {
        beginner: {
            toddler: [
                {
                    id: "behavior-toddler-1",
                    name: "Routine Builder",
                    description: "Build daily routines with visual sequencing",
                    personalizedDescription: "Let's build your daily routine! First we brush teeth, then...",
                    icon: "fa-list-ol",
                    difficulty: "Beginner",
                    recommendedTime: "5-10 minutes",
                    targetScore: "< 40%",
                    skills: ["Routine building", "Sequencing", "Predictability"],
                    gameType: "sequencing",
                    ageGroup: "toddler"
                }
            ],
            child: [
                {
                    id: "behavior-child-1",
                    name: "Schedule Master",
                    description: "Create and follow daily schedules with visual timers",
                    personalizedDescription: "Be the master of your schedule! Plan your day and feel great!",
                    icon: "fa-calendar-check",
                    difficulty: "Beginner",
                    recommendedTime: "10-15 minutes",
                    targetScore: "< 40%",
                    skills: ["Time management", "Planning", "Routine adherence"],
                    gameType: "planning",
                    ageGroup: "child"
                },
                {
                    id: "behavior-child-2",
                    name: "Transition Helper",
                    description: "Practice smooth transitions between activities",
                    personalizedDescription: "Let's practice moving between activities smoothly and calmly!",
                    icon: "fa-exchange-alt",
                    difficulty: "Beginner",
                    recommendedTime: "8-12 minutes",
                    targetScore: "< 40%",
                    skills: ["Transition skills", "Flexibility", "Emotional regulation"],
                    gameType: "simulation",
                    ageGroup: "child"
                }
            ],
            adolescent: [
                {
                    id: "behavior-teen-1",
                    name: "Life Organizer",
                    description: "Organize school assignments and personal responsibilities",
                    personalizedDescription: "Take charge of your life! Organize tasks and achieve your goals.",
                    icon: "fa-tasks",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Executive functioning", "Planning", "Responsibility"],
                    gameType: "organization",
                    ageGroup: "adolescent"
                },
                {
                    id: "behavior-teen-2",
                    name: "Stress Manager",
                    description: "Learn coping strategies for stressful situations",
                    personalizedDescription: "Handle stress like a pro! Learn cool ways to stay calm.",
                    icon: "fa-spa",
                    difficulty: "Beginner",
                    recommendedTime: "12-18 minutes",
                    targetScore: "< 40%",
                    skills: ["Stress management", "Coping strategies", "Emotional regulation"],
                    gameType: "relaxation",
                    ageGroup: "adolescent"
                }
            ],
            adult: [
                {
                    id: "behavior-adult-1",
                    name: "Workplace Routine",
                    description: "Establish effective workplace routines and habits",
                    personalizedDescription: "Build professional habits that lead to workplace success.",
                    icon: "fa-briefcase",
                    difficulty: "Beginner",
                    recommendedTime: "20-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Professional habits", "Workplace organization", "Time management"],
                    gameType: "simulation",
                    ageGroup: "adult"
                },
                {
                    id: "behavior-adult-2",
                    name: "Life Balance",
                    description: "Balance work, social life, and self-care",
                    personalizedDescription: "Create harmony in your life. Balance work, fun, and wellness.",
                    icon: "fa-balance-scale",
                    difficulty: "Beginner",
                    recommendedTime: "25-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Life balance", "Self-care", "Priority management"],
                    gameType: "life-skills",
                    ageGroup: "adult"
                }
            ]
        }
    },

    // SENSORY PROCESSING GAMES
    sensoryProcessing: {
        beginner: {
            toddler: [
                {
                    id: "sensory-toddler-1",
                    name: "Texture Explorer",
                    description: "Explore different textures through touch and play",
                    personalizedDescription: "Let's touch different textures! Soft, rough, bumpy, smooth!",
                    icon: "fa-hand-paper",
                    difficulty: "Beginner",
                    recommendedTime: "5-8 minutes",
                    targetScore: "< 40%",
                    skills: ["Tactile exploration", "Sensory tolerance", "Texture recognition"],
                    gameType: "sensory",
                    ageGroup: "toddler"
                },
                {
                    id: "sensory-toddler-2",
                    name: "Sound Discovery",
                    description: "Identify and categorize different sounds",
                    personalizedDescription: "Listen to amazing sounds! Can you tell what they are?",
                    icon: "fa-volume-up",
                    difficulty: "Beginner",
                    recommendedTime: "6-10 minutes",
                    targetScore: "< 40%",
                    skills: ["Auditory discrimination", "Sound recognition", "Listening skills"],
                    gameType: "audio",
                    ageGroup: "toddler"
                },
                {
                    id: "sensory-toddler-3",
                    name: "Color & Light Play",
                    description: "Interactive color and light stimulation activities",
                    personalizedDescription: "Beautiful colors and lights! Watch them change and play!",
                    icon: "fa-lightbulb",
                    difficulty: "Beginner",
                    recommendedTime: "5-7 minutes",
                    targetScore: "< 40%",
                    skills: ["Visual tracking", "Color recognition", "Visual stimulation"],
                    gameType: "visual",
                    ageGroup: "toddler"
                }
            ],
            child: [
                {
                    id: "sensory-child-1",
                    name: "Sensory Detective",
                    description: "Solve mysteries using different sensory clues",
                    personalizedDescription: "Be a sensory detective! Use your senses to solve puzzles!",
                    icon: "fa-search",
                    difficulty: "Beginner",
                    recommendedTime: "12-18 minutes",
                    targetScore: "< 40%",
                    skills: ["Sensory integration", "Problem solving", "Multi-sensory processing"],
                    gameType: "investigation",
                    ageGroup: "child"
                },
                {
                    id: "sensory-child-2",
                    name: "Calm Corner Creator",
                    description: "Design personal sensory spaces for regulation",
                    personalizedDescription: "Create your perfect calm space! What makes you feel peaceful?",
                    icon: "fa-home",
                    difficulty: "Beginner",
                    recommendedTime: "10-15 minutes",
                    targetScore: "< 40%",
                    skills: ["Self-regulation", "Sensory preferences", "Environmental design"],
                    gameType: "creative",
                    ageGroup: "child"
                },
                {
                    id: "sensory-child-3",
                    name: "Movement Master",
                    description: "Controlled movement and balance activities",
                    personalizedDescription: "Move your body like a master! Balance, stretch, and flow!",
                    icon: "fa-running",
                    difficulty: "Beginner",
                    recommendedTime: "8-12 minutes",
                    targetScore: "< 40%",
                    skills: ["Proprioception", "Balance", "Motor control"],
                    gameType: "movement",
                    ageGroup: "child"
                }
            ],
            adolescent: [
                {
                    id: "sensory-teen-1",
                    name: "Sensory Profile Builder",
                    description: "Create personal sensory profiles and strategies",
                    personalizedDescription: "Discover your unique sensory profile and build coping strategies.",
                    icon: "fa-user-cog",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Self-awareness", "Sensory profiling", "Strategy development"],
                    gameType: "assessment",
                    ageGroup: "adolescent"
                },
                {
                    id: "sensory-teen-2",
                    name: "Environment Modder",
                    description: "Modify environments for optimal sensory comfort",
                    personalizedDescription: "Hack your environment! Make spaces work for your senses.",
                    icon: "fa-tools",
                    difficulty: "Beginner",
                    recommendedTime: "12-18 minutes",
                    targetScore: "< 40%",
                    skills: ["Environmental adaptation", "Sensory design", "Problem solving"],
                    gameType: "simulation",
                    ageGroup: "adolescent"
                },
                {
                    id: "sensory-teen-3",
                    name: "Stress Relief Studio",
                    description: "Create personalized stress relief routines",
                    personalizedDescription: "Build your personal stress relief toolkit with sensory strategies.",
                    icon: "fa-spa",
                    difficulty: "Beginner",
                    recommendedTime: "10-15 minutes",
                    targetScore: "< 40%",
                    skills: ["Stress management", "Sensory regulation", "Self-care"],
                    gameType: "wellness",
                    ageGroup: "adolescent"
                }
            ],
            adult: [
                {
                    id: "sensory-adult-1",
                    name: "Workplace Sensory Solutions",
                    description: "Navigate workplace sensory challenges",
                    personalizedDescription: "Master workplace sensory challenges and create your comfort zone.",
                    icon: "fa-briefcase",
                    difficulty: "Beginner",
                    recommendedTime: "20-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Workplace adaptation", "Sensory management", "Professional coping"],
                    gameType: "simulation",
                    ageGroup: "adult"
                },
                {
                    id: "sensory-adult-2",
                    name: "Daily Sensory Planner",
                    description: "Plan daily activities with sensory considerations",
                    personalizedDescription: "Plan your day with sensory needs in mind for optimal functioning.",
                    icon: "fa-calendar-alt",
                    difficulty: "Beginner",
                    recommendedTime: "15-25 minutes",
                    targetScore: "< 40%",
                    skills: ["Daily planning", "Sensory scheduling", "Energy management"],
                    gameType: "planning",
                    ageGroup: "adult"
                }
            ]
        }
    },

    // COGNITIVE ABILITIES GAMES
    cognitiveAbilities: {
        beginner: {
            toddler: [
                {
                    id: "cognitive-toddler-1",
                    name: "Shape Sorter",
                    description: "Basic shape recognition and sorting activities",
                    personalizedDescription: "Let's sort shapes! Circle, square, triangle - where do they go?",
                    icon: "fa-shapes",
                    difficulty: "Beginner",
                    recommendedTime: "5-8 minutes",
                    targetScore: "< 40%",
                    skills: ["Shape recognition", "Sorting", "Basic categorization"],
                    gameType: "sorting",
                    ageGroup: "toddler"
                },
                {
                    id: "cognitive-toddler-2",
                    name: "Color Match",
                    description: "Match colors and learn color names",
                    personalizedDescription: "Match the colors! Red with red, blue with blue - you can do it!",
                    icon: "fa-palette",
                    difficulty: "Beginner",
                    recommendedTime: "6-9 minutes",
                    targetScore: "< 40%",
                    skills: ["Color recognition", "Matching", "Visual discrimination"],
                    gameType: "matching",
                    ageGroup: "toddler"
                },
                {
                    id: "cognitive-toddler-3",
                    name: "Counting Fun",
                    description: "Basic counting and number recognition",
                    personalizedDescription: "Let's count together! 1, 2, 3... how many do you see?",
                    icon: "fa-sort-numeric-up",
                    difficulty: "Beginner",
                    recommendedTime: "5-7 minutes",
                    targetScore: "< 40%",
                    skills: ["Counting", "Number recognition", "One-to-one correspondence"],
                    gameType: "counting",
                    ageGroup: "toddler"
                }
            ],
            child: [
                {
                    id: "cognitive-child-1",
                    name: "Memory Master",
                    description: "Memory card matching games with increasing difficulty",
                    personalizedDescription: "Test your memory! Can you find the matching pairs?",
                    icon: "fa-brain",
                    difficulty: "Beginner",
                    recommendedTime: "10-15 minutes",
                    targetScore: "< 40%",
                    skills: ["Memory", "Concentration", "Visual recall"],
                    gameType: "memory",
                    ageGroup: "child"
                },
                {
                    id: "cognitive-child-2",
                    name: "Pattern Builder",
                    description: "Create and extend visual patterns",
                    personalizedDescription: "Be a pattern detective! Find and create amazing patterns.",
                    icon: "fa-project-diagram",
                    difficulty: "Beginner",
                    recommendedTime: "12-18 minutes",
                    targetScore: "< 40%",
                    skills: ["Pattern recognition", "Sequencing", "Logical thinking"],
                    gameType: "puzzle",
                    ageGroup: "child"
                },
                {
                    id: "cognitive-child-3",
                    name: "Problem Solver",
                    description: "Age-appropriate problem solving challenges",
                    personalizedDescription: "Solve fun puzzles and problems! You're a super problem solver!",
                    icon: "fa-puzzle-piece",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Problem solving", "Critical thinking", "Reasoning"],
                    gameType: "problem-solving",
                    ageGroup: "child"
                }
            ],
            adolescent: [
                {
                    id: "cognitive-teen-1",
                    name: "Strategic Thinking",
                    description: "Strategy games and planning challenges",
                    personalizedDescription: "Think like a strategist! Plan your moves and win the game.",
                    icon: "fa-chess",
                    difficulty: "Beginner",
                    recommendedTime: "20-25 minutes",
                    targetScore: "< 40%",
                    skills: ["Strategic thinking", "Planning", "Decision making"],
                    gameType: "strategy",
                    ageGroup: "adolescent"
                },
                {
                    id: "cognitive-teen-2",
                    name: "Logic Puzzles",
                    description: "Complex logic puzzles and brain teasers",
                    personalizedDescription: "Challenge your brain with mind-bending logic puzzles!",
                    icon: "fa-lightbulb",
                    difficulty: "Beginner",
                    recommendedTime: "15-20 minutes",
                    targetScore: "< 40%",
                    skills: ["Logical reasoning", "Deductive thinking", "Problem analysis"],
                    gameType: "logic",
                    ageGroup: "adolescent"
                },
                {
                    id: "cognitive-teen-3",
                    name: "Executive Function Trainer",
                    description: "Practice planning, organization, and time management",
                    personalizedDescription: "Master your executive functions! Plan, organize, and succeed.",
                    icon: "fa-tasks",
                    difficulty: "Beginner",
                    recommendedTime: "18-25 minutes",
                    targetScore: "< 40%",
                    skills: ["Executive function", "Planning", "Organization", "Time management"],
                    gameType: "training",
                    ageGroup: "adolescent"
                }
            ],
            adult: [
                {
                    id: "cognitive-adult-1",
                    name: "Professional Problem Solving",
                    description: "Workplace-style problem solving scenarios",
                    personalizedDescription: "Tackle professional challenges with advanced problem-solving skills.",
                    icon: "fa-briefcase",
                    difficulty: "Beginner",
                    recommendedTime: "25-35 minutes",
                    targetScore: "< 40%",
                    skills: ["Professional problem solving", "Analytical thinking", "Decision making"],
                    gameType: "simulation",
                    ageGroup: "adult"
                },
                {
                    id: "cognitive-adult-2",
                    name: "Cognitive Flexibility Trainer",
                    description: "Practice mental flexibility and adaptive thinking",
                    personalizedDescription: "Build mental agility! Adapt to new challenges and perspectives.",
                    icon: "fa-sync-alt",
                    difficulty: "Beginner",
                    recommendedTime: "20-30 minutes",
                    targetScore: "< 40%",
                    skills: ["Cognitive flexibility", "Adaptive thinking", "Mental agility"],
                    gameType: "cognitive",
                    ageGroup: "adult"
                },
                {
                    id: "cognitive-adult-3",
                    name: "Memory Enhancement",
                    description: "Advanced memory techniques and strategies",
                    personalizedDescription: "Enhance your memory with proven techniques and strategies.",
                    icon: "fa-brain",
                    difficulty: "Beginner",
                    recommendedTime: "20-25 minutes",
                    targetScore: "< 40%",
                    skills: ["Memory enhancement", "Learning strategies", "Retention techniques"],
                    gameType: "memory",
                    ageGroup: "adult"
                }
            ]
        }
    }
};

// Helper function to get personalized games based on assessment scores
function getPersonalizedGames(assessment, ageGroup) {
    console.log('=== getPersonalizedGames START ===');
    const personalizedGames = [];
    
    // Get domain scores and overall risk
    const socialScore = assessment.domainScores?.socialCommunication || 0;
    const behavioralScore = assessment.domainScores?.behavioralPatterns || 0;
    const sensoryScore = assessment.domainScores?.sensoryProcessing || 0;
    const cognitiveScore = assessment.domainScores?.cognitiveAbilities || 0;
    const overallRiskScore = assessment.autismRiskScore || 0;
    
    console.log('getPersonalizedGames called with:', {
        ageGroup,
        socialScore,
        behavioralScore,
        sensoryScore,
        cognitiveScore,
        overallRiskScore
    });
    
    // Determine difficulty level based on scores and overall risk
    const getDifficultyLevel = (score) => {
        console.log(`Getting difficulty for score: ${score}`);
        if (score < 40) return 'beginner';
        if (score < 60) return 'intermediate';
        return 'advanced';
    };
    
    // Add games for each domain based on scores AND overall risk
    const domains = [
        { name: 'socialCommunication', score: socialScore, priority: (socialScore < 60 && overallRiskScore > 50) ? 2 : 1 },
        { name: 'behavioralPatterns', score: behavioralScore, priority: (behavioralScore < 60 && overallRiskScore > 50) ? 2 : 1 },
        { name: 'sensoryProcessing', score: sensoryScore, priority: (sensoryScore < 60 && overallRiskScore > 50) ? 2 : 1 },
        { name: 'cognitiveAbilities', score: cognitiveScore, priority: (cognitiveScore < 60 && overallRiskScore > 50) ? 2 : 1 }
    ];
    
    // Sort domains by score (highest risk = lowest score = highest priority)
    domains.sort((a, b) => a.score - b.score);
    
    console.log('Domains sorted by priority:', domains);
    
    // Select games for each domain (highest risk domain first)
    domains.forEach((domain, index) => {
        const difficultyLevel = getDifficultyLevel(domain.score);
        console.log(`Looking for games: ${domain.name}.${difficultyLevel}.${ageGroup}`);
        
        const domainGames = gamesDataset[domain.name]?.[difficultyLevel]?.[ageGroup] || [];
        
        console.log(`Domain: ${domain.name}, Score: ${domain.score}, Difficulty: ${difficultyLevel}, Games found: ${domainGames.length}`);
        
        if (domainGames.length > 0) {
            console.log('Sample game:', domainGames[0]);
        }
        
        // Add games based on domain priority (highest risk gets more games)
        const gamesToAdd = index === 0 ? 3 : 2; // Highest risk domain gets 3 games, others get 2
        for (let i = 0; i < Math.min(gamesToAdd, domainGames.length); i++) {
            const game = { ...domainGames[i] };
            game.priority = index === 0 ? 1 : 2; // Highest risk domain games get priority 1
            game.domainScore = domain.score;
            personalizedGames.push(game);
            console.log(`Added game: ${game.name} with priority ${game.priority}`);
        }
    });
    
    console.log('=== getPersonalizedGames END ===');
    console.log('Final personalized games:', personalizedGames);
    
    // Add cross-domain games if scores are balanced
    const allScores = [socialScore, behavioralScore, sensoryScore, cognitiveScore];
    const scoreDifference = Math.max(...allScores) - Math.min(...allScores);
    
    if (scoreDifference < 20) { // Balanced scores
        const crossDomainDifficulty = getDifficultyLevel(Math.max(...allScores));
        const crossDomainGames = gamesDataset.crossDomain?.[crossDomainDifficulty]?.[ageGroup] || [];
        
        if (crossDomainGames.length > 0) {
            const crossGame = { ...crossDomainGames[0] };
            crossGame.priority = 1;
            crossGame.isCrossDomain = true;
            personalizedGames.push(crossGame);
        }
    }
    
    return personalizedGames;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gamesDataset, getPersonalizedGames };
}
