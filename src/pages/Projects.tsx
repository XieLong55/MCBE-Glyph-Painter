import { useEffect, useState, useRef } from 'react';
import { 
  Button, Container, Grid, Heading, Text, VStack, Card, CardHeader, CardBody, CardFooter, 
  HStack, Badge, Flex, Icon, IconButton, Tooltip, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  useToast
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StorageService } from '../utils/storage';
import type { Project } from '../types';
import { FaPlus, FaFileUpload, FaFolder, FaEdit, FaTrash } from 'react-icons/fa';

export function Projects() {
  const { t } = useTranslation();
  useDocumentTitle('projects.title');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  // Delete confirmation dialog
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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

  const handleCardClick = (uuid: string) => {
    navigate(`/projects/${uuid}`);
  };

  const handleEdit = (e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    navigate(`/projects/${uuid}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    setProjectToDelete(uuid);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await StorageService.deleteProject(projectToDelete);
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
      });
    } finally {
      onClose();
      setProjectToDelete(null);
    }
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
              onClick={() => handleCardClick(project.uuid)}
              transition="all 0.2s"
            >
              <CardHeader pb={2}>
                <Heading size="md" noOfLines={1}>{project.name}</Heading>
                <Badge mt={2} colorScheme="purple">v{project.version.join('.')}</Badge>
              </CardHeader>
              <CardBody py={2}>
                <VStack align="start" gap={2}>
                  {project.header_description && (
                    <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }} noOfLines={2}>
                      {project.header_description}
                    </Text>
                  )}
                  {project.modules_description && project.modules_description !== project.header_description && (
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} noOfLines={2}>
                      {project.modules_description}
                    </Text>
                  )}
                  {!project.header_description && !project.modules_description && (
                    <Text noOfLines={3} color="gray.500">
                      {project.description}
                    </Text>
                  )}
                </VStack>
              </CardBody>
              <CardFooter pt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color="gray.400">
                  {new Date(project.updated_at).toLocaleDateString()}
                </Text>
                <HStack spacing={1}>
                  <Tooltip label={t('project.edit')}>
                    <IconButton
                      aria-label={t('project.edit')}
                      icon={<Icon as={FaEdit} />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEdit(e, project.uuid)}
                    />
                  </Tooltip>
                  <Tooltip label={t('project.delete')}>
                    <IconButton
                      aria-label={t('project.delete')}
                      icon={<Icon as={FaTrash} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => handleDeleteClick(e, project.uuid)}
                    />
                  </Tooltip>
                </HStack>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef as React.RefObject<HTMLElement>}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('project.delete_confirm_title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('project.delete_confirm_body')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                {t('project.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
