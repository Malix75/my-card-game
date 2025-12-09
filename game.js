// Supabase 설정
// 우선순위: 1) supabase-config.js (빌드 시 환경 변수에서 생성) 2) config.js (로컬 개발)
// supabase-config.js는 빌드 스크립트가 환경 변수에서 자동 생성합니다.
let supabase;
try {
    let supabaseConfig = null;
    
    // 1순위: supabase-config.js 또는 window.SUPABASE_CONFIG (빌드 시 생성된 파일)
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key) {
        supabaseConfig = window.SUPABASE_CONFIG;
    }
    // 2순위: 로컬 config.js의 SUPABASE_CONFIG
    else if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.key) {
        supabaseConfig = SUPABASE_CONFIG;
    }
    
    if (supabaseConfig) {
        supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);
        console.log('✅ Supabase 초기화 성공');
    } else {
        console.warn('⚠️ Supabase 설정이 없습니다.');
        console.warn('   로컬 개발: config.js 파일을 생성하세요.');
        console.warn('   Vercel 배포: 환경 변수를 설정하세요.');
        // Supabase 기능을 사용하지 않는 경우를 위한 더미 객체
        supabase = {
            from: () => ({
                insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
                select: () => ({
                    order: () => ({
                        order: () => ({
                            limit: () => Promise.resolve({ data: [], error: null })
                        })
                    })
                })
            })
        };
    }
} catch (error) {
    console.error('❌ Supabase 초기화 오류:', error);
    supabase = null;
}

// Canvas 및 게임 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
const CARD_SIZE = 80;
const CARD_SPACING = 10;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const TOTAL_CARDS = GRID_COLS * GRID_ROWS;
const TOTAL_PAIRS = TOTAL_CARDS / 2;

canvas.width = GRID_COLS * (CARD_SIZE + CARD_SPACING) + CARD_SPACING;
canvas.height = GRID_ROWS * (CARD_SIZE + CARD_SPACING) + CARD_SPACING;

// 게임 상태
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let attempts = 0;
let gameStarted = false;
let startTime = null;
let timerInterval = null;

// 카드 이미지/색상 (이모지 사용)
const cardSymbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍑', '🍉'];
const cardColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

// 카드 클래스
class Card {
    constructor(x, y, symbol, color, index) {
        this.x = x;
        this.y = y;
        this.symbol = symbol;
        this.color = color;
        this.index = index;
        this.isFlipped = false;
        this.isMatched = false;
        this.rotation = 0; // 0 = 뒷면, 180 = 앞면
        this.isAnimating = false;
        this.scale = 1;
        this.hoverScale = 1;
        this.matchPulse = 0;
    }

    draw() {
        const centerX = this.x + CARD_SIZE / 2;
        const centerY = this.y + CARD_SIZE / 2;
        
        ctx.save();
        
        // 카드 중심으로 이동
        ctx.translate(centerX, centerY);
        
        // 호버 스케일 적용
        const currentScale = this.scale * this.hoverScale;
        ctx.scale(currentScale, currentScale);
        
        // 회전 적용 (3D 효과를 위한 Y축 회전 시뮬레이션)
        const rotationRad = (this.rotation * Math.PI) / 180;
        const perspective = 0.5; // 원근감
        
        // 회전 중일 때 너비 조정 (3D 효과)
        let widthScale = Math.abs(Math.cos(rotationRad));
        if (widthScale < 0.1) widthScale = 0.1; // 너무 얇아지지 않도록
        
        ctx.scale(widthScale, 1);
        
        // 카드 배경 그리기
        const cardX = -CARD_SIZE / 2;
        const cardY = -CARD_SIZE / 2;
        
        // 그림자 효과
        if (!this.isMatched) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;
        }
        
        // 매칭된 카드는 황금색 테두리
        if (this.isMatched) {
            // 황금색 그라데이션 배경
            const gradient = ctx.createLinearGradient(cardX, cardY, cardX + CARD_SIZE, cardY + CARD_SIZE);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            ctx.fillStyle = gradient;
            ctx.fillRect(cardX, cardY, CARD_SIZE, CARD_SIZE);
            
            // 펄스 효과
            if (this.matchPulse > 0) {
                ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + this.matchPulse * 0.5})`;
                ctx.lineWidth = 3 + this.matchPulse * 2;
                ctx.strokeRect(cardX - 2, cardY - 2, CARD_SIZE + 4, CARD_SIZE + 4);
            }
        } else {
            // 회전 각도에 따라 앞면/뒷면 결정
            const showFront = this.rotation > 90;
            
            if (showFront) {
                // 앞면 - 밝은 흰색
                ctx.fillStyle = '#FFFFFF';
            } else {
                // 뒷면 - 반짝이는 패턴
                const backGradient = ctx.createLinearGradient(cardX, cardY, cardX + CARD_SIZE, cardY + CARD_SIZE);
                backGradient.addColorStop(0, '#667eea');
                backGradient.addColorStop(0.5, '#764ba2');
                backGradient.addColorStop(1, '#667eea');
                ctx.fillStyle = backGradient;
            }
            
            ctx.fillRect(cardX, cardY, CARD_SIZE, CARD_SIZE);
        }
        
        ctx.shadowColor = 'transparent';
        
        // 카드 테두리
        if (this.isMatched) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
        }
        ctx.strokeRect(cardX, cardY, CARD_SIZE, CARD_SIZE);
        
        // 카드 내용
        const showFront = this.rotation > 90 || this.isMatched;
        
        if (showFront) {
            // 이모지 그리기
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.symbol, 0, 0);
        } else {
            // 뒷면 패턴 - 반짝이는 별
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 0, 0);
            
            // 추가 장식 패턴
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, CARD_SIZE / 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    containsPoint(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + CARD_SIZE &&
               mouseY >= this.y && mouseY <= this.y + CARD_SIZE;
    }
    
    // 카드 뒤집기 애니메이션 시작
    startFlipAnimation(targetRotation) {
        this.isAnimating = true;
        this.targetRotation = targetRotation;
    }
    
    // 애니메이션 업데이트
    updateAnimation() {
        if (this.isAnimating) {
            const diff = this.targetRotation - this.rotation;
            if (Math.abs(diff) > 0.5) {
                this.rotation += diff * 0.15; // 부드러운 애니메이션
            } else {
                this.rotation = this.targetRotation;
                this.isAnimating = false;
            }
        }
        
        // 매칭 펄스 효과 감소
        if (this.matchPulse > 0) {
            this.matchPulse -= 0.05;
            if (this.matchPulse < 0) this.matchPulse = 0;
        }
        
        // 스케일 애니메이션 (매칭 시)
        if (this.isMatched && this.scale < 1.1) {
            this.scale += 0.02;
        } else if (!this.isMatched && this.scale > 1) {
            this.scale -= 0.05;
            if (this.scale < 1) this.scale = 1;
        }
    }
    
    // 매칭 성공 효과
    celebrate() {
        this.matchPulse = 1;
        this.scale = 1.1;
    }
}

// 카드 배열 초기화
function initializeCards() {
    cards = [];
    const symbols = [...cardSymbols, ...cardSymbols]; // 각 심볼을 2개씩
    shuffleArray(symbols);
    
    let cardIndex = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = col * (CARD_SIZE + CARD_SPACING) + CARD_SPACING;
            const y = row * (CARD_SIZE + CARD_SPACING) + CARD_SPACING;
            const symbolIndex = cardIndex % cardSymbols.length;
            const card = new Card(
                x, 
                y, 
                symbols[cardIndex],
                cardColors[symbolIndex],
                cardIndex
            );
            cards.push(card);
            cardIndex++;
        }
    }
}

// 배열 섞기 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 게임 그리기
function drawGame() {
    // 배경 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 모든 카드 애니메이션 업데이트
    let hasAnimating = false;
    cards.forEach(card => {
        card.updateAnimation();
        if (card.isAnimating || card.matchPulse > 0 || card.scale !== 1) {
            hasAnimating = true;
        }
    });
    
    // 모든 카드 그리기
    cards.forEach(card => card.draw());
    
    return hasAnimating;
}

// 애니메이션 루프
let animationFrameId = null;
function startAnimationLoop() {
    if (animationFrameId) return;
    
    function animate() {
        const hasAnimating = drawGame();
        // 항상 애니메이션 루프 유지 (호버 효과 등을 위해)
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// 게임 시작 시 애니메이션 루프 시작
startAnimationLoop();

// 카드 클릭 처리
function handleCardClick(event) {
    if (flippedCards.length >= 2) return; // 이미 2장이 뒤집혀 있으면 무시
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 게임 시작
    if (!gameStarted) {
        gameStarted = true;
        startTime = Date.now();
        startTimer();
        startAnimationLoop();
    }
    
    // 클릭한 카드 찾기
    const clickedCard = cards.find(card => 
        !card.isMatched && 
        !card.isFlipped && 
        !card.isAnimating &&
        card.containsPoint(mouseX, mouseY)
    );
    
    if (!clickedCard) return;
    
    // 카드 뒤집기 애니메이션 시작
    clickedCard.isFlipped = true;
    clickedCard.startFlipAnimation(180);
    flippedCards.push(clickedCard);
    
    startAnimationLoop();
    
    // 두 카드가 뒤집혔을 때
    if (flippedCards.length === 2) {
        attempts++;
        updateGameInfo();
        
        const [card1, card2] = flippedCards;
        
        // 매칭 확인
        if (card1.symbol === card2.symbol) {
            // 매칭 성공
            setTimeout(() => {
                card1.isMatched = true;
                card2.isMatched = true;
                card1.isFlipped = false;
                card2.isFlipped = false;
                card1.celebrate();
                card2.celebrate();
                flippedCards = [];
                matchedPairs++;
                updateGameInfo();
                
                // 게임 완료 확인
                if (matchedPairs === TOTAL_PAIRS) {
                    setTimeout(() => {
                        endGame();
                    }, 500);
                }
            }, 800);
        } else {
            // 매칭 실패 - 카드 다시 뒤집기
            setTimeout(() => {
                card1.startFlipAnimation(0);
                card2.startFlipAnimation(0);
                card1.isFlipped = false;
                card2.isFlipped = false;
                flippedCards = [];
            }, 1500);
        }
    }
}

// 마우스 호버 효과
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    let hoverChanged = false;
    cards.forEach(card => {
        if (!card.isMatched && !card.isFlipped && !card.isAnimating) {
            const wasHovered = card.hoverScale > 1;
            if (card.containsPoint(mouseX, mouseY)) {
                card.hoverScale = 1.05;
            } else {
                card.hoverScale = 1;
            }
            if (wasHovered !== (card.hoverScale > 1)) {
                hoverChanged = true;
            }
        } else {
            card.hoverScale = 1;
        }
    });
    
    // 호버 상태가 변경되었을 때만 그리기 (성능 최적화)
    if (hoverChanged) {
        drawGame();
    }
});

// 게임 정보 업데이트
function updateGameInfo() {
    document.getElementById('attempts').textContent = attempts;
    document.getElementById('matches').textContent = matchedPairs;
}

// 타이머 시작
function startTimer() {
    timerInterval = setInterval(() => {
        if (startTime) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            document.getElementById('timer').textContent = elapsed;
        }
    }, 1000);
}

// 게임 종료
function endGame() {
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // 축하 애니메이션 - 모든 카드가 순차적으로 펄스
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.celebrate();
        }, index * 50);
    });
    
    setTimeout(() => {
        document.getElementById('finalAttempts').textContent = attempts;
        document.getElementById('finalTime').textContent = elapsed;
        document.getElementById('gameOver').classList.remove('hidden');
        
        // 점수 저장 버튼 활성화
        document.getElementById('playerNameInput').value = '';
    }, 1000);
}

// 점수 저장
async function saveScore() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    try {
        const { data, error } = await supabase
            .from('card_flip_scores')
            .insert([
                {
                    player_name: playerName || null,
                    attempts: attempts,
                    time_seconds: elapsed,
                    matched_pairs: matchedPairs,
                    total_pairs: TOTAL_PAIRS
                }
            ])
            .select();
        
        if (error) throw error;
        
        alert('점수가 저장되었습니다! 🎉');
        document.getElementById('playerNameInput').value = '';
    } catch (error) {
        console.error('점수 저장 오류:', error);
        alert('점수 저장에 실패했습니다. 다시 시도해주세요.');
    }
}

// 리더보드 불러오기
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<p>로딩 중...</p>';
    
    try {
        const { data, error } = await supabase
            .from('card_flip_scores')
            .select('*')
            .order('time_seconds', { ascending: true })
            .order('attempts', { ascending: true })
            .limit(10);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            leaderboardList.innerHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>이름</th>
                            <th>시간</th>
                            <th>시도</th>
                            <th>날짜</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((score, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${score.player_name || '익명'}</td>
                                <td>${score.time_seconds}초</td>
                                <td>${score.attempts}회</td>
                                <td>${new Date(score.created_at).toLocaleDateString('ko-KR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            leaderboardList.innerHTML = '<p>아직 기록된 점수가 없습니다.</p>';
        }
    } catch (error) {
        console.error('리더보드 로딩 오류:', error);
        leaderboardList.innerHTML = '<p>리더보드를 불러오는데 실패했습니다.</p>';
    }
}

// 리더보드 표시
function showLeaderboard() {
    document.getElementById('leaderboard').classList.remove('hidden');
    loadLeaderboard();
}

// 게임 리셋
function resetGame() {
    // 게임 상태 초기화
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    attempts = 0;
    gameStarted = false;
    startTime = null;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // UI 초기화
    document.getElementById('attempts').textContent = '0';
    document.getElementById('matches').textContent = '0';
    document.getElementById('timer').textContent = '0';
    document.getElementById('gameOver').classList.add('hidden');
    
    // 카드 재초기화 및 그리기
    initializeCards();
    drawGame();
    
    // 초기 카드 등장 애니메이션
    setTimeout(() => {
        cards.forEach((card, index) => {
            card.scale = 0;
            setTimeout(() => {
                const animate = () => {
                    if (card.scale < 1) {
                        card.scale += 0.15;
                        if (card.scale > 1) card.scale = 1;
                        drawGame();
                        if (card.scale < 1) {
                            requestAnimationFrame(animate);
                        }
                    }
                };
                animate();
            }, index * 30);
        });
    }, 200);
}

// 이벤트 리스너
canvas.addEventListener('click', handleCardClick);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('gameOver').classList.add('hidden');
    resetGame();
});
document.getElementById('saveScoreBtn').addEventListener('click', saveScore);
document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
    document.getElementById('leaderboard').classList.add('hidden');
});
document.getElementById('refreshLeaderboardBtn').addEventListener('click', loadLeaderboard);

// Enter 키로 점수 저장
document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveScore();
    }
});

// 게임 시작
initializeCards();
drawGame();

// 초기 카드 등장 애니메이션
setTimeout(() => {
    cards.forEach((card, index) => {
        card.scale = 0;
        setTimeout(() => {
            const animate = () => {
                if (card.scale < 1) {
                    card.scale += 0.15;
                    if (card.scale > 1) card.scale = 1;
                    drawGame();
                    if (card.scale < 1) {
                        requestAnimationFrame(animate);
                    }
                }
            };
            animate();
        }, index * 30);
    });
}, 200);
