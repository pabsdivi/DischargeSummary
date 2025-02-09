// Add this error logging at the start of the script
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Speech Recognition available:', 'webkitSpeechRecognition' in window);
    console.log('MediaDevices available:', 'mediaDevices' in navigator);
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    let currentTarget = null;

    // Language support
    const languageSelector = document.getElementById('languageSelector');
    
    // Initialize with browser's language if available
    const browserLang = navigator.language || 'en-US';
    if (languageSelector.querySelector(`option[value="${browserLang}"]`)) {
        languageSelector.value = browserLang;
    }
    
    recognition.lang = languageSelector.value;

    // Update recognition language when selector changes
    languageSelector.addEventListener('change', () => {
        recognition.lang = languageSelector.value;
        
        // Update placeholder text based on selected language
        updatePlaceholders(languageSelector.value);
    });

    // Function to update placeholders based on language
    function updatePlaceholders(language) {
        const translations = {
            'en-US': {
                patientName: 'Enter patient name',
                diagnosis: 'Enter primary diagnosis',
                treatment: 'Enter treatment provided',
                medications: 'Enter discharge medications',
                followUp: 'Enter follow-up instructions'
            },
            'es-ES': {
                patientName: 'Nombre del paciente',
                diagnosis: 'Diagnóstico principal',
                treatment: 'Tratamiento proporcionado',
                medications: 'Medicamentos al alta',
                followUp: 'Instrucciones de seguimiento'
            },
            'fr-FR': {
                patientName: 'Nom du patient',
                diagnosis: 'Diagnostic principal',
                treatment: 'Traitement fourni',
                medications: 'Médicaments de sortie',
                followUp: 'Instructions de suivi'
            },
            // Add more languages as needed
        };

        const defaultLang = 'en-US';
        const trans = translations[language] || translations[defaultLang];

        // Update placeholders
        document.getElementById('patientName').placeholder = trans.patientName;
        document.getElementById('diagnosis').placeholder = trans.diagnosis;
        document.getElementById('treatment').placeholder = trans.treatment;
        document.getElementById('medications').placeholder = trans.medications;
        document.getElementById('followUp').placeholder = trans.followUp;
    }

    // Add noise cancellation and enhanced settings
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1,
                sampleRate: 16000
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                // Create Audio Context for additional noise filtering
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                
                // Create noise reduction node
                const noiseReducer = audioContext.createDynamicsCompressor();
                noiseReducer.threshold.value = -50;
                noiseReducer.knee.value = 40;
                noiseReducer.ratio.value = 12;
                noiseReducer.attack.value = 0;
                noiseReducer.release.value = 0.25;

                // Connect the audio nodes
                source.connect(noiseReducer);
                noiseReducer.connect(audioContext.destination);
            })
            .catch(err => console.error('Error accessing microphone:', err));
    }

    // Improve recognition accuracy settings
    recognition.maxAlternatives = 1;
    recognition.interimResults = false;  // Only get final results for better accuracy

    // Add click handlers to all voice buttons
    document.querySelectorAll('.voice-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            currentTarget = document.getElementById(targetId);
            
            if (button.classList.contains('recording')) {
                recognition.stop();
                button.classList.remove('recording');
            } else {
                // Stop any ongoing recognition
                recognition.stop();
                // Remove recording class from all buttons
                document.querySelectorAll('.voice-btn').forEach(btn => {
                    btn.classList.remove('recording');
                });
                // Start new recognition
                button.classList.add('recording');
                recognition.start();
            }
        });
    });

    // Modified recognition result handler to better handle different languages
    recognition.onresult = (event) => {
        if (!currentTarget) return;

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            // Handle right-to-left languages
            const isRTL = ['ar-SA', 'he-IL'].includes(recognition.lang);
            if (isRTL) {
                currentTarget.style.direction = 'rtl';
            } else {
                currentTarget.style.direction = 'ltr';
            }

            if (currentTarget.tagName === 'TEXTAREA') {
                currentTarget.value += (currentTarget.value ? ' ' : '') + finalTranscript;
            } else {
                currentTarget.value = finalTranscript;
            }
        }
    };

    // Enhanced error handling for language support
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'language-not-supported') {
            alert('Selected language is not supported. Please choose another language.');
            languageSelector.value = 'en-US';
            recognition.lang = 'en-US';
        }
        stopRecording();
    };

    // Handle end of recognition
    recognition.onend = () => {
        stopRecording();
    };

    function stopRecording() {
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.classList.remove('recording');
        });
        currentTarget = null;
    }

    // Handle form submission
    document.getElementById('dischargeSummaryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Discharge Summary saved successfully!');
        // Here you would typically send the data to a server
    });

    // Initialize placeholders
    updatePlaceholders(recognition.lang);
}); 
