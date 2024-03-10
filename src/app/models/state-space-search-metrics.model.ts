export class StateSpaceSearchMetrics {
    numStates: number;
    numProcessed: number;
    constructor(numStates: number, numProcessed: number) {
      this.numStates = numStates;
      this.numProcessed = numProcessed;
    }
  }