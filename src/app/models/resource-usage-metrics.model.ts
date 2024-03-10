export class ResourceUsageMetrics {
    cpuUsage: number;
    memoryUsage: number;
  
    constructor(cpuUsage:number, memoryUsage: number) {
      this.cpuUsage = cpuUsage;
      this.memoryUsage = memoryUsage;
    }
  }