# 🎴 카드 뒤집기 게임 (Card Flip Game)

Canvas API와 JavaScript로 구현한 인터랙티브 카드 뒤집기 메모리 게임입니다.

## ✨ 주요 기능

- **3D 카드 뒤집기 애니메이션**: 부드러운 3D 회전 효과로 카드를 뒤집습니다
- **게임다운 디자인**: 글래스모피즘과 그라데이션을 활용한 현대적인 UI
- **Supabase 연동**: 점수 저장 및 리더보드 기능
- **인터랙티브 효과**: 
  - 마우스 호버 시 카드 확대
  - 매칭 성공 시 바운스 및 펄스 효과
  - 게임 완료 시 축하 애니메이션
  - 초기 카드 등장 애니메이션

## 🎮 게임 방법

1. 카드를 클릭하여 뒤집습니다
2. 같은 심볼의 카드 두 장을 찾아 매칭합니다
3. 모든 카드를 매칭하면 게임 완료!
4. 점수를 저장하고 리더보드에서 최고 기록을 확인하세요

## 🚀 실행 방법

1. 저장소를 클론합니다:
```bash
git clone https://github.com/Malix75/my-card-game.git
cd my-card-game
```

2. Supabase 설정 파일을 생성합니다:
```bash
# config.example.js를 복사하여 config.js 생성
cp config.example.js config.js
```

3. `config.js` 파일을 열고 Supabase 프로젝트 정보를 입력합니다:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    key: 'sb_publishable_your_key_here'
};
```

4. `index.html` 파일을 브라우저에서 엽니다

또는 GitHub Pages나 Vercel, Netlify 등의 플랫폼에 배포하여 사용할 수 있습니다.

### ⚠️ 보안 주의사항

- `config.js` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- Supabase Publishable Key는 클라이언트에 노출되어도 안전하지만, 보안을 위해 별도 파일로 관리하는 것을 권장합니다.
- 배포 시에는 환경 변수나 배포 플랫폼의 설정 기능을 사용하세요.

## 🛠 기술 스택

- **HTML5 Canvas API**: 게임 렌더링
- **JavaScript (ES6+)**: 게임 로직 및 애니메이션
- **CSS3**: 스타일링 및 애니메이션
- **Supabase**: 백엔드 데이터베이스 (점수 저장)

## 📁 파일 구조

```
my-card-game/
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── game.js             # 게임 로직 및 Canvas 렌더링
├── config.example.js   # Supabase 설정 예제 파일
├── config.js           # Supabase 설정 파일 (로컬에서 생성, .gitignore)
├── .gitignore          # Git 무시 파일 목록
└── README.md           # 프로젝트 설명
```

## 🎨 특징

- **반응형 디자인**: 다양한 화면 크기에 대응
- **부드러운 애니메이션**: 60fps 애니메이션 루프
- **성능 최적화**: 효율적인 렌더링 및 이벤트 처리
- **접근성**: 키보드 및 마우스 지원

## 📝 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.

## 🔗 배포

이 프로젝트는 정적 웹사이트이므로 다음 플랫폼에 배포할 수 있습니다:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
