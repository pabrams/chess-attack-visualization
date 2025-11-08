import React from 'react';
import { getRelativeCoords } from 'react-chessboard';
import { Arrow } from '../types/arrows';

interface CustomArrowOverlayProps {
  arrows: Arrow[];
  boardSize: number;
  boardOrientation?: 'white' | 'black';
  opacity?: number;
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
  headSize: number = 20
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  const point1X = toX - headSize * Math.cos(angle - Math.PI / 6);
  const point1Y = toY - headSize * Math.sin(angle - Math.PI / 6);
  const point2X = toX - headSize * Math.cos(angle + Math.PI / 6);
  const point2Y = toY - headSize * Math.sin(angle + Math.PI / 6);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(point1X, point1Y);
  ctx.lineTo(point2X, point2Y);
  ctx.closePath();
  ctx.fill();
};

const drawXMark = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
  size: number = 35,
  lineWidth: number = 4
) => {
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const offset = size / 2;

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
  boardSize,
  boardOrientation = 'white',
  opacity = 0.9,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, boardSize, boardSize);

    arrows.forEach((arrow) => {
      const from = squareToCoords(arrow.startSquare, boardSize, boardOrientation);
      const to = squareToCoords(arrow.endSquare, boardSize, boardOrientation);

      // Shorten arrow to match library's sameTargetArrowLengthReducerDenominator (1/4 square width)
      // This is the shortest length used when multiple arrows target the same square
      const squareSize = boardSize / 8;
      const arrowLengthReducer = squareSize / 4;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const shortenedDistance = distance - arrowLengthReducer;
      const ratio = shortenedDistance / distance;

      const endX = from.x + dx * ratio;
      const endY = from.y + dy * ratio;

      ctx.strokeStyle = arrow.color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = boardSize / 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      drawArrowHead(ctx, from.x, from.y, endX, endY, arrow.color, boardSize / 16);
      drawXMark(ctx, to.x, to.y, arrow.color, boardSize / 8, boardSize / 60);
    });

    ctx.globalAlpha = 1;
  }, [arrows, boardSize, boardOrientation, opacity]);

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
