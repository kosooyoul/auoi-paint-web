# 👁️ Eye Tracking Drawing Mode - 기술 조사 및 구현 계획

**작성일**: 2026-01-27
**작성자**: Claude + 사용자
**버전**: v1.0 (계획)
**목적**: 팔이 불편한 사용자를 위한 접근성 기능

---

## 📋 목차
1. [개요](#개요)
2. [WebGazer.js 소개](#webgazerjs-소개)
3. [기술적 요구사항](#기술적-요구사항)
4. [구현 아키텍처](#구현-아키텍처)
5. [단계별 구현 계획](#단계별-구현-계획)
6. [코드 예제](#코드-예제)
7. [UI/UX 디자인](#uiux-디자인)
8. [성능 고려사항](#성능-고려사항)
9. [접근성 베스트 프랙티스](#접근성-베스트-프랙티스)
10. [참고 자료](#참고-자료)

---

## 개요

### 🎯 목표
웹 기반 페인트 애플리케이션에 **아이트래킹(Eye Tracking)** 기능을 추가하여, 팔이나 손이 불편한 사용자도 시선만으로 그림을 그릴 수 있도록 한다.

### ✨ 주요 기능
- 👁️ **시선 기반 커서 제어**: 눈이 보는 위치에 커서 표시
- 🎨 **Dwell-based Drawing**: 시선이 일정 시간 머물면 자동으로 그리기
- 👀 **눈 제스처 인식**: 깜빡임으로 도구 전환, 윙크로 Undo/Redo
- 📏 **보정 시스템**: 개인별 시선 추적 정확도 향상
- ♿ **접근성 UI**: 큰 버튼, 음성 피드백, 키보드 내비게이션

### 🌟 기대 효과
- 신체 장애가 있는 사용자의 창작 활동 지원
- 웹 접근성 표준 준수 (WCAG 2.1 Level AA)
- 하드웨어 추가 구매 불필요 (웹캠만 있으면 가능)
- 오픈소스 기여를 통한 사회적 가치 창출

---

## WebGazer.js 소개

### 📚 개요
**WebGazer.js**는 Brown University HCI 그룹에서 개발한 오픈소스 아이트래킹 라이브러리입니다.

- **공식 웹사이트**: [https://webgazer.cs.brown.edu/](https://webgazer.cs.brown.edu/)
- **GitHub 저장소**: [https://github.com/brownhci/WebGazer](https://github.com/brownhci/WebGazer)
- **라이센스**: GPL-3.0 (학술/비영리 사용 무료, 상업적 사용은 별도 라이센스 필요)
- **npm 패키지**: [https://www.npmjs.com/package/webgazer](https://www.npmjs.com/package/webgazer)

### 🔧 핵심 기술
- **MediaPipe FaceMesh**: 얼굴 랜드마크 468개 추적
- **Machine Learning**: TensorFlow.js 기반 회귀 모델
- **Client-side Processing**: 모든 처리가 브라우저에서 실행 (서버 전송 불필요)
- **Real-time Prediction**: 초당 30-60 프레임 시선 예측

### ⚙️ 작동 원리
```
1. 웹캠 스트림 캡처
   ↓
2. FaceMesh로 얼굴 랜드마크 추적 (눈, 코, 입 등)
   ↓
3. 눈 영역 특징 추출
   ↓
4. 머신러닝 모델로 시선 좌표 예측
   ↓
5. 사용자 클릭 데이터로 모델 지속 학습 (보정)
```

### 📊 성능 지표
- **정확도**: 보정 후 100-200픽셀 오차 (800x600 캔버스 기준)
- **프레임레이트**: 30-60 FPS (하드웨어 성능에 따라)
- **초기 보정 시간**: 30초 - 1분
- **지원 브라우저**: Chrome, Edge, Safari (WebRTC 지원 필수)

### ✅ 장점
- ✅ 무료 오픈소스 (비영리/학술 용도)
- ✅ 순수 JavaScript (별도 플러그인 불필요)
- ✅ 웹캠만 있으면 작동
- ✅ 클라이언트 측 처리 (프라이버시 보호)
- ✅ 지속적인 학습으로 정확도 향상

### ⚠️ 단점 및 제약사항
- ⚠️ 정확도 제한 (전문 아이트래커 대비 낮음)
- ⚠️ 조명 환경에 민감 (어두운 곳에서 정확도 하락)
- ⚠️ 보정 과정 필수 (매 세션마다 권장)
- ⚠️ CPU 사용량 높음 (머신러닝 추론)
- ⚠️ 안경 착용 시 정확도 감소 가능

---

## 기술적 요구사항

### 🖥️ 하드웨어 요구사항
| 항목 | 최소 사양 | 권장 사양 |
|------|-----------|-----------|
| **CPU** | Dual-core 2.0GHz | Quad-core 2.5GHz+ |
| **RAM** | 4GB | 8GB+ |
| **웹캠** | 720p 30fps | 1080p 60fps |
| **조명** | 실내 일반 조명 | 밝은 간접 조명 |

### 💻 소프트웨어 요구사항
- **브라우저**: Chrome 88+, Edge 88+, Safari 14+ (WebRTC 지원 필수)
- **JavaScript**: ES6+ 지원
- **권한**: 웹캠 접근 권한 (사용자 승인 필요)

### 🔒 보안 및 프라이버시
- ✅ HTTPS 필수 (getUserMedia API 요구사항)
- ✅ 비디오 데이터는 브라우저에서만 처리 (서버 전송 없음)
- ✅ 사용자 명시적 동의 필요
- ✅ 보정 데이터는 localStorage에만 저장 (선택적)

---

## 구현 아키텍처

### 📁 파일 구조 (제안)
```
js/
├── accessibility/
│   ├── eye-tracking-core.js       # WebGazer 초기화 및 관리
│   ├── eye-gestures.js            # 눈 제스처 인식 (깜빡임, 윙크)
│   ├── dwell-detector.js          # 머무름 시간 감지
│   ├── calibration-ui.js          # 9-point 보정 화면
│   └── gaze-visualizer.js         # 시선 커서 시각화
└── ui-handlers.js                 # (기존 파일에 통합)

index.html                         # WebGazer CDN 추가
styles.css                         # 접근성 UI 스타일 추가
```

### 🔄 데이터 흐름
```
[웹캠] → [WebGazer.js] → [시선 좌표 (x, y)]
                              ↓
                    [Coordinate Mapper]
                    (뷰포트 → 캔버스 좌표 변환)
                              ↓
                    [Dwell Detector]
                    (머무름 시간 측정)
                              ↓
                    [Action Executor]
                    - 펜 그리기
                    - 버튼 클릭
                    - 도구 전환
```

### 🎯 주요 모듈

#### 1. Eye Tracking Core
```javascript
// eye-tracking-core.js
class EyeTrackingCore {
    constructor() {
        this.isActive = false;
        this.currentGaze = { x: 0, y: 0 };
        this.calibrationData = null;
    }

    async initialize() {
        // WebGazer 초기화
        // 웹캠 권한 요청
        // 이벤트 리스너 등록
    }

    startTracking() {
        // 시선 추적 시작
    }

    stopTracking() {
        // 시선 추적 중지 (메모리/CPU 절약)
    }

    getGazePosition() {
        // 현재 시선 좌표 반환 (캔버스 좌표계)
    }
}
```

#### 2. Dwell Detector
```javascript
// dwell-detector.js
class DwellDetector {
    constructor(dwellTime = 800) {
        this.dwellTime = dwellTime;  // 기본 800ms
        this.dwellStart = null;
        this.lastPosition = null;
        this.threshold = 50;  // 50px 이내 움직임은 "머무름"으로 간주
    }

    update(gazePosition) {
        // 시선이 일정 영역에 머물렀는지 판단
        // 머무름 시간이 dwellTime 초과 시 "클릭" 이벤트 발생
    }

    reset() {
        // 머무름 타이머 리셋
    }
}
```

#### 3. Eye Gestures
```javascript
// eye-gestures.js
class EyeGestureRecognizer {
    detectBlink() {
        // 양쪽 눈 깜빡임 감지
        // → 도구 전환 메뉴 열기
    }

    detectWink(eye) {
        // 왼쪽/오른쪽 윙크 감지
        // 왼쪽 윙크 → Undo
        // 오른쪽 윙크 → Redo
    }

    detectLongBlink() {
        // 긴 깜빡임 (1초 이상)
        // → 확인/취소 동작
    }
}
```

#### 4. Calibration UI
```javascript
// calibration-ui.js
class CalibrationUI {
    showCalibrationScreen() {
        // 9-point 보정 화면 표시
        // 사용자가 순서대로 9개 점을 응시하도록 안내
    }

    runCalibration() {
        // 각 점에서 시선 데이터 수집
        // WebGazer 모델 학습
        // 정확도 측정
    }

    saveCalibration() {
        // 보정 데이터를 localStorage에 저장
    }
}
```

---

## 단계별 구현 계획

### Phase 1: 기본 통합 (3-4시간)

#### Task 1.1: WebGazer.js 설치 및 초기화
- [ ] CDN 방식으로 WebGazer.js 로드
- [ ] 웹캠 권한 요청 UI 구현
- [ ] 기본 초기화 코드 작성

```html
<!-- index.html -->
<script src="https://webgazer.cs.brown.edu/webgazer.js"></script>
<script type="module" src="js/accessibility/eye-tracking-core.js"></script>
```

#### Task 1.2: 시선 커서 시각화
- [ ] 시선 위치에 동적 커서 표시
- [ ] 뷰포트 좌표 → 캔버스 좌표 변환 로직
- [ ] 부드러운 커서 움직임 (스무딩 필터 적용)

#### Task 1.3: 기본 Dwell Click
- [ ] 머무름 시간 감지 로직 구현
- [ ] 머무름 진행률 시각적 피드백 (원형 프로그레스 바)
- [ ] 캔버스에 점 찍기 테스트

**산출물**:
- 시선 커서가 표시되고 일정 시간 머물면 점이 찍히는 기본 기능

---

### Phase 2: 보정 시스템 (2-3시간)

#### Task 2.1: 9-point Calibration UI
- [ ] 보정 화면 모달 디자인
- [ ] 9개 보정 포인트 순차 표시
- [ ] 각 포인트에서 시선 데이터 수집

```
보정 패턴:
1 ─── 2 ─── 3
│     │     │
4 ─── 5 ─── 6
│     │     │
7 ─── 8 ─── 9
```

#### Task 2.2: 정확도 측정 및 피드백
- [ ] 보정 후 정확도 테스트 (validation 화면)
- [ ] 정확도 점수 표시 (예: 85% 정확도)
- [ ] 재보정 옵션 제공

#### Task 2.3: 보정 데이터 저장/불러오기
- [ ] localStorage에 보정 데이터 저장
- [ ] 앱 재시작 시 자동 불러오기
- [ ] "보정 초기화" 버튼

**산출물**:
- 사용자별 맞춤 보정 시스템
- 정확도 향상 (100-200px → 50-100px 오차)

---

### Phase 3: 드로잉 통합 (3-4시간)

#### Task 3.1: 시선 기반 펜 도구
- [ ] Dwell로 펜 그리기 시작/종료
- [ ] 연속적인 시선 움직임으로 선 그리기
- [ ] 브러시 크기 자동 확대 (정확도 보정)

#### Task 3.2: 도구 선택 UI
- [ ] 큰 아이콘 기반 도구 팔레트
- [ ] Dwell로 도구 선택
- [ ] 현재 선택된 도구 하이라이트

#### Task 3.3: 색상 선택 UI
- [ ] 대형 색상 팔레트 (최소 44x44px 버튼)
- [ ] Dwell로 색상 선택
- [ ] 최근 사용 색상 히스토리

**산출물**:
- 시선만으로 그림 그리기 가능
- 도구 전환 및 색상 선택 가능

---

### Phase 4: 눈 제스처 인식 (2-3시간)

#### Task 4.1: 깜빡임 감지
- [ ] WebGazer FaceMesh 데이터에서 눈 상태 추출
- [ ] 양쪽 눈 깜빡임 → "선택/확인" 액션
- [ ] 민감도 조절 옵션

#### Task 4.2: 윙크 감지
- [ ] 왼쪽 윙크 → Undo
- [ ] 오른쪽 윙크 → Redo
- [ ] 긴 윙크 → 특수 동작 (레이어 전환 등)

#### Task 4.3: 제스처 피드백
- [ ] 제스처 인식 시 시각/음향 피드백
- [ ] 제스처 인식률 통계 표시
- [ ] 오인식 방지 로직 (디바운싱)

**산출물**:
- 마우스 클릭 없이 제스처로 기능 제어

---

### Phase 5: 접근성 UI 개선 (2-3시간)

#### Task 5.1: 대형 버튼 UI
- [ ] 최소 44x44px 터치 타겟 (WCAG 2.1 기준)
- [ ] 고대비 색상 테마
- [ ] 명확한 시각적 피드백

#### Task 5.2: 음성 피드백
- [ ] Web Speech API로 TTS 구현
- [ ] 도구 전환 시 음성 안내
- [ ] 에러/성공 메시지 읽어주기

#### Task 5.3: 키보드 내비게이션
- [ ] Tab으로 UI 요소 순회
- [ ] Enter/Space로 선택
- [ ] Esc로 취소

#### Task 5.4: 튜토리얼 및 도움말
- [ ] 첫 실행 시 인터랙티브 튜토리얼
- [ ] 각 기능별 설명 툴팁
- [ ] 자주 묻는 질문 (FAQ)

**산출물**:
- WCAG 2.1 Level AA 준수 UI
- 음성 피드백 및 키보드 지원

---

### Phase 6: 성능 최적화 및 폴리싱 (2-3시간)

#### Task 6.1: 성능 프로파일링
- [ ] CPU 사용률 모니터링
- [ ] 메모리 누수 점검
- [ ] 프레임 드롭 최소화

#### Task 6.2: 적응형 품질 설정
- [ ] 저사양 기기에서 자동으로 해상도/프레임레이트 낮춤
- [ ] "성능 모드" vs "정확도 모드" 옵션
- [ ] 배터리 세이버 모드

#### Task 6.3: 오류 처리
- [ ] 웹캠 없음 → 친절한 안내 메시지
- [ ] 웹캠 권한 거부 → 대체 입력 방법 제안
- [ ] 조명 부족 → 밝기 조정 안내

**산출물**:
- 안정적이고 빠른 아이트래킹 경험
- 다양한 환경에서 작동

---

### Phase 7: 테스트 및 문서화 (2-3시간)

#### Task 7.1: 접근성 테스트
- [ ] 실제 장애인 사용자 테스트 (가능하면)
- [ ] 스크린 리더 호환성 점검
- [ ] 키보드 전용 내비게이션 테스트

#### Task 7.2: 크로스 브라우저 테스트
- [ ] Chrome, Edge, Safari에서 테스트
- [ ] 모바일 브라우저 테스트 (선택적)

#### Task 7.3: 사용자 가이드 작성
- [ ] 설치 가이드
- [ ] 보정 가이드
- [ ] 트러블슈팅 가이드

**산출물**:
- 테스트 리포트
- 사용자 문서

---

## 코드 예제

### 예제 1: WebGazer 기본 초기화

```javascript
// js/accessibility/eye-tracking-core.js

class EyeTrackingCore {
    constructor() {
        this.isActive = false;
        this.gazeListener = null;
    }

    async initialize() {
        try {
            // WebGazer 초기화
            await webgazer.setGazeListener((data, timestamp) => {
                if (data == null) return;

                // 시선 좌표
                const gazeX = data.x;
                const gazeY = data.y;

                // 콜백 호출
                if (this.gazeListener) {
                    this.gazeListener({ x: gazeX, y: gazeY, timestamp });
                }
            })
            .begin();

            // 예측 포인트 숨기기 (커스텀 커서 사용)
            webgazer.showPredictionPoints(false);

            this.isActive = true;
            console.log('Eye tracking initialized');

            return true;
        } catch (error) {
            console.error('Failed to initialize eye tracking:', error);
            return false;
        }
    }

    setGazeListener(callback) {
        this.gazeListener = callback;
    }

    pause() {
        webgazer.pause();
        this.isActive = false;
    }

    resume() {
        webgazer.resume();
        this.isActive = true;
    }

    end() {
        webgazer.end();
        this.isActive = false;
    }
}

// 전역 인스턴스
window.eyeTracking = new EyeTrackingCore();
```

---

### 예제 2: 시선 커서 시각화

```javascript
// js/accessibility/gaze-visualizer.js

class GazeVisualizer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        this.cursorX = 0;
        this.cursorY = 0;
        this.targetX = 0;
        this.targetY = 0;

        this.smoothing = 0.3; // 0.0 = 부드러움, 1.0 = 즉각 반응

        this.isDrawing = false;
    }

    update(gazePosition) {
        // 목표 위치 업데이트
        this.targetX = gazePosition.x;
        this.targetY = gazePosition.y;

        // 스무딩 (부드러운 움직임)
        this.cursorX += (this.targetX - this.cursorX) * this.smoothing;
        this.cursorY += (this.targetY - this.cursorY) * this.smoothing;

        this.draw();
    }

    draw() {
        // 시선 커서 그리기 (십자선)
        this.ctx.save();

        // 반투명 흰색 원
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(this.cursorX, this.cursorY, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // 검은 테두리
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 십자선
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.cursorX - 15, this.cursorY);
        this.ctx.lineTo(this.cursorX + 15, this.cursorY);
        this.ctx.moveTo(this.cursorX, this.cursorY - 15);
        this.ctx.lineTo(this.cursorX, this.cursorY + 15);
        this.ctx.stroke();

        this.ctx.restore();
    }

    getCurrentPosition() {
        return { x: this.cursorX, y: this.cursorY };
    }
}
```

---

### 예제 3: Dwell Detector (머무름 감지)

```javascript
// js/accessibility/dwell-detector.js

class DwellDetector {
    constructor(options = {}) {
        this.dwellTime = options.dwellTime || 800; // 기본 800ms
        this.threshold = options.threshold || 50;  // 50px 이내는 "머무름"

        this.dwellStart = null;
        this.lastPosition = null;
        this.isDwelling = false;

        this.onDwellProgress = options.onDwellProgress || null;
        this.onDwellComplete = options.onDwellComplete || null;
    }

    update(gazePosition, timestamp) {
        if (!this.lastPosition) {
            // 첫 시선 위치
            this.lastPosition = gazePosition;
            this.dwellStart = timestamp;
            return;
        }

        // 현재 위치와 이전 위치의 거리 계산
        const distance = this.getDistance(gazePosition, this.lastPosition);

        if (distance < this.threshold) {
            // 머무르고 있음
            if (!this.dwellStart) {
                this.dwellStart = timestamp;
            }

            const elapsed = timestamp - this.dwellStart;
            const progress = Math.min(elapsed / this.dwellTime, 1.0);

            // 진행률 콜백
            if (this.onDwellProgress) {
                this.onDwellProgress(progress, gazePosition);
            }

            // 머무름 시간 완료
            if (progress >= 1.0 && !this.isDwelling) {
                this.isDwelling = true;
                if (this.onDwellComplete) {
                    this.onDwellComplete(gazePosition);
                }
                this.reset();
            }
        } else {
            // 움직임 → 리셋
            this.reset();
        }

        this.lastPosition = gazePosition;
    }

    getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    reset() {
        this.dwellStart = null;
        this.isDwelling = false;
    }

    setDwellTime(ms) {
        this.dwellTime = ms;
    }

    setThreshold(pixels) {
        this.threshold = pixels;
    }
}
```

---

### 예제 4: 보정 UI

```javascript
// js/accessibility/calibration-ui.js

class CalibrationUI {
    constructor() {
        this.points = [
            { x: 0.1, y: 0.1 }, // 좌상
            { x: 0.5, y: 0.1 }, // 중상
            { x: 0.9, y: 0.1 }, // 우상
            { x: 0.1, y: 0.5 }, // 좌중
            { x: 0.5, y: 0.5 }, // 중중
            { x: 0.9, y: 0.5 }, // 우중
            { x: 0.1, y: 0.9 }, // 좌하
            { x: 0.5, y: 0.9 }, // 중하
            { x: 0.9, y: 0.9 }  // 우하
        ];

        this.currentPointIndex = 0;
        this.isCalibrating = false;
    }

    async startCalibration() {
        this.isCalibrating = true;
        this.currentPointIndex = 0;

        // 보정 모달 표시
        this.showCalibrationModal();

        // 각 포인트 순회
        for (let i = 0; i < this.points.length; i++) {
            await this.calibratePoint(this.points[i], i);
        }

        this.isCalibrating = false;
        this.hideCalibrationModal();

        // 정확도 측정
        const accuracy = await this.measureAccuracy();
        this.showAccuracyResult(accuracy);
    }

    async calibratePoint(point, index) {
        return new Promise((resolve) => {
            const screenX = window.innerWidth * point.x;
            const screenY = window.innerHeight * point.y;

            // 포인트 표시
            this.showCalibrationPoint(screenX, screenY, index + 1);

            // 3초간 응시 대기
            setTimeout(() => {
                // WebGazer에 클릭 이벤트 전달 (학습)
                webgazer.recordScreenPosition(screenX, screenY, 'click');
                resolve();
            }, 3000);
        });
    }

    showCalibrationModal() {
        const modal = document.createElement('div');
        modal.id = 'calibration-modal';
        modal.innerHTML = `
            <div class="calibration-overlay">
                <div class="calibration-instructions">
                    <h2>👁️ Eye Tracking Calibration</h2>
                    <p>Please look at each point as it appears.</p>
                    <p>Keep your gaze steady for 3 seconds.</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showCalibrationPoint(x, y, number) {
        // 기존 포인트 제거
        const existing = document.getElementById('calibration-point');
        if (existing) existing.remove();

        // 새 포인트 생성
        const point = document.createElement('div');
        point.id = 'calibration-point';
        point.className = 'calibration-point';
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        point.innerHTML = `
            <div class="point-pulse"></div>
            <div class="point-number">${number}</div>
        `;
        document.body.appendChild(point);
    }

    hideCalibrationModal() {
        const modal = document.getElementById('calibration-modal');
        if (modal) modal.remove();

        const point = document.getElementById('calibration-point');
        if (point) point.remove();
    }

    async measureAccuracy() {
        // 간단한 정확도 테스트
        // 실제로는 더 복잡한 검증 필요
        return Math.random() * 20 + 75; // 75-95% 임의 정확도
    }

    showAccuracyResult(accuracy) {
        const roundedAccuracy = Math.round(accuracy);
        const message = `
            Calibration Complete!
            Accuracy: ${roundedAccuracy}%
            ${roundedAccuracy > 85 ? '✅ Great!' : '⚠️ Consider recalibrating'}
        `;
        alert(message);
    }
}
```

---

### 예제 5: 통합 (UI Handlers에 추가)

```javascript
// js/ui-handlers.js에 추가

// Eye Tracking 모드 토글
let eyeTrackingMode = false;
let eyeTracking = null;
let gazeVisualizer = null;
let dwellDetector = null;

async function initEyeTracking() {
    eyeTracking = new EyeTrackingCore();
    const success = await eyeTracking.initialize();

    if (!success) {
        alert('❌ Eye tracking initialization failed. Please check webcam permissions.');
        return;
    }

    gazeVisualizer = new GazeVisualizer(canvas);
    dwellDetector = new DwellDetector({
        dwellTime: 800,
        threshold: 50,
        onDwellProgress: (progress, position) => {
            // 진행률 표시 (원형 프로그레스)
            drawDwellProgress(position, progress);
        },
        onDwellComplete: (position) => {
            // 캔버스에 그리기
            if (state.tool === 'pen') {
                drawPoint(position.x, position.y, state.primaryColor, state.strokeSize);
            }
        }
    });

    // 시선 리스너 등록
    eyeTracking.setGazeListener((gazeData) => {
        if (!eyeTrackingMode) return;

        // 뷰포트 좌표 → 캔버스 좌표 변환
        const canvasPos = viewportToCanvasCoords(gazeData.x, gazeData.y);

        // 시선 커서 업데이트
        gazeVisualizer.update(canvasPos);

        // 머무름 감지
        dwellDetector.update(canvasPos, gazeData.timestamp);
    });

    // 보정 실행
    const calibrationUI = new CalibrationUI();
    await calibrationUI.startCalibration();
}

// Eye Tracking 모드 토글 버튼
document.getElementById('btn-eye-tracking').addEventListener('click', async () => {
    eyeTrackingMode = !eyeTrackingMode;

    if (eyeTrackingMode) {
        if (!eyeTracking) {
            await initEyeTracking();
        } else {
            eyeTracking.resume();
        }
        document.getElementById('btn-eye-tracking').classList.add('active');
    } else {
        eyeTracking.pause();
        document.getElementById('btn-eye-tracking').classList.remove('active');
    }
});

// 뷰포트 좌표 → 캔버스 좌표 변환
function viewportToCanvasCoords(viewportX, viewportY) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = (viewportX - rect.left) * (canvas.width / rect.width);
    const canvasY = (viewportY - rect.top) * (canvas.height / rect.height);
    return { x: canvasX, y: canvasY };
}

// 머무름 진행률 시각화
function drawDwellProgress(position, progress) {
    const ctx = canvas.getContext('2d');
    ctx.save();

    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(position.x, position.y, 20, 0, Math.PI * 2 * progress);
    ctx.stroke();

    ctx.restore();
}
```

---

## UI/UX 디자인

### 🎨 접근성 UI 원칙

#### 1. 대형 터치 타겟
- **최소 크기**: 44x44 픽셀 (WCAG 2.1 Level AAA)
- **권장 크기**: 60x60 픽셀 이상
- **간격**: 최소 8px 마진

#### 2. 고대비 색상
```css
/* 접근성 테마 */
.accessibility-mode {
    --primary-bg: #FFFFFF;
    --primary-text: #000000;
    --accent-color: #0066CC;
    --hover-bg: #E6F2FF;
    --border-color: #333333;
}

/* 명도 대비: 최소 4.5:1 (WCAG AA) */
```

#### 3. 명확한 시각적 피드백
- **Hover 상태**: 배경색 변경 + 테두리 강조
- **Focus 상태**: 두꺼운 테두리 + 그림자
- **Active 상태**: 애니메이션 효과

#### 4. Dwell Progress Indicator
```
시선 머무름 시각화:

처음 (0%):        50%:           100% (클릭):
    ⚪            ◐              ⬤
  (빈 원)      (반원)       (채워진 원)
```

### 🖼️ UI 컴포넌트

#### Eye Tracking 컨트롤 패널
```
┌─────────────────────────────────────┐
│  👁️ Eye Tracking Controls          │
├─────────────────────────────────────┤
│  [🟢 Active]  [⏸️ Pause]  [⚙️ Settings] │
│                                       │
│  Dwell Time:  [=======|  ] 800ms     │
│  Threshold:   [====|     ] 50px      │
│  Smoothing:   [===|      ] 0.3       │
│                                       │
│  [🎯 Recalibrate]  [📊 Show Stats]   │
└─────────────────────────────────────┘
```

#### 보정 화면
```
┌─────────────────────────────────────┐
│       👁️ Eye Tracking Setup          │
├─────────────────────────────────────┤
│                                       │
│  Please look at each numbered point  │
│  and keep your gaze steady for 3s.   │
│                                       │
│      1 ─── 2 ─── 3                   │
│      │     │     │                    │
│      4 ─── 5 ─── 6                   │
│      │     │     │                    │
│      7 ─── 8 ─── 9                   │
│                                       │
│  Progress: [████████░░] 8/9           │
└─────────────────────────────────────┘
```

#### 시선 커서 디자인
```css
.gaze-cursor {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 0, 0, 0.8);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    pointer-events: none;
    z-index: 9999;

    /* 십자선 */
    &::before,
    &::after {
        content: '';
        position: absolute;
        background: rgba(255, 0, 0, 0.6);
    }

    &::before {
        width: 30px;
        height: 1px;
        top: 50%;
        left: -3px;
    }

    &::after {
        width: 1px;
        height: 30px;
        left: 50%;
        top: -3px;
    }
}

/* Dwell 진행률 표시 */
.dwell-progress {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(0, 150, 255, 0.3);

    /* 애니메이션 */
    animation: dwell-pulse 0.8s ease-in-out;
}

@keyframes dwell-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.6; }
}
```

---

## 성능 고려사항

### ⚡ 최적화 전략

#### 1. 프레임레이트 제어
```javascript
// 30fps로 제한 (60fps는 과도한 CPU 사용)
let lastUpdate = 0;
const frameInterval = 1000 / 30; // 33ms

function updateGaze(gazeData) {
    const now = Date.now();
    if (now - lastUpdate < frameInterval) return;

    lastUpdate = now;
    // 시선 처리 로직
}
```

#### 2. 요청 시에만 활성화
```javascript
// Eye Tracking은 사용자가 명시적으로 활성화할 때만 작동
// 기본적으로 비활성화 → CPU/배터리 절약

if (!eyeTrackingMode) {
    webgazer.pause(); // 웹캠 스트림 중지
}
```

#### 3. 적응형 품질
```javascript
// 저사양 기기 감지
function detectLowEndDevice() {
    return navigator.hardwareConcurrency < 4 ||
           navigator.deviceMemory < 4;
}

if (detectLowEndDevice()) {
    // 해상도 낮춤
    webgazer.params.videoContainerWidth = 320;
    webgazer.params.videoContainerHeight = 240;
}
```

#### 4. 메모리 관리
```javascript
// 페이지 이탈 시 WebGazer 종료
window.addEventListener('beforeunload', () => {
    if (eyeTracking) {
        eyeTracking.end();
    }
});

// 비활성 탭에서는 일시 중지
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        eyeTracking.pause();
    } else {
        eyeTracking.resume();
    }
});
```

### 📊 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **CPU 사용률** | < 30% | Chrome DevTools Performance |
| **메모리** | < 200MB | Chrome Task Manager |
| **프레임레이트** | 30 FPS 유지 | requestAnimationFrame |
| **초기화 시간** | < 3초 | performance.now() |
| **정확도** | 100px 오차 이내 | 보정 후 검증 |

---

## 접근성 베스트 프랙티스

### ♿ WCAG 2.1 준수 체크리스트

#### Level A (필수)
- [x] **1.1.1 비텍스트 콘텐츠**: 모든 아이콘에 aria-label 추가
- [x] **1.4.1 색상 사용**: 색상만으로 정보 전달하지 않음
- [x] **2.1.1 키보드 접근**: 모든 기능이 키보드로 가능
- [x] **2.4.7 포커스 가시성**: 포커스 상태 명확하게 표시

#### Level AA (권장)
- [x] **1.4.3 명도 대비**: 텍스트 4.5:1, 그래픽 3:1
- [x] **2.4.3 포커스 순서**: 논리적인 탭 순서
- [x] **2.5.5 타겟 크기**: 최소 44x44px

#### Level AAA (이상적)
- [ ] **1.4.6 명도 대비 (강화)**: 7:1 대비
- [ ] **2.5.5 타겟 크기 (강화)**: 최소 60x60px

### 🎤 음성 피드백 구현

```javascript
// Web Speech API 사용
class VoiceFeedback {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = true;
    }

    speak(text) {
        if (!this.enabled) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR'; // 한국어
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    }

    announceToolChange(toolName) {
        this.speak(`도구 변경: ${toolName}`);
    }

    announceColorChange(colorName) {
        this.speak(`색상 변경: ${colorName}`);
    }

    announceError(message) {
        this.speak(`오류: ${message}`);
    }
}

// 사용 예
const voiceFeedback = new VoiceFeedback();
voiceFeedback.announceToolChange('펜 도구');
```

### ⌨️ 키보드 단축키

```javascript
// Eye Tracking 관련 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+E: Eye Tracking 토글
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        toggleEyeTracking();
    }

    // Ctrl+Shift+C: 재보정
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        recalibrate();
    }

    // Ctrl+Shift+V: 음성 피드백 토글
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        toggleVoiceFeedback();
    }
});
```

---

## 참고 자료

### 📚 공식 문서
- [WebGazer.js 공식 웹사이트](https://webgazer.cs.brown.edu/)
- [WebGazer.js GitHub 저장소](https://github.com/brownhci/WebGazer)
- [WebGazer.js npm 패키지](https://www.npmjs.com/package/webgazer)

### 🎓 학술 논문
- [WebGazer: Scalable Webcam Eye Tracking Using User Interactions (IJCAI 2016)](https://cs.brown.edu/people/apapouts/papers/ijcai2016webgazer.pdf)

### 💡 참고 프로젝트
- [Eye Tracking Chrome Extension](https://github.com/ZuhairM7/eye_tracker) - 웹 스크롤 제어
- [Building a realtime eye tracking experience with Supabase and WebGazer.js](https://dev.to/laznic/building-a-realtime-eye-tracking-experience-with-supabase-and-webgazerjs-3llj) - 실시간 아이트래킹 튜토리얼

### 🎨 접근성 가이드라인
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Speech API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Ideas for Creating Art via Eye Gaze](https://www.callscotland.org.uk/blog/ideas-for-creating-art-via-eye-gaze/)

### 🛠️ 개발 도구
- [CodeSandbox WebGazer Examples](https://codesandbox.io/examples/package/webgazer) - 온라인 테스트 환경
- [jsPsych Eye Tracking](https://www.jspsych.org/v7/overview/eye-tracking/) - 심리학 실험용 프레임워크 통합

---

## 다음 단계

### ✅ 의사 결정 필요
1. **라이센스 승인**: WebGazer.js GPL-3.0 라이센스 (학술/비영리 사용)
2. **CLAUDE.md 업데이트**: External library 예외 승인
3. **우선순위**: Eye Tracking vs ES6 Module Migration

### 🚀 구현 시작 시
1. **Phase 1**: 기본 통합 (3-4시간)
2. **Live Server 테스트**: 웹캠 권한 및 초기화 확인
3. **사용자 피드백**: 보정 및 정확도 체크

### 📝 문서 업데이트
- [ ] CLAUDE.md에 Eye Tracking 기능 추가
- [ ] README.md에 접근성 기능 소개
- [ ] USER-GUIDE.md 작성 (보정 방법 등)

---

**문서 작성 완료** ✅
다음 작업을 위해 대기 중입니다.
