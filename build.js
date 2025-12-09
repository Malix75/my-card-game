// Vercel 빌드 스크립트: 환경 변수에서 supabase-config.js 파일 자동 생성
const fs = require('fs');
const path = require('path');

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 
                    process.env.VITE_SUPABASE_KEY || 
                    process.env.SUPABASE_KEY;

// supabase-config.js 파일 경로
const configFilePath = path.join(__dirname, 'supabase-config.js');

// 환경 변수가 있으면 supabase-config.js 파일 생성
if (supabaseUrl && supabaseKey) {
    const configContent = `// Supabase 설정 파일 (빌드 시 자동 생성됨)
// 이 파일은 환경 변수에서 자동으로 생성되었습니다.
// ⚠️ 이 파일은 .gitignore에 포함되어 있어 Git에 커밋되지 않습니다.

const SUPABASE_CONFIG = {
    url: "${supabaseUrl}",
    key: "${supabaseKey}"
};

// window 객체에도 설정 (호환성을 위해)
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
`;

    // supabase-config.js 파일 생성
    fs.writeFileSync(configFilePath, configContent, 'utf8');
    console.log('✅ supabase-config.js 파일이 생성되었습니다.');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
} else {
    // 환경 변수가 없으면 파일 삭제 (로컬 config.js 사용)
    if (fs.existsSync(configFilePath)) {
        fs.unlinkSync(configFilePath);
        console.log('ℹ️  supabase-config.js 파일이 삭제되었습니다. (환경 변수 없음)');
    }
    console.warn('⚠️  Supabase 환경 변수가 설정되지 않았습니다.');
    console.warn('   로컬 개발 시에는 config.js 파일을 사용하세요.');
    console.warn('   Vercel 배포 시에는 환경 변수를 설정하세요.');
}
