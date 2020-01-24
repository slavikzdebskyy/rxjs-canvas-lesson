import { fromEvent } from "rxjs";
import { map, pairwise, switchMap, takeUntil, startWith, withLatestFrom, pluck } from "rxjs/operators";

const canvas = document.querySelector('canvas');
const range = document.getElementById('range');
const color = document.getElementById('color');

const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
const scale = window.devicePixelRatio;

canvas.width = rect.width * scale;
canvas.height = rect.height * scale;
ctx.scale(scale, scale);


const canvasStream$ = fromEvent(canvas, 'mousemove');
const mouseDownStream$ = fromEvent(document, 'mousedown');
const mouseUpStream$ = fromEvent(document, 'mouseup');
const mouseOutStream$ = fromEvent(document, 'mouseout');
const rangeStream$ = fromEvent(range, 'input').pipe(customFilter(2));
const colorStream$ = fromEvent(color, 'input').pipe(customFilter('#000'));

function customFilter(startVal) {
  return stream => {
    return stream
    .pipe(
      pluck('target', 'value'),
      startWith(startVal),
    );
  };
}

mouseDownStream$
  .pipe(
    withLatestFrom(rangeStream$, colorStream$, (_, range, color) => {
      return {
        range,
        color,
      };
    }),
    switchMap((options) => canvasStream$
      .pipe(  
        map(({offsetX, offsetY}) => {
          return {
            x: offsetX,
            y: offsetY,
            options,
          }
        }),
        pairwise(),
        takeUntil(mouseUpStream$),
        takeUntil(mouseOutStream$),
      )
    )
  )
  .subscribe(
    ([from, to]) => {
      const { range, color } = from.options;
      
      ctx.beginPath();
      ctx.lineWidth = range;
      ctx.strokeStyle = color;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  )



