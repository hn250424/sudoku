let
    confirm_sound,
    cancel_sound,
    button_sound,
    help_sound,
    wrong_sound,
    insert_sound,
    cell_sound,
    success_sound,
    alert_sound;

let currentSound;
function playSound(sound) {
    if (currentSound) {
        currentSound.pause();
        currentSound.currentTime = 0;
    }
    currentSound = sound;
    currentSound.play();

    currentSound.addEventListener('ended', function () {
        currentSound = null;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    checkingResumeData();
    drawSudokuTable();
    loadAudio();
});

//이전에 진행 중인 게임이 있는지 확인하는 로직.
function checkingResumeData() {
    let hasData = false;

    hasData = localStorage.getItem("hasData");
    if (!hasData) return;

    // 이전 진행 중인 게임이 있으면 resume 버튼의 비활성화 속성을 부여하는 클래스 삭제.
    const resumeElement = document.getElementById('resume');
    if (resumeElement.classList.contains('notActivityBtn')) {
        resumeElement.classList.remove('notActivityBtn');
    }
}

function loadAudio() {
    confirm_sound = new Audio('audio/confirm.mp3');
    cancel_sound = new Audio('audio/cancel.mp3');
    button_sound = new Audio('audio/button.mp3');
    help_sound = new Audio('audio/help.mp3');
    wrong_sound = new Audio('audio/wrong.mp3');
    insert_sound = new Audio('audio/insert.mp3');
    cell_sound = new Audio('audio/cell.mp3');
    alert_sound = new Audio('audio/alert.mp3');
    success_sound = new Audio('audio/success.mp3');
}

let selectedDifficulty = null;
let isCellAnimating = false;

// 안드로이드 종료 시 진행 상태를 저장해두었다가 다시 앱 실행 시 이전 상태 그대로 로드하기 위한 로직.
document.getElementById('resume').addEventListener('click', function () {
    document.getElementById("sudoku-main").style.display = "none";
    document.getElementById("sudoku-play").style.display = "flex";

    helpLimit = localStorage.getItem('helpLimit');
    document.getElementById('helpLimit').innerText = helpLimit;

    gData = localStorage.getItem('gData');

    const tbody = document.querySelector('#sudoku-table tbody');
    tbody.innerHTML = '';
    tbody.innerHTML = localStorage.getItem('tableHtml');
});

document.getElementById('newGame').addEventListener('click', function () {
    playSound(button_sound);
    if (!selectedDifficulty) {
        initializeSelectedDifficulty(selectedDifficulty);
    }
    document.getElementById('difficultyPopup').style.display = 'flex';
});

document.getElementById('exit').addEventListener('click', function(){
    alert('not work in web');
})

document.getElementById('difficultyPopup-cancel').addEventListener('click', function () {
    playSound(cancel_sound);
    document.getElementById('difficultyPopup').style.display = 'none';
});

document.querySelectorAll('.difficulty').forEach(button => {
    button.addEventListener('click', function () {
        playSound(button_sound);

        deleteSelectedDifficulty();

        selectedDifficulty = this.getAttribute('data-difficulty');
        this.classList.add('selected-difficulty');
    });
});

document.getElementById('difficultyPopup-choose').addEventListener('click', function () {
    playSound(confirm_sound);

    document.getElementById('difficultyPopup').style.display = 'none';
    document.getElementById("sudoku-main").style.display = "none";
    document.getElementById("sudoku-play").style.display = "flex";

    resetGame(selectedDifficulty);
});

/* main ↑ */
/* ********************************************************************************** */
/* play ↓ */

let gData = null;
let isNoteActivity = false;
const rowButtonColor = getComputedStyle(document.documentElement).getPropertyValue('--rowButton-color').trim();
let history = [];
let helpLimit = 3;

import SudokuGenerator from "./SudokuGenerator.js";
function getSudokuData() {
    const data = new SudokuGenerator().generate(selectedDifficulty);
    gData = data;

    console.log(data)
    
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = table.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            if (data.question[i][j] !== 0) {
                cell.textContent = data.question[i][j];
                cell.classList.add('fixed');
            }
        }
    }
}

document.getElementById('helpLimit').innerText = helpLimit;

const table = document.getElementById('sudoku-table');
const tbody = table.querySelector('tbody');

function drawSudokuTable() {
    for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
        const tr = document.createElement('tr');
        for (let colIndex = 0; colIndex < 9; colIndex++) {
            const td = document.createElement('td');
            td.dataset.row = rowIndex;
            td.dataset.col = colIndex;
            td.dataset.grid = Math.floor(rowIndex / 3) * 3 + Math.floor(colIndex / 3);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

let selectedCell = null;
table.addEventListener('click', function (event) {
    if (isCellAnimating) {
        // 모든 셀 애니메이션 제거
        removeAllCellAnimations(selectedCell);
    }

    let targetCell = event.target;
    // 만약 클릭한 대상이 div (메모)라면, 부모 요소인 td를 대상으로 삼습니다.
    if (event.target.tagName === 'DIV') {
        targetCell = event.target.parentElement;
    } else if (targetCell.tagName === 'SPAN') {
        targetCell = targetCell.parentElement.parentElement;
    }
    if (targetCell.tagName !== 'TD' || targetCell.classList.contains('fixed')) return;

    playSound(cell_sound);

    // 모든 효과를 제거.
    // classList는 어차피 클래스니까 클래스 표기(.) 필요 없음.
    table.querySelectorAll('.related').forEach(cell => cell.classList.remove('related'));
    table.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));

    // 선택한 것의 행, 렬, 서브 그리드 정보.
    const row = targetCell.dataset.row;
    const col = targetCell.dataset.col;
    const grid = targetCell.dataset.grid;

    // 선택한 칸의 행, 렬, 서브 그리드에 관계 스타일 적용.
    table.querySelectorAll(`[data-row="${row}"], [data-col="${col}"], [data-grid="${grid}"]`).forEach(cell => cell.classList.add('related'));

    // 선택한 칸에 선택 스타일 적용.
    targetCell.classList.add('selected');

    selectedCell = targetCell;
}); //click

// 셀에 적용되는 애니메이션 삭제 메서드.
function removeAllCellAnimations(element) {
    const animationClasses = ['blink-help', 'blink-wrong'];

    animationClasses.forEach(className => {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    });
}

document.querySelector('.row-2').addEventListener('click', function (event) {
    playSound(insert_sound);

    if (selectedCell) {
        saveToHistory(selectedCell);
    }

    if (isNoteActivity) {
        // 정답이 있으면 지워준다.
        if (!selectedCell.querySelector('.notes-grid')) {
            selectedCell.textContent = '';
        }

        // 메모 모드에서의 로직
        // selectedCell 내부에 3x3 그리드 생성 (있으면 그걸 사용)
        // selectedCell의 자식 요소 중 note-grid를 가진 첫 번째 자식 요소 찾기.
        let notesGrid = selectedCell.querySelector('.notes-grid');
        if (!notesGrid) {
            notesGrid = document.createElement('div');
            notesGrid.classList.add('notes-grid');
            for (let i = 1; i <= 9; i++) {
                const span = document.createElement('span');
                span.textContent = i;
                notesGrid.appendChild(span);
            }
            selectedCell.appendChild(notesGrid);
        }
        const noteValue = event.target.textContent;
        const targetNote = notesGrid.querySelector(`span:nth-child(${noteValue})`);

        if (targetNote.classList.contains('active')) {
            targetNote.classList.remove('active');
        } else {
            targetNote.classList.add('active');
        }
    } else {
        if (event.target.tagName === 'BUTTON' && selectedCell) {
            selectedCell.textContent = event.target.textContent;

            // 메모가 있으면 모든 메모의 active를 지워준다.
            const notesGrid = selectedCell.querySelector('.notes-grid');
            if (notesGrid) {
                notesGrid.querySelectorAll('span.active').forEach(span => span.classList.remove('active'));
                selectedCell.removeChild(notesGrid);
            }

            const row = selectedCell.dataset.row;
            const col = selectedCell.dataset.col;
            const grid = selectedCell.dataset.grid;

            // 서브 그리드와 같은 줄에 같은 숫자가 있는지 검사
            // ...document -> ...은 spread operator. 배열이나 객체를 개별 요소로 펼쳐서 사용할 수 있게 한다.
            // document.querySelectorAll는 NodeList 객체를 반환.
            // NodeList는 배열과 비슷하나 배열이 아님. 배열의 메서드 some을 사용하기 위해 앞에 ...을 붙여준다.
            // 선택된 셀의 행, 열, 그리드를 모두 찾아 배열에 입력 후,
            // some -> 조건을 만족하는 배열 요소가 하나라도 있으면 true 반환
            const relatedArr = [...document.querySelectorAll(`[data-row="${row}"], [data-col="${col}"], [data-grid="${grid}"]`)];
            const isDuplicate = relatedArr.some(cell => cell.textContent === event.target.textContent && cell !== selectedCell);

            if (isDuplicate) {
                playSound(wrong_sound);
                isCellAnimating = true;

                selectedCell.classList.add('blink-wrong');
                relatedArr.forEach(cell => {
                    if (cell.textContent === selectedCell.textContent) {
                        cell.classList.add('blink-wrong');
                    }
                })

                // 먼저 로직이 끝나더라도, animationend 이벤트 핸들러는 애니메이션이 끝나는 시점에 호출
                // once: true -> 해당 이벤트 핸들러가 한 번 호출된 후 자동으로 제거. 
                selectedCell.addEventListener('animationend', handleAnimationEnd, { once: true });
                relatedArr.forEach(cell => {
                    cell.addEventListener('animationend', handleAnimationEnd, { once: true });
                });
            }
        }
    }
});

function handleAnimationEnd() {
    this.classList.remove('blink-wrong'); // this는 이벤트 핸들러가 연결된 DOM.
    checkAllAnimationsComplete();

    // once : true로 어차피 삭제되지만 명시적으로 한 번 더 삭제하는 것은 좋은 습관.
    // animationend 이벤트 핸들러 중에서 handleAnimationEnd 이 메서드 삭제.
    this.removeEventListener('animationend', handleAnimationEnd);
}

function checkAllAnimationsComplete() {
    const animatingElements = document.querySelectorAll('.blink-wrong');
    if (animatingElements.length === 0) {
        isCellAnimating = false;
    }
}

// icons로 명명된 모든 row 버튼들은 눌리면 애니메이션 시작.
// 그러나 icons 내 특정 버튼 애니메이션이 진행 중일 때 같은 버튼을 누른다면
// 이전 애니메이션이 끝나지 않았기 때문에 동작하지 않음.
let icons = document.querySelectorAll('.row-1 button, .row-2 button');
icons.forEach(icon => {
    icon.addEventListener('click', function () {
        icon.classList.add('blink-rowButton');
        icon.addEventListener('animationend', function () {
            icon.classList.remove('blink-rowButton');
        }, { once: true });
    });
});

document.getElementById('help').addEventListener('click', function () {
    playSound(button_sound);
    if (selectedCell) {
        if (helpLimit > 0) {
            showConfirmPopup('Do you want to know answer to this cell?');
            setConfirmHandler(helpAnswerHandler);
        } else {
            showAlertPopup("You've used up your chances");
        }
    }
});

document.getElementById('undo').addEventListener('click', function () {
    undo();
});

document.getElementById('erase').addEventListener('click', function () {
    button_sound.play();

    if (selectedCell) {
        saveToHistory(selectedCell);
    }

    if (selectedCell && !selectedCell.classList.contains('fixed')) {
        selectedCell.textContent = '';

        const notesGrid = selectedCell.querySelector('.notes-grid');
        if (notesGrid) {
            notesGrid.querySelectorAll('span.active').forEach(span => span.classList.remove('active'));
        }
    }
});

const noteIcon = document.querySelector('#note');
noteIcon.addEventListener('click', function () {
    button_sound.play();

    const img = noteIcon.querySelector('img');
    const p = noteIcon.querySelector('p');

    if (!isNoteActivity) {
        img.src = 'icon/note.png';
        p.style.color = rowButtonColor;
        p.innerHTML = 'ON';
    } else {
        img.src = 'icon/note_no.png';
        p.style.color = ''; // 원래 색상으로 되돌리려면 빈 문자열을 설정.
        p.innerHTML = 'OFF';
    }
    isNoteActivity = !isNoteActivity;
});

function saveToHistory(cell) {
    const notesGrid = cell.querySelector('.notes-grid');

    // ...은 배열의 메서드 map 사용을 위함. nodeList 즉 noteGrid의 자식 span이 모두 새 배열 요소로 들어간다.
    // map -> 배열을 순환하여 각 요소에 대해 주어진 함수를 호출하여 결과를 반환.
    // map은 원본 배열을 변경하지 않고 새 배열을 복사하여 리턴.
    // forEach는 리턴 없음. 원본 배열 변경 가능.

    const notes = [...(notesGrid ? notesGrid.children : [])]
        .map(span => span.classList.contains('active') ? span.textContent : null);

    // cell의 직접적인 텍스트 내용만을 가져온다.
    // 메모 모드를 키면 1~9까지의 span을 갖는 div를 만든다.
    // 그럼 value에 들어가는 cell.textcontent는 123456789가 돼버린다.
    // 사실은 메모 모드기 때문에 value가 없어야 맞는 것.
    // 예시 -> <div>Text1<span>Child Text</span>Text2</div> 인 경우에,
    // Text1Text2를 가져온다.
    const directTextContents
        = [...cell.childNodes]  // 배열의 메서드 사용을 위해 ... 스프레드 연산자를 사용하여 배열로 반환.
            .filter(node => node.nodeType === Node.TEXT_NODE)   // 텍스트 타입만 배열에 남게.
            .map(textNode => textNode.textContent.trim())
            .join('');

    const currentCellState = {
        row: cell.dataset.row,
        col: cell.dataset.col,
        value: directTextContents || null,
        notes: [...notes]  // notes 배열을 깊은 복사. 굳이?
    };

    history.push(currentCellState);
}

function undo() {
    button_sound.play();

    const lastAction = history.pop();
    if (!lastAction) return;

    const cell = table.querySelector(`[data-row="${lastAction.row}"][data-col="${lastAction.col}"]`);
    cell.textContent = lastAction.value || '';

    const notesGrid = cell.querySelector('.notes-grid');
    if (notesGrid) cell.removeChild(notesGrid);
    if (lastAction.notes && lastAction.notes.length) {
        const newNotesGrid = document.createElement('div');
        newNotesGrid.classList.add('notes-grid');
        for (let i = 0; i < 9; i++) {
            const span = document.createElement('span');
            span.textContent = i + 1;
            if (lastAction.notes[i] !== null) {
                span.classList.add('active');
            }
            newNotesGrid.appendChild(span);
        }
        cell.appendChild(newNotesGrid);
    }
}

document.querySelector('#back').addEventListener('click', function () {
    button_sound.play();
    showConfirmPopup('Do you want to go back to the main page?');
    setConfirmHandler(backToMainHandler);
});

document.getElementById('submit').addEventListener('click', function () {
    button_sound.play();
    showConfirmPopup('Do you want to submit your answer?');
    setConfirmHandler(completionCheckHandler);
});

function showConfirmPopup(title) {
    document.getElementById('confirmPopup').style.display = 'flex';
    document.getElementById('confirmPopupTitle').innerText = title;
}

function showAlertPopup(title) {
    alert_sound.play();

    document.getElementById('confirmPopup').style.display = 'flex';
    document.getElementById('confirmPopupTitle').innerText = title;

    document.getElementById('confirm-btns').style.display = 'none';
    document.getElementById('alert-btn').style.display = 'flex';
}

document.getElementById('confirmPopup-ok').addEventListener('click', function () {
    confirm_sound.play();

    document.getElementById('confirm-btns').style.display = 'flex';
    document.getElementById('alert-btn').style.display = 'none';
    document.getElementById('confirmPopup').style.display = 'none';
});

/* ********************************************************************************** */
// confirmPopup이 공통적으로 쓰이기 때문에 이벤트가 중복 추가되어 문제가 발생한다.

// 현재 #confirmPopup-confirm 버튼에 추가된 이벤트 핸들러 즉 함수를 참조하는 변수. 한마디로 함수.
let currentConfirmHandler;

function backToMainHandler() {
    confirm_sound.play();

    localStorage.setItem("tableHtml", document.querySelector('#sudoku-table tbody').innerHTML);
    localStorage.setItem("gData", gData);
    localStorage.setItem("helpLimit", helpLimit);
    localStorage.setItem("hasData", true);

    document.getElementById("sudoku-main").style.display = "flex";
    document.getElementById("sudoku-play").style.display = "none";
    document.getElementById('confirmPopup').style.display = 'none';

    const resumeElement = document.getElementById('resume');
    if (resumeElement.classList.contains('notActivityBtn')) {
        resumeElement.classList.remove('notActivityBtn');
    }
}

function helpAnswerHandler() {
    help_sound.play();

    const row = selectedCell.dataset.row;
    const col = selectedCell.dataset.col;
    const answer = gData.answer[row][col];
    selectedCell.textContent = answer;
    helpLimit--;
    document.getElementById('helpLimit').innerText = helpLimit;

    selectedCell.classList.add('blink-help');
    isCellAnimating = true;
    selectedCell.addEventListener('animationend', function () {
        selectedCell.classList.remove('blink-help');
        isCellAnimating = false;
    }, { once: true });

    document.getElementById('confirmPopup').style.display = 'none';
}

function completionCheckHandler() {
    document.getElementById('confirmPopup').style.display = 'none';
    checkCompletion();
}

function nextGameStartHandler() {
    clearInterval(fallingParticleInterval);

    playSound(confirm_sound);
    document.getElementById('confirmPopup').style.display = 'none';
    resetGame(selectedDifficulty);
}

// 이벤트가 하나만 추가되어 있도록
function setConfirmHandler(handler) {
    if (currentConfirmHandler) {
        document.getElementById('confirmPopup-confirm').removeEventListener('click', currentConfirmHandler);
    }

    document.getElementById('confirmPopup-confirm').addEventListener('click', handler);
    currentConfirmHandler = handler;
}

/* ********************************************************************************** */

document.getElementById('confirmPopup-cancel').addEventListener('click', function () {
    // 오버헤드도 거의 없으니 괜히 복잡하게 플래그를 둬서 실행여부를 판별하기보단 그냥.
    clearInterval(fallingParticleInterval);

    cancel_sound.play();
    document.getElementById('confirmPopup').style.display = 'none';
});

function deleteSelectedDifficulty() {
    if (selectedDifficulty) {
        document.querySelector(`.difficulty[data-difficulty="${selectedDifficulty}"]`).classList.remove('selected-difficulty');
    }
    selectedDifficulty = null;
}

function initializeSelectedDifficulty() {
    if (selectedDifficulty) {
        document.querySelector(`.difficulty[data-difficulty="${selectedDifficulty}"]`).classList.remove('selected-difficulty');
    }
    selectedDifficulty = 'easy';
    document.querySelector(`.difficulty[data-difficulty="${selectedDifficulty}"]`).classList.add('selected-difficulty');
}

function checkCompletion() {
    let isCompleted = true;

    // 모든 셀을 순회하면서 빈 칸이나 잘못된 값이 있는지 확인
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = table.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            const cellValue = parseInt(cell.textContent, 10);

            // 빈 칸이거나 정답과 맞지 않는 칸이 있으면 완성되지 않았다고 판단
            if (gData.answer[i][j] !== cellValue) {
                isCompleted = false;
                break;
            }
        }
        if (!isCompleted) break;
    }

    let msg = '';
    if (isCompleted) {
        playSound(success_sound);

        fallingParticle();

        msg = 'Success ! Next game?';
        showConfirmPopup(msg);
        setConfirmHandler(nextGameStartHandler);
    } else {
        msg = 'Fail ! Think a little more';
        showAlertPopup(msg);
    }
}

let fallingParticleInterval;
function fallingParticle() {
    fallingParticleInterval = setInterval(() => {
        createRandomParticle();
    }, 10);
}

function createRandomParticle() {
    const container = document.getElementById('confirmPopup-content');

    const particle = document.createElement('div');
    particle.classList.add('particle');

    // 랜덤한 x좌표
    const startX = Math.random() * container.offsetWidth;
    particle.style.left = `${startX}px`;

    // 랜덤한 RGB 색상
    const randomColor = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    particle.style.backgroundColor = randomColor;

    // 0~15px 랜덤 생성
    const randomSize = Math.floor(Math.random() * (16 - 5 + 1)) + 5;
    particle.style.width = `${randomSize}px`;
    particle.style.height = `${randomSize}px`;

    container.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 1000);
}

function resetGame(difficulty) {
    gData = null;
    history = [];
    helpLimit = 3;
    document.getElementById('helpLimit').innerText = helpLimit;
    isNoteActivity = false;
    noteIcon.style.color = '#000';
    selectedCell = null;
    isCellAnimating = false;
    if (!difficulty) {
        initializeSelectedDifficulty();
    }

    // 셀 상태 초기화
    const cells = table.querySelectorAll("[data-row][data-col]");
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove('fixed', 'selected', 'related');

        // .notes-grid 제거.
        // div 아래 span까지 전부 삭제.
        const notesGrid = cell.querySelector('.notes-grid');
        if (notesGrid) {
            cell.removeChild(notesGrid);
        }

        // .active는 span에 달리는 거라 따로 체크해서 지울 필요 없음.
    });
    getSudokuData();
}