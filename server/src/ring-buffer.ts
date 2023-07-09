export class RingBuffer<T> {
    private readonly _buffer: T[];
    private _cursor: number;
    private readonly _capacity: number;

    constructor(capacity: number = 200) {
        this._capacity = capacity;
        this._buffer = new Array<T>(capacity);
        this._cursor = 0;
    }

    push(item: T): void {
        this._buffer[this._cursor] = item;
        this._cursor = (this._cursor + 1) % this._capacity;
    }

    get(index: number): T {
        if (index >= this._capacity) {
            throw new Error('Index out of bounds');
        }
        return this._buffer[(this._cursor + index) % this._capacity];
    }

    getAll(): T[] {
        let result = [];
        for(let i = this._cursor; i < this._cursor + this._capacity; i++) {
            result.push(this._buffer[i % this._capacity]);
        }
        return result;
    }
}
