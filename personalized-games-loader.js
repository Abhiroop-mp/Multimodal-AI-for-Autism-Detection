// Personalized Games Dataset Loader
// Loads and processes the CSV dataset for 4-factor assessment-based personalization

class PersonalizedGamesLoader {
    constructor() {
        this.gamesData = [];
        this.isLoading = false;
    }

    // Load CSV dataset
    async loadDataset() {
        if (this.isLoading) return this.gamesData.length > 0;
        this.isLoading = true;

        try {
            console.log('Attempting to load personalized-games-dataset-enhanced.csv...');
            const response = await fetch('personalized-games-dataset-enhanced.csv');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('CSV response received, status:', response.status);
            const csvText = await response.text();
            console.log('CSV text length:', csvText.length);
            console.log('First 200 chars:', csvText.substring(0, 200));
            
            this.gamesData = this.parseCSV(csvText);
            console.log('Personalized games dataset loaded:', this.gamesData.length, 'entries');
            console.log('Sample entry:', this.gamesData[0]);
            const success = this.gamesData.length > 0;
            console.log('Returning success:', success);
            return success;
        } catch (error) {
            console.error('Error loading personalized games dataset:', error);
            console.error('Full error details:', error.message, error.stack);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            }
        }

        return data;
    }

    // Parse CSV line handling commas in quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Get personalized games for a user based on assessment scores
    getPersonalizedGames(userId, assessment, ageGroup) {
        console.log('Getting personalized games for user:', userId, 'assessment:', assessment, 'ageGroup:', ageGroup);

        // If dataset not loaded, return empty array
        if (this.gamesData.length === 0) {
            console.warn('Games dataset not loaded');
            return [];
        }

        // Find entries for this user
        const userEntries = this.gamesData.filter(entry => entry.UserID === userId);
        
        if (userEntries.length === 0) {
            console.log('No entries found for user:', userId);
            // Try to find similar users based on scores
            return this.getSimilarUserGames(assessment, ageGroup);
        }

        console.log('Found', userEntries.length, 'games for user:', userId);

        // Convert CSV entries to game objects
        const games = userEntries.map(entry => ({
            id: entry.GameID,
            name: entry.GameName,
            description: entry.GameType + ' activity',
            personalizedDescription: entry.PersonalizedDescription,
            icon: entry.Icon,
            difficulty: entry.Difficulty,
            recommendedTime: entry.RecommendedTime,
            targetScore: entry.TargetScore,
            skills: entry.Skills.split('|'),
            gameType: entry.GameType,
            ageGroup: entry.AgeGroup,
            priority: parseInt(entry.Priority),
            domainScore: this.getDomainScore(entry.PriorityDomain, assessment),
            priorityDomain: entry.PriorityDomain
        }));

        console.log('Processed games:', games);
        return games;
    }

    // Get domain score for priority domain
    getDomainScore(domain, assessment) {
        const scoreMap = {
            'SocialCommunication': assessment.domainScores?.socialCommunication || 0,
            'BehavioralPatterns': assessment.domainScores?.behavioralPatterns || 0,
            'SensoryProcessing': assessment.domainScores?.sensoryProcessing || 0,
            'CognitiveAbilities': assessment.domainScores?.cognitiveAbilities || 0
        };
        return scoreMap[domain] || 0;
    }

    // Find games for similar users when no exact match found
    getSimilarUserGames(assessment, ageGroup) {
        console.log('Finding similar user games for age group:', ageGroup);

        // Filter by age group
        const ageGroupEntries = this.gamesData.filter(entry => entry.AgeGroup === ageGroup);
        
        if (ageGroupEntries.length === 0) {
            console.warn('No entries found for age group:', ageGroup);
            return [];
        }

        // Find entries with similar score patterns
        const similarEntries = ageGroupEntries.filter(entry => {
            const socialDiff = Math.abs(parseInt(entry.SocialCommunicationScore) - (assessment.domainScores?.socialCommunication || 0));
            const behavioralDiff = Math.abs(parseInt(entry.BehavioralPatternsScore) - (assessment.domainScores?.behavioralPatterns || 0));
            const sensoryDiff = Math.abs(parseInt(entry.SensoryProcessingScore) - (assessment.domainScores?.sensoryProcessing || 0));
            const cognitiveDiff = Math.abs(parseInt(entry.CognitiveAbilitiesScore) - (assessment.domainScores?.cognitiveAbilities || 0));
            
            // Consider similar if total difference is less than 30 points
            return (socialDiff + behavioralDiff + sensoryDiff + cognitiveDiff) < 30;
        });

        console.log('Found', similarEntries.length, 'similar user entries');

        // Return top 4 most similar entries
        return similarEntries.slice(0, 4).map(entry => ({
            id: entry.GameID,
            name: entry.GameName,
            description: entry.GameType + ' activity',
            personalizedDescription: entry.PersonalizedDescription,
            icon: entry.Icon,
            difficulty: entry.Difficulty,
            recommendedTime: entry.RecommendedTime,
            targetScore: entry.TargetScore,
            skills: entry.Skills.split('|'),
            gameType: entry.GameType,
            ageGroup: entry.AgeGroup,
            priority: parseInt(entry.Priority),
            domainScore: this.getDomainScore(entry.PriorityDomain, assessment),
            priorityDomain: entry.PriorityDomain
        }));
    }

    // Get available users for testing
    getAvailableUsers() {
        const uniqueUsers = [...new Set(this.gamesData.map(entry => entry.UserID))];
        return uniqueUsers.map(userId => {
            const entry = this.gamesData.find(e => e.UserID === userId);
            return {
                userId: entry.UserID,
                userName: entry.UserName,
                age: parseInt(entry.Age),
                ageGroup: entry.AgeGroup,
                scores: {
                    socialCommunication: parseInt(entry.SocialCommunicationScore),
                    behavioralPatterns: parseInt(entry.BehavioralPatternsScore),
                    sensoryProcessing: parseInt(entry.SensoryProcessingScore),
                    cognitiveAbilities: parseInt(entry.CognitiveAbilitiesScore),
                    overallRisk: parseInt(entry.OverallRiskScore)
                }
            };
        });
    }
}

// Global instance
window.personalizedGamesLoader = new PersonalizedGamesLoader();

// Helper function to get personalized games (replaces the old one)
function getPersonalizedGamesFromCSV(userId, assessment, ageGroup) {
    return window.personalizedGamesLoader.getPersonalizedGames(userId, assessment, ageGroup);
}

// Auto-load dataset when page loads
// Remove the automatic loading to prevent conflicts
// document.addEventListener('DOMContentLoaded', function() {
//     window.personalizedGamesLoader.loadDataset();
// });
