import { useEffect, useState, useRef } from 'react';
import { 
  Button, Container, Grid, Heading, Text, VStack, Card, CardHeader, CardBody, CardFooter, 
  HStack, Badge, Flex, Icon, IconButton, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StorageService } from '../utils/storage';
import { exportProject } from '../utils/project';
import type { Project } from '../types';
import { FaPlus, FaFileUpload, FaFolder, FaEdit, FaTrash, FaFileExport } from 'react-icons/fa';
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

  // Load projects from local storage on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Fetch all projects from storage service
      const data = await StorageService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
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
    <Container maxW="full" px={8} py={8}>
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
