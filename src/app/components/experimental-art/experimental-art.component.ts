import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as p5 from 'p5';
@Component({
  selector: 'app-experimental-art',
  templateUrl: './experimental-art.component.html',
  styleUrls: ['./experimental-art.component.scss']
})
export class ExperimentalArtComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas', {static: true}) canvas: ElementRef<HTMLElement> | undefined
  sketch: p5 | undefined
  noiseScale: number = 100
  particleCount: number = 1000
  particles: any[] = []
  canvasStyle = {
    width: 480,
    height: 480
  }
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const draw = (p: p5) => {
      const self = this

      let noiseImg: any = {}
      const genNoiseImg = () => {
        const noiseImg = p.createGraphics(self.canvasStyle.width, self.canvasStyle.height);
        noiseImg.loadPixels();
        const widthd = self.canvasStyle.width*p.pixelDensity();
        const heightd = self.canvasStyle.height*p.pixelDensity();
        for(var i=0; i<widthd; i++){
          for(var j=0; j<heightd; j++){
            var x = i/p.pixelDensity();
            var y = j/p.pixelDensity();
            var bright = p.pow(p.noise(x/self.noiseScale, y/self.noiseScale)-0.3, 1/2.0)*400;
            noiseImg.pixels[(i+j*widthd)*4] = bright;
            noiseImg.pixels[(i+j*widthd)*4+1] = bright;
            noiseImg.pixels[(i+j*widthd)*4+2] = bright;
            noiseImg.pixels[(i+j*widthd)*4+3] = 255;
          }
        }
        noiseImg.updatePixels();
        return noiseImg
      }
      const curl = (x: number, y: number) => {
        const EPSILON = 0.0001;//sampling interval
        //Find rate of change in X direction
        let n1 = p.noise(x + EPSILON, y);
        let n2 = p.noise(x - EPSILON, y);
        //Average to find approximate derivative
        const cx = (n1 - n2)/(2 * EPSILON);

        //Find rate of change in Y direction
        n1 = p.noise(x, y + EPSILON);
        n2 = p.noise(x, y - EPSILON);

        //Average to find approximate derivative
        const cy = (n1 - n2)/(2 * EPSILON);

        //return new createVector(cx, cy);//gradient toward higher position
        // @ts-ignore
        return new p.createVector(cy, -cx);//rotate 90deg
      }


      p.setup = () => {

        const canvas = p.createCanvas(self.canvasStyle.width, self.canvasStyle.height);
        canvas.parent("sketch")
        p.noiseDetail(1,0)
        p.background("rgb(255,255,255)")
        noiseImg = genNoiseImg()
        p.image(noiseImg, 0, 0)
        for(let i=0; i<self.particleCount; i++){
          const particle: any = {};

          particle.pos = p.createVector(p.random(self.canvasStyle.width), p.random(self.canvasStyle.height));
          self.particles.push(particle);//add particle to particle list
        }
      };

      p.draw = () => {
        p.tint(255, 4);
        p.image(noiseImg, 0, 0);//fill with transparent noise image
        //fill(0, 4);
        //rect(0, 0, width, height);

        p.strokeWeight(2);//particle size
        p.stroke("rgb(159,42,42)");


        for(let i=0; i<self.particles.length; i++){
          const pa = self.particles[i];//pick a particle
          pa.pos.add(curl(pa.pos.x/self.noiseScale, pa.pos.y/self.noiseScale));
          p.point(pa.pos.x, pa.pos.y);
        }
      };
    }
    this.sketch = new p5(draw)
  }

}
