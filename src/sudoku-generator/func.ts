// 배열 초기화.
export function create2DEmptyArray(size: number): number[][] {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

// Fisher-Yates shuffle.
export function shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const index = Math.floor(Math.random() * (i + 1)); // 0부터 i까지의 난수 인덱스 생성
        const temp = arr[index];
        arr[index] = arr[i];
        arr[i] = temp;
    }
}

// 주어진 범위 내에서 랜덤한 숫자 생성.
export function getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function copyBoard(board: number[][]): number[][] {
    return board.map(row => [...row]);
}