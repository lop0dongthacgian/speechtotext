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
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Không thể khởi tạo ứng dụng. ' + error.message);
        }
    }

    /**
     * Check if browser supports Speech Recognition
     */
    async checkBrowserSupport() {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari.'));
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
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'vi-VN';
        this.recognition.maxAlternatives = 1;

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

        // Prevent form submission on Enter
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
            if (document.hidden