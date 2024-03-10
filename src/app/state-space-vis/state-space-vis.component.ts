import { Component, ElementRef, AfterViewInit, Renderer2, HostListener  } from '@angular/core';
import * as PIXI from 'pixi.js'
import { StateSpaceSearchService } from '../services/state-space-search/state-space-search.service';
import { Viewport } from 'pixi-viewport';
import { fast1a52 } from 'fnv-plus'
import * as FontFaceObserver from 'fontfaceobserver';
import { Vector2D } from '../models/vector-2d.model';
import { GlowFilter } from '@pixi/filter-glow';
import { ModalService } from '../services/modal/modal.service';

/* CONVENIENCE ALIASES */
const PI = Math.PI;  
const MAX_TASK_COUNT = StateSpaceSearchService.MAX_TASK_COUNT;

/* CONFIGURABLE PARAMETERS */
const WORLD_HEIGHT: number = 5000;
const WORLD_WIDTH: number = 5000;

// Contour settings
const CONTOUR_COLOUR = 0xf5f5f5;
const CONTOUR_WIDTH = 2;
const CONTOUR_LABEL_OFFSET = 15;  // Px offset between line and contour label text 
const CONTOUR_FONT_SIZE = 60;
const CONTOUR_BORDER_MARGIN = 100;  // Px between 25th (max) contour ring and the border

// Line settings
const SATURATION = 100;
const LUMINANCE = 70;
const LINE_WIDTH = 2;
const SPREAD = 165;  // Front-facing spread for lines. Max value is 180 which represents the tangent line of the ring.

// Z-Index Values
const Z_CONTOUR = 1;
const Z_CONTOUR_LABEL = 100;
const Z_OPTIMUM_NODE = 150;
const Z_LINE = 5;

// Ring Discretisation
const RESOLUTION_INCREASE_FACTOR = 0.25; // How fast the resolution increases as rings increase. Higher numbers result in faster increases. Cannot be negative.

/* CALCULATED CONSTANTS */
const INTER_NODE_DISTANCE = (Math.min(WORLD_HEIGHT, WORLD_WIDTH) - CONTOUR_BORDER_MARGIN * 2) / (2 * MAX_TASK_COUNT);
const WORLD_CENTRE = new Vector2D(WORLD_WIDTH/2, WORLD_HEIGHT/2);

@Component({
  selector: 'app-state-space-vis',
  templateUrl: './state-space-vis.component.html',
  styleUrls: ['./state-space-vis.component.css']
})
export class StateSpaceVisComponent implements AfterViewInit {
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;

  private parentMap: Map<number, number|PIXI.Graphics> = new Map();  // Parent map will either store a parent key or a PIXI.Graphics if already drawn.

  private taskCount: number = 0;

  private _tickerCounter: number = 0;
  private _glowFilter = new GlowFilter({  // Glow effect for the optimal schedule node at the end.
    distance: 20,
    innerStrength: 4,
    outerStrength: 4
  });
  
  // Draw Optimisations
  private drawSlots: any = [];

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2, 
    private modalService: ModalService,
    private stateSpaceSearchService: StateSpaceSearchService,
    ) {
    this.app = new PIXI.Application({
      background: '#111212',
      resizeTo: el.nativeElement,
      antialias: true,
      resolution: 1
    });
    
    // create viewport
    this.viewport = new Viewport({
      screenWidth: this.el.nativeElement.offsetWidth,
      screenHeight: this.el.nativeElement.offsetHeight,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,

      events: this.app.renderer.events // important for wheel to work properly when renderer.view is placed or scaled
    }) as any;
    this.app.stage.addChild(this.viewport)

    this.viewport.moveCenter(WORLD_CENTRE.x, WORLD_CENTRE.y)
    this.viewport
      .drag()
      .wheel()
      .decelerate()
      .bounce()
      .pinch()
      .snapZoom({
        width: 2500,
        time: 100,
        ease: 'easeInOutSine', 
        interrupt: true, 
        removeOnComplete: true, 
        removeOnInterrupt: false, 
        forceStart: true,
    })
    this.viewport.sortableChildren = true;

    // Draw world border
    const line = this.viewport.addChild(new PIXI.Graphics())
    line.lineStyle(3, 0xfafafa).drawRoundedRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 15)

    // Draw world background
    const texture = PIXI.Texture.from("assets/topo_square.png");
    const sprite = new PIXI.TilingSprite(texture, WORLD_WIDTH, WORLD_HEIGHT);
    this.viewport.addChild(sprite)
  }

  ngAfterViewInit(): void {
    // Append PIXI canvas to component root
    this.renderer.appendChild(this.el.nativeElement, this.app.view);

    let font = new FontFaceObserver('Jura', {
      weight: 700
    });

    // Subscribe to updates
    this.stateSpaceSearchService.taskCount$.subscribe((taskCount) => {
      if (taskCount > 0 && taskCount <= MAX_TASK_COUNT) {
        this.taskCount = taskCount;

        // Ensure fonts are loaded before drawing contour labels
        font.load().then(() => {
          console.log('All fonts loaded');

          this.drawTaskCountContours(taskCount);
          this.generateDrawSlots(taskCount);

          // Subscribe to schedule data updates
          this.stateSpaceSearchService.scheduleData$.subscribe((data) => {
            if (data) {
              this.processDataUpdate(data)
            } else {
              console.log("Null data received from schedule data subscription! (Ignore if displayed on startup)")
            }
          });

        })
      } else {
        console.log(`Invalid task count received. ${taskCount}. Must be above 0 and below ${MAX_TASK_COUNT+1}. (Ignore if displayed on startup)`)
      }
      
    })
  }

  /**
   * Draws a circular contour for each task count.
   * 
   * @param numTasks number of tasks to schedule.
   */
  drawTaskCountContours(numTasks: number) {
    // Draw origin circle
    const originCircle = new PIXI.Graphics();
    originCircle.position.set(WORLD_CENTRE.x, WORLD_CENTRE.y)
    originCircle.beginFill(0xffffff);
    originCircle.drawCircle(0, 0, 50);
    originCircle.endFill();

    this.viewport.addChild(originCircle);

    // Add empty schedule into parent map
    this.parentMap.set(this.getObjectHash([]), originCircle);

    for (let i = 1; i <= numTasks; i++) {
      const contourCircle = new PIXI.Graphics();
      contourCircle.zIndex = Z_CONTOUR;
      contourCircle.lineStyle(CONTOUR_WIDTH, CONTOUR_COLOUR, 1);
      contourCircle.arc(WORLD_CENTRE.x, WORLD_CENTRE.y, i*(INTER_NODE_DISTANCE), 0, 2*PI);
      this.viewport.addChild(contourCircle)

      const contourLabel = new PIXI.Text(i.toString(), new PIXI.TextStyle({
        fontFamily: "jura",
        fontSize: CONTOUR_FONT_SIZE,
        fontWeight: "700",
        textBaseline: "bottom",
        fill: CONTOUR_COLOUR
      }))
      contourLabel.x = WORLD_CENTRE.x + i*(INTER_NODE_DISTANCE) + CONTOUR_LABEL_OFFSET;
      contourLabel.y = WORLD_CENTRE.y;
      contourLabel.zIndex = Z_CONTOUR_LABEL;
      this.viewport.addChild(contourLabel)
    }
  }

  processDataUpdate(data: any) {
    let parentHash = this.getObjectHash(data["parent"]["tasks"]);  // Newest data point to be processed

    // Record the source (parent) schedule hash of each partial schedules
    for (let sch of data["schedules"]) {
      this.parentMap.set(this.getObjectHash(sch["tasks"]), parentHash);
    }

    // Draw line if the parent is not the empty schedule (which is already drawn at origin)
    if (data["parent"]["tasks"].length != 0) {
      // To draw the parent (processed) sch, we get the grandparent's position and do a deterministic offset facing forwards.
      // First, get Great-grandparent --> Grandparent's line. 
      let grandParentHash = this.parentMap.get(parentHash) as number;
      let grandparentGraphic = this.parentMap.get(grandParentHash) as PIXI.Graphics;  // Because this node exists, we have already expanded the grandparent node.

      let grandparentPos = new Vector2D(grandparentGraphic.position.x, grandparentGraphic.position.y);
      let grandparentDir = new Vector2D(grandparentPos.x-WORLD_CENTRE.x, grandparentPos.y-WORLD_CENTRE.y);
      if (grandparentDir.isZeroVector()) {
        // Set direction vector to be random, but deterministic, if our grandparent is the empty schedule.
        // The combination of initial schedule + taskCount should always result in the tree leaving origin in the same direction.
        grandparentDir = new Vector2D(((parentHash+this.taskCount) / (2**52-1)) - 0.5, (this.getObjectHash(data["schedules"][0]) / (2**52-1)) - 0.5);
      }
      
      // Calculate deterministic forward-facing offset (0 -> 180 inclusive from tangent)
      let angle_offset = this.degToRad(parentHash % (SPREAD)) - this.degToRad(SPREAD/2);  // offset is deterministic based on hash.

      let spreadVector = new Vector2D(
        grandparentDir.x * Math.cos(angle_offset) - grandparentDir.y * Math.sin(angle_offset), 
        grandparentDir.x * Math.sin(angle_offset) + grandparentDir.y * Math.cos(angle_offset)
      )

      // Calculate coordinates of the node on the contour line.
      let numTasks = data["parent"]["tasks"].length;
      let target_coord = this.getContourIntersect(spreadVector, grandparentPos, WORLD_CENTRE, numTasks*INTER_NODE_DISTANCE);

      let theta = Math.atan2(target_coord.y-WORLD_CENTRE.x, target_coord.x-WORLD_CENTRE.y);  // Radians between x-axis unit vector to CENTRE -> TARGET, clockwise.

      // Check if the slot we were going to draw at is already taken
      // Ring '1' is actually the 0th index in our draw slot map.
      if (this.drawSlots[numTasks-1][this.getDrawSlotIdx(theta, numTasks-1)] != undefined) {
        // Our draw slot is already taken. Don't draw again and just reuse the previous line.
        this.parentMap.set(parentHash, this.drawSlots[numTasks-1][this.getDrawSlotIdx(theta, numTasks-1)]);
      } else {
        // Draw slot is free, draw the line.
        const line = new PIXI.Graphics();
        line.lineStyle({
          width: LINE_WIDTH,
          color: new PIXI.Color(
            { h: this.radToDeg(theta), 
              s: SATURATION, 
              l: LUMINANCE
            }),
          cap: PIXI.LINE_CAP.ROUND
        });
        line.position.set(target_coord.x, target_coord.y)
        line.moveTo(0,0)
        line.lineTo(grandparentPos.x-target_coord.x, grandparentPos.y-target_coord.y);
        line.zIndex = Z_LINE;
        this.viewport.addChild(line);
        this.parentMap.set(parentHash, line);
        this.drawSlots[numTasks-1][this.getDrawSlotIdx(theta, numTasks-1)] = line;
      }

      // Draw interactive btn if optimal schedule node
      if (data["parent"]["tasks"].length == this.taskCount) {
        const optimalCircle = new PIXI.Graphics();
        optimalCircle.position.set(target_coord.x, target_coord.y)
        optimalCircle.beginFill(0xffffff);
        optimalCircle.drawCircle(0, 0, 10);
        optimalCircle.endFill();
        optimalCircle.filters = [this._glowFilter];
        optimalCircle.zIndex = Z_OPTIMUM_NODE;
        optimalCircle.onclick = () => {this.modalService.showSummary()};
        optimalCircle.eventMode = "static";
        optimalCircle.cursor = "pointer"
        this.viewport.addChild(optimalCircle);

        // Start glowing animation
        PIXI.Ticker.targetFPMS = 0.03;  // 30 FPS
        this.app.ticker.add(() => {
          this._tickerCounter += 0.005;

          const glowHue = Math.cos(this._tickerCounter) * 360;
          this._glowFilter.color = this.hslToColourInt(glowHue, SATURATION, LUMINANCE);
        });

      }
    }
  }

  /**
   * Gets the intersection between a secant line from point p in the direction d and a circle centred at c with radius r
   * The function will always return the point in the direction of the vector d
   * @param d direction vector of the line
   * @param p point vector of the line
   * @param c centre of circle to intersect
   * @param r radius of circle ot intersect
   * @returns intersection point in the direction of the vector 
   */
  getContourIntersect(d: Vector2D, p: Vector2D, c: Vector2D, r: number) {
    // Transform such that origin is at p, calculate intersection, then transform result back into original coordinate space.
    const A = d.x ** 2 + d.y ** 2;
    const B = 2 * (d.x * (p.x - c.x) + d.y * (p.y - c.y));
    const C = (p.x - c.x) ** 2 + (p.y - c.y) ** 2 - r ** 2;
    const discriminant = B ** 2 - 4 * A * C;

    const t = (-B + Math.sqrt(discriminant)) / (2 * A);

    return new Vector2D(p.x + t * d.x, p.y + t * d.y);
  }

  /**
   * Returns the 32-bit FNV-1a integer hash of the given object.
   * 
   * @param obj object to hash
   * @returns 32-bit integer hash
   */
  getObjectHash(obj: Object) {
    return fast1a52(JSON.stringify(obj));
  }

  /**
   * Converts degrees into radians.
   * @param deg angle in degrees
   * @returns equivalent angle in radians
   */
  degToRad(deg: number) {
    return (deg*(PI/180))
  }

   /**
   * Converts degrees into radians.
   * @param deg angle in degrees
   * @returns equivalent angle in radians
   */
   radToDeg(rad: number) {
    return (rad*(180/PI))
  }

  /**
   * Converts HSL to an integer
   * @param h Hue
   * @param s Saturation
   * @param l Luminance
   * @returns integer form of the given colour
   */
  hslToColourInt(h: number, s: number, l: number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return parseInt(`${f(0)}${f(8)}${f(4)}`, 16);
  }

  /**
   * Gets the draw slot index.
   * @param angle angle in radians from x-axis unit vector, clockwise.
   * @param ringIdx index of the current ring (since draw slot discretisation resolution may vary depending on ring)
   */
  getDrawSlotIdx(angle: number, ringIdx: number) {
    return Math.abs(Math.floor(((angle < 0 ? angle + 2*PI : angle) % (2*PI)) / this._calcDrawSlotResolution(ringIdx)));
  }

  /**
   * Generates the draw slot map
   * @param numTasks number of tasks
   */
  generateDrawSlots(numTasks: number) {
    for (let i = 0; i < numTasks; i++) {
      console.log(`DRAW MAP FOR RING ${i} = ${Math.ceil(2*PI/this._calcDrawSlotResolution(i))} with resolution ${this.radToDeg(this._calcDrawSlotResolution(i))} Deg`)
      this.drawSlots.push(new Array(Math.ceil(2*PI/this._calcDrawSlotResolution(i))))
    }
  }

  /**
   * Draw slot discretisation resolution.
   * 
   * NOTE: The last ring will only ever contain 1 line - the optimal schedule. 
   * Hence, return 2PI as resolution to have only 1 slot.
   * 
   * @param ringIdx index of the ring to discretise into draw slots.
   * @returns resolution of the draw slots
   */
  _calcDrawSlotResolution(ringIdx: number) {
    return ringIdx != (this.taskCount - 1) ? this.degToRad(2 ** (-RESOLUTION_INCREASE_FACTOR * ringIdx)) : 2*PI;
  }

  /**
   * Dynamically adjusts container scale to match window resize.
   * @param event resize event
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.viewport.resize(this.el.nativeElement.offsetWidth, this.el.nativeElement.offsetHeight);
  }
}
