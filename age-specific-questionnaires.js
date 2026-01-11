// Child Questionnaire (4-11 years) - based on Autism-Child-Data.arff
function loadChildQuestionnaire(container) {
    container.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
            <h3 style="color: var(--primary); margin-bottom: 15px;">Child ASD Screening (4-11 years)</h3>
            <p style="margin-bottom: 20px; color: #666;">Please answer the following questions based on your child's typical behavior over the past 6 months.</p>
            
            <!-- Demographic Questions -->
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Child Information</h4>
                
                <div class="survey-question">
                    <p><strong>Child's Gender:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="gender" value="m" required> Male</label>
                        <label><input type="radio" name="gender" value="f" required> Female</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Ethnicity:</strong></p>
                    <select name="ethnicity" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select ethnicity</option>
                        <option value="White-European">White-European</option>
                        <option value="Black">Black</option>
                        <option value="Asian">Asian</option>
                        <option value="Middle Eastern">Middle Eastern</option>
                        <option value="South Asian">South Asian</option>
                        <option value="Hispanic">Hispanic</option>
                        <option value="Latino">Latino</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="survey-question">
                    <p><strong>Was the child born with jaundice?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="jundice" value="no" required> No</label>
                        <label><input type="radio" name="jundice" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Is there a family history of autism?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="austim" value="no" required> No</label>
                        <label><input type="radio" name="austim" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Country of residence:</strong></p>
                    <select name="contry_of_res" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Egypt">Egypt</option>
                        <option value="India">India</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>

            <!-- Behavioral Questions A1-A10 for Children -->
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Behavioral Assessment Questions</h4>
                
                <div class="survey-question">
                    <p><strong>A1: Does your child frequently fail to respond to their name or other verbal attempts to gain their attention?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A1_Score" value="0" required> No, usually responds</label>
                        <label><input type="radio" name="A1_Score" value="1" required> Yes, often doesn't respond</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A2: Does your child have difficulty with spontaneous back-and-forth conversation?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A2_Score" value="0" required> No, converses well</label>
                        <label><input type="radio" name="A2_Score" value="1" required> Yes, conversation difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A3: Does your child have difficulty developing and maintaining relationships appropriate for their age?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A3_Score" value="0" required> No, good peer relationships</label>
                        <label><input type="radio" name="A3_Score" value="1" required> Yes, relationship difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A4: Does your child show unusual attachment to objects or intense focus on specific topics?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A4_Score" value="0" required> No, typical interests</label>
                        <label><input type="radio" name="A4_Score" value="1" required> Yes, intense/specific interests</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A5: Does your child have difficulty understanding social cues or non-verbal communication?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A5_Score" value="0" required> No, understands social cues</label>
                        <label><input type="radio" name="A5_Score" value="1" required> Yes, misses social cues</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A6: Does your child engage in repetitive movements or behaviors?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A6_Score" value="0" required> No, flexible behaviors</label>
                        <label><input type="radio" name="A6_Score" value="1" required> Yes, repetitive behaviors</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A7: Does your child show strong resistance to changes in routine?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A7_Score" value="0" required> No, adapts well to changes</label>
                        <label><input type="radio" name="A7_Score" value="1" required> Yes, resists routine changes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A8: Does your child have unusual sensory responses (oversensitive or undersensitive to sounds, textures, etc.)?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A8_Score" value="0" required> No, typical sensory responses</label>
                        <label><input type="radio" name="A8_Score" value="1" required> Yes, unusual sensory responses</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A9: Does your child have difficulty with imaginative play or make-believe activities?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A9_Score" value="0" required> No, good imaginative play</label>
                        <label><input type="radio" name="A9_Score" value="1" required> Yes, limited imagination</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A10: Does your child show unusual patterns of speech or language development?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A10_Score" value="0" required> No, typical language development</label>
                        <label><input type="radio" name="A10_Score" value="1" required> Yes, unusual speech patterns</label>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    This questionnaire is based on standardized ASD screening tools for children (4-11 years). Results are for screening purposes only and should not replace professional medical diagnosis.
                </p>
            </div>
        </div>
    `;
}

// Adolescent Questionnaire (12-16 years) - based on Autism-Adolescent-Data.arff
function loadAdolescentQuestionnaire(container) {
    container.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
            <h3 style="color: var(--primary); margin-bottom: 15px;">Adolescent ASD Screening (12-16 years)</h3>
            <p style="margin-bottom: 20px; color: #666;">Please answer the following questions based on the adolescent's typical behavior over the past 6 months.</p>
            
            <!-- Demographic Questions -->
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Adolescent Information</h4>
                
                <div class="survey-question">
                    <p><strong>Gender:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="gender" value="m" required> Male</label>
                        <label><input type="radio" name="gender" value="f" required> Female</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Ethnicity:</strong></p>
                    <select name="ethnicity" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select ethnicity</option>
                        <option value="White-European">White-European</option>
                        <option value="Black">Black</option>
                        <option value="Asian">Asian</option>
                        <option value="Hispanic">Hispanic</option>
                        <option value="Latino">Latino</option>
                        <option value="Middle Eastern">Middle Eastern</option>
                        <option value="South Asian">South Asian</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="survey-question">
                    <p><strong>History of jaundice at birth:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="jundice" value="no" required> No</label>
                        <label><input type="radio" name="jundice" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Family history of autism:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="austim" value="no" required> No</label>
                        <label><input type="radio" name="austim" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Country of residence:</strong></p>
                    <select name="contry_of_res" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>

            <!-- Behavioral Questions A1-A10 for Adolescents -->
            <div style="background: #fff0f5; padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Adolescent Behavioral Assessment</h4>
                
                <div class="survey-question">
                    <p><strong>A1: Does the adolescent have difficulty understanding social situations or social norms?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A1_Score" value="0" required> No, understands social situations</label>
                        <label><input type="radio" name="A1_Score" value="1" required> Yes, social understanding difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A2: Does the adolescent struggle with maintaining conversations or appropriate topics of conversation?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A2_Score" value="0" required> No, converses appropriately</label>
                        <label><input type="radio" name="A2_Score" value="1" required> Yes, conversation difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A3: Does the adolescent have difficulty developing friendships appropriate for their age?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A3_Score" value="0" required> No, has age-appropriate friendships</label>
                        <label><input type="radio" name="A3_Score" value="1" required> Yes, friendship difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A4: Does the adolescent show intense focus on specific interests that dominate their time?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A4_Score" value="0" required> No, balanced interests</label>
                        <label><input type="radio" name="A4_Score" value="1" required> Yes, intense specific interests</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A5: Does the adolescent have difficulty understanding figurative language, sarcasm, or jokes?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A5_Score" value="0" required> No, understands figurative language</label>
                        <label><input type="radio" name="A5_Score" value="1" required> Yes, literal interpretation only</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A6: Does the adolescent engage in repetitive behaviors or have strict routines?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A6_Score" value="0" required> No, flexible behavior</label>
                        <label><input type="radio" name="A6_Score" value="1" required> Yes, repetitive/rigid behaviors</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A7: Does the adolescent show strong distress when plans change unexpectedly?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A7_Score" value="0" required> No, handles changes well</label>
                        <label><input type="radio" name="A7_Score" value="1" required> Yes, distress with changes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A8: Does the adolescent have unusual sensory sensitivities or preferences?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A8_Score" value="0" required> No, typical sensory responses</label>
                        <label><input type="radio" name="A8_Score" value="1" required> Yes, unusual sensory responses</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A9: Does the adolescent have difficulty with organization or planning skills?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A9_Score" value="0" required> No, good organizational skills</label>
                        <label><input type="radio" name="A9_Score" value="1" required> Yes, organization difficulties</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A10: Does the adolescent have unusual speech patterns or prosody (monotone voice, unusual rhythm)?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A10_Score" value="0" required> No, typical speech patterns</label>
                        <label><input type="radio" name="A10_Score" value="1" required> Yes, unusual speech patterns</label>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    This questionnaire is based on standardized ASD screening tools for adolescents (12-16 years). Results are for screening purposes only and should not replace professional medical diagnosis.
                </p>
            </div>
        </div>
    `;
}

// Adult Questionnaire (18+ years) - based on Autism-Adult-Data.arff
function loadAdultQuestionnaire(container) {
    container.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
            <h3 style="color: var(--primary); margin-bottom: 15px;">Adult ASD Screening (18+ years)</h3>
            <p style="margin-bottom: 20px; color: #666;">Please answer the following questions based on your typical behavior and experiences over the past 6 months.</p>
            
            <!-- Demographic Questions -->
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Personal Information</h4>
                
                <div class="survey-question">
                    <p><strong>Gender:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="gender" value="f" required> Female</label>
                        <label><input type="radio" name="gender" value="m" required> Male</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Ethnicity:</strong></p>
                    <select name="ethnicity" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select ethnicity</option>
                        <option value="White-European">White-European</option>
                        <option value="Latino">Latino</option>
                        <option value="Black">Black</option>
                        <option value="Asian">Asian</option>
                        <option value="Middle Eastern">Middle Eastern</option>
                        <option value="South Asian">South Asian</option>
                        <option value="Hispanic">Hispanic</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="survey-question">
                    <p><strong>History of jaundice at birth:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="jundice" value="no" required> No</label>
                        <label><input type="radio" name="jundice" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Family history of autism:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="austim" value="no" required> No</label>
                        <label><input type="radio" name="austim" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Country of residence:</strong></p>
                    <select name="contry_of_res" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Spain">Spain</option>
                        <option value="Egypt">Egypt</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>

            <!-- Behavioral Questions A1-A10 for Adults -->
            <div style="background: #f0f4f8; padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Adult Behavioral Assessment</h4>
                
                <div class="survey-question">
                    <p><strong>A1: Do you find it difficult to understand what other people are thinking or feeling?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A1_Score" value="0" required> No, I understand others well</label>
                        <label><input type="radio" name="A1_Score" value="1" required> Yes, difficulty understanding others</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A2: Do you find it hard to make and keep friends?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A2_Score" value="0" required> No, I make friends easily</label>
                        <label><input type="radio" name="A2_Score" value="1" required> Yes, difficulty with friendships</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A3: Do you prefer to be alone rather than with others?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A3_Score" value="0" required> No, I enjoy social interaction</label>
                        <label><input type="radio" name="A3_Score" value="1" required> Yes, I prefer being alone</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A4: Do you find it difficult to join in conversations with others?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A4_Score" value="0" required> No, I join conversations easily</label>
                        <label><input type="radio" name="A4_Score" value="1" required> Yes, difficulty joining conversations</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A5: Do you find it difficult to read between the lines or understand subtle hints?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A5_Score" value="0" required> No, I understand subtle communication</label>
                        <label><input type="radio" name="A5_Score" value="1" required> Yes, I miss subtle hints</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A6: Do you have very strong interests that you think about all the time?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A6_Score" value="0" required> No, I have balanced interests</label>
                        <label><input type="radio" name="A6_Score" value="1" required> Yes, very intense interests</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A7: Do you find it very upsetting when your daily routine is disrupted?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A7_Score" value="0" required> No, I handle routine changes well</label>
                        <label><input type="radio" name="A7_Score" value="1" required> Yes, routine changes upset me</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A8: Do you notice small details that others miss?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A8_Score" value="0" required> No, I notice typical details</label>
                        <label><input type="radio" name="A8_Score" value="1" required> Yes, I notice very small details</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A9: Do you find yourself doing things over and over again?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A9_Score" value="0" required> No, I don't repeat things excessively</label>
                        <label><input type="radio" name="A9_Score" value="1" required> Yes, I repeat behaviors</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A10: Do you find it difficult to imagine what it's like to be someone else?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A10_Score" value="0" required> No, I can imagine others' perspectives</label>
                        <label><input type="radio" name="A10_Score" value="1" required> Yes, difficulty with perspective-taking</label>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    This questionnaire is based on standardized ASD screening tools for adults (18+ years). Results are for screening purposes only and should not replace professional medical diagnosis.
                </p>
            </div>
        </div>
    `;
}

// Toddler Questionnaire (< 4 years) - comprehensive screening with A1-A10 format
function loadToddlerQuestionnaire(container) {
    container.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
            <h3 style="color: var(--primary); margin-bottom: 15px;">Toddler ASD Screening (< 4 years)</h3>
            <p style="margin-bottom: 20px; color: #666;">Please answer the following questions based on your toddler's typical behavior. This comprehensive screening helps identify early signs of developmental concerns.</p>
            
            <!-- Demographic Questions for Toddlers -->
            <div style="background: #fff9e6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Toddler Information</h4>
                
                <div class="survey-question">
                    <p><strong>Toddler's Gender:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="gender" value="m" required> Male</label>
                        <label><input type="radio" name="gender" value="f" required> Female</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Ethnicity:</strong></p>
                    <select name="ethnicity" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select ethnicity</option>
                        <option value="White-European">White-European</option>
                        <option value="Black">Black</option>
                        <option value="Asian">Asian</option>
                        <option value="Hispanic">Hispanic</option>
                        <option value="Latino">Latino</option>
                        <option value="Middle Eastern">Middle Eastern</option>
                        <option value="South Asian">South Asian</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="survey-question">
                    <p><strong>Was the toddler born with jaundice?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="jundice" value="no" required> No</label>
                        <label><input type="radio" name="jundice" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Family history of autism:</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="austim" value="no" required> No</label>
                        <label><input type="radio" name="austim" value="yes" required> Yes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>Country of residence:</strong></p>
                    <select name="contry_of_res" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>

            <!-- Behavioral Questions A1-A10 for Toddlers -->
            <div style="background: #ffe6e6; padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">Toddler Behavioral Assessment</h4>
                
                <div class="survey-question">
                    <p><strong>A1: Does your toddler respond to their name when called?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A1_Score" value="0" required> Yes, usually responds</label>
                        <label><input type="radio" name="A1_Score" value="1" required> No, rarely responds</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A2: Does your toddler make eye contact during interactions?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A2_Score" value="0" required> Yes, good eye contact</label>
                        <label><input type="radio" name="A2_Score" value="1" required> No, limited eye contact</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A3: Does your toddler use gestures like pointing or waving?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A3_Score" value="0" required> Yes, uses gestures</label>
                        <label><input type="radio" name="A3_Score" value="1" required> No, limited gestures</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A4: Does your toddler engage in pretend play (feeding dolls, toy phones)?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A4_Score" value="0" required> Yes, engages in pretend play</label>
                        <label><input type="radio" name="A4_Score" value="1" required> No, limited pretend play</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A5: Does your toddler show interest in other children?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A5_Score" value="0" required> Yes, interested in peers</label>
                        <label><input type="radio" name="A5_Score" value="1" required> No, limited peer interest</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A6: Does your toddler repeat unusual sounds or movements?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A6_Score" value="0" required> No, typical behaviors</label>
                        <label><input type="radio" name="A6_Score" value="1" required> Yes, repetitive behaviors</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A7: Does your toddler get upset by small changes in routine?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A7_Score" value="0" required> No, adapts well to changes</label>
                        <label><input type="radio" name="A7_Score" value="1" required> Yes, resists routine changes</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A8: Does your toddler have unusual reactions to sounds, textures, or lights?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A8_Score" value="0" required> No, typical sensory responses</label>
                        <label><input type="radio" name="A8_Score" value="1" required> Yes, unusual sensory reactions</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A9: Does your toddler bring objects to show you?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A9_Score" value="0" required> Yes, shares interests</label>
                        <label><input type="radio" name="A9_Score" value="1" required> No, doesn't share objects</label>
                    </div>
                </div>

                <div class="survey-question">
                    <p><strong>A10: Does your toddler use sounds or words to communicate needs?</strong></p>
                    <div class="radio-group">
                        <label><input type="radio" name="A10_Score" value="0" required> Yes, communicates needs</label>
                        <label><input type="radio" name="A10_Score" value="1" required> No, limited communication</label>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    This comprehensive toddler screening uses the A1-A10 format for consistency with other age groups. Early detection is crucial for intervention. Please consult with a developmental pediatrician for comprehensive assessment.
                </p>
            </div>
        </div>
    `;
}
