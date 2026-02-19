import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Flex, VStack, Text, IconButton, useDisclosure, Drawer, DrawerOverlay, 
  DrawerContent, DrawerCloseButton, DrawerBody, useBreakpointValue,
  HStack, Icon, Center, Spinner, useToast
} from '@chakra-ui/react';
import { FaBars, FaFolder, FaTimes, FaImage, FaFileExport, FaPlus } from 'react-icons/fa';
import { StorageService } from '../utils/storage';
import { exportProject } from '../utils/project';
import { CreateFileModal } from '../components/CreateFileModal';
import { GlyphEditor } from '../components/GlyphEditor';
import type { Project } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface SidebarProps {
  files: FileNode[];
  activeFile: string | null;
  onFileClick: (file: FileNode) => void;
  onAddFile: () => void;
  t: TFunction;
  hideHeader?: boolean;
}

const Sidebar = ({ files, activeFile, onFileClick, onAddFile, t, hideHeader }: SidebarProps) => (
  <VStack align="stretch" h="full" bg="gray.50" _dark={{ bg: 'gray.900' }} borderRightWidth="1px">
    {!hideHeader && (
      <Flex p={4} borderBottomWidth="1px" justify="space-between" align="center">
        <Text fontWeight="bold" fontSize="sm" textTransform="uppercase" color="gray.500">
          {t('editor.explorer')}
        </Text>
        <IconButton
          aria-label="Add file"
          icon={<Icon as={FaPlus} />}
          size="xs"
          variant="ghost"
          onClick={onAddFile}
          title={t('common.addFile', 'Add File')}
        />
      </Flex>
    )}
    <VStack align="stretch" spacing={0} overflowY="auto" flex={1}>
      {files.map(file => (
        <HStack
          key={file.path}
          px={4}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
          bg={activeFile === file.path ? 'blue.50' : 'transparent'}
          _dark={{ bg: activeFile === file.path ? 'blue.900' : 'transparent' }}
          onClick={() => onFileClick(file)}
        >
          <Icon as={FaImage} color="blue.500" />
          <Text fontSize="sm" noOfLines={1}>{file.name}</Text>
        </HStack>
      ))}
      {files.length === 0 && (
        <Text p={4} fontSize="sm" color="gray.500" textAlign="center">
          No font images found
        </Text>
      )}
    </VStack>
  </VStack>
);

export function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Sidebar state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useDocumentTitle(project ? project.name : 'Editor');

  useEffect(() => {
    if (id) {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      const projectData = await StorageService.getProject(projectId);
      if (!projectData) throw new Error('Project not found');
      setProject(projectData);

      // Load files
      const allFiles = await StorageService.getAllFiles(projectId);
      const fileNodes: FileNode[] = [];
      
      // Filter for .png files in font/ directory
      Object.keys(allFiles).forEach(path => {
        if (path.startsWith('font/') && path.endsWith('.png')) {
          fileNodes.push({
            name: path.split('/').pop() || path,
            path: path,
            type: 'file'
          });
        }
      });
      
      setFiles(fileNodes);
    } catch (error) {
      console.error('Failed to load project', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async (filename: string, resolution: number) => {
    if (!project) return;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        
        // Convert to blob
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        
        if (!blob) throw new Error('Failed to create image blob');
        
        const path = `font/${filename}`;
        
        // Save file
        await StorageService.saveFile(project.uuid, path, blob);
        
        // Refresh
        await loadProjectData(project.uuid);
        
        toast({
            title: t('common.success'),
            description: `Created ${filename}`,
            status: 'success',
        });
        
    } catch (error) {
        console.error('Failed to create file:', error);
        toast({
            title: t('common.error'),
            description: 'Failed to create file',
            status: 'error',
        });
    }
  };

  const handleFileClick = async (file: FileNode) => {
    if (!openFiles.includes(file.path)) {
      setOpenFiles([...openFiles, file.path]);
      
      // Load content if not already loaded
      if (!fileContents[file.path] && id) {
        try {
          const content = await StorageService.getFile(id, file.path);
          console.log(`Loading file ${file.path}:`, content); // Debug log
          
          if (content instanceof Blob) {
            console.log(`File ${file.path} is a Blob of size ${content.size} and type ${content.type}`);
            const url = URL.createObjectURL(content);
            console.log(`Created URL for ${file.path}: ${url}`);
            setFileContents(prev => ({ ...prev, [file.path]: url }));
          } else if (typeof content === 'string') {
             console.log(`File ${file.path} is a string (unexpected for image)`);
             // Try to convert string to blob if it looks like base64 or something? 
             // But StorageService should return Blob for images if we saved them as Blobs.
             // If it is a string, it might be corrupted data.
             toast({
                title: t('common.error'),
                description: `Failed to load image: ${file.name} (Data format error)`,
                status: 'error',
            });
          } else {
            console.error('File content is not a Blob:', file.path, typeof content);
            toast({
                title: t('common.error'),
                description: `Failed to load image: ${file.name} (Invalid format)`,
                status: 'error',
            });
          }
        } catch (error) {
            console.error('Error loading file:', file.path, error);
            toast({
                title: t('common.error'),
                description: `Failed to load image: ${file.name}`,
                status: 'error',
            });
        }
      }
    }
    setActiveFile(file.path);
    if (isMobile) onClose();
  };

  const closeFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f !== path);
    setOpenFiles(newOpenFiles);
    
    if (activeFile === path) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const closeAllFiles = () => {
    setOpenFiles([]);
    setActiveFile(null);
  };

  const handleExport = async () => {
    if (!project) return;
    try {
        await exportProject(project.uuid);
        toast({
            title: t('common.success'),
            status: 'success',
            duration: 3000,
        });
    } catch (error) {
        console.error(error);
        toast({
            title: t('common.error'),
            status: 'error',
            duration: 3000,
        });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Flex h="calc(100vh - 64px)" overflow="hidden">
      {/* Mobile Drawer Sidebar */}
      {isMobile ? (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            {/* 
                Mobile Drawer Header:
                Contains the "Explorer" title and "Add File" button.
                DrawerCloseButton is automatically positioned top-right.
                We add padding-right to the header to avoid overlap with the close button.
            */}
            <DrawerCloseButton zIndex={10} />
            <DrawerBody p={0}>
               <Flex 
                 p={4} 
                 borderBottomWidth="1px" 
                 justify="space-between" 
                 align="center"
                 pr={12} // Add right padding to clear the close button
               >
                  <Text fontWeight="bold" fontSize="sm" textTransform="uppercase" color="gray.500">
                    {t('editor.explorer')}
                  </Text>
                  <IconButton
                    aria-label="Add file"
                    icon={<Icon as={FaPlus} />}
                    size="xs"
                    variant="ghost"
                    onClick={onCreateModalOpen}
                    title={t('common.addFile', 'Add File')}
                  />
               </Flex>
              <Sidebar files={files} activeFile={activeFile} onFileClick={handleFileClick} onAddFile={onCreateModalOpen} t={t} hideHeader={true} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop Sidebar */
        <Box 
          w={isSidebarOpen ? "250px" : "0"} 
          transition="width 0.2s" 
          overflow="hidden"
          display={{ base: 'none', md: 'block' }}
        >
          <Sidebar files={files} activeFile={activeFile} onFileClick={handleFileClick} onAddFile={onCreateModalOpen} t={t} />
        </Box>
      )}

      {/* Main Editor Area */}
      <Flex flex={1} direction="column" minW="0">
        {/* Tab Bar */}
        <Flex borderBottomWidth="1px" bg="gray.50" _dark={{ bg: 'gray.800' }} overflowX="auto">
          {isMobile && (
            <IconButton
              aria-label="Menu"
              icon={<Icon as={FaBars} />}
              variant="ghost"
              onClick={onOpen}
              borderRadius={0}
            />
          )}
          {!isMobile && (
            <IconButton
              aria-label="Toggle Sidebar"
              icon={<Icon as={isSidebarOpen ? FaBars : FaFolder} />}
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              borderRadius={0}
              borderRightWidth="1px"
            />
          )}
          
          <HStack spacing={0} flex={1} overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
            {openFiles.map(path => (
              <HStack
                key={path}
                px={4}
                py={2}
                borderRightWidth="1px"
                cursor="pointer"
                bg={activeFile === path ? 'white' : 'transparent'}
                _dark={{ bg: activeFile === path ? 'gray.700' : 'transparent' }}
                onClick={() => setActiveFile(path)}
                minW="150px"
                justify="space-between"
                role="group"
              >
                <HStack spacing={2}>
                  <Icon as={FaImage} size="xs" color="blue.500" />
                  <Text fontSize="sm" noOfLines={1}>
                    {path.split('/').pop()}
                  </Text>
                </HStack>
                <Icon 
                  as={FaTimes} 
                  size="xs" 
                  opacity={0} 
                  _groupHover={{ opacity: 1 }} 
                  onClick={(e) => closeFile(e, path)}
                  _hover={{ color: 'red.500' }}
                />
              </HStack>
            ))}
          </HStack>

          <HStack spacing={0} borderLeftWidth="1px">
            {openFiles.length > 0 && (
              <IconButton
                aria-label="Close All"
                icon={<Icon as={FaTimes} />}
                variant="ghost"
                onClick={closeAllFiles}
                title="Close All"
                borderRadius={0}
              />
            )}
             <IconButton
                aria-label={t('common.export')}
                icon={<Icon as={FaFileExport} />}
                variant="ghost"
                onClick={handleExport}
                title={t('common.export')}
                borderRadius={0}
                colorScheme="purple"
              />
          </HStack>
        </Flex>

        {/* Editor Content */}
        <Box flex={1} bg="gray.100" _dark={{ bg: 'gray.900' }} overflow="hidden" p={0}>
          {activeFile ? (
            <GlyphEditor 
              fileUrl={fileContents[activeFile]} 
              filename={activeFile.split('/').pop() || activeFile} 
              onSave={async (blob) => {
                if (!project || !activeFile) return;
                try {
                  await StorageService.saveFile(project.uuid, activeFile, blob);
                  // Update URL to force refresh
                  const newUrl = URL.createObjectURL(blob);
                  setFileContents(prev => {
                     // Revoke old URL to prevent memory leaks
                     if (prev[activeFile]) URL.revokeObjectURL(prev[activeFile]);
                     return { ...prev, [activeFile]: newUrl };
                  });
                  toast({
                    title: t('common.success'),
                    description: t('common.saved', 'Saved'),
                    status: 'success',
                    duration: 2000,
                  });
                } catch (e) {
                  console.error('Failed to save file', e);
                  toast({
                    title: t('common.error'),
                    description: 'Failed to save file',
                    status: 'error',
                  });
                }
              }}
            />
          ) : (
            <Center h="full" color="gray.400" flexDirection="column">
              <Icon as={FaImage} w={16} h={16} mb={4} opacity={0.2} />
              <Text>Select a file to view</Text>
            </Center>
          )}
        </Box>
      </Flex>
      <CreateFileModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        existingFiles={files.map(f => f.name)}
        onConfirm={handleCreateFile}
      />
    </Flex>
  );
}
