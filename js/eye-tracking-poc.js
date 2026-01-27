// 👁️ Eye Tracking Proof of Concept
// 간단한 시선 추적 테스트 - WebGazer.js 사용

/**
 * Eye Tracking PoC
 * - 시선 위치에 커서 표시
 * - 간단한 보정 (클릭으로 학습)
 * - 토글 on/off
 */

class EyeTrackingPoC {
    constructor() {
        this.isActive = false;
        this.isInitialized = false;
        this.gazeCursor = null;

        // 시선 커서 스무딩
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.3;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Eye tracking already initialized');
            return true;
        }

        try {
            console.log('Initializing WebGazer...');

            // WebGazer 초기화
            await webgazer
                .setGazeListener((data, timestamp) => {
                    if (data == null || !this.isActive) return;

                    // 시선 좌표 업데이트
                    this.targetX = data.x;
                    this.targetY = data.y;

                    // 부드러운 움직임을 위한 스무딩
                    this.updateGazeCursor();
                })
                .begin();

            // WebGazer 설정
            webgazer.showVideoPreview(true)      // 웹캠 미리보기 표시
                    .showPredictionPoints(false)  // 기본 예측 포인트 숨김 (커스텀 커서 사용)
                    .applyKalmanFilter(true);     // 칼만 필터로 노이즈 제거

            this.isInitialized = true;
            this.createGazeCursor();

            console.log('✅ Eye tracking initialized successfully');
            this.showInstructions();

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize eye tracking:', error);
            alert('Eye tracking 초기화 실패. 웹캠 권한을 확인해주세요.');
            return false;
        }
    }

    createGazeCursor() {
        // 시선 커서 DOM 요소 생성
        if (this.gazeCursor) return;

        this.gazeCursor = document.createElement('div');
        this.gazeCursor.id = 'gaze-cursor';
        this.gazeCursor.style.cssText = `
            position: fixed;
            width: 24px;
            height: 24px;
            border: 2px solid rgba(255, 0, 0, 0.8);
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            z-index: 10000;
            display: none;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        `;

        // 십자선 추가
        const crosshairH = document.createElement('div');
        crosshairH.style.cssText = `
            position: absolute;
            width: 30px;
            height: 1px;
            background: rgba(255, 0, 0, 0.6);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;

        const crosshairV = document.createElement('div');
        crosshairV.style.cssText = `
            position: absolute;
            width: 1px;
            height: 30px;
            background: rgba(255, 0, 0, 0.6);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;

        this.gazeCursor.appendChild(crosshairH);
        this.gazeCursor.appendChild(crosshairV);
        document.body.appendChild(this.gazeCursor);
    }

    updateGazeCursor() {
        if (!this.gazeCursor || !this.isActive) return;

        // 스무딩 적용
        this.currentX += (this.targetX - this.currentX) * this.smoothing;
        this.currentY += (this.targetY - this.currentY) * this.smoothing;

        // 커서 위치 업데이트
        this.gazeCursor.style.left = `${this.currentX}px`;
        this.gazeCursor.style.top = `${this.currentY}px`;
        this.gazeCursor.style.display = 'block';

        // 애니메이션 프레임 요청
        if (this.isActive) {
            requestAnimationFrame(() => this.updateGazeCursor());
        }
    }

    async start() {
        if (!this.isInitialized) {
            const success = await this.initialize();
            if (!success) return;
        }

        this.isActive = true;
        webgazer.resume();

        if (this.gazeCursor) {
            this.gazeCursor.style.display = 'block';
        }

        console.log('👁️ Eye tracking started');
        this.updateGazeCursor();
    }

    stop() {
        this.isActive = false;
        webgazer.pause();

        if (this.gazeCursor) {
            this.gazeCursor.style.display = 'none';
        }

        console.log('⏸️ Eye tracking paused');
    }

    end() {
        this.isActive = false;
        this.isInitialized = false;

        if (webgazer) {
            webgazer.end();
        }

        if (this.gazeCursor) {
            this.gazeCursor.remove();
            this.gazeCursor = null;
        }

        console.log('🛑 Eye tracking ended');
    }

    showInstructions() {
        const instructions = `
👁️ Eye Tracking 활성화됨!

사용 방법:
1. 웹캠을 보면서 화면의 여러 지점을 클릭하세요
2. 클릭할수록 정확도가 향상됩니다 (10회 이상 권장)
3. 빨간 십자 커서가 시선을 따라 움직입니다

팁:
- 조명이 밝은 곳에서 사용하세요
- 웹캠을 눈높이에 맞추세요
- 얼굴을 화면에서 40-60cm 떨어뜨리세요
        `;

        console.log(instructions);

        // 간단한 알림 표시
        const notice = document.createElement('div');
        notice.id = 'eye-tracking-notice';
        notice.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            max-width: 300px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        notice.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                👁️ Eye Tracking 활성화
            </div>
            <div style="font-size: 13px;">
                화면의 여러 지점을 <strong>클릭</strong>하면서<br>
                빨간 십자 커서를 보세요.<br>
                <br>
                클릭할수록 정확도가 향상됩니다!<br>
                (10회 이상 권장)
            </div>
            <button id="close-eye-tracking-notice" style="
                margin-top: 12px;
                padding: 8px 16px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            ">확인</button>
        `;

        document.body.appendChild(notice);

        // 5초 후 자동 사라짐 (또는 버튼 클릭)
        const closeNotice = () => {
            notice.remove();
        };

        setTimeout(closeNotice, 8000);
        document.getElementById('close-eye-tracking-notice').addEventListener('click', closeNotice);
    }

    // 정확도 향상을 위해 클릭 시 학습
    enableClickCalibration() {
        document.addEventListener('click', (e) => {
            if (!this.isActive) return;

            // 클릭한 위치를 WebGazer에 학습시킴
            webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');

            // 시각적 피드백
            this.showCalibrationFeedback(e.clientX, e.clientY);
        });
    }

    showCalibrationFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 255, 0, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9998;
            animation: calibration-pulse 0.5s ease-out;
        `;

        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 500);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes calibration-pulse {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 전역 인스턴스 생성
window.eyeTrackingPoC = new EyeTrackingPoC();

// 클릭 보정 활성화
window.eyeTrackingPoC.enableClickCalibration();

console.log('👁️ Eye Tracking PoC loaded. Use window.eyeTrackingPoC to control.');
