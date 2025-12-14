import React from 'react';
import { Square } from 'chess.js';
import { getRelativeCoords } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';

const ARROW_COLORS = {
  white: '#bb0000',
  black: '#0066cc',
} as const;

interface CustomArrowOverlayProps {
  arrows: Arrow[];
  marks?: Mark[];
  attackerDisplay?: { square: Square; whiteCount: number; blackCount: number } | null;
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
  squareSize: number = 0,
  zOffset: number = 0
) => {
 
  const opacity = 1.0;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const circleRadius = squareSize * 0.45;

  const effectiveRadius = circleRadius;
  const circleEdgeX = fromX + (dx / distance) * effectiveRadius;
  const circleEdgeY = fromY + (dy / distance) * effectiveRadius;

  const shortenAmount = squareSize / 2 + zOffset * (squareSize/4); // Half the square size + z*4 pixels

  const maxShortenRatio = 1.0;
  const shortenRatio = Math.min(shortenAmount / distance, maxShortenRatio);

  const newFromX = circleEdgeX;
  const newFromY = circleEdgeY;

  const newToX = toX - dx * (shortenRatio / 2);
  const newToY = toY - dy * (shortenRatio / 2);

  const newAngle = Math.atan2(newToY - newFromY, newToX - newFromX);
  const newDx = newToX - newFromX;
  const newDy = newToY - newFromY;
  const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);

  const borderHeadSize = headSize + 4;
  const coloredHeadSize = headSize;
  const borderTipExtension = 2;

  // Calculate extended tip position for border arrow
  const borderTipX = newToX + (newDx / newDistance) * borderTipExtension;
  const borderTipY = newToY + (newDy / newDistance) * borderTipExtension;

  // Calculate shaft end for border arrow
  const borderShaftEndDistance = newDistance - borderHeadSize * 0.8;
  const borderShaftRatio = borderShaftEndDistance / newDistance;
  const borderShaftEndX = newFromX + newDx * borderShaftRatio;
  const borderShaftEndY = newFromY + newDy * borderShaftRatio;

  // Calculate shaft end for colored arrow
  const coloredShaftEndDistance = newDistance - coloredHeadSize * 0.8;
  const coloredShaftRatio = coloredShaftEndDistance / newDistance;
  const coloredShaftEndX = newFromX + newDx * coloredShaftRatio;
  const coloredShaftEndY = newFromY + newDy * coloredShaftRatio;

  // Draw circle at the tail
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth / 2;
  ctx.beginPath();
  ctx.arc(fromX, fromY, circleRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth / 3;
  ctx.beginPath();
  ctx.arc(fromX, fromY, circleRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = borderColor;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = lineWidth + 2;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(newFromX, newFromY);
  ctx.lineTo(borderShaftEndX, borderShaftEndY);
  ctx.stroke();

  const borderPoint1X = borderTipX - borderHeadSize * Math.cos(newAngle - Math.PI / 6);
  const borderPoint1Y = borderTipY - borderHeadSize * Math.sin(newAngle - Math.PI / 6);
  const borderPoint2X = borderTipX - borderHeadSize * Math.cos(newAngle + Math.PI / 6);
  const borderPoint2Y = borderTipY - borderHeadSize * Math.sin(newAngle + Math.PI / 6);

  ctx.fillStyle = borderColor;
  ctx.beginPath();
  ctx.moveTo(borderTipX, borderTipY);
  ctx.lineTo(borderPoint1X, borderPoint1Y);
  ctx.lineTo(borderPoint2X, borderPoint2Y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(newFromX, newFromY);
  ctx.lineTo(coloredShaftEndX, coloredShaftEndY);
  ctx.stroke();

  const point1X = newToX - coloredHeadSize * Math.cos(newAngle - Math.PI / 6);
  const point1Y = newToY - coloredHeadSize * Math.sin(newAngle - Math.PI / 6);
  const point2X = newToX - coloredHeadSize * Math.cos(newAngle + Math.PI / 6);
  const point2Y = newToY - coloredHeadSize * Math.sin(newAngle + Math.PI / 6);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(newToX, newToY);
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
  lineWidth: number = 4,
  borderColor: string = 'black',
) => {
  const offset = size / 2;
  const borderWidth = 4;

  ctx.strokeStyle = borderColor;
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

const drawAttackerBorder = (
  ctx: CanvasRenderingContext2D,
  square: string,
  whiteCount: number,
  blackCount: number,
  boardSize: number,
  boardOrientation: 'white' | 'black'
) => {
  const coords = squareToCoords(square, boardSize, boardOrientation);
  const squareSize = boardSize / 8;

  const whiteArrowColor = ARROW_COLORS.white;
  const blackArrowColor = ARROW_COLORS.black;

  let borderColor: string;
  if (whiteCount > blackCount) {
    borderColor = whiteArrowColor;
  } else if (blackCount > whiteCount) {
    borderColor = blackArrowColor;
  } else {
    borderColor = 'purple';
  }

  const borderWidth = squareSize / 20;
  const halfSquare = squareSize / 2;

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(
    coords.x - halfSquare,
    coords.y - halfSquare,
    squareSize,
    squareSize
  );
};

const drawAttackerCountCircles = (
  ctx: CanvasRenderingContext2D,
  square: string,
  whiteCount: number,
  blackCount: number,
  boardSize: number,
  boardOrientation: 'white' | 'black'
) => {
  const coords = squareToCoords(square, boardSize, boardOrientation);
  const squareSize = boardSize / 8;
  const fontSize = squareSize / 3;

  const attackerCountBackground = '#d0d0d0'
  const whiteArrowColor = ARROW_COLORS.white;
  const blackArrowColor = ARROW_COLORS.black;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const circleRadius = fontSize * 0.6;

  if (whiteCount > 0) {
    const whiteX = coords.x - squareSize / 4;
    const whiteY = coords.y - squareSize / 4;
    ctx.fillStyle = attackerCountBackground

    ctx.beginPath();
    ctx.arc(whiteX, whiteY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeText(whiteCount.toString(), whiteX, whiteY);

    ctx.fillStyle = whiteArrowColor;
    ctx.fillText(whiteCount.toString(), whiteX, whiteY);
  }

  if (blackCount > 0) {
    const blackX = coords.x + squareSize / 4;
    const blackY = coords.y + squareSize / 4;

    ctx.fillStyle = attackerCountBackground
    ctx.beginPath();
    ctx.arc(blackX, blackY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeText(blackCount.toString(), blackX, blackY);

    ctx.fillStyle = blackArrowColor;
    ctx.fillText(blackCount.toString(), blackX, blackY);
  }
};

export const CustomArrowOverlay: React.FC<CustomArrowOverlayProps> = ({
  arrows,
  marks = [],
  attackerDisplay,
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

    ctx.clearRect(0, 0, boardSize, boardSize);

    if (attackerDisplay) {
      drawAttackerBorder(
        ctx,
        attackerDisplay.square,
        attackerDisplay.whiteCount,
        attackerDisplay.blackCount,
        boardSize,
        boardOrientation
      );
    }

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
      const baseLineWidth = boardSize / 50;
      const squareSize = boardSize / 8;

      // Calculate arrow direction and create a direction bucket (rounded to nearest 30 degrees)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angleRadians = Math.atan2(dy, dx);
      const angleDegrees = (angleRadians * 180 / Math.PI);
      const directionBucket = Math.round(angleDegrees / 30) * 30;

      // Create unique key for this target+direction combination
      const directionKey = `${arrow.endSquare}_${directionBucket}`;

      // Only apply z-offset if there's already an arrow in this direction to this target
      const zOffset = directionKeys.get(directionKey) || 0;
      directionKeys.set(directionKey, zOffset + 1);

      const lineWidth = baseLineWidth - (zOffset * 3);

      drawArrowHead(ctx, from.x, from.y, to.x, to.y, arrow.color, headSize, arrowBorderColor, lineWidth, squareSize, zOffset);
    });
 
    marks.forEach((mark) => {
      const coords = squareToCoords(mark.square, boardSize, boardOrientation);
      drawXMark(ctx, coords.x, coords.y, 'darkgreen', boardSize / 28, boardSize / 80, 'white');
    });

    if (attackerDisplay) {
      drawAttackerCountCircles(
        ctx,
        attackerDisplay.square,
        attackerDisplay.whiteCount,
        attackerDisplay.blackCount,
        boardSize,
        boardOrientation
      );
    }

    ctx.globalAlpha = 1;
  }, [arrows, marks, attackerDisplay, boardSize, boardOrientation, arrowBorderColor]);

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
