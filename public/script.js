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
    initializePDFDownload(); // Initialize PDF download functionality
    updateProgressIndicator();
    
    // Ensure chart starts completely empty
    setTimeout(() => {
        clearChart();
    }, 200);
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
    
    // Step 1 elements
    taskNameInput = document.getElementById('taskName');
    taskPerformerSelect = document.getElementById('taskPerformer');
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
    // Step 1 - Task Identification
    if (taskNameInput) {
        taskNameInput.addEventListener('input', validateStep1);
    }
    if (taskPerformerSelect) {
        taskPerformerSelect.addEventListener('change', validateStep1);
    }
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', goToStep2);
    }
    
    // AI Writing Assistant
    initializeAIWritingAssistant();
    
    // Step 2 - ROI Input
    step2BackBtn.addEventListener('click', goToStep1);
    step2NextBtn.addEventListener('click', goToStep3);
    
    // Step 2 form validation
    const step2RequiredFields = ['taskFrequency', 'medianTime', 'taskComplexityScore', 'currentActionMaturityScore'];
    const step2OptionalFields = ['hourlyRate', 'numSellers', 'devCost', 'maintenanceCost'];
    
    // Add listeners for required fields
    step2RequiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateStep2);
            field.addEventListener('change', validateStep2);
        }
    });
    
    // Add listeners for optional fields (only validate if they have values)
    step2OptionalFields.forEach(fieldId => {
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
    // Required fields (time and complexity/maturity are required)
    const requiredFields = [
        'taskFrequency', 'medianTime', 'taskComplexityScore', 
        'currentActionMaturityScore'
    ];
    
    let isValid = true;
    
    // Check required fields
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value || field.value <= 0) {
            isValid = false;
            break;
        }
    }
    
    // Optional cost fields - validate if provided
    const optionalFields = ['hourlyRate', 'numSellers', 'devCost', 'maintenanceCost'];
    
    for (const fieldId of optionalFields) {
        const field = document.getElementById(fieldId);
        if (field && field.value && (isNaN(field.value) || field.value < 0)) {
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
    if (!validateStep1()) return;
    
    // Store Step 1 data
    wizardData.taskName = taskNameInput.value.trim();
    wizardData.taskPerformer = taskPerformerSelect.value;
    wizardData.organizationSize = document.getElementById('organizationSize').value || 'Not specified';
    
    // Update Step 2 summary
    document.getElementById('taskSummary').textContent = wizardData.taskName;
    document.getElementById('performerSummary').textContent = wizardData.taskPerformer;
    document.getElementById('organizationSummary').textContent = wizardData.organizationSize;
    
    // Remove any existing default values notice when moving to Step 2
    const existingNote = document.querySelector('#default-values-note');
    if (existingNote) {
        existingNote.remove();
    }
    
    currentStep = 2;
    showStep(2);
    updateProgressIndicator();
    
    // Pre-populate Step 2 fields based on task description
    prePopulateStep2Fields();
}

/**
 * Navigate to Step 3 and calculate results
 */
function goToStep3() {
    if (!validateStep2()) return;
    
    // Store Step 2 data
    collectStep2Data();
    
    // Populate Step 3 editable inputs
    populateStep3Inputs();
    
    // Calculate ROI
    const results = calculateROI();
    currentROIData = { ...wizardData, ...results };
    
    // Display results
    displayResults(results);
    
    // Update chart
    addTaskToChart(wizardData, results);
    
    // Clean any invalid data points from chart after adding new data
    setTimeout(() => {
        cleanChartData();
        if (taskChart) taskChart.update('none');
    }, 50);
    
    // Update Step 3 summary
    document.getElementById('finalTaskSummary').textContent = wizardData.taskName;
    
    currentStep = 3;
    showStep(3);
    
    // Initialize Step 3 real-time updates
    initializeStep3Updates();
    updateProgressIndicator();
    
    // Generate AI insights after ROI calculation completes
    // Add a delay to allow UI to settle before triggering insights
    setTimeout(() => {
        generateAIInsights(wizardData.taskName, {
            taskFrequency: wizardData.taskFrequency,
            frequencyUnit: wizardData.frequencyUnit,
            medianTime: wizardData.medianTime,
            complexityScore: wizardData.taskComplexityScore,
            maturityScore: wizardData.currentActionMaturityScore,
            currentROI: results.current,
            potentialROI: results.potential,
            timeSavings: results.potential.timeSavingsHours,
            costSavings: results.potential.costSavings,
            agentROI: results.potential.agentROI
        });
    }, 1000);
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
    
    // Remove any existing default values notice
    const existingNote = document.querySelector('#default-values-note');
    if (existingNote) {
        existingNote.remove();
    }
    
    // Hide AI insights section
    hideAIInsights();
    
    // Clear the chart of all data points
    clearChart();
    
    // Go back to step 1
    goToStep1();
}

/**
 * Populate Step 3 inputs with current wizard data
 */
function populateStep3Inputs() {
    // Populate basic task fields
    document.getElementById('step3TaskFrequency').value = wizardData.taskFrequency || '';
    document.getElementById('step3FrequencyUnit').value = wizardData.frequencyUnit || 'per day';
    document.getElementById('step3MedianTime').value = wizardData.medianTime || '';
    document.getElementById('step3TaskComplexityScore').value = wizardData.taskComplexityScore || '';
    document.getElementById('step3CurrentActionMaturityScore').value = wizardData.currentActionMaturityScore || '';
    
    // Populate cost fields
    document.getElementById('step3HourlyRate').value = wizardData.hourlyRate || '';
    document.getElementById('step3NumSellers').value = wizardData.numSellers || '';
    document.getElementById('step3DevCost').value = wizardData.devCost || '';
    document.getElementById('step3MaintenanceCost').value = wizardData.maintenanceCost || '';
}

/**
 * Initialize Step 3 real-time updates
 */
function initializeStep3Updates() {
    // Get all Step 3 input elements
    const step3Inputs = [
        'step3TaskFrequency', 'step3FrequencyUnit', 'step3MedianTime',
        'step3TaskComplexityScore', 'step3CurrentActionMaturityScore',
        'step3HourlyRate', 'step3NumSellers', 'step3DevCost', 'step3MaintenanceCost'
    ];
    
    // Add event listeners for real-time updates
    step3Inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', handleStep3InputChange);
            element.addEventListener('change', handleStep3InputChange);
        }
    });
}

/**
 * Handle input changes in Step 3 for real-time updates
 */
function handleStep3InputChange() {
    // Update wizard data from Step 3 inputs
    updateWizardDataFromStep3();
    
    // Recalculate and update results
    const results = calculateROI();
    currentROIData = { ...wizardData, ...results };
    
    // Update display
    displayResults(results);
    
    // Update chart
    updateTaskInChart(wizardData, results);
}

/**
 * Update wizard data from Step 3 inputs
 */
function updateWizardDataFromStep3() {
    // Update basic task fields
    wizardData.taskFrequency = parseFloat(document.getElementById('step3TaskFrequency').value) || 0;
    wizardData.frequencyUnit = document.getElementById('step3FrequencyUnit').value || 'per day';
    wizardData.medianTime = parseFloat(document.getElementById('step3MedianTime').value) || 0;
    wizardData.taskComplexityScore = document.getElementById('step3TaskComplexityScore').value || '';
    wizardData.currentActionMaturityScore = document.getElementById('step3CurrentActionMaturityScore').value || '';
    
    // Update cost fields
    wizardData.hourlyRate = parseFloat(document.getElementById('step3HourlyRate').value) || 0;
    wizardData.numSellers = parseFloat(document.getElementById('step3NumSellers').value) || 0;
    wizardData.devCost = parseFloat(document.getElementById('step3DevCost').value) || 0;
    wizardData.maintenanceCost = parseFloat(document.getElementById('step3MaintenanceCost').value) || 0;
}

/**
 * Update task in chart (replace existing point with new values)
 */
function updateTaskInChart(taskData, roiData) {
    if (!taskChart || !taskChart.data.datasets[0].data.length) {
        // If no existing data, add new point (with validation)
        addTaskToChart(taskData, roiData);
        return;
    }
    
    // Get complexity and maturity scores
    const complexityMap = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    const complexityScore = complexityMap[taskData.taskComplexityScore];
    const maturityScore = complexityMap[taskData.currentActionMaturityScore];
    
    // Fix: Validate scores before updating chart
    // Do not update if we don't have valid scores
    if (!complexityScore || !maturityScore || 
        isNaN(complexityScore) || isNaN(maturityScore)) {
        console.log('Skipping chart update - invalid scores:', {
            complexityScore,
            maturityScore,
            complexityInput: taskData.taskComplexityScore,
            maturityInput: taskData.currentActionMaturityScore
        });
        return;
    }
    
    // Update the last (most recent) data point
    const dataIndex = taskChart.data.datasets[0].data.length - 1;
    if (dataIndex >= 0) {
        taskChart.data.datasets[0].data[dataIndex] = {
            x: maturityScore,
            y: complexityScore,
            timeSavings: roiData.potential.timeSavingsHours,
            costSavings: roiData.potential.costSavings,
            roi: roiData.potential.agentROI
        };
        
        // Update visual properties
        const pointSize = Math.max(5, Math.min(15, roiData.potential.agentROI / 100));
        taskChart.data.datasets[0].pointRadius[dataIndex] = pointSize;
        taskChart.data.datasets[0].pointHoverRadius[dataIndex] = pointSize + 2;
        
        taskChart.update('none');
    }
}

/**
 * Show specific step and hide others
 */
function showStep(stepNumber) {
    // Hide all steps
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    
    // Get footer element
    const actionFooter = document.getElementById('action-footer');
    
    // Show current step
    switch(stepNumber) {
        case 1:
            step1.classList.remove('hidden');
            actionFooter.classList.add('hidden');
            break;
        case 2:
            step2.classList.remove('hidden');
            actionFooter.classList.add('hidden');
            break;
        case 3:
            step3.classList.remove('hidden');
            actionFooter.classList.remove('hidden');
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
 * Chat conversation state for Step 1
 */
let chatState = {
    taskName: '',
    taskPerformer: '',
    organizationSize: '',
    currentStep: 0, // 0 = welcome, 1 = task question, 2 = role question, 3 = org size question, 4 = complete
    isComplete: false
};

/**
 * Initialize the new chat interface for Step 1
 * Sets up event listeners and manages the conversation flow
 */
function initializeChatInterface() {
    const startChatBtn = document.getElementById('start-chat-btn');
    const sendTextBtn = document.getElementById('send-text-btn');
    const chatTextInput = document.getElementById('chat-text-input');
    const proceedBtn = document.getElementById('proceed-to-step2-btn');
    
    // Start conversation when user clicks start button
    startChatBtn.addEventListener('click', startConversation);
    
    // Enable send button when user types
    chatTextInput.addEventListener('input', () => {
        const hasText = chatTextInput.value.trim().length > 0;
        sendTextBtn.disabled = !hasText;
    });
    
    // Handle Enter key in textarea (send message)
    chatTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendTextBtn.disabled) {
                handleTextResponse();
            }
        }
    });
    
    // Handle send button click
    sendTextBtn.addEventListener('click', handleTextResponse);
    
    // Handle proceed to step 2 button
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            chatState.isComplete = true;
            goToStep2();
        });
    }
}

/**
 * Start the conversation by hiding welcome screen and showing first question
 */
function startConversation() {
    hideWelcomeScreen();
    
    // Show typing indicator then first question
    setTimeout(() => {
        showTypingIndicator();
        
        setTimeout(() => {
            hideTypingIndicator();
            addSystemMessage("What task do you want to automate?", "Please describe the specific process or workflow you'd like to improve with AI automation.");
            showTextInput();
            chatState.currentStep = 1;
        }, 1500); // Show typing for 1.5 seconds
    }, 300);
}

/**
 * Handle text response from user
 */
function handleTextResponse() {
    const input = document.getElementById('chat-text-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addUserMessage(message);
    
    // Store response and proceed to next step
    if (chatState.currentStep === 1) {
        chatState.taskName = message;
        hideTextInput();
        
        // Show typing indicator then role question
        setTimeout(() => {
            showTypingIndicator();
            
            setTimeout(() => {
                hideTypingIndicator();
                addSystemMessage("Great! Now, who typically performs this task in your organization?", "Select the role that best describes who usually handles this work:");
                showRoleOptions();
                chatState.currentStep = 2;
            }, 1200);
        }, 800);
    }
    
    // Clear input
    input.value = '';
    document.getElementById('send-text-btn').disabled = true;
}

/**
 * Handle role selection
 */
function handleRoleSelection(role) {
    chatState.taskPerformer = role;
    
    // Add user's role choice as a message
    addUserMessage(role);
    hideOptionButtons();
    
    // Show typing indicator then organization size question
    setTimeout(() => {
        showTypingIndicator();
        
        setTimeout(() => {
            hideTypingIndicator();
            addSystemMessage("What is your organization size?", "This helps us customize the ROI calculations for your specific context:");
            showOrgSizeOptions();
            chatState.currentStep = 3;
        }, 1200);
    }, 800);
}

/**
 * Handle organization size selection
 */
function handleOrgSizeSelection(orgSize) {
    chatState.organizationSize = orgSize;
    
    // Add user's org size choice as a message
    addUserMessage(orgSize);
    hideOptionButtons();
    
    // Show typing indicator then completion message
    setTimeout(() => {
        showTypingIndicator();
        
        setTimeout(() => {
            hideTypingIndicator();
            addSystemMessage("Perfect! I have all the information I need.", "Let's move on to calculating the ROI details for your task.");
            showFinalCTA();
            chatState.currentStep = 4;
            chatState.isComplete = true;
        }, 1200);
    }, 800);
}

/**
 * Add a system message to the chat
 */
function addSystemMessage(title, subtitle = '') {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message system';
    
    messageDiv.innerHTML = `
        <div class="flex justify-start">
            <div class="bg-white rounded-2xl px-6 py-4 max-w-2xl shadow-sm border border-gray-200">
                <p class="text-lg text-gray-800 font-medium">${title}</p>
                ${subtitle ? `<p class="text-gray-600 mt-2">${subtitle}</p>` : ''}
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Add a user message to the chat
 */
function addUserMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    
    messageDiv.innerHTML = `
        <div class="flex justify-end">
            <div class="bg-purple-600 text-white rounded-2xl px-6 py-4 max-w-2xl shadow-sm">
                <p class="text-lg">${message}</p>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Show role selection options
 */
function showRoleOptions() {
    const roles = [
        'Sales Representatives',
        'Customer Support',
        'Marketing Team',
        'Data Analysts',
        'Content Writers',
        'Admin Staff',
        'Developers',
        'HR Personnel',
        'Finance Team',
        'Operations Team',
        'Other'
    ];
    
    showOptionButtons(roles, handleRoleSelection);
}

/**
 * Show organization size options
 */
function showOrgSizeOptions() {
    const orgSizes = [
        '1–10 employees',
        '11–50 employees', 
        '51–200 employees',
        '201–500 employees',
        '500+ employees'
    ];
    
    showOptionButtons(orgSizes, handleOrgSizeSelection);
}

/**
 * Generic function to show option buttons
 */
function showOptionButtons(options, clickHandler) {
    const container = document.getElementById('option-buttons-container');
    const buttonsContainer = document.getElementById('option-buttons');
    
    // Clear existing buttons
    buttonsContainer.innerHTML = '';
    
    // Create buttons for each option
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.addEventListener('click', () => clickHandler(option));
        buttonsContainer.appendChild(button);
    });
    
    container.classList.remove('hidden');
}

/**
 * Utility functions for managing UI states
 */
function hideWelcomeScreen() {
    document.getElementById('welcome-screen').classList.add('hidden');
}

function showTextInput() {
    document.getElementById('text-input-container').classList.remove('hidden');
    document.getElementById('chat-text-input').focus();
}

function hideTextInput() {
    document.getElementById('text-input-container').classList.add('hidden');
}

function hideOptionButtons() {
    document.getElementById('option-buttons-container').classList.add('hidden');
}

function showFinalCTA() {
    document.getElementById('final-cta-container').classList.remove('hidden');
}

function showTypingIndicator() {
    document.getElementById('typing-indicator').classList.remove('hidden');
    scrollToBottom();
}

function hideTypingIndicator() {
    document.getElementById('typing-indicator').classList.add('hidden');
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// =============================================================================
// AI WRITING ASSISTANT
// =============================================================================

/**
 * Initialize AI Writing Assistant functionality
 */
function initializeAIWritingAssistant() {
    const aiWritingBtn = document.getElementById('ai-writing-btn');
    const aiModal = document.getElementById('ai-writing-modal');
    const closeAiModal = document.getElementById('close-ai-modal');
    const cancelAiModal = document.getElementById('cancel-ai-modal');
    const aiPrompt = document.getElementById('ai-prompt');
    const generateBtn = document.getElementById('generate-ai-description');
    const useDescriptionBtn = document.getElementById('use-ai-description');
    const aiSuggestions = document.getElementById('ai-suggestions');
    const aiGeneratedText = document.getElementById('ai-generated-text');
    const aiLoading = document.getElementById('ai-loading');
    
    // Open AI Writing Modal
    if (aiWritingBtn) {
        aiWritingBtn.addEventListener('click', () => {
            aiModal.classList.remove('hidden');
            aiPrompt.focus();
        });
    }
    
    // Close AI Writing Modal
    function closeModal() {
        aiModal.classList.add('hidden');
        aiPrompt.value = '';
        aiSuggestions.classList.add('hidden');
        useDescriptionBtn.classList.add('hidden');
        generateBtn.disabled = true;
    }
    
    if (closeAiModal) {
        closeAiModal.addEventListener('click', closeModal);
    }
    
    if (cancelAiModal) {
        cancelAiModal.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) {
            closeModal();
        }
    });
    
    // Enable/disable generate button based on input
    if (aiPrompt) {
        aiPrompt.addEventListener('input', () => {
            const hasText = aiPrompt.value.trim().length > 0;
            generateBtn.disabled = !hasText;
        });
    }
    
    // Generate AI description
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const prompt = aiPrompt.value.trim();
            if (!prompt) return;
            
            // Show loading state
            aiLoading.classList.remove('hidden');
            generateBtn.disabled = true;
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Help me write a detailed task description for ROI calculation. Based on this brief description: "${prompt}". 
                        
                        Please provide a clear, detailed description of the task that includes:
                        - What the task involves
                        - The key steps or processes
                        - What kind of output or result is expected
                        - Any relevant context about timing or frequency
                        
                        Write it as a professional task description suitable for ROI analysis. Keep it concise but comprehensive.`
                    })
                });
                
                const data = await response.json();
                
                if (data.response) {
                    // Show AI generated text
                    aiGeneratedText.textContent = data.response;
                    aiSuggestions.classList.remove('hidden');
                    useDescriptionBtn.classList.remove('hidden');
                } else {
                    throw new Error(data.error || 'Failed to generate description');
                }
            } catch (error) {
                console.error('Error generating AI description:', error);
                alert('Sorry, there was an error generating the description. Please try again or write your task description manually.');
            } finally {
                // Hide loading state
                aiLoading.classList.add('hidden');
                generateBtn.disabled = false;
            }
        });
    }
    
    // Use AI generated description
    if (useDescriptionBtn) {
        useDescriptionBtn.addEventListener('click', () => {
            const generatedText = aiGeneratedText.textContent;
            if (generatedText && taskNameInput) {
                taskNameInput.value = generatedText;
                validateStep1(); // Trigger validation to enable next button
                closeModal();
            }
        });
    }
}

/**
 * Pre-populate Step 2 fields based on task description from Step 1
 */
async function prePopulateStep2Fields() {
    const taskDescription = wizardData.taskName;
    const taskPerformer = wizardData.taskPerformer;
    const orgSize = wizardData.organizationSize;
    
    if (!taskDescription) return;
    
    // Show loading indicator
    showStep2LoadingState();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Based on this task description: "${taskDescription}", performed by: "${taskPerformer}", in a "${orgSize}" organization, please help me estimate the following values for ROI calculation:

1. Task Frequency: How often is this task typically performed? (provide a number and unit: per day/week/month/year)
2. Time per Task: How many minutes does this task typically take to complete manually?
3. Task Complexity: Rate the complexity (Very Low, Low, Medium, High, Very High) based on cognitive load, decision-making required, and skill level needed
4. Action Maturity: Rate how ready this type of task is for AI automation (Very Low, Low, Medium, High, Very High) based on how well-defined, repetitive, and rule-based it is

Please respond in this exact JSON format:
{
  "taskFrequency": number,
  "frequencyUnit": "per day|per week|per month|per year",
  "timePerTask": number,
  "taskComplexity": "Very Low|Low|Medium|High|Very High",
  "actionMaturity": "Very Low|Low|Medium|High|Very High",
  "reasoning": "Brief explanation of your estimates"
}

Focus on realistic, industry-standard estimates for this type of work.`
            })
        });
        
        const data = await response.json();
        
        if (data.response) {
            try {
                // Try to parse JSON from AI response
                const jsonMatch = data.response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const estimates = JSON.parse(jsonMatch[0]);
                    populateStep2Fields(estimates);
                } else {
                    // Fallback: parse from plain text response
                    parseAIResponseAndPopulate(data.response);
                }
            } catch (parseError) {
                console.log('Could not parse AI response as JSON, using fallback values');
                useDefaultEstimates();
            }
        } else {
            useDefaultEstimates();
        }
    } catch (error) {
        console.error('Error getting AI estimates:', error);
        useDefaultEstimates();
    } finally {
        hideStep2LoadingState();
    }
}

/**
 * Show loading state for Step 2 pre-population
 */
function showStep2LoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'step2-loading';
    loadingDiv.className = 'fixed top-0 left-0 right-0 bg-blue-100 border-b border-blue-200 p-3 z-40';
    loadingDiv.innerHTML = `
        <div class="max-w-4xl mx-auto flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-blue-700">AI is analyzing your task and pre-filling estimates...</span>
        </div>
    `;
    document.body.insertBefore(loadingDiv, document.body.firstChild);
}

/**
 * Hide loading state for Step 2 pre-population
 */
function hideStep2LoadingState() {
    const loadingDiv = document.getElementById('step2-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Populate Step 2 fields with AI estimates
 */
function populateStep2Fields(estimates) {
    // Set task frequency
    if (estimates.taskFrequency) {
        document.getElementById('taskFrequency').value = estimates.taskFrequency;
    }
    
    // Set frequency unit
    if (estimates.frequencyUnit) {
        document.getElementById('frequencyUnit').value = estimates.frequencyUnit;
    }
    
    // Set time per task
    if (estimates.timePerTask) {
        document.getElementById('medianTime').value = estimates.timePerTask;
    }
    
    // Set task complexity
    if (estimates.taskComplexity) {
        document.getElementById('taskComplexityScore').value = estimates.taskComplexity;
    }
    
    // Set action maturity
    if (estimates.actionMaturity) {
        document.getElementById('currentActionMaturityScore').value = estimates.actionMaturity;
    }
    
    // Show a notification about pre-population
    showPrePopulationNotification(estimates.reasoning || 'Values have been estimated based on your task description.');
    
    // Trigger validation to update UI
    validateStep2();
}

/**
 * Parse AI response and populate fields (fallback method)
 */
function parseAIResponseAndPopulate(response) {
    // Simple parsing for common patterns
    const estimates = {};
    
    // Look for frequency patterns
    const freqMatch = response.match(/(\d+)\s*(per\s+(?:day|week|month|year))/i);
    if (freqMatch) {
        estimates.taskFrequency = parseInt(freqMatch[1]);
        estimates.frequencyUnit = freqMatch[2].toLowerCase();
    }
    
    // Look for time patterns
    const timeMatch = response.match(/(\d+)\s*minutes?/i);
    if (timeMatch) {
        estimates.timePerTask = parseInt(timeMatch[1]);
    }
    
    // Look for complexity
    const complexityMatch = response.match(/(very\s+low|low|medium|high|very\s+high).*complexity/i);
    if (complexityMatch) {
        estimates.taskComplexity = complexityMatch[1].replace(/\s+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Look for maturity
    const maturityMatch = response.match(/(very\s+low|low|medium|high|very\s+high).*(?:maturity|automation)/i);
    if (maturityMatch) {
        estimates.actionMaturity = maturityMatch[1].replace(/\s+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    if (Object.keys(estimates).length > 0) {
        populateStep2Fields(estimates);
    } else {
        useDefaultEstimates();
    }
}

/**
 * Use default estimates when AI estimation fails
 */
function useDefaultEstimates() {
    const defaults = {
        taskFrequency: 5,
        frequencyUnit: 'per day',
        timePerTask: 15,
        taskComplexity: 'Medium',
        actionMaturity: 'Medium',
        reasoning: 'Using default estimates. Please review and adjust as needed.'
    };
    
    populateStep2Fields(defaults);
}

/**
 * Show notification about pre-population
 */
function showPrePopulationNotification(reasoning) {
    const notification = document.createElement('div');
    notification.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-6';
    notification.innerHTML = `
        <div class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
                <h4 class="text-sm font-medium text-green-900">Fields Pre-populated by AI</h4>
                <p class="text-sm text-green-800 mt-1">
                    ${reasoning} Please review and adjust these estimates as needed for accuracy.
                </p>
            </div>
        </div>
    `;
    
    // Insert after the task summary
    const taskSummary = document.querySelector('#step2 .bg-blue-50');
    if (taskSummary) {
        taskSummary.parentNode.insertBefore(notification, taskSummary.nextSibling);
        
        // Remove notification after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
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
    
    // Optional cost fields with default values
    wizardData.hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 50; // Default $50/hour
    wizardData.numSellers = parseFloat(document.getElementById('numSellers').value) || 1; // Default 1 person
    wizardData.devCost = parseFloat(document.getElementById('devCost').value) || 0; // Default $0
    wizardData.maintenanceCost = parseFloat(document.getElementById('maintenanceCost').value) || 0; // Default $0
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
    // Check if default values were used
    const hourlyRateInput = document.getElementById('hourlyRate');
    const numSellersInput = document.getElementById('numSellers');
    const devCostInput = document.getElementById('devCost');
    const maintenanceCostInput = document.getElementById('maintenanceCost');
    
    const usedDefaults = {
        hourlyRate: !hourlyRateInput || !hourlyRateInput.value,
        numSellers: !numSellersInput || !numSellersInput.value,
        devCost: !devCostInput || !devCostInput.value,
        maintenanceCost: !maintenanceCostInput || !maintenanceCostInput.value
    };
    
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
    
    // Show default values note if any defaults were used (only once)
    const defaultValuesUsed = Object.values(usedDefaults).some(used => used);
    if (defaultValuesUsed) {
        // Check if the notification already exists
        const existingNote = document.querySelector('#default-values-note');
        if (!existingNote) {
            const defaultNote = document.createElement('div');
            defaultNote.id = 'default-values-note';
            defaultNote.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4';
            defaultNote.innerHTML = `
                <div class="flex items-start">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h4 class="text-sm font-medium text-blue-900">Default Values Used</h4>
                        <p class="text-sm text-blue-800 mt-1">
                            Some cost information was not provided, so we used default values: 
                            ${usedDefaults.hourlyRate ? '$50/hour' : ''}${usedDefaults.hourlyRate && usedDefaults.numSellers ? ', ' : ''}${usedDefaults.numSellers ? '1 person' : ''}${(usedDefaults.hourlyRate || usedDefaults.numSellers) && (usedDefaults.devCost || usedDefaults.maintenanceCost) ? ', ' : ''}${usedDefaults.devCost ? '$0 development cost' : ''}${usedDefaults.devCost && usedDefaults.maintenanceCost ? ', ' : ''}${usedDefaults.maintenanceCost ? '$0 maintenance cost' : ''}.
                            <br><span class="font-medium">For more accurate results, please provide your actual cost information in Step 2.</span>
                        </p>
                    </div>
                </div>
            `;
            
            // Insert the note after the ROI results section
            const roiResultsSection = document.querySelector('#step3 .bg-white.rounded-lg.shadow-lg.p-8');
            if (roiResultsSection) {
                roiResultsSection.appendChild(defaultNote);
            }
        }
    }
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
 * Custom Chart.js plugin to draw ROI quadrant backgrounds and labels
 * This plugin renders colored quadrants before the scatter points are drawn
 */
const roiQuadrantPlugin = {
    id: 'roiQuadrantPlugin',
    beforeDatasetsDraw: function(chart) {
        const { ctx, chartArea: { left, top, right, bottom }, scales: { x, y } } = chart;
        
        // Save the current context state
        ctx.save();
        
        // Define quadrant boundaries (split at 3.0 for both axes)
        const xMid = x.getPixelForValue(3.0);
        const yMid = y.getPixelForValue(3.0);
        
        // Define quadrant colors with transparency
        const quadrantColors = {
            topLeft: 'rgba(239, 68, 68, 0.1)',     // Light red - Potential for Negative ROI
            topRight: 'rgba(34, 197, 94, 0.15)',   // Light green - High ROI if Feasible
            bottomLeft: 'rgba(251, 191, 36, 0.1)', // Light yellow - Limited ROI
            bottomRight: 'rgba(20, 184, 166, 0.1)' // Light teal - ROI if Scalable
        };
        
        // Draw quadrant backgrounds
        // Top-left quadrant (High Complexity, Low Maturity)
        ctx.fillStyle = quadrantColors.topLeft;
        ctx.fillRect(left, top, xMid - left, yMid - top);
        
        // Top-right quadrant (High Complexity, High Maturity)
        ctx.fillStyle = quadrantColors.topRight;
        ctx.fillRect(xMid, top, right - xMid, yMid - top);
        
        // Bottom-left quadrant (Low Complexity, Low Maturity)
        ctx.fillStyle = quadrantColors.bottomLeft;
        ctx.fillRect(left, yMid, xMid - left, bottom - yMid);
        
        // Bottom-right quadrant (Low Complexity, High Maturity)
        ctx.fillStyle = quadrantColors.bottomRight;
        ctx.fillRect(xMid, yMid, right - xMid, bottom - yMid);
        
        // Add quadrant labels
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate label positions (center of each quadrant)
        const labelPositions = {
            topLeft: { x: left + (xMid - left) / 2, y: top + (yMid - top) / 2 },
            topRight: { x: xMid + (right - xMid) / 2, y: top + (yMid - top) / 2 },
            bottomLeft: { x: left + (xMid - left) / 2, y: yMid + (bottom - yMid) / 2 },
            bottomRight: { x: xMid + (right - xMid) / 2, y: yMid + (bottom - yMid) / 2 }
        };
        
        // Draw quadrant labels with background
        const labels = {
            topLeft: 'Potential for\nNegative ROI',
            topRight: 'High ROI\nif Feasible',
            bottomLeft: 'Limited ROI',
            bottomRight: 'ROI if\nScalable'
        };
        
        Object.keys(labels).forEach(quadrant => {
            const pos = labelPositions[quadrant];
            const lines = labels[quadrant].split('\n');
            
            // Semi-transparent white background for readability
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const textHeight = lines.length * 16;
            const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + 12;
            ctx.fillRect(pos.x - textWidth/2, pos.y - textHeight/2, textWidth, textHeight);
            
            // Draw text lines
            ctx.fillStyle = 'rgba(55, 65, 81, 0.8)'; // Gray-700 with transparency
            lines.forEach((line, index) => {
                const lineY = pos.y - (lines.length - 1) * 8 + index * 16;
                ctx.fillText(line, pos.x, lineY);
            });
        });
        
        // Draw quadrant divider lines
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)'; // Gray-400 with transparency
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed lines
        
        // Vertical divider line
        ctx.beginPath();
        ctx.moveTo(xMid, top);
        ctx.lineTo(xMid, bottom);
        ctx.stroke();
        
        // Horizontal divider line
        ctx.beginPath();
        ctx.moveTo(left, yMid);
        ctx.lineTo(right, yMid);
        ctx.stroke();
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Restore the context state
        ctx.restore();
    }
};

/**
 * Custom Chart.js plugin to add edge labels (Very Low/Very High) outside grid area
 * These labels appear at the extremes of each axis for better context
 */
const axisEdgeLabelsPlugin = {
    id: 'axisEdgeLabels',
    afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Save the current context state
        ctx.save();
        
        // Configure text styling for edge labels
        ctx.fillStyle = '#666666'; // Subtle gray color as requested (#666)
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textBaseline = 'middle';
        
        // X-axis edge labels (Very Low on left, Very High on right)
        const xLabelY = chartArea.bottom + 30; // Position below the chart area, outside grid
        
        // "Very Low" on the left edge of X-axis
        ctx.textAlign = 'left';
        ctx.fillText('Very Low', chartArea.left, xLabelY);
        
        // "Very High" on the right edge of X-axis  
        ctx.textAlign = 'right';
        ctx.fillText('Very High', chartArea.right, xLabelY);
        
        // Y-axis edge labels (Very Low at bottom, Very High at top)
        const yLabelX = chartArea.left - 30; // Position to the left of the chart area, outside grid
        
        // "Very Low" at the bottom of Y-axis (rotated)
        ctx.save();
        ctx.translate(yLabelX, chartArea.bottom);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText('Very Low', 0, 0);
        ctx.restore();
        
        // "Very High" at the top of Y-axis (rotated)
        ctx.save();
        ctx.translate(yLabelX, chartArea.top);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText('Very High', 0, 0);
        ctx.restore();
        
        // Restore the context state
        ctx.restore();
    }
};

/**
 * Clean invalid data points from chart dataset
 * Removes any points with null, undefined, 0, or NaN coordinates
 * Enhanced to be more aggressive about removing any unwanted points
 */
function cleanChartData() {
    if (!taskChart || !taskChart.data.datasets[0]) return;
    
    const dataset = taskChart.data.datasets[0];
    const validIndices = [];
    
    console.log('Cleaning chart data. Current points:', dataset.data);
    
    // Find indices of valid data points with stricter validation
    dataset.data.forEach((point, index) => {
        // More strict validation: point must have valid coordinates AND a task name
        const correspondingTaskData = taskDataPoints[index];
        if (point && 
            point.x && point.y && 
            !isNaN(point.x) && !isNaN(point.y) &&
            point.x >= 1 && point.x <= 5 &&  // Must be within valid range
            point.y >= 1 && point.y <= 5 &&  // Must be within valid range
            correspondingTaskData && 
            correspondingTaskData.taskName && 
            correspondingTaskData.taskName.trim() !== '') {
            validIndices.push(index);
            console.log('Keeping valid chart point:', point, correspondingTaskData);
        } else {
            console.log('Removing invalid chart point:', {
                point: point,
                taskData: correspondingTaskData,
                reason: 'Missing task data or coordinates out of range'
            });
        }
    });
    
    // Filter all arrays to keep only valid points
    dataset.data = validIndices.map(i => dataset.data[i]);
    dataset.backgroundColor = validIndices.map(i => dataset.backgroundColor[i] || 'rgba(147, 51, 234, 0.8)');
    dataset.borderColor = validIndices.map(i => dataset.borderColor[i] || 'rgba(147, 51, 234, 1)');
    dataset.pointRadius = validIndices.map(i => dataset.pointRadius[i] || 8);
    dataset.pointHoverRadius = validIndices.map(i => dataset.pointHoverRadius[i] || 11);
    
    // Also clean the taskDataPoints array
    taskDataPoints = validIndices.map(i => taskDataPoints[i]).filter(Boolean);
    
    console.log('Chart data cleaned. Valid points remaining:', dataset.data.length);
    console.log('Remaining points:', dataset.data);
}

/**
 * Completely clear the chart of all data points
 * Use this to ensure the chart starts completely empty
 */
function clearChart() {
    if (!taskChart || !taskChart.data.datasets[0]) return;
    
    console.log('Completely clearing chart data');
    
    // Clear all data arrays
    taskChart.data.datasets[0].data = [];
    taskChart.data.datasets[0].backgroundColor = [];
    taskChart.data.datasets[0].borderColor = [];
    taskChart.data.datasets[0].pointRadius = [];
    taskChart.data.datasets[0].pointHoverRadius = [];
    
    // Clear the task data points array
    taskDataPoints = [];
    
    console.log('Chart completely cleared');
    
    // Update the chart to reflect changes
    taskChart.update('none');
}

/**
 * Initialize the scatter chart with ROI quadrant matrix and enhanced axis labels
 */
function initializeChart() {
    const ctx = document.getElementById('taskScatterChart').getContext('2d');
    
    // Register the custom plugins
    Chart.register(roiQuadrantPlugin);
    Chart.register(axisEdgeLabelsPlugin);
    
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
            layout: {
                padding: {
                    left: 50,    // Extra space for Y-axis edge labels
                    right: 10,   // Small buffer on the right
                    top: 10,     // Small buffer on the top  
                    bottom: 50   // Extra space for X-axis edge labels
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0.5,
                    max: 5.5,
                    title: {
                        display: true,
                        text: 'Action Maturity Score →',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        min: 1,
                        max: 5,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#374151',
                        callback: function(value) {
                            if (value >= 1 && value <= 5 && value % 1 === 0) {
                                const labels = {
                                    1: 'Very Low',
                                    2: 'Low', 
                                    3: 'Medium',
                                    4: 'High',
                                    5: 'Very High'
                                };
                                return labels[value];
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(156, 163, 175, 0.3)',
                        lineWidth: 1
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    title: {
                        display: true,
                        text: '↑ Task Complexity Score',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        min: 1,
                        max: 5,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#374151',
                        callback: function(value) {
                            if (value >= 1 && value <= 5 && value % 1 === 0) {
                                const labels = {
                                    1: 'Very Low',
                                    2: 'Low', 
                                    3: 'Medium',
                                    4: 'High',
                                    5: 'Very High'
                                };
                                return labels[value];
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(156, 163, 175, 0.3)',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = taskDataPoints[context.dataIndex];
                            return [
                                `Time Savings: ${dataPoint.timeSavings} hours/year`,
                                `Cost Savings: $${dataPoint.costSavings.toLocaleString()}`,
                                `ROI: ${dataPoint.agentROI}%`
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
    
    // Debug: Log initial chart state
    console.log('Chart initialized with data:', {
        dataPoints: taskChart.data.datasets[0].data,
        totalPoints: taskChart.data.datasets[0].data.length
    });
    
    // Force clear any unwanted data points and ensure chart starts empty
    taskChart.data.datasets[0].data = [];
    taskChart.data.datasets[0].backgroundColor = [];
    taskChart.data.datasets[0].borderColor = [];
    taskChart.data.datasets[0].pointRadius = [];
    taskChart.data.datasets[0].pointHoverRadius = [];
    taskDataPoints = [];
    
    console.log('Chart data forcibly cleared. Current state:', {
        dataPoints: taskChart.data.datasets[0].data,
        totalPoints: taskChart.data.datasets[0].data.length
    });
    
    // Clean any invalid data points after initialization
    setTimeout(() => {
        cleanChartData();
        taskChart.update('none');
        console.log('Chart after cleanup:', {
            dataPoints: taskChart.data.datasets[0].data,
            totalPoints: taskChart.data.datasets[0].data.length
        });
    }, 100);
}

/**
 * Add task data point to chart
 * New points are added dynamically when users complete Step 2
 * Fixed: Added validation to prevent unwanted center points from null/undefined data
 */
function addTaskToChart(formData, results) {
    // Convert qualitative scores to numeric values for plotting
    const qualitativeToNumeric = {
        'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
    };
    
    const maturityScore = qualitativeToNumeric[formData.currentActionMaturityScore];
    const complexityScore = qualitativeToNumeric[formData.taskComplexityScore];
    
    // Fix: Validate that we have real data before creating a point
    // Do not render points if x or y values are null, undefined, 0, or NaN
    if (!maturityScore || !complexityScore || 
        isNaN(maturityScore) || isNaN(complexityScore) ||
        !formData.taskName || formData.taskName.trim() === '') {
        console.log('Skipping chart point - invalid data:', {
            maturityScore,
            complexityScore,
            taskName: formData.taskName,
            maturityInput: formData.currentActionMaturityScore,
            complexityInput: formData.taskComplexityScore
        });
        return; // Exit early if data is invalid
    }
    
    // Create data point for the quadrant matrix
    const dataPoint = {
        x: maturityScore,
        y: complexityScore,
        taskName: formData.taskName,
        agentROI: results.potential.agentROI || results.agentROI, // Use potential ROI if available
        timeSavings: results.potential.timeSavings || results.timeSavings,
        costSavings: results.potential.costSavings || results.costSavings
    };
    
    // Debug: Log the dataset being passed to the chart
    console.log('Adding valid data point to chart:', dataPoint);
    
    // Store data point for tooltip reference
    taskDataPoints.push(dataPoint);
    
    // Use distinct purple styling for all points as requested
    const pointColor = 'rgba(147, 51, 234, 0.8)';      // Purple color
    const borderColor = 'rgba(147, 51, 234, 1)';       // Solid purple border
    const pointRadius = 8;                              // Fixed radius as requested
    
    // Add to chart dataset
    taskChart.data.datasets[0].data.push(dataPoint);
    taskChart.data.datasets[0].backgroundColor.push(pointColor);
    taskChart.data.datasets[0].borderColor.push(borderColor);
    taskChart.data.datasets[0].pointRadius.push(pointRadius);
    taskChart.data.datasets[0].pointHoverRadius.push(pointRadius + 3);
    
    // Debug: Log the current dataset after adding point
    console.log('Chart dataset after adding point:', {
        totalPoints: taskChart.data.datasets[0].data.length,
        dataPoints: taskChart.data.datasets[0].data
    });
    
    // Update chart to show new point
    taskChart.update('none'); // 'none' for no animation for better performance
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
        console.log('Starting PDF generation...');
        
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            console.warn('html2pdf library not available, using fallback method');
            await generateSimplePDFReport();
            return;
        }
        
        // Show loading state on button
        const downloadBtn = document.getElementById('download-report-btn');
        if (!downloadBtn) {
            throw new Error('Download button not found');
        }
        
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
        if (!element) {
            throw new Error('PDF template element not found');
        }
        
        console.log('PDF element found, generating PDF...');
        
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
        console.log('Calling html2pdf with options:', opt);
        await html2pdf().set(opt).from(element).save();
        console.log('PDF generation completed successfully');

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
        if (downloadBtn) {
            downloadBtn.innerHTML = downloadBtn.innerHTML.includes('Generating') ? 
                `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Download Report` : downloadBtn.innerHTML;
            downloadBtn.disabled = false;
        }
        
        // Show error message with more details
        showError(`Failed to generate PDF report: ${error.message}`);
    }
}

/**
 * Simple fallback PDF generation using window.print()
 * When html2pdf library is not available
 */
async function generateSimplePDFReport() {
    try {
        const downloadBtn = document.getElementById('download-report-btn');
        
        // Show loading state
        if (downloadBtn) {
            downloadBtn.innerHTML = 'Preparing Report...';
            downloadBtn.disabled = true;
        }
        
        // Populate the PDF template
        await populatePDFTemplate();
        await createPDFChart();
        
        // Create a new window with the report content
        const reportElement = document.getElementById('pdf-report-content');
        if (!reportElement) {
            throw new Error('PDF template not found');
        }
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Popup blocked. Please allow popups and try again.');
        }
        
        // Get the styles from the current page
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');
        
        // Write the content to the new window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI ROI Analysis Report</title>
                <style>
                    ${styles}
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                ${reportElement.outerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
        
        // Restore button state
        if (downloadBtn) {
            downloadBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Download Report
            `;
            downloadBtn.disabled = false;
        }
        
        showSuccessMessage('Report opened in new window. Use your browser\'s print function to save as PDF.');
        
    } catch (error) {
        console.error('Simple PDF generation error:', error);
        
        // Restore button state
        const downloadBtn = document.getElementById('download-report-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Download Report
            `;
            downloadBtn.disabled = false;
        }
        
        showError(`Failed to generate report: ${error.message}`);
    }
}

/**
 * Populate the hidden PDF template with current analysis data
 * Fills in all the text fields and data points for the report
 */
async function populatePDFTemplate() {
    // Ensure wizardData exists
    if (typeof wizardData === 'undefined') {
        console.warn('wizardData not available, using default values');
        window.wizardData = {
            taskName: '', taskPerformer: '', taskComplexityScore: '', currentActionMaturityScore: ''
        };
    }
    
    // Set generation date
    const now = new Date();
    const dateElement = document.getElementById('pdf-generation-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Populate task information with null checks
    const pdfTaskName = document.getElementById('pdf-task-name');
    if (pdfTaskName) {
        pdfTaskName.textContent = wizardData.taskName || document.getElementById('taskName')?.value || 'Not specified';
    }
    
    const pdfTaskPerformer = document.getElementById('pdf-task-performer');
    if (pdfTaskPerformer) {
        pdfTaskPerformer.textContent = wizardData.taskPerformer || document.getElementById('taskPerformer')?.value || 'Not specified';
    }

    // Get complexity and maturity scores
    const complexityScore = wizardData.taskComplexityScore || document.getElementById('taskComplexityScore')?.value || 'Not assessed';
    const maturityScore = wizardData.currentActionMaturityScore || document.getElementById('currentActionMaturityScore')?.value || 'Not assessed';
    
    const pdfTaskComplexity = document.getElementById('pdf-task-complexity');
    if (pdfTaskComplexity) {
        pdfTaskComplexity.textContent = `${complexityScore} ${getComplexityLabel(complexityScore)}`;
    }
    
    const pdfActionMaturity = document.getElementById('pdf-action-maturity');
    if (pdfActionMaturity) {
        pdfActionMaturity.textContent = `${maturityScore} ${getMaturityLabel(maturityScore)}`;
    }

    // Copy ROI metrics from the main results with null checks
    const pdfTimeSavings = document.getElementById('pdf-time-savings');
    if (pdfTimeSavings) {
        pdfTimeSavings.textContent = document.getElementById('timeSavings')?.textContent || '-';
    }
    
    const pdfCostSavings = document.getElementById('pdf-cost-savings');
    if (pdfCostSavings) {
        pdfCostSavings.textContent = document.getElementById('costSavings')?.textContent || '-';
    }
    
    const pdfAgentRoi = document.getElementById('pdf-agent-roi');
    if (pdfAgentRoi) {
        pdfAgentRoi.textContent = document.getElementById('agentROI')?.textContent || '-';
    }
    
    const pdfOrgRoi = document.getElementById('pdf-org-roi');
    if (pdfOrgRoi) {
        pdfOrgRoi.textContent = document.getElementById('orgROI')?.textContent || '-';
    }

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
    chartOptions.plugins.title = {
        display: true,
        text: 'Task Complexity vs Action Maturity Matrix',
        font: { size: 16, weight: 'bold' }
    };
    chartOptions.animation = false; // Disable animations for PDF

    // Create the PDF chart with quadrant plugin
    pdfChart = new Chart(ctx, {
        type: 'scatter',
        data: chartData,
        options: chartOptions,
        plugins: [roiQuadrantPlugin] // Include the quadrant background plugin
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

// ============================================================================
// AI INSIGHTS INTEGRATION WITH VERTEX AI GEMINI
// ============================================================================

/**
 * Generate AI insights after ROI calculation completes
 * Calls Vertex AI Gemini to provide actionable automation recommendations
 * @param {string} taskName - The name of the task being automated
 * @param {Object} roiSummary - Summary of ROI calculation results
 */
async function generateAIInsights(taskName, roiSummary) {
    const insightsSection = document.getElementById('ai-insights-section');
    const loadingEl = document.getElementById('insights-loading');
    const contentEl = document.getElementById('insights-content');
    const errorEl = document.getElementById('insights-error');
    
    try {
        // Show insights section with fade-in animation
        insightsSection.classList.remove('hidden');
        insightsSection.classList.add('ai-insights-fade-in');
        
        // Show loading state
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        
        // Smooth scroll to insights section
        setTimeout(() => {
            insightsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 200);
        
        // Call backend endpoint for AI insights
        const response = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskName: taskName,
                roiSummary: roiSummary
            })
        });
        
        if (!response.ok) {
            // If Vertex AI has any issues, show demo insights as fallback
            if (response.status === 500) {
                try {
                    const errorData = await response.json();
                    console.log('Vertex AI error detected, showing demo insights:', errorData.error);
                    loadingEl.classList.add('hidden');
                    displayDemoInsights(taskName);
                    return;
                } catch (e) {
                    console.log('Error parsing server response, showing demo insights');
                    loadingEl.classList.add('hidden');
                    displayDemoInsights(taskName);
                    return;
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loading and display insights with animations
        loadingEl.classList.add('hidden');
        displayInsights(data.insights);
        
        // Apply smooth show animation
        setTimeout(() => {
            insightsSection.classList.add('show');
        }, 100);
        
    } catch (error) {
        console.error('Error generating AI insights:', error);
        
        // Instead of showing an error, show demo insights as fallback
        console.log('Falling back to demo insights due to error');
        loadingEl.classList.add('hidden');
        displayDemoInsights(taskName);
    }
}

/**
 * Display AI-generated insights with smooth animations
 * @param {string} insights - Raw insights text from Gemini
 */
function displayInsights(insights) {
    const contentEl = document.getElementById('insights-content');
    
    // Parse insights text into individual items (assuming numbered format)
    const insightItems = parseInsightsText(insights);
    
    // Clear existing content
    contentEl.innerHTML = '';
    
    // Create insight elements with structured format and staggered animations
    insightItems.forEach((insight, index) => {
        const insightEl = document.createElement('div');
        insightEl.className = 'insight-item';
        insightEl.innerHTML = `
            <div class="insight-component">
                <div class="insight-label">
                    <span class="insight-icon">💡</span>
                    <span class="insight-label-text">Actionable Recommendation:</span>
                </div>
                <div class="insight-content">${insight.recommendation}</div>
            </div>
            <div class="insight-component">
                <div class="insight-label">
                    <span class="insight-icon">✅</span>
                    <span class="insight-label-text">Best Practice:</span>
                </div>
                <div class="insight-content">${insight.bestPractice}</div>
            </div>
            <div class="insight-component">
                <div class="insight-label">
                    <span class="insight-icon">🚀</span>
                    <span class="insight-label-text">Key Success Driver:</span>
                </div>
                <div class="insight-content">${insight.keySuccessDriver}</div>
            </div>
        `;
        
        contentEl.appendChild(insightEl);
        
        // Apply staggered animation
        setTimeout(() => {
            insightEl.classList.add('animate');
        }, (index + 1) * 150);
    });
    
    // Show content container
    contentEl.classList.remove('hidden');
}

/**
 * Parse insights text into structured format with three components per insight
 * @param {string} insightsText - Raw text from Gemini with structured insights
 * @returns {Array} Array of insight objects with recommendation, bestPractice, and keySuccessDriver
 */
function parseInsightsText(insightsText) {
    const insights = [];
    
    // Helper function to clean markdown formatting but preserve structure
    const cleanMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** formatting
            .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* formatting
            .trim();
    };
    
    // Split by numbered items (1., 2., 3., etc.)
    const sections = insightsText.split(/\d+\.\s+/).filter(section => section.trim());
    
    sections.forEach((section, index) => {
        // Parse each section to extract the three components
        const recommendation = section.match(/(?:Actionable Recommendation:|)\s*([^*]+?)(?=\*\*Best Practice:|$)/i);
        const bestPractice = section.match(/\*\*Best Practice:\*\*\s*([^*]+?)(?=\*\*Key Success Driver:|$)/i);
        const keySuccessDriver = section.match(/\*\*Key Success Driver:\*\*\s*([^*]+?)(?=\n|$)/i);
        
        if (recommendation && bestPractice && keySuccessDriver) {
            insights.push({
                recommendation: cleanMarkdown(recommendation[1]).trim(),
                bestPractice: cleanMarkdown(bestPractice[1]).trim(),
                keySuccessDriver: cleanMarkdown(keySuccessDriver[1]).trim()
            });
        } else {
            // Fallback: treat the whole section as a recommendation if structure not found
            const lines = section.trim().split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                insights.push({
                    recommendation: cleanMarkdown(lines[0].trim()),
                    bestPractice: cleanMarkdown(lines.slice(1).join(' ').trim()) || "Follow standard implementation practices.",
                    keySuccessDriver: "Monitor progress regularly and adjust based on performance metrics."
                });
            }
        }
    });
    
    // Fallback parsing if numbered format doesn't work
    if (insights.length === 0) {
        const lines = insightsText.split('\n').filter(line => line.trim());
        const chunks = [];
        let currentChunk = [];
        
        lines.forEach(line => {
            if (line.match(/^[•\-\*]/) || line.match(/^\d+/) || currentChunk.length === 0) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.join(' '));
                }
                currentChunk = [line.replace(/^[•\-\*\d\.\s]+/, '')];
            } else {
                currentChunk.push(line);
            }
        });
        
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }
        
        chunks.forEach(chunk => {
            const sentences = chunk.split('. ');
            if (sentences.length > 0) {
                insights.push({
                    title: cleanMarkdown(sentences[0] + (sentences[0].endsWith('.') ? '' : '.')),
                    description: cleanMarkdown(sentences.slice(1).join('. '))
                });
            }
        });
    }
    
    return insights.slice(0, 3); // Limit to 3 insights max
}

/**
 * Show error state for AI insights
 * @param {string} errorMessage - Error message to display
 */
function showInsightsError(errorMessage) {
    const errorEl = document.getElementById('insights-error');
    const errorMessageEl = document.getElementById('insights-error-message');
    
    // Set error message
    errorMessageEl.textContent = errorMessage || 'Unable to generate insights at this time.';
    
    // Show error state
    errorEl.classList.remove('hidden');
}

/**
 * Display demo insights when Vertex AI is not available
 * @param {string} taskName - The name of the task being automated
 */
function displayDemoInsights(taskName) {
    const demoInsights = `1. **Actionable Recommendation:** Implement ${taskName} during off-peak hours to reduce system load and improve processing speed by 15-20%.
**Best Practice:** Schedule automated tasks between 2-6 AM when system resources are most available.
**Key Success Driver:** Monitor system performance metrics to identify optimal processing windows for maximum efficiency.

2. **Actionable Recommendation:** Group similar tasks together to maximize efficiency gains through batch processing.
**Best Practice:** Create processing queues that handle related tasks in sequence to minimize context switching overhead.
**Key Success Driver:** Establish clear data validation checkpoints between batches to ensure processing integrity and prevent cascading errors.

3. **Actionable Recommendation:** Set up automated tracking metrics to continuously optimize your ${taskName} automation performance.
**Best Practice:** Implement real-time dashboards that display key performance indicators and alert on anomalies.
**Key Success Driver:** Regular performance reviews every 30 days to identify improvement opportunities and adjust automation parameters.

*Note: These are demo insights. Configure Vertex AI for personalized recommendations.*`;

    // Ensure the section is visible
    const insightsSection = document.getElementById('ai-insights-section');
    insightsSection.classList.remove('hidden');
    
    // Display the insights
    displayInsights(demoInsights);
    
    // Apply smooth show animation
    setTimeout(() => {
        insightsSection.classList.add('show');
        insightsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Hide AI insights section
 */
function hideAIInsights() {
    const insightsSection = document.getElementById('ai-insights-section');
    insightsSection.classList.add('hidden');
    insightsSection.classList.remove('show', 'ai-insights-fade-in');
}