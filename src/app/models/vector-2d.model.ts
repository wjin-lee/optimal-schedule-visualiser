export class Vector2D {
    x: number;
    y: number;
  
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    // Not used in current implementation.
    // dot(vec: Vector2D) {
    //     return vec.x * this.x + vec.y * this.y ;
    // }

    dot(x:number, y:number) {
        return x * this.x + y * this.y ;
    }

    normalise() {
        let normConst = Math.sqrt(this.x*this.x + this.y*this.y)
        this.x = this.x/normConst;
        this.y = this.y/normConst;
    }

    isZeroVector() {
        return (this.x == 0 && this.y == 0) || (this.x == undefined && this.y == undefined);
    }
  }