# 👁️ Eye Tracking PoC 배포 및 테스트 가이드

## 배포 상태 확인

### ✅ 완료된 작업
1. **MediaPipe 로컬 파일 호스팅 구현** (ff3d32b)
   - `mediapipe/face_mesh/face_mesh.binarypb` (939B)
   - `mediapipe/face_mesh/face_mesh_solution_packed_assets_loader.js` (8.7KB)
   - `mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.js` (322KB)
   - 총 크기: ~332KB

2. **GitHub 저장소 푸시 완료**
   - Repository: https://github.com/kosooyoul/auoi-paint-web
   - Branch: main
   - 모든 변경사항 커밋됨

3. **구현된 기능**
   - WebGazer.js 통합 (Brown University CDN)
   - Eye Tracking PoC 클래스 (`js/eye-tracking-poc.js`)
   - UI 토글 버튼 (Accessibility 섹션)
   - 시선 커서 시각화 (빨간 십자 커서)
   - 클릭 기반 보정 시스템
   - 스무딩 필터 (0.3 smoothing factor)

---

## 배포 후 테스트 체크리스트

### 1️⃣ 기본 로딩 확인

**URL**: https://paint.auoi.net/

**체크 항목**:
- [ ] 페이지가 정상적으로 로드되는가?
- [ ] 콘솔에 JavaScript 에러가 없는가? (F12 → Console)
- [ ] "👁️ Eye Tracking" 버튼이 Accessibility 섹션에 표시되는가?

**예상 콘솔 메시지**:
```
🔧 Pre-configuring WebGazer MediaPipe path: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/
✅ WebGazer.js loaded
✅ MediaPipe path configured: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/
👁️ Eye Tracking PoC loaded. Use window.eyeTrackingPoC to control.
```

---

### 2️⃣ MediaPipe 파일 로딩 확인 (핵심!)

**테스트 방법**:
1. F12 → Network 탭 열기
2. "👁️ Eye Tracking" 버튼 클릭
3. Network 탭에서 다음 요청 확인:

**✅ 성공 시 예상 결과**:
```
GET https://paint.auoi.net/mediapipe/face_mesh/face_mesh.binarypb
Status: 200 OK
Size: 939 B

GET https://paint.auoi.net/mediapipe/face_mesh/face_mesh_solution_packed_assets_loader.js
Status: 200 OK
Size: 8.7 KB

GET https://paint.auoi.net/mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.js
Status: 200 OK
Size: 322 KB
```

**❌ 실패 시 증상**:
```
GET https://paint.auoi.net/mediapipe/face_mesh/...
Status: 404 (Not Found)
```

---

### 3️⃣ 웹캠 권한 및 초기화 테스트

**테스트 방법**:
1. "👁️ Eye Tracking" 버튼 클릭
2. 브라우저 권한 요청 팝업에서 "허용" 클릭

**✅ 성공 시 예상 결과**:
- 브라우저 주소창 오른쪽에 🔴 녹화 아이콘 표시
- WebGazer 비디오 미리보기 창 표시 (화면 왼쪽 상단)
- "👁️ Eye Tracking 활성화" 안내 팝업 표시 (오른쪽 상단)
- 버튼 배경색이 초록색(#4CAF50)으로 변경

**예상 콘솔 메시지**:
```
Initializing WebGazer...
Requesting webcam permission...
🔧 Step 1: Setting MediaPipe path before any WebGazer calls...
✅ Set webgazer.params.faceMeshModelPath: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/
🔧 Step 2: Setting gaze listener...
🔧 Step 3: Re-setting MediaPipe path before begin()...
🔧 Step 4: Calling webgazer.begin()...
WebGazer.begin() result: [object]
✅ Eye tracking initialized successfully
👁️ Eye tracking started
```

**❌ 실패 시 증상**:
- "Eye tracking 초기화 실패" 알림
- 콘솔에 MediaPipe 404 에러
- 녹화 아이콘은 표시되지만 기능 작동 안 함

---

### 4️⃣ 시선 추적 기능 테스트

**테스트 방법**:
1. Eye Tracking 활성화 상태에서
2. 웹캠을 보면서 눈으로 화면의 여러 지점을 바라보기

**✅ 성공 시 예상 결과**:
- 빨간 십자 커서(24px 원형)가 시선을 따라 움직임
- 움직임이 부드럽고 자연스러움 (smoothing 적용)
- 약간의 지연은 정상 (스무딩 효과)

**정확도 향상 테스트**:
1. 화면의 여러 지점을 클릭 (10회 이상)
2. 클릭할 때마다 초록색 원형 애니메이션 표시
3. 클릭 횟수가 증가할수록 커서 정확도 향상

---

### 5️⃣ 성능 및 안정성 테스트

**체크 항목**:
- [ ] CPU 사용률이 과도하지 않은가? (Chrome Task Manager로 확인)
- [ ] 페이지가 느려지거나 멈추지 않는가?
- [ ] 메모리 사용량이 급격히 증가하지 않는가?
- [ ] 5분 이상 사용해도 안정적으로 작동하는가?

**예상 성능**:
- CPU 사용률: 20-30% (웹캠 + AI 모델 처리)
- 메모리 증가: +50-100MB
- FPS: 30-60fps (시선 추적 업데이트)

---

### 6️⃣ 토글 on/off 테스트

**테스트 방법**:
1. "👁️ Eye Tracking" 버튼 다시 클릭 (OFF)
2. 다시 한번 클릭 (ON)

**✅ 성공 시 예상 결과**:
- OFF: 커서 사라짐, 버튼 배경색 원래대로, 콘솔 "⏸️ Eye tracking paused"
- ON: 커서 다시 표시, 버튼 초록색, 콘솔 "👁️ Eye tracking started"
- 재활성화 시 이전 보정 데이터 유지됨

---

## 문제 해결 (Troubleshooting)

### 문제 1: MediaPipe 404 에러 지속

**증상**:
```
GET https://paint.auoi.net/mediapipe/face_mesh/face_mesh.binarypb 404 (Not Found)
```

**원인**:
- 배포 시 `mediapipe/` 디렉토리가 업로드되지 않음
- 웹 서버 정적 파일 서빙 설정 문제

**해결 방법**:
1. **배포 확인**:
   ```bash
   # GitHub에서 파일 존재 확인
   # https://github.com/kosooyoul/auoi-paint-web/tree/main/mediapipe/face_mesh
   ```

2. **웹 서버 확인**:
   - https://paint.auoi.net/mediapipe/face_mesh/face_mesh.binarypb 직접 접속
   - 200 OK 응답이 나와야 함 (파일 다운로드)
   - 404 응답이면 배포 문제

3. **배포 재시도**:
   ```bash
   # GitHub 저장소에서 최신 코드 pull
   git pull origin main

   # mediapipe 디렉토리 존재 확인
   ls -la mediapipe/face_mesh/

   # 배포 스크립트 재실행
   ```

---

### 문제 2: 웹캠 권한 거부

**증상**: "웹캠 권한이 거부되었습니다" 알림

**해결 방법**:
1. **Chrome**: 주소창 왼쪽 🔒 아이콘 클릭 → 카메라 → "허용"
2. **Firefox**: 주소창 왼쪽 🔒 아이콘 클릭 → 권한 → 카메라 → "차단 해제"
3. **Safari**: 사파리 → 설정 → 웹사이트 → 카메라 → paint.auoi.net → "허용"

---

### 문제 3: WebGazer.js CDN 로딩 실패

**증상**:
```
❌ WebGazer.js failed to load after 30 seconds
```

**원인**: Brown University CDN 접속 불가 (네트워크 문제)

**해결 방법**:
1. **인터넷 연결 확인**
2. **방화벽/Ad Blocker 확인**
   - Ad Blocker가 `webgazer.cs.brown.edu` 차단 여부 확인
   - 예외 추가: `webgazer.cs.brown.edu`
3. **대체 CDN 사용** (필요시):
   - jsDelivr: `https://cdn.jsdelivr.net/npm/webgazer@3.0.0/dist/webgazer.js`
   - unpkg: `https://unpkg.com/webgazer@3.0.0/dist/webgazer.js`

---

### 문제 4: 시선 커서가 움직이지 않음

**증상**: 녹화 아이콘 표시되지만 커서 움직임 없음

**디버깅**:
1. **콘솔 확인**:
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log('WebGazer active:', window.eyeTrackingPoC.isActive);
   console.log('WebGazer initialized:', window.eyeTrackingPoC.isInitialized);
   ```

2. **WebGazer 상태 확인**:
   ```javascript
   // 콘솔에서 실행
   webgazer.params.showVideo = true;
   webgazer.showPredictionPoints(true);
   ```

3. **얼굴 감지 확인**:
   - WebGazer 비디오 미리보기에서 얼굴이 감지되는지 확인
   - 조명이 너무 어둡지 않은지 확인
   - 웹캠과 얼굴 거리 40-60cm 유지

---

## 다음 단계 (PoC 성공 시)

### Phase 2: 9-Point Calibration UI
- 정확한 보정을 위한 9개 포인트 클릭 시스템
- 보정 정확도 시각화
- 재보정 기능

### Phase 3: Dwell-based Drawing
- 시선 + 응시 시간 = 그리기
- 기본 응시 시간: 800ms
- 드웰 타이머 시각화 (원형 progress)

### Phase 4: Eye Gesture Recognition
- Blink: 펜 들기/내리기 (draw mode toggle)
- Wink: 색상 변경 또는 도구 전환
- 눈 감김 지속: 실행 취소

### Phase 5: Accessibility UI
- 큰 버튼 모드
- 음성 피드백
- 고대비 시각 피드백

---

## 배포 체크리스트 요약

**배포 전**:
- [x] MediaPipe 파일 GitHub에 푸시 완료
- [x] 모든 변경사항 커밋 완료
- [x] Git 상태 clean

**배포 후**:
- [ ] https://paint.auoi.net/ 접속 확인
- [ ] MediaPipe 파일 200 OK 응답 확인
- [ ] Eye Tracking 버튼 작동 확인
- [ ] 웹캠 권한 허용 및 초기화 성공
- [ ] 시선 커서 정상 작동 확인
- [ ] 클릭 보정 기능 작동 확인

**성능 확인**:
- [ ] CPU 사용률 30% 이하
- [ ] 메모리 누수 없음
- [ ] 5분 이상 안정적 작동

---

## 참고 문서

- **기술 문서**: `docs/EYE-TRACKING-FEATURE-PLAN.md`
- **테스트 가이드**: `docs/EYE-TRACKING-POC-GUIDE.md`
- **빠른 시작**: `docs/EYE-TRACKING-QUICK-START.md`
- **문제 해결**: `docs/EYE-TRACKING-TROUBLESHOOTING.md`

---

**작성일**: 2026-02-03
**버전**: 1.0
**상태**: MediaPipe 로컬 파일 호스팅 완료 ✅
