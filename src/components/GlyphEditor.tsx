import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FaPen, FaCode, FaCopy, FaSearchPlus, 
  FaSearchMinus,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { SliceEditor } from './SliceEditor';

interface GlyphEditorProps {
  fileUrl: string;
  filename: string;
  onSave?: (blob: Blob) => Promise<void>;
}

const EditorMode = {
  EDIT: 'edit',
  CODE_POINT: 'code_point',
  COPY: 'copy'
} as const;

type EditorMode = typeof EditorMode[keyof typeof EditorMode];

export const GlyphEditor: React.FC<GlyphEditorProps> = ({ fileUrl, filename, onSave }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<EditorMode>(() => {
    const savedMode = localStorage.getItem('glyphEditorMode');
    return (savedMode as EditorMode) || EditorMode.CODE_POINT;
  });

  useEffect(() => {
    localStorage.setItem('glyphEditorMode', mode);
  }, [mode]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  
  // Slice Editor State
  const [editingSlice, setEditingSlice] = useState<{ r: number, c: number, data: ImageData } | null>(null);

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
        // Pan or Zoom based on preference. User requested Zoom.
        e.preventDefault();
        const zoomStep = 0.05; 
        const newScale = Math.min(Math.max(0.1, scale + (e.deltaY > 0 ? -zoomStep : zoomStep)), 10);
        setScale(newScale);
    }
  };
  
  const handleScrollX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const range = imageSize.width * scale; 
    const newX = ((val - 50) / 50) * range;
    setPosition(prev => ({ ...prev, x: -newX }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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

  const handleGridClick = async (e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation(); // Prevent drag start
    
    if (mode === EditorMode.EDIT) {
        // Extract Slice Data
        const img = new Image();
        img.src = fileUrl;
        
        // Ensure image is loaded before drawing
        if (!img.complete) {
            await new Promise((resolve) => { img.onload = resolve; });
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = imageSize.width;
        canvas.height = imageSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        
        // Calculate cell size
        const cellWidth = imageSize.width / 16;
        const cellHeight = imageSize.height / 16;

        // Ensure we don't go out of bounds (though grid should prevent this)
        const sliceData = ctx.getImageData(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        
        setEditingSlice({
            r: row,
            c: col,
            data: sliceData
        });
        
    } else if (mode === EditorMode.CODE_POINT) {
      const match = filename.match(/glyph_([0-9A-Fa-f]+)/);
      if (match) {
        const prefixHex = match[1];
        const base = parseInt(prefixHex, 16);
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
  
  const handleSliceSave = async (newData: ImageData) => {
      if (!editingSlice || !onSave) return;
      
      const { r, c } = editingSlice;
      
      const canvas = document.createElement('canvas');
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Load current image
      const img = new Image();
      img.src = fileUrl;
      await img.decode();
      ctx.drawImage(img, 0, 0);
      
      // Update slice
      const cellWidth = imageSize.width / 16;
      const cellHeight = imageSize.height / 16;
      ctx.putImageData(newData, c * cellWidth, r * cellHeight);
      
      // Save
      canvas.toBlob(async (blob) => {
          if (blob) {
              await onSave(blob);
              setEditingSlice(null);
          }
      }, 'image/png');
  };

  // Render Grid
  const renderGrid = () => {
    const cells = [];
    const rows = 16;
    const cols = 16;
    
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
  
  if (editingSlice) {
      return (
          <SliceEditor 
            initialData={editingSlice.data}
            onSave={handleSliceSave}
            onCancel={() => setEditingSlice(null)}
          />
      );
  }

  return (
    <Flex h="full" overflow="hidden" direction="column">
      <Flex flex={1} overflow="hidden">
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
          style={{ touchAction: 'none' }} // Important for preventing browser zoom/scroll on mobile
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
        <Flex
          direction="column"
          w={isToolbarCollapsed ? "0" : "50px"}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderLeftWidth={isToolbarCollapsed ? "0" : "1px"}
          transition="width 0.2s"
          position="relative"
          zIndex={10}
        >
          {/* Toggle Button */}
          <IconButton
            aria-label="Toggle Toolbar"
            icon={isToolbarCollapsed ? <FaChevronLeft /> : <FaChevronRight />}
            size="xs"
            position="absolute"
            left="-20px"
            top="50%"
            transform="translateY(-50%)"
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            zIndex={11}
            borderRightRadius={0}
            borderLeftRadius="md"
            opacity={0.8}
            _hover={{ opacity: 1 }}
          />
          
          <VStack
             spacing={2}
             py={4}
             display={isToolbarCollapsed ? "none" : "flex"}
             overflow="hidden"
          >
           <Tooltip label={t('editor.mode.edit', 'Edit Mode')} placement="left">
              <IconButton
                aria-label="Edit"
                icon={<FaPen />}
                variant={mode === EditorMode.EDIT ? 'solid' : 'ghost'}
                colorScheme={mode === EditorMode.EDIT ? 'blue' : 'gray'}
                onClick={() => setMode(EditorMode.EDIT)}
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
              onClick={() => setScale(s => Math.min(s + 0.1, 10))} // Reduced step
           />
           <IconButton
              aria-label="Zoom Out"
              icon={<FaSearchMinus />}
              size="sm"
              onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} // Reduced step
           />
           <IconButton
              aria-label="Reset Zoom"
              icon={<Box fontSize="xs" fontWeight="bold">1:1</Box>}
              size="sm"
              onClick={() => { setScale(1); setPosition({x:0, y:0}); }}
           />
          </VStack>
        </Flex>
      </Flex>
      
      {/* Bottom Scrollbar for Mobile Panning */}
      <Box p={2} bg="gray.50" _dark={{ bg: 'gray.900' }} borderTopWidth="1px">
         <input
           type="range"
           min="0"
           max="100"
           defaultValue="50"
           onChange={handleScrollX}
           style={{ width: '100%', cursor: 'ew-resize' }}
         />
      </Box>
    </Flex>
  );
};
