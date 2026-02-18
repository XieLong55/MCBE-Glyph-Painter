import { useState } from 'react';
import { Box, Button, Container, Heading, VStack, useToast, HStack, Text, Card, CardBody, Icon, Grid, Badge, GridItem, Divider } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { parseProjectManifest, saveImportedProject } from '../utils/project';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Manifest } from '../types';
import JSZip from 'jszip';
import { FaFileArchive, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export function ImportProject() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('import.title');

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Reset state
      setError(null);
      setManifest(null);
      setZip(null);

      // Parse zip file and extract manifest
      const result = await parseProjectManifest(file);
      if (!result) {
        throw new Error('Failed to parse project manifest');
      }

      // Store parsed data for verification
      setManifest(result.manifest);
      setZip(result.zip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: t('common.error'),
        description: 'Invalid project file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImport = async () => {
    if (!manifest || !zip) return;

    setIsSubmitting(true);
    try {
      await saveImportedProject(manifest, zip);
      toast({
        title: t('common.success'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/projects');
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="full" px={8} py={8} h="full">
      <Heading mb={8} textAlign="center">{t('import.title')}</Heading>
      
      <VStack spacing={8} align="stretch" w="full">
        <Box 
          borderWidth={2} 
          borderStyle="dashed" 
          borderColor="gray.300" 
          borderRadius="xl" 
          p={10} 
          textAlign="center"
          _hover={{ borderColor: 'blue.500', bg: 'gray.50' }}
          _dark={{ borderColor: 'gray.600', _hover: { bg: 'gray.700' } }}
          position="relative"
          w="full"
        >
          <input
            type="file"
            accept=".zip,.mcpack"
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
          <VStack spacing={4}>
            <Icon as={FaFileArchive} w={10} h={10} color="blue.500" />
            <Text fontSize="lg" fontWeight="medium">
              {t('import.select_file')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supports .zip and .mcpack
            </Text>
          </VStack>
        </Box>

        {error && (
          <Card bg="red.50" _dark={{ bg: 'red.900' }} borderColor="red.200" borderWidth={1}>
            <CardBody>
              <HStack>
                <Icon as={FaTimesCircle} color="red.500" />
                <Text color="red.700" _dark={{ color: 'red.200' }}>{error}</Text>
              </HStack>
            </CardBody>
          </Card>
        )}

        {manifest && (
          <Card variant="outline" borderColor="blue.200" borderWidth={1}>
            <CardBody>
              <VStack align="start" spacing={6}>
                <Heading size="md" color="blue.600">
                  {t('import.verify')}
                </Heading>
                
                <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={8} w="full">
                  <GridItem>
                    <Heading size="sm" mb={4} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.header_info')}</Heading>
                    <Box p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md" height="full" w="full">
                      <Grid templateColumns="100px 1fr" gap={4} fontSize="sm">
                        <Text fontWeight="bold" color="gray.500">{t('create.name')}:</Text>
                        <Text fontWeight="medium">{manifest.header.name}</Text>

                        <Text fontWeight="bold" color="gray.500">{t('create.description')}:</Text>
                        <Text>{manifest.header.description}</Text>

                        <Text fontWeight="bold" color="gray.500">{t('create.version')}:</Text>
                        <Badge colorScheme="purple" alignSelf="start">
                          {manifest.header.version.join('.')}
                        </Badge>

                        <Text fontWeight="bold" color="gray.500">UUID:</Text>
                        <Text fontFamily="monospace" fontSize="xs" wordBreak="break-all">{manifest.header.uuid}</Text>
                      </Grid>
                    </Box>
                  </GridItem>

                  <GridItem>
                    <Heading size="sm" mb={4} color="gray.600" _dark={{ color: 'gray.400' }}>{t('create.module_info')}</Heading>
                    {manifest.modules && manifest.modules.length > 0 ? (
                      <VStack align="stretch" spacing={4}>
                        {manifest.modules.map((module) => (
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
                    as={RouterLink}
                    to="/projects"
                    isDisabled={isSubmitting}
                    size="lg"
                  >
                    {t('create.cancel')}
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleImport}
                    isLoading={isSubmitting}
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
      </VStack>
    </Container>
  );
}
