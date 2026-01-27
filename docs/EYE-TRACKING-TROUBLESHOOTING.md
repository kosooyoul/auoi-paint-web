# 👁️ Eye Tracking 문제 해결 가이드

**즉시 해결 가이드**

---

## ❌ "Eye tracking 초기화 실패" 오류

### 증상
- 버튼 클릭 시 alert 팝업 표시
- 브라우저에 녹화 중 아이콘은 나타남
- 시선 커서가 보이지 않음

### 원인 진단

#### 1단계: 브라우저 콘솔 확인
**F12 키 → Console 탭**

다음 중 하나의 메시지를 찾으세요:

#### Case A: "WebGazer.js not loaded"
```
❌ WebGazer.js not loaded. Check CDN connection.
```

**원인**: WebGazer CDN 로딩 실패
**해결**:
1. 인터넷 연결 확인
2. 페이지 새로고침 (Ctrl+R 또는 F5)
3. 브라우저 캐시 삭제 후 재시도
4. 다른 브라우저에서 테스트 (Chrome 권장)

---

#### Case B: "NotAllowedError" 또는 "PermissionDeniedError"
```
❌ Failed to initialize eye tracking: NotAllowedError
```

**원인**: 웹캠 권한 거부
**해결**:
1. 브라우저 주소창 좌측 🔒 자물쇠 아이콘 클릭
2. "카메라" 권한 → "허용" 선택
3. 페이지 새로고침
4. Eye Tracking 버튼 다시 클릭

---

#### Case C: "NotFoundError" 또는 "DevicesNotFoundError"
```
❌ Failed to initialize eye tracking: NotFoundError
```

**원인**: 웹캠이 연결되어 있지 않음
**해결**:
1. 웹캠이 컴퓨터에 연결되어 있는지 확인
2. 노트북 내장 웹캠이 비활성화되어 있는지 확인
3. 장치 관리자에서 웹캠 드라이버 확인
4. 다른 프로그램에서 웹캠이 정상 작동하는지 테스트

---

#### Case D: "NotReadableError" 또는 "TrackStartError"
```
❌ Failed to initialize eye tracking: NotReadableError
```

**원인**: 웹캠이 다른 프로그램에서 사용 중
**해결**:
1. Zoom, Teams, Skype 등 화상회의 앱 종료
2. 다른 브라우저 탭에서 웹캠 사용 중인지 확인
3. OBS, 카메라 앱 등 종료
4. 컴퓨터 재부팅 (권장)

---

#### Case E: HTTPS 필요
```
getUserMedia is not supported over HTTP
```

**원인**: HTTP에서는 웹캠 접근 불가 (보안상)
**해결**:
1. HTTPS 환경에서 실행
2. Live Server는 자동으로 HTTPS 사용 (괜찮음)
3. localhost는 HTTP여도 허용됨

---

## 🔧 추가 디버깅 단계

### 1. WebGazer 상태 확인
**콘솔(F12)에서 실행**:
```javascript
// WebGazer 로딩 확인
typeof webgazer

// 결과가 'undefined'면 CDN 로딩 실패
// 결과가 'object'면 정상

// Eye Tracking PoC 인스턴스 확인
window.eyeTrackingPoC

// 초기화 상태 확인
window.eyeTrackingPoC.isInitialized  // true/false
window.eyeTrackingPoC.isActive       // true/false
```

### 2. 수동 초기화 테스트
**콘솔(F12)에서 실행**:
```javascript
// 강제 초기화 시도
await window.eyeTrackingPoC.initialize()

// 에러 메시지를 자세히 확인할 수 있습니다
```

### 3. WebGazer 직접 테스트
**콘솔(F12)에서 실행**:
```javascript
// WebGazer 직접 실행
await webgazer.begin()

// 에러 발생 시 구체적인 에러 메시지 확인 가능
```

---

## 🌐 브라우저별 해결 방법

### Chrome / Edge
1. 주소창 좌측 🔒 아이콘 클릭
2. "사이트 설정" 클릭
3. "카메라" → "허용" 선택
4. 페이지 새로고침

### Firefox
1. 주소창 좌측 🔒 아이콘 클릭
2. "연결 안전" 옆 ▶️ 클릭
3. "권한" 섹션 → "카메라" → "허용됨" 확인
4. 페이지 새로고침

### Safari
1. Safari 메뉴 → "설정" → "웹사이트"
2. "카메라" 탭
3. 해당 사이트 → "허용" 선택
4. 페이지 새로고침

---

## 🚨 긴급 대응

### 모든 방법이 실패한 경우

#### 방법 1: 페이지 완전 새로고침
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

#### 방법 2: 브라우저 캐시 완전 삭제
**Chrome**:
1. Ctrl+Shift+Delete
2. "시간 범위" → "전체"
3. "캐시된 이미지 및 파일" 체크
4. "데이터 삭제"

#### 방법 3: 시크릿/프라이빗 모드 테스트
```
Ctrl+Shift+N (Chrome/Edge)
Ctrl+Shift+P (Firefox)
Cmd+Shift+N (Safari)
```

#### 방법 4: 다른 브라우저 테스트
- Chrome 권장 (WebGazer 최적화)
- Edge 호환
- Firefox 호환
- Safari 제한적 지원

#### 방법 5: 로컬 파일이 아닌 서버에서 실행
Live Server 사용 (VSCode/Cursor):
```
index.html 우클릭 → "Open with Live Server"
```

---

## 📊 정상 작동 확인 체크리스트

초기화 성공 시 다음을 확인하세요:

- [ ] 콘솔에 "✅ Eye tracking initialized successfully" 표시
- [ ] 안내 메시지 팝업 표시 (우측 상단)
- [ ] 작은 웹캠 미리보기 창 표시 (좌상단)
- [ ] 빨간 십자 커서가 시선을 따라 움직임
- [ ] Eye Tracking 버튼이 녹색으로 하이라이트

---

## 🆘 여전히 해결 안 되면

### 환경 정보 수집
콘솔(F12)에서 실행:
```javascript
// 환경 정보 출력
console.log({
    browser: navigator.userAgent,
    webgazerLoaded: typeof webgazer !== 'undefined',
    instanceExists: typeof window.eyeTrackingPoC !== 'undefined',
    isHTTPS: window.location.protocol === 'https:',
    mediaDevicesSupported: 'mediaDevices' in navigator
});
```

### GitHub 이슈 생성
위 정보와 함께:
1. 브라우저 종류 및 버전
2. 운영체제 (Windows/Mac/Linux)
3. 웹캠 모델
4. 콘솔 에러 메시지 스크린샷
5. 재현 단계

**이슈 URL**: https://github.com/kosooyoul/auoi-paint-web/issues

---

## 💡 예방 팁

### 초기화 전 확인사항
1. ✅ 웹캠이 다른 프로그램에서 사용되지 않는지
2. ✅ 인터넷 연결이 안정적인지 (CDN 로딩)
3. ✅ 조명이 밝은지 (얼굴 인식을 위해)
4. ✅ Live Server로 실행 중인지 (파일로 직접 열지 않음)

### 최적의 환경
- **브라우저**: Chrome 최신 버전
- **프로토콜**: https:// 또는 localhost
- **조명**: 밝은 간접 조명
- **웹캠**: 720p 이상

---

**여전히 문제가 있나요?**
→ 콘솔 에러 메시지를 복사해서 알려주세요!
→ 스크린샷도 함께 보내주시면 더 빠르게 해결할 수 있습니다.

**Happy Debugging!** 🔧✨
