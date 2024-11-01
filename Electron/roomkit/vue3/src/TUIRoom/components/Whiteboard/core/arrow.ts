import { fabric } from 'fabric';

fabric.Arrow = fabric.util.createClass(fabric.Line, {
  type: 'arrow',
  superType: 'drawing',
  initialize(points: number[], options: any) {
    if (!points) {
      const { x1, x2, y1, y2 } = options;
      points = [x1, y1, x2, y2];
    }
    options = options || {};
    this.callSuper('initialize', points, options);
    this.arrowWidth = 7;
    this.arrowHeight = 7;
  },
  _render(ctx: any) {
    this.callSuper('_render', ctx);
    ctx.save();
    const xDiff = this.x2 - this.x1;
    const yDiff = this.y2 - this.y1;
    const angle = Math.atan2(yDiff, xDiff);
    ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
    ctx.rotate(angle);
    ctx.beginPath();
    // Move 5px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
    ctx.moveTo(this.arrowWidth, 0);
    ctx.lineTo(-this.arrowWidth, this.arrowHeight);
    ctx.lineTo(-this.arrowWidth, -this.arrowHeight);
    ctx.closePath();
    ctx.fillStyle = this.stroke;
    ctx.fill();
    ctx.restore();
  },
});

fabric.Arrow.fromObject = (options: any, callback: any) => {
  const { x1, x2, y1, y2 } = options;
  const arrow = new fabric.Arrow([x1, y1, x2, y2], {
    ...options,
  });
  callback(arrow);
};

export default fabric.Arrow;
