import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Flex, VStack, HStack, Heading, Text, Button, 
  IconButton, Tabs, TabList, TabPanels, Tab, TabPanel,
  useToast, Spinner, Badge, Divider, Icon
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaSave, FaCube, FaFont, FaFileExport, FaCog, FaImages } from 'react-icons/fa';
import { StorageService } from '../utils/storage';
import type { Project } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Set page title
  useDocumentTitle(project ? project.name : 'common.loading');

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        const data = await StorageService.getProject(id);
        if (!data) {
          toast({
            title: t('common.error'),
            description: t('projects.not_found'),
            status: 'error',
            duration: 3000,
          });
          navigate('/projects');
          return;
        }
        setProject(data);
      } catch (error) {
        console.error(error);
        toast({
            title: t('common.error'),
            status: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, navigate, t, toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (!project) return null;

  return (
    <Flex direction="column" h="calc(100vh - 100px)" bg="white" _dark={{ bg: 'gray.800', borderColor: 'gray.700' }} borderRadius="lg" overflow="hidden" shadow="sm" border="1px" borderColor="gray.200">
        {/* Header Section */}
        <Box borderBottomWidth="1px" px={6} py={4} bg="gray.50" _dark={{ bg: 'gray.900' }}>
            <Flex align="center" justify="space-between">
                <HStack spacing={4}>
                    <IconButton 
                        aria-label={t('common.back')}
                        icon={<FaArrowLeft />} 
                        variant="ghost" 
                        onClick={() => navigate('/projects')}
                        size="sm"
                    />
                    <VStack align="start" spacing={0}>
                        <Heading size="md">{project.name}</Heading>
                        <HStack spacing={2}>
                            <Badge colorScheme="purple" variant="subtle">v{project.version.join('.')}</Badge>
                            <Text fontSize="xs" color="gray.500" fontFamily="monospace">{project.uuid}</Text>
                        </HStack>
                    </VStack>
                </HStack>
                <HStack spacing={3}>
                    <Button leftIcon={<Icon as={FaSave} />} colorScheme="blue" size="sm">
                        {t('common.save')}
                    </Button>
                     <Button leftIcon={<Icon as={FaFileExport} />} variant="outline" size="sm">
                        {t('common.export')}
                    </Button>
                </HStack>
            </Flex>
        </Box>

        {/* Main Content with Sidebar */}
        <Flex flex={1} overflow="hidden">
            <Tabs orientation="vertical" variant="line" w="full" isLazy display="flex">
                <TabList w="240px" borderRightWidth="1px" bg="gray.50" _dark={{ bg: 'gray.900' }} py={4}>
                    <Tab _selected={{ color: 'blue.500', bg: 'white', _dark: { bg: 'gray.800' }, borderRightColor: 'transparent', fontWeight: 'bold' }} justifyContent="flex-start" px={6} py={3} mb={1}>
                        <HStack spacing={3}>
                            <Icon as={FaCube} />
                            <Text>{t('project.overview')}</Text>
                        </HStack>
                    </Tab>
                    <Tab _selected={{ color: 'blue.500', bg: 'white', _dark: { bg: 'gray.800' }, borderRightColor: 'transparent', fontWeight: 'bold' }} justifyContent="flex-start" px={6} py={3} mb={1}>
                        <HStack spacing={3}>
                            <Icon as={FaFont} />
                            <Text>{t('project.glyphs')}</Text>
                        </HStack>
                    </Tab>
                    <Tab _selected={{ color: 'blue.500', bg: 'white', _dark: { bg: 'gray.800' }, borderRightColor: 'transparent', fontWeight: 'bold' }} justifyContent="flex-start" px={6} py={3} mb={1}>
                        <HStack spacing={3}>
                            <Icon as={FaImages} />
                            <Text>{t('project.textures')}</Text>
                        </HStack>
                    </Tab>
                    <Box flex={1} />
                    <Divider my={2} />
                    <Tab _selected={{ color: 'blue.500', bg: 'white', _dark: { bg: 'gray.800' }, borderRightColor: 'transparent', fontWeight: 'bold' }} justifyContent="flex-start" px={6} py={3}>
                        <HStack spacing={3}>
                            <Icon as={FaCog} />
                            <Text>{t('project.settings')}</Text>
                        </HStack>
                    </Tab>
                </TabList>

                <TabPanels flex={1} bg="white" _dark={{ bg: 'gray.800' }} h="full" overflowY="auto">
                    {/* Overview Panel */}
                    <TabPanel p={8}>
                        <VStack align="stretch" spacing={6} maxW="3xl">
                            <Heading size="md" borderBottomWidth="1px" pb={2}>{t('project.overview')}</Heading>
                            
                            <Box>
                                <Text fontWeight="bold" mb={2} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.description')}</Text>
                                <Text p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">{project.description}</Text>
                            </Box>

                            <Box>
                                <Text fontWeight="bold" mb={2} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.module_info')}</Text>
                                <Text p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">
                                    {project.modules_description || t('import.no_modules')}
                                </Text>
                            </Box>
                        </VStack>
                    </TabPanel>

                    {/* Glyphs Editor Panel */}
                    <TabPanel p={0} h="full">
                        <Flex justify="center" align="center" h="full" direction="column" color="gray.400">
                            <Icon as={FaFont} w={16} h={16} mb={4} opacity={0.2} />
                            <Text fontSize="lg">Glyph Editor Placeholder</Text>
                            <Text fontSize="sm">Select a glyph to start editing</Text>
                        </Flex>
                    </TabPanel>

                    {/* Textures Panel */}
                    <TabPanel p={0} h="full">
                        <Flex justify="center" align="center" h="full" direction="column" color="gray.400">
                             <Icon as={FaImages} w={16} h={16} mb={4} opacity={0.2} />
                             <Text fontSize="lg">Texture Manager Placeholder</Text>
                        </Flex>
                    </TabPanel>

                    {/* Settings Panel */}
                    <TabPanel p={8}>
                        <Heading size="md" mb={6}>{t('project.settings')}</Heading>
                        <Text color="gray.500">Project settings and configuration options will appear here.</Text>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Flex>
    </Flex>
  );
}
