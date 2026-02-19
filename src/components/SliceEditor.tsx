import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  VStack,
  HStack,
  Tooltip,
  useColorModeValue,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Spacer,
  Divider,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FaPen,
  FaEraser,
  FaFillDrip,
  FaEyeDropper,
  FaSave,
  FaUndo,
  FaArrowLeft,
  FaRedo,
  FaHandPaper,
  FaSearchPlus,
  FaSearchMinus,
  FaCompress,
  FaCog,
  FaCircle,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Constants
const ZOOM_LEVEL = 20; // Default zoom for editing (pixel size)

interface SliceEditorProps {
  initialData: ImageData;
  onSave: (newData: ImageData) => void;
  onCancel: () => void;
}

type ToolType = 'pencil' | 'eraser' | 'bucket' | 'eyedropper' | 'hand';

// Helper to convert RGBA to Hex
const rgbaToHex = (r: number, g: number, b: number, a: number) => {
  if (a === 0) return 'transparent';
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper to convert Hex to RGBA
const hexToRgba = (hex: string) => {
  if (hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255,
      }
    : { r: 0, g: 0, b: 0, a: 255 };
};

export const SliceEditor: React.FC<SliceEditorProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure(); // For exit warning
  
  // Zoom and Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  
  // Settings
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [showGrid, setShowGrid] = useState(false);
  const [brushSize, setBrushSize] = useState<1 | 3 | 5>(1);

  // Default palette colors
  const [palette, setPalette] = useState<string[]>(() => {
    const savedPalette = localStorage.getItem('sliceEditorPalette');
    if (savedPalette) {
      try {
        return JSON.parse(savedPalette);
      } catch (e) {
        console.error('Failed to parse saved palette', e);
      }
    }
    return [
      '#000000', // Black
      '#FFFFFF', // White
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      'transparent' // Transparent
    ];
  });

  // Save palette whenever it changes
  useEffect(() => {
    localStorage.setItem('sliceEditorPalette', JSON.stringify(palette));
  }, [palette]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Draw initial data
        ctx.putImageData(initialData, 0, 0);
        // Save initial state to history
        const clonedData = new ImageData(
          new Uint8ClampedArray(initialData.data),
          initialData.width,
          initialData.height
        );
        setHistory([clonedData]);
        setHistoryIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToHistory = (data: ImageData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    // Clone ImageData to ensure we don't store references
    const clonedData = new ImageData(
      new Uint8ClampedArray(data.data),
      data.width,
      data.height
    );
    newHistory.push(clonedData);
    if (newHistory.length > 20) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const data = history[newIndex];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(data, 0, 0);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const data = history[newIndex];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(data, 0, 0);
    }
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY),
    };
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getMousePos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Handle Eyedropper
    if (activeTool === 'eyedropper') {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbaToHex(pixel[0], pixel[1], pixel[2], pixel[3]);
      setPrimaryColor(hex);
      setActiveTool('pencil'); // Switch back to pencil after picking
      return;
    }

    // Handle Bucket
    if (activeTool === 'bucket') {
      floodFill(x, y, primaryColor);
      return;
    }
  };
  
  // Zoom Controls
  const zoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const zoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const drawPixel = (x: number, y: number, isEraser: boolean = false) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Bounds check
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Brush size logic
    const halfSize = Math.floor(brushSize / 2);
    const startX = x - halfSize;
    const endX = x + halfSize;
    const startY = y - halfSize;
    const endY = y + halfSize;
    
    // Optimization: Check if brush is within bounds
    if (startX >= width || endX < 0 || startY >= height || endY < 0) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const color = isEraser ? { r: 0, g: 0, b: 0, a: 0 } : hexToRgba(primaryColor);
    let hasChanges = false;

    for (let py = startY; py <= endY; py++) {
        for (let px = startX; px <= endX; px++) {
            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            
            const index = (py * width + px) * 4;
            
            // Optimization: Don't redraw if same color
            if (
              imgData.data[index] === color.r &&
              imgData.data[index + 1] === color.g &&
              imgData.data[index + 2] === color.b &&
              imgData.data[index + 3] === color.a
            ) continue;

            imgData.data[index] = color.r;
            imgData.data[index + 1] = color.g;
            imgData.data[index + 2] = color.b;
            imgData.data[index + 3] = color.a;
            hasChanges = true;
        }
    }
    
    if (hasChanges) {
        ctx.putImageData(imgData, 0, 0);
        setIsDirty(true);
    }
  };

  const floodFill = (startX: number, startY: number, fillColorHex: string) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const targetColor = hexToRgba(fillColorHex);
    
    // Get starting color
    const startIndex = (startY * width + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];

    // If target is same as start, do nothing
    if (
      startR === targetColor.r &&
      startG === targetColor.g &&
      startB === targetColor.b &&
      startA === targetColor.a
    ) return;

    const queue = [[startX, startY]];
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = (y * width + x) * 4;
      
      // Check match
      if (
        data[idx] === startR &&
        data[idx + 1] === startG &&
        data[idx + 2] === startB &&
        data[idx + 3] === startA
      ) {
        // Fill
        data[idx] = targetColor.r;
        data[idx + 1] = targetColor.g;
        data[idx + 2] = targetColor.b;
        data[idx + 3] = targetColor.a;

        // Add neighbors
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveToHistory(imgData); // This uses saveToHistory defined later? No, hoisting works for functions but not const.
    // Wait, saveToHistory is defined as const below.
    // I moved saveToHistory UP in previous step. Let's check.
    // I moved it UP? No, I moved it down but removed call from useEffect.
    // Wait, I need to check where saveToHistory is defined.
    setIsDirty(true);
  };

  // Drawing interactions
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
        setIsPanning(true);
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        return;
    }

    if (activeTool === 'bucket' || activeTool === 'eyedropper') {
        handleCanvasClick(e);
        return;
    }

    setIsDrawing(true);
    const { x, y } = getMousePos(e);
    // Right click acts as eraser for pencil
    const isRightClick = e.button === 2;
    if (activeTool === 'pencil') {
        drawPixel(x, y, isRightClick);
    } else if (activeTool === 'eraser') {
        drawPixel(x, y, true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
        if (isPanning) {
            setOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
        return;
    }

    if (!isDrawing) return;
    const { x, y } = getMousePos(e);
    const isRightClick = (e.buttons & 2) === 2;
    
    if (activeTool === 'pencil') {
        drawPixel(x, y, isRightClick);
    } else if (activeTool === 'eraser') {
        drawPixel(x, y, true);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
        setIsPanning(false);
    }
    if (isDrawing) {
      setIsDrawing(false);
      // Save state on stroke end
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) saveToHistory(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
      }
    }
  };
  
  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // e.preventDefault(); // Do NOT prevent default here if we want to allow standard gestures? 
    // But we use touch-action: none, so browser gestures are disabled.
    
    if (e.touches.length === 1) {
        if (activeTool === 'hand') {
            setIsPanning(true);
            setPanStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
        } else if (activeTool === 'bucket' || activeTool === 'eyedropper') {
             handleCanvasClick(e);
        } else {
            // Draw
            setIsDrawing(true);
            const { x, y } = getMousePos(e);
            if (activeTool === 'pencil') drawPixel(x, y, false);
            else if (activeTool === 'eraser') drawPixel(x, y, true);
        }
    } else if (e.touches.length === 2) {
        // Pan and Zoom
        setIsPanning(true);
        const center = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        setPanStart({ x: center.x - offset.x, y: center.y - offset.y });
        
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        setLastTouchDist(dist);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // e.preventDefault();
    if (e.touches.length === 1) {
        if (activeTool === 'hand' && isPanning) {
             setOffset({
                 x: e.touches[0].clientX - panStart.x,
                 y: e.touches[0].clientY - panStart.y
             });
        } else if (isDrawing) {
             const { x, y } = getMousePos(e);
             if (activeTool === 'pencil') drawPixel(x, y, false);
             else if (activeTool === 'eraser') drawPixel(x, y, true);
        }
    } else if (e.touches.length === 2) {
        // Pan
        const center = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        if (isPanning) {
             setOffset({
                 x: center.x - panStart.x,
                 y: center.y - panStart.y
             });
        }
        
        // Zoom
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        if (lastTouchDist) {
            const delta = dist / lastTouchDist;
            // Limit zoom speed
            // const zoomFactor = 1 + (delta - 1) * 0.5;
            setScale(s => Math.min(Math.max(0.1, s * delta), 5));
            setLastTouchDist(dist);
        }
    }
  };
  
  const handleTouchEnd = () => {
    setIsPanning(false);
    setIsDrawing(false);
    setLastTouchDist(null);
    if (isDrawing || isPanning) {
         // Save history if we were drawing
         if (canvasRef.current && isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) saveToHistory(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
         }
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        onSave(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
        setIsDirty(false);
      }
    }
  };
  
  const handleBack = () => {
      if (isDirty) {
          onOpen();
      } else {
          onCancel();
      }
  };

  return (
    <Flex h="full" direction="column" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Flex p={2} borderBottomWidth="1px" align="center" justify="space-between" bg={useColorModeValue('white', 'gray.800')}>
        <HStack>
            <IconButton
              aria-label="Back"
              icon={<FaArrowLeft />}
              variant="ghost"
              onClick={handleBack}
            />
            <Text fontWeight="bold">{t('editor.slice_editor', 'Slice Editor')}</Text>
        </HStack>
        <HStack spacing={2}>
            {/* Zoom Controls moved to header */}
            <HStack spacing={1} mr={2}>
                <IconButton 
                    icon={<FaSearchPlus />} 
                    onClick={zoomIn} 
                    aria-label="Zoom In" 
                    size="sm" 
                    variant="ghost"
                />
                <IconButton 
                    icon={<FaSearchMinus />} 
                    onClick={zoomOut} 
                    aria-label="Zoom Out" 
                    size="sm" 
                    variant="ghost"
                />
                <IconButton 
                    icon={<FaCompress />} 
                    onClick={resetZoom} 
                    aria-label="Reset Zoom" 
                    size="sm" 
                    variant="ghost"
                />
            </HStack>
            
            <IconButton
              aria-label="Undo"
              icon={<FaUndo />}
              size="sm"
              isDisabled={historyIndex <= 0}
              onClick={undo}
            />
            <IconButton
              aria-label="Redo"
              icon={<FaRedo />}
              size="sm"
              isDisabled={historyIndex >= history.length - 1}
              onClick={redo}
            />
            <Button
                leftIcon={<FaSave />}
                colorScheme="blue"
                size="sm"
                onClick={handleSave}
                isDisabled={!isDirty}
            >
                {t('common.save', 'Save')}
            </Button>
        </HStack>
      </Flex>

      <Flex flex={1} overflow="hidden">
        {/* Left Toolbar */}
        <VStack p={2} spacing={2} borderRightWidth="1px" bg={useColorModeValue('white', 'gray.800')}>
            <Tooltip label={t('editor.tool.hand', 'Hand (Pan)')} placement="right">
                <IconButton
                    aria-label="Hand"
                    icon={<FaHandPaper />}
                    isActive={activeTool === 'hand'}
                    colorScheme={activeTool === 'hand' ? 'blue' : 'gray'}
                    onClick={() => setActiveTool('hand')}
                />
            </Tooltip>
            <Tooltip label={t('editor.tool.pencil', 'Pencil (Left: Draw, Right: Erase)')} placement="right">
                <IconButton
                    aria-label="Pencil"
                    icon={<FaPen />}
                    isActive={activeTool === 'pencil'}
                    colorScheme={activeTool === 'pencil' ? 'blue' : 'gray'}
                    onClick={() => setActiveTool('pencil')}
                />
            </Tooltip>
            <Tooltip label={t('editor.tool.eraser', 'Eraser')} placement="right">
                <IconButton
                    aria-label="Eraser"
                    icon={<FaEraser />}
                    isActive={activeTool === 'eraser'}
                    colorScheme={activeTool === 'eraser' ? 'blue' : 'gray'}
                    onClick={() => setActiveTool('eraser')}
                />
            </Tooltip>
            
            {/* Brush Size Selector - Only show for Pencil/Eraser */}
            {(activeTool === 'pencil' || activeTool === 'eraser') && (
              <Tooltip label={`Brush Size: ${brushSize}x${brushSize}`} placement="right">
                  <Button
                      size="sm"
                      w="40px"
                      h="40px"
                      p={0}
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => setBrushSize(prev => (prev === 1 ? 3 : prev === 3 ? 5 : 1) as 1|3|5)}
                  >
                      <VStack spacing={0}>
                        <FaCircle size={brushSize === 1 ? 8 : brushSize === 3 ? 12 : 16} />
                        <Text fontSize="xs">{brushSize}x</Text>
                      </VStack>
                  </Button>
              </Tooltip>
            )}

            <Tooltip label={t('editor.tool.bucket', 'Bucket Fill')} placement="right">
                <IconButton
                    aria-label="Bucket"
                    icon={<FaFillDrip />}
                    isActive={activeTool === 'bucket'}
                    colorScheme={activeTool === 'bucket' ? 'blue' : 'gray'}
                    onClick={() => setActiveTool('bucket')}
                />
            </Tooltip>
            <Tooltip label={t('editor.tool.eyedropper', 'Eyedropper')} placement="right">
                <IconButton
                    aria-label="Eyedropper"
                    icon={<FaEyeDropper />}
                    isActive={activeTool === 'eyedropper'}
                    colorScheme={activeTool === 'eyedropper' ? 'blue' : 'gray'}
                    onClick={() => setActiveTool('eyedropper')}
                />
            </Tooltip>
            
            <Spacer />
            <Divider />
            
            <Tooltip label={t('editor.settings', 'Settings')} placement="right">
                <IconButton
                    aria-label="Settings"
                    icon={<FaCog />}
                    variant="ghost"
                    onClick={onSettingsOpen}
                />
            </Tooltip>
        </VStack>

        {/* Center Canvas */}
        <Box 
            flex={1} 
            bg={useColorModeValue('gray.100', 'gray.900')} 
            overflow="hidden" 
            position="relative"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            cursor={activeTool === 'hand' || isPanning ? 'grab' : 'default'}
            style={{ touchAction: 'none' }}
        >
             <Box
                position="absolute"
                left="50%"
                top="50%"
                transform={`translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`}
                transformOrigin="center"
                borderWidth="1px"
                boxShadow="lg"
                bg="white"
                backgroundImage="linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                backgroundSize="20px 20px"
                style={{ touchAction: 'none' }}
             >
                 <canvas
                    ref={canvasRef}
                    width={initialData.width}
                    height={initialData.height}
                    style={{
                        width: `${initialData.width * ZOOM_LEVEL}px`,
                        height: `${initialData.height * ZOOM_LEVEL}px`,
                        imageRendering: 'pixelated',
                        cursor: activeTool === 'pencil' ? 'crosshair' : activeTool === 'hand' ? 'grab' : 'default',
                        touchAction: 'none'
                    }}
                    onContextMenu={(e) => e.preventDefault()}
             />
             
             {/* Grid Overlay */}
             {showGrid && (
               <Box
                 position="absolute"
                 top={0}
                 left={0}
                 width="100%"
                 height="100%"
                 pointerEvents="none"
                 style={{
                   backgroundImage: `
                     linear-gradient(to right, rgba(128, 128, 128, 0.5) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(128, 128, 128, 0.5) 1px, transparent 1px)
                   `,
                   backgroundSize: `${ZOOM_LEVEL}px ${ZOOM_LEVEL}px`
                 }}
               />
             )}
         </Box>
    </Box>

        {/* Right Color Palette */}
        <VStack p={2} spacing={3} borderLeftWidth="1px" bg={useColorModeValue('white', 'gray.800')} w="60px">
            <Text fontSize="xs" fontWeight="bold">{t('editor.colors', 'Colors')}</Text>
            {palette.map((color, idx) => (
                <Popover key={idx} placement="left" isLazy>
                    <PopoverTrigger>
                        <Box
                            w="30px"
                            h="30px"
                            borderRadius="md"
                            borderWidth={2}
                            borderColor={primaryColor === color ? 'blue.500' : 'gray.200'}
                            bg={color === 'transparent' ? 'transparent' : color}
                            backgroundImage={color === 'transparent' ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : 'none'}
                            backgroundSize="10px 10px"
                            cursor="pointer"
                            onClick={() => setPrimaryColor(color)}
                            boxShadow="sm"
                            _hover={{ transform: 'scale(1.1)' }}
                            transition="transform 0.1s"
                        />
                    </PopoverTrigger>
                    <PopoverContent w="200px">
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverBody>
                             <Text mb={2} fontSize="sm">Edit Color</Text>
                             <Input 
                                type="color" 
                                value={color === 'transparent' ? '#ffffff' : color} 
                                onChange={(e) => {
                                    const newPalette = [...palette];
                                    newPalette[idx] = e.target.value;
                                    setPalette(newPalette);
                                    setPrimaryColor(e.target.value);
                                }} 
                                mb={2}
                             />
                             <Input 
                                placeholder="#RRGGBB" 
                                value={color} 
                                onChange={(e) => {
                                    const newPalette = [...palette];
                                    newPalette[idx] = e.target.value;
                                    setPalette(newPalette);
                                    setPrimaryColor(e.target.value);
                                }}
                                size="sm"
                             />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            ))}
            
            {/* Active Color Indicator */}
            <Box mt={4} pt={4} borderTopWidth="1px" w="full" textAlign="center">
                 <Popover placement="left" isLazy>
                     <PopoverTrigger>
                         <Box
                            w="40px"
                            h="40px"
                            mx="auto"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor="gray.400"
                            bg={primaryColor === 'transparent' ? 'transparent' : primaryColor}
                            backgroundImage={primaryColor === 'transparent' ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : 'none'}
                            backgroundSize="10px 10px"
                            cursor="pointer"
                            _hover={{ opacity: 0.8 }}
                         />
                     </PopoverTrigger>
                     <PopoverContent w="200px">
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverBody>
                             <Text mb={2} fontSize="sm">{t('editor.current_color', 'Current Color')}</Text>
                             <Input 
                                type="color" 
                                value={primaryColor === 'transparent' ? '#ffffff' : primaryColor} 
                                onChange={(e) => {
                                    setPrimaryColor(e.target.value);
                                    setActiveTool('pencil');
                                }} 
                                mb={2}
                             />
                             <Input 
                                placeholder="#RRGGBB" 
                                value={primaryColor} 
                                onChange={(e) => {
                                    setPrimaryColor(e.target.value);
                                    setActiveTool('pencil');
                                }}
                                size="sm"
                             />
                        </PopoverBody>
                     </PopoverContent>
                 </Popover>
                 <Text fontSize="xs" mt={1}>{primaryColor}</Text>
            </Box>
        </VStack>
      </Flex>

      {/* Exit Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('common.warning', 'Warning')}</ModalHeader>
          <ModalBody>
            {t('editor.unsaved_changes', 'You have unsaved changes. Do you want to save before exiting?')}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="red" mr={3} onClick={onCancel}>
              {t('editor.exit_without_saving', 'Exit without saving')}
            </Button>
            <Button colorScheme="blue" onClick={() => { handleSave(); onCancel(); }}>
              {t('editor.save_and_exit', 'Save and Exit')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('editor.settings', 'Settings')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="grid-view" mb="0">
                  {t('editor.settings.grid_view', 'Grid View')}
                </FormLabel>
                <Switch 
                    id="grid-view" 
                    isChecked={showGrid} 
                    onChange={(e) => setShowGrid(e.target.checked)} 
                />
              </FormControl>
              
              {/* You can add more settings here later */}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onSettingsClose}>
              {t('common.close', 'Close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
