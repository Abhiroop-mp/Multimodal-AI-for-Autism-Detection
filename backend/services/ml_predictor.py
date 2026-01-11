import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import sys
import json
from typing import Dict, List, Tuple, Any

class MLPredictor:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = [
            'A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score',
            'A6_Score', 'A7_Score', 'A8_Score', 'A9_Score', 'A10_Score',
            'age', 'gender', 'ethnicity', 'jundice', 'austim', 'contry_of_res', 'used_app_before'
        ]
        self.target_column = 'Class/ASD'
        self.load_models()
    
    def load_arff_data(self, file_path: str) -> pd.DataFrame:
        """Load ARFF file and convert to DataFrame"""
        try:
            # Read ARFF file manually
            with open(file_path, 'r') as f:
                lines = f.readlines()
            
            # Parse data section
            data_start = False
            data_lines = []
            
            for line in lines:
                line = line.strip()
                if line.lower() == '@data':
                    data_start = True
                    continue
                if data_start and line:
                    data_lines.append(line)
            
            # Create column names from ARFF header
            columns = [
                'A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score',
                'A6_Score', 'A7_Score', 'A8_Score', 'A9_Score', 'A10_Score',
                'age', 'gender', 'ethnicity', 'jundice', 'austim', 'contry_of_res', 
                'used_app_before', 'result', 'age_desc', 'relation', 'Class/ASD'
            ]
            
            # Parse data
            data = []
            for line in data_lines:
                values = line.split(',')
                if len(values) >= len(columns):
                    row = {}
                    for i, col in enumerate(columns):
                        if i < len(values):
                            val = values[i].strip().strip("'\"")
                            row[col] = val
                    data.append(row)
            
            df = pd.DataFrame(data)
            return df
            
        except Exception as e:
            print(f"Error loading ARFF file {file_path}: {e}")
            return None
    
    def preprocess_data(self, df: pd.DataFrame, age_group: str = 'child') -> pd.DataFrame:
        """Preprocess data for ML training"""
        if df is None or df.empty:
            return None
        
        # Make a copy to avoid modifying original
        df = df.copy()
        
        # Convert numeric columns
        numeric_cols = ['A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score',
                      'A6_Score', 'A7_Score', 'A8_Score', 'A9_Score', 'A10_Score',
                      'age', 'result']
        
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Handle missing values in categorical columns - replace with 'unknown'
        categorical_cols = ['gender', 'ethnicity', 'jundice', 'austim', 'contry_of_res', 'used_app_before']
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].fillna('unknown').astype(str)
        
        # Only encode categorical variables that exist in the data
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.encoders:
                    # Create encoder with all possible values
                    unique_values = list(df[col].unique())
                    self.encoders[col] = LabelEncoder()
                    self.encoders[col].fit(unique_values)
                
                # Only transform if the encoder exists
                if col in self.encoders:
                    try:
                        df[col] = self.encoders[col].transform(df[col].astype(str))
                    except ValueError as e:
                        # Handle unseen labels by assigning them to 0
                        print(f"Warning: Unseen value in {col}, assigning to 0: {e}")
                        df[col] = 0
        
        # Convert target variable
        if self.target_column in df.columns:
            df[self.target_column] = df[self.target_column].map({'NO': 0, 'YES': 1})
        
        return df
    
    def train_models(self):
        """Train ML models on all ARFF datasets"""
        arff_files = {
            'child': 'Autism-Child-Data.arff',
            'adolescent': 'Autism-Adolescent-Data.arff',
            'adult': 'Autism-Adult-Data.arff'
        }
        
        for age_group, file_name in arff_files.items():
            print(f"Training model for {age_group} age group...")
            
            # Load data
            file_path = os.path.join('..', '..', file_name)  # Go up two directories to main project
            if not os.path.exists(file_path):
                file_path = os.path.join('..', file_name)  # Try one directory up
            if not os.path.exists(file_path):
                file_path = file_name  # Try current directory
            
            df = self.load_arff_data(file_path)
            if df is None:
                continue
            
            # Preprocess
            df_processed = self.preprocess_data(df, age_group)
            if df_processed is None:
                continue
            
            # Prepare features and target
            X = df_processed[self.feature_columns]
            y = df_processed[self.target_column]
            
            # Remove any rows with missing target
            mask = ~y.isna()
            X = X[mask]
            y = y[mask]
            
            if len(X) < 10:
                print(f"Not enough data for {age_group} model, skipping...")
                continue
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train ensemble model
            rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
            gb = GradientBoostingClassifier(n_estimators=100, random_state=42, max_depth=8)
            lr = LogisticRegression(random_state=42, max_iter=1000)
            
            # Fit models
            rf.fit(X_scaled, y)
            gb.fit(X_scaled, y)
            lr.fit(X_scaled, y)
            
            # Store models and scaler
            self.models[age_group] = {
                'random_forest': rf,
                'gradient_boosting': gb,
                'logistic_regression': lr
            }
            self.scalers[age_group] = scaler
            
            # Evaluate models
            rf_score = cross_val_score(rf, X_scaled, y, cv=5).mean()
            gb_score = cross_val_score(gb, X_scaled, y, cv=5).mean()
            lr_score = cross_val_score(lr, X_scaled, y, cv=5).mean()
        
        # Save models
        self.save_models()
    
    def predict_risk(self, survey_data: Dict[str, Any], age_group: str = 'child') -> Dict[str, Any]:
        """Predict ASD risk for new survey data"""
        try:
            if age_group not in self.models:
                age_group = 'child'  # Default to child model
            
            # Prepare input data
            input_df = pd.DataFrame([survey_data])
            
            # Preprocess input data with error handling
            input_processed = self.preprocess_input_data(input_df, age_group)
            if input_processed is None:
                return self.get_fallback_prediction()
            
            X = input_processed[self.feature_columns]
            
            # Scale features
            scaler = self.scalers[age_group]
            X_scaled = scaler.transform(X)
            
            # Get predictions from all models
            models = self.models[age_group]
            rf_pred = models['random_forest'].predict_proba(X_scaled)[0]
            gb_pred = models['gradient_boosting'].predict_proba(X_scaled)[0]
            lr_pred = models['logistic_regression'].predict_proba(X_scaled)[0]
            
            # Ensemble prediction (weighted average)
            ensemble_pred = (rf_pred * 0.4 + gb_pred * 0.4 + lr_pred * 0.2)
            asd_probability = ensemble_pred[1]  # Probability of ASD (class 1)
            
            # Calculate risk score (0-100)
            risk_score = int(asd_probability * 100)
            
            # Determine risk level
            if risk_score <= 30:
                risk_level = 'low'
            elif risk_score <= 60:
                risk_level = 'moderate'
            else:
                risk_level = 'high'
            
            # Calculate confidence
            confidence = int(np.max(ensemble_pred) * 100)
            
            # Feature contributions (using random forest feature importance)
            feature_importance = models['random_forest'].feature_importances_
            feature_contributions = {}
            for i, feature in enumerate(self.feature_columns):
                if feature in survey_data:
                    try:
                        # Convert to float, handling string values
                        value = float(survey_data.get(feature, 0))
                        contribution = feature_importance[i] * value
                        feature_contributions[feature] = float(contribution)
                    except (ValueError, TypeError):
                        # Handle non-numeric values
                        feature_contributions[feature] = 0.0
            
            # Generate recommendations
            recommendations = self.generate_recommendations(risk_level, feature_contributions, survey_data)
            
            return {
                'riskScore': risk_score,
                'riskLevel': risk_level,
                'probability': risk_score,
                'confidence': confidence,
                'featureContributions': feature_contributions,
                'recommendations': recommendations,
                'modelVersion': '2.0',
                'predictionType': 'ensemble-ml',
                'ageGroup': age_group,
                'ensembleDetails': {
                    'randomForest': float(rf_pred[1] * 100),
                    'gradientBoosting': float(gb_pred[1] * 100),
                    'logisticRegression': float(lr_pred[1] * 100)
                }
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return self.get_fallback_prediction()

    def preprocess_input_data(self, df: pd.DataFrame, age_group: str) -> pd.DataFrame:
        """Preprocess input data for prediction"""
        try:
            # Make a copy
            df = df.copy()
            
            # Convert numeric columns
            numeric_cols = ['A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score',
                          'A6_Score', 'A7_Score', 'A8_Score', 'A9_Score', 'A10_Score',
                          'age', 'result']
            
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
            # Handle categorical columns
            categorical_cols = ['gender', 'ethnicity', 'jundice', 'austim', 'contry_of_res', 'used_app_before']
            for col in categorical_cols:
                if col in df.columns:
                    df[col] = df[col].fillna('unknown').astype(str)
                    
                    # Encode using existing encoders
                    if col in self.encoders:
                        try:
                            df[col] = self.encoders[col].transform(df[col].astype(str))
                        except ValueError:
                            # Handle unseen values
                            df[col] = 0
                    else:
                        df[col] = 0
            
            return df
        except Exception as e:
            print(f"Error preprocessing input data: {e}")
            return None
    
    def generate_recommendations(self, risk_level: str, feature_contributions: Dict, survey_data: Dict) -> List[Dict]:
        """Generate recommendations based on risk level and key features"""
        recommendations = []
        
        # High-risk recommendations
        if risk_level == 'high':
            recommendations.append({
                'type': 'immediate',
                'title': 'Immediate Professional Evaluation Required',
                'description': 'High probability of ASD traits detected. Comprehensive evaluation recommended.',
                'priority': 'critical'
            })
        
        # Moderate-risk recommendations
        elif risk_level == 'moderate':
            recommendations.append({
                'type': 'specialist',
                'title': 'Specialist Consultation Recommended',
                'description': 'Moderate probability detected. Consult with developmental specialist.',
                'priority': 'high'
            })
        
        # Behavioral recommendations
        behavioral_features = ['A6_Score', 'A7_Score', 'A8_Score']
        if any(feature_contributions.get(f, 0) > 0.1 for f in behavioral_features):
            recommendations.append({
                'type': 'behavioral',
                'title': 'Behavioral Therapy Assessment',
                'description': 'Repetitive behaviors detected. Consider behavioral therapy evaluation.',
                'priority': 'high'
            })
        
        # Social communication recommendations
        social_features = ['A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score']
        if any(feature_contributions.get(f, 0) > 0.1 for f in social_features):
            recommendations.append({
                'type': 'social',
                'title': 'Social Communication Therapy',
                'description': 'Social communication challenges detected. Speech and language therapy recommended.',
                'priority': 'high'
            })
        
        # Family history recommendation
        if survey_data.get('austim') == 'yes':
            recommendations.append({
                'type': 'genetic',
                'title': 'Genetic Counseling',
                'description': 'Family history present. Consider genetic counseling and family screening.',
                'priority': 'medium'
            })
        
        return recommendations
    
    def get_fallback_prediction(self) -> Dict[str, Any]:
        """Fallback prediction if ML models fail"""
        return {
            'riskScore': 50,
            'riskLevel': 'moderate',
            'probability': 50,
            'confidence': 30,
            'featureContributions': {},
            'recommendations': [{
                'type': 'fallback',
                'title': 'Professional Evaluation Recommended',
                'description': 'Unable to complete ML analysis. Professional evaluation recommended.',
                'priority': 'medium'
            }],
            'modelVersion': '2.0',
            'predictionType': 'fallback'
        }
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            model_dir = 'ml_models'
            os.makedirs(model_dir, exist_ok=True)
            
            joblib.dump(self.models, os.path.join(model_dir, 'models.pkl'))
            joblib.dump(self.scalers, os.path.join(model_dir, 'scalers.pkl'))
            joblib.dump(self.encoders, os.path.join(model_dir, 'encoders.pkl'))
        except Exception as e:
            print(f"Error saving models: {e}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            model_dir = 'ml_models'
            if os.path.exists(os.path.join(model_dir, 'models.pkl')):
                self.models = joblib.load(os.path.join(model_dir, 'models.pkl'))
                self.scalers = joblib.load(os.path.join(model_dir, 'scalers.pkl'))
                self.encoders = joblib.load(os.path.join(model_dir, 'encoders.pkl'))
            else:
                self.train_models()
        except Exception as e:
            self.train_models()

# Singleton instance
ml_predictor = MLPredictor()

def predict_asd_risk(survey_data: Dict[str, Any], age_group: str = 'child') -> Dict[str, Any]:
    """Main prediction function"""
    return ml_predictor.predict_risk(survey_data, age_group)

if __name__ == "__main__":
    # Handle command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'train':
            # Train models
            predictor = MLPredictor()
            predictor.train_models()
            print(json.dumps({"success": True, "message": "Models trained successfully"}))
            
        elif command == 'predict':
            # Make prediction
            if len(sys.argv) >= 4:
                try:
                    survey_data = json.loads(sys.argv[2])
                    age_group = sys.argv[3]
                    
                    predictor = MLPredictor()
                    result = predictor.predict_risk(survey_data, age_group)
                    print(json.dumps(result))
                except Exception as e:
                    error_result = {
                        "error": str(e),
                        "riskScore": 50,
                        "riskLevel": "moderate",
                        "predictionType": "error"
                    }
                    print(json.dumps(error_result))
            else:
                print(json.dumps({"error": "Insufficient arguments for prediction"}))
                
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
    else:
        # Train models when run directly without arguments
        predictor = MLPredictor()
        predictor.train_models()
