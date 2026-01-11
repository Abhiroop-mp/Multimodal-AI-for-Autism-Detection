#!/usr/bin/env python3
"""
Python ML Prediction Interface
Called from Node.js server to generate game predictions
"""

import sys
import json
import os
import warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow logging
warnings.filterwarnings('ignore')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_game_prediction_ml import EnhancedGamePredictionML

def main():
    """Main prediction function"""
    try:
        # Get command line arguments
        if len(sys.argv) != 6:
            print(json.dumps({
                'error': 'Expected 5 arguments: age_group, social, behavioral, sensory, cognitive'
            }))
            return

        age_group = sys.argv[1]
        social_score = float(sys.argv[2])
        behavioral_score = float(sys.argv[3])
        sensory_score = float(sys.argv[4])
        cognitive_score = float(sys.argv[5])

        # Initialize ML model
        ml = EnhancedGamePredictionML()
        
        # Load trained model
        if not ml.load_models():
            print(json.dumps({
                'error': 'Failed to load trained ML model'
            }))
            return

        # Generate predictions
        predictions = ml.predict_games(
            age_group, social_score, behavioral_score, 
            sensory_score, cognitive_score, top_k=5
        )

        # Format output for frontend
        formatted_predictions = []
        for pred in predictions:
            formatted_predictions.append({
                'game_id': pred['game_id'],
                'name': pred['name'],
                'type': pred['type'],
                'difficulty': pred['difficulty'],
                'domain': pred['domain'],
                'priority': pred['priority'],
                'age_group': pred['age_group'],
                'confidence': round(pred['confidence'], 3),
                'description': pred['description'],
                'skills': pred['skills'],
                'recommended_time': pred['recommended_time'],
                'target_score': pred['target_score'],
                'icon': pred['icon'],
                'domain_score': round(pred.get('domain_score', 0), 1)
            })

        # Output JSON result
        result = {
            'success': True,
            'predictions': formatted_predictions,
            'input': {
                'age_group': age_group,
                'scores': {
                    'social': social_score,
                    'behavioral': behavioral_score,
                    'sensory': sensory_score,
                    'cognitive': cognitive_score
                }
            }
        }

        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
