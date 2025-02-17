export default class SudokuGenerator {
    private readonly SIZE: number = 9;
    private board: number[][] = create2DEmptyArray(this.SIZE);

    // 행, 열, 서브그리드에 숫자 중복 체크.
    // this.subgrid[4][3] = 1; 이라면,
    // 4번 그리드에 3이란 숫자는 이미 쓰임.
    // 2차원 인덱스에 1~9 사이의 값이 들어가야 해서 SIZE + 1로 초기화.
    private row: number[][] = create2DEmptyArray(this.SIZE + 1);
    private col: number[][] = create2DEmptyArray(this.SIZE + 1);
    private subgrid: number[][] = create2DEmptyArray(this.SIZE + 1);

    // 스도쿠 생성.
    public generate(difficulty: string): { answer: number[][], question: number[][] } {
        let removeCount: number = 0;

        if(difficulty === 'easy') removeCount = getRandomNumber(50, 55);
        else if(difficulty === 'normal') removeCount = getRandomNumber(45, 50);

        this.initBoard();
        this.makeBoard(0);
        // console.log('answer ->', answer);
        const answer = copyBoard(this.board);

        this.removeBoardValue(removeCount);
        // console.log('question ->', question);
        const question = copyBoard(this.board);

        return { answer, question };
    }

    // 스도쿠 초기화.
    private initBoard(): void {
        // 9x9 스도쿠 보드의 서브그리드(3x3 작은 보드) 번호가 다음과 같다고 가정.
        //
        // 0 1 2
        // 3 4 5
        // 6 7 8
        const _diagSubgrid: number[] = [0, 4, 8];

        // offset의 값은 0, 3, 6으로 변화하며
        // 9x9 스도쿠 보드에서 0, 4, 8번 서브그리드의 좌상단 행과 열의 값.
        for (let offset = 0; offset < this.SIZE; offset += 3) {

            let _arr: number[] = new Array(this.SIZE);
            for(let i = 0; i < this.SIZE; i++){
                _arr[i] = i + 1;
            }
            shuffleArray(_arr);

            // 숫자 중복 체크를 위한 로직.
            for (let idx = 0; idx < this.SIZE; idx++) {
                // i, j의 값은
                // 0, 0 -> 0, 1 -> 0, 2
                // 1, 0 -> 1, 1 -> 1, 2
                // 2, 0 -> 2, 1 -> 2, 2
                const i: number = Math.floor(idx / 3);
                const j: number = idx % 3;
                this.row[offset + i][_arr[idx]] = 1;
                this.col[offset + j][_arr[idx]] = 1;

                // k의 값은 0, 4, 8
                const k: number = _diagSubgrid[Math.floor(offset / 3)];
                this.subgrid[k][_arr[idx]] = 1;        

                this.board[offset + i][offset + j] = _arr[idx];
            }
        }
    }

    // 재귀적인 방법으로 퍼즐을 완성하는 메서드
    private makeBoard(boardIdx: number): boolean {
        // 퍼즐 완성.
        if (boardIdx === this.SIZE * this.SIZE) return true;

        // 현재 boardIdx를 기반으로 현재 행(i)과 열(j)을 계산.
        const i: number = Math.floor(boardIdx / this.SIZE);
        const j: number = boardIdx % this.SIZE;
        
        // 값이 할당되어져 있으면 다음 칸으로 이동.
        if (this.board[i][j] !== 0) return this.makeBoard(boardIdx + 1);
        
        // 1 ~ 9 사이 랜덤한 숫자를 기준으로 배열 생성.
        // randomNumber = 7이면 numbers = [8, 9, 1, 2, 3, 4, 5, 6, 7]로 초기화.
        const randomNumber: number = Math.floor(Math.random() * this.SIZE) + 1; // 1 ~ 9
        const numbers: number[] = Array.from({ length: this.SIZE }, (_, index) => {
            return (index + randomNumber) % this.SIZE + 1;
        });

        for (let idx = 1; idx <= this.SIZE; idx++) {
            // 현재 boardIdx에 넣으려는 값.
            const candidateNumber: number = numbers[idx];

            // 현재 위치 (i, j)가 속한 서브그리드 번호 k를 계산.
            const k: number = Math.floor(i / 3) * 3 + Math.floor(j / 3);

            // 중복이 없으면,
            if (this.row[i][candidateNumber] === 0 && this.col[j][candidateNumber] === 0 && this.subgrid[k][candidateNumber] === 0) {
                // 중복 체크 변수들을 업데이트하고 board에 후보 숫자를 할당.
                this.row[i][candidateNumber] = this.col[j][candidateNumber] = this.subgrid[k][candidateNumber] = 1;
                this.board[i][j] = candidateNumber;

                // 보드의 다음 칸으로 재귀적 이동.
                // 다음 칸에서 유효한 값을 찾을 수 없다면 현재 candidateNumber 값이 유효하지 않다는 의미.
                // 중복 체크 변수와 board의 값을 0으로 다시 되돌리고, for문을 계속 진행한다.
                if (this.makeBoard(boardIdx + 1)) {
                    return true;
                } else {
                    this.row[i][candidateNumber] = this.col[j][candidateNumber] = this.subgrid[k][candidateNumber] = 0;
                    this.board[i][j] = 0;
                }
            }
        }
        
        // 현재 위치에서 유효한 값을 찾지 못했다면 false를 리턴.
        return false;
    }

    // 완성된 보드에서 랜덤하게 값을 제거해 문제를 생성.
    private removeBoardValue(numToRemove: number): void {
        // 한계.
        if (numToRemove > 60) numToRemove = 60;

        // 보드의 좌표를 순서대로 초기화한 후,
        // 이후 numToRemove만큼 제거할 때 순차적으로 제거할 것이므로 그 전에 먼저 섞는다.
        const positions: Position[] = [];
        for (let i = 0; i < this.SIZE; i++) {
            for (let j = 0; j < this.SIZE; j++) {
                positions.push(new Position(i, j));
            }
        }
        shuffleArray(positions);
        
        this.removeWithBackTracking(numToRemove, positions);
    }

    private removeWithBackTracking(numToRemove: number, positions: Position[]): boolean {
        // 제거할 수를 다 제거하면 메서드 종료.
        if (numToRemove === 0) return true;

        for (let idx = 0; idx < positions.length; idx++) {
            // 보드 인덱스를 행, 열로 치환.
            const i = positions[idx].x;
            const j = positions[idx].y;

            // 보드에서 값 가져와 제거.
            const targetValue = this.board[i][j];
            this.removeNumber(i, j, targetValue);

            // 제거하고 나서 유일해 확인.
            // 유일해가 보증된다면 다음 칸을 제거하기 위해 재귀적 호출.
            // 유일해가 없다면 롤백.
            if (this.hasUniqueSolution()) {
                // 현재 positions를 얕은 복사하여 newPositions에 할당.
                const newPositions = positions.slice();
                // newPositions[idx] 삭제.
                newPositions.splice(idx, 1);

                if (this.removeWithBackTracking(numToRemove - 1, newPositions)) return true;
            } else {
                this.restoreNumber(i, j, targetValue);
            }
        }

        return false;
    }

    private removeNumber(x: number, y: number, num: number): void {
        this.board[x][y] = 0;
        this.row[x][num] = 0;
        this.col[y][num] = 0;
        this.subgrid[Math.floor(x / 3) * 3 + Math.floor(y / 3)][num] = 0;
    }

    private restoreNumber(x: number, y: number, num: number): void {
        this.board[x][y] = num;
        this.row[x][num] = 1;
        this.col[y][num] = 1;
        this.subgrid[Math.floor(x / 3) * 3 + Math.floor(y / 3)][num] = 1;
    }

    private hasUniqueSolution(): boolean {
        // 유일한 해를 검증하는 백트래킹 메서드
        return this.proveWithBackTracking() === 1;
    }
    
    private proveWithBackTracking(): number {
        // 해의 개수를 담을 변수.
        let countSolution: number = 0;

        // 탐색할 다음 빈 칸 좌표를 받는다.
        let nextEmpty: number[] | null = this.findNextEmptyCell(this.board);

        // 탐색할 다음 빈 칸이 없으면, 메서드 종료.
        if (nextEmpty === null) return 1;
    
        let i: number = nextEmpty[0];
        let j: number = nextEmpty[1];
    
        // 수를 하나씩 넣어본다.
        for (let num = 1; num <= this.SIZE; num++) {
            // 넣어본 수가 유효하다면,
            if (this.isValid(i, j, num)) {
                // 저장하고,
                this.board[i][j] = num;
                this.row[i][num] = 1;
                this.col[j][num] = 1;
                this.subgrid[Math.floor(i / 3) * 3 + Math.floor(j / 3)][num] = 1;
    
                // 다음 칸을 탐색.
                countSolution += this.proveWithBackTracking();
    
                // 유일해를 검증하기 위해 넣었던 값을 되돌린다.
                this.board[i][j] = 0;
                this.row[i][num] = 0;
                this.col[j][num] = 0;
                this.subgrid[Math.floor(i / 3) * 3 + Math.floor(j / 3)][num] = 0;
    
                // 유일해가 아니라면 더 연산하지 않고 종료.
                if (countSolution > 1) return countSolution;
            }
        }

        return countSolution;
    }

    // 효율적인 백트래킹을 위한 휴리스틱.
    private findNextEmptyCell(_board: number[][]): number[] | null {
        // 한 칸에 들어갈 수 있는 경우의 수는 1 ~ 9로 옵션의 수는 최대 9개.
        // 가장 적은 경우의 수를 담을 변수. 최댓값으로 초기화.
        let minOptions: number = this.SIZE;

        // 가장 적은 경우의 수를 가진 셀의 좌표를 담은 변수.
        let minOptionsCell: number[] | null = null;
    
        // 모든 위치를 탐색하여,
        for (let i = 0; i < this.SIZE; i++) {
            for (let j = 0; j < this.SIZE; j++) {
                // 현재 위치가 비었다면,
                // 현재 위치에 1 ~ 9 중 몇 개나 들어갈 수 있는지 카운트.
                if (_board[i][j] === 0) {
                    let options: number = 0;
                    for (let num = 1; num <= this.SIZE; num++) {
                        if (this.isValid(i, j, num)) options++;
                    }
                    if (options < minOptions) {
                        minOptions = options;
                        minOptionsCell = [i, j];
                    }
                }
            }
        }
        
        return minOptionsCell;
    }

    // 행, 열 그리고 보드 인덱스에 삽입된 값을 받아 중복 체크.
    private isValid(x: number, y: number, num: number): boolean {
        let d: number = Math.floor(x / 3) * 3 + Math.floor(y / 3);
        if (this.row[x][num] === 1) return false;
        if (this.col[y][num] === 1) return false;
        if (this.subgrid[d][num] === 1) return false;
        return true;
    }
}

class Position {
    public x: number;
    public y: number;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

// 배열 초기화.
function create2DEmptyArray(size: number): number[][] {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

// Fisher-Yates shuffle.
function shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const index = Math.floor(Math.random() * (i + 1)); // 0부터 i까지의 난수 인덱스 생성
        const temp = arr[index];
        arr[index] = arr[i];
        arr[i] = temp;
    }
}

// 주어진 범위 내에서 랜덤한 숫자 생성.
function getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function copyBoard(board: number[][]): number[][] {
    return board.map(row => [...row]);
}