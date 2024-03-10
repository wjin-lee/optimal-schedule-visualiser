import { Component } from '@angular/core';
import Chart from 'chart.js/auto';
import { ModalService } from '../services/modal/modal.service';

/* CONFIGURABLE PARAMETERS */
const GRID_COLOUR: string = "#787878";
const FONT_COLOUR: string = "#fafafa"

const BAR_SATURATION: number = 80;
const BAR_LUMINANCE: number = 70;
const BAR_BORDER_LUMINANCE: number = 40;
const BAR_TRANSPARENCY: number = 95;

const BORDER_WIDTH: number = 3;
const BORDER_RADIUS: number = 7;


@Component({
  selector: 'app-schedule-visualiser',
  templateUrl: './schedule-visualiser.component.html',
  styleUrls: ['./schedule-visualiser.component.css']
})
export class ScheduleVisualiserComponent {
  chart: any;

  constructor(private modalService: ModalService) { }

  ngOnInit(): void {
    Chart.defaults.font.family = "Jura";
    this.drawSchedule(this.modalService.optimalSchedule);
  }

  drawSchedule(optimal_schedule: any) {
    let tasks = optimal_schedule["tasks"];
    // Sort by start time. (Required to determine colour in increasing hue order)
    tasks.sort((a: any, b: any) =>
      (a["startTime"] > b["startTime"]) ? 1 : ((b["startTime"] > a["startTime"]) ? -1 : 0)
    )

    let maxProc = 0;
    let datasets = []

    for (let i = 0; i < tasks.length; i++) {
      let task = tasks[i];
      let taskData = (new Array(task["processor"] + 1)).fill([0, 0]);
      taskData[taskData.length - 1] = [task["startTime"], task["endTime"]]
      if (task["processor"] > maxProc) {
        maxProc = task["processor"];
      }

      let hue = i * (360 / (tasks.length));
      datasets.push({
        label: task["name"],
        data: taskData,
        backgroundColor: `hsla(${hue}, ${BAR_SATURATION}%, ${BAR_LUMINANCE}%, ${BAR_TRANSPARENCY}%)`,
        borderWidth: BORDER_WIDTH,
        borderRadius: BORDER_RADIUS,
        borderColor: `hsla(${hue}, ${BAR_SATURATION}%, ${BAR_BORDER_LUMINANCE}%, ${BAR_TRANSPARENCY}%)`,
        borderSkipped: false,
      });
    }

    const data = {
      labels: [...Array(maxProc + 1).keys()].map(i => `Processor ${i}`),
      datasets: datasets
    }

    this._drawChart(data);
  }

  _drawChart(data: any) {
    this.chart = new Chart("schedule-bar-chart", {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',  // Horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (item: any) => `Task ${item[0].dataset.label}`,
              label: (item: any) => `${item.raw[0]} ›› ${item.raw[1]}`,
              beforeBody: (item: any) => `Cost: ${item[0].raw[1] - item[0].raw[0]}`
            }
          }
        },
        layout: {
          padding: {
            left: 10
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Time",
              color: FONT_COLOUR
            },
            ticks: {
              color: FONT_COLOUR,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              color: GRID_COLOUR
            }
          },
          y: {
            stacked: true,
            ticks: {
              color: FONT_COLOUR,
              padding: 12,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              color: GRID_COLOUR
            }
          }
        }
      }
    });
  }
}
