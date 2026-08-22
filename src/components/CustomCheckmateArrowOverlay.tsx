import React from 'react';
import { Square } from 'chess.js';
import { getRelativeCoords } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';

const ARROW_COLORS = {
  white: '#bb0000',
  black: '#0066cc',
} as const;

interface CustomCheckmateArrowOverlayProps {
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
  // Unused here, but kept so this signature stays positionally parallel with
  // CustomAttackerArrowOverlay's drawArrowHead
  _zOffset: number = 0,
  shouldDrawCircle: boolean = true
) => {

  const opacity = 1.0;

  lineWidth = lineWidth * 0.7;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const circleRadius = squareSize * 0.45;

  const effectiveRadius = circleRadius;
  const circleEdgeX = fromX + (dx / distance) * effectiveRadius;
  const circleEdgeY = fromY + (dy / distance) * effectiveRadius;

  const newFromX = circleEdgeX;
  const newFromY = circleEdgeY;

  const newToX = toX;
  const newToY = toY;

  const newDx = newToX - newFromX;
  const newDy = newToY - newFromY;
  const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);

  const coloredHeadSize = headSize;

  if (shouldDrawCircle) {
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
  }

  const coloredXSize = coloredHeadSize * 0.7;

  // Draw border X head first
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth + 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(
    newToX + coloredXSize * Math.cos(Math.PI / 4),
    newToY + coloredXSize * Math.sin(Math.PI / 4)
  );
  ctx.lineTo(
    newToX - coloredXSize * Math.cos(Math.PI / 4),
    newToY - coloredXSize * Math.sin(Math.PI / 4)
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    newToX + coloredXSize * Math.cos(3 * Math.PI / 4),
    newToY + coloredXSize * Math.sin(3 * Math.PI / 4)
  );
  ctx.lineTo(
    newToX - coloredXSize * Math.cos(3 * Math.PI / 4),
    newToY - coloredXSize * Math.sin(3 * Math.PI / 4)
  );
  ctx.stroke();

  // Draw colored X head
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth - 1;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(
    newToX + coloredXSize * Math.cos(Math.PI / 4),
    newToY + coloredXSize * Math.sin(Math.PI / 4)
  );
  ctx.lineTo(
    newToX - coloredXSize * Math.cos(Math.PI / 4),
    newToY - coloredXSize * Math.sin(Math.PI / 4)
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    newToX + coloredXSize * Math.cos(3 * Math.PI / 4),
    newToY + coloredXSize * Math.sin(3 * Math.PI / 4)
  );
  ctx.lineTo(
    newToX - coloredXSize * Math.cos(3 * Math.PI / 4),
    newToY - coloredXSize * Math.sin(3 * Math.PI / 4)
  );
  ctx.stroke();

  // Now draw shafts on top
  const borderStartOffset = 2;
  const borderStartX = newFromX + (newDx / newDistance) * borderStartOffset;
  const borderStartY = newFromY + (newDy / newDistance) * borderStartOffset;

  const shaftShortenAmount = coloredXSize * 0.28;
  const borderEndOffset = 2 + shaftShortenAmount;
  const borderEndX = newToX - (newDx / newDistance) * borderEndOffset;
  const borderEndY = newToY - (newDy / newDistance) * borderEndOffset;

  const coloredShaftEndX = newToX - (newDx / newDistance) * shaftShortenAmount;
  const coloredShaftEndY = newToY - (newDy / newDistance) * shaftShortenAmount;

  ctx.strokeStyle = borderColor;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = lineWidth + 2;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(borderStartX, borderStartY);
  ctx.lineTo(borderEndX, borderEndY);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth - 1;
  ctx.lineCap = 'butt';

  ctx.beginPath();
  ctx.moveTo(newFromX, newFromY);
  ctx.lineTo(coloredShaftEndX, coloredShaftEndY);
  ctx.stroke();
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
    const whiteX = coords.x - squareSize / 6;
    const whiteY = coords.y - squareSize / 6;
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
    const blackX = coords.x + squareSize / 6;
    const blackY = coords.y + squareSize / 6;

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

export const CustomCheckmateArrowOverlay: React.FC<CustomCheckmateArrowOverlayProps> = ({
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

    const directionKeys = new Map<string, number>();
    const drawnStartCircles = new Set<string>();

    sortedArrows.forEach((arrow) => {
      const from = squareToCoords(arrow.startSquare, boardSize, boardOrientation);
      const to = squareToCoords(arrow.endSquare, boardSize, boardOrientation);

      const headSize = boardSize / 20;
      const baseLineWidth = boardSize / 50;
      const squareSize = boardSize / 8;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angleRadians = Math.atan2(dy, dx);
      const angleDegrees = (angleRadians * 180 / Math.PI);
      const directionBucket = Math.round(angleDegrees / 30) * 30;

      const directionKey = `${arrow.endSquare}_${directionBucket}`;

      const zOffset = directionKeys.get(directionKey) || 0;
      directionKeys.set(directionKey, zOffset + 1);

      const lineWidth = baseLineWidth - (zOffset * 3);

      const shouldDrawCircle = !drawnStartCircles.has(arrow.startSquare);
      if (shouldDrawCircle) {
        drawnStartCircles.add(arrow.startSquare);
      }

      drawArrowHead(ctx, from.x, from.y, to.x, to.y, arrow.color, headSize, arrowBorderColor, lineWidth, squareSize, zOffset, shouldDrawCircle);
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
