import React from 'react';
import { getRelativeCoords } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';

interface CustomArrowOverlayProps {
  arrows: Arrow[];
  marks?: Mark[];
  boardSize: number;
  boardOrientation?: 'white' | 'black';
  arrowBorderColor?: string;
}

const squareToCoords = (
  square: string,
  boardSize: number,
  boardOrientation: 'white' | 'black' = 'white'
): { x: number; y: number } =>
  getRelativeCoords(boardOrientation, boardSize, 8, 8, square);

const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  headSize: number = 20,
  borderColor: string = 'black',
  lineWidth: number = 2,
  opacity: number = 0.8,
  squareSize: number = 0,
  zOffset: number = 0
) => {

  // Calculate shortened arrow endpoints (shorten by half square size total + z-offset)
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const shortenAmount = squareSize / 2 + zOffset * (squareSize/4); // Half the square size + z*4 pixels

  const maxShortenRatio = 1.0;
  const shortenRatio = Math.min(shortenAmount / distance, maxShortenRatio);

  // Move start point forward by quarter square
  const newFromX = fromX + dx * (shortenRatio / 4);
  const newFromY = fromY + dy * (shortenRatio / 4);

  // Move end point backward by quarter square
  const newToX = toX - dx * (shortenRatio / 2);
  const newToY = toY - dy * (shortenRatio / 2);

  // Calculate shaft end (leaving room for arrowhead)
  const newDx = newToX - newFromX;
  const newDy = newToY - newFromY;
  const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
  const shaftEndDistance = newDistance - headSize * 0.8;
  const shaftRatio = shaftEndDistance / newDistance;
  const shaftEndX = newFromX + newDx * shaftRatio;
  const shaftEndY = newFromY + newDy * shaftRatio;

  // Draw border (thin)
  ctx.strokeStyle = borderColor;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = lineWidth + 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(newFromX, newFromY);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Draw colored center
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(newFromX, newFromY);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  const newAngle = Math.atan2(newToY - newFromY, newToX - newFromX);

  const point1X = newToX - headSize * Math.cos(newAngle - Math.PI / 6);
  const point1Y = newToY - headSize * Math.sin(newAngle - Math.PI / 6);
  const point2X = newToX - headSize * Math.cos(newAngle + Math.PI / 6);
  const point2Y = newToY - headSize * Math.sin(newAngle + Math.PI / 6);

  // Draw border on outer edges only (not on base)
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(point1X, point1Y);
  ctx.lineTo(newToX, newToY);
  ctx.lineTo(point2X, point2Y);
  ctx.stroke();

  // Draw colored fill
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(newToX, newToY);
  ctx.lineTo(point1X, point1Y);
  ctx.lineTo(point2X, point2Y);
  ctx.closePath();
  ctx.fill();
};

const getCSSVariable = (varName: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const drawXMark = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
  size: number = 35,
  lineWidth: number = 4,
  borderColor: string = 'black',
  xMarkOpacity: number = 0.5,
  xMarkBorderOpacity: number = 0.3
) => {
  const offset = size / 2;
  const borderWidth = 4;

  ctx.strokeStyle = borderColor;
  ctx.globalAlpha = xMarkBorderOpacity;
  ctx.lineWidth = lineWidth + borderWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(centerX - offset, centerY - offset);
  ctx.lineTo(centerX + offset, centerY + offset);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + offset, centerY - offset);
  ctx.lineTo(centerX - offset, centerY + offset);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.globalAlpha = xMarkOpacity;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(centerX - offset, centerY - offset);
  ctx.lineTo(centerX + offset, centerY + offset);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + offset, centerY - offset);
  ctx.lineTo(centerX - offset, centerY + offset);
  ctx.stroke();

  ctx.globalAlpha = 1;
};

export const CustomArrowOverlay: React.FC<CustomArrowOverlayProps> = ({
  arrows,
  marks = [],
  boardSize,
  boardOrientation = 'white',
  arrowBorderColor = '#000000',
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const arrowOpacity = parseFloat(getCSSVariable('--opacity-arrow')) || 1;

    ctx.clearRect(0, 0, boardSize, boardSize);

    const sortedArrows = [...arrows].sort((a, b) => {
      const fromA = squareToCoords(a.startSquare, boardSize, boardOrientation);
      const toA = squareToCoords(a.endSquare, boardSize, boardOrientation);
      const distA = Math.sqrt((toA.x - fromA.x) ** 2 + (toA.y - fromA.y) ** 2);

      const fromB = squareToCoords(b.startSquare, boardSize, boardOrientation);
      const toB = squareToCoords(b.endSquare, boardSize, boardOrientation);
      const distB = Math.sqrt((toB.x - fromB.x) ** 2 + (toB.y - fromB.y) ** 2);
      return distB - distA;
    });

    // Track z-index per (target square + direction) to only shorten overlapping arrows
    const directionKeys = new Map<string, number>();

    sortedArrows.forEach((arrow) => {
      const from = squareToCoords(arrow.startSquare, boardSize, boardOrientation);
      const to = squareToCoords(arrow.endSquare, boardSize, boardOrientation);

      const headSize = boardSize / 20;
      const lineWidth = boardSize / 60;
      const squareSize = boardSize / 8;

      // Calculate arrow direction and create a direction bucket (rounded to nearest 30 degrees)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angleRadians = Math.atan2(dy, dx);
      const angleDegrees = (angleRadians * 180 / Math.PI);
      const directionBucket = Math.round(angleDegrees / 30) * 30; // Round to nearest 30 degrees

      // Create unique key for this target+direction combination
      const directionKey = `${arrow.endSquare}_${directionBucket}`;

      // Only apply z-offset if there's already an arrow in this direction to this target
      const zOffset = directionKeys.get(directionKey) || 0;
      directionKeys.set(directionKey, zOffset + 1);

      drawArrowHead(ctx, from.x, from.y, to.x, to.y, arrow.color, headSize, arrowBorderColor, lineWidth, arrowOpacity, squareSize, zOffset);
    });
 
    marks.forEach((mark) => {
      const coords = squareToCoords(mark.square, boardSize, boardOrientation);
      drawXMark(ctx, coords.x, coords.y, 'black', boardSize / 28, boardSize / 80, 'white', 1, 1);
    });

    ctx.globalAlpha = 1;
  }, [arrows, marks, boardSize, boardOrientation, arrowBorderColor]);

  return (
    <canvas
      ref={canvasRef}
      width={boardSize}
      height={boardSize}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};
