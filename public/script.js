/**
 * AI ROI Calculator - 3-Step Wizard Implementation
 * Step 1: Task Identification
 * Step 2: ROI Input Form  
 * Step 3: Results & Visualization
 */

// Global variables
let currentStep = 1;
let currentROIData = null;
let taskChart = null;
let taskDataPoints = [];

// DOM elements (will be initialized after DOM loads)
let step1, step2, step3;
let step1Indicator, step2Indicator, step3Indicator;
let taskNameInput, taskPerformerSelect;
let step1NextBtn, step2BackBtn, step2NextBtn, step3BackBtn, step3RestartBtn;

// Form data storage
let wizardData = {
    // Step 1
    taskName: '',
    taskPerformer: '',
    
    // Step 2
    taskFrequency: 0,
    frequencyUnit: 'per day',
    medianTime: 0,
    taskComplexityScore: '',
    currentActionMaturityScore: '',
    hourlyRate: 0,
    numSellers: 0,
    devCost: 0,
    maintenanceCost: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOM();
    initializeEventListeners();
    initializeModals();
    initializeChart();
    initializeConversationalStep1(); // Initialize the conversational interface
    initializePDFDownload(); // Initialize PDF download functionality
    updateProgressIndicator();
});

/**
 * Initialize DOM element references
 */
function initializeDOM() {
    // Step containers
    step1 = document.getElementById('step1');
    step2 = document.getElementById('step2');
    step3 = document.getElementById('step3');
    
    // Progress indicators
    step1Indicator = document.getElementById('step1-indicator');
    step2Indicator = document.getElementById('step2-indicator');
    step3Indicator = document.getElementById('step3-indicator');
    
    // Step 1 elements (conversational interface)
    taskNameInput = document.getElementById('taskNameInput'); // Updated to match new conversational textarea
    taskPerformerSelect = document.getElementById('taskPerformer'); // This doesn't exist in conversational mode, but kept for fallback
    step1NextBtn = document.getElementById('step1-next');
    
    // Step 2 elements
    step2BackBtn = document.getElementById('step2-back');
    step2NextBtn = document.getElementById('step2-next');
    
    // Step 3 elements
    step3BackBtn = document.getElementById('step3-back');
    step3RestartBtn = document.getElementById('step3-restart');
}

/**
 * Initialize event listeners for the wizard
 */
function initializeEventListeners() {
    // Step 1 - Task Identification (conversational mode handles its own validation)
    // Traditional form validation only for fallback mode
    if (taskPerformerSelect) {
        taskPerformerSelect.addEventListener('change', validateStep1);
    }
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', goToStep2);
    }
    
    // Step 2 - ROI Input
    step2BackBtn.addEventListener('click', goToStep1);
    step2NextBtn.addEventListener('click', goToStep3);
    
    // Step 2 form validation
    const step2Fields = ['taskFrequency', 'medianTime', 'taskComplexityScore', 'currentActionMaturityScore', 'hourlyRate', 'numSellers'];
    step2Fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateStep2);
            field.addEventListener('change', validateStep2);
        }
    });
    
    // Step 3 - Results
    step3BackBtn.addEventListener('click', goToStep2);
    step3RestartBtn.addEventListener('click', restartWizard);
}

/**
 * Step 1: Validate task identification fields
 */
function validateStep1() {
    // In conversational mode, validation is handled differently
    if (conversationState.isComplete) {
        return true;
    }
    
    // Fallback validation for traditional form mode (if elements exist)
    if (!taskNameInput || !taskPerformerSelect || !step1NextBtn) {
        return false;
    }
    
    const taskName = taskNameInput.value.trim();
    const taskPerformer = taskPerformerSelect.value;
    
    const isValid = taskName.length > 0 && taskPerformer !== '';
    step1NextBtn.disabled = !isValid;
    
    return isValid;
}

/**
 * Step 2: Validate ROI input fields
 */
function validateStep2() {
    const requiredFields = [
        'taskFrequency', 'medianTime', 'taskComplexityScore', 
        'currentActionMaturityScore', 'hourlyRate', 'numSellers'
    ];
    
    let isValid = true;
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value || field.value <= 0) {
            isValid = false;
            break;
        }
    }
    
    step2NextBtn.disabled = !isValid;
    return isValid;
}

/**
 * Navigate to Step 1
 */
function goToStep1() {
    currentStep = 1;
    showStep(1);
    updateProgressIndicator();
}

/**
 * Navigate to Step 2
 */
function goToStep2() {
    // Use conversational data if available, otherwise fall back to form validation
    if (conversationState.isComplete) {
        // Store conversational Step 1 data
        wizardData.taskName = conversationState.taskName;
        wizardData.taskPerformer = conversationState.taskPerformer;
    } else {
        if (!validateStep1()) return;
        
        // Store traditional form Step 1 data
        wizardData.taskName = taskNameInput.value.trim();
        wizardData.taskPerformer = taskPerformerSelect.value;
    }
    
    // Update Step 2 summary
    document.getElementById('taskSummary').textContent = wizardData.taskName;
    document.getElementById('performerSummary').textContent = wizardData.taskPerformer;
    
    currentStep = 2;
    showStep(2);
    updateProgressIndicator();
}

/**
 * Navigate to Step 3 and calculate results
 */
function goToStep3() {
    if (!validateStep2()) return;
    
    // Store Step 2 data
    collectStep2Data();
    
    // Calculate ROI
    const results = calculateROI();
    currentROIData = { ...wizardData, ...results };
    
    // Display results
    displayResults(results);
    
    // Update chart
    addTaskToChart(wizardData, results);
    
    // Update Step 3 summary
    document.getElementById('finalTaskSummary').textContent = wizardData.taskName;
    
    currentStep = 3;
    showStep(3);
    updateProgressIndicator();
}

/**
 * Restart the wizard
 */
function restartWizard() {
    // Reset form data
    wizardData = {
        taskName: '', taskPerformer: '', taskFrequency: 0, frequencyUnit: 'per day',
        medianTime: 0, taskComplexityScore: '', currentActionMaturityScore: '',
        hourlyRate: 0, numSellers: 0, devCost: 0, maintenanceCost: 0
    };
    
    // Reset form fields
    document.getElementById('taskName').value = '';
    document.getElementById('taskPerformer').value = '';
    document.getElementById('taskFrequency').value = '';
    document.getElementById('medianTime').value = '';
    document.getElementById('taskComplexityScore').value = '';
    document.getElementById('currentActionMaturityScore').value = '';
    document.getElementById('hourlyRate').value = '';
    document.getElementById('numSellers').value = '';
    document.getElementById('devCost').value = '';
    document.getElementById('maintenanceCost').value = '';
    
    // Go back to step 1
    goToStep1();
}

/**
 * Show specific step and hide others
 */
function showStep(stepNumber) {
    // Hide all steps
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    
    // Show current step
    switch(stepNumber) {
        case 1:
            step1.classList.remove('hidden');
            break;
        case 2:
            step2.classList.remove('hidden');
            break;
        case 3:
            step3.classList.remove('hidden');
            break;
    }
}

/**
 * Update progress indicator
 */
function updateProgressIndicator() {
    // Reset all indicators
    [step1Indicator, step2Indicator, step3Indicator].forEach(indicator => {
        indicator.classList.remove('text-blue-600', 'text-green-600');
        indicator.classList.add('text-gray-400');
        indicator.querySelector('span').classList.remove('bg-blue-600', 'bg-green-600', 'text-white');
        indicator.querySelector('span').classList.add('bg-white', 'border-gray-300');
    });
    
    // Update current step
    const indicators = [step1Indicator, step2Indicator, step3Indicator];
    for (let i = 0; i < currentStep; i++) {
        const indicator = indicators[i];
        const stepSpan = indicator.querySelector('span');
        
        if (i < currentStep - 1) {
            // Completed step
            indicator.classList.remove('text-gray-400');
            indicator.classList.add('text-green-600');
            stepSpan.classList.remove('bg-white', 'border-gray-300');
            stepSpan.classList.add('bg-green-600', 'text-white');
        } else {
            // Current step
            indicator.classList.remove('text-gray-400');
            indicator.classList.add('text-blue-600');
            stepSpan.classList.remove('bg-white', 'border-gray-300');
            stepSpan.classList.add('bg-blue-600', 'text-white');
        }
    }
}

// =============================================================================
// CONVERSATIONAL STEP 1 FUNCTIONALITY
// =============================================================================

/**
 * Conversation state for Step 1
 */
let conversationState = {
    taskName: '',
    taskPerformer: '',
    currentQuestion: 1, // 1 = task name, 2 = role selection
    isComplete: false
};

/**
 * Initialize conversational Step 1 interface
 * Sets up the chat-style conversation flow for task identification
 */
function initializeConversationalStep1() {
    const taskInput = document.getElementById('taskNameInput');
    const continueBtn = document.getElementById('continue-to-details-btn');
    const aiSuggestionsBtn = document.getElementById('get-ai-suggestions-btn');
    const proceedBtn = document.getElementById('proceed-to-step2-btn');
    
    // Get all conversation elements
    const initialQuestion = document.getElementById('initial-question');
    const taskInputCard = document.getElementById('task-input-card');
    const userTaskResponse = document.getElementById('user-task-response');
    const systemFollowup = document.getElementById('system-followup');
    const userRoleResponse = document.getElementById('user-role-response');
    const systemCompletion = document.getElementById('system-completion');
    const downArrow = document.getElementById('down-arrow');
    
    // Skip initialization if already complete
    if (conversationState.isComplete) {
        return;
    }
    
    // Enable continue button when user types
    taskInput.addEventListener('input', () => {
        const hasText = taskInput.value.trim().length > 0;
        continueBtn.disabled = !hasText;
    });
    
    // Handle Enter key in textarea
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!continueBtn.disabled) {
                handleContinueToDetails();
            }
        }
    });
    
    // Handle continue to details button
    continueBtn.addEventListener('click', handleContinueToDetails);
    
    // Handle AI suggestions button
    aiSuggestionsBtn.addEventListener('click', handleAISuggestions);
    
    // Handle role selection
    document.querySelectorAll('.role-chip').forEach(chip => {
        chip.addEventListener('click', () => handleRoleSelection(chip));
    });
    
    // Handle proceed to step 2 button
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            conversationState.isComplete = true;
            goToStep2();
        });
    }
    
    /**
     * Handle continue to details button click
     * Shows user's task response and system follow-up
     */
    function handleContinueToDetails() {
        const taskValue = taskInput.value.trim();
        if (!taskValue) return;
        
        // Store the task name
        conversationState.taskName = taskValue;
        
        // Start the conversation animation sequence
        startConversationFlow(taskValue);
    }
    
    /**
     * Handle AI suggestions button click
     * This could integrate with OpenAI API to suggest task ideas
     */
    function handleAISuggestions() {
        // For now, just populate with a sample task
        taskInput.value = "I need help drafting personalized sales emails to potential customers based on their company information and our product offerings...";
        
        // Enable the continue button
        continueBtn.disabled = false;
        
        // Add a subtle animation to draw attention
        taskInput.classList.add('ring-2', 'ring-purple-300');
        setTimeout(() => {
            taskInput.classList.remove('ring-2', 'ring-purple-300');
        }, 2000);
        
        // Store the suggested task
        conversationState.taskName = taskInput.value.trim();
    }
    
    /**
     * Start the conversation flow animation
     * @param {string} taskValue - The user's task description
     */
    function startConversationFlow(taskValue) {
        // 1. Fade out initial elements
        initialQuestion.classList.add('conversation-transition', 'fade-out');
        downArrow.classList.add('conversation-transition', 'fade-out');
        
        setTimeout(() => {
            initialQuestion.style.display = 'none';
            downArrow.style.display = 'none';
            
            // 2. Show user's task response
            document.getElementById('user-task-text').textContent = taskValue;
            userTaskResponse.classList.remove('hidden');
            userTaskResponse.classList.add('conversation-element');
            
            // 3. Hide the input card after a moment
            setTimeout(() => {
                taskInputCard.classList.add('conversation-transition', 'fade-out');
                setTimeout(() => {
                    taskInputCard.style.display = 'none';
                    
                    // 4. Show system follow-up question
                    systemFollowup.classList.remove('hidden');
                    systemFollowup.classList.add('conversation-element', 'delay-1');
                }, 400);
            }, 800);
        }, 400);
    }
    
    /**
     * Handle role selection
     * Shows user's role response and completion message
     */
    function handleRoleSelection(selectedChip) {
        const role = selectedChip.dataset.role;
        
        // Store the role
        conversationState.taskPerformer = role;
        
        // Visual feedback for selection
        document.querySelectorAll('.role-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        selectedChip.classList.add('selected');
        
        // Continue conversation flow
        setTimeout(() => {
            // Show user's role response
            document.getElementById('user-role-text').textContent = role;
            userRoleResponse.classList.remove('hidden');
            userRoleResponse.classList.add('conversation-element');
            
            // Hide the system follow-up after a moment
            setTimeout(() => {
                systemFollowup.classList.add('conversation-transition', 'fade-out');
                setTimeout(() => {
                    systemFollowup.style.display = 'none';
                    
                    // Show completion message
                    systemCompletion.classList.remove('hidden');
                    systemCompletion.classList.add('conversation-element', 'delay-1');
                }, 400);
            }, 800);
        }, 300);
    }
}

/**
 * Collect data from Step 2 form
 */
function collectStep2Data() {
    wizardData.taskFrequency = parseFloat(document.getElementById('taskFrequency').value);
    wizardData.frequencyUnit = document.getElementById('frequencyUnit').value;
    wizardData.medianTime = parseFloat(document.getElementById('medianTime').value);
    wizardData.taskComplexityScore = document.getElementById('taskComplexityScore').value;
    wizardData.currentActionMaturityScore = document.getElementById('currentActionMaturityScore').value;
    wizardData.hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
    wizardData.numSellers = parseFloat(document.getElementById('numSellers').value);
    wizardData.devCost = parseFloat(document.getElementById('devCost').value) || 0;
    wizardData.maintenanceCost = parseFloat(document.getElementById('maintenanceCost').value) || 0;
}

/**
 * Calculate ROI for both current and potential scenarios
 * Current = baseline scenario (minimal AI automation)
 * Potential = optimized scenario (full AI automation potential)
 */
function calculateROI() {
    // Convert frequency to annual
    const annualFrequency = convertToAnnual(wizardData.taskFrequency, wizardData.frequencyUnit);
    
    // Base calculations
    const timeSavingsPerTask = wizardData.medianTime / 60; // Convert minutes to hours
    const trainingCost = wizardData.devCost * 0.2;
    const totalCosts = wizardData.devCost + wizardData.maintenanceCost + trainingCost;
    
    // Get complexity and maturity scores for potential calculations
    const complexityScore = parseFloat(document.getElementById('taskComplexitySelect')?.value || 3);
    const maturityScore = parseFloat(document.getElementById('actionMaturitySelect')?.value || 3);
    
    // CURRENT SCENARIO (Conservative automation benefits)
    // Assume current AI tools provide 20-40% efficiency gains
    const currentEfficiencyGain = 0.30; // 30% baseline efficiency
    const currentTimeSavings = timeSavingsPerTask * annualFrequency * wizardData.numSellers * currentEfficiencyGain;
    const currentCostSavings = currentTimeSavings * wizardData.hourlyRate;
    const currentAgentROI = totalCosts > 0 ? ((currentCostSavings - totalCosts) / totalCosts) * 100 : 0;
    const currentOrgROI = currentCostSavings > 0 ? ((currentCostSavings - totalCosts) / currentCostSavings) * 100 : 0;
    
    // POTENTIAL SCENARIO (Optimized automation based on complexity and maturity)
    // Calculate potential efficiency based on task complexity and action maturity
    const potentialEfficiencyGain = calculatePotentialEfficiency(complexityScore, maturityScore);
    const potentialTimeSavings = timeSavingsPerTask * annualFrequency * wizardData.numSellers * potentialEfficiencyGain;
    const potentialCostSavings = potentialTimeSavings * wizardData.hourlyRate;
    const potentialAgentROI = totalCosts > 0 ? ((potentialCostSavings - totalCosts) / totalCosts) * 100 : 0;
    const potentialOrgROI = potentialCostSavings > 0 ? ((potentialCostSavings - totalCosts) / potentialCostSavings) * 100 : 0;
    
    // Calculate improvements
    const timeSavingsIncrease = potentialTimeSavings - currentTimeSavings;
    const costSavingsIncrease = potentialCostSavings - currentCostSavings;
    const agentROIIncrease = potentialAgentROI - currentAgentROI;
    const orgROIIncrease = potentialOrgROI - currentOrgROI;
    
    return {
        current: {
            timeSavings: Math.round(currentTimeSavings * 100) / 100,
            costSavings: Math.round(currentCostSavings * 100) / 100,
            agentROI: Math.round(currentAgentROI * 100) / 100,
            orgROI: Math.round(currentOrgROI * 100) / 100
        },
        potential: {
            timeSavings: Math.round(potentialTimeSavings * 100) / 100,
            costSavings: Math.round(potentialCostSavings * 100) / 100,
            agentROI: Math.round(potentialAgentROI * 100) / 100,
            orgROI: Math.round(potentialOrgROI * 100) / 100
        },
        improvements: {
            timeSavings: Math.round(timeSavingsIncrease * 100) / 100,
            costSavings: Math.round(costSavingsIncrease * 100) / 100,
            agentROI: Math.round(agentROIIncrease * 100) / 100,
            orgROI: Math.round(orgROIIncrease * 100) / 100
        },
        totalCosts: Math.round(totalCosts * 100) / 100,
        efficiencyGains: {
            current: Math.round(currentEfficiencyGain * 100),
            potential: Math.round(potentialEfficiencyGain * 100)
        }
    };
}

/**
 * Calculate potential efficiency gain based on task complexity and action maturity
 * Higher maturity and lower complexity = higher automation potential
 */
function calculatePotentialEfficiency(complexity, maturity) {
    // Base efficiency mapping
    // Low complexity + High maturity = High automation potential (60-85%)
    // High complexity + Low maturity = Lower automation potential (25-45%)
    
    // Maturity factor (higher is better for automation)
    const maturityMultiplier = maturity / 5; // 0.2 to 1.0
    
    // Complexity factor (lower complexity is better for automation)
    const complexityPenalty = (6 - complexity) / 5; // 0.2 to 1.0
    
    // Calculate potential efficiency (40% to 85% range)
    const baseEfficiency = 0.40; // 40% minimum
    const additionalEfficiency = 0.45; // Up to 45% additional
    
    const potentialEfficiency = baseEfficiency + (additionalEfficiency * maturityMultiplier * complexityPenalty);
    
    // Cap at 85% maximum efficiency
    return Math.min(potentialEfficiency, 0.85);
}

/**
 * Convert task frequency to annual frequency
 */
function convertToAnnual(frequency, unit) {
    switch (unit) {
        case 'per day': return frequency * 365;
        case 'per week': return frequency * 52;
        case 'per month': return frequency * 12;
        case 'per year': return frequency;
        default: return frequency;
    }
}

/**
 * Display calculation results for both current and potential scenarios
 */
function displayResults(results) {
    // Current Performance Results
    document.getElementById('currentTimeSavings').textContent = results.current.timeSavings.toLocaleString();
    document.getElementById('currentCostSavings').textContent = `$${results.current.costSavings.toLocaleString()}`;
    document.getElementById('currentAgentROI').textContent = `$${results.current.agentROI.toLocaleString()}`;
    document.getElementById('currentOrgROI').textContent = `$${results.current.orgROI.toLocaleString()}`;
    
    // Potential Performance Results
    document.getElementById('potentialTimeSavings').textContent = results.potential.timeSavings.toLocaleString();
    document.getElementById('potentialCostSavings').textContent = `$${results.potential.costSavings.toLocaleString()}`;
    document.getElementById('potentialAgentROI').textContent = `$${results.potential.agentROI.toLocaleString()}`;
    document.getElementById('potentialOrgROI').textContent = `$${results.potential.orgROI.toLocaleString()}`;
    
    // Improvement indicators (shown in potential cards)
    const timeSavingsIncreasePercent = results.current.timeSavings > 0 ? 
        Math.round((results.improvements.timeSavings / results.current.timeSavings) * 100) : 0;
    const costSavingsIncreasePercent = results.current.costSavings > 0 ? 
        Math.round((results.improvements.costSavings / results.current.costSavings) * 100) : 0;
    
    document.getElementById('timeSavingsIncrease').textContent = 
        `+${timeSavingsIncreasePercent}% improvement`;
    document.getElementById('costSavingsIncrease').textContent = 
        `+${costSavingsIncreasePercent}% improvement`;
    document.getElementById('agentROIIncrease').textContent = 
        `+$${results.improvements.agentROI.toLocaleString()} more ROI`;
    document.getElementById('orgROIIncrease').textContent = 
        `+$${results.improvements.orgROI.toLocaleString()} more ROI`;
    
    // Efficiency Summary
    document.getElementById('timeEfficiencyGain').textContent = 
        `${results.efficiencyGains.current}% → ${results.efficiencyGains.potential}% efficiency`;
    document.getElementById('costEfficiencyGain').textContent = 
        `$${results.improvements.costSavings.toLocaleString()} additional annual savings`;
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.add('hidden');
}

// =============================================================================
// CHART FUNCTIONALITY (Keeping existing chart implementation)
// =============================================================================

/**
 * Initialize the scatter chart
 */
function initializeChart() {
    const ctx = document.getElementById('taskScatterChart').getContext('2d');
    
    taskChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Tasks',
                data: [],
                backgroundColor: [],
                borderColor: [],
                pointRadius: [],
                pointHoverRadius: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0.5,
                    max: 5.5,
                    title: {
                        display: true,
                        text: 'Action Maturity Score'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
                            return labels[value] || value;
                        }
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    title: {
                        display: true,
                        text: 'Task Complexity Score'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
                            return labels[value] || value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = taskDataPoints[context.dataIndex];
                            return [
                                `Task: ${dataPoint.taskName}`,
                                `ROI: ${dataPoint.agentROI}%`,
                                `Time Savings: ${dataPoint.timeSavings} hours/year`,
                                `Cost Savings: $${dataPoint.costSavings.toLocaleString()}`
                            ];
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Add task data point to chart
 */
function addTaskToChart(formData, results) {
    // Convert qualitative scores to numeric values
    const qualitativeToNumeric = {
        'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
    };
    
    const maturityScore = qualitativeToNumeric[formData.currentActionMaturityScore];
    const complexityScore = qualitativeToNumeric[formData.taskComplexityScore];
    
    // Create data point
    const dataPoint = {
        x: maturityScore,
        y: complexityScore,
        taskName: formData.taskName,
        agentROI: results.agentROI,
        timeSavings: results.timeSavings,
        costSavings: results.costSavings
    };
    
    // Store data point for tooltip reference
    taskDataPoints.push(dataPoint);
    
    // Determine point color based on ROI
    const pointColor = getROIColor(results.agentROI);
    
    // Determine point size based on time savings (normalized between 5-20)
    const pointSize = Math.max(5, Math.min(20, (results.timeSavings / 1000) * 10 + 5));
    
    // Add to chart dataset
    taskChart.data.datasets[0].data.push(dataPoint);
    taskChart.data.datasets[0].backgroundColor.push(pointColor);
    taskChart.data.datasets[0].borderColor.push(pointColor);
    taskChart.data.datasets[0].pointRadius.push(pointSize);
    taskChart.data.datasets[0].pointHoverRadius.push(pointSize + 3);
    
    // Update chart
    taskChart.update();
}

/**
 * Get color based on ROI value
 */
function getROIColor(roi) {
    // Color scale based on ROI percentage
    if (roi >= 500) return 'rgba(34, 197, 94, 0.8)';      // Green - Excellent ROI
    if (roi >= 200) return 'rgba(59, 130, 246, 0.8)';     // Blue - Good ROI
    if (roi >= 100) return 'rgba(168, 85, 247, 0.8)';     // Purple - Decent ROI
    if (roi >= 50) return 'rgba(245, 158, 11, 0.8)';      // Orange - Moderate ROI
    if (roi >= 0) return 'rgba(34, 197, 94, 0.6)';        // Light Green - Positive ROI
    return 'rgba(239, 68, 68, 0.8)';                      // Red - Negative ROI
}

// =============================================================================
// MODAL FUNCTIONALITY (Keeping existing modal implementation)
// =============================================================================

/**
 * Initialize modal functionality
 */
function initializeModals() {
    // Initialize Task Complexity Modal (Step-by-step)
    initializeComplexityModal();
    
    // Initialize Action Maturity Modal (keep existing)
    initializeActionMaturityModal();
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('taskComplexityModal');
            closeModal('actionMaturityModal');
        }
    });
}

/**
 * Initialize the step-by-step complexity modal
 */
function initializeComplexityModal() {
    // Modal state management
    let complexityCurrentStep = 1;
    const complexitySelections = {
        steps: null,
        judgment: null,
        dataSources: null
    };
    
    // Get DOM elements
    const modal = document.getElementById('taskComplexityModal');
    const overlay = document.getElementById('taskComplexityModalOverlay');
    const closeBtn = document.getElementById('closeTaskComplexityModal');
    const backBtn = document.getElementById('complexity-back-btn');
    const nextBtn = document.getElementById('complexity-next-btn');
    const finishBtn = document.getElementById('complexity-finish-btn');
    
    // Progress indicators
    const step1Indicator = document.getElementById('complexity-step-1-indicator');
    const step2Indicator = document.getElementById('complexity-step-2-indicator');
    const step3Indicator = document.getElementById('complexity-step-3-indicator');
    const progressBar = document.getElementById('complexity-progress-bar');
    
    // Step containers
    const step1Container = document.getElementById('complexity-step-1');
    const step2Container = document.getElementById('complexity-step-2');
    const step3Container = document.getElementById('complexity-step-3');
    
    /**
     * Open complexity modal
     */
    function openComplexityModal() {
        modal.classList.remove('hidden');
        resetComplexityModal();
    }
    
    /**
     * Close complexity modal
     */
    function closeComplexityModal() {
        modal.classList.add('hidden');
        resetComplexityModal();
    }
    
    /**
     * Reset modal to initial state
     */
    function resetComplexityModal() {
        complexityCurrentStep = 1;
        complexitySelections.steps = null;
        complexitySelections.judgment = null;
        complexitySelections.dataSources = null;
        
        // Clear all selections
        document.querySelectorAll('.complexity-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        showComplexityStep(1);
        updateComplexityProgress();
        updateComplexityButtons();
    }
    
    /**
     * Show specific step and hide others
     */
    function showComplexityStep(stepNumber) {
        // Hide all steps
        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');
        
        // Show current step
        switch(stepNumber) {
            case 1:
                step1Container.classList.remove('hidden');
                break;
            case 2:
                step2Container.classList.remove('hidden');
                break;
            case 3:
                step3Container.classList.remove('hidden');
                break;
        }
        
        complexityCurrentStep = stepNumber;
    }
    
    /**
     * Update progress indicator
     */
    function updateComplexityProgress() {
        const indicators = [step1Indicator, step2Indicator, step3Indicator];
        const labels = [
            step1Indicator.nextElementSibling,
            step2Indicator.nextElementSibling,
            step3Indicator.nextElementSibling
        ];
        
        // Reset all indicators
        indicators.forEach((indicator, index) => {
            indicator.className = 'flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full bg-white text-gray-400 text-sm font-medium mr-2';
            labels[index].className = 'text-sm font-medium text-gray-400';
        });
        
        // Update based on current step
        for (let i = 0; i < complexityCurrentStep; i++) {
            if (i < complexityCurrentStep - 1) {
                // Completed step
                indicators[i].className = 'flex items-center justify-center w-8 h-8 border-2 border-green-600 rounded-full bg-green-600 text-white text-sm font-medium mr-2';
                labels[i].className = 'text-sm font-medium text-green-600';
            } else {
                // Current step
                indicators[i].className = 'flex items-center justify-center w-8 h-8 border-2 border-blue-600 rounded-full bg-blue-600 text-white text-sm font-medium mr-2';
                labels[i].className = 'text-sm font-medium text-blue-600';
            }
        }
        
        // Update progress bar
        const progressPercentage = (complexityCurrentStep / 3) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    /**
     * Update button states
     */
    function updateComplexityButtons() {
        // Back button
        if (complexityCurrentStep === 1) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }
        
        // Next/Finish buttons
        if (complexityCurrentStep === 3) {
            nextBtn.classList.add('hidden');
            finishBtn.classList.remove('hidden');
            finishBtn.disabled = !complexitySelections.dataSources;
        } else {
            nextBtn.classList.remove('hidden');
            finishBtn.classList.add('hidden');
            
            // Enable/disable next button based on selection
            const hasSelection = 
                (complexityCurrentStep === 1 && complexitySelections.steps) ||
                (complexityCurrentStep === 2 && complexitySelections.judgment);
            nextBtn.disabled = !hasSelection;
        }
    }
    
    /**
     * Calculate final complexity score
     * Returns a qualitative score (Very Low, Low, Medium, High, Very High)
     */
    function calculateComplexityScore() {
        if (!complexitySelections.steps || !complexitySelections.judgment || !complexitySelections.dataSources) {
            return 'Medium'; // Default fallback
        }
        
        // Get numeric values from selections
        const stepsValue = complexitySelections.steps;
        const judgmentValue = complexitySelections.judgment;
        const dataSourcesValue = complexitySelections.dataSources;
        
        // Calculate average score (1-5 scale)
        const averageScore = (stepsValue + judgmentValue + dataSourcesValue) / 3;
        
        // Convert to qualitative scale
        if (averageScore >= 4.5) return 'Very High';
        if (averageScore >= 3.5) return 'High';
        if (averageScore >= 2.5) return 'Medium';
        if (averageScore >= 1.5) return 'Low';
        return 'Very Low';
    }
    
    // Event Listeners
    
    // Open modal
    document.getElementById('openTaskComplexityModal').addEventListener('click', openComplexityModal);
    
    // Close modal
    closeBtn.addEventListener('click', closeComplexityModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeComplexityModal();
    });
    
    // Navigation buttons
    backBtn.addEventListener('click', () => {
        if (complexityCurrentStep > 1) {
            showComplexityStep(complexityCurrentStep - 1);
            updateComplexityProgress();
            updateComplexityButtons();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (complexityCurrentStep < 3) {
            showComplexityStep(complexityCurrentStep + 1);
            updateComplexityProgress();
            updateComplexityButtons();
        }
    });
    
    finishBtn.addEventListener('click', () => {
        const complexityScore = calculateComplexityScore();
        document.getElementById('taskComplexityScore').value = complexityScore;
        closeComplexityModal();
        validateStep2(); // Re-validate step 2 after updating complexity
    });
    
    // Option selection handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.complexity-option')) {
            const option = e.target.closest('.complexity-option');
            const step = option.dataset.step;
            const value = option.dataset.value;
            const numericValue = parseInt(option.dataset.numeric);
            
            // Clear previous selections for this step
            document.querySelectorAll(`[data-step="${step}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select current option
            option.classList.add('selected');
            
            // Store selection
            switch(step) {
                case '1':
                    complexitySelections.steps = numericValue;
                    break;
                case '2':
                    complexitySelections.judgment = numericValue;
                    break;
                case '3':
                    complexitySelections.dataSources = numericValue;
                    break;
            }
            
            // Update buttons
            updateComplexityButtons();
        }
    });
}

/**
 * Initialize the step-by-step action maturity modal
 */
function initializeActionMaturityModal() {
    // Modal state management
    let maturityCurrentStep = 1;
    const maturitySelections = {
        reliability: null,
        outputQuality: null,
        intentUnderstanding: null
    };
    
    // Get DOM elements
    const modal = document.getElementById('actionMaturityModal');
    const overlay = document.getElementById('actionMaturityModalOverlay');
    const closeBtn = document.getElementById('closeActionMaturityModal');
    const backBtn = document.getElementById('maturity-back-btn');
    const nextBtn = document.getElementById('maturity-next-btn');
    const finishBtn = document.getElementById('maturity-finish-btn');
    
    // Progress indicators
    const step1Indicator = document.getElementById('maturity-step-1-indicator');
    const step2Indicator = document.getElementById('maturity-step-2-indicator');
    const step3Indicator = document.getElementById('maturity-step-3-indicator');
    const progressBar = document.getElementById('maturity-progress-bar');
    
    // Step containers
    const step1Container = document.getElementById('maturity-step-1');
    const step2Container = document.getElementById('maturity-step-2');
    const step3Container = document.getElementById('maturity-step-3');
    
    /**
     * Open maturity modal
     */
    function openMaturityModal() {
        modal.classList.remove('hidden');
        resetMaturityModal();
    }
    
    /**
     * Close maturity modal
     */
    function closeMaturityModal() {
        modal.classList.add('hidden');
        resetMaturityModal();
    }
    
    /**
     * Reset modal to initial state
     */
    function resetMaturityModal() {
        maturityCurrentStep = 1;
        maturitySelections.reliability = null;
        maturitySelections.outputQuality = null;
        maturitySelections.intentUnderstanding = null;
        
        // Clear all selections
        document.querySelectorAll('.maturity-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        showMaturityStep(1);
        updateMaturityProgress();
        updateMaturityButtons();
    }
    
    /**
     * Show specific step and hide others
     */
    function showMaturityStep(stepNumber) {
        // Hide all steps
        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');
        
        // Show current step
        switch(stepNumber) {
            case 1:
                step1Container.classList.remove('hidden');
                break;
            case 2:
                step2Container.classList.remove('hidden');
                break;
            case 3:
                step3Container.classList.remove('hidden');
                break;
        }
        
        maturityCurrentStep = stepNumber;
    }
    
    /**
     * Update progress indicator
     */
    function updateMaturityProgress() {
        const indicators = [step1Indicator, step2Indicator, step3Indicator];
        const labels = [
            step1Indicator.nextElementSibling,
            step2Indicator.nextElementSibling,
            step3Indicator.nextElementSibling
        ];
        
        // Reset all indicators
        indicators.forEach((indicator, index) => {
            indicator.className = 'flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full bg-white text-gray-400 text-sm font-medium mr-2';
            labels[index].className = 'text-sm font-medium text-gray-400';
        });
        
        // Update based on current step
        for (let i = 0; i < maturityCurrentStep; i++) {
            if (i < maturityCurrentStep - 1) {
                // Completed step
                indicators[i].className = 'flex items-center justify-center w-8 h-8 border-2 border-green-600 rounded-full bg-green-600 text-white text-sm font-medium mr-2';
                labels[i].className = 'text-sm font-medium text-green-600';
            } else {
                // Current step
                indicators[i].className = 'flex items-center justify-center w-8 h-8 border-2 border-blue-600 rounded-full bg-blue-600 text-white text-sm font-medium mr-2';
                labels[i].className = 'text-sm font-medium text-blue-600';
            }
        }
        
        // Update progress bar
        const progressPercentage = (maturityCurrentStep / 3) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    /**
     * Update button states
     */
    function updateMaturityButtons() {
        // Back button
        if (maturityCurrentStep === 1) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }
        
        // Next/Finish buttons
        if (maturityCurrentStep === 3) {
            nextBtn.classList.add('hidden');
            finishBtn.classList.remove('hidden');
            finishBtn.disabled = !maturitySelections.intentUnderstanding;
        } else {
            nextBtn.classList.remove('hidden');
            finishBtn.classList.add('hidden');
            
            // Enable/disable next button based on selection
            const hasSelection = 
                (maturityCurrentStep === 1 && maturitySelections.reliability) ||
                (maturityCurrentStep === 2 && maturitySelections.outputQuality);
            nextBtn.disabled = !hasSelection;
        }
    }
    
    /**
     * Calculate final maturity score
     * Returns a qualitative score (Very Low, Low, Medium, High, Very High)
     */
    function calculateMaturityScore() {
        if (!maturitySelections.reliability || !maturitySelections.outputQuality || !maturitySelections.intentUnderstanding) {
            return 'Medium'; // Default fallback
        }
        
        // Get numeric values from selections
        const reliabilityValue = maturitySelections.reliability;
        const outputQualityValue = maturitySelections.outputQuality;
        const intentUnderstandingValue = maturitySelections.intentUnderstanding;
        
        // Calculate average score (1-5 scale)
        const averageScore = (reliabilityValue + outputQualityValue + intentUnderstandingValue) / 3;
        
        // Convert to qualitative scale
        if (averageScore >= 4.5) return 'Very High';
        if (averageScore >= 3.5) return 'High';
        if (averageScore >= 2.5) return 'Medium';
        if (averageScore >= 1.5) return 'Low';
        return 'Very Low';
    }
    
    // Event Listeners
    
    // Open modal
    document.getElementById('openCurrentActionMaturityModal').addEventListener('click', () => {
        window.currentActionMaturityTargetDropdown = 'currentActionMaturityScore';
        openMaturityModal();
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeMaturityModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeMaturityModal();
    });
    
    // Navigation buttons
    backBtn.addEventListener('click', () => {
        if (maturityCurrentStep > 1) {
            showMaturityStep(maturityCurrentStep - 1);
            updateMaturityProgress();
            updateMaturityButtons();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (maturityCurrentStep < 3) {
            showMaturityStep(maturityCurrentStep + 1);
            updateMaturityProgress();
            updateMaturityButtons();
        }
    });
    
    finishBtn.addEventListener('click', () => {
        const maturityScore = calculateMaturityScore();
        if (window.currentActionMaturityTargetDropdown) {
            document.getElementById(window.currentActionMaturityTargetDropdown).value = maturityScore;
        }
        closeMaturityModal();
        validateStep2(); // Re-validate step 2 after updating maturity
    });
    
    // Option selection handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.maturity-option')) {
            const option = e.target.closest('.maturity-option');
            const step = option.dataset.step;
            const value = option.dataset.value;
            const numericValue = parseInt(option.dataset.numeric);
            
            // Clear previous selections for this step
            document.querySelectorAll(`[data-step="${step}"].maturity-option`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select current option
            option.classList.add('selected');
            
            // Store selection
            switch(step) {
                case '1':
                    maturitySelections.reliability = numericValue;
                    break;
                case '2':
                    maturitySelections.outputQuality = numericValue;
                    break;
                case '3':
                    maturitySelections.intentUnderstanding = numericValue;
                    break;
            }
            
            // Update buttons
            updateMaturityButtons();
        }
    });
}

/**
 * Close any modal by ID
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

/**
 * PDF Report Generation Functions
 * Generate and download a professional PDF report with all ROI analysis data
 */

// PDF chart instance for rendering
let pdfChart = null;

/**
 * Initialize PDF download functionality
 * Sets up the download button event listener
 */
function initializePDFDownload() {
    const downloadBtn = document.getElementById('download-report-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generatePDFReport);
    }
}

/**
 * Generate and download the PDF report
 * This is the main function that orchestrates the PDF creation process
 */
async function generatePDFReport() {
    try {
        // Show loading state on button
        const downloadBtn = document.getElementById('download-report-btn');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `
            <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Generating PDF...
        `;
        downloadBtn.disabled = true;

        // Step 1: Populate PDF template with current data
        await populatePDFTemplate();

        // Step 2: Create and render chart for PDF
        await createPDFChart();

        // Step 3: Generate PDF using html2pdf
        const element = document.getElementById('pdf-report-content');
        
        // Configure PDF options for optimal output
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5], // inches: top, left, bottom, right
            filename: `AI-ROI-Analysis-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { 
                type: 'jpeg', 
                quality: 0.9 
            },
            html2canvas: { 
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
                logging: false
            },
            jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait' 
            }
        };

        // Generate and download the PDF
        await html2pdf().set(opt).from(element).save();

        // Clean up: destroy PDF chart instance
        if (pdfChart) {
            pdfChart.destroy();
            pdfChart = null;
        }

        // Restore button state
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;

        // Show success message
        showSuccessMessage('PDF report downloaded successfully!');

    } catch (error) {
        console.error('PDF generation error:', error);
        
        // Restore button state
        const downloadBtn = document.getElementById('download-report-btn');
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
        
        // Show error message
        showError('Failed to generate PDF report. Please try again.');
    }
}

/**
 * Populate the hidden PDF template with current analysis data
 * Fills in all the text fields and data points for the report
 */
async function populatePDFTemplate() {
    // Set generation date
    const now = new Date();
    document.getElementById('pdf-generation-date').textContent = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Populate task information
    document.getElementById('pdf-task-name').textContent = 
        conversationState.taskName || document.getElementById('taskNameInput')?.value || 'Not specified';
    
    document.getElementById('pdf-task-performer').textContent = 
        conversationState.taskPerformer || document.getElementById('taskPerformerSelect')?.value || 'Not specified';

    // Get complexity and maturity scores
    const complexityScore = document.getElementById('taskComplexitySelect')?.value || 'Not assessed';
    const maturityScore = document.getElementById('actionMaturitySelect')?.value || 'Not assessed';
    
    document.getElementById('pdf-task-complexity').textContent = 
        `${complexityScore} ${getComplexityLabel(complexityScore)}`;
    
    document.getElementById('pdf-action-maturity').textContent = 
        `${maturityScore} ${getMaturityLabel(maturityScore)}`;

    // Copy ROI metrics from the main results
    document.getElementById('pdf-time-savings').textContent = 
        document.getElementById('timeSavings')?.textContent || '-';
    
    document.getElementById('pdf-cost-savings').textContent = 
        document.getElementById('costSavings')?.textContent || '-';
    
    document.getElementById('pdf-agent-roi').textContent = 
        document.getElementById('agentROI')?.textContent || '-';
    
    document.getElementById('pdf-org-roi').textContent = 
        document.getElementById('orgROI')?.textContent || '-';

    // Generate recommendations based on ROI scores
    generateRecommendations();
}

/**
 * Create a Chart.js chart specifically for PDF export
 * This duplicates the main chart but optimized for PDF rendering
 */
async function createPDFChart() {
    const canvas = document.getElementById('pdf-chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for better PDF quality
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.width = '600px';
    canvas.style.height = '400px';

    // Get data from the main chart
    const mainChart = taskChart;
    if (!mainChart || !mainChart.data || !mainChart.data.datasets[0]) {
        // If no main chart data, create a placeholder
        pdfChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'No data available',
                    data: [],
                    backgroundColor: '#9ca3af'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Task Complexity vs Action Maturity',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Action Maturity Score'
                        },
                        min: 0,
                        max: 5
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Task Complexity Score'
                        },
                        min: 0,
                        max: 5
                    }
                }
            }
        });
        return;
    }

    // Clone the main chart data and configuration for PDF
    const chartData = JSON.parse(JSON.stringify(mainChart.data));
    const chartOptions = JSON.parse(JSON.stringify(mainChart.options));
    
    // Optimize chart options for PDF
    chartOptions.responsive = false;
    chartOptions.maintainAspectRatio = false;
    chartOptions.plugins.title.font = { size: 16, weight: 'bold' };
    chartOptions.animation = false; // Disable animations for PDF

    // Create the PDF chart
    pdfChart = new Chart(ctx, {
        type: 'scatter',
        data: chartData,
        options: chartOptions
    });

    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Generate recommendations based on ROI analysis
 * Creates contextual recommendations for the PDF report
 */
function generateRecommendations() {
    const recommendationsDiv = document.getElementById('pdf-recommendations');
    
    // Get ROI values for analysis
    const agentROIText = document.getElementById('agentROI')?.textContent || '0%';
    const orgROIText = document.getElementById('orgROI')?.textContent || '0%';
    
    // Extract numeric values
    const agentROI = parseFloat(agentROIText.replace(/[^\d.-]/g, ''));
    const orgROI = parseFloat(orgROIText.replace(/[^\d.-]/g, ''));
    
    let recommendations = [];
    
    // Generate recommendations based on ROI ranges
    if (agentROI >= 500) {
        recommendations.push(
            "🚀 Excellent automation candidate with exceptional ROI potential",
            "Prioritize immediate implementation of AI automation for this task",
            "Consider this task as a template for similar high-value automation opportunities"
        );
    } else if (agentROI >= 200) {
        recommendations.push(
            "✅ Strong automation candidate with good ROI potential",
            "Plan implementation within the next quarter",
            "Monitor results and optimize for even better performance"
        );
    } else if (agentROI >= 100) {
        recommendations.push(
            "⚡ Moderate automation potential worth considering",
            "Evaluate implementation alongside other priorities",
            "Look for ways to optimize the process before automation"
        );
    } else if (agentROI >= 50) {
        recommendations.push(
            "⚠️ Limited automation potential - proceed with caution",
            "Consider process improvements before automation",
            "May be better suited for partial automation or optimization"
        );
    } else {
        recommendations.push(
            "❌ Low automation potential based on current analysis",
            "Focus on process improvement and optimization first",
            "Re-evaluate after making operational improvements"
        );
    }

    // Add organizational context if available
    if (orgROI > agentROI * 5) {
        recommendations.push(
            "🏢 High organizational impact - consider enterprise-wide implementation"
        );
    }

    // Create HTML for recommendations
    const html = `
        <h3>Key Recommendations</h3>
        <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    `;
    
    recommendationsDiv.innerHTML = html;
}

/**
 * Helper function to get complexity label
 */
function getComplexityLabel(score) {
    const labels = {
        '1': '(Very Low)',
        '2': '(Low)',
        '3': '(Medium)',
        '4': '(High)',
        '5': '(Very High)'
    };
    return labels[score] || '';
}

/**
 * Helper function to get maturity label
 */
function getMaturityLabel(score) {
    const labels = {
        '1': '(Very Low)',
        '2': '(Low)',
        '3': '(Medium)',
        '4': '(High)',
        '5': '(Very High)'
    };
    return labels[score] || '';
}

/**
 * Show success message to user
 */
function showSuccessMessage(message) {
    // Create or update success message element
    let successEl = document.getElementById('successMessage');
    if (!successEl) {
        successEl = document.createElement('div');
        successEl.id = 'successMessage';
        successEl.className = 'fixed top-4 right-4 max-w-md bg-green-50 border border-green-200 rounded-lg p-4 z-50';
        successEl.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-green-800" id="successText">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button onclick="hideSuccess()" class="text-green-400 hover:text-green-600">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(successEl);
    } else {
        document.getElementById('successText').textContent = message;
        successEl.classList.remove('hidden');
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (successEl) {
            successEl.classList.add('hidden');
        }
    }, 5000);
}

/**
 * Hide success message
 */
function hideSuccess() {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.classList.add('hidden');
    }
}