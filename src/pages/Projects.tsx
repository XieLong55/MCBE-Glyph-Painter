import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Button, Container, Grid, Heading, Text, VStack, Card, CardHeader, CardBody, CardFooter,
  HStack, Badge, Flex, Icon, IconButton, useToast, Box, GridItem, Divider,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StorageService } from '../utils/storage';
import { exportProject, parseProjectManifest, saveImportedProject } from '../utils/project';
import type { Project, Manifest } from '../types';
import type JSZip from 'jszip';
import { FaPlus, FaFileUpload, FaFolder, FaEdit, FaTrash, FaFileExport, FaCheckCircle, FaTimesCircle, FaFileArchive } from 'react-icons/fa';
import { EditProjectModal } from '../components/EditProjectModal';
import { MinecraftText } from '../components/MinecraftText';

export function Projects() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('projects.title');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Drag-and-drop import state
  const [isDragging, setIsDragging] = useState(false);
  const [importManifest, setImportManifest] = useState<Manifest | null>(null);
  const [importZip, setImportZip] = useState<JSZip | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const dragCounter = useRef(0);

  // Load projects from local storage on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await StorageService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Drag-and-drop handlers ---
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'zip' && ext !== 'mcpack') {
      setImportError('Only .zip and .mcpack files are supported');
      toast({
        title: t('common.error'),
        description: 'Only .zip and .mcpack files are supported',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setImportError(null);
      setImportManifest(null);
      setImportZip(null);

      const result = await parseProjectManifest(file);
      if (!result) {
        throw new Error('Failed to parse project manifest');
      }

      setImportManifest(result.manifest);
      setImportZip(result.zip);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setImportError(msg);
      toast({
        title: t('common.error'),
        description: msg,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [t, toast]);

  const handleImportConfirm = async () => {
    if (!importManifest || !importZip) return;

    setIsImporting(true);
    try {
      await saveImportedProject(importManifest, importZip);
      toast({
        title: t('common.success'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setImportManifest(null);
      setImportZip(null);
      setImportError(null);
      loadProjects();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCancel = () => {
    setImportManifest(null);
    setImportZip(null);
    setImportError(null);
  };

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
  };

  const handleExport = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
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

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await StorageService.deleteProject(projectToDelete.uuid);
      toast({
        title: t('common.success'),
        status: 'success',
        duration: 3000,
      });
      loadProjects();
    } catch (error) {
      console.error(error);
      toast({
        title: t('common.error'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeleteOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleCardClick = (project: Project) => {
    navigate(`/projects/${project.uuid}`);
  };

  return (
    <Container
      maxW="full"
      px={8}
      py={8}
      position="relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      minH="80vh"
    >
      {/* Drag overlay */}
      {isDragging && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blue.500"
          opacity={0.15}
          zIndex={9999}
          pointerEvents="none"
          transition="opacity 0.2s"
        />
      )}
      {isDragging && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={10000}
          pointerEvents="none"
          align="center"
          justify="center"
        >
          <VStack
            spacing={4}
            bg="white"
            _dark={{ bg: 'gray.700' }}
            px={12}
            py={10}
            borderRadius="2xl"
            shadow="2xl"
            borderWidth={3}
            borderColor="blue.400"
            borderStyle="dashed"
          >
            <Icon as={FaFileArchive} boxSize={12} color="blue.500" />
            <Text fontSize="xl" fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
              {t('projects.drop_hint')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              .zip / .mcpack
            </Text>
          </VStack>
        </Flex>
      )}

      <Flex mb={8} justify="space-between" align="center">
        <Heading size="lg">{t('projects.title')}</Heading>
        <HStack spacing={4}>
          <Button
            as={RouterLink}
            to="/projects/create"
            leftIcon={<Icon as={FaPlus} />}
            colorScheme="green"
          >
            {t('projects.create')}
          </Button>
          <Button
            as={RouterLink}
            to="/projects/import"
            leftIcon={<Icon as={FaFileUpload} />}
            colorScheme="blue"
          >
            {t('projects.import')}
          </Button>
        </HStack>
      </Flex>

      {/* Import error display */}
      {importError && !importManifest && (
        <Card bg="red.50" _dark={{ bg: 'red.900' }} borderColor="red.200" borderWidth={1} mb={6}>
          <CardBody>
            <HStack>
              <Icon as={FaTimesCircle} color="red.500" />
              <Text color="red.700" _dark={{ color: 'red.200' }}>{importError}</Text>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Inline import verification card */}
      {importManifest && (
        <Card variant="outline" borderColor="blue.300" borderWidth={2} mb={6} shadow="md">
          <CardBody>
            <VStack align="start" spacing={6}>
              <HStack>
                <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                <Heading size="md" color="blue.600" _dark={{ color: 'blue.300' }}>
                  {t('import.verify')}
                </Heading>
              </HStack>

              <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={8} w="full">
                <GridItem>
                  <Heading size="sm" mb={4} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.header_info')}</Heading>
                  <Box p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md" height="full" w="full">
                    <Grid templateColumns="100px 1fr" gap={4} fontSize="sm">
                      <Text fontWeight="bold" color="gray.500">{t('create.name')}:</Text>
                      <Text fontWeight="medium">{importManifest.header.name}</Text>

                      <Text fontWeight="bold" color="gray.500">{t('create.description')}:</Text>
                      <Text>{importManifest.header.description}</Text>

                      <Text fontWeight="bold" color="gray.500">{t('create.version')}:</Text>
                      <Badge colorScheme="purple" alignSelf="start">
                        {importManifest.header.version.join('.')}
                      </Badge>

                      <Text fontWeight="bold" color="gray.500">UUID:</Text>
                      <Text fontFamily="monospace" fontSize="xs" wordBreak="break-all">{importManifest.header.uuid}</Text>
                    </Grid>
                  </Box>
                </GridItem>

                <GridItem>
                  <Heading size="sm" mb={4} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.module_info')}</Heading>
                  {importManifest.modules && importManifest.modules.length > 0 ? (
                    <VStack align="stretch" spacing={4}>
                      {importManifest.modules.map((module) => (
                        <Box key={module.uuid} p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">
                          <Grid templateColumns="80px 1fr" gap={2} fontSize="sm">
                            <Text fontWeight="bold" color="gray.500">{t('import.type')}:</Text>
                            <Badge colorScheme="orange">{module.type}</Badge>

                            <Text fontWeight="bold" color="gray.500">{t('import.desc')}:</Text>
                            <Text>{module.description}</Text>

                            <Text fontWeight="bold" color="gray.500">{t('import.ver')}:</Text>
                            <Text>{module.version.join('.')}</Text>

                            <Text fontWeight="bold" color="gray.500">UUID:</Text>
                            <Text fontFamily="monospace" fontSize="xs" wordBreak="break-all">{module.uuid}</Text>
                          </Grid>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500" fontStyle="italic">{t('import.no_modules')}</Text>
                  )}
                </GridItem>
              </Grid>

              <Divider />

              <HStack width="full" pt={2} spacing={4} justify="flex-end">
                <Button
                  variant="ghost"
                  onClick={handleImportCancel}
                  isDisabled={isImporting}
                  size="lg"
                >
                  {t('create.cancel')}
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleImportConfirm}
                  isLoading={isImporting}
                  leftIcon={<Icon as={FaCheckCircle} />}
                  size="lg"
                  px={8}
                >
                  {t('import.submit')}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {projects.length === 0 && !loading ? (
        <VStack spacing={6} py={20} bg="gray.50" _dark={{ bg: 'gray.800' }} borderRadius="xl">
          <Icon as={FaFolder} boxSize={12} color="gray.400" />
          <Text fontSize="lg" color="gray.500">
            {t('projects.no_projects')}
          </Text>
        </VStack>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {projects.map((project) => (
            <Card
              key={project.uuid}
              variant="outline"
              _hover={{ shadow: 'md', borderColor: 'blue.400' }}
              cursor="pointer"
              onClick={() => handleCardClick(project)}
              transition="all 0.2s"
              h="100%"
              direction="column"
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="start">
                  <Heading size="md" noOfLines={1} title={project.name}>
                    <MinecraftText text={project.name} />
                  </Heading>
                  <Badge colorScheme="purple" flexShrink={0}>v{project.version.join('.')}</Badge>
                </Flex>
              </CardHeader>
              <CardBody py={2} flex="1">
                <VStack align="start" gap={2}>
                  {project.header_description && (
                    <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }} noOfLines={2}>
                      <MinecraftText text={project.header_description} />
                    </Text>
                  )}
                  {project.modules_description && project.modules_description !== project.header_description && (
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} noOfLines={2}>
                      <MinecraftText text={project.modules_description} />
                    </Text>
                  )}
                  {!project.header_description && !project.modules_description && (
                    <Text noOfLines={3} color="gray.500">
                      <MinecraftText text={project.description} />
                    </Text>
                  )}
                </VStack>
              </CardBody>
              <CardFooter pt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color="gray.400">
                  {new Date(project.updated_at).toLocaleDateString()}
                </Text>
                <HStack>
                  <IconButton
                    aria-label={t('common.export')}
                    icon={<FaFileExport />}
                    size="sm"
                    variant="ghost"
                    colorScheme="purple"
                    onClick={(e) => handleExport(e, project)}
                  />
                  <IconButton
                    aria-label={t('common.edit')}
                    icon={<FaEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={(e) => handleEdit(e, project)}
                  />
                  <IconButton
                    aria-label={t('common.delete')}
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => handleDeleteClick(e, project)}
                  />
                </HStack>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSave={loadProjects}
          onDelete={() => {
            setProjectToDelete(editingProject);
            setEditingProject(null);
            setIsDeleteOpen(true);
          }}
        />
      )}

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef as React.RefObject<HTMLElement>}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('common.delete')} {t('projects.project')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('projects.delete_confirm')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                {t('create.cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                {t('common.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
