/**
 * Vietnamese Speech to Text App
 * Ứng dụng chuyển đổi giọng nói thành văn bản tiếng Việt
 */

class VietnameseSpeechToText {
    constructor() {
        // Speech Recognition instance
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        this.isInitialized = false;

        // DOM Elements
        this.micButton = document.getElementById('micButton');
        this.status = document.getElementById('status');
        this.textDisplay = document.getElementById('textDisplay');
        this.copyBtn = document.getElementById('copyBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');

        // Initialize app
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.checkBrowserSupport();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Vietnamese Speech to Text App initialized successfully');
            this.updateStatus('Nhấn micro để bắt đầu');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Không thể khởi tạo ứng dụng: ' + error.message);
            this.micButton.disabled = true; // Disable mic button if not initialized
        }
    }

    /**
     * Check if browser supports Speech Recognition
     */
    async checkBrowserSupport() {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome, Edge, Safari hoặc Firefox mới nhất.'));
                return;
            }

            // Check HTTPS requirement
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                reject(new Error('Ứng dụng cần chạy trên HTTPS hoặc localhost để truy cập microphone.'));
                return;
            }

            resolve();
        });
    }

    /**
     * Initialize Speech Recognition API
     */
    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure recognition settings
        this.recognition.continuous = true; // Keep listening even if pauses
        this.recognition.interimResults = true; // Show results while speaking
        this.recognition.lang = 'vi-VN'; // Vietnamese language
        this.recognition.maxAlternatives = 1; // Only get the most likely result

        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Microphone button
        this.micButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRecording();
        });

        // Action buttons
        this.copyBtn.addEventListener('click', () => this.copyText());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.saveBtn.addEventListener('click', () => this.saveText());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Prevent form submission on Enter (if any form elements were present)
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target !== this.textDisplay) {
                e.preventDefault();
            }
        });

        // Auto-resize textarea
        this.textDisplay.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopRecording();
                this.showError('Ghi âm tạm dừng vì trang bị ẩn.');
            }
        });
    }

    /**
     * Toggles recording state (start/stop)
     */
    toggleRecording() {
        if (!this.isInitialized) {
            this.showError('Ứng dụng chưa được khởi tạo. Vui lòng thử lại.');
            return;
        }

        if (this.isListening) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * Starts the speech recognition
     */
    startRecording() {
        if (this.recognition) {
            this.finalTranscript = this.textDisplay.value; // Preserve existing text
            this.recognition.start();
            this.isListening = true;
            this.micButton.classList.remove('inactive');
            this.micButton.classList.add('active');
            this.updateStatus('Đang nghe...');
            this.hideMessages();
            this.textDisplay.focus(); // Focus textarea when recording starts
            console.log('🎙️ Recording started...');
        }
    }

    /**
     * Stops the speech recognition
     */
    stopRecording() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.micButton.classList.remove('active');
            this.micButton.classList.add('inactive');
            this.updateStatus('Đã dừng');
            console.log('⏸️ Recording stopped.');
        }
    }

    /**
     * Handles the start event of speech recognition
     */
    onRecognitionStart() {
        console.log('Speech recognition started.');
        this.updateStatus('Đang nghe...');
        this.micButton.classList.remove('inactive');
        this.micButton.classList.add('active');
        this.hideMessages();
    }

    /**
     * Handles the result event of speech recognition
     * @param {SpeechRecognitionEvent} event
     */
    onRecognitionResult(event) {
        let interimTranscript = '';
        let currentFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                currentFinalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // Append to existing final transcript and update display
        this.finalTranscript += currentFinalTranscript;
        this.textDisplay.value = this.finalTranscript + interimTranscript;
        this.autoResizeTextarea();
    }

    /**
     * Handles errors during speech recognition
     * @param {SpeechRecognitionErrorEvent} event
     */
    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.stopRecording(); // Ensure button state is reset

        let errorMessage = 'Đã xảy ra lỗi trong quá trình nhận dạng giọng nói.';

        switch (event.error) {
            case 'not-allowed':
            case 'denied':
                errorMessage = 'Bạn đã từ chối quyền truy cập microphone. Vui lòng cho phép truy cập để sử dụng tính năng này.';
                break;
            case 'no-speech':
                errorMessage = 'Không phát hiện giọng nói. Vui lòng nói rõ ràng hơn.';
                break;
            case 'audio-capture':
                errorMessage = 'Không thể truy cập microphone. Vui lòng kiểm tra kết nối microphone.';
                break;
            case 'network':
                errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn.';
                break;
            case 'bad-grammar': // Though less common for default recognition
                errorMessage = 'Không thể hiểu được ngữ pháp. Vui lòng nói rõ ràng hơn.';
                break;
            case 'language-not-supported':
                errorMessage = 'Ngôn ngữ (vi-VN) không được hỗ trợ hoặc cấu hình sai.';
                break;
            default:
                errorMessage += ` (Mã lỗi: ${event.error})`;
                break;
        }
        this.showError(errorMessage);
    }

    /**
     * Handles the end event of speech recognition
     */
    onRecognitionEnd() {
        console.log('Speech recognition ended.');
        this.isListening = false;
        this.micButton.classList.remove('active');
        this.micButton.classList.add('inactive');
        this.updateStatus('Đã dừng');

        // Trim whitespace from the final transcript and update textarea
        this.finalTranscript = this.textDisplay.value.trim();
        this.textDisplay.value = this.finalTranscript;
        this.autoResizeTextarea();

        if (this.finalTranscript === '') {
            this.showError('Không có văn bản nào được nhận dạng.');
        } else {
            this.showSuccess('Nhận dạng hoàn tất!');
        }
    }

    /**
     * Updates the status message and styling
     * @param {string} message
     */
    updateStatus(message) {
        this.status.textContent = message;
        if (this.isListening) {
            this.status.classList.remove('stopped');
            this.status.classList.add('listening');
        } else {
            this.status.classList.remove('listening');
            this.status.classList.add('stopped');
        }
    }

    /**
     * Copies the text from the text display to the clipboard
     */
    copyText() {
        const textToCopy = this.textDisplay.value.trim();
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => this.showSuccess('Đã sao chép văn bản vào clipboard!'))
                .catch(err => this.showError('Không thể sao chép văn bản: ' + err.message));
        } else {
            this.showError('Không có văn bản để sao chép.');
        }
    }

    /**
     * Clears all text from the display
     */
    clearText() {
        this.textDisplay.value = '';
        this.finalTranscript = '';
        this.autoResizeTextarea();
        this.showSuccess('Đã xóa tất cả văn bản.');
        this.textDisplay.focus();
    }

    /**
     * Saves the text content to a .txt file
     */
    saveText() {
        const textToSave = this.textDisplay.value;
        if (textToSave) {
            const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
            const today = new Date();
            const date = today.toISOString().slice(0, 10); // YYYY-MM-DD
            const time = today.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
            const filename = `speech-to-text-${date}-${time}.txt`;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            this.showSuccess(`Đã lưu văn bản vào file "${filename}"`);
        } else {
            this.showError('Không có văn bản để lưu.');
        }
    }

    /**
     * Handles keyboard shortcuts
     * @param {KeyboardEvent} e
     */
    handleKeyboardShortcuts(e) {
        // Ctrl + Space to toggle recording
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            this.toggleRecording();
        }
        // Ctrl + S to save text
        if (e.ctrlKey && e.code === 'KeyS') {
            e.preventDefault();
            this.saveText();
        }
    }

    /**
     * Auto-resizes the textarea based on content
     */
    autoResizeTextarea() {
        this.textDisplay.style.height = 'auto';
        this.textDisplay.style.height = this.textDisplay.scrollHeight + 'px';
    }

    /**
     * Displays an error message
     * @param {string} message
     */
    showError(message) {
        this.hideMessages();
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        console.error('App Error:', message);
        setTimeout(() => this.hideMessages(), 5000); // Hide after 5 seconds
    }

    /**
     * Displays a success message
     * @param {string} message
     */
    showSuccess(message) {
        this.hideMessages();
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        console.log('App Success:', message);
        setTimeout(() => this.hideMessages(), 3000); // Hide after 3 seconds
    }

    /**
     * Hides all alert messages
     */
    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new VietnameseSpeechToText();
});
