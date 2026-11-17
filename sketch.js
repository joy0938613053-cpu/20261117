let bgImage; // 儲存背景圖片
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let bgX = 0; // 儲存背景捲動的偏移量
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效
const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入圖片
  bgImage = loadImage("bg/0.png"); // 載入背景圖片
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓角色座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 設定走路狀態
  const movementStep = constrain(width * 0.004, 2, 8); // 計算移動速度

  // 計算背景的最大可捲動範圍（以圖片實際寬度為基準）
  let maxBgScroll = bgImage.width - width;
  if (maxBgScroll < 0) maxBgScroll = 0;

  if (movingRight) {
    facingDirection = 1;
    if (bgX < maxBgScroll) {
      // 背景尚未到最右邊，先捲動背景（畫面往左移，bgX 增加）
      bgX += movementStep;
      if (bgX > maxBgScroll) bgX = maxBgScroll;
      isWalking = false; // 背景捲動時角色可保持站立或依需求調整
    } else {
      // 背景已到最右邊，角色開始往右移動
      characterX += movementStep;
    }
  } else if (movingLeft) {
    facingDirection = -1;
    if (bgX > 0) {
      // 背景尚未到最左邊，背景往右捲動（bgX 減少）
      bgX -= movementStep;
      if (bgX < 0) bgX = 0;
      isWalking = false;
    } else {
      // 背景已到最左邊，角色開始往左移動
      characterX -= movementStep;
    }
  }

  // 繪製串接背景（左、中、右三張圖拼接）
  background("#87CEEB");
  push();
  imageMode(CORNER);
  // 讓背景圖高度貼齊畫布高度，並依比例計算寬度
  let bgDrawHeight = height;
  let bgDrawWidth = (bgImage.width * height) / bgImage.height;
  
  // 繪製三張連續的背景以達成無縫串接
  let currentBgX = -bgX % bgDrawWidth;
  if (currentBgX > 0) currentBgX -= bgDrawWidth;
  
  for (let x = currentBgX; x < width; x += bgDrawWidth) {
    image(bgImage, x, 0, bgDrawWidth, bgDrawHeight);
  }
  pop();

  // 計算角色尺寸與位置
  const characterHeight = height / 3; 
  const characterScale = characterHeight / frameHeight;
  const characterWidth = frameWidth * characterScale;

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2); // 限制角色中心避免超出畫布左右邊界

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; 
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; 
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; 
  const elapsedMagicFrames = frameCount - magicStartFrame; 
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; 
  const sourceX = frameIndex * activeFrameWidth; 
  const activeWidth = activeFrameWidth * characterScale; 
  const activeHeight = activeFrameHeight * characterScale; 
  const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

  push(); // 暫存目前的繪圖座標轉換狀態
  translate(characterX, characterY); // 將繪圖原點移至角色中心
  scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
  pop(); // 還原繪圖座標轉換狀態

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; 
  const effectHeight = effectFrameHeight * effectScale; 
  const effectSpeed = max(6, width * 0.008); 

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; 
    effect.x += effect.direction * effectSpeed; 
    if (effect.x > width || effect.x < 0) { 
      activeEffects.splice(effectIndex, 1); 
      continue; 
    } 
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; 
    push(); 
    translate(effect.x, effect.y); 
    scale(effect.direction, 1); 
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); 
    pop(); 
  } 
} // 結束繪圖函式

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { 
    facingDirection = 1; 
    return false; 
  } 
  if (keyCode === LEFT_ARROW) { 
    facingDirection = -1; 
    return false; 
  } 
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { 
      isCasting = true; 
      magicStartFrame = frameCount; 
      magicDirection = facingDirection; 
    } 
    spaceIsDown = true; 
    return false; 
  } 
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { 
    spaceIsDown = false; 
  } 
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); 
  characterX = constrain(characterX, 1, width - 1); 
} // 結束視窗縮放處理函式