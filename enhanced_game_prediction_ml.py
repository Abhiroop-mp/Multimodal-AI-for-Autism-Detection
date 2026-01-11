import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.multioutput import MultiOutputClassifier
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import pickle
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class EnhancedGamePredictionML:
    """
    Enhanced Machine Learning Model for Autism Game Prediction
    Handles flexible age calculations (years/months) and floating point scores
    """
    
    def __init__(self):
        self.data = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.models = {}
        self.feature_columns = ['SocialCommunication', 'BehavioralPatterns', 
                              'SensoryProcessing', 'CognitiveAbilities']
        self.target_columns = ['PriorityDomain', 'Difficulty', 'Priority']
        self.game_features = ['GameID', 'GameName', 'GameType', 'Icon', 'Description', 
                           'Skills', 'RecommendedTime', 'TargetScore']
        
    def load_data(self, csv_path: str = 'enhanced-ml-dataset.csv') -> bool:
        """Load and preprocess the enhanced dataset"""
        try:
            print("Loading enhanced dataset...")
            
            # Use pandas with proper parameters
            self.data = pd.read_csv(csv_path, quotechar='"', encoding='utf-8')
            print(f"Dataset loaded: {self.data.shape[0]} rows, {self.data.shape[1]} columns")
            print(f"Columns: {list(self.data.columns)}")
            
            # Data preprocessing
            self._preprocess_data()
            print("Data preprocessing completed")
            return True
            
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def _preprocess_data(self):
        """Preprocess the enhanced dataset"""
        print(f"Original data shape: {self.data.shape}")
        
        # Calculate total age in months if not present
        if 'TotalAgeMonths' not in self.data.columns:
            if 'AgeYears' in self.data.columns and 'AgeMonths' in self.data.columns:
                self.data['TotalAgeMonths'] = (self.data['AgeYears'] * 12) + self.data['AgeMonths']
            else:
                # Fallback to Age column if present
                if 'Age' in self.data.columns:
                    self.data['TotalAgeMonths'] = self.data['Age'] * 12
                else:
                    raise ValueError("No age information found in dataset")
        
        # Handle missing values - fill with appropriate defaults
        if 'Priority' in self.data.columns:
            self.data['Priority'] = self.data['Priority'].fillna(1)
        
        # Extract skills from pipe-separated string
        if 'Skills' in self.data.columns:
            self.data['Skills_List'] = self.data['Skills'].str.split('|')
        
        # Create enhanced age groups
        self._create_age_groups()
        
        # Convert categorical columns to strings first
        self.data['PriorityDomain'] = self.data['PriorityDomain'].astype(str)
        self.data['Difficulty'] = self.data['Difficulty'].astype(str)
        self.data['AgeGroup'] = self.data['AgeGroup'].astype(str)
        
        # Encode categorical variables
        categorical_columns = ['PriorityDomain', 'Difficulty', 'AgeGroup']
        
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
            self.data[col + '_Encoded'] = self.label_encoders[col].fit_transform(self.data[col])
        
        print(f"Feature columns: {self.feature_columns}")
        print(f"Target columns: {self.target_columns}")
        print(f"Unique domains: {self.data['PriorityDomain'].unique()}")
        print(f"Unique difficulties: {self.data['Difficulty'].unique()}")
        print(f"Unique age groups: {self.data['AgeGroup'].unique()}")
        print(f"Final data shape: {self.data.shape}")
        
        # Show sample data with floating point scores
        print("\nSample data with floating point scores:")
        print(self.data[self.feature_columns + ['AgeGroup']].head())
    
    def _create_age_groups(self):
        """Create strict age groups: toddler, child, adolescent, adult"""
        # Define age group boundaries in months
        age_boundaries = {
            'toddler': (0, 60),      # 0-5 years
            'child': (61, 156),     # 5-13 years
            'adolescent': (157, 216), # 13-18 years
            'adult': (217, 1000)    # 18+ years
        }
        
        def assign_age_group(total_months):
            for group, (min_months, max_months) in age_boundaries.items():
                if min_months <= total_months <= max_months:
                    return group
            return 'adult'  # default
        
        self.data['AgeGroup'] = self.data['TotalAgeMonths'].apply(assign_age_group)
        
        print(f"Age group distribution:")
        print(self.data['AgeGroup'].value_counts().sort_index())
    
    def prepare_training_data(self, test_size: float = 0.2, random_state: int = 42) -> None:
        """Prepare training and testing datasets"""
        # Features
        X = self.data[self.feature_columns].copy()
        
        # Targets (multi-output)
        y_domain = self.data['PriorityDomain_Encoded']
        y_difficulty = self.data['Difficulty_Encoded']
        y_priority = self.data['Priority']
        
        # Split the data
        self.X_train, self.X_test, y_train_domain, y_test_domain = train_test_split(
            X, y_domain, test_size=test_size, random_state=random_state, stratify=y_domain
        )
        
        _, _, y_train_difficulty, y_test_difficulty = train_test_split(
            X, y_difficulty, test_size=test_size, random_state=random_state, stratify=y_difficulty
        )
        
        _, _, y_train_priority, y_test_priority = train_test_split(
            X, y_priority, test_size=test_size, random_state=random_state, stratify=y_priority
        )
        
        # Scale features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        # Combine targets for multi-output training
        self.y_train = np.column_stack([y_train_domain, y_train_difficulty, y_train_priority])
        self.y_test = np.column_stack([y_test_domain, y_test_difficulty, y_test_priority])
        
        print(f"Training set: {self.X_train_scaled.shape}")
        print(f"Testing set: {self.X_test_scaled.shape}")
        
        # Show feature ranges
        print(f"\nFeature ranges in training data:")
        for i, col in enumerate(self.feature_columns):
            print(f"{col}: {self.X_train[col].min():.1f} - {self.X_train[col].max():.1f}")
    
    def train_random_forest(self) -> Dict:
        """Train Random Forest model"""
        print("Training Random Forest model...")
        
        rf = MultiOutputClassifier(
            RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        )
        
        rf.fit(self.X_train_scaled, self.y_train)
        self.models['random_forest'] = rf
        
        # Evaluate
        y_pred = rf.predict(self.X_test_scaled)
        
        # Calculate accuracy for each output separately
        accuracy_domain = accuracy_score(self.y_test[:, 0], y_pred[:, 0])
        accuracy_difficulty = accuracy_score(self.y_test[:, 1], y_pred[:, 1])
        accuracy_priority = accuracy_score(self.y_test[:, 2], y_pred[:, 2])
        
        # Overall accuracy (average of all outputs)
        accuracy = (accuracy_domain + accuracy_difficulty + accuracy_priority) / 3
        
        print(f"Random Forest Accuracy: {accuracy:.4f}")
        print(f"  Domain: {accuracy_domain:.4f}, Difficulty: {accuracy_difficulty:.4f}, Priority: {accuracy_priority:.4f}")
        return {'model': rf, 'accuracy': accuracy}
    
    def train_gradient_boosting(self) -> Dict:
        """Train Gradient Boosting model"""
        print("Training Gradient Boosting model...")
        
        gb = MultiOutputClassifier(
            GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=8,
                random_state=42
            )
        )
        
        gb.fit(self.X_train_scaled, self.y_train)
        self.models['gradient_boosting'] = gb
        
        # Evaluate
        y_pred = gb.predict(self.X_test_scaled)
        
        # Calculate accuracy for each output separately
        accuracy_domain = accuracy_score(self.y_test[:, 0], y_pred[:, 0])
        accuracy_difficulty = accuracy_score(self.y_test[:, 1], y_pred[:, 1])
        accuracy_priority = accuracy_score(self.y_test[:, 2], y_pred[:, 2])
        
        # Overall accuracy (average of all outputs)
        accuracy = (accuracy_domain + accuracy_difficulty + accuracy_priority) / 3
        
        print(f"Gradient Boosting Accuracy: {accuracy:.4f}")
        print(f"  Domain: {accuracy_domain:.4f}, Difficulty: {accuracy_difficulty:.4f}, Priority: {accuracy_priority:.4f}")
        return {'model': gb, 'accuracy': accuracy}
    
    def train_svm(self) -> Dict:
        """Train Support Vector Machine model"""
        print("Training SVM model...")
        
        svm = MultiOutputClassifier(
            SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,
                random_state=42
            )
        )
        
        svm.fit(self.X_train_scaled, self.y_train)
        self.models['svm'] = svm
        
        # Evaluate
        y_pred = svm.predict(self.X_test_scaled)
        
        # Calculate accuracy for each output separately
        accuracy_domain = accuracy_score(self.y_test[:, 0], y_pred[:, 0])
        accuracy_difficulty = accuracy_score(self.y_test[:, 1], y_pred[:, 1])
        accuracy_priority = accuracy_score(self.y_test[:, 2], y_pred[:, 2])
        
        # Overall accuracy (average of all outputs)
        accuracy = (accuracy_domain + accuracy_difficulty + accuracy_priority) / 3
        
        print(f"SVM Accuracy: {accuracy:.4f}")
        print(f"  Domain: {accuracy_domain:.4f}, Difficulty: {accuracy_difficulty:.4f}, Priority: {accuracy_priority:.4f}")
        return {'model': svm, 'accuracy': accuracy}
    
    def train_all_models(self) -> Dict[str, Dict]:
        """Train all models and return results"""
        if self.X_train_scaled is None:
            raise ValueError("Training data not prepared. Call prepare_training_data() first.")
        
        results = {}
        
        # Train traditional ML models
        results['random_forest'] = self.train_random_forest()
        results['gradient_boosting'] = self.train_gradient_boosting()
        results['svm'] = self.train_svm()
        
        # Find best model
        best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
        self.best_model_name = best_model_name
        self.best_model = results[best_model_name]['model']
        
        print(f"\nBest model: {best_model_name} with accuracy: {results[best_model_name]['accuracy']:.4f}")
        
        return results
    
    def predict_games(self, age_group: str, social_score: float, 
                     behavioral_score: float, sensory_score: float, cognitive_score: float,
                     model_name: Optional[str] = None, top_k: int = 5) -> List[Dict]:
        """
        Predict games for all 4 domains based on their individual scores
        
        Args:
            age_group: Age group (toddler, child, adolescent, adult)
            social_score: Social communication score (0-100, can be float)
            behavioral_score: Behavioral patterns score (0-100, can be float)
            sensory_score: Sensory processing score (0-100, can be float)
            cognitive_score: Cognitive abilities score (0-100, can be float)
            model_name: Specific model to use (if None, uses best model)
            top_k: Number of top recommendations to return per domain
            
        Returns:
            List of game recommendations for all 4 domains with confidence scores
        """
        if not self.models:
            raise ValueError("No models trained. Call train_all_models() first.")
        
        # Validate age group
        valid_age_groups = ['toddler', 'child', 'adolescent', 'adult']
        if age_group not in valid_age_groups:
            raise ValueError(f"Invalid age group. Must be one of: {valid_age_groups}")
        
        # Use specified model or best model
        model = self.models[model_name] if model_name else self.best_model
        
        # All recommendations across all domains
        all_recommendations = []
        
        # Process each domain separately
        domains_scores = [
            ('SocialCommunication', social_score),
            ('BehavioralPatterns', behavioral_score),
            ('SensoryProcessing', sensory_score),
            ('CognitiveAbilities', cognitive_score)
        ]
        
        for domain_name, domain_score in domains_scores:
            # Prepare input features (only 4 factor scores)
            input_data = np.array([[social_score, behavioral_score, sensory_score, cognitive_score]])
            input_scaled = self.scaler.transform(input_data)
            
            # Make prediction
            if model_name == 'neural_network' or (model_name is None and self.best_model_name == 'neural_network'):
                predictions = self._predict_neural_network(model, input_scaled)
            else:
                predictions = model.predict(input_scaled)[0]
            
            # Convert predictions to game recommendations for this domain
            domain_recommendations = self._predictions_to_games_for_domain(
                predictions, input_data[0], age_group, domain_name, domain_score, top_k
            )
            
            all_recommendations.extend(domain_recommendations)
        
        # Sort all recommendations by confidence and return top results
        all_recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        
        return all_recommendations[:top_k * 4]  # Return up to 4x top_k recommendations
    
    def _predictions_to_games_for_domain(self, predictions, input_features, age_group: str, 
                                      target_domain: str, domain_score: float, top_k: int) -> List[Dict]:
        """Convert model predictions to game recommendations for a specific domain"""
        domain_pred, difficulty_pred, priority_pred = predictions
        
        # Convert predictions to integers
        domain_pred = int(domain_pred)
        difficulty_pred = int(difficulty_pred)
        priority_pred = int(priority_pred)
        
        # Decode predictions
        predicted_domain = self.label_encoders['PriorityDomain'].inverse_transform([domain_pred])[0]
        difficulty = self.label_encoders['Difficulty'].inverse_transform([difficulty_pred])[0]
        priority = int(priority_pred)
        
        # Filter games matching the target domain and age group
        matching_games = self.data[
            (self.data['PriorityDomain'] == target_domain) &
            (self.data['AgeGroup'] == age_group) &
            (self.data['Difficulty'] == difficulty) &
            (self.data['Priority'] == priority)
        ]
        
        # If no exact matches, relax some criteria
        if matching_games.empty:
            matching_games = self.data[
                (self.data['PriorityDomain'] == target_domain) &
                (self.data['AgeGroup'] == age_group)
            ]
        
        # Get top recommendations
        recommendations = []
        for _, game in matching_games.head(top_k).iterrows():
            # Calculate confidence based on the specific domain score
            confidence = self._calculate_confidence(domain_score, difficulty)
            
            recommendations.append({
                'game_id': game['GameID'],
                'name': game['GameName'],
                'type': game['GameType'],
                'difficulty': game['Difficulty'],
                'domain': game['PriorityDomain'],
                'priority': game['Priority'],
                'age_group': game['AgeGroup'],
                'confidence': confidence,
                'description': game['Description'],
                'skills': game['Skills_List'],
                'recommended_time': game['RecommendedTime'],
                'target_score': game['TargetScore'],
                'icon': game['Icon'],
                'domain_score': domain_score  # Add the actual domain score
            })
        
        return recommendations
    
    def _predictions_to_games(self, predictions, input_features, age_group: str, top_k: int) -> List[Dict]:
        """Convert model predictions to game recommendations"""
        domain_pred, difficulty_pred, priority_pred = predictions
        
        # Convert predictions to integers
        domain_pred = int(domain_pred)
        difficulty_pred = int(difficulty_pred)
        priority_pred = int(priority_pred)
        
        # Decode predictions
        domain = self.label_encoders['PriorityDomain'].inverse_transform([domain_pred])[0]
        difficulty = self.label_encoders['Difficulty'].inverse_transform([difficulty_pred])[0]
        priority = int(priority_pred)
        
        # Filter games matching predictions
        matching_games = self.data[
            (self.data['PriorityDomain'] == domain) &
            (self.data['Difficulty'] == difficulty) &
            (self.data['AgeGroup'] == age_group) &
            (self.data['Priority'] == priority)
        ]
        
        # If no exact matches, relax some criteria
        if matching_games.empty:
            matching_games = self.data[
                (self.data['PriorityDomain'] == domain) &
                (self.data['AgeGroup'] == age_group)
            ]
        
        # Get top recommendations
        recommendations = []
        for _, game in matching_games.head(top_k).iterrows():
            # Calculate confidence based on score similarity
            domain_score_map = {
                'SocialCommunication': 'SocialCommunication',
                'BehavioralPatterns': 'BehavioralPatterns',
                'SensoryProcessing': 'SensoryProcessing',
                'CognitiveAbilities': 'CognitiveAbilities'
            }
            domain_score = input_features[self.feature_columns.index(domain_score_map.get(domain, 'CognitiveAbilities'))]
            confidence = self._calculate_confidence(domain_score, difficulty)
            
            recommendations.append({
                'game_id': game['GameID'],
                'name': game['GameName'],
                'type': game['GameType'],
                'difficulty': game['Difficulty'],
                'domain': game['PriorityDomain'],
                'priority': game['Priority'],
                'age_group': game['AgeGroup'],
                'confidence': confidence,
                'description': game['Description'],
                'skills': game['Skills_List'],
                'recommended_time': game['RecommendedTime'],
                'target_score': game['TargetScore'],
                'icon': game['Icon']
            })
        
        return recommendations
    
    def _get_age_group_from_months(self, total_months: int) -> str:
        """Get age group from total months"""
        if total_months <= 12:
            return 'infant'
        elif total_months <= 36:
            return 'toddler'
        elif total_months <= 60:
            return 'preschool'
        elif total_months <= 108:
            return 'child'
        elif total_months <= 156:
            return 'pre-teen'
        elif total_months <= 216:
            return 'adolescent'
        elif total_months <= 240:
            return 'young-adult'
        elif total_months <= 300:
            return 'adult'
        else:
            return 'mature-adult'
    
    def _calculate_confidence(self, domain_score: float, difficulty: str) -> float:
        """Calculate confidence score based on domain score and difficulty"""
        difficulty_scores = {'beginner': (0, 40), 'intermediate': (40, 60), 'advanced': (60, 100)}
        min_score, max_score = difficulty_scores.get(difficulty, (0, 100))
        
        if min_score <= domain_score <= max_score:
            # Perfect match
            return 0.9 + (0.1 * (1 - abs(domain_score - (min_score + max_score) / 2) / ((max_score - min_score) / 2)))
        else:
            # Partial match
            distance = min(abs(domain_score - min_score), abs(domain_score - max_score))
            return max(0.3, 0.7 - (distance / 100))
    
    def evaluate_model(self, model_name: Optional[str] = None) -> Dict:
        """Evaluate model performance"""
        model = self.models[model_name] if model_name else self.best_model
        
        if model_name == 'neural_network' or (model_name is None and self.best_model_name == 'neural_network'):
            y_pred = self._predict_neural_network(model, self.X_test_scaled)
        else:
            y_pred = model.predict(self.X_test_scaled)
        
        # Calculate metrics for each output separately
        accuracy_domain = accuracy_score(self.y_test[:, 0], y_pred[:, 0])
        accuracy_difficulty = accuracy_score(self.y_test[:, 1], y_pred[:, 1])
        accuracy_priority = accuracy_score(self.y_test[:, 2], y_pred[:, 2])
        
        # Overall accuracy (average of all outputs)
        accuracy = (accuracy_domain + accuracy_difficulty + accuracy_priority) / 3
        
        return {
            'accuracy': accuracy,
            'domain_accuracy': accuracy_domain,
            'difficulty_accuracy': accuracy_difficulty,
            'priority_accuracy': accuracy_priority
        }
    
    def save_models(self, filepath: str = 'enhanced_game_prediction_models.pkl') -> bool:
        """Save trained models to disk"""
        try:
            model_data = {
                'models': self.models,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                'feature_columns': self.feature_columns,
                'best_model_name': getattr(self, 'best_model_name', None),
                'data': self.data
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            
            print(f"Models saved to {filepath}")
            return True
            
        except Exception as e:
            print(f"Error saving models: {e}")
            return False
    
    def load_models(self, filepath: str = 'enhanced_game_prediction_models.pkl') -> bool:
        """Load trained models from disk"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.models = model_data['models']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_columns = model_data['feature_columns']
            self.best_model_name = model_data.get('best_model_name')
            self.data = model_data['data']
            
            if self.best_model_name:
                self.best_model = self.models[self.best_model_name]
            
            return True
            
        except Exception as e:
            print(f"Error loading models: {e}")
            return False


def main():
    """Main function to demonstrate the simplified ML pipeline"""
    print("🤖 Simplified Game Prediction ML System")
    print("=" * 50)
    
    # Initialize model
    ml_model = EnhancedGamePredictionML()
    
    # Load and prepare data
    if not ml_model.load_data():
        return
    
    # Prepare training data
    ml_model.prepare_training_data()
    
    # Train all models
    print("\n📊 Training Models...")
    results = ml_model.train_all_models()
    
    # Display results
    print("\n📈 Model Performance:")
    for name, result in results.items():
        print(f"{name}: {result['accuracy']:.4f}")
    
    # Test predictions with age groups and floating point scores
    print("\n🎮 Testing Simplified Predictions...")
    
    test_cases = [
        {
            'name': 'Toddler with Low Sensory',
            'age_group': 'toddler',
            'social': 28.4, 'behavioral': 25.7, 'sensory': 12.8, 'cognitive': 22.3
        },
        {
            'name': 'Child with Social Challenges',
            'age_group': 'child',
            'social': 52.4, 'behavioral': 48.6, 'sensory': 35.2, 'cognitive': 42.7
        },
        {
            'name': 'Adolescent with Balanced Profile',
            'age_group': 'adolescent',
            'social': 95.4, 'behavioral': 91.2, 'sensory': 81.3, 'cognitive': 86.7
        },
        {
            'name': 'Adult with High Scores',
            'age_group': 'adult',
            'social': 99.9, 'behavioral': 99.2, 'sensory': 95.3, 'cognitive': 98.1
        }
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n📝 Test Case {i+1}: {test_case['name']}")
        print(f"   Age Group: {test_case['age_group']}")
        print(f"   Scores: Social={test_case['social']}, Behavioral={test_case['behavioral']}, "
              f"Sensory={test_case['sensory']}, Cognitive={test_case['cognitive']}")
        
        # Get predictions
        predictions = ml_model.predict_games(
            test_case['age_group'],
            test_case['social'], test_case['behavioral'], 
            test_case['sensory'], test_case['cognitive'], top_k=3
        )
        
        print(f"   🎯 Top {len(predictions)} Recommendations:")
        for j, game in enumerate(predictions, 1):
            print(f"   {j}. {game['name']} ({game['difficulty']}) - Confidence: {game['confidence']:.2f}")
            print(f"      Domain: {game['domain']}, Age Group: {game['age_group']}")
            print(f"      Time: {game['recommended_time']}, Skills: {', '.join(game['skills'][:2])}...")
    
    # Save the trained model
    print("\n💾 Saving trained model...")
    if ml_model.save_models():
        print("✅ Model saved successfully")
    else:
        print("❌ Failed to save model")
    
    # Evaluate model
    print("\n📊 Model Evaluation:")
    evaluation = ml_model.evaluate_model()
    print(f"   Overall Accuracy: {evaluation['accuracy']:.4f}")
    print(f"   Domain Accuracy: {evaluation['domain_accuracy']:.4f}")
    print(f"   Difficulty Accuracy: {evaluation['difficulty_accuracy']:.4f}")
    print(f"   Priority Accuracy: {evaluation['priority_accuracy']:.4f}")
    
    print("\n🎉 Simplified ML System Ready!")
    return ml_model


if __name__ == "__main__":
    main()
