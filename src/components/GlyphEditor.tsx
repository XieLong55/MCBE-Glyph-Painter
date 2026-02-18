import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FaPen, FaCode, FaCopy, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface GlyphEditorProps {
  fileUrl: string;
  filename: string;
}

const EditorMode = {
  EDIT: 'edit',
  CODE_POINT: 'code_point',
  COPY: 'copy'
} as const;

type EditorMode = typeof EditorMode[keyof typeof EditorMode];

export const GlyphEditor: React.FC<GlyphEditorProps> = ({ fileUrl, filename }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<EditorMode>(EditorMode.CODE_POINT);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Reset state when file changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    // Load image size
    const img = new Image();
    img.src = fileUrl;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
  }, [fileUrl]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       // Pinch zoom simulation
       e.preventDefault();
       const delta = e.deltaY * -0.001;
       const newScale = Math.min(Math.max(0.1, scale + delta), 10);
       setScale(newScale);
    } else {
        // Pan
        // If not zooming, maybe we don't want to capture wheel unless user holds space or something?
        // But user said "Desktop use mouse wheel" for zoom. Usually wheel is scroll.
        // Let's implement wheel = zoom as requested.
        e.preventDefault();
        // Standard mouse wheel step is often large, smooth it out
        const newScale = Math.min(Math.max(0.1, scale + (e.deltaY > 0 ? -0.1 : 0.1)), 10);
        setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if middle mouse or space held? Or always drag?
    // Let's implement drag always for now as we don't have other interactions on the background
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleGridClick = (e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation(); // Prevent drag start
    if (mode === EditorMode.CODE_POINT) {
      // Logic:
      // 1. Parse filename for base prefix. E.g., glyph_E0.png -> E0
      // 2. Base = 0xE000
      // 3. Offset = row * 16 + col
      // 4. Char Code = Base + Offset

      const match = filename.match(/glyph_([0-9A-Fa-f]+)/);
      if (match) {
        const prefixHex = match[1];
        // If prefix is just "E", assumes "E0"? Or user meant "E?" pattern where ? is the hex digit?
        // User example: "E0" -> 00 8A...
        // If filename is glyph_E0.png, it usually means the page starting at U+E000.
        // If filename is glyph_E1.png, it starts at U+E100.
        // So we parse the hex, shift left by 8 bits (multiply by 256).
        
        const base = parseInt(prefixHex, 16);
        
        // If the user names it "E0", 0xE0 * 256 = 0xE000. Correct.
        // If the user names it "E", 0xE * 256 = 0xE00. Too small?
        // Standard MCBE glyphs are usually E0, E1, etc. (Private Use Area).
        // Let's assume the filename part IS the high byte(s).
        
        // However, `parseInt('E0', 16)` is 224. 224 * 256 = 57344 (0xE000).
        // `parseInt('E1', 16)` is 225. 225 * 256 = 57600 (0xE100).
        // This logic holds for standard glyph_XX.png naming.
        
        const pageStart = base * 256;
        const offset = row * 16 + col;
        const charCode = pageStart + offset;
        const char = String.fromCharCode(charCode);
        const hexCode = charCode.toString(16).toUpperCase().padStart(4, '0');
        const unicodeStr = `\\u${hexCode}`;

        navigator.clipboard.writeText(unicodeStr);
        toast({
          title: t('editor.copied', 'Copied'),
          description: `${unicodeStr} (${char})`,
          status: 'success',
          duration: 1500,
        });
      } else {
        toast({
            title: t('common.error'),
            description: t('editor.invalid_filename_pattern', 'Filename does not match glyph_XX pattern'),
            status: 'warning'
        });
      }
    }
  };

  // Render Grid
  const renderGrid = () => {
    const cells = [];
    const rows = 16;
    const cols = 16;
    
    // We want the grid to cover the image.
    // If image is 256x256, each cell is 16x16.
    // We can use CSS grid or absolute positioning.
    // Percentage based is safer for scaling. 100% / 16 = 6.25%
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push(
          <Box
            key={`${r}-${c}`}
            position="absolute"
            left={`${(c / cols) * 100}%`}
            top={`${(r / rows) * 100}%`}
            width={`${100 / cols}%`}
            height={`${100 / rows}%`}
            border="1px solid rgba(0, 150, 255, 0.1)"
            _hover={{
              backgroundColor: 'rgba(0, 150, 255, 0.2)',
              cursor: 'pointer'
            }}
            onClick={(e) => handleGridClick(e, r, c)}
            title={`Row: ${r}, Col: ${c}`}
          />
        );
      }
    }
    return cells;
  };

  return (
    <Flex h="full" overflow="hidden">
      {/* Canvas Area */}
      <Box
        ref={containerRef}
        flex={1}
        bg="gray.100"
        _dark={{ bg: 'gray.900' }}
        position="relative"
        overflow="hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform={`translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`}
          transformOrigin="center"
          transition="transform 0.1s ease-out"
        >
          {/* Image Container with Checkboard */}
          <Box
             position="relative"
             bg="white" 
             _dark={{ bg: 'gray.800' }}
             backgroundImage="linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
             backgroundSize="20px 20px"
             backgroundPosition="0 0, 0 10px, 10px -10px, -10px 0px"
             boxShadow="lg"
             width={imageSize.width ? `${imageSize.width}px` : 'auto'}
             height={imageSize.height ? `${imageSize.height}px` : 'auto'}
          >
             <img
               src={fileUrl}
               alt={filename}
               style={{ 
                   imageRendering: 'pixelated', // Crucial for pixel art/sprites
                   width: '100%',
                   height: '100%',
                   display: 'block',
                   pointerEvents: 'none' // Let clicks pass through to grid
               }}
               draggable={false}
             />
             
             {/* Overlay Grid */}
             <Box position="absolute" top={0} left={0} right={0} bottom={0}>
                {renderGrid()}
             </Box>
          </Box>
        </Box>
        
        {/* Info Overlay */}
        <Box position="absolute" bottom={4} left={4} bg="blackAlpha.700" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
            {Math.round(scale * 100)}% | {imageSize.width}x{imageSize.height}
        </Box>
      </Box>

      {/* Right Toolbar */}
      <VStack
        w="50px"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderLeftWidth="1px"
        spacing={2}
        py={4}
        zIndex={10}
      >
         <Tooltip label={t('editor.mode.edit', 'Edit Mode')} placement="left">
            <IconButton
              aria-label="Edit"
              icon={<FaPen />}
              variant={mode === EditorMode.EDIT ? 'solid' : 'ghost'}
              colorScheme={mode === EditorMode.EDIT ? 'blue' : 'gray'}
              onClick={() => setMode(EditorMode.EDIT)}
              isDisabled={true} // Not implemented yet
            />
         </Tooltip>
         
         <Tooltip label={t('editor.mode.codepoint', 'Code Point Mode')} placement="left">
            <IconButton
              aria-label="Code Point"
              icon={<FaCode />}
              variant={mode === EditorMode.CODE_POINT ? 'solid' : 'ghost'}
              colorScheme={mode === EditorMode.CODE_POINT ? 'blue' : 'gray'}
              onClick={() => setMode(EditorMode.CODE_POINT)}
            />
         </Tooltip>

         <Tooltip label={t('editor.mode.copy', 'Copy Mode')} placement="left">
            <IconButton
              aria-label="Copy"
              icon={<FaCopy />}
              variant={mode === EditorMode.COPY ? 'solid' : 'ghost'}
              colorScheme={mode === EditorMode.COPY ? 'blue' : 'gray'}
              onClick={() => setMode(EditorMode.COPY)}
              isDisabled={true} // Not implemented yet
            />
         </Tooltip>
         
         <Box h="1px" w="60%" bg="gray.200" my={2} />
         
         <IconButton
            aria-label="Zoom In"
            icon={<FaSearchPlus />}
            size="sm"
            onClick={() => setScale(s => Math.min(s + 0.5, 10))}
         />
         <IconButton
            aria-label="Zoom Out"
            icon={<FaSearchMinus />}
            size="sm"
            onClick={() => setScale(s => Math.max(s - 0.5, 0.1))}
         />
         <IconButton
            aria-label="Reset Zoom"
            icon={<Box fontSize="xs" fontWeight="bold">1:1</Box>}
            size="sm"
            onClick={() => { setScale(1); setPosition({x:0, y:0}); }}
         />
      </VStack>
    </Flex>
  );
};
