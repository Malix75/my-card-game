// Vercel 빌드 스크립트: 환경 변수를 HTML에 주입
const fs = require('fs');
const path = require('path');

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;

// index.html 읽기
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 환경 변수가 있으면 HTML에 주입
if (supabaseUrl && supabaseKey) {
    const configScript = `
    <script>
        // Vercel 환경 변수에서 주입된 Supabase 설정
        window.SUPABASE_CONFIG = {
            url: "${supabaseUrl}",
            key: "${supabaseKey}"
        };
    </script>`;
    
    // </head> 태그 앞에 스크립트 삽입
    html = html.replace('</head>', configScript + '\n    </head>');
    
    // 수정된 HTML 저장
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('✅ Supabase 환경 변수가 HTML에 주입되었습니다.');
} else {
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 로컬 config.js를 사용하세요.');
}
